"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  FolderOpen,
  Folder,
  Users,
  Shield,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { TimeRangeSelector } from "@/app/components/dashboard/TimeRangeSelector";
import type {
  ProjetRecent,
  TimeRange,
  UserRecent,
} from "@/types/dashboardType";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function GithubIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function AnimatedNumber({
  value,
  delay = 0,
}: {
  value: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    let startTime: number | null = null;
    const duration = 1000;

    const timeout = window.setTimeout(() => {
      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplay(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [value, delay]);

  return <>{display}</>;
}

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} />;
}

function getSalutation(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return { greeting: "Bonjour", emoji: "☀️" };
  if (hour >= 12 && hour < 13)
    return { greeting: "Bon après-midi", emoji: "🌤️" };
  return { greeting: "Bonsoir", emoji: "🌙" };
}

const formatJour = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });

const formatMois = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
};

const formatBucket = (value: string) => {
  if (/^\d{4}-W\d{2}$/.test(value)) {
    const [y, w] = value.split("-W");
    return `S${w} · ${y.slice(2)}`;
  }
  if (/^\d{4}-\d{2}$/.test(value)) return formatMois(value);
  return formatJour(value);
};

const RANGE_LABELS: Record<TimeRange, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "3 derniers mois",
  "6m": "6 derniers mois",
  "1y": "12 derniers mois",
  all: "Toute la période",
};

