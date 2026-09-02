"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Code2,
  Eye,
  FileText,
  Menu,
  Scissors,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

/* ==========================================================
   📊 DONNÉES
========================================================== */
const NAV_LINKS = [
  { label: "Pour qui ?", href: "#acteurs" },
  { label: "Besoins résolus", href: "#besoins" },
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Comment ça marche", href: "#comment" },
];

/* ✅ 3 RÔLES PRINCIPAUX */
const ACTEURS = [
  {
    icon: Briefcase,
    titre: "Chef de projet",
    desc: "Pilotez vos projets de A à Z, définissez les priorités, gérez votre équipe et suivez l'avancement en temps réel.",
    couleur: "bg-indigo-100 dark:bg-indigo-950/60",
    iconBg: "bg-indigo-600",
    features: [
      "Cahier des charges IA",
      "Découpage automatique des tâches",
      "Tableau de bord temps réel",
      "Assignation intelligente",
    ],
  },
  {
    icon: Code2,
    titre: "Développeur",
    desc: "Codez dans un environnement assisté par IA qui comprend votre contexte métier et vous suggère les meilleures pratiques.",
    couleur: "bg-purple-200 dark:bg-purple-950/60",
    iconBg: "bg-purple-600",
    features: [
      "Workspace IA intégré",
      "Génération de code contextuelle",
      "Auto-complétion intelligente",
      "Intégration GitHub native",
    ],
  },
  {
    icon: Eye,
    titre: "Relecteur",
    desc: "Validez le code de votre équipe avec une assistance IA qui détecte bugs, failles de sécurité et optimisations.",
    couleur: "bg-emerald-200 dark:bg-emerald-950/60",
    iconBg: "bg-emerald-600",
    features: [
      "Revue de code IA",
      "Détection de bugs automatique",
      "Suggestions de refactoring",
      "Validation des standards",
    ],
  },
];

/* ✅ BESOINS ADAPTÉS AUX 3 RÔLES */
const BESOINS = [
  {
    probleme: "Spécifications floues qui bloquent l'équipe",
    solution:
      "Le chef de projet génère un cahier des charges complet en 1 clic grâce à l'IA.",
    icon: FileText,
    role: "Chef de projet",
  },
  {
    probleme: "Tâches mal réparties selon les compétences",
    solution:
      "Assignation intelligente : chaque développeur reçoit les tâches correspondant à son expertise.",
    icon: Users,
    role: "Chef de projet",
  },
  {
    probleme: "Développeurs perdus dans le contexte du projet",
    solution:
      "Workspace IA qui comprend l'arborescence, la stack et les conventions du projet.",
    icon: Code2,
    role: "Développeur",
  },
  {
    probleme: "Temps perdu sur les tâches répétitives",
    solution:
      "L'IA automatise le boilerplate, les tests unitaires et la documentation.",
    icon: Scissors,
    role: "Développeur",
  },
  {
    probleme: "Code reviews longues et fastidieuses",
    solution:
      "Revue assistée par IA : bugs, sécurité et performances détectés automatiquement.",
    icon: Eye,
    role: "Relecteur",
  },
  {
    probleme: "Standards de code non respectés",
    solution:
      "Validation automatique selon les conventions d'équipe avant chaque merge.",
    icon: ShieldCheck,
    role: "Relecteur",
  },
];

const STATS = [
  { value: "10 000+", label: "tâches gérées" },
  { value: "500+", label: "équipes actives" },
  { value: "3x", label: "plus rapide" },
  { value: "95%", label: "de satisfaction" },
];

const STEPS = [
  {
    num: "01",
    title: "Créez votre espace",
    desc: "Inscrivez-vous en 30 secondes et invitez votre équipe gratuitement.",
  },
  {
    num: "02",
    title: "Décrivez votre projet",
    desc: "Connectez GitHub ou créez vos projets depuis zéro en quelques clics.",
  },
  {
    num: "03",
    title: "Laissez l'IA vous guider",
    desc: "Suggestions, priorités, automatisations... Travaillez moins, accomplissez plus.",
  },
];

/* ==========================================================
   ✨ ANIMATION AU SCROLL
========================================================== */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  subtitle,
  title,
  description,
}: {
  subtitle: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="mb-14 max-w-2xl text-left sm:mx-auto sm:text-center">
      <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.3em] text-[#6366F1]">
        {subtitle}
      </span>
      <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-muted-foreground">{description}</p>
      )}
    </Reveal>
  );
}

