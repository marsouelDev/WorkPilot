"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  File,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit3,
} from "lucide-react";
import type { NoeudArbre } from "@/lib/webcontainer";

declare global {
  interface Window {
    __wp_rename_node?: string;
  }
}

interface FileTreeProps {
  nodes: NoeudArbre[];
  activePath: string;
  modified: Record<string, string>;
  onSelect: (path: string) => void;
  onCreateFile?: (path: string) => void;
  onCreateFolder?: (path: string) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onRefresh?: () => void;
  projectName?: string;
}

/* ==========================================================
   🎨 ICÔNES VS CODE AUTHENTIQUES (SVG détaillés)
========================================================== */

function FileIcon({ name }: { name: string }) {
  const fileName = name.toLowerCase();
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const baseName = name.split("/").pop()?.toLowerCase() ?? "";

  // Fichiers spéciaux (par nom exact)
  if (baseName === "package.json") return <NpmIcon />;
  if (baseName === "tsconfig.json") return <TsConfigIcon />;
  if (
    baseName === "next.config.js" ||
    baseName === "next.config.mjs" ||
    baseName === "next.config.ts"
  )
    return <NextIcon />;
  if (baseName === "tailwind.config.js" || baseName === "tailwind.config.ts")
    return <TailwindIcon />;
  if (baseName === "postcss.config.js" || baseName === "postcss.config.cjs")
    return <PostcssIcon />;
  if (baseName === "vite.config.js" || baseName === "vite.config.ts")
    return <ViteIcon />;
  if (baseName === ".env" || baseName.startsWith(".env.")) return <EnvIcon />;
  if (baseName === ".gitignore" || baseName === ".dockerignore")
    return <GitIcon />;
  if (baseName === "readme.md") return <ReadmeIcon />;
  if (baseName === ".eslintrc" || baseName === "eslint.config.js")
    return <EslintIcon />;
  if (baseName === ".prettierrc") return <PrettierIcon />;
  if (baseName === "dockerfile") return <DockerIcon />;
  if (baseName === "docker-compose.yml" || baseName === "docker-compose.yaml")
    return <DockerComposeIcon />;
  if (baseName === "package-lock.json") return <NpmLockIcon />;
  if (baseName === "yarn.lock") return <YarnLockIcon />;
  if (baseName === "pnpm-lock.yaml") return <PnpmIcon />;
  if (baseName === "license" || baseName === "license.md")
    return <LicenseIcon />;
  if (baseName === ".editorconfig") return <EditorConfigIcon />;

  // Par extension
  switch (ext) {
    case "ts":
      return fileName.endsWith(".d.ts") ? <TsDefIcon /> : <TypeScriptIcon />;
    case "tsx":
      return <ReactIcon />;
    case "js":
    case "mjs":
    case "cjs":
      return <JavaScriptIcon />;
    case "jsx":
      return <ReactIcon />;
    case "html":
    case "htm":
      return <HtmlIcon />;
    case "css":
      return <CssIcon />;
    case "scss":
    case "sass":
      return <SassIcon />;
    case "less":
      return <LessIcon />;
    case "vue":
      return <VueIcon />;
    case "svelte":
      return <SvelteIcon />;
    case "json":
      return <JsonIcon />;
    case "yaml":
    case "yml":
      return <YamlIcon />;
    case "xml":
      return <XmlIcon />;
    case "toml":
      return <TomlIcon />;
    case "md":
    case "mdx":
      return <MarkdownIcon />;
    case "txt":
      return <TextIcon />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "bmp":
    case "ico":
      return <ImageIcon />;
    case "svg":
      return <SvgIcon />;
    case "mp4":
    case "webm":
    case "mov":
    case "avi":
      return <VideoIcon />;
    case "mp3":
    case "wav":
    case "ogg":
      return <AudioIcon />;
    case "pdf":
      return <PdfIcon />;
    case "doc":
    case "docx":
      return <WordIcon />;
    case "xls":
    case "xlsx":
      return <ExcelIcon />;
    case "ppt":
    case "pptx":
      return <PowerpointIcon />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <ArchiveIcon />;
    case "py":
      return <PythonIcon />;
    case "go":
      return <GoIcon />;
    case "rs":
      return <RustIcon />;
    case "java":
      return <JavaIcon />;
    case "php":
      return <PhpIcon />;
    case "rb":
      return <RubyIcon />;
    case "cs":
      return <CsharpIcon />;
    case "cpp":
    case "cc":
    case "cxx":
      return <CppIcon />;
    case "c":
      return <CIcon />;
    case "h":
    case "hpp":
      return <HeaderIcon />;
    case "sh":
    case "bash":
    case "zsh":
      return <ShellIcon />;
    case "bat":
    case "cmd":
      return <BatIcon />;
    case "ps1":
      return <PowerShellIcon />;
    case "sql":
      return <SqlIcon />;
    case "prisma":
      return <PrismaIcon />;
    case "graphql":
    case "gql":
      return <GraphqlIcon />;
    case "woff":
    case "woff2":
    case "ttf":
    case "otf":
      return <FontIcon />;
    case "lock":
      return <LockFileIcon />;
    default:
      return <File className="h-4 w-4 shrink-0 text-gray-500" />;
  }
}

