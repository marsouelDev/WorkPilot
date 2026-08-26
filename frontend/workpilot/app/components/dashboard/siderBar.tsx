"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  Folder,
  LogOut,
  BellRing,
  GitPullRequest,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const SIDEBAR_COLOR = "#6366F1";
const SIDEBAR_DARK = "#4f46e5";

type SidebarItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: string[];
  matchPrefix?: string;
};

const items: SidebarItem[] = [
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
    title: "Projects",
    url: "/projects/admin",
    icon: Folder,
    roles: ["admin"],
    matchPrefix: "/projects",
  },
  {
    title: "Projects",
    url: "/projects/Users",
    icon: Folder,
    roles: ["membre"],
    matchPrefix: "/projects",
  },
  {
    title: "Pull-Requests",
    url: "/pull-requests",
    icon: GitPullRequest,
    roles: ["membre"],
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: BellRing,
    roles: ["admin", "membre"],
  },
  {
    title: "Profil",
    url: "/profile",
    icon: User,
    roles: ["admin", "membre"],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const filteredItems = items.filter((item) =>
    item.roles.includes(user?.role?.toLowerCase() ?? ""),
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="bg-[#6366F1]!"
      style={
        {
          "--sidebar": SIDEBAR_COLOR,
          "--sidebar-background": SIDEBAR_COLOR,
          "--sidebar-foreground": "#ffffff",
          "--sidebar-accent": "rgba(255, 255, 255, 0.12)",
          "--sidebar-accent-foreground": "#ffffff",
          "--sidebar-primary": SIDEBAR_DARK,
          "--sidebar-primary-foreground": "#ffffff",
          "--sidebar-border": "rgba(255, 255, 255, 0.18)",
          "--sidebar-ring": "#ffffff",
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="border-b border-white/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-white/10">
              <Image
                src="/logo.png"
                alt="WorkPilot logo"
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-0.5"
              />

              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-base font-bold text-white">
                  WorkPilot
                </span>
                <span className="text-xs text-white/70">
                  Gestion de projets
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const Icon = item.icon;

                /* Actif si préfixe matché, URL exacte ou sous-chemin */
                const isActive = item.matchPrefix
                  ? pathname.startsWith(item.matchPrefix)
                  : pathname === item.url ||
                    pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title + item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={isActive}
                      className={
                        isActive
                          ? "bg-white! text-[#6366F1]! font-semibold hover:bg-white! hover:text-[#6366F1]! data-[active=true]:bg-white! data-[active=true]:text-[#6366F1]!"
                          : "text-white hover:bg-white/10! hover:text-white data-[active=true]:bg-white! data-[active=true]:text-[#6366F1]!"
                      }
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

      <SidebarFooter className="border-t border-white/20">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#6366F1]">
                {user?.prenom?.charAt(0).toUpperCase()}
                {user?.nom?.charAt(0).toUpperCase()}
              </div>

              <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="truncate text-xs text-white/70">
                  {user?.role === "admin" ? "Administrateur" : "Membre"}
                </p>
              </div>
            </div>
          </SidebarMenuItem>

          <SidebarSeparator className="bg-white/20!" />

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Déconnexion"
              className="text-red-200 hover:bg-white/10! hover:text-red-100"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
