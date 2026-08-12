"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/authStore";

interface NavProps {
  children?: React.ReactNode;
}

export default function Nav({ children }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, token, hasHydrated, isLoading, logout } = useAuthStore();

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

  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      dashboard: "Dashboard",
      projects: "Projets",
      users: "Utilisateurs",
      profile: "Profil",
      settings: "Paramètres",
      tasks: "Tâches",
      "cahier-des-charges": "Cahier des charges",
      "create-project": "Créer un projet",
      admin: "Administration",
    };

    return (
      labels[segment] ??
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  };

  const segments = pathname.split("/").filter(Boolean);

  const visibleSegments = segments.filter((segment, index) => {
    if (segment === "projects" || segment === "Users") {
      return false;
    }

    if (segments[index - 1] === "projects" && !Number.isNaN(Number(segment))) {
      return false;
    }

    if (segments[index - 1] === "Users" && !Number.isNaN(Number(segment))) {
      return false;
    }

    return true;
  });

  if (!hasHydrated || isLoading) {
    return (
      <header className="flex h-16 items-center justify-between border-b px-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </header>
    );
  }

  if (!token || !user) {
    return null;
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center">
        {children}

        {/* Breadcrumb desktop */}
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

        {/* Titre mobile */}
        <div className="min-w-0 truncate text-sm font-semibold md:hidden">
          {visibleSegments.length > 0
            ? getSegmentLabel(visibleSegments[visibleSegments.length - 1])
            : "Dashboard"}
        </div>
      </div>

      {/* Utilisateur */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">
            {user.prenom} {user.nom}
          </p>

          <p className="text-xs text-muted-foreground">
            {user.role === "admin" ? "Administrateur" : "Membre"}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {user.prenom?.charAt(0).toUpperCase()}
          {user.nom?.charAt(0).toUpperCase()}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Se déconnecter"
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
