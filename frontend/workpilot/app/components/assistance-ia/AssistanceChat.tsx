"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  FileCode2,
  Image as ImageIcon,
  Loader2,
  Send,
  Sparkles,
  User,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useAuthStore } from "@/stores/authStore";
import { useAssistanceIaStore } from "@/stores/assistanceIaStore";
import type { MessageIA } from "@/types/assistanceIaType";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";

interface AssistanceIaChatProps {
  taskId: number;
}

const USER_COLOR = "#6366F1";
const USER_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)";
const IA_COLOR = "#B95F00";
const SUGGESTIONS = [
  "Résume-moi cette tâche en quelques points",
  "Propose un plan d'action pour avancer",
  "Quels sont les points de vigilance ?",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [validated, setValidated] = useState(false);
  const code = String(children ?? "").replace(/\n$/, "");
  const languageMatch = /language-([\w+-]+)/.exec(className ?? "");
  const language = languageMatch?.[1] ?? "text";
  const lines = code.split("\n");
  const isInline = !className && !code.includes("\n") && code.length < 120;

  if (isInline) {
    return (
      <code
        className="rounded-md border px-1.5 py-0.5 font-mono text-[12px] sm:text-[13px]"
        style={{
          borderColor: `${IA_COLOR}30`,
          backgroundColor: `${IA_COLOR}10`,
          color: IA_COLOR,
        }}
      >
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Impossible de copier le code :", error);
    }
  };

  return (
    <div
      className={`my-3 overflow-hidden rounded-xl border bg-[#0f172a] shadow-md transition-colors duration-300 sm:my-4 ${
        validated ? "border-emerald-500/50" : "border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-700 bg-[#111827] px-2.5 py-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="hidden gap-1.5 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <span className="truncate font-mono text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-[11px]">
            {language}
          </span>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 shrink-0 gap-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="hidden sm:inline text-green-500">Copié</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Copier</span>
            </>
          )}
        </Button>
      </div>

      <div className="overflow-x-auto p-3 sm:p-4">
        <div className="flex">
          <div className="mr-3 flex shrink-0 select-none flex-col text-right font-mono text-[12px] leading-5 text-slate-600 sm:mr-4 sm:text-[13px] sm:leading-6">
            {lines.map((_, index) => (
              <div key={index} className="w-5 sm:w-6">
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-[#111827] px-2.5 py-2 sm:px-3 sm:py-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500 sm:text-[11px]">
          <FileCode2 className="h-3.5 w-3.5" />
          {lines.length} ligne{lines.length > 1 ? "s" : ""}
        </span>

        <Button
          type="button"
          size="sm"
          onClick={() => setValidated((v) => !v)}
          className={
            validated
              ? "h-7 gap-1.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              : "h-7 gap-1.5 border-0 bg-emerald-600 text-white shadow-sm hover:bg-emerald-500"
          }
        >
          {validated ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}

          {validated ? "Code validé" : "Valider le code"}
        </Button>
      </div>
    </div>
  );
}

function IaMessageContent({ contenu }: { contenu: string }) {
  return (
    <div className="max-w-none text-[13px] leading-6 text-slate-800 sm:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mb-3 mt-4 text-lg font-bold text-slate-900 first:mt-0 sm:mb-4 sm:mt-5 sm:text-xl">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-bold text-slate-900 first:mt-0 sm:mb-3 sm:mt-5 sm:text-lg">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-semibold text-slate-900 first:mt-0 sm:text-base">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1 sm:ml-5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1 sm:ml-5">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          code: ({ className, children }) => (
            <CodeBlock className={className}>{children}</CodeBlock>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="my-3 border-l-4 px-3 py-2 italic text-slate-600 sm:px-4"
              style={{
                borderColor: `${IA_COLOR}60`,
                backgroundColor: `${IA_COLOR}08`,
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
              className="font-medium underline underline-offset-2"
              style={{ color: IA_COLOR }}
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-slate-200" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 sm:my-4">
              <table className="w-full border-collapse text-xs sm:text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b last:border-b-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="border-b px-2 py-2 text-left font-semibold text-slate-700 sm:px-3">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b px-2 py-2 text-slate-700 sm:px-3">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          img: ({ src, alt }) => {
            if (!src || typeof src !== "string") {
              return null;
            }
            return (
              <Image
                src={src}
                alt={alt ?? "Image"}
                width={600}
                height={400}
                unoptimized={src.startsWith("data:")}
                className="my-3 max-w-full rounded-lg border border-slate-200"
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

export default function AssistanceIaChat({ taskId }: AssistanceIaChatProps) {
  const router = useRouter();
  const { token } = useAuthStore();

  const {
    task,
    messages,
    isLoadingTask,
    isSending,
    error,
    chargerTache,
    envoyerMessage,
    clearError,
  } = useAssistanceIaStore();

  const [message, setMessage] = useState("");

  /*IMAGES JOINTES (base64) */

  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

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
    if (!token || !taskId) {
      return;
    }
    chargerTache(token, taskId);
  }, [token, taskId, chargerTache]);

  useEffect(() => {
    if (message && error) {
      clearError();
    }
  }, [message, error, clearError]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => {
      clearError();
    }, 1500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [error, clearError]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const contenu = message.trim();
    if ((!contenu && attachedImages.length === 0) || !token || isSending) {
      return;
    }

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

    try {
      await envoyerMessage(token, taskId, contenuFinal);
    } catch (error) {
      console.error("Erreur envoi message IA :", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  /* ==========================================================
     RETOUR VERS LA LISTE DES TÂCHES
  ========================================================== */

  const handleRetour = () => {
    if (task?.project?.id) {
      router.push(`/projects/${task.project.id}/tasks`);
    } else {
      router.back();
    }
  };

  if (isLoadingTask) {
    return (
      <Card className="flex h-175 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: IA_COLOR }}
          />
          <p className="text-sm text-muted-foreground">
            Chargement de WorkPilot AI...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-175 w-full flex-col overflow-hidden border-slate-200 shadow-sm">
      <style>{`
        @keyframes wp-message-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wp-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: .4; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes wp-error-in {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wp-message-in {
          animation: wp-message-in .35s cubic-bezier(.21,1.02,.73,1) both;
        }
        .wp-error-in {
          animation: wp-error-in .3s ease-out both;
        }
        @keyframes wp-ping {
          0%        { transform: scale(1);   opacity: .6; }
          80%, 100% { transform: scale(2.2); opacity: 0;  }
        }
        .wp-ping {
          animation: wp-ping 1.8s cubic-bezier(0, 0, .2, 1) infinite;
        }
      `}</style>

      <div
        className="h-1 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${USER_COLOR}, ${IA_COLOR})`,
        }}
      />

      <CardHeader className="border-b bg-white p-4 sm:p-6">
        {/* ====================================================
            BOUTON RETOUR
        ==================================================== */}

        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRetour}
            className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour aux tâches</span>
            <span className="sm:hidden">Retour</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="relative shrink-0">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                style={{ backgroundColor: `${IA_COLOR}15` }}
              >
                <Bot
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: IA_COLOR }}
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="wp-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-full w-full rounded-full border-2 border-white bg-emerald-500" />
              </span>
            </div>

            <div className="min-w-0">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base text-slate-900 sm:text-lg">
                <span className="truncate">WorkPilot AI</span>
                <Badge
                  className="gap-1 border-0 text-white"
                  style={{ backgroundColor: IA_COLOR }}
                >
                  <Sparkles className="h-3 w-3" />
                  IA
                </Badge>
              </CardTitle>
              <CardDescription className="truncate text-xs sm:text-sm">
                Assistant intelligent dédié à cette tâche
              </CardDescription>
            </div>
          </div>
        </div>

        {task?.tache && (
          <div
            className="mt-3 rounded-xl border p-3 sm:mt-4 sm:p-4"
            style={{
              borderColor: `${IA_COLOR}25`,
              backgroundColor: `${IA_COLOR}08`,
            }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {task.tache.titre}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  Projet : {task.project.titre}
                </p>
              </div>
              <Badge variant="outline" className="w-fit shrink-0">
                {task.tache.statut}
              </Badge>
            </div>

            {task.assignee && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:mt-3">
                <User className="h-3.5 w-3.5" />
                <span>Assignée à</span>
                <span className="font-medium text-slate-900">
                  {task.assignee.prenom} {task.assignee.nom}
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {error && (
        <div className="px-3 pt-3 sm:px-4 sm:pt-4">
          <Alert variant="destructive" className="wp-error-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <CardContent className="min-h-0 flex-1 bg-slate-50/50 p-0">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="h-full">
            <MessageScrollerViewport>
              <MessageScrollerContent className="mx-auto flex min-h-full max-w-5xl flex-col gap-3 p-3 sm:gap-5 sm:p-5">
                {messages.length === 0 && (
                  <MessageScrollerItem messageId="welcome-message">
                    <div className="wp-message-in flex min-h-80 flex-col items-center justify-center px-2 text-center sm:min-h-95 sm:px-4">
                      <div
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm sm:mb-5 sm:h-16 sm:w-16"
                        style={{ backgroundColor: `${IA_COLOR}15` }}
                      >
                        <Bot
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          style={{ color: IA_COLOR }}
                        />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                        Bonjour 👋
                      </h3>
                      <p className="mt-2 max-w-md text-[13px] leading-6 text-muted-foreground sm:text-sm">
                        Je suis WorkPilot AI, ton assistant spécialisé dans
                        cette tâche. Pose-moi une question pour commencer.
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:mt-6">
                        {SUGGESTIONS.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setMessage(suggestion)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-slate-900 hover:shadow sm:px-4 sm:py-2 sm:text-xs"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  </MessageScrollerItem>
                )}

                {messages.map((msg: MessageIA) => {
                  const isUser = msg.role === "utilisateur";
                  const isAssistant = msg.role === "assistant";

                  if (msg.role === "systeme") {
                    return null;
                  }

                  return (
                    <MessageScrollerItem
                      key={msg.id}
                      messageId={String(msg.id)}
                      scrollAnchor={isUser}
                    >
                      <div
                        className={`wp-message-in flex items-end gap-2 sm:gap-3 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isAssistant && (
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9"
                            style={{ backgroundColor: `${IA_COLOR}15` }}
                          >
                            <Bot
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              style={{ color: IA_COLOR }}
                            />
                          </div>
                        )}

                        <div
                          className={`min-w-0 max-w-[88%] wrap-break-word rounded-2xl px-3 py-2.5 shadow-sm sm:max-w-[85%] sm:px-4 sm:py-3 ${
                            isUser
                              ? "rounded-br-md text-white shadow-indigo-200"
                              : "rounded-bl-md border border-slate-200 bg-white"
                          }`}
                          style={
                            isUser ? { background: USER_GRADIENT } : undefined
                          }
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap text-[13px] leading-6 sm:text-sm">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-2 last:mb-0">{children}</p>
                                  ),
                                  img: ({ src, alt }) => {
                                    if (!src || typeof src !== "string") {
                                      return null;
                                    }
                                    return (
                                      <Image
                                        src={src}
                                        alt={alt ?? "Image jointe"}
                                        width={400}
                                        height={300}
                                        unoptimized={src.startsWith("data:")}
                                        className="my-2 max-w-full rounded-lg border border-white/20"
                                      />
                                    );
                                  },
                                }}
                              >
                                {msg.contenu}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <IaMessageContent contenu={msg.contenu} />
                          )}

                          <p
                            className={`mt-1.5 text-[10px] sm:mt-2 ${
                              isUser ? "text-white/70" : "text-slate-500"
                            }`}
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

                        {isUser && (
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9"
                            style={{ backgroundColor: `${USER_COLOR}18` }}
                          >
                            <User
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              style={{ color: USER_COLOR }}
                            />
                          </div>
                        )}
                      </div>
                    </MessageScrollerItem>
                  );
                })}

                {isSending && (
                  <MessageScrollerItem messageId="typing-indicator">
                    <div className="wp-message-in flex items-end gap-2 sm:gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9"
                        style={{ backgroundColor: `${IA_COLOR}15` }}
                      >
                        <Bot
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          style={{ color: IA_COLOR }}
                        />
                      </div>

                      <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2"
                                style={{
                                  backgroundColor: IA_COLOR,
                                  animation: `wp-dot 1.2s ${i * 0.15}s ease-in-out infinite`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      </CardContent>

      <div className="border-t bg-white p-3 sm:p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-5xl flex-col gap-2"
        >
          {/* PREVIEW DES IMAGES JOINTES */}

          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachedImages.map((img, index) => (
                <div
                  key={index}
                  className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm"
                >
                  <Image
                    src={img}
                    alt={`Preview ${index + 1}`}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                    title="Retirer cette image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-200">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              disabled={isSending || !token}
            />

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || !token}
              className="h-9 w-9 shrink-0 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 sm:h-10 sm:w-10"
              title="Joindre une image"
            >
              <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pose une question sur cette tâche... "
              disabled={isSending || !token}
              rows={1}
              className="min-h-10 max-h-40 resize-none border-0 bg-transparent p-1.5 text-[13px] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
              style={{
                height: "auto",
                overflowY: "auto",
              }}
            />

            <Button
              type="submit"
              size="icon"
              disabled={
                (!message.trim() && attachedImages.length === 0) ||
                isSending ||
                !token
              }
              className="h-9 w-9 shrink-0 rounded-lg border-0 text-white shadow-md transition active:scale-95 sm:h-10 sm:w-10"
              style={{ background: USER_GRADIENT }}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin sm:h-5 sm:w-5" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground sm:text-[11px]">
            WorkPilot AI répond uniquement dans le contexte de cette tâche.
            <span className="ml-1 hidden sm:inline">
              Entrée pour envoyer · Shift + Entrée pour sauter une ligne.
            </span>
          </p>
        </form>
      </div>
    </Card>
  );
}
