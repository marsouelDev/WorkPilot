import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { DatabaseService } from '../database/database.service';
import { CryptoService } from '../crypto/crypto.service';

const GITHUB_API_HEADERS = { 'X-GitHub-Api-Version': '2022-11-28' };

interface ProjetAvecCreateur {
  depotGitUrl: string | null;
  createurId: number;
  createur?: { githubToken: string | null } | null;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly crypto: CryptoService,
  ) {}

  extraireOwnerEtRepo(url: string): { owner: string; repo: string } {
    const match = /github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/.exec(url);

    if (!match) {
      throw new BadRequestException('URL GitHub invalide');
    }

    return { owner: match[1], repo: match[2] };
  }

  private dechiffrer(token: string | null): string | null {
    if (!token) return null;

    try {
      return this.crypto.dechiffrer(token);
    } catch {
      return null;
    }
  }

  async obtenirOctokit(projet: ProjetAvecCreateur, userId: number) {
    if (!projet.depotGitUrl) {
      throw new BadRequestException("Ce projet n'a pas de dépôt GitHub");
    }

    /* 1. Token de l'utilisateur qui appelle */
    const user = await this.databaseService.utilisateur.findUnique({
      where: { id: userId },
      select: { githubToken: true },
    });

    let token = this.dechiffrer(user?.githubToken ?? null);

    /* 2. Sinon token du créateur */
    if (!token) {
      const createur = await this.databaseService.utilisateur.findUnique({
        where: { id: projet.createurId },
        select: { githubToken: true },
      });

      token = this.dechiffrer(createur?.githubToken ?? null);
    }

    if (!token) {
      throw new BadRequestException('Compte GitHub non connecté');
    }

    return new Octokit({ auth: token, userAgent: 'WorkPilot/1.0' });
  }

  /* Lecture des  fichiers et des branches */

  async chargerFichiers(
    octokit: Octokit,
    owner: string,
    repo: string,
    brancheSouhaitee?: string,
  ) {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const brancheDefaut = repoData.default_branch;

    let branche = brancheDefaut;
    let repriseTravail = false;

    if (brancheSouhaitee) {
      try {
        await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${brancheSouhaitee}`,
        });
        branche = brancheSouhaitee;
        repriseTravail = true;
      } catch {
        /* Branche supprimée par  défaut */
      }
    }

    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branche}`,
    });
    const sha = ref.object.sha;

    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: sha,
    });
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
      recursive: '1',
    });

    const fichiers: { path: string; content: string }[] = [];

    for (const entry of tree.tree) {
      if (entry.type !== 'blob' || !entry.path) continue;
      if ((entry.size ?? 0) > 500_000) continue;

      const { data: blob } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: entry.sha,
      });

      fichiers.push({
        path: entry.path,
        content: Buffer.from(blob.content, 'base64').toString('utf-8'),
      });
    }

    return {
      branche,
      brancheDefaut,
      repriseTravail,
      commit: { sha, message: commit.message },
      fichiers,
    };
  }

  async listerBranches(octokit: Octokit, owner: string, repo: string) {
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data.map((b) => b.name);
  }

  /* Écriture de commit + push et crée la branche si besoin */

  async pousserFichiers(
    octokit: Octokit,
    owner: string,
    repo: string,
    fichiers: { path: string; contenu: string }[],
    brancheChoisie?: string,
  ) {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const branche = brancheChoisie?.trim() || repoData.default_branch;

    /* Récupérer ou créer la branche */
    let baseSha: string;

    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branche}`,
      });
      baseSha = ref.object.sha;
    } catch {
      const { data: defRef } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${repoData.default_branch}`,
      });

      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branche}`,
        sha: defRef.object.sha,
      });

      baseSha = defRef.object.sha;

      this.logger.log(`🌿 Branche "${branche}" créée sur ${owner}/${repo}`);
    }

    const { data: baseCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: baseSha,
    });

    const treeEntries = await Promise.all(
      fichiers.map(async (f) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(f.contenu).toString('base64'),
          encoding: 'base64',
        });

        return {
          path: f.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      }),
    );

    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseCommit.tree.sha,
      tree: treeEntries,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: `🔄 WorkPilot : ${fichiers.length} fichier(s) → ${branche}`,
      tree: newTree.sha,
      parents: [baseSha],
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branche}`,
      sha: newCommit.sha,
    });

    return { branche, commit: newCommit.sha };
  }

  /* PULL REQUESTS */

  async creerPullRequest(
    octokit: Octokit,
    owner: string,
    repo: string,
    opts: { head: string; titre: string; description?: string },
  ) {
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: opts.titre,
      head: opts.head,
      base: repoData.default_branch,
      body: opts.description,
      headers: GITHUB_API_HEADERS,
    });

    return { url: pr.html_url, numero: pr.number };
  }

  async obtenirPullRequest(
    octokit: Octokit,
    owner: string,
    repo: string,
    numero: number,
  ) {
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: numero,
      headers: GITHUB_API_HEADERS,
    });

    return { state: data.state, merged_at: data.merged_at };
  }

  async fusionnerPullRequest(
    octokit: Octokit,
    owner: string,
    repo: string,
    numero: number,
  ) {
    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: numero,
      headers: GITHUB_API_HEADERS,
    });
  }
}
