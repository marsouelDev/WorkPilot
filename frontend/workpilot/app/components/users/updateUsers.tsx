"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  User,
  Mail,
  Save,
  Loader2,
  ExternalLink,
  Pencil,
  Crown,
} from "lucide-react";
import { updateSchema } from "@/schemas/authSchemas";
import type { UpdateProfileFormData } from "@/types/authTypes";
import type { User as UserRow } from "@/types/userTypes";
import { useUserStore } from "@/stores/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PhoneInput from "@/components/ui/PhoneInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface UpdateUsersProps {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UpdateUsers({
  user,
  open,
  onOpenChange,
}: UpdateUsersProps) {
  const { updateUserAdmin, getUsers, isUpdating, error, clearError } =
    useUserStore();

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateSchema),
    defaultValues: { nom: "", prenom: "", telephone: "" },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = form;

  const telephone = useWatch({ control, name: "telephone" });

  useEffect(() => {
    if (user && open) {
      reset({
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone ?? "",
      });
    }
  }, [user, open, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    if (!user) return;
    try {
      clearError();
      await updateUserAdmin(user.id, data);
      await getUsers();
      reset(data);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      clearError();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border/60 p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6366F1]/10 text-[#6366F1]">
              <Pencil className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-left">
                Modifier l&apos;utilisateur
              </DialogTitle>
              <DialogDescription className="text-left">
                {user?.prenom} {user?.nom} · {user?.email}
              </DialogDescription>
            </div>
            {user?.roleGlobal === "admin" && (
              <Badge className="border-amber-200 bg-amber-500/10 text-amber-700">
                <Crown className="mr-1 h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 pt-4">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#6366F1]" />
                Nom
              </Label>
              <Input
                placeholder="Nom"
                className="focus-visible:ring-[#6366F1]"
                {...register("nom")}
              />
              {errors.nom && (
                <p className="text-xs text-red-500">{errors.nom.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#6366F1]" />
                Prénom
              </Label>
              <Input
                placeholder="Prénom"
                className="focus-visible:ring-[#6366F1]"
                {...register("prenom")}
              />
              {errors.prenom && (
                <p className="text-xs text-red-500">{errors.prenom.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                value={user?.email ?? ""}
                disabled
                className="cursor-not-allowed bg-muted/40 pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              L&apos;email ne peut pas être modifié.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Téléphone</Label>
            <div className="rounded-lg border border-input px-3 py-2 transition-all focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]/30">
              <PhoneInput
                value={telephone}
                onChange={(value) =>
                  setValue("telephone", value ?? "", { shouldValidate: true })
                }
              />
            </div>
            {errors.telephone && (
              <p className="text-xs text-red-600">{errors.telephone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Compte GitHub</Label>
            <div className="relative">
              <GithubIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={user?.githubUsername ? `@${user.githubUsername}` : ""}
                disabled
                placeholder="Non connecté"
                className="cursor-not-allowed bg-muted/40 pl-10"
              />
              {user?.githubUsername && (
                <a
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#6366F1]"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || !isDirty}
              className="text-white hover:opacity-90"
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
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
