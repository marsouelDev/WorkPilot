"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  FolderGit2,
  Loader2,
  Plus,
  Text,
  AlignLeft,
  Folder,
  CheckCircle2,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { CreateProjectDto } from "@/types/projectType";
import { ProjetSchema } from "@/schemas/projectSchemas";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export default function CreateProject() {
  const router = useRouter();
  const { token, user, connectGithub } = useAuthStore();
  const { createProject, isCreating, error } = useProjectStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectDto>({
    resolver: zodResolver(ProjetSchema),
    defaultValues: {
      titre: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateProjectDto) => {
    if (!token) {
      return;
    }
    try {
      const response = await createProject(token, data);

      console.log("Projet créé :", response);

      const projetId = response.projet.id;

      router.push(`/projects/${projetId}/cahier-des-charges`);
    } catch (error) {
      console.error("Erreur lors de la création du projet :", error);
    }
  };

  const handleConnectGithub = async () => {
    try {
      await connectGithub();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-full w-full">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#6366F1]/10">
              <Folder className="h-6 w-6 text-[#6366F1]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white sm:text-3xl">
                Créer un projet
              </h1>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isCreating}
            className="gap-2 border-[#0F172A] text-[#0F172A] transition hover:bg-[#0F172A] hover:text-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-[#0F172A]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="border-b bg-[#6366F1]/5 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-semibold text-[#0F172A] dark:text-white">
                  Informations du projet
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Renseignez les informations ci-dessous pour créer votre
                  projet.
                </p>
              </div>
            </div>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-7 p-6 sm:p-8"
          >
            <div className="space-y-2">
              <Label
                htmlFor="titre"
                className="flex items-center gap-2 font-medium text-[#0F172A] dark:text-white"
              >
                <Text className="h-4 w-4 text-[#6366F1]" />
                Titre du projet
              </Label>

              <div className="relative">
                <FolderKanban className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="titre"
                  type="text"
                  placeholder="Ex : EduSport"
                  disabled={isCreating}
                  {...register("titre")}
                  className="h-11 border-muted-foreground/20 pl-10 transition focus-visible:border-[#6366F1] focus-visible:ring-[#6366F1]"
                />
              </div>

              {errors.titre && (
                <p className="text-sm text-red-500">{errors.titre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="flex items-center gap-2 font-medium text-[#0F172A] dark:text-white"
              >
                <AlignLeft className="h-4 w-4 text-[#6366F1]" />
                Description du projet
              </Label>

              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 z-10 h-4 w-4 text-muted-foreground" />

                <Textarea
                  id="description"
                  placeholder="Décrivez votre projet en détail..."
                  disabled={isCreating}
                  rows={6}
                  {...register("description")}
                  className="resize-none border-muted-foreground/20 pl-10 pt-3 transition focus-visible:border-[#6366F1] focus-visible:ring-[#6366F1]"
                />
              </div>

              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium text-[#0F172A] dark:text-white">
                <FolderGit2 className="h-4 w-4 text-[#B95F00]" />
                Dépôt GitHub
              </Label>
              {user?.githubUsername ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <GithubIcon className="h-4 w-4 text-emerald-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-emerald-700">
                        GitHub connecté
                      </p>

                      <p className="truncate text-xs text-emerald-600">
                        @{user.githubUsername}
                      </p>
                    </div>

                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-[#6366F1]/20 bg-[#6366F1]/5 p-3">
                    <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6366F1]" />

                    <p className="text-xs leading-5 text-muted-foreground">
                      Un dépôt nommé{" "}
                      <code className="rounded bg-[#6366F1]/10 px-1.5 py-0.5 text-xs font-mono text-[#6366F1]">
                        le {"{"}titre-du-projet{"}"}
                      </code>{" "}
                      sera créé automatiquement sur votre compte GitHub après la
                      création du projet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border border-dashed border-[#B95F00]/30 bg-[#B95F00]/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B95F00]/10">
                      <GithubIcon className="h-4 w-4 text-[#B95F00]" />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0F172A] dark:text-white">
                        Connectez votre compte GitHub
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Pour créer un dépôt GitHub automatiquement et inviter
                        vos collaborateurs, vous devez d&apos;abord connecter
                        votre compte GitHub.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConnectGithub}
                    disabled={isCreating}
                    className="w-full bg-[#24292f] text-white hover:bg-[#24292f]/90"
                  >
                    <GithubIcon className="mr-2 h-4 w-4" />
                    Connecter mon compte GitHub
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Vous serez redirigé vers GitHub puis reviendrez ici
                    automatiquement.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* BOUTONS */}

            <div className="border-t pt-6">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isCreating}
                  className="h-11 sm:min-w-32 border-[#0F172A] text-[#0F172A] transition hover:bg-[#0F172A] hover:text-white dark:border-slate-600 dark:text-slate-200 dark:hover:bg-[#0F172A]"
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  disabled={isCreating || !token || !user?.githubUsername}
                  className="h-11 sm:min-w-44 bg-[#6366F1] text-white transition hover:bg-[#2e24e0] disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Veuillez patienter...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer le projet
                    </>
                  )}
                </Button>
              </div>

              {!user?.githubUsername && (
                <p className="mt-2 text-center text-xs text-muted-foreground sm:text-right">
                  Connectez GitHub pour activer la création du projet
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#B95F00]/20 bg-[#B95F00]/5 px-4 py-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B95F00]/10">
            <span className="text-xs font-bold text-[#B95F00]">i</span>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Après la création du projet, WorkPilot générera automatiquement
            votre cahier des charges, les tâches associées et créera le dépôt
            GitHub avec vos collaborateurs invités.
          </p>
        </div>
      </div>
    </div>
  );
}
