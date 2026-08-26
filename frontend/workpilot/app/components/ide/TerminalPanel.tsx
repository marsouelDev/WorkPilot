"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

declare global {
  interface Window {
    __wp_project_name?: string;
  }
}

interface TerminalPanelProps {
  active: boolean;
  wc?: WebContainer | null;
  cwd?: string;
  onFsChange?: () => void;
}

function TerminalPanel({ active, wc, cwd, onFsChange }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  /* Garde anti re-spawn : mémorise le dernier couple (wc, cwd) */
  const lastWcRef = useRef<WebContainer | null>(null);
  const lastCwdRef = useRef<string | null>(null);

  const onFsChangeRef = useRef(onFsChange);
  useEffect(() => {
    onFsChangeRef.current = onFsChange;
  });

  const [isReady, setIsReady] = useState(false);

  /*  Initialisation du terminal 1 seule fois */
  useEffect(() => {
    if (!containerRef.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "JetBrains Mono, monospace",
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;
    setIsReady(true);

    return () => {
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      setIsReady(false);
    };
  }, []);

  /*  Fit au resize  */
  useEffect(() => {
    if (!active) return;

    const handleResize = () => {
      try {
        fitAddonRef.current?.fit();
      } catch {
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [active]);

  /*  Connexion au shell relancée si wc OU cwd change  */
  useEffect(() => {
    const term = termRef.current;
    if (!isReady || !wc || !term) return;

    const cwdFinal = cwd || "/";

    /* Même instance + même cwd → on ne relance PAS le shell */
    if (lastWcRef.current === wc && lastCwdRef.current === cwdFinal) return;
    lastWcRef.current = wc;
    lastCwdRef.current = cwdFinal;

    let shellProcess: WebContainerProcess | null = null;
    let inputDisposable: { dispose: () => void } | null = null;
    let cancelled = false;

    const startShell = async () => {
      try {
        /* ✅ jsh démarre DANS la racine du projet */
        try {
          shellProcess = await wc.spawn("jsh", {
            terminal: { cols: term.cols, rows: term.rows },
            cwd: cwdFinal,
            env: { TERM: "xterm-256color", HOME: "/home" },
          });
        } catch (e) {
          console.warn("⚠️ jsh avec cwd échoué, retry sans cwd :", e);
          shellProcess = await wc.spawn("jsh", {
            terminal: { cols: term.cols, rows: term.rows },
          });
        }

        if (cancelled) {
          shellProcess.kill();
          return;
        }

        /* Remplace le hostname auto-généré par le nom du projet */
        const nettoyer = (data: string) => {
          const nom = window.__wp_project_name;
          if (!nom) return data;
          return data.replace(/~\/[^@\s]+@[^\s>]+/g, `~/${nom}`);
        };

        /* Output shell → terminal */
        const reader = shellProcess.output.getReader();
        const lire = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              term.write(nettoyer(value));
            }
          } catch {
          }
        };
        void lire();

        /* Input terminal → shell */
        const writer = shellProcess.input.getWriter();

        inputDisposable = term.onData((data) => {
          writer.write(data).catch(() => {});

          if (data === "\r" && onFsChangeRef.current) {
            window.setTimeout(() => onFsChangeRef.current?.(), 1000);
          }
        });

        term.writeln("");
      } catch (error) {
        term.writeln(
          `\x1b[31mErreur shell : ${(error as Error).message}\x1b[0m`,
        );
      }
    };

    void startShell();

    return () => {
      cancelled = true;
      inputDisposable?.dispose();
      shellProcess?.kill();
    };
  }, [isReady, wc, cwd]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-[#1e1e1e] p-1"
      style={{ display: active ? "block" : "none" }}
    />
  );
}

export default memo(TerminalPanel);
