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

function getIconForFile(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    ts: "#3178C6",
    tsx: "#3178C6",
    js: "#F7DF1E",
    jsx: "#61DAFB",
    json: "#F7DF1E",
    md: "#519ABA",
    css: "#563D7C",
    scss: "#CD6799",
    html: "#E34F26",
    svg: "#FFB13B",
    png: "#A074C4",
    jpg: "#A074C4",
    gif: "#A074C4",
    py: "#3572A5",
    go: "#00ADD8",
    rs: "#DEA584",
    ico:"#B95F00"
  };

  return colorMap[ext] ?? "#858585";
}

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

  /* Menu contextuel */
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

  /*  Création  */

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

    if (creating.type === "file" && onCreateFile) {
      onCreateFile(fullPath);
    } else if (creating.type === "folder" && onCreateFolder) {
      onCreateFolder(fullPath);
    }

    setCreating(null);
    setCreatingName("");
  };

  /*  Menu contextuel  */

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
        if (node && onDelete) {
          onDelete(node.path);
        }
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

      {/* MENU CONTEXTUEL */}
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

/*  MENU ITEM  */

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
      className={`flex w-full items-center gap-2 px-3 py-1 text-left ${
        danger
          ? "text-red-400 hover:bg-red-500/20"
          : "text-gray-200 hover:bg-[#094771]"
      }`}
    >
      <span className="w-4 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-gray-500">{shortcut}</span>}
    </button>
  );
}

/* ] INPUT DE CRÉATION  */

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
        <FolderOpen className="h-4 w-4 shrink-0 text-[#6366F1]" />
      ) : (
        <File
          className="h-4 w-4 shrink-0"
          style={{ color: getIconForFile(value) }}
        />
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

/*  TRI  */

function triDossiers(a: NoeudArbre, b: NoeudArbre): number {
  if (a.type !== b.type) return a.type === "dossier" ? -1 : 1;
  return a.name.localeCompare(b.name);
}

/*  TREE NODE  */

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

  /*  DOSSIER  */
  if (node.type === "dossier") {
    const showCreatingHere =
      creating && creating.parentPath === node.path && open;

    return (
      <div>
        <button
          className={`group flex w-full items-center gap-1 py-0.5 text-[13px] text-gray-300 hover:bg-white/5 ${
            activePath.startsWith(node.path + "/") ? "bg-white/3" : ""
          }`}
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
            <FolderOpen className="h-4 w-4 shrink-0 text-[#6366F1]" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-[#6366F1]" />
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

  /*  FICHIER  */
  const isActive = activePath === node.path;
  const isModified = modified[node.path] !== undefined;
  const fileColor = getIconForFile(node.name);

  return (
    <button
      className={`group relative flex w-full items-center gap-1 py-0.5 text-[13px] ${
        isActive ? "bg-[#094771] text-white" : "text-gray-300 hover:bg-white/5"
      }`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
      onClick={() => onSelect(node.path)}
      onContextMenu={(e) => onContextMenu(e, node)}
    >
      <File className="h-4 w-4 shrink-0" style={{ color: fileColor }} />

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
