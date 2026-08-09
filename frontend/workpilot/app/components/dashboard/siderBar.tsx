"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, User, Settings } from "lucide-react";

import { useAuthStore } from "@/stores/authStore";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "membre"],
  },
  {
    title: "Utilisateurs",
    url: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Profil",
    url: "/profile",
    icon: User,
    roles: ["admin", "membre"],
  },
  {
    title: "Paramètres",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  const { user } = useAuthStore();

  const filteredItems = items.filter((item) =>
    item.roles.includes(user?.role?.toLowerCase() ?? ""),
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      {/* HEADER LOGO */}
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Image
                src="/logo.png"
                alt="WorkPilot logo"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
              />

              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-base">WorkPilot</span>

                <span className="text-xs text-muted-foreground">
                  Gestion de projets
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* MENU */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Icon className="h-4 w-4 shrink-0" />

                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
