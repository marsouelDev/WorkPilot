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

export default function CreateProject() {
  const router = useRouter();
  const { token } = useAuthStore();
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
      depotGitUrl: "",
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366F1]/10">
                <Folder className="h-4 w-4 text-[#6366F1]" />
              </div>

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
              <Label
                htmlFor="depotGitUrl"
                className="flex items-center gap-2 font-medium text-[#0F172A] dark:text-white"
              >
                <FolderGit2 className="h-4 w-4 text-[#B95F00]" />
                URL du dépôt Git
              </Label>

              <div className="relative">
                <FolderGit2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="depotGitUrl"
                  type="url"
                  placeholder="https://github.com/username/projet"
                  disabled={isCreating}
                  {...register("depotGitUrl")}
                  className="h-11 border-muted-foreground/20 pl-10 transition focus-visible:border-[#B95F00] focus-visible:ring-[#B95F00]"
                />
              </div>

              {errors.depotGitUrl && (
                <p className="text-sm text-red-500">
                  {errors.depotGitUrl.message}
                </p>
              )}

            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

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
                  disabled={isCreating || !token}
                  className="h-11 sm:min-w-44 bg-[#6366F1] text-white transition hover:bg-[#2e24e0]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Veuillez patienter quelques minutes, s&apos;il vous
                      plaît...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer le projet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#B95F00]/20 bg-[#B95F00]/5 px-4 py-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#B95F00]/10">
            <span className="text-xs font-bold text-[#B95F00]">i</span>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Après la création du projet, WorkPilot générera automatiquement
            votre cahier des charges et les tâches associées.
          </p>
        </div>
      </div>
    </div>
  );
}
