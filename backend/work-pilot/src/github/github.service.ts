import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { DatabaseService } from '../database/database.service';
import { CryptoService } from '../crypto/crypto.service';

const GITHUB_API_HEADERS = {
  'X-GitHub-Api-Version': '2022-11-28',
  Accept: 'application/vnd.github.v3+json',
};

const TAILLE_MAX_FICHIER = 500_000;
const BATCH_SIZE = 10;

export interface ProjetAvecCreateur {
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

  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) {
      const obj = err as Record<string, unknown>;
      const msg = obj.message;
      if (typeof msg === 'string') return msg;
      if (typeof msg === 'number' || typeof msg === 'boolean')
        return String(msg);
      return 'Erreur inconnue';
    }
    return 'Erreur inconnue';
  }

  extraireOwnerEtRepo(url: string): { owner: string; repo: string } {
    const match = /github\.com[/:]([^/]+)\/([^/]+?)(\.git)?$/.exec(url);

    if (!match) {
      throw new BadRequestException(
        `URL GitHub invalide : ${url}. Format attendu : github.com/owner/repo`,
      );
    }

    return { owner: match[1], repo: match[2] };
  }

  private dechiffrer(token: string | null): string | null {
    if (!token) return null;

    try {
      const decrypted = this.crypto.dechiffrer(token);
      return decrypted.startsWith('Bearer ')
        ? decrypted.substring(7)
        : decrypted;
    } catch {
      return null;
    }
  }

  private masquerToken(token: string | null): string {
    if (!token) return '[aucun]';
    if (token.length < 8) return `[${token.length} car.]`;
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)} (${token.length} car.)`;
  }

  private async avecRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 2000,
    operationName = 'opération',
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        this.logger.warn(
          `${operationName} : ${this.getErrorLabel(error)} — retry dans ${delay}ms (${retries} restants)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.avecRetry(fn, retries - 1, delay * 2, operationName);
      }
      throw this.transformerErreurGitHub(error);
    }
  }

  private isRetryableError(error: any): boolean {
    if ([401, 403, 404].includes(error?.status)) return false;

    if (
      [
        'UND_ERR_CONNECT_TIMEOUT',
        'ETIMEDOUT',
        'ECONNRESET',
        'ENOTFOUND',
      ].includes(error?.code)
    ) {
      return true;
    }

    const msg = error?.message?.toLowerCase() ?? '';
    if (
      msg.includes('timeout') ||
      msg.includes('network') ||
      msg.includes('fetch failed')
    ) {
      return true;
    }

    if ([429, 502, 503, 504].includes(error?.status)) return true;

    return false;
  }

  private transformerErreurGitHub(error: any): Error {
    const status = error?.status;
    const message =
      error?.response?.data?.message ?? error?.message ?? 'Erreur GitHub';

    switch (status) {
      case 401:
        return new UnauthorizedException(
          `Token GitHub invalide ou expiré. Reconnecte-toi à GitHub. (${message})`,
        );
      case 403:
        return new ForbiddenException(
          `Accès refusé au dépôt GitHub. Vérifie les permissions du token. (${message})`,
        );
      case 404:
        return new NotFoundException(
          `Dépôt ou ressource GitHub introuvable. (${message})`,
        );
      case 422:
        return new BadRequestException(
          `Données GitHub invalides. (${message})`,
        );
      default:
        return error;
    }
  }

  private getErrorLabel(error: any): string {
    if (error?.code) return error.code;
    if (error?.status) return `HTTP ${error.status}`;
    return error?.message ?? 'erreur inconnue';
  }

  async obtenirToken(
    projet: ProjetAvecCreateur,
    userId: number,
  ): Promise<{ token: string; source: string; email?: string }> {
    if (!projet.depotGitUrl) {
      throw new BadRequestException("Ce projet n'a pas de dépôt GitHub");
    }

    /*  Utilisateur courant */
    const user = await this.databaseService.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        githubToken: true,
        githubRefreshToken: true,
        githubTokenExpiresAt: true,
      },
    });

    if (user?.githubToken) {
      const token = this.dechiffrer(user.githubToken);
      const refresh = this.dechiffrer(user.githubRefreshToken ?? null);

      if (token) {
        const expireAt = user.githubTokenExpiresAt;
        const expireBientot =
          expireAt && expireAt.getTime() < Date.now() + 60_000;

        if (!expireBientot) {
          const validation = await this.validerToken(token);
          if (validation.valide) {
            this.logger.log(
              `Token GitHub utilisé : utilisateur ${user.email} — ${this.masquerToken(token)}`,
            );
            return { token, source: 'user', email: user.email };
          }
        }

        if (refresh) {
          try {
            this.logger.warn(
              `Token GitHub expiré pour ${user.email} → refresh automatique`,
            );

            const newTokens = await this.refreshGithubToken(refresh);

            await this.databaseService.utilisateur.update({
              where: { id: user.id },
              data: {
                githubToken: this.crypto.chiffrer(newTokens.accessToken),
                githubRefreshToken: newTokens.refreshToken
                  ? this.crypto.chiffrer(newTokens.refreshToken)
                  : undefined,
                githubTokenExpiresAt: newTokens.accessExpiresAt,
                githubRefreshTokenExpiresAt: newTokens.refreshExpiresAt,
              },
            });

            this.logger.log(`Token GitHub rafraîchi pour ${user.email}`);

            return {
              token: newTokens.accessToken,
              source: 'user',
              email: user.email,
            };
          } catch (e) {
            this.logger.error(
              `Refresh GitHub échoué pour ${user.email} : ${this.getErrorMessage(e)}`,
            );
          }
        }
      }
    }

    /* Créateur du projet (fallback) */
    if (projet.createurId && projet.createurId !== userId) {
      const createur = await this.databaseService.utilisateur.findUnique({
        where: { id: projet.createurId },
        select: {
          id: true,
          email: true,
          githubToken: true,
          githubRefreshToken: true,
          githubTokenExpiresAt: true,
        },
      });

      if (createur?.githubToken) {
        const token = this.dechiffrer(createur.githubToken);
        const refresh = this.dechiffrer(createur.githubRefreshToken ?? null);

        if (token) {
          const validation = await this.validerToken(token);
          if (validation.valide) {
            this.logger.log(
              `Token GitHub utilisé : créateur ${createur.email} — ${this.masquerToken(token)}`,
            );
            return { token, source: 'createur', email: createur.email };
          }

          if (refresh) {
            try {
              const newTokens = await this.refreshGithubToken(refresh);

              await this.databaseService.utilisateur.update({
                where: { id: createur.id },
                data: {
                  githubToken: this.crypto.chiffrer(newTokens.accessToken),
                  githubRefreshToken: newTokens.refreshToken
                    ? this.crypto.chiffrer(newTokens.refreshToken)
                    : undefined,
                  githubTokenExpiresAt: newTokens.accessExpiresAt,
                  githubRefreshTokenExpiresAt: newTokens.refreshExpiresAt,
                },
              });

              return {
                token: newTokens.accessToken,
                source: 'createur',
                email: createur.email,
              };
            } catch {
              /* ignore */
            }
          }
        }
      }
    }

    throw new UnauthorizedException(
      'Session GitHub expirée. Veuillez reconnecter votre compte GitHub.',
    );
  }

  async validerToken(token: string): Promise<{
    valide: boolean;
    login?: string;
    scopes?: string;
  }> {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          ...GITHUB_API_HEADERS,
        },
      });

      if (!res.ok) return { valide: false };

      const data = await res.json();
      return {
        valide: true,
        login: data.login,
        scopes: res.headers.get('x-oauth-scopes') ?? undefined,
      };
    } catch {
      return { valide: false };
    }
  }

  private async refreshGithubToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    accessExpiresAt?: Date;
    refreshExpiresAt?: Date;
  }> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(
        data.error_description ?? data.error ?? 'Refresh GitHub échoué',
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessExpiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      refreshExpiresAt: data.refresh_token_expires_in
        ? new Date(Date.now() + data.refresh_token_expires_in * 1000)
        : undefined,
    };
  }

  async obtenirOctokit(
    projet: ProjetAvecCreateur,
    userId: number,
  ): Promise<Octokit> {
    const { token } = await this.obtenirToken(projet, userId);

    return new Octokit({
      auth: token,
      userAgent: 'WorkPilot/1.0',
      request: {
        timeout: 30_000,
        headers: GITHUB_API_HEADERS,
      },
    });
  }

  async chargerFichiers(
    octokit: Octokit,
    owner: string,
    repo: string,
    brancheSouhaitee?: string,
  ) {
    const logPrefix = `[${owner}/${repo}]`;
    this.logger.log(`${logPrefix} Chargement des fichiers...`);

    const { data: repoData } = await this.avecRetry(
      () => octokit.repos.get({ owner, repo, headers: GITHUB_API_HEADERS }),
      3,
      2000,
      `${logPrefix} repos.get`,
    );

    const brancheDefaut = repoData.default_branch;
    let branche = brancheDefaut;
    let repriseTravail = false;

    if (brancheSouhaitee) {
      try {
        await this.avecRetry(
          () =>
            octokit.git.getRef({
              owner,
              repo,
              ref: `heads/${brancheSouhaitee}`,
              headers: GITHUB_API_HEADERS,
            }),
          2,
          2000,
          `${logPrefix} getRef(${brancheSouhaitee})`,
        );

        branche = brancheSouhaitee;
        repriseTravail = true;
        this.logger.log(`${logPrefix} Reprise sur branche "${branche}"`);
      } catch {
        this.logger.warn(
          `${logPrefix} Branche "${brancheSouhaitee}" introuvable → fallback "${brancheDefaut}"`,
        );
      }
    }

    const { data: ref } = await this.avecRetry(
      () =>
        octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branche}`,
          headers: GITHUB_API_HEADERS,
        }),
      3,
      2000,
      `${logPrefix} getRef(${branche})`,
    );
    const sha = ref.object.sha;

    const { data: commit } = await this.avecRetry(
      () =>
        octokit.git.getCommit({
          owner,
          repo,
          commit_sha: sha,
          headers: GITHUB_API_HEADERS,
        }),
      3,
      2000,
      `${logPrefix} getCommit`,
    );

    const { data: tree } = await this.avecRetry(
      () =>
        octokit.git.getTree({
          owner,
          repo,
          tree_sha: sha,
          recursive: '1',
          headers: GITHUB_API_HEADERS,
        }),
      3,
      2000,
      `${logPrefix} getTree`,
    );

    const blobs = tree.tree.filter(
      (entry) =>
        entry.type === 'blob' &&
        entry.path &&
        (entry.size ?? 0) <= TAILLE_MAX_FICHIER,
    );

    const dossiers = tree.tree
      .filter((entry) => entry.type === 'tree' && entry.path)
      .map((entry) => entry.path);

    this.logger.log(
      `${logPrefix} Téléchargement de ${blobs.length} fichier(s) et ${dossiers.length} dossier(s)...`,
    );

    const fichiers: { path: string; content: string }[] = [];
    let echoues = 0;

    for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
      const batch = blobs.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (entry) => {
          const { data: blob } = await this.avecRetry(
            () =>
              octokit.git.getBlob({
                owner,
                repo,
                file_sha: entry.sha,
                headers: GITHUB_API_HEADERS,
              }),
            2,
            1500,
            `${logPrefix} getBlob(${entry.path})`,
          );

          return {
            path: entry.path,
            content: Buffer.from(blob.content, 'base64').toString('utf-8'),
          };
        }),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          fichiers.push(result.value);
        } else {
          echoues++;
          this.logger.warn(
            `${logPrefix} Fichier ignoré : ${this.getErrorMessage(result.reason)}`,
          );
        }
      }

      const traites = Math.min(i + BATCH_SIZE, blobs.length);
      if (blobs.length > BATCH_SIZE && traites % (BATCH_SIZE * 5) === 0) {
        this.logger.log(
          `${logPrefix} Progression : ${traites}/${blobs.length}`,
        );
      }
    }

    if (echoues > 0) {
      this.logger.warn(
        `${logPrefix} ${echoues} fichier(s) non chargé(s) sur ${blobs.length}`,
      );
    }

    this.logger.log(
      `${logPrefix} ✅ Chargement terminé : ${fichiers.length}/${blobs.length} fichiers + ${dossiers.length} dossiers sur ${branche} (commit ${sha.substring(0, 7)})`,
    );

    return {
      branche,
      brancheDefaut,
      repriseTravail,
      commit: { sha, message: commit.message },
      fichiers,
      dossiers,
    };
  }

  async listerBranches(octokit: Octokit, owner: string, repo: string) {
    const { data } = await octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
      headers: GITHUB_API_HEADERS,
    });
    return data.map((b) => b.name);
  }

  async listerBranchesDetaillees(
    octokit: Octokit,
    owner: string,
    repo: string,
  ) {
    const logPrefix = `[${owner}/${repo}]`;
    this.logger.log(`${logPrefix} Récupération de TOUTES les branches...`);

    const { data: repoData } = await this.avecRetry(
      () => octokit.repos.get({ owner, repo, headers: GITHUB_API_HEADERS }),
      3,
      2000,
      `${logPrefix} repos.get`,
    );
    const defaultBranch = repoData.default_branch;

    /* PAGINATION : récupère TOUTES les branches */
    const toutesBranches: {
      name: string;
      protected: boolean;
      sha: string;
    }[] = [];

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data: branchesPage } = await this.avecRetry(
        () =>
          octokit.repos.listBranches({
            owner,
            repo,
            per_page: 100,
            page,
            headers: GITHUB_API_HEADERS,
          }),
        3,
        2000,
        `${logPrefix} listBranches (page ${page})`,
      );

      toutesBranches.push(
        ...branchesPage.map((b) => ({
          name: b.name,
          protected: b.protected,
          sha: b.commit.sha,
        })),
      );

      hasMore = branchesPage.length === 100;
      page++;

      if (page > 10) {
        this.logger.warn(`${logPrefix} Arrêt pagination à 1000 branches`);
        break;
      }
    }

    this.logger.log(
      `${logPrefix} ✅ ${toutesBranches.length} branche(s) récupérée(s)`,
    );

    /* Détails de chaque branche */
    type BranchDetail = {
      name: string;
      protected: boolean;
      commit: {
        sha: string;
        message: string;
        auteur: string;
        date: string;
      };
      isDefault: boolean;
      behindAhead?: { behind: number; ahead: number };
    };

    const resultats: BranchDetail[] = [];
    const DETAIL_BATCH_SIZE = 5;

    for (let i = 0; i < toutesBranches.length; i += DETAIL_BATCH_SIZE) {
      const batch = toutesBranches.slice(i, i + DETAIL_BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (branch): Promise<BranchDetail> => {
          const { data: commits } = await octokit.repos.listCommits({
            owner,
            repo,
            sha: branch.name,
            per_page: 1,
            headers: GITHUB_API_HEADERS,
          });

          const commit = commits[0];
          if (!commit) {
            throw new Error(`Aucun commit trouvé pour ${branch.name}`);
          }

          const message = (commit.commit.message || 'Aucun message').split(
            '\n',
          )[0];
          const auteur =
            commit.commit.author?.name ??
            commit.commit.committer?.name ??
            commit.author?.login ??
            commit.committer?.login ??
            'inconnu';
          const date =
            commit.commit.author?.date ?? commit.commit.committer?.date ?? '';

          let behindAhead: { behind: number; ahead: number } | undefined;

          if (branch.name !== defaultBranch) {
            try {
              const { data: comparison } = await octokit.repos.compareCommits({
                owner,
                repo,
                base: defaultBranch,
                head: branch.name,
                headers: GITHUB_API_HEADERS,
              });
              behindAhead = {
                behind: comparison.behind_by,
                ahead: comparison.ahead_by,
              };
            } catch (err) {
              this.logger.debug(
                `${logPrefix} Comparaison échouée pour ${branch.name} : ${this.getErrorMessage(err)}`,
              );
            }
          }

          return {
            name: branch.name,
            protected: branch.protected,
            commit: {
              sha: commit.sha,
              message,
              auteur,
              date,
            },
            isDefault: branch.name === defaultBranch,
            behindAhead,
          };
        }),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          resultats.push(result.value);
        } else {
          this.logger.warn(
            `${logPrefix} Branche ignorée : ${this.getErrorMessage(result.reason)}`,
          );
        }
      }

      /* Délai pour respecter le rate limit GitHub */
      if (i + DETAIL_BATCH_SIZE < toutesBranches.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    /* Tri : défaut d'abord, puis par date (récent → ancien) */
    resultats.sort((a, b) => {
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;
      if (!a.commit.date) return 1;
      if (!b.commit.date) return -1;
      return (
        new Date(b.commit.date).getTime() - new Date(a.commit.date).getTime()
      );
    });

    this.logger.log(
      `${logPrefix} ✅ Terminé : ${resultats.length}/${toutesBranches.length} branches avec détails`,
    );

    return resultats;
  }

  async pousserFichiers(
    octokit: Octokit,
    owner: string,
    repo: string,
    fichiers: { path: string; contenu: string }[],
    brancheChoisie?: string,
  ) {
    const logPrefix = `[${owner}/${repo}]`;

    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
      headers: GITHUB_API_HEADERS,
    });
    const branche = brancheChoisie?.trim() || repoData.default_branch;

    let baseSha: string;

    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branche}`,
        headers: GITHUB_API_HEADERS,
      });
      baseSha = ref.object.sha;
    } catch {
      const { data: defRef } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${repoData.default_branch}`,
        headers: GITHUB_API_HEADERS,
      });

      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branche}`,
        sha: defRef.object.sha,
        headers: GITHUB_API_HEADERS,
      });

      baseSha = defRef.object.sha;
      this.logger.log(`${logPrefix} 🌿 Branche "${branche}" créée`);
    }

    const { data: baseCommit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: baseSha,
      headers: GITHUB_API_HEADERS,
    });

    const treeEntries = await Promise.all(
      fichiers.map(async (f) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(f.contenu).toString('base64'),
          encoding: 'base64',
          headers: GITHUB_API_HEADERS,
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
      headers: GITHUB_API_HEADERS,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: `🔄 WorkPilot : ${fichiers.length} fichier(s) → ${branche}`,
      tree: newTree.sha,
      parents: [baseSha],
      headers: GITHUB_API_HEADERS,
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branche}`,
      sha: newCommit.sha,
      headers: GITHUB_API_HEADERS,
    });

    this.logger.log(
      `${logPrefix} ✅ Push OK : ${fichiers.length} fichier(s) sur ${branche} (commit ${newCommit.sha.substring(0, 7)})`,
    );

    return { branche, commit: newCommit.sha };
  }

  async creerPullRequest(
    octokit: Octokit,
    owner: string,
    repo: string,
    opts: { head: string; titre: string; description?: string },
  ) {
    const logPrefix = `[${owner}/${repo}]`;

    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
      headers: GITHUB_API_HEADERS,
    });

    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title: opts.titre,
      head: opts.head,
      base: repoData.default_branch,
      body: opts.description,
      headers: GITHUB_API_HEADERS,
    });

    this.logger.log(`${logPrefix} ✅ PR #${pr.number} créée : ${pr.html_url}`);

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
    const logPrefix = `[${owner}/${repo}]`;

    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: numero,
      headers: GITHUB_API_HEADERS,
    });

    this.logger.log(`${logPrefix} ✅ PR #${numero} fusionnée`);
  }

  async trouverPrExistante(
    octokit: Octokit,
    owner: string,
    repo: string,
    headBranch: string,
    baseBranch: string,
  ): Promise<{ numero: number; url: string; titre: string } | null> {
    try {
      const { data: prs } = await octokit.pulls.list({
        owner,
        repo,
        state: 'open',
        head: `${owner}:${headBranch}`,
        base: baseBranch,
      });

      if (prs.length === 0) return null;

      const pr = prs[0];
      return {
        numero: pr.number,
        url: pr.html_url,
        titre: pr.title,
      };
    } catch (error) {
      this.logger.warn(
        `Erreur lors de la recherche de PR existante : ${this.getErrorMessage(error)}`,
      );
      return null;
    }
  }
}