/* ===== TypeScript (bleu VSCode) ===== */
function TypeScriptIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#3178C6" />
      <path d="M3 3h18v18H3z" fill="none" />
      <text
        x="12"
        y="17"
        fontSize="11"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        TS
      </text>
    </svg>
  );
}

function TsDefIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#3178C6" opacity="0.5" />
      <text
        x="12"
        y="17"
        fontSize="7"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        d.ts
      </text>
    </svg>
  );
}

function TsConfigIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#3178C6" />
      <path
        d="M7 8l5 4-5 4"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 16h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ===== JavaScript ===== */
function JavaScriptIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#F7DF1E" />
      <path
        d="M13.5 17.5c.3.5.6 1 1.3 1 .6 0 1-.2 1-.8 0-.7-.6-1-1.5-1.4l-.5-.2c-1.5-.6-2.5-1.4-2.5-3 0-1.6 1.2-2.8 3-2.8 1.4 0 2.3.5 3 1.6l-1.5 1c-.3-.5-.6-.8-1.2-.8-.5 0-.8.3-.8.7 0 .5.4.8 1.2 1.1l.5.2c1.8.8 2.7 1.5 2.7 3.2 0 1.8-1.4 2.8-3.4 2.8-2 0-3.2-.9-3.8-2.1l1.8-.5zM8 17.6c.3.5.5 1 1.2 1 .6 0 1-.3 1-.9 0-.5-.2-.8-.9-1.1l-.3-.1c-.8-.3-1.4-.9-1.4-1.8 0-1 .8-1.8 2-1.8.9 0 1.5.3 2 1.1l-1 .6c-.2-.3-.4-.5-.8-.5-.3 0-.5.2-.5.5 0 .3.2.5.8.7l.3.1c1 .4 1.6 1 1.6 1.9 0 1.1-.9 1.8-2.3 1.8-1.4 0-2.2-.6-2.6-1.5L8 17.6z"
        fill="#323330"
      />
    </svg>
  );
}

/* ===== React (TSX/JSX) - atome ===== */
function ReactIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <g fill="none" stroke="#61DAFB" strokeWidth="1.2">
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </g>
      <circle cx="12" cy="12" r="1.8" fill="#61DAFB" />
    </svg>
  );
}

/* ===== HTML5 (bouclier) ===== */
function HtmlIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M4 3l1.6 18L12 23l6.4-2L20 3H4z" fill="#E34F26" />
      <path d="M12 21l5.2-1.6L18.6 5H12v16z" fill="#EF652A" />
      <path
        d="M8.5 9.5H12V7H6l.2 2.5H12zm0 3H12V15l-3.5-1v-2.5l3.5 1v-2H8.5z"
        fill="#EBEBEB"
      />
      <path d="M12 9.5h3.3l-.2 2H12zm0 5.5l3.5-1-.2-2.5H12z" fill="#fff" />
    </svg>
  );
}

/* ===== CSS3 (bouclier) ===== */
function CssIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M4 3l1.6 18L12 23l6.4-2L20 3H4z" fill="#1572B6" />
      <path d="M12 21l5.2-1.6L18.6 5H12v16z" fill="#33A9DC" />
      <path
        d="M8.5 9.5h7l-.2 2.5h-4.5l.2 2h4.3l-.3 3.5L12 19l-3-1.5.2-2 1.3.5 1.5.5.3-3H7.5z"
        fill="#fff"
      />
    </svg>
  );
}

/* ===== Sass ===== */
function SassIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#CD6799" />
      <path
        d="M15.5 7.5c-1.5-.5-3-.5-4.5.5-1 .7-1.5 1.5-1.5 2.5 0 1.5 1 2.5 2.5 3l1.5.5c1 .3 1.5 1 1.5 1.5 0 .7-.5 1-1.5 1-1.5 0-3-.5-4-1.5l-.5 1.5c1.5 1 3 1.5 4.5 1.5 2.5 0 4-1.5 4-3.5 0-1.5-1-2.5-2.5-3l-1.5-.5c-1-.3-1.5-1-1.5-1.5 0-.5.5-1 1.5-1 1 0 2 .3 3 1l.5-1.5z"
        fill="white"
      />
    </svg>
  );
}

function LessIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#1D365D" />
      <text
        x="12"
        y="16"
        fontSize="9"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        &lt;
      </text>
    </svg>
  );
}

/* ===== Vue ===== */
function VueIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M2 3h4l6 10L18 3h4L12 21 2 3z" fill="#41B883" />
      <path d="M6 3h4l2 3.5L14 3h4l-6 10L6 3z" fill="#35495E" />
    </svg>
  );
}

