"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  BookOpenText,
  GitBranch,
  ListTodo,
  Users,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProjectNavigationProps {
  projetId: number;
  active: "cahier-des-charges" | "tasks" | "members" | "branches" | "livrables";
  disabled?: boolean;
}

export default function Navigation({
  projetId,
  active,
  disabled = false,
}: ProjectNavigationProps) {
  const router = useRouter();

  const menus = [
    {
      key: "cahier-des-charges" as const,
      label: "Cahier des charges",
      href: `/projects/${projetId}/cahier-des-charges`,
      icon: FileText,
    },
    {
      key: "tasks" as const,
      label: "Voir les tâches",
      href: `/projects/${projetId}/tasks`,
      icon: ListTodo,
    },
    {
      key: "members" as const,
      label: "Utilisateurs",
      href: `/projects/${projetId}/membres`,
      icon: Users,
    },
    {
      key: "branches" as const,
      label: "Branches",
      href: `/projects/${projetId}/branches`,
      icon: GitBranch,
    },
    {
      key: "livrables" as const,
      label: "Livrables",
      href: `/projects/${projetId}/livrables`,
      icon: BookOpenText,
    },
  ];

  return (
    <nav
      aria-label="Navigation du projet"
      className="flex w-full items-center gap-2"
    >
      {menus.map((menu) => {
        const Icon = menu.icon;
        const isActive = active === menu.key;

        if (isActive) {
          return (
            <Button
              key={menu.key}
              type="button"
              disabled
              aria-current="page"
              className="h-10 w-10 shrink-0 bg-[#080be6] p-0 text-white hover:bg-[#4f46e5] sm:w-auto sm:px-4"
            >
              <Icon className="h-4 w-4 sm:mr-2" />

              <span className="hidden sm:inline">{menu.label}</span>
            </Button>
          );
        }

        return (
          <Link
            key={menu.key}
            href={menu.href}
            className="shrink-0"
            aria-label={menu.label}
          >
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-10 w-10 p-0 sm:w-auto sm:px-4"
            >
              <Icon className="h-4 w-4 sm:mr-2" />

              <span className="hidden sm:inline">{menu.label}</span>
            </Button>
          </Link>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() => router.back()}
        disabled={disabled}
        aria-label="Retour"
        className="ml-auto h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-4"
      >
        <ArrowLeft className="h-4 w-4 sm:mr-2" />

        <span className="hidden sm:inline">Retour</span>
      </Button>
    </nav>
  );
}