function GithubBanner({
  connected,
  username,
  isConnecting,
  onConnect,
  onOpenProfile,
}: {
  connected: boolean;
  username?: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <Card
      className="shine-effect animate-fade-up h-full overflow-hidden border-border/60"
      style={{ animationDelay: "80ms" }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "animate-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11",
                connected
                  ? "bg-[#24292e] text-white"
                  : "bg-muted text-muted-foreground",
              )}
              style={{ animationDelay: "250ms" }}
            >
              <GithubIcon size={22} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Compte GitHub
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    connected
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {connected && (
                      <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    )}
                    <span
                      className={cn(
                        "relative inline-flex h-1.5 w-1.5 rounded-full",
                        connected ? "bg-emerald-500" : "bg-muted-foreground/50",
                      )}
                    />
                  </span>
                  {connected ? "Connecté" : "Non connecté"}
                </span>
              </div>

              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {connected && username ? (
                  <>
                    <span className="font-medium text-foreground">
                      @{username}
                    </span>
                    <span className="hidden sm:inline">
                      {" "}
                      · Invitations automatiques activées
                    </span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Soyez invité automatiquement sur les dépôts de vos projets
                    </span>
                    <span className="sm:hidden">
                      Invitations auto sur vos dépôts
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProfile}
              className="w-full gap-1.5 transition-all duration-200 hover:-translate-y-0.5 sm:w-auto bg-[#5b5eeb] text-white hover:bg-[#787ae0] hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Voir le profil
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onConnect}
              disabled={isConnecting}
              className={cn(
                "h-9 w-full gap-2 px-4 font-medium text-white sm:w-auto",
                "bg-linear-to-r from-[#24292e] to-[#1a1e22]",
                "hover:from-[#2f363d] hover:to-[#24292e]",
                "hover:shadow-lg hover:shadow-[#24292e]/20 hover:-translate-y-0.5",
                "active:scale-[0.98] disabled:opacity-60",
                "transition-all duration-200",
              )}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <GithubIcon size={16} />
                  Connecter GitHub
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AdminBanner({ delay = 0 }: { delay?: number }) {
  return (
    <Card
      className="animate-fade-up h-full overflow-hidden border-border/60 bg-linear-to-br from-cyan-500/5 via-blue-500/5 to-indigo-500/5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex h-full items-center gap-4 p-4 sm:p-5">
        <div className="animate-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 text-white sm:h-11 sm:w-11">
          <Shield className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              Mode Administrateur
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Actif
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="hidden sm:inline">
              Accès complet : statistiques globales, gestion des utilisateurs et
              de tous les projets
            </span>
            <span className="sm:hidden">Vue globale de la plateforme</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const subscribeToSecond = (callback: () => void) => {
  const id = window.setInterval(callback, 1000);
  return () => window.clearInterval(id);
};

const getSecondSnapshot = () => Math.floor(Date.now() / 1000);
const getServerSnapshot = () => 0;

function ClockWidget({ delay = 0 }: { delay?: number }) {
  const timestamp = useSyncExternalStore(
    subscribeToSecond,
    getSecondSnapshot,
    getServerSnapshot,
  );

  if (timestamp === 0) {
    return (
      <Card
        className="animate-fade-up h-full overflow-hidden border-border/60"
        style={{ animationDelay: `${delay}ms` }}
      >
        <CardContent className="flex h-full items-center gap-4 p-4 sm:p-5">
          <div className="h-16 w-16 shrink-0 rounded-full border-2 border-border bg-background shadow-inner" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-7 w-24 rounded bg-muted/50" />
            <div className="h-3 w-40 rounded bg-muted/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date(timestamp * 1000);
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minDeg = minutes * 6 + seconds * 0.1;
  const secDeg = seconds * 6;

  const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  const dateString = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card
      className="animate-fade-up h-full overflow-hidden border-border/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="flex h-full items-center gap-4 p-4 sm:p-5">
        <div className="relative h-16 w-16 shrink-0 rounded-full border-2 border-border bg-background shadow-inner">
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              className="absolute inset-0"
              style={{ transform: `rotate(${deg}deg)` }}
            >
              <div className="absolute left-1/2 top-0.75 h-1 w-0.5 -translate-x-1/2 rounded-full bg-muted-foreground/50" />
            </div>
          ))}

          <div
            className="absolute bottom-1/2 left-1/2 -ml-px h-3.5 w-0.5 origin-bottom rounded-full bg-foreground"
            style={{ transform: `rotate(${hourDeg}deg)` }}
          />
          <div
            className="absolute bottom-1/2 left-1/2 -ml-px h-5 w-0.5 origin-bottom rounded-full bg-foreground/60"
            style={{ transform: `rotate(${minDeg}deg)` }}
          />
          <div
            className="absolute bottom-1/2 left-1/2 ml-[-0.5px] h-5 w-px origin-bottom rounded-full bg-violet-500"
            style={{ transform: `rotate(${secDeg}deg)` }}
          />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {timeString}
            <span className="ml-1 text-sm font-medium tabular-nums text-muted-foreground">
              {String(seconds).padStart(2, "0")}
            </span>
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground first-letter:uppercase">
            {dateString}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  iconClass,
  glowClass,
  className,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconClass: string;
  glowClass?: string;
  className?: string;
  delay?: number;
}) {
  return (
    <Card
      className={cn(
        "group animate-fade-up transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg",
        glowClass,
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "animate-icon-pop flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10",
              "transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
              iconClass,
            )}
            style={{ animationDelay: `${delay + 200}ms` }}
          >
            {icon}
          </div>
          <span className="text-xl font-bold tabular-nums sm:text-2xl">
            <AnimatedNumber value={value} delay={delay + 250} />
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-[13px]">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

function KpiBox({
  label,
  color,
  total,
  trend,
  trendValue,
}: {
  label: string;
  color?: string;
  total: number | string;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/50 bg-muted/30 px-2 py-1.5 transition-colors duration-200 hover:bg-muted/50 sm:px-3 sm:py-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {color && (
          <div
            className="h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="truncate text-[10px] text-muted-foreground sm:text-xs">
          {label}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1 sm:mt-1.5 sm:gap-2">
        <span className="text-base font-bold tabular-nums sm:text-xl">
          {typeof total === "number" ? <AnimatedNumber value={total} /> : total}
        </span>
        {trend && (
          <span
            className={cn(
              "flex shrink-0 items-center gap-0.5 text-[9px] font-medium sm:text-[10px]",
              trend === "up" && "text-emerald-600",
              trend === "down" && "text-red-500",
              trend === "stable" && "text-muted-foreground",
            )}
          >
            <TrendIcon trend={trend} />
            {trendValue}%
          </span>
        )}
      </div>
    </div>
  );
}

function TachesChartCard({
  title,
  subtitle,
  data,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  data: {
    date: string;
    attribuees: number;
    enRevue: number;
    terminees: number;
  }[];
  delay?: number;
}) {
  const chartConfig = {
    attribuees: { label: "Attribuées", color: "hsl(var(--chart-4))" },
    enRevue: { label: "En revue", color: "hsl(var(--chart-5))" },
    terminees: { label: "Terminées", color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

  const stats = useMemo(() => {
    const totalAttribuees = data.reduce((s, d) => s + d.attribuees, 0);
    const totalEnRevue = data.reduce((s, d) => s + d.enRevue, 0);
    const totalTerminees = data.reduce((s, d) => s + d.terminees, 0);

    const mid = Math.floor(data.length / 2);
    const first = data.slice(0, mid);
    const second = data.slice(mid);

    const sum = (
      arr: typeof data,
      key: "attribuees" | "enRevue" | "terminees",
    ) => arr.reduce((s, d) => s + d[key], 0);

    const getTrend = (key: "attribuees" | "enRevue" | "terminees") => {
      const f = sum(first, key);
      const s = sum(second, key);
      if (f === 0 && s === 0) return { trend: "stable" as const, value: 0 };
      if (f === 0) return { trend: "up" as const, value: 100 };
      const pct = Math.round(((s - f) / f) * 100);
      if (pct > 5) return { trend: "up" as const, value: pct };
      if (pct < -5) return { trend: "down" as const, value: Math.abs(pct) };
      return { trend: "stable" as const, value: Math.abs(pct) };
    };

    return {
      totalAttribuees,
      totalEnRevue,
      totalTerminees,
      trendAttribuees: getTrend("attribuees"),
      trendEnRevue: getTrend("enRevue"),
      trendTerminees: getTrend("terminees"),
    };
  }, [data]);

  const hasData = data.some(
    (d) => d.attribuees > 0 || d.enRevue > 0 || d.terminees > 0,
  );

  return (
    <Card
      className="animate-fade-up overflow-hidden transition-shadow duration-300 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3">
          <KpiBox
            label={chartConfig.attribuees.label}
            color={chartConfig.attribuees.color}
            total={stats.totalAttribuees}
            trend={stats.trendAttribuees.trend}
            trendValue={stats.trendAttribuees.value}
          />
          <KpiBox
            label={chartConfig.enRevue.label}
            color={chartConfig.enRevue.color}
            total={stats.totalEnRevue}
            trend={stats.trendEnRevue.trend}
            trendValue={stats.trendEnRevue.value}
          />
          <KpiBox
            label={chartConfig.terminees.label}
            color={chartConfig.terminees.color}
            total={stats.totalTerminees}
            trend={stats.trendTerminees.trend}
            trendValue={stats.trendTerminees.value}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasData ? (
          <div className="flex h-52 items-center justify-center text-sm text-muted-foreground sm:h-70">
            Aucune activité sur cette période
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-52 w-full sm:h-70">
            <BarChart
              data={data}
              margin={{ top: 16, right: 4, left: -16, bottom: 0 }}
              barCategoryGap="25%"
              barGap={3}
            >
              <defs>
                <linearGradient id="gradTerminees" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-terminees)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-terminees)"
                    stopOpacity={0.8}
                  />
                </linearGradient>
                <linearGradient id="gradEnRevue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-enRevue)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-enRevue)"
                    stopOpacity={0.8}
                  />
                </linearGradient>
                <linearGradient id="gradAttribuees" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-attribuees)"
                    stopOpacity={1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-attribuees)"
                    stopOpacity={0.8}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="2 4"
                className="stroke-border/60"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatBucket}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                fontSize={9}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                allowDecimals={false}
                fontSize={9}
                domain={[0, "auto"]}
                className="text-muted-foreground"
                width={25}
              />

              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const date = payload?.[0]?.payload?.date;
                      return date ? formatBucket(date) : "";
                    }}
                    className="min-w-40 rounded-lg border bg-popover p-2.5 shadow-lg sm:min-w-45 sm:p-3"
                    formatter={(value, name) => {
                      const config =
                        chartConfig[name as keyof typeof chartConfig];
                      return (
                        <div className="flex w-full items-center justify-between gap-3 py-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-sm sm:h-2.5 sm:w-2.5"
                              style={{ backgroundColor: config?.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {config?.label}
                            </span>
                          </div>
                          <span className="text-xs font-semibold tabular-nums sm:text-sm">
                            {value}
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />

              <Bar
                dataKey="terminees"
                fill="url(#gradTerminees)"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Bar
                dataKey="enRevue"
                fill="url(#gradEnRevue)"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
                animationDuration={700}
                animationEasing="ease-out"
                animationBegin={100}
              />
              <Bar
                dataKey="attribuees"
                fill="url(#gradAttribuees)"
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
                animationDuration={700}
                animationEasing="ease-out"
                animationBegin={200}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function CountChartCard({
  title,
  subtitle,
  data,
  delay = 0,
  label = "Total",
  color = "hsl(var(--chart-2))",
}: {
  title: string;
  subtitle: string;
  data: { date: string; count: number }[];
  delay?: number;
  label?: string;
  color?: string;
}) {
  const chartConfig = {
    count: { label, color },
  } satisfies ChartConfig;

  const stats = useMemo(() => {
    const total = data.reduce((s, d) => s + d.count, 0);
    const avg = data.length > 0 ? (total / data.length).toFixed(1) : "0";
    const max = Math.max(...data.map((d) => d.count), 0);

    const mid = Math.floor(data.length / 2);
    const first = data.slice(0, mid).reduce((s, d) => s + d.count, 0);
    const second = data.slice(mid).reduce((s, d) => s + d.count, 0);

    let trend: "up" | "down" | "stable" = "stable";
    let trendValue = 0;
    if (first > 0) {
      const pct = Math.round(((second - first) / first) * 100);
      if (pct > 10) trend = "up";
      else if (pct < -10) trend = "down";
      trendValue = Math.abs(pct);
    } else if (second > 0) {
      trend = "up";
      trendValue = 100;
    }

    return { total, avg, max, trend, trendValue };
  }, [data]);

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card
      className="animate-fade-up overflow-hidden transition-shadow duration-300 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-3">
          <KpiBox label="Total" total={stats.total} />
          <KpiBox label="Moyenne" total={stats.avg} />
          <KpiBox
            label="Record"
            total={stats.max}
            trend={stats.trend}
            trendValue={stats.trendValue}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!hasData ? (
          <div className="flex h-52 items-center justify-center text-sm text-muted-foreground sm:h-70">
            Aucune donnée sur cette période
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-52 w-full sm:h-70">
            <LineChart
              data={data}
              margin={{ top: 16, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="2 4"
                className="stroke-border/60"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatBucket}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                fontSize={9}
                className="text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                allowDecimals={false}
                fontSize={9}
                domain={[0, "auto"]}
                className="text-muted-foreground"
                width={25}
              />

              <ChartTooltip
                cursor={{
                  stroke: "hsl(var(--muted-foreground))",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const date = payload?.[0]?.payload?.date;
                      return date ? formatBucket(date) : "";
                    }}
                    indicator="dot"
                    className="rounded-lg border bg-popover p-2.5 shadow-lg sm:p-3"
                  />
                }
              />

              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={{
                  r: 2.5,
                  fill: "hsl(var(--background))",
                  stroke: "var(--color-count)",
                  strokeWidth: 1.5,
                }}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: "hsl(var(--background))",
                  fill: "var(--color-count)",
                }}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
function ProjetRow({
  projet,
  delay = 0,
  disableClick = false,
}: {
  projet: ProjetRecent;
  delay?: number;
  disableClick?: boolean;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (disableClick) return;
    router.push(`/projects/${projet.id}/tasks`);
  };

  return (
    <div
      role={disableClick ? undefined : "button"}
      tabIndex={disableClick ? undefined : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (disableClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "group animate-fade-up flex h-auto w-full items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-all duration-200 sm:gap-4 sm:p-3",
        disableClick
          ? "cursor-default border-border/60 bg-muted/20"
          : "cursor-pointer border-border hover:border-violet-500/40 hover:bg-accent",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 sm:h-10 sm:w-10",
            disableClick
              ? "bg-violet-500/5 text-violet-500/70 dark:text-violet-400/70"
              : "bg-violet-500/10 text-violet-600 group-hover:scale-110 dark:text-violet-400",
          )}
        >
          <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium sm:text-sm">
            {projet.titre}
          </p>
          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
            {projet.createurNom && (
              <span className="font-medium text-foreground">
                {projet.createurNom} ·{" "}
              </span>
            )}
            Créé le {new Date(projet.createdAt).toLocaleDateString("fr-FR")} ·{" "}
            {projet.tachesTerminees}/{projet.totalTaches} tâches
          </p>
        </div>
      </div>

      {/* Progression */}
      <div className="hidden w-24 shrink-0 sm:block sm:w-32">
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Progression</span>
          <span>{projet.progression}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="animate-progress h-full rounded-full bg-linear-to-r from-violet-500 to-violet-400"
            style={{
              width: `${projet.progression}%`,
              animationDelay: `${delay + 250}ms`,
            }}
          />
        </div>
      </div>

      {disableClick ? (
        <span></span>
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground sm:h-4 sm:w-4" />
      )}
    </div>
  );
}

function UserRow({ user, delay = 0 }: { user: UserRecent; delay?: number }) {
  const initials =
    `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <div
      className="animate-fade-up flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5 transition-colors hover:bg-accent sm:p-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-500 to-blue-500 text-xs font-bold text-white sm:h-10 sm:w-10">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium sm:text-sm">
            {user.prenom} {user.nom}
          </p>
          <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground sm:text-xs">
        <span className="hidden md:inline">
          Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
          {user.totalProjets} projet{user.totalProjets > 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-7 w-40 sm:h-8 sm:w-48" />
          <Shimmer className="h-3 w-56 sm:h-4 sm:w-64" />
        </div>
        <Shimmer className="h-9 w-32 sm:h-10 sm:w-40" />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-3">
        <Shimmer className="h-28 lg:col-span-2" />
        <Shimmer className="h-28" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer
            key={i}
            className={cn(
              "h-24 sm:h-28",
              i === 4 && "col-span-2 sm:col-span-1",
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-3 w-32" />
        </div>
        <Shimmer className="h-10 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <Shimmer className="h-80 sm:h-105" />
        <Shimmer className="h-80 sm:h-105" />
      </div>

      <Shimmer className="h-48 sm:h-64" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const {
    isAdmin,
    hasHydrated, // ✅ AJOUTER
    stats,
    tachesChart,
    projetsChart,
    usersChart,
    projetsRecents,
    usersRecents,
    range,
    isLoading,
    error,
    chargerDashboard,
    setRange,
  } = useDashboardStore();

  const { greeting, emoji } = useMemo(() => getSalutation(), []);
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  useEffect(() => {
    if (token) chargerDashboard(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange);
    if (token) chargerDashboard(token, newRange);
  };

  const isGithubConnected = !!user?.githubUsername;

  const handleGithubConnect = () => {
    setIsConnectingGithub(true);
    window.location.href = `${API_URL}/auth/github`;
  };

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      {/* HEADER — toujours visible */}
      <div className="animate-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            <span className="animate-float inline-block">{emoji}</span>{" "}
            {greeting}
            {user?.prenom ? `, ${user.prenom}` : ""}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            {isAdmin
              ? "Vue d'ensemble de la plateforme WorkPilot"
              : "Voici un aperçu de votre activité sur WorkPilot"}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => router.push("/projects/Users/newProjects")}
          className="w-full transition-all duration-200 hover:-translate-y-0.5 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Créer un projet
        </Button>
      </div>

      {/* ✅ CONDITION PRINCIPALE :
          - Si pas hydraté OU (chargement ET pas de stats) → SKELETON
          - Sinon → contenu réel avec isAdmin correct
      */}
      {!hasHydrated || (isLoading && !stats) ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* ===== BANNIÈRE + HORLOGE (affichées une seule fois, avec la bonne bannière) ===== */}
          <div className="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {isAdmin ? (
                <AdminBanner delay={80} />
              ) : (
                <GithubBanner
                  connected={isGithubConnected}
                  username={user?.githubUsername ?? null}
                  isConnecting={isConnectingGithub}
                  onConnect={handleGithubConnect}
                  onOpenProfile={() =>
                    window.open(
                      `https://github.com/${user?.githubUsername}`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                />
              )}
            </div>
            <ClockWidget delay={160} />
          </div>

          <div
            className={cn(
              "space-y-4 transition-opacity sm:space-y-6",
              isLoading && "pointer-events-none opacity-60",
            )}
          >
            {/* STATS */}
            <div
              className={cn(
                "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4",
                isAdmin ? "lg:grid-cols-6" : "lg:grid-cols-5",
              )}
            >
              <StatCard
                icon={<Folder className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Projets créés"
                value={stats?.totalProjets ?? 0}
                iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
                glowClass="hover:shadow-violet-500/10"
                delay={140}
              />

              {isAdmin && (
                <StatCard
                  icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
                  label="Utilisateurs"
                  value={stats?.totalUsers ?? 0}
                  iconClass="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                  glowClass="hover:shadow-cyan-500/10"
                  delay={180}
                />
              )}

              <StatCard
                icon={<Loader2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Attribuées"
                value={stats?.attribuees ?? 0}
                iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                glowClass="hover:shadow-amber-500/10"
                delay={200}
              />
              <StatCard
                icon={<GitPullRequest className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="En revue"
                value={stats?.enRevue ?? 0}
                iconClass="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                glowClass="hover:shadow-orange-500/10"
                delay={260}
              />
              <StatCard
                icon={<CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Terminées"
                value={stats?.terminees ?? 0}
                iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                glowClass="hover:shadow-emerald-500/10"
                delay={320}
              />
              <StatCard
                icon={<GitMerge className="h-4 w-4 sm:h-5 sm:w-5" />}
                label="Pull Requests"
                value={stats?.totalPullRequests ?? 0}
                iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                glowClass="hover:shadow-blue-500/10"
                className={cn(!isAdmin && "col-span-2 sm:col-span-1")}
                delay={380}
              />
            </div>

            {/* SÉLECTEUR DE PÉRIODE */}
            <div
              className="animate-fade-up flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              style={{ animationDelay: "440ms" }}
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Évolution dans le temps
                </h2>
                <p className="text-xs text-muted-foreground">
                  {RANGE_LABELS[range]}
                </p>
              </div>
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TimeRangeSelector
                  value={range}
                  onChange={handleRangeChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* GRAPHIQUES */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              <TachesChartCard
                key={`taches-${range}`}
                title="Cycle de vie des tâches"
                subtitle={RANGE_LABELS[range]}
                data={tachesChart}
                delay={500}
              />
              <CountChartCard
                key={`projets-${range}`}
                title={isAdmin ? "Tous les projets créés" : "Projets créés"}
                subtitle={RANGE_LABELS[range]}
                data={projetsChart}
                label="Projets"
                color="hsl(var(--chart-2))"
                delay={580}
              />
            </div>

            {/* PROJETS RÉCENTS */}
            <Card
              className="animate-fade-up"
              style={{ animationDelay: "660ms" }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
                <CardTitle className="text-sm font-semibold">
                  {isAdmin
                    ? "Derniers projets (tous utilisateurs)"
                    : "Projets récents"}
                </CardTitle>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() =>
                    router.push(isAdmin ? "/projects/admin" : "/projects/Users")
                  }
                >
                  {isAdmin ? "Voir tous les projets →" : "Voir tout →"}
                </Button>
              </CardHeader>

              <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                {projetsRecents.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground sm:py-12">
                    <Folder className="h-7 w-7 sm:h-8 sm:w-8" />
                    <p className="text-xs sm:text-sm">
                      Aucun projet pour le moment
                    </p>
                    <Button
                      size="sm"
                      className="mt-1"
                      onClick={() => router.push("/projects/Users/newProjects")}
                    >
                      <Plus className="h-4 w-4" />
                      Créer mon premier projet
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {projetsRecents.map((projet, index) => (
                      <ProjetRow
                        key={projet.id}
                        projet={projet}
                        delay={700 + index * 80}
                        disableClick={isAdmin}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isAdmin && (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                <CountChartCard
                  key={`users-${range}`}
                  title="Inscriptions utilisateurs"
                  subtitle={RANGE_LABELS[range]}
                  data={usersChart}
                  label="Utilisateurs"
                  color="hsl(var(--chart-3))"
                  delay={800}
                />

                <Card
                  className="animate-fade-up"
                  style={{ animationDelay: "880ms" }}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
                    <CardTitle className="text-sm font-semibold">
                      Nouveaux utilisateurs
                    </CardTitle>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-600 dark:text-cyan-400">
                      {usersRecents.length} récent
                      {usersRecents.length > 1 ? "s" : ""}
                    </span>
                  </CardHeader>

                  <CardContent className="space-y-1.5 px-3 pb-3 sm:space-y-2 sm:px-6 sm:pb-6">
                    {usersRecents.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        Aucun utilisateur inscrit
                      </p>
                    ) : (
                      usersRecents.map((u, i) => (
                        <UserRow key={u.id} user={u} delay={920 + i * 70} />
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
