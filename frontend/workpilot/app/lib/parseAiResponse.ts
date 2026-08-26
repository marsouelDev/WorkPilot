export interface AiAction {
  path: string;
  action: "create" | "update" | "delete" | "mkdir"; 
  content: string;
  language: string;
  auto?: boolean;
}
export interface ParsedAiResponse {
  markdown: string;
  actions: AiAction[];
}

/* Langages qui ne correspondent JAMAIS à un fichier du projet */
const LANGS_NON_FICHIERS = new Set([
  "bash",
  "sh",
  "shell",
  "zsh",
  "console",
  "terminal",
  "text",
  "txt",
  "markdown",
  "md",
  "diff",
  "file_action",
]);

export function parseAiResponse(rawResponse: string): ParsedAiResponse {
  const actions: AiAction[] = [];
  const consumed: Array<[number, number]> = [];

  const actionRegex =
    /```file_action\s*\n([\s\S]*?)```\s*\n```(\w+)?\s*\n([\s\S]*?)```/g;

  let match: RegExpExecArray | null;
  while ((match = actionRegex.exec(rawResponse)) !== null) {
    const metaBlock = match[1];
    const language = match[2] || "txt";
    const content = match[3].trim();

    const pathMatch = metaBlock.match(/path:\s*(.+)/);
    const actionMatch = metaBlock.match(/action:\s*(create|update|delete)/);

    if (pathMatch && actionMatch) {
      actions.push({
        path: pathMatch[1].trim().replace(/^\/+/, ""),
        action: actionMatch[1] as "create" | "update" | "delete",
        content,
        language,
      });
      consumed.push([match.index, match.index + match[0].length]);
    }
  }

  const deleteRegex =
    /```file_action\s*\n([\s\S]*?)action:\s*delete[\s\S]*?```/g;
  let deleteMatch: RegExpExecArray | null;

  while ((deleteMatch = deleteRegex.exec(rawResponse)) !== null) {
    const metaBlock = deleteMatch[1] + deleteMatch[0];
    const pathMatch = metaBlock.match(/path:\s*(.+)/);

    if (pathMatch) {
      const path = pathMatch[1].trim().replace(/^\/+/, "");
      const already = actions.some(
        (a) => a.path === path && a.action === "delete",
      );
      if (!already) {
        actions.push({
          path,
          action: "delete",
          content: "",
          language: "txt",
        });
        consumed.push([
          deleteMatch.index,
          deleteMatch.index + deleteMatch[0].length,
        ]);
      }
    }
  }

  const fenceRegex = /```([\w+-]*)[^\n]*\n([\s\S]*?)```/g;
  let fenceMatch: RegExpExecArray | null;

  while ((fenceMatch = fenceRegex.exec(rawResponse)) !== null) {
    const start = fenceMatch.index;

    /* Déjà capturé par un file_action ? */
    if (consumed.some(([s, e]) => start >= s && start < e)) continue;

    const language = (fenceMatch[1] || "txt").toLowerCase();
    if (LANGS_NON_FICHIERS.has(language)) continue;

    const content = fenceMatch[2];
    const firstLine = (content.split("\n")[0] ?? "").trim();

    /* Cherche "// Fichier : app/page.tsx" ou "# File: ..." */
    const pathMatch = firstLine.match(
      /^(?:\/\/|#)\s*(?:Fichier|File|path)\s*:\s*(\S+)/i,
    );
    if (!pathMatch) continue;

    const path = pathMatch[1].replace(/^\/+/, "");
    if (actions.some((a) => a.path === path)) continue;

    actions.push({
      path,
      action: "create",
      content: content.trim(),
      language,
      auto: true,
    });
  }

  return { markdown: rawResponse, actions };
}
