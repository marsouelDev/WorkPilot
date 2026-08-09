"use client";

import { ReactNode, useEffect } from "react";

import AppSidebar from "@/app/components/dashboard/siderBar";
import Nav from "@/app/components/dashboard/Nav";

import { useAuthStore } from "@/stores/authStore";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { hasHydrated, token, user, getProfile, isLoadingProfile } =
    useAuthStore();

  useEffect(() => {
    if (hasHydrated && token && !user) {
      getProfile();
    }
  }, [hasHydrated, token, user, getProfile]);

  if (!hasHydrated || (token && (!user || isLoadingProfile))) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-white animate-pulse" />
        <div className="flex-1">
          <div className="h-16 border-b bg-white animate-pulse" />
          <div className="p-6">
            <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <Nav>
          <SidebarTrigger />
        </Nav>

        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
