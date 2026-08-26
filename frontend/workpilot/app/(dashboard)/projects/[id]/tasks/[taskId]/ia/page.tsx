"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CloudDownload,
  CloudUpload,
  Code2,
  Eye,
  GitBranch,
  GitPullRequest,
  GripVertical,
  Loader2,
  Lock,
  Plus,
  Save,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";
import {
  Panel as ResizablePanel,
  PanelGroup as ResizablePanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TerminalPanel from "@/app/components/ide/TerminalPanel";
import FileTree from "@/app/components/ide/FileTree";
import PreviewPanel from "@/app/components/ide/PreviewPanel";
import AssistanceIaChat from "@/app/components/assistance-ia/AssistanceChat";
import { useAuthStore } from "@/stores/authStore";
import {
  bootWebContainer,
  construireArbre,
  pipeOutput,
  toFileSystemTree,
} from "@/lib/webcontainer";
import { chargerDraft, sauvegarderDraft, supprimerDraft } from "@/lib/drafts";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(() => import("@/app/components/ide/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0b0b12] text-sm text-gray-500">
      Chargement de l&apos;éditeur…
    </div>
  ),
});

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    onChange(mql);
    mql.addEventListener(
      "change",
      onChange as (e: MediaQueryListEvent) => void,
    );
    return () =>
      mql.removeEventListener(
        "change",
        onChange as (e: MediaQueryListEvent) => void,
      );
  }, [breakpoint]);

  return isMobile;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const A_IGNORE = [
  "node_modules",
  ".git",
  "dist",
  ".next",
  "coverage",
  ".angular",
];

const HAUTEUR_HEADER_TERMINAL = 36;

