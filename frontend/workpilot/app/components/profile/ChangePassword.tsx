"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
interface FormData {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

export default function ChangePassword() {
  const { changePassword, isLoading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState("");
  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [open, setOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");

  const form = useForm<FormData>({
    defaultValues: {
      ancienMotDePasse: "",
      nouveauMotDePasse: "",
      confirmationMotDePasse: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    setSuccess("");

    if (data.nouveauMotDePasse !== data.confirmationMotDePasse) {
      form.setError("confirmationMotDePasse", {
        message: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    try {
      await changePassword({
        ancienMotDePasse: data.ancienMotDePasse,
        nouveauMotDePasse: data.nouveauMotDePasse,
      });

      setSuccess("Mot de passe modifié avec succès.");

      setDialogTitle("Mot de passe modifié");

      setDialogMessage("Votre mot de passe a été mis à jour avec succès.");

      setOpen(true);

      form.reset();
    } catch (e) {
      console.error(e);

      setDialogTitle("Erreur");

      setDialogMessage(
        error ||
          "Une erreur est survenue lors de la modification du mot de passe.",
      );

      setOpen(true);
    }
  };

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 p-3 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500 bg-green-50 p-3 text-green-600">
            {success}
          </div>
        )}

        <div className="space-y-2">
          <Label>Ancien mot de passe</Label>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              type={showAncien ? "text" : "password"}
              className="pl-10"
              {...form.register("ancienMotDePasse")}
            />
            <button
              type="button"
              onClick={() => setShowAncien((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all duration-200"
            >
              {showAncien ? (
                <svg
                  key="eye-off"
                  className="animate-iconPop"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  key="eye-on"
                  className="animate-iconPop"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nouveau mot de passe</Label>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              type={showNouveau ? "text" : "password"}
              className="pl-10"
              {...form.register("nouveauMotDePasse")}
            />
            <button
              type="button"
              onClick={() => setShowNouveau((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all duration-200"
            >
              {showNouveau ? (
                <svg
                  key="eye-off"
                  className="animate-iconPop"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  key="eye-on"
                  className="animate-iconPop"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Confirmer le mot de passe</Label>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              type={showConfirmation ? "text" : "password"}
              className="pl-10"
              {...form.register("confirmationMotDePasse")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-indigo-600 hover:scale-110 transition-all duration-200"
            >
              {showConfirmation ? (
                <svg
                  key="eye-off"
                  className="animate-iconPop"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  key="eye-on"
                  className="animate-iconPop"
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {form.formState.errors.confirmationMotDePasse && (
            <p className="text-sm text-red-500">
              {form.formState.errors.confirmationMotDePasse.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Modification..." : "Modifier le mot de passe"}
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
    </>
  );
}
