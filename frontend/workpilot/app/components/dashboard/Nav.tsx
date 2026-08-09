"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useAuthStore } from "@/stores/authStore";

interface NavProps {
  children?: React.ReactNode;
}

export default function Nav({ children }: NavProps) {
  const { user, token, hasHydrated, isLoadingProfile, logout } = useAuthStore();
  const router = useRouter();
  console.log({
    hasHydrated,
    isLoadingProfile,
    user,
  });
  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace("/");
    }
  }, [hasHydrated, token, router]);

  const handleLogout = () => {
    logout();

    router.replace("/");
  };

  if (!hasHydrated) {
    return (
      <header className="h-16 border-b bg-white">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {children}

            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />

              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />

            <Skeleton className="hidden md:block h-5 w-24" />

            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>
    );
  }

  if (!user || !token || isLoadingProfile) {
    return (
      <header className="h-16 border-b bg-white">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {children}

            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />

            <Skeleton className="hidden md:block h-5 w-24" />

            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className=" sticky  top-0  z-50  h-16  border-b  bg-white/90  backdrop-blur  ">
      <div className=" flex h-full items-center justify-between px-3 ">
        <div className="  flex  items-center  gap-2  sm:gap-4  min-w-0">
          {children}
          <div className="hidden xs:block">
            <h1 className="truncate  text-sm sm:text-lg font-semibold text-gray-900 ">
              Tableau de bord
            </h1>
            <p className=" hidden sm:block text-xs sm:text-sm text-gray-500">
              Bienvenue sur WorkPilot
            </p>
          </div>
        </div>

        <div className="  flex items-center gap-2 sm:gap-6">
          <div className=" flex items-center gap-2 ">
            <div className=" flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full  bg-emerald-600 text-whitefont-bold">
              {user.nom?.charAt(0).toUpperCase()}
            </div>

            <div className="hidden md:block">
              <p className="max-w-32 truncate font-medium text-gray-900 ">
                {user.nom}
              </p>
            </div>
            <span className=" hidden sm:block  rounded-full  bg-emerald-100   px-3 py-1  text-xs font-semibold capitalize text-emerald-70 ">
              {user.role}
            </span>
          </div>

          <Button variant="destructive" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 sm:hidden" />

            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
