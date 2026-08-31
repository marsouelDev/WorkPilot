"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
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
  Upload,
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
  textIA: "#B95F00",
  textMuted: "#52525b",
  accent: "#8b5cf6",
  accentHover: "#7c3aed",
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
} as const;

const SUGGESTIONS = [
  "Résume-moi cette tâche en quelques points",
  "Propose un plan d'action pour avancer",
  "Quels sont les points de vigilance ?",
  "Analyse cette capture d'écran d'erreur",
];
const EMPTY_MESSAGES: MessageIA[] = [];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo
const MAX_IMAGES = 4;

const MIME_ACCEPTES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

async function uploadImageToCloudinary(
  file: File,
  token: string,
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? `HTTP ${res.status}`,
    );
  }

  return (await res.json()) as { url: string; publicId: string };
}

interface AttachedImage {
  url: string;
  localId: string;
  uploading: boolean;
  fileName: string;
}

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
      toast.success("Code copié");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Impossible de copier le code");
      console.error(error);
    }
  };

  const handleApply = async () => {
    if (!wc || !filePath || applying) return;

    setApplying(true);
    try {
      const normalizedPath = normalizeApplyPath(filePath, projectRoot);
      if (!normalizedPath) {
        toast.error("Chemin invalide");
        return;
      }

      const absolutePath =
        projectRoot === "/"
          ? `/${normalizedPath}`
          : `${projectRoot}/${normalizedPath}`;

      const lastSlash = absolutePath.lastIndexOf("/");
      if (lastSlash > 0) {
        await wc.fs
          .mkdir(absolutePath.slice(0, lastSlash), { recursive: true })
          .catch(() => {});
      }

      await wc.fs.writeFile(absolutePath, code, "utf-8");
      setApplied(true);
      toast.success(`Fichier appliqué : ${filePath}`);
      onApplied?.();
    } catch {
      toast.error("Erreur lors de l'application du fichier");
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
          code: ({ className: cls, children }) => (
            <CodeBlock
              className={cls}
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

function ImageGrid({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  const cols =
    images.length === 1
      ? "grid-cols-1 max-w-xs"
      : images.length === 2
        ? "grid-cols-2 max-w-sm"
        : "grid-cols-2 max-w-md";

  return (
    <div className={`mb-3 grid gap-2 ${cols}`}>
      {images.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="group relative block overflow-hidden rounded-lg border transition hover:opacity-90"
          style={{ borderColor: T.border }}
        >
          <Image
            src={url}
            alt={`Image jointe ${i + 1}`}
            width={300}
            height={200}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
            <Upload
              className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100"
              strokeWidth={2}
            />
          </div>
        </a>
      ))}
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
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isSendingLocal, setIsSendingLocal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const viewportRef = useRef<HTMLDivElement>(null);

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

  const isMimeAccepte = (file: File): boolean =>
    MIME_ACCEPTES.includes(file.type);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0 || !token) return;

    const remainingSlots = MAX_IMAGES - attachedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.error(`Maximum ${MAX_IMAGES} images par message`);
    }

    if (filesToProcess.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    for (const file of filesToProcess) {
      if (!isMimeAccepte(file)) {
        toast.error(
          `"${file.name}" : format non supporté. PNG, JPG, WEBP, GIF, AVIF, SVG ou ICO.`,
        );
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`"${file.name}" dépasse 5 Mo`);
        continue;
      }

      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const previewUrl = URL.createObjectURL(file);
      setAttachedImages((prev) => [
        ...prev,
        {
          url: previewUrl,
          localId,
          uploading: true,
          fileName: file.name,
        },
      ]);

      try {
        const { url } = await uploadImageToCloudinary(file, token);
        URL.revokeObjectURL(previewUrl);
        setAttachedImages((prev) =>
          prev.map((img) =>
            img.localId === localId ? { ...img, url, uploading: false } : img,
          ),
        );
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        setAttachedImages((prev) =>
          prev.filter((img) => img.localId !== localId),
        );
        const msg = (err as Error).message;
        if (msg.includes("403") || msg.includes("Forbidden")) {
          toast.error(
            "Service d'upload temporairement indisponible. Réessaie dans quelques instants.",
          );
        } else {
          toast.error(`Upload impossible : ${msg}`);
        }
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (localId: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.localId !== localId));
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

  /* NOUVEAU : Scroll automatique vers le bas quand les messages changent */
  useEffect(() => {
    if (allMessages.length === 0 || isLoadingTask) return;

    /* Petit délai pour laisser le DOM se rendre */
    const timer = window.setTimeout(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    }, 100);

    return () => window.clearTimeout(timer);
  }, [allMessages, isLoadingTask]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contenu = message.trim();

    const hasPendingUploads = attachedImages.some((img) => img.uploading);
    if (hasPendingUploads) {
      toast.error("Attends la fin de l'upload des images");
      return;
    }

    const cloudinaryUrls = attachedImages
      .filter((img) => !img.uploading && /^https:\/\/[^/]+\./.test(img.url))
      .map((img) => img.url);

    if ((!contenu && cloudinaryUrls.length === 0) || !token || isSending)
      return;

    setMessage("");
    setAttachedImages([]);
    setIsSendingLocal(true);

    const userMsg: MessageIA = {
      id: Date.now(),
      conversationId: 0,
      role: "utilisateur",
      contenu,
      images: cloudinaryUrls,
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
        } catch (err) {
          console.warn("[IA] Contexte non disponible :", err);
        }
      }

      const res = await fetch(`${API_URL}/assistance-ia/tasks/${taskId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: contenu,
          images: cloudinaryUrls,
          projectStructure,
          relevantFiles,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string }).message ?? `Erreur HTTP ${res.status}`,
        );
      }

      const data = await res.json();
      addLocalMessage(data.message);

      const parsed = parseAiResponse(data.message.contenu);
      if (parsed.actions.length > 0) {
        onRefresh?.();
      }
    } catch (err) {
      console.error("Erreur envoi message IA :", err);
      toast.error((err as Error).message);
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

  const submitDisabled =
    (!message.trim() && attachedImages.length === 0) ||
    isSending ||
    isUploading ||
    !token;

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
        @keyframes wp-pulse-border {
          0%, 100% { border-color: rgba(139, 92, 246, 0.3); }
          50%      { border-color: rgba(139, 92, 246, 0.7); }
        }
        .wp-message-in { animation: wp-message-in .3s ease-out both; }
        .wp-error-in   { animation: wp-error-in .25s ease-out both; }
        .wp-uploading  { animation: wp-pulse-border 1.5s ease-in-out infinite; }
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
            <MessageScrollerViewport ref={viewportRef}>
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
                        tâche ou joins une capture d&apos;écran. J&apos;ai accès
                        au projet et peux créer/modifier des fichiers
                        directement.
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

                  const msgImages = msg.images ?? [];

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
                            {isUser && msgImages.length > 0 && (
                              <ImageGrid images={msgImages} />
                            )}

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

      {isUploading && (
        <div
          className="flex items-center gap-2 border-t px-3 py-2"
          style={{
            borderColor: T.accentBorder,
            backgroundColor: T.accentSoft,
          }}
        >
          <Upload
            className="h-3.5 w-3.5 animate-pulse"
            style={{ color: T.accent }}
          />
          <span className="text-[11px] font-medium" style={{ color: T.accent }}>
            Upload des images en cours...
          </span>
        </div>
      )}

      <div
        className="border-t p-3"
        style={{ borderColor: T.border, backgroundColor: T.bg }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((img) => (
                <div
                  key={img.localId}
                  className={`group relative h-16 w-16 overflow-hidden rounded-lg shadow-sm ${
                    img.uploading ? "wp-uploading border" : ""
                  }`}
                  style={{
                    boxShadow: img.uploading
                      ? undefined
                      : `inset 0 0 0 1px ${T.border}`,
                    borderColor: img.uploading ? T.accent : undefined,
                  }}
                >
                  <Image
                    src={img.url}
                    alt={img.fileName}
                    width={64}
                    height={64}
                    unoptimized={img.url.startsWith("blob:")}
                    className="h-full w-full object-cover"
                  />

                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeImage(img.localId)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-black/90 group-hover:opacity-100"
                    title="Retirer cette image"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[8px] text-white opacity-0 transition group-hover:opacity-100">
                    {img.fileName}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-xl p-2 transition-colors focus-within:ring-2"
            style={{
              backgroundColor: T.surface,
              boxShadow: `inset 0 0 0 1px ${T.border}`,
              // @ts-expect-error custom CSS var
              "--tw-ring-color": T.accentBorder,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={MIME_ACCEPTES.join(",")}
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isSending || isUploading || !token}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={
                isSending ||
                isUploading ||
                !token ||
                attachedImages.length >= MAX_IMAGES
              }
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
              style={{ color: T.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = T.elevated;
                e.currentTarget.style.color = T.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = T.textSecondary;
              }}
              title={
                attachedImages.length >= MAX_IMAGES
                  ? `Maximum ${MAX_IMAGES} images`
                  : "Joindre une image (PNG, JPG, WEBP, GIF, SVG, ICO)"
              }
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              {attachedImages.length > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: T.accent }}
                >
                  {attachedImages.length}
                </span>
              )}
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
              disabled={submitDisabled}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-md transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: T.accent }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.backgroundColor = T.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = T.accent;
              }}
            >
              {isSending || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          <p className="text-center text-[10px]" style={{ color: T.textMuted }}>
            Entrée pour envoyer · Shift+Entrée pour sauter une ligne ·{" "}
            {attachedImages.length}/{MAX_IMAGES} image
            {attachedImages.length > 1 ? "s" : ""}
          </p>
        </form>
      </div>
    </div>
  );
}
