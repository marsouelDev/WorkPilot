"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Inbox,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

interface NavProps {
  children?: React.ReactNode;
}

function tempsRelatif(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;

  const jours = Math.floor(heures / 24);
  return `il y a ${jours} j`;
}

export default function Nav({ children }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, token, hasHydrated, isLoading, logout } = useAuthStore();

  const { notifications, nonLues, charger, marquerLue, toutMarquerLues } =
    useNotificationStore();

  useNotificationSocket();

  useEffect(() => {
    if (token) charger(token);
  }, [token, charger]);

  const [notifOpen, setNotifOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const openNotifications = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    setNotifOpen(true);
  };

  const scheduleCloseNotifications = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }

    closeTimer.current = window.setTimeout(() => {
      setNotifOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!token) {
      router.push("/login");
    }
  }, [hasHydrated, token, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleClickNotification = (id: number, projetId: number | null) => {
    if (token) marquerLue(token, id);

    setNotifOpen(false);

    if (projetId) {
      router.push(`/projects/${projetId}/cahier-des-charges`);
    } else {
      router.push("/notifications");
    }
  };

  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      projects: "Projets",
      users: "Utilisateurs",
      profile: "Profil",
      tasks: "Tâches",
      taches: "Tâches",
      notifications: "Notifications",
      "cahier-des-charges": "Cahier des charges",
      "create-project": "Créer un projet",
      admin: "Administration",
    };

    return (
      labels[segment.toLowerCase()] ??
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  };

  const segments = pathname.split("/").filter(Boolean);

  /* ✅ Segments techniques masqués (insensible à la casse) */
  const HIDDEN_SEGMENTS = new Set(["projects", "users", "ia"]);

  /* ✅ Masque : projects, Users, ia + TOUS les IDs numériques (12, 29...) */
  const visibleSegments = segments.filter((segment) => {
    const lower = segment.toLowerCase();

    /* Segments techniques */
    if (HIDDEN_SEGMENTS.has(lower)) return false;

    /* IDs numériques (projetId, taskId...) */
    if (/^\d+$/.test(segment)) return false;

    return true;
  });

  if (!hasHydrated || isLoading) {
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
        <Skeleton className="h-5 w-32" />

        <Skeleton className="h-9 w-9 rounded-full" />
      </header>
    );
  }

  if (!token || !user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        {children}

        <nav className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          {visibleSegments.map((segment, index) => (
            <div
              key={`${segment}-${index}`}
              className="flex min-w-0 items-center gap-2"
            >
              <span
                className={
                  index === visibleSegments.length - 1
                    ? "truncate font-semibold text-foreground"
                    : "truncate text-muted-foreground"
                }
              >
                {getSegmentLabel(segment)}
              </span>
            </div>
          ))}
        </nav>

        <div className="min-w-0 truncate text-sm font-semibold md:hidden">
          {visibleSegments.length > 0
            ? getSegmentLabel(visibleSegments[visibleSegments.length - 1])
            : "Dashboard"}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu
          open={notifOpen}
          onOpenChange={(next) => {
            if (!next) {
              setNotifOpen(false);
            }
          }}
        >
          <DropdownMenuTrigger
            onMouseEnter={openNotifications}
            onMouseLeave={scheduleCloseNotifications}
            onClick={() => {
              setNotifOpen(false);
              router.push("/notifications");
            }}
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                title="Notifications"
              />
            }
          >
            <Bell className="h-4 w-4" />

            {nonLues > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {nonLues > 9 ? "9+" : nonLues}
              </span>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-80"
            onMouseEnter={openNotifications}
            onMouseLeave={scheduleCloseNotifications}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold">Notifications</p>

              {nonLues > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground"
                  onClick={() => token && toutMarquerLues(token)}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tout marquer lu
                </Button>
              )}
            </div>

            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                <Inbox className="h-6 w-6 text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  Aucune notification
                </p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() =>
                      handleClickNotification(
                        notification.id,
                        notification.projetId,
                      )
                    }
                    className="flex cursor-pointer items-start gap-3 px-3 py-3 transition hover:bg-muted/60"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.lue ? "bg-transparent" : "bg-[#6366F1]"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          notification.lue
                            ? "font-normal text-muted-foreground"
                            : "font-semibold text-foreground"
                        }`}
                      >
                        {notification.titre}
                      </p>

                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {tempsRelatif(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DropdownMenuSeparator />

            <div className="p-1">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setNotifOpen(false);
                  router.push("/notifications");
                }}
              >
                Voir toutes les notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-tight">
            {user.prenom} {user.nom}
          </p>

          <p className="text-xs text-muted-foreground">
            {user.role === "admin" ? "Administrateur" : "Membre"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto gap-1.5 rounded-full p-1 hover:bg-muted"
              />
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-sm font-semibold text-primary-foreground">
              {user.prenom?.charAt(0).toUpperCase()}
              {user.nom?.charAt(0).toUpperCase()}
            </div>

            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 px-2 py-1.5">
              <p className="text-sm font-medium">
                {user.prenom} {user.nom}
              </p>

              <p className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Administrateur" : "Membre"}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <UserIcon className="h-4 w-4" />
              Profil
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoading}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
