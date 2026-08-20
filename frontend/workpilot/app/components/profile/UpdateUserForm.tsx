"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { updateSchema } from "@/schemas/authSchemas";
import { UpdateProfileFormData } from "@/types/authTypes";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";


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

export default function UpdateUserForm() {
  const {
    user,
    getProfile,
    updateUser,
    isLoadingProfile,
    isUpdating,
    error,
    clearError,
  } = useAuthStore();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      telephone: "",
    },
  });

  const { control, setValue } = form;

  const telephone = useWatch({
    control,
    name: "telephone",
  });

  useEffect(() => {
    if (!user) {
      getProfile();
    }
  }, [user, getProfile]);

  useEffect(() => {
    if (user) {
      form.reset({
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (!feedback) return;

    const timer = window.setTimeout(() => setFeedback(null), 4000);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      clearError();
      await updateUser(data);

      setFeedback({
        type: "success",
        message: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Une erreur est survenue.",
      });
    }
  };

  if (isLoadingProfile) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-[#F8F9FF]">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-4 w-80" />
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}

          <Skeleton className="h-11 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b ">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6366F1]/10">
            <User className="h-5 w-5 text-[#6366F1]" />
          </div>

          <div>
            <CardTitle className="text-lg" style={{ color: "#0F172A" }}>
              Informations personnelles
            </CardTitle>

            <CardDescription>
              Gérez vos informations de profil publiques.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
        {feedback && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <p>{feedback.message}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nom" className="text-[#0F172A]">
              Nom
            </Label>

            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input id="nom" {...form.register("nom")} className="pl-10" />
            </div>

            {form.formState.errors.nom && (
              <p className="text-xs text-red-600">
                {form.formState.errors.nom.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prenom" className="text-[#0F172A]">
              Prénom
            </Label>

            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="prenom"
                {...form.register("prenom")}
                className="pl-10"
              />
            </div>

            {form.formState.errors.prenom && (
              <p className="text-xs text-red-600">
                {form.formState.errors.prenom.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#0F172A]">
            Email
          </Label>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="email"
              value={user?.email ?? ""}
              disabled
              className="pl-10 bg-muted/40 cursor-not-allowed"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            L&apos;adresse email ne peut pas être modifiée.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telephone" className="text-[#0F172A]">
            Téléphone
          </Label>

          <div className="rounded-lg border border-input px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-[#6366F1]/30 focus-within:border-[#6366F1]">
            <PhoneInput
              value={telephone}
              onChange={(value) =>
                setValue("telephone", value ?? "", { shouldValidate: true })
              }
            />
          </div>

          {form.formState.errors.telephone && (
            <p className="text-xs text-red-600">
              {form.formState.errors.telephone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="github" className="text-[#0F172A]">
            Compte GitHub
          </Label>

          <div className="relative">
            <GithubIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="github"
              value={user?.githubUsername ? `@${user.githubUsername}` : ""}
              disabled
              placeholder="Non connecté"
              className="pl-10 bg-muted/40 cursor-not-allowed"
            />

            {user?.githubUsername && (
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-[#6366F1]"
                title="Voir le profil GitHub"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {user?.githubUsername ? (
              <>
                Connecté via OAuth. Utilisez l&apos;onglet{" "}
                <span className="font-medium">Intégrations</span> pour modifier
                la connexion.
              </>
            ) : (
              <>
                Connectez votre compte GitHub dans l&apos;onglet{" "}
                <span className="font-medium">Intégrations</span> pour être
                invité automatiquement sur les dépôts de vos projets.
              </>
            )}
          </p>
        </div>

        <Button
          type="submit"
          disabled={isUpdating || !form.formState.isDirty}
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: "#6366F1" }}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
