"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Mail } from "lucide-react";

import { updateSchema } from "@/schemas/authSchemas";
import { UpdateProfileFormData } from "@/types/authTypes";
import { useAuthStore } from "@/stores/authStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import PhoneInput from "@/components/ui/PhoneInput";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";

import ChangePassword from "@/app/components/profile/ChangePassword";

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

  const [open, setOpen] = useState(false);

  const [dialogTitle, setDialogTitle] = useState("");

  const [dialogMessage, setDialogMessage] = useState("");

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

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      clearError();

      await updateUser(data);

      setDialogTitle("Profil mis à jour");

      setDialogMessage(
        "Vos informations personnelles ont été mises à jour avec succès.",
      );

      setOpen(true);
    } catch (error) {
      console.error(error);

      setDialogTitle("Erreur");

      setDialogMessage(
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );

      setOpen(true);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="space-y-2">
            <Skeleton className="h-4 w-32" />

            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ))}

        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
          {error && (
            <div className="rounded-lg  border border-red-500 bg-red-50 p-3 text-red-600  ">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2  text-muted-foreground " />
              <Input id="nom" {...form.register("nom")} className="pl-10" />
            </div>
            {form.formState.errors.nom && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nom.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="prenom">Prénom</Label>

            <div className="relative">
              <User className=" absolute left-3 top-1/2 h-4 w-4-translate-y-1/2 text-muted-foreground" />
              <Input
                id="prenom"
                {...form.register("prenom")}
                className="pl-10"
              />
            </div>
            {form.formState.errors.prenom && (
              <p className="text-sm text-red-500">
                {form.formState.errors.prenom.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>

            <div className="relative">
              <Mail className=" absolute left-3 top-1/2 h-4 w-4-translate-y-1/2 text-muted-foreground " />
              <Input
                value={user?.email ?? ""}
                disabled
                className="
                pl-10
                bg-muted
                cursor-not-allowed
                "
              />
            </div>
            <p className="text-xs text-muted-foreground">
              L&apos;adresse email ne peut pas être modifiée.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <div
              className=" phone-input-wrapper rounded-xl  border border-gray-300 px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500
              transition-all duration-200"
            >
              <PhoneInput
                value={telephone}
                onChange={(value) =>
                  setValue("telephone", value ?? "", {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            {form.formState.errors.telephone && (
              <p className="text-sm text-red-500">
                {form.formState.errors.telephone.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>

              <DialogDescription>{dialogMessage}</DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
        </CardHeader>

        <div className="p-6">
          <ChangePassword />
        </div>
      </Card>
    </>
  );
}