/* ==========================================================
   🧭 NAVBAR
========================================================== */
function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="WorkPilot"
            width={36}
            height={36}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            WorkPilot
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login">
            <Button variant="ghost">Se connecter</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[#6366F1] text-white hover:bg-[#4F46E5]">
              Commencer gratuitement
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          <Menu
            size={24}
            className={`absolute transition-all duration-300 ${isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}
          />
          <X
            size={24}
            className={`absolute transition-all duration-300 ${isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`}
          />
        </Button>
      </div>

      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-500 lg:hidden ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <div
        className={`fixed right-0 top-16 z-50 h-[calc(100vh-4rem)] w-72 border-l border-border bg-background shadow-2xl transition-all duration-500 ease-in-out lg:hidden ${isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
      >
        <div className="flex flex-col gap-6 px-6 pt-10">
          {NAV_LINKS.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-lg font-medium text-foreground transition-all duration-500 hover:text-[#6366F1] ${isOpen ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
              style={{ transitionDelay: isOpen ? `${index * 80}ms` : "0ms" }}
            >
              {link.label}
            </a>
          ))}

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button
                variant="outline"
                className={`w-full transition-all duration-500 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                style={{ transitionDelay: isOpen ? "400ms" : "0ms" }}
              >
                Se connecter
              </Button>
            </Link>
            <Link href="/register" onClick={() => setIsOpen(false)}>
              <Button
                className={`w-full bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-all duration-500 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                style={{ transitionDelay: isOpen ? "480ms" : "0ms" }}
              >
                Commencer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}


function DashboardMockup() {
  const bars = [45, 70, 55, 85, 65, 95, 75, 60, 88, 72];

  return (
    <Reveal delay={400}>
      <div className="relative mx-auto mt-16 max-w-5xl">
        <div className="absolute -inset-8 rounded-[2rem] bg-linear-to-r from-[#6366F1]/25 to-violet-500/25 blur-3xl" />

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-400" />
            <div className="ml-4 h-6 flex-1 rounded-md bg-muted" />
          </div>

          <div className="grid grid-cols-12">
            <div className="col-span-3 hidden space-y-3 border-r border-border bg-muted/30 p-4 sm:block lg:col-span-2">
              <Image
                src="/logo.png"
                alt="WorkPilot"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-muted"
                  style={{ width: `${80 - i * 8}%` }}
                />
              ))}
            </div>

            <div className="col-span-12 p-4 sm:col-span-9 sm:p-6 lg:col-span-10">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "Projets",
                    value: "24",
                    color: "bg-violet-500/10 text-violet-600",
                  },
                  {
                    label: "En cours",
                    value: "12",
                    color: "bg-amber-500/10 text-amber-600",
                  },
                  {
                    label: "En revue",
                    value: "8",
                    color: "bg-orange-500/10 text-orange-600",
                  },
                  {
                    label: "Terminées",
                    value: "96",
                    color: "bg-emerald-500/10 text-emerald-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border p-3"
                  >
                    <div
                      className={`mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg ${s.color}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-sm bg-current" />
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {s.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-3 w-12 rounded bg-muted" />
                </div>
                <div className="flex h-36 items-end gap-2">
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-linear-to-t from-[#6366F1] to-violet-400"
                      style={{
                        height: `${h}%`,
                        opacity: 0.45 + (i % 5) * 0.13,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}


function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-125 w-225 -translate-x-1/2 rounded-full bg-[#6366F1]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-left sm:px-6 sm:text-center">
        <Reveal delay={150}>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:mx-auto sm:text-6xl">
            Pilotez vos projets avec{" "}
            <span className="bg-linear-to-r from-[#6366F1] to-violet-400 bg-clip-text text-transparent">
              l&apos;intelligence artificielle
            </span>
          </h1>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-6 max-w-2xl text-muted-foreground sm:mx-auto sm:text-lg">
            WorkPilot transforme votre façon de gérer les tâches et les équipes.
            De la planification à l&apos;exécution, l&apos;IA vous guide à
            chaque étape.
          </p>
        </Reveal>

        <Reveal delay={450}>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-[#6366F1] px-8 py-3.5 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#4F46E5] hover:shadow-xl hover:shadow-[#6366F1]/25"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#comment"
              className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-3.5 font-semibold text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-[#6366F1] hover:text-[#6366F1]"
            >
              Voir comment ça marche
            </a>
          </div>
        </Reveal>

        <Reveal delay={600}>
          <div className="mt-14 grid max-w-3xl grid-cols-2 gap-6 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur sm:mx-auto sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-left sm:text-center">
                <p className="text-2xl font-bold text-[#6366F1]">{s.value}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <DashboardMockup />
      </div>
    </section>
  );
}


function Acteurs() {
  return (
    <section id="acteurs" className="scroll-mt-16 bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          subtitle="Pour qui ?"
          title="Une plateforme pour toute l'équipe"
          description="Chaque rôle dispose des outils IA adaptés à ses responsabilités."
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ACTEURS.map((acteur, i) => (
            <Reveal key={acteur.titre} delay={i * 100}>
              <div
                className={`group relative h-full overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${acteur.couleur}`}
              >
                {/* Badge rôle */}
                <div className="absolute right-6 top-6 rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-700 shadow-sm dark:bg-gray-900/80 dark:text-gray-200">
                  {i === 0 ? "Planifie" : i === 1 ? "Code" : "Valide"}
                </div>

                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${acteur.iconBg}`}
                >
                  <acteur.icon className="h-7 w-7" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {acteur.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {acteur.desc}
                </p>

                <ul className="mt-6 space-y-3">
                  {acteur.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ✅ Bande de workflow : les 3 rôles collaborent */}
        <Reveal delay={400}>
          <div className="mt-12 rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#6366F1]">
              Un workflow unifié
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
              {ACTEURS.map((acteur, i) => (
                <div key={acteur.titre} className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md ${acteur.iconBg}`}
                  >
                    <acteur.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {acteur.titre}
                  </span>
                  {i < ACTEURS.length - 1 && (
                    <ArrowRight className="hidden h-5 w-5 text-muted-foreground sm:block" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Collaboration fluide entre les 3 rôles, sans friction ni perte de
              contexte.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


function Besoins() {
  return (
    <section id="besoins" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          subtitle="Besoins résolus"
          title="Les problèmes que WorkPilot élimine"
          description="Chaque fonctionnalité a été conçue pour résoudre un vrai problème rencontré par les équipes au quotidien."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {BESOINS.map((besoin, i) => (
            <Reveal key={besoin.probleme} delay={i * 80}>
              <div className="group h-full rounded-3xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-2 hover:border-[#6366F1]/50 hover:shadow-xl hover:shadow-[#6366F1]/10">
                {/* Badge rôle */}
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#6366F1]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#6366F1]">
                  {besoin.role}
                </div>

                <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/50">
                    <XCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Problème
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {besoin.probleme}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                    <besoin.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Solution WorkPilot
                    </p>
                    <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                      {besoin.solution}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


function Features() {
  return (
    <section id="fonctionnalites" className="scroll-mt-16 bg-muted/40 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          subtitle="Fonctionnalités"
          title="Puissance Intelligente"
          description="Tout ce dont vous avez besoin pour livrer plus vite."
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <div className="group h-full rounded-3xl bg-indigo-100 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 dark:bg-indigo-950/60">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-transform duration-300 group-hover:scale-110">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Cahier des charges IA
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
                Décrivez votre idée en quelques phrases. Notre IA analyse le
                marché, définit les specs techniques et génère un document
                complet prêt à l&apos;emploi.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="space-y-2 rounded-xl bg-white p-3 shadow-sm dark:bg-gray-900">
                  <div className="h-2.5 w-3/4 rounded bg-indigo-400" />
                  <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-2 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-violet-500 p-2.5 shadow-md">
                    <div className="h-1.5 w-3/4 rounded bg-white/70" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/40" />
                  </div>
                  <div className="rounded-lg bg-emerald-400 p-2.5 shadow-md">
                    <div className="h-1.5 w-2/3 rounded bg-white/70" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/40" />
                  </div>
                  <div className="rounded-lg bg-violet-400 p-2.5 shadow-md">
                    <div className="h-1.5 w-3/4 rounded bg-white/70" />
                    <div className="mt-1.5 h-1.5 w-2/5 rounded bg-white/40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-sky-400 p-2.5 shadow-md">
                    <div className="h-1.5 w-2/3 rounded bg-white/70" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/40" />
                  </div>
                  <div className="rounded-lg bg-violet-500 p-2.5 shadow-md">
                    <div className="h-1.5 w-3/4 rounded bg-white/70" />
                    <div className="mt-1.5 h-1.5 w-2/5 rounded bg-white/40" />
                  </div>
                  <div className="rounded-lg bg-emerald-400 p-2.5 shadow-md">
                    <div className="h-1.5 w-2/3 rounded bg-white/70" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/40" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="group h-full rounded-3xl bg-orange-200 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 dark:bg-orange-950/60">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/30 transition-transform duration-300 group-hover:scale-110">
                <Scissors className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Découpage
              </h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                L&apos;IA transforme automatiquement vos objectifs en tâches
                actionnables et les priorise pour votre équipe.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="group h-full rounded-3xl bg-purple-200 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 dark:bg-purple-950/60">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-purple-700 shadow-lg shadow-purple-600/20 transition-transform duration-300 group-hover:scale-110 dark:bg-purple-900 dark:text-purple-300">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Workspace IA
              </h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Un environnement de développement assisté par IA qui comprend
                votre contexte métier de la tâche choisie.
              </p>
            </div>
          </Reveal>

          <Reveal delay={200} className="md:col-span-2">
            <div className="group flex h-full flex-col justify-between gap-6 rounded-3xl bg-blue-200 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 dark:bg-blue-950/60 sm:flex-row sm:items-center">
              <div className="max-w-sm">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-900/30 transition-transform duration-300 group-hover:scale-110 dark:bg-white dark:text-gray-900">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Revue Technique
                </h3>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Validation automatique du code et des performances selon vos
                  propres standards de qualité.
                </p>
              </div>

              <div className="w-full space-y-3 sm:max-w-xs">
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 dark:bg-gray-900">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Optimisation du code
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    -12% perf
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5 dark:bg-gray-900">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    <Code2 className="h-4 w-4 text-violet-500" />
                    Refactoring IA
                  </span>
                  <span className="text-xs font-semibold text-violet-600">
                    Prêt
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="comment" className="scroll-mt-16 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          subtitle="Comment ça marche"
          title="Opérationnel en 3 étapes"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="relative h-full rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#6366F1]/50">
                <span className="absolute -top-5 left-8 flex h-10 w-10 items-center justify-center rounded-xl bg-[#6366F1] text-sm font-bold text-white shadow-lg shadow-[#6366F1]/30">
                  {step.num}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


function FinalCta() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#6366F1] to-violet-600 px-6 py-16 text-left shadow-2xl shadow-[#6366F1]/25 sm:px-16 sm:text-center">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
              Prêt à transformer votre productivité ?
            </h2>
            <p className="relative mt-4 max-w-xl text-white/80 sm:mx-auto">
              Rejoignez des milliers d&apos;équipes qui ont déjà fait le choix
              de l&apos;intelligence artificielle.
            </p>
            <Link
              href="/register"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-semibold text-[#6366F1] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="relative mt-4 text-xs text-white/60">
              Aucune carte bancaire requise
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="WorkPilot"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-foreground">
                WorkPilot
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              La plateforme de gestion de projets et de tâches assistée par IA.
              Planifiez, collaborez et livrez plus vite.
            </p>
            <div className="mt-5 flex gap-3">
              {[GithubIcon, XIcon, LinkedinIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:border-[#6366F1] hover:text-[#6366F1]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Produit
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="#acteurs" className="hover:text-[#6366F1]">
                  Pour qui ?
                </a>
              </li>
              <li>
                <a href="#besoins" className="hover:text-[#6366F1]">
                  Besoins résolus
                </a>
              </li>
              <li>
                <a href="#fonctionnalites" className="hover:text-[#6366F1]">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#6366F1]">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Légal
            </p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-[#6366F1]">
                  CGU
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#6366F1]">
                  Confidentialité
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#6366F1]">
                  Mentions légales
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <span>© {currentYear} WorkPilot. Tous droits réservés.</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <Hero />
      <Acteurs />
      <Besoins />
      <Features />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </div>
  );
}
