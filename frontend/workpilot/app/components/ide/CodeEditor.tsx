"use client";

import { useEffect, useMemo, useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

/* Monaco bundlé en local */
loader.config({ monaco });

/* Worker noop pour éviter les erreurs COEP */
if (typeof window !== "undefined") {
  const NoopWorker = function () {
    return {
      postMessage: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      terminate: () => {},
      onmessage: null,
      onerror: null,
    };
  };

  (window as { MonacoEnvironment?: unknown }).MonacoEnvironment = {
    getWorker: () => NoopWorker(),
    getWorkerUrl: () => "",
  };

  try {
    // @ts-expect-error - API dépréciée dans Monaco 0.40+
    monaco.languages.typescript?.typescriptDefaults?.setDiagnosticsOptions?.({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    // @ts-expect-error - API dépréciée dans Monaco 0.40+
    monaco.languages.typescript?.javascriptDefaults?.setDiagnosticsOptions?.({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  } catch {}
}

const EXT_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  md: "markdown",
  py: "python",
  java: "java",
  cs: "csharp",
  go: "go",
  rs: "rust",
  php: "php",
  rb: "ruby",
  sh: "shell",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  vue: "html",
  svg: "xml",
  txt: "plaintext",
};

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return EXT_LANG[ext] ?? "plaintext";
}

function normalizePath(rawPath: string): string {
  const cleaned = rawPath
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/")
    .replace(/\/+$/, "");
  return cleaned || "untitled";
}

interface CodeEditorProps {
  path: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ path, value, onChange }: CodeEditorProps) {
  const onChangeRef = useRef(onChange);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const safePath = useMemo(() => normalizePath(path), [path]);
  const language = useMemo(() => langFromPath(safePath), [safePath]);

  /*Cleanup propre au démontage */
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.dispose();
        } catch {}
      }
    };
  }, []);

  /* Dispose l'ancien modèle quand le path change */
  useEffect(() => {
    const model = monaco.editor.getModel(
      monaco.Uri.parse(`file:///${safePath}`),
    );
    if (model) {
      try {
        model.dispose();
      } catch {}
    }
  }, [safePath]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 13,
      tabSize: 2,
      wordWrap: "on",
      automaticLayout: true,
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      parameterHints: { enabled: false },
      hover: { enabled: "off" },
      codeLens: false,
      folding: true,
      scrollBeyondLastLine: false,
    });
  };

  return (
    <Editor
      key={safePath}
      height="100%"
      theme="vs-dark"
      path={safePath}
      language={language}
      value={value}
      onMount={handleMount}
      onChange={(v) => onChangeRef.current(v ?? "")}
      loading={
        <div className="flex h-full items-center justify-center bg-[#0b0b12] text-sm text-gray-500">
          Chargement de l&apos;éditeur…
        </div>
      }
    />
  );
}
