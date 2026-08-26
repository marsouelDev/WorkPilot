"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Bot,
  Check,
  Copy,
  FileCode2,
  Image as ImageIcon,
  Loader2,
  Lock,
  Play,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { WebContainer } from "@webcontainer/api";
import { useAuthStore } from "@/stores/authStore";
import { useAssistanceIaStore } from "@/stores/assistanceIaStore";
import type { MessageIA } from "@/types/assistanceIaType";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { buildProjectContext } from "@/app/lib/projectContext";
import { parseAiResponse } from "@/app/lib/parseAiResponse";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AssistanceIaChatProps {
  taskId: number;
  wc?: WebContainer | null;
  projectRoot?: string;
  onRefresh?: () => void;
}

const T = {
  bg: "#0a0a0f",
  surface: "#12121a",
  elevated: "#1a1a24",
  border: "#27272f",
  borderStrong: "#3f3f46",
  textPrimary: "#fafafa",
  textSecondary: "#a1a1aa",
  textIA:"#B95F00",
  textMuted: "#52525b",
  accent: "#8b5cf6",
  accentSoft: "rgba(139, 92, 246, 0.15)",
  accentBorder: "rgba(139, 92, 246, 0.3)",
  success: "#10b981",
  successSoft: "rgba(16, 185, 129, 0.12)",
  danger: "#ef4444",
  dangerSoft: "rgba(239, 68, 68, 0.12)",
  warning: "#f59e0b",
  warningSoft: "rgba(245, 158, 11, 0.12)",
  userBubble: "#1e1b4b",
  userBubbleBorder: "rgba(139, 92, 246, 0.4)",
  aiBubble: "#12121a",
  aiBubbleBorder: "#27272f",
  codeBg: "#0b0b12",
  codeHeader: "#15151e",
  placeholder:"#F8F9FF"
} as const;

const SUGGESTIONS = [
  "Résume-moi cette tâche en quelques points",
  "Propose un plan d'action pour avancer",
  "Quels sont les points de vigilance ?",
];
const EMPTY_MESSAGES: MessageIA[] = [];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  wc?: WebContainer | null;
  projectRoot?: string;
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