/* ===== Svelte ===== */
function SvelteIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M19.7 4.5c-2-2.8-5.8-3.5-8.6-1.7L5.3 6.7c-1.4.9-2.4 2.3-2.7 4-.3 1.7 0 3.5.8 5-.5 1.2-.7 2.5-.5 3.8.3 1.7 1.3 3.2 2.7 4.1 2 2.8 5.8 3.5 8.6 1.7l5.8-3.9c1.4-.9 2.4-2.3 2.7-4 .3-1.7 0-3.5-.8-5 .5-1.2.7-2.5.5-3.8-.3-1.7-1.3-3.2-2.7-4.1zM11 19.4c-1.6.6-3.4 0-4.3-1.3l-.2-.3-.3-.2c-.6-.4-1-1-1.2-1.7-.1-.7 0-1.3.2-1.9l.2-.4.3.3c.9.9 2 1.5 3.2 1.8l.3.1-.1.3c0 .3 0 .6.2.8l.2.3c.2.3.6.4.9.3l.3-.1 5.8-3.9c.3-.2.5-.5.4-.8l-.1-.3c-.2-.3-.6-.4-.9-.3l-2.2 1.5c-.8.3-1.6.3-2.3-.2-.7-.4-1.1-1.1-1.1-1.9v-.3l.2-4.7c0-.8.5-1.5 1.1-1.9.7-.4 1.5-.4 2.3-.2l.3.1 5.8-3.9c.8-.5 1.7-.5 2.5-.1l.3.2.3.2c.6.4 1 1 1.2 1.7.1.7 0 1.3-.2 1.9l-.2.4-.3-.3c-.9-.9-2-1.5-3.2-1.8l-.3-.1.1-.3c0-.3 0-.6-.2-.8l-.2-.3c-.2-.3-.6-.4-.9-.3l-.3.1-5.8 3.9c-.3.2-.5.5-.4.8l.1.3c.2.3.6.4.9.3l2.2-1.5c.8-.3 1.6-.3 2.3.2.7.4 1.1 1.1 1.1 1.9v.3l-.2 4.7c0 .8-.5 1.5-1.1 1.9-.7.4-1.5.4-2.3.2l-.3-.1-5.8 3.9c-.8.5-1.7.5-2.5.1z"
        fill="#FF3E00"
      />
    </svg>
  );
}

/* ===== JSON ===== */
function JsonIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#F7DF1E" />
      <text
        x="12"
        y="17"
        fontSize="12"
        fontWeight="700"
        fill="#323330"
        textAnchor="middle"
        fontFamily="monospace"
      >
        {"{}"}
      </text>
    </svg>
  );
}

/* ===== YAML ===== */
function YamlIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#CB171E" />
      <path d="M7 8l3 4v5h2v-5l3-4H13l-2 3-2-3z" fill="white" />
    </svg>
  );
}

function XmlIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#F26522" />
      <text
        x="12"
        y="16"
        fontSize="7"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        XML
      </text>
    </svg>
  );
}

function TomlIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#9C4121" />
      <text
        x="12"
        y="16"
        fontSize="7"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        TOML
      </text>
    </svg>
  );
}

/* ===== Markdown ===== */
function MarkdownIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#0879AE" />
      <path
        d="M5 8h2l2 4 2-4h2v8h-2v-5l-2 3-2-3v5H5zM16 12l3-4v8h-2v-5l-2 3"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M6 2h9l5 5v15H6z" fill="#6B7280" opacity="0.3" />
      <path
        d="M6 2h9l5 5v15H6z"
        stroke="#6B7280"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 11h8M8 14h6M8 17h7"
        stroke="#6B7280"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Images ===== */
function ImageIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="#A074C4"
        opacity="0.3"
        stroke="#7C3AED"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="10" r="2" fill="#7C3AED" />
      <path
        d="M3 16l4-4 3 3 2-2 8 4"
        stroke="#7C3AED"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SvgIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#FFB13B" />
      <text
        x="12"
        y="16"
        fontSize="7"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        SVG
      </text>
    </svg>
  );
}

/* ===== Médias ===== */
function VideoIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="12" rx="2" fill="#EF4444" />
      <path d="M10 9l5 3-5 3V9z" fill="white" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#10B981" opacity="0.3" />
      <path
        d="M9 18V5l12-2v13"
        stroke="#10B981"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="6" cy="18" r="3" fill="#10B981" />
      <circle cx="18" cy="16" r="3" fill="#10B981" />
    </svg>
  );
}

/* ===== Documents ===== */
function PdfIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#E5322D" />
      <text
        x="12"
        y="16"
        fontSize="7"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        PDF
      </text>
    </svg>
  );
}

function WordIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#2B579A" />
      <text
        x="12"
        y="16"
        fontSize="10"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        W
      </text>
    </svg>
  );
}

function ExcelIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#217346" />
      <text
        x="12"
        y="16"
        fontSize="10"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        X
      </text>
    </svg>
  );
}

function PowerpointIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#D24726" />
      <text
        x="12"
        y="16"
        fontSize="10"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        P
      </text>
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M5 8h14v12H5z" fill="#92400E" opacity="0.5" />
      <path d="M5 8h14v12H5z" stroke="#92400E" strokeWidth="1.5" fill="none" />
      <rect x="5" y="4" width="14" height="4" fill="#92400E" />
      <rect x="10" y="12" width="4" height="3" rx="0.5" fill="#FCD34D" />
    </svg>
  );
}

/* ===== Backend ===== */
function PythonIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M11.9 2C6.4 2 6.8 4.4 6.8 4.4l.1 2.5h5.2v.7H4.6S2 6.9 2 12.2s2.3 5.1 2.3 5.1h1.4v-2.4s-.1-2.3 2.3-2.3h3.9s2.2 0 2.2-2.1V5.2s.3-3.2-3-3.2zM9.4 3.8c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9z"
        fill="#3776AB"
      />
      <path
        d="M12.1 22c5.5 0 5.1-2.4 5.1-2.4l-.1-2.5h-5.2v-.7h7.6S22 17.1 22 11.8s-2.3-5.1-2.3-5.1h-1.4v2.4s.1 2.3-2.3 2.3h-3.9s-2.2 0-2.2 2.1v5.3s-.3 3.2 3 3.2zm2.5-1.8c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z"
        fill="#FFD43B"
      />
    </svg>
  );
}

function GoIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M2.3 12.4c0-.7.1-1.3.3-1.9.2-.6.5-1.1.8-1.5.3-.4.7-.8 1.2-1.1.5-.3 1-.5 1.6-.7l.3.8c-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.2.4-.3.8-.4 1.3-.1.5-.1 1-.1 1.5h-2zM5.5 8.4c-.5.2-1 .5-1.4.9-.4.4-.8.9-1 1.5-.2.6-.4 1.3-.4 2.1v.5H1c0-1 .2-1.8.5-2.6.3-.7.8-1.4 1.3-1.9.5-.6 1.2-1 1.9-1.4.7-.3 1.5-.5 2.3-.6l.3.9c-.7.1-1.3.3-1.8.6zM8.5 10.1c-.3.1-.5.3-.7.5-.2.2-.4.4-.5.7-.1.3-.2.6-.2.9v.2H5.5v-.2c0-.5.1-1 .3-1.4.2-.4.4-.8.7-1.1.3-.3.6-.6 1-.8.4-.2.9-.3 1.4-.4l.2.9c-.3 0-.5.1-.8.2-.2 0-.5.2-.8.3z"
        fill="#00ADD8"
      />
      <path
        d="M15.5 14.3c-.3-.1-.6-.3-.8-.5-.2-.2-.4-.4-.5-.7-.1-.3-.2-.6-.2-.9v-.2h1.6v.2c0 .3.1.5.2.7.1.2.2.3.4.4.2.1.3.2.5.2.2 0 .4-.1.5-.2.2-.1.3-.2.4-.4.1-.2.2-.4.2-.7 0-.3-.1-.5-.2-.7-.1-.2-.3-.3-.5-.4-.2-.1-.4-.2-.7-.3-.4-.1-.8-.3-1.2-.5-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.6-1-.1-.4-.2-.8-.2-1.2 0-.5.1-.9.3-1.3.2-.4.5-.7.8-1 .3-.3.7-.5 1.1-.6.4-.1.9-.2 1.4-.2.5 0 1 .1 1.4.2.4.1.8.3 1.1.6.3.3.6.6.8 1 .2.4.3.9.3 1.4v.3h-1.5v-.2c0-.3-.1-.5-.2-.7-.1-.2-.2-.3-.4-.4-.2-.1-.4-.2-.6-.2-.2 0-.4.1-.6.2-.2.1-.3.2-.4.4-.1.2-.2.4-.2.7 0 .3.1.5.2.7.1.2.3.3.5.4.2.1.5.2.8.3.4.1.8.3 1.2.5.4.2.7.4 1 .7.3.3.5.6.6 1 .1.4.2.8.2 1.2 0 .5-.1.9-.3 1.3-.2.4-.5.7-.8 1-.3.3-.7.5-1.1.6-.4.1-.9.2-1.4.2-.5 0-1-.1-1.4-.2z"
        fill="#00ADD8"
      />
    </svg>
  );
}

function RustIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="#DEA584"
        stroke="#3A2A1F"
        strokeWidth="0.5"
      />
      <path
        d="M12 4l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3L7 7h3l1-3zM6.5 14l2-1.5L7 14.5l1.5 2H6.5zM17.5 14l-2-1.5 1.5 2L17 16.5h-2z"
        fill="#3A2A1F"
      />
      <circle cx="12" cy="12" r="2.5" fill="#3A2A1F" />
    </svg>
  );
}

function JavaIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M10.2 14.5s-.6.4.4.5c1.2.1 1.8.1 3.1-.1.1.1.3.3.4.4-3 1.3-6.7-.1-3.9-.8zM9.8 12.8s-.6.5.4.6c1.4.1 2.5.1 4.4-.2 0 0 .1.3.3.4-3.5 1-7.4.1-5.1-.8zM12.3 9.2c.8.9-.2 1.7-.2 1.7s2-.9 1-2.3c-.9-1.2-1.5-1.8 2-3.9 0 0-5.4 1.3-2.8 4.5zM16.1 15.6s.7.6-.8 1c-2.8.8-11.7 1-14.2 0-.9-.4.8-.9 1.3-1 .5-.1.7-.1.7-.1-.7-.5-4.5 1-1.9 1.4 7 1.1 12.8-.5 10.9-1.3zM10.5 11.1s-2.7.6-1 1c.8.1 2.3.1 3.7 0 1.1-.1 2.3-.3 2.3-.3s-.4.2-.7.4c-2.9.7-8.4.4-6.8-.3 1.4-.6 2.5-.8 2.5-.8zM15.2 13.9c3-.1.4 1.5-3.5 1.5-2.5 0-3.5-.5-3.5-.5s.5-.2 1.3-.3c.8-.1 1.4-.1 2.2 0 .7 0 2-.1 2.5-.2.5-.1 1-.4 1-.5z"
        fill="#F89820"
      />
      <path
        d="M13.5 3s2.5 2.5-2.4 6.3c-3.9 3-.9 4.8 0 6.7-2.3-2-3.9-3.8-2.8-5.5 1.6-2.5 6.2-3.7 5.2-7.5zM10.8 18.2c2.8.1-2.5.9-2.5.9s-.5-.5.3-.6c.7-.1 1.1-.2 2.2-.3z"
        fill="#5382A1"
      />
    </svg>
  );
}

function PhpIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <ellipse cx="12" cy="12" rx="10" ry="5" fill="#777BB4" />
      <text
        x="12"
        y="15"
        fontSize="8"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        php
      </text>
    </svg>
  );
}

function RubyIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M19.6 16L12 23 4.4 16l1.5-9h12.2z" fill="#CC342D" />
      <path d="M12 23L4.4 16l1.5-9" fill="#A62723" opacity="0.7" />
      <path d="M19.6 16l-1.5-9L12 23" fill="#E45752" opacity="0.7" />
      <path d="M12 14l4-4h-8z" fill="white" opacity="0.3" />
    </svg>
  );
}

function CsharpIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L3 7v10l9 5 9-5V7z" fill="#68217A" />
      <text
        x="12"
        y="16"
        fontSize="11"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        C#
      </text>
    </svg>
  );
}

function CppIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L3 7v10l9 5 9-5V7z" fill="#00599C" />
      <text
        x="12"
        y="15"
        fontSize="8"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        C++
      </text>
    </svg>
  );
}

function CIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L3 7v10l9 5 9-5V7z" fill="#555555" />
      <text
        x="12"
        y="16"
        fontSize="11"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        C
      </text>
    </svg>
  );
}

function HeaderIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L3 7v10l9 5 9-5V7z" fill="#555555" opacity="0.7" />
      <text
        x="12"
        y="16"
        fontSize="10"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        H
      </text>
    </svg>
  );
}

/* ===== Shell ===== */
function ShellIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#4EAA25" />
      <path
        d="M6 10l3 2-3 2"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14h5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BatIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#C1F1FF" />
      <path
        d="M6 10l3 2-3 2"
        stroke="#1E3A8A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14h5"
        stroke="#1E3A8A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PowerShellIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#012456" />
      <path
        d="M6 10l3 2-3 2"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 14h5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ===== Database ===== */
function SqlIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <ellipse cx="12" cy="7" rx="8" ry="3" fill="#336791" />
      <path
        d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7"
        stroke="#336791"
        strokeWidth="1.5"
        fill="none"
      />
      <ellipse cx="12" cy="12" rx="8" ry="3" fill="#336791" opacity="0.5" />
    </svg>
  );
}

function PrismaIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L4 7v10l8 5 8-5V7z" fill="#2D3748" />
      <path d="M12 2l8 5-8 5-8-5z" fill="#5A67D8" />
    </svg>
  );
}

function GraphqlIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L3 7v10l9 5 9-5V7z" fill="#E535AB" />
      <path d="M12 7l5 3v4l-5 3-5-3v-4z" fill="white" opacity="0.5" />
    </svg>
  );
}

/* ===== Outils & configs ===== */
function NpmIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#CB3837" />
      <path d="M4 8h16v8h-5v-5h-2v5H4z" fill="white" />
    </svg>
  );
}

function NpmLockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#CB3837" opacity="0.5" />
      <rect x="7" y="11" width="10" height="8" rx="1" fill="#CB3837" />
      <path
        d="M9 11V8a3 3 0 016 0v3"
        stroke="#CB3837"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function YarnLockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#2C8EBB" />
      <path
        d="M12 4c-4.4 0-8 3.6-8 8 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.1-.9-2-2-2s-2 .9-2 2c0 .6.4 1 1 1"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function PnpmIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#F69220" />
      <path
        d="M4 4h6v6H4zM10 4h6v6h-6zM16 4h4v6h-4zM4 10h16v4H4zM4 14h16v6H4z"
        fill="#FFE1C7"
      />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="black" />
      <path d="M9 7v10l8-10" fill="url(#next-grad)" />
      <defs>
        <linearGradient id="next-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="#666" />
        </linearGradient>
      </defs>
      <path
        d="M16 17v-5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TailwindIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M12 6c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-2 3.5-2 .8 0 1.5.3 2.2.9 1.1 1 2.5 1.6 4.3 1.6 2.7 0 4.3-1.3 5-4-1 1.3-2.2 2-3.5 2-.8 0-1.5-.3-2.2-.9-1.1-1-2.5-1.6-4.3-1.6zM7 14c-2.7 0-4.3 1.3-5 4 1-1.3 2.2-2 3.5-2 .8 0 1.5.3 2.2.9 1.1 1 2.5 1.6 4.3 1.6 2.7 0 4.3-1.3 5-4-1 1.3-2.2 2-3.5 2-.8 0-1.5-.3-2.2-.9-1.1-1-2.5-1.6-4.3-1.6z"
        fill="#06B6D4"
      />
    </svg>
  );
}

function PostcssIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#DD3A0A" />
      <text
        x="12"
        y="16"
        fontSize="7"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial"
      >
        PC
      </text>
    </svg>
  );
}

function ViteIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L2 20h8l2-4 2 4h8z" fill="#646CFF" />
      <path d="M12 2l10 18h-8l-2-4z" fill="#BD34FE" />
    </svg>
  );
}

function EnvIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#FCD34D" />
      <path
        d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z"
        fill="#92400E"
      />
    </svg>
  );
}

function GitIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M23.5 10.6l-9.1-9.1c-.6-.6-1.6-.6-2.2 0L9.9 3.8l2.4 2.4c.5-.2 1.2-.1 1.6.3.4.4.5 1 .4 1.5l2.3 2.3c.5-.1 1.1 0 1.5.4.6.6.6 1.6 0 2.2-.6.6-1.6.6-2.2 0-.5-.5-.6-1.2-.3-1.8l-2.2-2.2v5.8c.2.1.3.2.4.3.6.6.6 1.6 0 2.2-.6.6-1.6.6-2.2 0-.6-.6-.6-1.6 0-2.2.2-.2.4-.3.6-.4V9.4c-.2-.1-.4-.2-.6-.4-.4-.4-.5-1-.4-1.5L8.8 5.1 2.5 11.4c-.6.6-.6 1.6 0 2.2l9.1 9.1c.6.6 1.6.6 2.2 0l9.1-9.1c.7-.6.7-1.6 0-2.2z"
        fill="#F05032"
      />
    </svg>
  );
}

function ReadmeIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#0879AE" />
      <path
        d="M5 8h2l2 4 2-4h2v8h-2v-5l-2 3-2-3v5H5zM16 12l3-4v8h-2v-5l-2 3"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LicenseIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M12 2L4 6v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V6z"
        fill="#8B5CF6"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EslintIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M12 2L3 7v10l9 5 9-5V7z" fill="#4B32C3" />
      <path
        d="M8 10h8M8 14h6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrettierIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#1A2C34" />
      <rect x="4" y="7" width="3" height="2" fill="#F7B93E" />
      <rect x="8" y="7" width="8" height="2" fill="#56B3B4" />
      <rect x="4" y="10" width="10" height="2" fill="#EA5E5E" />
      <rect x="15" y="10" width="5" height="2" fill="#BF85BF" />
      <rect x="4" y="13" width="5" height="2" fill="#56B3B4" />
      <rect x="10" y="13" width="10" height="2" fill="#F7B93E" />
      <rect x="4" y="16" width="8" height="2" fill="#EA5E5E" />
    </svg>
  );
}

function DockerIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path
        d="M13 3h2v2h-2zM10 3h2v2h-2zM7 3h2v2H7zM4 3h2v2H4zM7 6h2v2H7zM10 6h2v2h-2zM13 6h2v2h-2zM16 6h2v2h-2zM10 9h2v2h-2zM13 9h2v2h-2zM16 9h2v2h-2zM19 9h2v2h-2z"
        fill="#2496ED"
      />
      <path d="M2 14c0 4 3 7 8 7s8-3 8-7H2z" fill="#2496ED" />
    </svg>
  );
}

function DockerComposeIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#2496ED" />
      <path d="M6 8h4v8H6zM14 8h4v8h-4zM10 10h4v4h-4z" fill="white" />
    </svg>
  );
}

function EditorConfigIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#E0EFEF" />
      <path
        d="M8 8l4 4-4 4M12 16h4"
        stroke="#333"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FontIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#F472B6" opacity="0.3" />
      <text
        x="12"
        y="17"
        fontSize="14"
        fontWeight="700"
        fill="#DB2777"
        textAnchor="middle"
        fontFamily="serif"
      >
        A
      </text>
    </svg>
  );
}

function LockFileIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="3" fill="#6B7280" opacity="0.5" />
      <rect x="7" y="11" width="10" height="8" rx="1" fill="#6B7280" />
      <path
        d="M9 11V8a3 3 0 016 0v3"
        stroke="#6B7280"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

/* ==========================================================
   🌳 RESTE DU COMPOSANT (inchangé)
========================================================== */

export default function FileTree({
  nodes,
  activePath,
  modified,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onRefresh,
  projectName = "WORKPILOT",
}: FileTreeProps) {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [creating, setCreating] = useState<{
    type: "file" | "folder";
    parentPath: string;
  } | null>(null);
  const [creatingName, setCreatingName] = useState("");
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    node: NoeudArbre | null;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [ctxMenu]);

  const tries = [...nodes].sort(triDossiers);

  const startCreating = (type: "file" | "folder", parentPath: string = "") => {
    setCreating({ type, parentPath });
    setCreatingName("");
    setCtxMenu(null);
  };

  const submitCreating = () => {
    if (!creating || !creatingName.trim()) {
      setCreating(null);
      return;
    }
    const name = creatingName.trim();
    const fullPath = creating.parentPath
      ? `${creating.parentPath}/${name}`
      : name;
    if (creating.type === "file" && onCreateFile) onCreateFile(fullPath);
    else if (creating.type === "folder" && onCreateFolder)
      onCreateFolder(fullPath);
    setCreating(null);
    setCreatingName("");
  };

  const openContextMenu = (e: React.MouseEvent, node: NoeudArbre | null) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleMenuAction = (action: string) => {
    if (!ctxMenu) return;
    const node = ctxMenu.node;
    switch (action) {
      case "new-file":
        startCreating("file", node?.type === "dossier" ? node.path : "");
        break;
      case "new-folder":
        startCreating("folder", node?.type === "dossier" ? node.path : "");
        break;
      case "rename":
        if (node && onRename) {
          window.__wp_rename_node = node.path;
          window.dispatchEvent(new CustomEvent("wp:start-rename"));
        }
        setCtxMenu(null);
        break;
      case "delete":
        if (node && onDelete) onDelete(node.path);
        setCtxMenu(null);
        break;
    }
  };

  return (
    <div ref={containerRef} className="flex h-full flex-col select-none">
      <div className="border-b border-white/5 px-3 py-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          <button
            onClick={() => setSectionOpen((o) => !o)}
            className="flex items-center gap-1 hover:text-gray-200"
          >
            {sectionOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            <span>Explorateur</span>
          </button>
        </div>
      </div>

      {sectionOpen && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="group flex items-center justify-between border-b border-white/5 px-2 py-1">
            <button
              onClick={() => setSectionOpen(true)}
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-gray-300"
            >
              <ChevronDown className="h-3 w-3" />
              {projectName}
            </button>
            <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => startCreating("file")}
                className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                title="Nouveau fichier"
              >
                <FilePlus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => startCreating("folder")}
                className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                title="Nouveau dossier"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                  title="Rafraîchir"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setSectionOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                title="Réduire"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div
            className="wp-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-0.5 text-[13px]"
            onContextMenu={(e) => openContextMenu(e, null)}
          >
            {creating && creating.parentPath === "" && (
              <CreatingInput
                type={creating.type}
                value={creatingName}
                onChange={setCreatingName}
                onSubmit={submitCreating}
                onCancel={() => setCreating(null)}
                depth={0}
              />
            )}
            {tries.map((node) => (
              <TreeNode
                key={node.path}
                node={node}
                depth={0}
                activePath={activePath}
                modified={modified}
                onSelect={onSelect}
                onDelete={onDelete}
                onRename={onRename}
                onContextMenu={openContextMenu}
                creating={creating}
                creatingName={creatingName}
                setCreatingName={setCreatingName}
                submitCreating={submitCreating}
                cancelCreating={() => setCreating(null)}
              />
            ))}
            {tries.length === 0 && !creating && (
              <div className="px-3 py-4 text-center text-xs text-gray-500">
                Aucun fichier
              </div>
            )}
          </div>
        </div>
      )}

      {ctxMenu && (
        <div
          className="fixed z-50 min-w-45 rounded border border-white/10 bg-[#252526] py-1 text-[13px] shadow-2xl"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            icon={<FilePlus className="h-3.5 w-3.5" />}
            label="Nouveau fichier"
            onClick={() => handleMenuAction("new-file")}
          />
          <MenuItem
            icon={<FolderPlus className="h-3.5 w-3.5" />}
            label="Nouveau dossier"
            onClick={() => handleMenuAction("new-folder")}
          />
          {ctxMenu.node && (
            <>
              <div className="my-1 border-t border-white/5" />
              <MenuItem
                icon={<Edit3 className="h-3.5 w-3.5" />}
                label="Renommer"
                shortcut="F2"
                onClick={() => handleMenuAction("rename")}
              />
              <MenuItem
                icon={<Trash2 className="h-3.5 w-3.5" />}
                label="Supprimer"
                shortcut="Del"
                danger
                onClick={() => handleMenuAction("delete")}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1 text-left ${danger ? "text-red-400 hover:bg-red-500/20" : "text-gray-200 hover:bg-[#094771]"}`}
    >
      <span className="w-4 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-gray-500">{shortcut}</span>}
    </button>
  );
}

function CreatingInput({
  type,
  value,
  onChange,
  onSubmit,
  onCancel,
  depth,
}: {
  type: "file" | "folder";
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  depth: number;
}) {
  return (
    <div
      className="flex items-center gap-1 bg-[#094771] px-2 py-0.5"
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
    >
      {type === "folder" ? (
        <FolderOpen className="h-4 w-4 shrink-0 text-[#D4A84B]" />
      ) : (
        <FileIcon name={value || "file.txt"} />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={onSubmit}
        placeholder={type === "folder" ? "nom-du-dossier" : "nom-fichier"}
        className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-gray-500"
        autoFocus
      />
    </div>
  );
}

function triDossiers(a: NoeudArbre, b: NoeudArbre): number {
  if (a.type !== b.type) return a.type === "dossier" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

interface TreeNodeProps {
  node: NoeudArbre;
  depth: number;
  activePath: string;
  modified: Record<string, string>;
  onSelect: (path: string) => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onContextMenu: (e: React.MouseEvent, node: NoeudArbre) => void;
  creating: { type: "file" | "folder"; parentPath: string } | null;
  creatingName: string;
  setCreatingName: (v: string) => void;
  submitCreating: () => void;
  cancelCreating: () => void;
}

function TreeNode({
  node,
  depth,
  activePath,
  modified,
  onSelect,
  onDelete,
  onRename,
  onContextMenu,
  creating,
  creatingName,
  setCreatingName,
  submitCreating,
  cancelCreating,
}: TreeNodeProps) {
  const [open, setOpen] = useState(depth < 2);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);

  useEffect(() => {
    const handler = () => {
      const target = window.__wp_rename_node;
      if (target === node.path) {
        setIsRenaming(true);
        setRenameValue(node.name);
      }
    };
    window.addEventListener("wp:start-rename", handler);
    return () => window.removeEventListener("wp:start-rename", handler);
  }, [node.path, node.name]);

  const submitRename = () => {
    if (renameValue.trim() && renameValue !== node.name && onRename) {
      const parentPath = node.path.split("/").slice(0, -1).join("/");
      const newPath = parentPath ? `${parentPath}/${renameValue}` : renameValue;
      onRename(node.path, newPath);
    }
    setIsRenaming(false);
  };

  if (node.type === "dossier") {
    const showCreatingHere =
      creating && creating.parentPath === node.path && open;
    return (
      <div>
        <button
          className={`group flex w-full items-center gap-1 py-0.5 text-[13px] text-gray-300 hover:bg-white/5 ${activePath.startsWith(node.path + "/") ? "bg-white/3" : ""}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setOpen((o) => !o)}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          )}
          {open ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-[#D4A84B]" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-[#D4A84B]" />
          )}
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              onBlur={submitRename}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-[#3c3c3c] px-1 text-white outline-none ring-1 ring-[#007acc]"
              autoFocus
            />
          ) : (
            <span className="truncate">{node.name}</span>
          )}
        </button>
        {open && (
          <div>
            {showCreatingHere && (
              <CreatingInput
                type={creating!.type}
                value={creatingName}
                onChange={setCreatingName}
                onSubmit={submitCreating}
                onCancel={cancelCreating}
                depth={depth + 1}
              />
            )}
            {[...(node.children ?? [])].sort(triDossiers).map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                modified={modified}
                onSelect={onSelect}
                onDelete={onDelete}
                onRename={onRename}
                onContextMenu={onContextMenu}
                creating={creating}
                creatingName={creatingName}
                setCreatingName={setCreatingName}
                submitCreating={submitCreating}
                cancelCreating={cancelCreating}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = activePath === node.path;
  const isModified = modified[node.path] !== undefined;

  return (
    <button
      className={`group relative flex w-full items-center gap-1 py-0.5 text-[13px] ${isActive ? "bg-[#094771] text-white" : "text-gray-300 hover:bg-white/5"}`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
      onClick={() => onSelect(node.path)}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      <FileIcon name={node.name} />
      {isRenaming ? (
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRename();
            if (e.key === "Escape") setIsRenaming(false);
          }}
          onBlur={submitRename}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-[#3c3c3c] px-1 text-white outline-none ring-1 ring-[#007acc]"
          autoFocus
        />
      ) : (
        <span className="flex-1 truncate text-left">
          {node.name}
          {isModified && <span className="ml-1 text-amber-400">●</span>}
        </span>
      )}
    </button>
  );
}
