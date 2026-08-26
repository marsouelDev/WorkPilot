import { WebContainer, WebContainerProcess } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";

export interface NoeudArbre {
  name: string;
  path: string;
  type: "fichier" | "dossier";
  content?: string;
  children?: NoeudArbre[];
}

let instance: WebContainer | null = null;

export async function bootWebContainer(): Promise<WebContainer> {
  if (instance) return instance;
  instance = await WebContainer.boot();
  return instance;
}

export function pipeOutput(
  process: WebContainerProcess,
  onData: (data: string) => void,
): void {
  const reader = process.output.getReader();

  const lire = async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onData(value);
      }
    } catch {
    }
  };

  void lire();
}

export function construireArbre(
  fichiers: { path: string; content: string }[],
  dossiers: string[] = [],
): NoeudArbre[] {
  const racine: NoeudArbre[] = [];

  const trouverOuCreerDossier = (
    children: NoeudArbre[],
    name: string,
    path: string,
  ): NoeudArbre => {
    let noeud = children.find((c) => c.type === "dossier" && c.name === name);
    if (!noeud) {
      noeud = { name, path, type: "dossier", children: [] };
      children.push(noeud);
    }
    return noeud;
  };

  for (const dossier of dossiers) {
    const parts = dossier.split("/").filter(Boolean);
    let courant = racine;
    let chemin = "";
    for (const part of parts) {
      chemin = chemin ? `${chemin}/${part}` : part;
      const noeud = trouverOuCreerDossier(courant, part, chemin);
      courant = noeud.children!;
    }
  }

  for (const fichier of fichiers) {
    const parts = fichier.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let courant = racine;
    let chemin = "";
    for (let i = 0; i < parts.length - 1; i++) {
      chemin = chemin ? `${chemin}/${parts[i]}` : parts[i];
      const noeud = trouverOuCreerDossier(courant, parts[i], chemin);
      courant = noeud.children!;
    }
    courant.push({
      name: parts[parts.length - 1],
      path: fichier.path,
      type: "fichier",
      content: fichier.content,
    });
  }

  const trier = (nodes: NoeudArbre[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dossier" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && trier(n.children));
  };
  trier(racine);

  return racine;
}
export function toFileSystemTree(nodes: NoeudArbre[]): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const node of nodes) {
    if (node.type === "dossier") {
      tree[node.name] = {
        directory: toFileSystemTree(node.children ?? []),
      };
    } else {
      tree[node.name] = {
        file: {
          contents: node.content ?? "",
        },
      };
    }
  }

  return tree;
}