function CodeBlock({
  className,
  children,
  wc,
  projectRoot = "/",
  onApplied,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const code = String(children ?? "").replace(/\n$/, "");
  const languageMatch = /language-([\w+-]+)/.exec(className ?? "");
  const language = languageMatch?.[1] ?? "text";
  const lines = code.split("\n");
  const isInline = !className && !code.includes("\n") && code.length < 120;

  const firstLine = lines[0] ?? "";
  const pathMatch = firstLine.match(
    /^(?:\/\/|#)\s*(?:Fichier|File|path)\s*:\s*(\S+)/i,
  );
  const filePath = pathMatch ? pathMatch[1].replace(/^\/+/, "") : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Impossible de copier le code :", error);
    }
  };

  const handleApply = async () => {
    if (!wc || !filePath || applying) return;

    setApplying(true);
    try {
      const normalizedPath = normalizeApplyPath(filePath, projectRoot);
      if (!normalizedPath) {
        console.warn("[CodeBlock] Path vide après normalisation :", filePath);
        return;
      }

      const absolutePath =
        projectRoot === "/"
          ? `/${normalizedPath}`
          : `${projectRoot}/${normalizedPath}`;

      console.log(`[CodeBlock] Apply : ${filePath} → ${absolutePath}`);

      const lastSlash = absolutePath.lastIndexOf("/");
      if (lastSlash > 0) {
        await wc.fs
          .mkdir(absolutePath.slice(0, lastSlash), { recursive: true })
          .catch(() => {});
      }

      await wc.fs.writeFile(absolutePath, code, "utf-8");
      setApplied(true);
      onApplied?.();
    } catch (error) {
      console.error("[CodeBlock] apply error:", error);
    } finally {
      setApplying(false);
    }
  };

  if (isInline) {
    return (
      <code
        className="rounded-md border px-1.5 py-0.5 font-mono text-[12px]"
        style={{
          borderColor: T.accentBorder,
          backgroundColor: T.accentSoft,
          color: T.accent,
        }}
      >
        {children}
      </code>
    );
  }

  return (
    <div
      className="my-3 overflow-hidden rounded-xl border shadow-sm"
      style={{ borderColor: T.border, backgroundColor: T.codeBg }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: T.border, backgroundColor: T.codeHeader }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <span
            className="truncate font-mono text-[11px] font-medium uppercase tracking-wider"
            style={{ color: T.textSecondary }}
          >
            {language}
          </span>
          <span
            className="flex items-center gap-1 font-mono text-[10px]"
            style={{ color: T.textMuted }}
          >
            <FileCode2 className="h-3 w-3" />
            {lines.length}
          </span>
          {filePath && (
            <code
              className="ml-2 truncate font-mono text-[11px]"
              style={{ color: T.accent }}
            >
              {filePath}
            </code>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors"
            style={{ color: T.textSecondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = T.elevated;
              e.currentTarget.style.color = T.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = T.textSecondary;
            }}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" style={{ color: T.success }} />
                <span style={{ color: T.success }}>Copié</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>

          {filePath && (
            <button
              type="button"
              onClick={handleApply}
              disabled={applying || applied}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: applied ? T.success : T.accent }}
            >
              {applying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : applied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>
                {applied ? "Appliqué" : applying ? "..." : "Appliquer"}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto p-3">
        <div className="flex">
          <div
            className="mr-3 flex shrink-0 select-none flex-col text-right font-mono text-[12px] leading-5"
            style={{ color: T.textMuted }}
          >
            {lines.map((_, index) => (
              <div key={index} className="w-5">
                {index + 1}
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: 0,
                background: "transparent",
                fontSize: "12px",
                lineHeight: "1.25rem",
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
              codeTagProps={{
                style: {
                  background: "transparent",
                  backgroundColor: "transparent",
                  color: "inherit",
                },
              }}
              wrapLongLines={false}
              PreTag="div"
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}

function IaMessageContent({
  contenu,
  wc,
  projectRoot,
  onApplied,
}: {
  contenu: string;
  wc?: WebContainer | null;
  projectRoot?: string;
  onApplied?: () => void;
}) {
  return (
    <div
      className="max-w-none text-[13px] leading-relaxed"
      style={{ color: T.textPrimary }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0" style={{ color: T.textPrimary }}>
              {children}
            </p>
          ),
          h1: ({ children }) => (
            <h1
              className="mb-3 mt-5 text-lg font-semibold first:mt-0"
              style={{ color: T.textPrimary }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className="mb-2 mt-5 text-base font-semibold first:mt-0"
              style={{ color: T.textPrimary }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className="mb-2 mt-4 text-sm font-semibold first:mt-0"
              style={{ color: T.textPrimary }}
            >
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul
              className="mb-3 ml-4 list-disc space-y-1"
              style={{ color: T.textPrimary }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="mb-3 ml-4 list-decimal space-y-1"
              style={{ color: T.textPrimary }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          code: ({ className, children }) => (
            <CodeBlock
              className={className}
              wc={wc}
              projectRoot={projectRoot}
              onApplied={onApplied}
            >
              {children}
            </CodeBlock>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="my-3 border-l-2 px-3 py-2 italic"
              style={{
                borderColor: T.accent,
                backgroundColor: T.accentSoft,
                color: T.textSecondary,
              }}
            >
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: T.accent }}
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4" style={{ borderColor: T.border }} />,
          table: ({ children }) => (
            <div
              className="my-3 overflow-x-auto rounded-lg border"
              style={{ borderColor: T.border }}
            >
              <table className="w-full border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: T.elevated }}>{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr
              className="border-b last:border-b-0"
              style={{ borderColor: T.border }}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className="border-b px-2 py-2 text-left font-semibold"
              style={{ borderColor: T.border, color: T.textPrimary }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="border-b px-2 py-2"
              style={{ borderColor: T.border, color: T.textSecondary }}
            >
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: T.textPrimary }}>
              {children}
            </strong>
          ),
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string") return null;
            return (
              <Image
                src={src}
                alt={alt ?? "Image"}
                width={600}
                height={400}
                unoptimized={src.startsWith("data:")}
                className="my-3 max-w-full rounded-lg border"
                style={{ borderColor: T.border }}
              />
            );
          },
        }}
      >
        {contenu}
      </ReactMarkdown>
    </div>
  );
}

function Avatar({ variant }: { variant: "user" | "assistant" }) {
  const isUser = variant === "user";
  const borderColor = isUser ? T.accentBorder : T.border;
  const bgColor = isUser ? T.accentSoft : T.elevated;
  const iconColor = isUser ? T.accent : T.textSecondary;

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{
        backgroundColor: bgColor,
        boxShadow: `inset 0 0 0 1px ${borderColor}, 0 1px 2px rgba(0,0,0,0.1)`,
      }}
    >
      {isUser ? (
        <User className="h-4 w-4" style={{ color: iconColor }} />
      ) : (
        <Bot className="h-4 w-4" style={{ color: iconColor }} />
      )}
    </div>
  );
}

export default function AssistanceIaChat({
  taskId,
  wc,
  projectRoot = "/",
  onRefresh,
}: AssistanceIaChatProps) {
  const { token } = useAuthStore();

  const {
    messages: storeMessages,
    isLoadingTask,
    error,
    chargerTache,
    clearError,
  } = useAssistanceIaStore();

  const [message, setMessage] = useState("");
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isSendingLocal, setIsSendingLocal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localMessagesStore, setLocalMessagesStore] = useState<
    Record<number, MessageIA[]>
  >({});

  const localMessages = localMessagesStore[taskId] ?? EMPTY_MESSAGES;
  const addLocalMessage = (msg: MessageIA) => {
    setLocalMessagesStore((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), msg],
    }));
  };

  const removeLastLocalMessage = () => {
    setLocalMessagesStore((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] ?? []).slice(0, -1),
    }));
  };

  const allMessages = useMemo(() => {
    const storeIds = new Set(storeMessages.map((m) => m.id));
    const filteredLocal = localMessages.filter((m) => !storeIds.has(m.id));
    return [...storeMessages, ...filteredLocal];
  }, [storeMessages, localMessages]);

  const isSending = isSendingLocal;

  const isAccessError = useMemo(() => {
    if (!error) return false;
    const e = error.toLowerCase();
    return e.includes("attribu") || e.includes("assign") || e.includes("accès");
  }, [error]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        console.warn("Fichier ignoré (pas une image) :", file.name);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        console.warn("Image trop volumineuse :", file.name);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setAttachedImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!token || !taskId) return;
    chargerTache(token, taskId);
  }, [token, taskId, chargerTache]);

  useEffect(() => {
    if (message && error) clearError();
  }, [message, error, clearError]);

  useEffect(() => {
    if (!error || isAccessError) return;
    const timer = window.setTimeout(() => clearError(), 3000);
    return () => window.clearTimeout(timer);
  }, [error, isAccessError, clearError]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contenu = message.trim();
    if ((!contenu && attachedImages.length === 0) || !token || isSending)
      return;

    let contenuFinal = contenu;
    if (attachedImages.length > 0) {
      const imagesMarkdown = attachedImages
        .map((img, i) => `![Image ${i + 1}](${img})`)
        .join("\n\n");
      contenuFinal = contenu
        ? `${contenu}\n\n${imagesMarkdown}`
        : imagesMarkdown;
    }

    setMessage("");
    setAttachedImages([]);
    setIsSendingLocal(true);

    const userMsg: MessageIA = {
      id: Date.now(),
      conversationId: 0,
      role: "utilisateur",
      contenu: contenuFinal,
      createdAt: new Date().toISOString(),
    };
    addLocalMessage(userMsg);

    try {
      let projectStructure: string | undefined;
      let relevantFiles: { path: string; content: string }[] | undefined;

      if (wc) {
        try {
          const context = await buildProjectContext(wc, projectRoot);
          projectStructure = context.structure;
          relevantFiles = context.relevantFiles;
          console.log(
            `[IA] Contexte : ${relevantFiles.length} fichiers, ${projectStructure.split("\n").length} lignes`,
          );
        } catch (error) {
          console.warn("[IA] Contexte non disponible :", error);
        }
      }

      const res = await fetch(`${API_URL}/assistance-ia/tasks/${taskId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: contenuFinal,
          projectStructure,
          relevantFiles,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      addLocalMessage(data.message);

      const parsed = parseAiResponse(data.message.contenu);
      if (parsed.actions.length > 0) {
        onRefresh?.();
      }
    } catch (error) {
      console.error("Erreur envoi message IA :", error);
      removeLastLocalMessage();
    } finally {
      setIsSendingLocal(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  if (isAccessError) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center"
        style={{ backgroundColor: T.bg }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: T.elevated,
            boxShadow: `inset 0 0 0 1px ${T.border}`,
          }}
        >
          <Lock className="h-6 w-6" style={{ color: T.textMuted }} />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: T.textPrimary }}>
          Assistance IA verrouillée
        </h3>
        <p
          className="max-w-xs text-xs leading-relaxed"
          style={{ color: T.textMuted }}
        >
          {error}
        </p>
      </div>
    );
  }

  if (isLoadingTask) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ backgroundColor: T.bg }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: T.accent }}
          />
          <p className="text-sm" style={{ color: T.textMuted }}>
            Chargement de WorkPilot AI...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ backgroundColor: T.bg, color: T.textPrimary }}
    >
      <style>{`
        @keyframes wp-message-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes wp-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: .3; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes wp-error-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wp-message-in { animation: wp-message-in .3s ease-out both; }
        .wp-error-in   { animation: wp-error-in .25s ease-out both; }
      `}</style>

      {error && (
        <div className="px-3 pt-3">
          <div
            className="flex items-start gap-2 rounded-lg border px-3 py-2.5 wp-error-in"
            style={{
              borderColor: T.danger,
              backgroundColor: T.dangerSoft,
            }}
          >
            <AlertCircle
              className="h-4 w-4 shrink-0"
              style={{ color: T.danger }}
            />
            <p className="text-xs" style={{ color: T.danger }}>
              {error}
            </p>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="h-full">
            <MessageScrollerViewport>
              <MessageScrollerContent className="flex min-h-full flex-col gap-5 p-4">
                {allMessages.length === 0 && (
                  <MessageScrollerItem messageId="welcome-message">
                    <div className="wp-message-in flex flex-col items-center justify-center px-2 py-12 text-center">
                      <div
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                          backgroundColor: T.accentSoft,
                          boxShadow: `inset 0 0 0 1px ${T.accentBorder}, 0 0 20px ${T.accentSoft}`,
                        }}
                      >
                        <Sparkles
                          className="h-7 w-7"
                          style={{ color: T.accent }}
                        />
                      </div>
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: T.textPrimary }}
                      >
                        Bonjour 👋
                      </h3>
                      <p
                        className="mt-2 max-w-xs text-[13px] leading-relaxed"
                        style={{ color: T.textSecondary }}
                      >
                        Je suis WorkPilot AI. Pose-moi une question sur cette
                        tâche. J&apos;ai accès au projet et peux créer/modifier
                        des fichiers directement.
                      </p>
                      <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                        {SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setMessage(suggestion)}
                            className="rounded-full border px-3.5 py-2 text-[12px] font-medium transition-all"
                            style={{
                              borderColor: T.border,
                              backgroundColor: T.surface,
                              color: T.textSecondary,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor =
                                T.accentBorder;
                              e.currentTarget.style.color = T.textPrimary;
                              e.currentTarget.style.backgroundColor =
                                T.elevated;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = T.border;
                              e.currentTarget.style.color = T.textSecondary;
                              e.currentTarget.style.backgroundColor = T.surface;
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </MessageScrollerItem>
                )}

                {allMessages.map((msg: MessageIA) => {
                  const isUser = msg.role === "utilisateur";

                  if (msg.role === "systeme") return null;

                  return (
                    <MessageScrollerItem
                      key={msg.id}
                      messageId={String(msg.id)}
                      scrollAnchor={isUser}
                    >
                      <div
                        className={`wp-message-in flex gap-3 ${
                          isUser ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <Avatar variant={isUser ? "user" : "assistant"} />

                        <div className="min-w-0 max-w-[75%] flex flex-col">
                          <div
                            className="rounded-2xl px-4 py-3"
                            style={
                              isUser
                                ? {
                                    backgroundColor: T.userBubble,
                                    boxShadow: `inset 0 0 0 1px ${T.userBubbleBorder}`,
                                    borderTopRightRadius: "4px",
                                  }
                                : {
                                    backgroundColor: T.aiBubble,
                                    boxShadow: `inset 0 0 0 1px ${T.aiBubbleBorder}`,
                                    borderTopLeftRadius: "4px",
                                  }
                            }
                          >
                            {isUser ? (
                              <div
                                className="whitespace-pre-wrap text-[13px] leading-relaxed"
                                style={{ color: T.textPrimary }}
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-2 last:mb-0">
                                        {children}
                                      </p>
                                    ),
                                    img: ({ src, alt }) => {
                                      if (!src || typeof src !== "string")
                                        return null;
                                      return (
                                        <Image
                                          src={src}
                                          alt={alt ?? "Image jointe"}
                                          width={400}
                                          height={300}
                                          unoptimized={src.startsWith("data:")}
                                          className="my-2 max-w-full rounded-lg border"
                                          style={{ borderColor: T.border }}
                                        />
                                      );
                                    },
                                  }}
                                >
                                  {msg.contenu}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <IaMessageContent
                                contenu={msg.contenu}
                                wc={wc}
                                projectRoot={projectRoot}
                                onApplied={onRefresh}
                              />
                            )}
                          </div>

                          <p
                            className={`mt-1 px-1 text-[10px] ${
                              isUser ? "text-right" : "text-left"
                            }`}
                            style={{ color: T.textMuted }}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "fr-FR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </MessageScrollerItem>
                  );
                })}

                {isSending && (
                  <MessageScrollerItem messageId="typing-indicator">
                    <div className="wp-message-in flex gap-3">
                      <Avatar variant="assistant" />
                      <div
                        className="rounded-2xl px-4 py-3.5"
                        style={{
                          backgroundColor: T.aiBubble,
                          boxShadow: `inset 0 0 0 1px ${T.aiBubbleBorder}`,
                          borderTopLeftRadius: "4px",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: T.textIA,
                                animation: `wp-dot 1.2s ${i * 0.15}s ease-in-out infinite`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      <div
        className="border-t p-3"
        style={{ borderColor: T.border, backgroundColor: T.bg }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative h-16 w-16 overflow-hidden rounded-lg shadow-sm"
                  style={{ boxShadow: `inset 0 0 0 1px ${T.border}` }}
                >
                  <Image
                    src={img}
                    alt={`Preview ${index + 1}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-black/90 group-hover:opacity-100"
                    title="Retirer cette image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-xl p-2 transition-colors focus-within:ring-2"
            style={{
              backgroundColor: T.surface,
              boxShadow: `inset 0 0 0 1px ${T.border}`,
              // @ts-expect-error ring-color via style
              "--tw-ring-color": T.accentBorder,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isSending || !token}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || !token}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
              style={{ color: T.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = T.elevated;
                e.currentTarget.style.color = T.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = T.textSecondary;
              }}
              title="Joindre une image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose une question sur cette tâche..."
              disabled={isSending || !token}
              rows={1}
              className="min-h-9 max-h-32 resize-none border-0 bg-transparent p-1.5 text-[13px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{
                color: T.textPrimary,
                height: "auto",
                overflowY: "auto",
              }}
            />

            <button
              type="submit"
              disabled={
                (!message.trim() && attachedImages.length === 0) ||
                isSending ||
                !token
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-md transition-all active:scale-95 disabled:opacity-40"
              style={{
                backgroundColor: T.accent,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = "#7c3aed";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = T.placeholder;
              }}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-center text-[10px]" style={{ color: T.textMuted }}>
            Entrée pour envoyer · Shift+Entrée pour sauter une ligne
          </p>
        </form>
      </div>
    </div>
  );
}
