"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserPlus, User, Mail, Shield, Save, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneInput from "@/components/ui/PhoneInput";
import { CreateUserByAdminFormData } from "@/types/userTypes";
import { useUserStore } from "@/stores/userStore";

export default function CreateUserDialog() {
  const { createUserByAdmin, isLoading, error } = useUserStore();

  const [open, setOpen] = useState(false);

  const form = useForm<CreateUserByAdminFormData>({
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      role: "membre",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const telephone = useWatch({
    control,
    name: "telephone",
  });

  const onSubmit = async (data: CreateUserByAdminFormData) => {
    try {
      await createUserByAdmin(data);

      reset();
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6366F1] px-4 py-2
    text-sm font-medium text-white shadow-md transition-all  hover:bg-[#4F46E5] hover:shadow-lg"
      >
        <UserPlus className="h-4 w-4" />
        Ajouter un utilisateur
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl rounded-2xl p-7">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#6366F1]">
            <UserPlus className="h-6 w-6" />
            Nouvel utilisateur
          </DialogTitle>

          <DialogDescription className="text-gray-500">
            Renseignez les informations ci-dessous pour créer un utilisateur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-[#6366F1]" />
                Nom
              </Label>
              <Input
                placeholder="Nom"
                className="focus-visible:ring-[#6366F1]"
                {...register("nom", {
                  required: "Le nom est obligatoire",
                })}
              />

              {errors.nom && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.nom.message}
                </p>
              )}
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-[#6366F1]" />
                Prénom
              </Label>
              <Input
                placeholder="Prénom"
                className="focus-visible:ring-[#6366F1]"
                {...register("prenom", {
                  required: "Le prénom est obligatoire",
                })}
              />

              {errors.prenom && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.prenom.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#6366F1]" />
              Adresse email
            </Label>
            <Input
              type="email"
              placeholder="exemple@email.com"
              className="focus-visible:ring-[#6366F1]"
              {...register("email", {
                required: "L'email est obligatoire",
              })}
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#6366F1]" />
              Téléphone
            </Label>

            <div
              className={`
      flex items-center rounded-xl border bg-white px-4 py-3 transition-all
      ${
        errors.telephone
          ? "border-red-500 ring-2 ring-red-200"
          : "border-gray-300 focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]"
      }
    `}
            >
              <PhoneInput
                value={telephone}
                onChange={(value) =>
                  setValue("telephone", value ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
                className="w-full"
              />
            </div>

            {errors.telephone && (
              <p className="text-sm text-red-500">{errors.telephone.message}</p>
            )}
          </div>

          <div>
            <div>
              <Label className="mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#6366F1]" />
                Rôle
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <label  className=" flex cursor-pointer items-center gap-3 rounded-xl border border-gray-300 p-4 transition-all hover:border-[#6366F1] hover:bg-indigo-50">
                  <input
                    type="radio"
                    value="membre"
                    {...register("role")}
                    className="h-4 w-4 accent-[#6366F1]"
                  />
                  <div>
                    <p className="font-medium">Membre</p>
                    <p className="text-sm text-gray-500">
                      Peut accéder aux fonctionnalités utilisateur.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-300 p-4 transition-all hover:border-[#6366F1] hover:bg-indigo-50">
                  <input
                    type="radio"
                    value="admin"
                    {...register("role")}
                    className="h-4 w-4 accent-[#6366F1]"
                  />
                  <div>
                    <p className="font-medium">Administrateur</p>
                    <p className="text-sm text-gray-500">
                      Dispose de tous les droits.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className=" rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              className="hover:bg-red-500 hover:text-white"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white min-w-45"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Création..." : "Créer l'utilisateur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
