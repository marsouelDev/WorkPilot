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
  const { hasHydrated, token, user, getProfile } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && token && !user) {
      getProfile();
    }
  }, [hasHydrated, token, user, getProfile]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="min-w-0">
        <Nav>
          <SidebarTrigger className="-ml-1" />
        </Nav>

        <main className="flex-1 bg-muted/30 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
