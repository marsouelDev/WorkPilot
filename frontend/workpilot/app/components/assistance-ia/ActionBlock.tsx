"use client";

import { useState } from "react";
import type { WebContainer } from "@webcontainer/api";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Copy,
  FileCode2,
  FilePlus,
  FileX,
  FolderPlus,
  Loader2,
  Play,
  RefreshCw,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { AiAction } from "@/app/lib/parseAiResponse";

const T = {
  surface: "#12121a",
  elevated: "#1a1a24",
  border: "#27272f",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textMuted: "#52525b",
  accent: "#8b5cf6",
  success: "#10b981",
  codeBg: "#0b0b12",
} as const;

const CONFIG = {
  create: {
    Icon: FilePlus,
    label: "Créer",
    color: "#10b981",
    soft: "rgba(16, 185, 129, 0.12)",
    badge: "new",
  },
  update: {
    Icon: FileCode2,
    label: "Modifier",
    color: "#3b82f6",
    soft: "rgba(59, 130, 246, 0.12)",
    badge: "modified",
  },
  delete: {
    Icon: FileX,
    label: "Supprimer",
    color: "#ef4444",
    soft: "rgba(239, 68, 68, 0.12)",
    badge: "deleted",
  },
  mkdir: {
    Icon: FolderPlus,
    label: "Dossier",
    color: "#f59e0b",
    soft: "rgba(245, 158, 11, 0.12)",
    badge: "folder",
  },
} as const;

type ActionType = "create" | "update" | "delete" | "mkdir";

interface ActionBlockProps {
  action: AiAction;
  wc: WebContainer | null;
  projectRoot: string;
  onApplied?: () => void;
}

function normalizeApplyPath(raw: string, root: string): string {
  let normalized = raw.replace(/^\/+/, "");
  const rootClean = root.replace(/^\/+/, "").replace(/\/+$/, "");
  if (rootClean && normalized.startsWith(rootClean + "/")) {
    normalized = normalized.slice(rootClean.length + 1);
  } else if (rootClean && normalized === rootClean) {
    normalized = "";
  }
  return normalized;
}

export default function ActionBlock({
  action,
  wc,
  projectRoot,
  onApplied,
}: ActionBlockProps) {
  const [status, setStatus] = useState<
    "pending" | "applying" | "applied" | "error"
  >("pending");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const actionType = action.action as ActionType;
  const cfg = CONFIG[actionType];
  const Icon = cfg.Icon;

  const lines = action.content ? action.content.split("\n").length : 0;

  const apply = async () => {
    if (!wc) {
      toast.error("WebContainer non disponible");
      return;
    }

    setStatus("applying");
    try {
      const normalizedPath = normalizeApplyPath(action.path, projectRoot);

      const absolutePath =
        projectRoot === "/"
          ? `/${normalizedPath}`
          : `${projectRoot}/${normalizedPath}`;

      console.log(
        `[ActionBlock] Apply ${actionType} : ${action.path} → ${absolutePath}`,
      );

      if (action.action === "mkdir") {
        /* ✅ Création de dossier */
        await wc.fs.mkdir(absolutePath, { recursive: true });
        toast.success(`Dossier créé : ${normalizedPath}`);
      } else if (action.action === "delete") {
        await wc.fs.rm(absolutePath, { recursive: true, force: true });
        toast.success(`Supprimé : ${normalizedPath}`);
      } else {
        /* create ou update */
        const lastSlash = absolutePath.lastIndexOf("/");
        if (lastSlash > 0) {
          await wc.fs
            .mkdir(absolutePath.slice(0, lastSlash), { recursive: true })
            .catch(() => {});
        }
        await wc.fs.writeFile(absolutePath, action.content, "utf-8");
        toast.success(
          action.action === "create"
            ? `Créé : ${normalizedPath}`
            : `Modifié : ${normalizedPath}`,
        );
      }

      setStatus("applied");
      onApplied?.();
    } catch (error) {
      console.error("[ActionBlock]", error);
      setStatus("error");
      toast.error(
        `Erreur : ${error instanceof Error ? error.message : "inconnue"}`,
      );
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(action.content);
      setCopied(true);
      toast.success("Code copié");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  };

  const ringColor =
    status === "applied"
      ? "rgba(16, 185, 129, 0.4)"
      : status === "error"
        ? "rgba(239, 68, 68, 0.4)"
        : T.border;

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        backgroundColor: T.surface,
        boxShadow: `inset 0 0 0 1px ${ringColor}`,
      }}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: cfg.soft }}
        >
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {action.content ? (
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 transition-transform"
              style={{
                color: T.textMuted,
                transform: expanded ? "rotate(90deg)" : undefined,
              }}
            />
          ) : (
            <div className="w-3.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <code
                className="truncate text-[12px] font-medium"
                style={{ color: T.textPrimary }}
              >
                {action.path}
              </code>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: cfg.soft, color: cfg.color }}
              >
                {action.auto ? "auto" : cfg.badge}
              </span>
            </div>
            {lines > 0 && (
              <p className="text-[10px]" style={{ color: T.textMuted }}>
                {lines} ligne{lines > 1 ? "s" : ""} · {action.language}
              </p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          {action.content && (
            <button
              type="button"
              onClick={copy}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: T.textSecondary }}
              title="Copier le code"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" style={{ color: T.success }} />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {status === "applied" ? (
            <span
              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold"
              style={{ backgroundColor: cfg.soft, color: T.success }}
            >
              <Check className="h-3 w-3" />
              Appliqué
            </span>
          ) : (
            <button
              type="button"
              onClick={apply}
              disabled={status === "applying"}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{
                backgroundColor:
                  status === "applying" ? T.textMuted : cfg.color,
              }}
            >
              {status === "applying" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : status === "error" ? (
                <RefreshCw className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              {status === "applying"
                ? "..."
                : status === "error"
                  ? "Réessayer"
                  : "Appliquer"}
            </button>
          )}
        </div>
      </div>

      {expanded && action.content && (
        <div className="border-t" style={{ borderColor: T.border }}>
          <div className="max-h-80 overflow-auto">
            <SyntaxHighlighter
              language={action.language}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: "12px",
                background: T.codeBg,
                fontSize: "12px",
                lineHeight: "1.5",
              }}
              showLineNumbers
              lineNumberStyle={{ color: T.textMuted, paddingRight: "12px" }}
            >
              {action.content}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
}
