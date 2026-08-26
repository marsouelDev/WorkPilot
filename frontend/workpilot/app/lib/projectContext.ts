import type { WebContainer } from "@webcontainer/api";

const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".angular",
  ".cache",
];

const MAX_FILES = 50;
const MAX_FILE_SIZE = 50_000; 
const MAX_DEPTH = 6;

export interface ProjectContext {
  structure: string;
  relevantFiles: { path: string; content: string }[];
}

/* Scanne le WebContainer et produit l'arborescence + fichiers pertinents */
export async function buildProjectContext(
  wc: WebContainer,
  rootPath: string,
): Promise<ProjectContext> {
  const structureLines: string[] = [];
  const relevantFiles: { path: string; content: string }[] = [];
  let fileCount = 0;

  const walk = async (
    absolutePath: string,
    relativePath: string,
    depth: number,
  ): Promise<void> => {
    if (depth > MAX_DEPTH || fileCount >= MAX_FILES) return;

    let entries: {
      name: string;
      isDirectory: () => boolean;
      isFile: () => boolean;
    }[];
    try {
      entries = await wc.fs.readdir(absolutePath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_PATTERNS.some((p) => entry.name.startsWith(p))) continue;

      const entryRelative = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      const entryAbsolute = `${absolutePath}/${entry.name}`;
      const indent = "  ".repeat(depth);

      if (entry.isDirectory()) {
        structureLines.push(`${indent}${entry.name}/`);
        await walk(entryAbsolute, entryRelative, depth + 1);
      } else if (entry.isFile()) {
        structureLines.push(`${indent}${entry.name}`);
        fileCount++;

        if (isRelevantFile(entry.name) && relevantFiles.length < MAX_FILES) {
          try {
            const content = await wc.fs.readFile(entryAbsolute, "utf-8");
            if (content.length <= MAX_FILE_SIZE) {
              relevantFiles.push({ path: entryRelative, content });
            }
          } catch {}
        }
      }
    }
  };

  await walk(rootPath, "", 0);

  return {
    structure: structureLines.join("\n"),
    relevantFiles,
  };
}

function isRelevantFile(name: string): boolean {
  const importantNames = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "README.md",
  ];
  const extensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".css",
    ".scss",
    ".html",
    ".sql",
    ".py"

  ];

  if (importantNames.includes(name)) return true;
  return extensions.some((ext) => name.endsWith(ext));
}