const cleanAnsi = (s: string) =>
  s
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g, "")
    .replace(/\x1b[=>]/g, "")
    .replace(/\[[0-9]+G/g, "")
    .trim();

interface PkgJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

type Framework =
  | "next"
  | "angular"
  | "nestjs"
  | "vue-cli"
  | "vite"
  | "cra"
  | "scripts";

function detecterFramework(pkg: PkgJson): { fw: Framework; major: number } {
  const deps: Record<string, string> = {
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };

  const majorOf = (v?: string) =>
    v ? parseInt((v.match(/\d+/) ?? ["0"])[0], 10) : 0;

  if (deps.next) return { fw: "next", major: majorOf(deps.next) };
  if (deps["@angular/core"])
    return { fw: "angular", major: majorOf(deps["@angular/core"]) };
  if (deps["@nestjs/core"])
    return { fw: "nestjs", major: majorOf(deps["@nestjs/core"]) };
  if (deps["@vue/cli-service"]) return { fw: "vue-cli", major: 0 };
  if (deps.vite) return { fw: "vite", major: majorOf(deps.vite) };
  if (deps["react-scripts"]) return { fw: "cra", major: 0 };
  return { fw: "scripts", major: 0 };
}

function commandeDev(
  fw: Framework,
  major: number,
): { command: string; args: string[]; label: string } {
  switch (fw) {
    case "next":
      return major >= 16
        ? {
            command: "npx",
            args: ["next", "dev", "--webpack", "--port", "3000"],
            label: "Next 16 (webpack)",
          }
        : {
            command: "npx",
            args: ["next", "dev", "--port", "3000"],
            label: "Next ≤15",
          };
    case "angular":
      return {
        command: "npx",
        args: ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"],
        label: "Angular",
      };
    case "nestjs":
      return {
        command: "npx",
        args: ["nest", "start", "--watch"],
        label: "NestJS",
      };
    case "vue-cli":
      return {
        command: "npx",
        args: ["vue-cli-service", "serve", "--port", "3000"],
        label: "Vue (CLI)",
      };
    case "vite":
      return {
        command: "npx",
        args: ["vite", "--host", "0.0.0.0", "--port", "3000"],
        label: "Vite (Vue/React)",
      };
    case "cra":
      return {
        command: "npx",
        args: ["react-scripts", "start"],
        label: "React CRA",
      };
    default:
      return { command: "npm", args: ["run", "dev"], label: "npm run dev" };
  }
}

function detecterHtmlRoot(record: Record<string, string>): string | null {
  const htmlFiles = Object.keys(record)
    .filter((k) => k.endsWith("/index.html") || k === "index.html")
    .sort((a, b) => a.split("/").length - b.split("/").length);

  if (htmlFiles.length === 0) return null;

  const htmlPath = htmlFiles[0];
  return htmlPath === "index.html"
    ? "/"
    : "/" + htmlPath.slice(0, htmlPath.lastIndexOf("/"));
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function ResizableHandle() {
  return (
    <PanelResizeHandle className="relative flex w-px items-center justify-center bg-white/10 hover:bg-[#6366F1]/60 focus-visible:outline-none data-[resize-handle-state=drag]:bg-[#6366F1]">
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-white/20 bg-[#181818]">
        <GripVertical className="h-2.5 w-2.5 text-gray-500" />
      </div>
    </PanelResizeHandle>
  );
}

interface Tache {
  id: number;
  titre: string;
  assigneeId?: number | null;
}

interface BrancheDetaillee {
  name: string;
  protected: boolean;
  isDefault: boolean;
}

interface FichierGitHub {
  path: string;
  content: string;
}

interface ReponseChargement {
  branche: string;
  brancheDefaut: string;
  repriseTravail: boolean;
  commit: { sha: string; message: string };
  fichiers: FichierGitHub[];
  dossiers?: string[];
}

interface ReponseTaches {
  taches?: Tache[];
  data?: Tache[];
  items?: Tache[];
}

interface ReponseProjet {
  nom?: string;
  titre?: string;
  name?: string;
  depotGitUrl?: string;
}

interface ReponseSync {
  branche: string;
  commit: string;
}

export default function IdePage() {
  const params = useParams();
  const projetId = Number(params.id);
  const router = useRouter();
  const { token, user } = useAuthStore();
  const isMobile = useIsMobile(768);

  const [viewMode, setViewMode] = useState<"code" | "preview">("code");

  useEffect(() => {
    if (isMobile && viewMode === "preview") {
      // L'utilisateur a choisi aperçu sur mobile on laisser
    }
  }, [isMobile, viewMode]);

  const [info, setInfo] = useState<{
    branche: string;
    brancheDefaut: string;
    repriseTravail: boolean;
    commit: { sha: string; message: string };
  } | null>(null);

  const [fichiers, setFichiers] = useState<Record<string, string>>({});
  const [activePath, setActivePath] = useState("");
  const [modified, setModified] = useState<Record<string, string>>({});
  const [nomProjet, setNomProjet] = useState("WorkPilot");
  const [depotGitUrl, setDepotGitUrl] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<string[]>([]);
  const [projectRoot, setProjectRoot] = useState("/");

  const [statut, setStatut] = useState<string>(() => {
    if (!API_URL) return "Config manquante";
    if (!token || !projetId || isNaN(projetId)) return "Non connecté";
    return "Chargement...";
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* ✅ branchesDetail au lieu de branches */
  const [branchesDetail, setBranchesDetail] = useState<BrancheDetaillee[]>([]);
  const [brancheCourante, setBrancheCourante] = useState("");
  const [isChangingBranche, setIsChangingBranche] = useState(false);

  const [brancheCible, setBrancheCible] = useState("");
  const [dialogBranche, setDialogBranche] = useState(false);
  const [nomBranche, setNomBranche] = useState("");
  const [dialogPr, setDialogPr] = useState(false);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [tachePr, setTachePr] = useState<number | "">("");
  const [titrePr, setTitrePr] = useState("");

  const [tacheIaId, setTacheIaId] = useState<number | null>(null);
  const tacheIaInitRef = useRef(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);

  const [terminals, setTerminals] = useState<number[]>([1]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const nextTerminalId = useRef(2);

  const [termCollapsed, setTermCollapsed] = useState(false);
  const [termHeight, setTermHeight] = useState(260);
  const termHeightRef = useRef(260);
  const centerRef = useRef<HTMLDivElement>(null);

  const wcRef = useRef<WebContainer | null>(null);
  const processRef = useRef<WebContainerProcess | null>(null);
  const [wcInstance, setWcInstance] = useState<WebContainer | null>(null);

  const nombreModifs = Object.keys(modified).length;
  const brancheActive = brancheCible || brancheCourante || info?.branche || "";

  const getTerminalName = (id: number) => {
    const base = nomProjet && nomProjet !== "WorkPilot" ? nomProjet : "Projet";
    return `${base} #${id}`;
  };

  const fichiersArray = useMemo(
    () =>
      Object.entries(fichiers).map(([path, content]) => ({ path, content })),
    [fichiers],
  );

  const arbre = useMemo(
    () => construireArbre(fichiersArray, dossiers),
    [fichiersArray, dossiers],
  );

  useEffect(() => {
    const logError = (e: ErrorEvent) => {
      console.error("ERREUR GLOBALE :", e.error ?? e.message);
    };
    const logRejection = (e: PromiseRejectionEvent) => {
      console.error("PROMESSE REJETÉE :", e.reason);
    };
    window.addEventListener("error", logError);
    window.addEventListener("unhandledrejection", logRejection);
    return () => {
      window.removeEventListener("error", logError);
      window.removeEventListener("unhandledrejection", logRejection);
    };
  }, []);

  useEffect(() => {
    if (!API_URL || !token || !projetId || isNaN(projetId) || !user?.id) return;

    let cancelled = false;
    const norm = (p: string) => p.replace(/^\.?\/+/, "");

    const run = async () => {
      try {
        setStatut("Téléchargement...");

        let res: Response;
        try {
          res = await fetch(
            `${API_URL}/projects/${projetId}/chargement-github`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(60_000),
            },
          );
        } catch {
          setStatut("Backend injoignable");
          return;
        }

        if (!res.ok) {
          setStatut(`Erreur ${res.status}`);
          return;
        }

        const data = (await res.json()) as ReponseChargement;
        if (cancelled) return;

        setInfo({
          branche: data.branche,
          brancheDefaut: data.brancheDefaut,
          repriseTravail: data.repriseTravail,
          commit: data.commit,
        });
        setBrancheCourante(data.branche);

        const record: Record<string, string> = {};
        for (const f of data.fichiers ?? []) {
          if (f.path) record[norm(f.path)] = f.content ?? "";
        }

        setFichiers(record);
        setDossiers((data.dossiers ?? []).map(norm));
        setActivePath(Object.keys(record)[0] ?? "");

        const clesPkg = Object.keys(record)
          .filter((k) => k === "package.json" || k.endsWith("/package.json"))
          .sort((a, b) => a.split("/").length - b.split("/").length);
        const pkgKey = clesPkg[0];
        const pkgContent = pkgKey ? record[pkgKey] : undefined;

        const root =
          pkgKey && pkgKey !== "package.json"
            ? "/" + pkgKey.slice(0, pkgKey.lastIndexOf("/"))
            : "/";
        setProjectRoot(root);

        try {
          const resProjet = await fetch(`${API_URL}/projects/${projetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resProjet.ok) {
            const projet = (await resProjet.json()) as ReponseProjet;
            const nom =
              projet.nom ??
              projet.titre ??
              projet.name ??
              (projet.depotGitUrl
                ? (projet.depotGitUrl.split("/").pop() ?? "WorkPilot")
                : "WorkPilot");
            setNomProjet(nom);
            setDepotGitUrl(projet.depotGitUrl ?? null);
          }
        } catch {}

        /* Chargement des branches détaillées */
        try {
          const resBr = await fetch(
            `${API_URL}/projects/${projetId}/branches-detaillees`,
            {
              headers: { Authorization: `Bearer ${token}` },
              signal: AbortSignal.timeout(60_000),
            },
          );
          if (resBr.ok) {
            const dataBr = (await resBr.json()) as BrancheDetaillee[];
            if (Array.isArray(dataBr) && dataBr.length > 0) {
              setBranchesDetail(dataBr);
            } else {
              setBranchesDetail(
                [
                  {
                    name: data.brancheDefaut,
                    protected: true,
                    isDefault: true,
                  },
                  ...(data.brancheDefaut !== data.branche
                    ? [
                        {
                          name: data.branche,
                          protected: false,
                          isDefault: false,
                        },
                      ]
                    : []),
                ].filter((b) => b.name),
              );
            }
          } else {
            setBranchesDetail(
              [
                { name: data.brancheDefaut, protected: true, isDefault: true },
                ...(data.brancheDefaut !== data.branche
                  ? [{ name: data.branche, protected: false, isDefault: false }]
                  : []),
              ].filter((b) => b.name),
            );
          }
        } catch {
          setBranchesDetail(
            [
              { name: data.brancheDefaut, protected: true, isDefault: true },
              ...(data.brancheDefaut !== data.branche
                ? [{ name: data.branche, protected: false, isDefault: false }]
                : []),
            ].filter((b) => b.name),
          );
        }

        try {
          const resTaches = await fetch(
            `${API_URL}/projects/${projetId}/taches`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (resTaches.ok) {
            const rawData = (await resTaches.json()) as Tache[] | ReponseTaches;
            const liste: Tache[] = Array.isArray(rawData)
              ? rawData
              : Array.isArray(rawData.taches)
                ? rawData.taches
                : Array.isArray(rawData.data)
                  ? rawData.data
                  : Array.isArray(rawData.items)
                    ? rawData.items
                    : [];
            setTaches(liste);
            if (!tacheIaInitRef.current) {
              const premiere = liste.find(
                (t) => t.assigneeId === Number(user.id),
              );
              if (premiere) setTacheIaId(premiere.id);
              tacheIaInitRef.current = true;
            }
          }
        } catch {}

        setStatut("Boot WebContainer...");
        const wc = await bootWebContainer();
        if (cancelled) return;
        wcRef.current = wc;
        setWcInstance(wc);

        setStatut("Montage...");
        const tree = toFileSystemTree(
          construireArbre(
            Object.entries(record).map(([path, content]) => ({
              path,
              content,
            })),
            (data.dossiers ?? []).map(norm),
          ),
        );

        try {
          await wc.mount(tree);
        } catch (e) {
          console.warn("mount échoué, fallback writeFile :", e);
          for (const [path, content] of Object.entries(record)) {
            try {
              const dir = path.substring(0, path.lastIndexOf("/"));
              if (dir)
                await wc.fs
                  .mkdir(`/${dir}`, { recursive: true })
                  .catch(() => {});
              await wc.fs.writeFile(`/${path}`, content);
            } catch {}
          }
        }

        const draft = chargerDraft(projetId, Number(user.id));
        if (draft && Object.keys(draft).length > 0) {
          for (const [path, content] of Object.entries(draft)) {
            setModified((prev) => ({ ...prev, [path]: content }));
            setFichiers((prev) => ({ ...prev, [path]: content }));
            await wc.fs.writeFile(`/${path}`, content).catch(() => {});
          }
        }

        if (!pkgContent) {
          const htmlRoot = detecterHtmlRoot(record);

          if (htmlRoot) {
            setStatut("Démarrage serveur statique...");

            const dev = await wc.spawn(
              "npx",
              ["-y", "serve@latest", "-l", "3000", "-s", "."],
              { cwd: htmlRoot },
            );
            processRef.current = dev;

            wc.on("server-ready", (_port, url) => {
              if (cancelled) return;
              setPreviewUrl(url);
              setStatut("Serveur prêt (HTML)");
            });

            pipeOutput(dev, (chunk) => {
              const line = cleanAnsi(chunk);
              if (line) console.log("[serve]", line);

              if (
                /Accepting connections|listening on|Local:|Serving!/i.test(line)
              ) {
                setStatut("✅ Serveur prêt (HTML)");
              } else if (/error|Error|ERR!/.test(line)) {
                setStatut(`${line.slice(0, 60)}`);
              }
            });

            return;
          }

          setStatut("Mode édition");
          return;
        }

        wc.on("server-ready", (_port, url) => {
          if (cancelled) return;
          setPreviewUrl(url);
          setStatut("✅ Serveur prêt");
        });

        let fw: Framework = "scripts";
        let fwMajor = 0;
        try {
          const det = detecterFramework(JSON.parse(pkgContent) as PkgJson);
          fw = det.fw;
          fwMajor = det.major;
        } catch (e) {
          console.warn("Lecture package.json :", e);
        }

        if (fw === "next" && fwMajor >= 16) {
          setStatut("Configuration Webpack (Next 16)...");
          const pkgSet1 = await wc.spawn(
            "npm",
            ["pkg", "set", "scripts.dev=next dev --webpack"],
            { cwd: root },
          );
          await pkgSet1.exit;
        }

        if (fw === "next") {
          let hasNextConfig = false;
          for (const cfg of [
            "next.config.js",
            "next.config.mjs",
            "next.config.ts",
          ]) {
            try {
              await wc.fs.readFile(`${root}/${cfg}`);
              hasNextConfig = true;
              break;
            } catch {}
          }
          if (!hasNextConfig) {
            await wc.fs.writeFile(
              `${root}/next.config.js`,
              `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;\n`,
            );
          }
        }

        setStatut("npm install... (2-5 min la 1ère fois)");
        const install = await wc.spawn(
          "npm",
          ["install", "--no-audit", "--no-fund", "--loglevel=error"],
          { cwd: root },
        );

        let lastUpdate = 0;
        pipeOutput(install, (chunk) => {
          const line = cleanAnsi(chunk.split("\n").pop() ?? "");
          if (line) console.log("[npm install]", line);
          const now = Date.now();
          if (line.length > 3 && now - lastUpdate > 1000) {
            lastUpdate = now;
            setStatut(`📦 ${line.slice(0, 60)}`);
          }
        });

        const codeInstall = await install.exit;
        if (codeInstall !== 0) {
          setStatut(`npm install échoué (code ${codeInstall})`);
          toast.error("npm install a échoué");
          return;
        }

        setStatut("Démarrage du serveur...");

        const {
          command: initialCommand,
          args: initialArgs,
          label,
        } = commandeDev(fw, fwMajor);
        let command = initialCommand;
        let args = initialArgs;

        if (fw === "scripts") {
          try {
            const parsed = JSON.parse(pkgContent) as PkgJson;
            if (parsed.scripts?.dev) {
              command = "npm";
              args = ["run", "dev"];
            } else if (parsed.scripts?.start) {
              command = "npm";
              args = ["run", "start"];
            }
          } catch {}
        }

        console.log("Démarrage :", label, command, args.join(" "));

        const dev = await wc.spawn(command, args, {
          cwd: root,
          env: {
            NODE_ENV: "development",
            BROWSER: "none",
            DANGEROUSLY_DISABLE_HOST_CHECK: "true",
          },
        });
        processRef.current = dev;

        pipeOutput(dev, (chunk) => {
          const line = cleanAnsi(chunk);
          if (line) console.log("[server]", line);

          if (
            /Ready in|ready started|Local:|listening on|Compiled successfully|App running at|webpack compiled|built in|Nest application successfully started|Angular Live Development Server/i.test(
              line,
            )
          ) {
            setStatut("Serveur prêt");
          } else if (/error|Error|ERR!/.test(line)) {
            setStatut(`${line.slice(0, 60)}`);
          }
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Erreur inattendue :", error);
          setStatut(`${(error as Error).message ?? "Erreur"}`);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [token, projetId, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(() => {
      sauvegarderDraft(projetId, Number(user.id), modified);
    }, 500);
    return () => clearTimeout(timer);
  }, [modified, projetId, user?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "Backquote") {
        e.preventDefault();
        setTermCollapsed((c) => !c);
        setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleEdit = useCallback((value: string) => {
    setActivePath((current) => {
      if (!current) return current;
      setFichiers((prev) => ({ ...prev, [current]: value }));
      setModified((prev) => ({ ...prev, [current]: value }));
      return current;
    });
  }, []);

  const sauvegarder = async () => {
    const wc = wcRef.current;
    if (!wc || nombreModifs === 0) return;
    try {
      await Promise.all(
        Object.entries(modified).map(([path, content]) =>
          wc.fs.writeFile(`/${path}`, content),
        ),
      );
      toast.success(
        `${nombreModifs} modification(s) écrite(s) dans le WebContainer`,
      );
    } catch (error) {
      toast.error(`Écriture impossible : ${(error as Error).message}`);
    }
  };

  const appliquerChargement = async (data: ReponseChargement) => {
    setInfo({
      branche: data.branche,
      brancheDefaut: data.brancheDefaut,
      repriseTravail: data.repriseTravail,
      commit: data.commit,
    });

    const norm = (p: string) => p.replace(/^\.?\/+/, "");

    const record: Record<string, string> = {};
    for (const f of data.fichiers ?? []) {
      if (f.path) record[norm(f.path)] = f.content ?? "";
    }

    setFichiers(record);
    setDossiers((data.dossiers ?? []).map(norm));
    setModified({});
    if (!record[activePath]) {
      setActivePath(Object.keys(record)[0] ?? "");
    }

    const clesPkg = Object.keys(record)
      .filter((k) => k === "package.json" || k.endsWith("/package.json"))
      .sort((a, b) => a.split("/").length - b.split("/").length);
    const pkgKey = clesPkg[0];
    const newRoot =
      pkgKey && pkgKey !== "package.json"
        ? "/" + pkgKey.slice(0, pkgKey.lastIndexOf("/"))
        : "/";
    setProjectRoot(newRoot);

    const wc = wcRef.current;
    if (!wc) return;

    try {
      const tree = toFileSystemTree(
        construireArbre(
          Object.entries(record).map(([path, content]) => ({
            path,
            content,
          })),
          (data.dossiers ?? []).map(norm),
        ),
      );
      await wc.mount(tree);
    } catch {
      await Promise.all(
        Object.entries(record).map(([path, content]) =>
          wc.fs.writeFile(`/${path}`, content).catch(() => {}),
        ),
      );
    }

    try {
      const pkg = record[pkgKey ?? "package.json"];
      if (pkg) {
        const det = detecterFramework(JSON.parse(pkg) as PkgJson);
        if (det.fw === "next" && det.major >= 16) {
          const pkgSet = await wc.spawn(
            "npm",
            ["pkg", "set", "scripts.dev=next dev --webpack"],
            { cwd: newRoot },
          );
          await pkgSet.exit;
        }
      }
    } catch {}
  };

  const executerPull = async () => {
    if (!token || isPulling) return;
    setIsPulling(true);
    setStatut("Pull depuis GitHub...");
    try {
      const res = await fetch(
        `${API_URL}/projects/${projetId}/chargement-github`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ReponseChargement;
      await appliquerChargement(data);
      setBrancheCourante(data.branche);
      setStatut("Pull terminé");
      toast.success("Pull terminé — fichiers à jour");
    } catch (error) {
      setStatut("Pull échoué");
      toast.error(`Pull échoué : ${(error as Error).message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handleRetour = () => {
    if (nombreModifs > 0) {
      toast.warning(`${nombreModifs} modification(s) non poussée(s)`, {
        description:
          "Elles restent en brouillon local et seront restaurées à ton retour.",
        action: {
          label: "Quitter",
          onClick: () => router.back(),
        },
        duration: 8000,
      });
      return;
    }
    router.back();
  };

  const handlePull = async () => {
    if (!token || isPulling) return;
    if (nombreModifs > 0) {
      toast.warning(`${nombreModifs} modification(s) non poussée(s)`, {
        description: "Le pull les écrasera définitivement. Continuer ?",
        action: {
          label: "Écraser",
          onClick: () => void executerPull(),
        },
        duration: 8000,
      });
      return;
    }
    await executerPull();
  };

  const executerChangement = async (branche: string) => {
    if (!token || isChangingBranche) return;
    setIsChangingBranche(true);
    setStatut(`Chargement de « ${branche} »...`);
    try {
      const res = await fetch(
        `${API_URL}/projects/${projetId}/chargement-github?branche=${encodeURIComponent(branche)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ReponseChargement;
      await appliquerChargement(data);
      setBrancheCourante(data.branche);
      setBrancheCible("");
      setStatut(`Branche « ${data.branche} »`);
      toast.success(`Branche « ${data.branche} » chargée`);
    } catch (error) {
      setStatut("Changement de branche échoué");
      toast.error(`Branche non chargée : ${(error as Error).message}`);
    } finally {
      setIsChangingBranche(false);
    }
  };

  const chargerBranche = (branche: string) => {
    if (!token || isChangingBranche || branche === brancheCourante) return;
    if (nombreModifs > 0) {
      toast.warning(`${nombreModifs} modification(s) non poussée(s)`, {
        description: `Changer vers « ${branche} » les écrasera. Continuer ?`,
        action: {
          label: "Changer",
          onClick: () => void executerChangement(branche),
        },
        duration: 8000,
      });
      return;
    }
    void executerChangement(branche);
  };

  const rechargerFichiers = useCallback(async () => {
    const wc = wcRef.current;
    if (!wc) return;
    try {
      const result: Record<string, string> = {};
      const parcourir = async (chemin: string): Promise<void> => {
        const entries = await wc.fs.readdir(chemin, { withFileTypes: true });
        await Promise.all(
          entries.map(async (entry) => {
            if (A_IGNORE.includes(entry.name)) return;
            const fullPath =
              chemin === "/" ? entry.name : `${chemin}/${entry.name}`;
            if (entry.isDirectory()) await parcourir(`/${fullPath}`);
            else if (entry.isFile()) {
              try {
                result[fullPath] = await wc.fs.readFile(
                  `/${fullPath}`,
                  "utf-8",
                );
              } catch {}
            }
          }),
        );
      };
      await parcourir("/");

      setFichiers((prev) => {
        const next = { ...result };
        for (const [k, v] of Object.entries(prev)) {
          const normalized = k.replace(/^\/+/, "");
          if (modified[k] || modified[normalized]) {
            next[k] = v;
          }
        }
        return next;
      });
    } catch {}
  }, [modified]);

  const changerVue = (mode: "code" | "preview") => {
    setViewMode(mode);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  const setHauteur = (h: number) => {
    termHeightRef.current = h;
    setTermHeight(h);
  };

  const toggleTerminal = () => {
    setTermCollapsed((c) => !c);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = termHeightRef.current;
    const onMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      const max = (centerRef.current?.clientHeight ?? 600) - 140;
      setHauteur(Math.min(Math.max(startH + delta, 100), max));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.dispatchEvent(new Event("resize"));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const switchTerminal = (id: number) => {
    setActiveTerminal(id);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  const addTerminal = () => {
    const id = nextTerminalId.current++;
    setTerminals((prev) => [...prev, id]);
    setActiveTerminal(id);
    setTermCollapsed(false);
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  const closeTerminal = (id: number) => {
    const remaining = terminals.filter((t) => t !== id);
    if (remaining.length === 0) {
      nextTerminalId.current = 2;
      setTerminals([1]);
      setActiveTerminal(1);
    } else {
      setTerminals(remaining);
      if (activeTerminal === id) setActiveTerminal(remaining[0]);
    }
    setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
  };

  const handlePush = async () => {
    if (!token || nombreModifs === 0) return;
    setIsSyncing(true);
    try {
      const fichiers = Object.entries(modified).map(([path, contenu]) => ({
        path,
        contenu,
      }));
      const res = await fetch(`${API_URL}/projects/${projetId}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fichiers, branche: brancheActive }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? "Erreur de synchronisation");
      }
      const data = (await res.json()) as ReponseSync;
      setModified({});
      supprimerDraft(projetId, Number(user?.id));
      setInfo((prev) => (prev ? { ...prev, branche: data.branche } : prev));
      setBrancheCourante(data.branche);
      setBrancheCible("");
      toast.success(
        `Push réussi sur « ${data.branche} » (commit ${data.commit.substring(0, 7)})`,
      );
    } catch (error) {
      toast.error(`Push échoué : ${(error as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreerPr = async () => {
    if (!token || !tachePr) return;
    setIsCreatingPr(true);
    try {
      const res = await fetch(`${API_URL}/pull-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tacheId: tachePr,
          branche: brancheActive,
          titre: titrePr || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { message?: string };
        throw new Error(err.message ?? "Erreur création PR");
      }

      const pr = await res.json();

      setDialogPr(false);
      setTachePr("");
      setTitrePr("");

      if (pr.url) {
        toast.success(
          <div>
            <p>PR #{pr.numero} disponible</p>
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 text-xs underline"
            >
              Voir sur GitHub →
            </a>
          </div>,
          { duration: 6000 },
        );
      } else {
        toast.success("Pull Request créée avec succès");
      }
    } catch (error) {
      const msg = (error as Error).message;

      if (msg.includes("existe déjà") || msg.includes("already exists")) {
        toast.warning(
          "Une Pull request existe déjà pour cette branche. Ferme-la ou fusionne-la d'abord sur GitHub.",
          { duration: 8000 },
        );
      } else {
        toast.error(`PR non créée : ${msg}`);
      }
    } finally {
      setIsCreatingPr(false);
    }
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-2 md:gap-3 md:px-3">
        <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRetour}
            aria-label="Retour"
            className="h-9 w-9 shrink-0 p-0 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white md:h-10 md:w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6366F1] text-sm font-bold text-white">
            {nomProjet.charAt(0).toUpperCase() || "W"}
          </div>

          <p className="hidden max-w-32 truncate text-sm font-semibold text-white md:inline md:max-w-40">
            {nomProjet}
          </p>

          <GitBranch className="hidden h-3.5 w-3.5 text-emerald-500 md:inline" />

          {branchesDetail.length > 0 && (
            <select
              value={brancheCourante}
              disabled={isChangingBranche}
              onChange={(e) => chargerBranche(e.target.value)}
              className="hidden max-w-48 cursor-pointer rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#6366F1] disabled:opacity-50 md:inline-block"
              title={`${branchesDetail.length} branche(s) disponible(s)`}
            >
              {branchesDetail
                .sort((a: BrancheDetaillee, b: BrancheDetaillee) => {
                  if (a.isDefault) return -1;
                  if (b.isDefault) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((b) => (
                  <option key={b.name} value={b.name} className="bg-[#181818]">
                    {b.isDefault ? "⭐ " : b.protected ? "🔒 " : ""}
                    {b.name}
                  </option>
                ))}
            </select>
          )}

          {isChangingBranche && (
            <Loader2 className="hidden h-3.5 w-3.5 animate-spin text-gray-400 md:inline" />
          )}

          {brancheCible && (
            <span className="hidden items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 md:inline-flex">
              <GitBranch className="h-3.5 w-3.5" />→ {brancheCible}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => changerVue("preview")}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors md:px-3 ${
              viewMode === "preview"
                ? "bg-[#6366F1] text-white"
                : "text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Aperçu</span>
          </button>

          {!isMobile && (
            <button
              onClick={() => changerVue("code")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "code"
                  ? "bg-[#6366F1] text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-1.5">
          <span className="mr-1 hidden text-xs text-gray-400 lg:inline">
            {statut}
          </span>

          {depotGitUrl && (
            <a
              href={depotGitUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-white/10 bg-white/5 p-1.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white md:p-2"
              title="Ouvrir le dépôt GitHub"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
          )}

          <button
            onClick={handlePull}
            disabled={isPulling}
            className="rounded-md border border-white/10 bg-white/5 p-1.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 md:p-2"
            title="Pull depuis GitHub"
          >
            {isPulling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudDownload className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={sauvegarder}
            disabled={nombreModifs === 0}
            className="hidden rounded-md border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 md:inline-block"
            title={`Écrire les modifications (${nombreModifs})`}
          >
            <Save className="h-4 w-4" />
          </button>

          <button
            onClick={() => setDialogBranche(true)}
            className="hidden rounded-md border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white md:inline-block"
            title="Créer une branche"
          >
            <GitBranch className="h-4 w-4" />
          </button>

          <button
            onClick={handlePush}
            disabled={isSyncing || nombreModifs === 0}
            className="relative rounded-md border border-white/10 bg-white/5 p-1.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 md:p-2"
            title="Push vers GitHub"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}

            {nombreModifs > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#6366F1] px-1 text-[10px] font-bold text-white">
                {nombreModifs}
              </span>
            )}
          </button>

          <button
            onClick={() => setDialogPr(true)}
            className="hidden items-center gap-1.5 rounded-md bg-[#6366F1] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4f46e5] md:inline-flex"
            title="Créer une Pull Request"
          >
            <GitPullRequest className="h-4 w-4" />
            <span className="hidden lg:inline">Créer PR</span>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {/*  MODE MOBILE  */}
        {isMobile && (
          <div className="h-full">
            {viewMode === "code" ? (
              <div className="h-full bg-slate-100">
                {tacheIaId ? (
                  <AssistanceIaChat
                    taskId={tacheIaId}
                    wc={wcInstance}
                    projectRoot={projectRoot}
                    onRefresh={rechargerFichiers}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                      <Lock className="h-7 w-7 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-700">
                        Assistance IA verrouillée
                      </h3>
                      <p className="mt-1 max-w-xs text-sm text-slate-500">
                        Aucune tâche ne t&apos;est attribuée pour le moment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full bg-[#1e1e1e]">
                <PreviewPanel previewUrl={previewUrl} statut={statut} />
              </div>
            )}
          </div>
        )}

        {/*  MODE DESKTOP  */}
        {!isMobile && (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
              <div className="flex h-full flex-col bg-slate-100">
                <div className="min-h-0 flex-1 overflow-hidden">
                  {tacheIaId ? (
                    <AssistanceIaChat
                      taskId={tacheIaId}
                      wc={wcInstance}
                      projectRoot={projectRoot}
                      onRefresh={rechargerFichiers}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                        <Lock className="h-7 w-7 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-700">
                          Assistance IA verrouillée
                        </h3>
                        <p className="mt-1 max-w-xs text-sm text-slate-500">
                          {"L'IA est réservée aux tâches qui te sont assignées. " +
                            "Aucune tâche ne t'est attribuée pour le moment."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={65} minSize={50}>
              <div className={`h-full ${viewMode === "code" ? "" : "hidden"}`}>
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={16} minSize={10} maxSize={50}>
                    <div className="h-full border-r border-white/10 bg-[#181818]">
                      <FileTree
                        nodes={arbre}
                        activePath={activePath}
                        modified={modified}
                        projectName={nomProjet}
                        onSelect={setActivePath}
                        onRefresh={rechargerFichiers}
                        onCreateFile={async (path) => {
                          setFichiers((prev) => ({ ...prev, [path]: "" }));
                          setModified((prev) => ({ ...prev, [path]: "" }));
                          setActivePath(path);
                          const wc = wcRef.current;
                          if (wc)
                            await wc.fs
                              .writeFile(`/${path}`, "")
                              .catch(() => {});
                        }}
                        onCreateFolder={async (path) => {
                          setFichiers((prev) => ({
                            ...prev,
                            [`${path}/.gitkeep`]: "",
                          }));
                          setModified((prev) => ({
                            ...prev,
                            [`${path}/.gitkeep`]: "",
                          }));
                          const wc = wcRef.current;
                          if (wc) {
                            await wc.fs
                              .mkdir(`/${path}`, { recursive: true })
                              .catch(() => {});
                            await wc.fs
                              .writeFile(`/${path}/.gitkeep`, "")
                              .catch(() => {});
                          }
                        }}
                        onDelete={async (path) => {
                          setFichiers((prev) => {
                            const next = { ...prev };
                            Object.keys(next).forEach((k) => {
                              if (k === path || k.startsWith(path + "/"))
                                delete next[k];
                            });
                            return next;
                          });
                          setModified((prev) => {
                            const next = { ...prev };
                            Object.keys(next).forEach((k) => {
                              if (k === path || k.startsWith(path + "/"))
                                delete next[k];
                            });
                            return next;
                          });
                          if (
                            activePath === path ||
                            activePath.startsWith(path + "/")
                          ) {
                            setActivePath(Object.keys(fichiers)[0] ?? "");
                          }
                          const wc = wcRef.current;
                          if (wc)
                            await wc.fs
                              .rm(`/${path}`, { recursive: true })
                              .catch(() => {});
                        }}
                        onRename={async (oldPath, newPath) => {
                          setFichiers((prev) => {
                            const next = { ...prev };
                            Object.entries(prev).forEach(([k, v]) => {
                              if (k === oldPath) {
                                next[newPath] = v;
                                delete next[k];
                              } else if (k.startsWith(oldPath + "/")) {
                                next[k.replace(oldPath, newPath)] = v;
                                delete next[k];
                              }
                            });
                            return next;
                          });
                          setModified({});
                          if (activePath === oldPath) setActivePath(newPath);
                          const wc = wcRef.current;
                          if (wc)
                            await wc.fs
                              .rename(`/${oldPath}`, `/${newPath}`)
                              .catch(() => {});
                        }}
                      />
                    </div>
                  </ResizablePanel>

                  <ResizableHandle />

                  <ResizablePanel defaultSize={70} minSize={35}>
                    <div ref={centerRef} className="flex h-full flex-col">
                      <div className="flex min-h-0 flex-1 flex-col">
                        {activePath && (
                          <div className="flex items-center gap-1 border-b border-white/10 bg-[#1e1e1e] px-3 py-1.5 text-xs text-gray-400">
                            {activePath.split("/").map((part, i, arr) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ChevronRight className="h-3 w-3" />}
                                <span
                                  className={
                                    i === arr.length - 1 ? "text-gray-200" : ""
                                  }
                                >
                                  {part}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="min-h-0 flex-1">
                          {activePath ? (
                            <CodeEditor
                              path={activePath}
                              value={fichiers[activePath] ?? ""}
                              onChange={handleEdit}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-gray-500">
                              Aucun fichier
                            </div>
                          )}
                        </div>
                      </div>

                      {!termCollapsed && (
                        <div
                          onMouseDown={startDrag}
                          className="h-1 shrink-0 cursor-row-resize bg-white/10 transition-colors hover:bg-[#6366F1]/60"
                        />
                      )}

                      <div
                        className="flex shrink-0 flex-col bg-[#1e1e1e]"
                        style={{
                          height: termCollapsed
                            ? HAUTEUR_HEADER_TERMINAL
                            : termHeight,
                        }}
                      >
                        <div className="flex h-9 shrink-0 items-center gap-1 border-t border-white/10 bg-[#181818] px-2">
                          <div className="wp-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                            {terminals.map((id) => (
                              <div
                                key={id}
                                onClick={() => switchTerminal(id)}
                                className={`group flex shrink-0 cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs ${
                                  activeTerminal === id
                                    ? "bg-[#6366F1]/20 text-white"
                                    : "text-gray-400 hover:bg-white/5"
                                }`}
                              >
                                <TerminalIcon className="h-3.5 w-3.5" />
                                <span>{getTerminalName(id)}</span>

                                {terminals.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closeTerminal(id);
                                    }}
                                    className="rounded p-0.5 text-gray-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={addTerminal}
                            className="shrink-0 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                            title="Nouveau terminal"
                          >
                            <Plus className="h-4 w-4" />
                          </button>

                          <button
                            onClick={toggleTerminal}
                            className="shrink-0 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                termCollapsed ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>

                        <div className="relative min-h-0 flex-1">
                          {terminals.map((id) => (
                            <div
                              key={id}
                              className={`absolute inset-0 ${
                                activeTerminal === id ? "" : "invisible"
                              }`}
                            >
                              <TerminalPanel
                                active={
                                  activeTerminal === id &&
                                  !termCollapsed &&
                                  viewMode === "code"
                                }
                                wc={wcInstance}
                                cwd={projectRoot}
                                onFsChange={rechargerFichiers}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>

              <div
                className={`h-full ${viewMode === "preview" ? "" : "hidden"}`}
              >
                <PreviewPanel previewUrl={previewUrl} statut={statut} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      <Dialog open={dialogBranche} onOpenChange={setDialogBranche}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle branche</DialogTitle>
            <DialogDescription>
              Sera créée sur GitHub au push, à partir de « {brancheActive} ».
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="ma-fonctionnalite"
            value={nomBranche}
            onChange={(e) => setNomBranche(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogBranche(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                const nom = nomBranche.trim();
                if (nom && /^[a-zA-Z0-9/_-]+$/.test(nom)) {
                  setBrancheCible(nom);
                  setDialogBranche(false);
                  setNomBranche("");
                  toast.info(`Branche « ${nom} » sera créée au push`);
                }
              }}
              disabled={
                !nomBranche.trim() ||
                !/^[a-zA-Z0-9/_-]+$/.test(nomBranche.trim())
              }
              className="bg-[#6366F1] text-white hover:bg-[#4f46e5]"
            >
              Créer la branche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogPr} onOpenChange={setDialogPr}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une Pull Request</DialogTitle>
            <DialogDescription>
              De « {brancheActive} » vers « {info?.brancheDefaut} ».
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm">Tâche liée</p>
              <select
                value={tachePr}
                onChange={(e) => setTachePr(Number(e.target.value) || "")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner une tâche</option>
                {Array.isArray(taches) &&
                  taches.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titre}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-sm">Titre (optionnel)</p>
              <Input
                placeholder="Titre de la Pull Request"
                value={titrePr}
                onChange={(e) => setTitrePr(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPr(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreerPr}
              disabled={!tachePr || isCreatingPr}
              className="bg-[#6366F1] text-white hover:bg-[#4f46e5]"
            >
              {isCreatingPr ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitPullRequest className="h-4 w-4" />
              )}
              Créer la Pull Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
