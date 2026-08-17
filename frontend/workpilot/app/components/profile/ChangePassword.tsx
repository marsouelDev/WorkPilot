"use client";

import { useState, useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FormData {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
  confirmationMotDePasse: string;
}

type PasswordFieldName = keyof FormData;


interface PasswordFieldProps {
  id: string;
  label: string;
  name: PasswordFieldName;
  show: boolean;
  toggle: () => void;
  form: UseFormReturn<FormData>;
}

function PasswordField({
  id,
  label,
  name,
  show,
  toggle,
  form,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[#0F172A]">
        {label}
      </Label>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          id={id}
          type={show ? "text" : "password"}
          className="pl-10 pr-10"
          {...form.register(name)}
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-[#6366F1]"
          tabIndex={-1}
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {form.formState.errors[name] && (
        <p className="text-xs text-red-600">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );
}

export default function ChangePassword() {
  const { changePassword, isLoading, error, clearError } = useAuthStore();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [showAncien, setShowAncien] = useState(false);
  const [showNouveau, setShowNouveau] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      ancienMotDePasse: "",
      nouveauMotDePasse: "",
      confirmationMotDePasse: "",
    },
  });


  useEffect(() => {
    if (!feedback) return;

    const timer = window.setTimeout(() => setFeedback(null), 4000);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const onSubmit = async (data: FormData) => {
    clearError();

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

      setFeedback({
        type: "success",
        message: "Votre mot de passe a été modifié avec succès.",
      });

      form.reset();
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          error ||
          (err instanceof Error
            ? err.message
            : "Une erreur est survenue lors de la modification."),
      });
    }
  };


  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#B95F00]/10">
            <KeyRound className="h-5 w-5 text-[#B95F00]" />
          </div>

          <div>
            <CardTitle className="text-lg" style={{ color: "#0F172A" }}>
              Sécurité
            </CardTitle>

            <CardDescription>
              Changez votre mot de passe pour sécuriser votre compte.
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


        <PasswordField
          id="ancienMotDePasse"
          label="Ancien mot de passe"
          name="ancienMotDePasse"
          show={showAncien}
          toggle={() => setShowAncien((s) => !s)}
          form={form}
        />

        <PasswordField
          id="nouveauMotDePasse"
          label="Nouveau mot de passe"
          name="nouveauMotDePasse"
          show={showNouveau}
          toggle={() => setShowNouveau((s) => !s)}
          form={form}
        />

        <PasswordField
          id="confirmationMotDePasse"
          label="Confirmer le nouveau mot de passe"
          name="confirmationMotDePasse"
          show={showConfirmation}
          toggle={() => setShowConfirmation((s) => !s)}
          form={form}
        />

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full text-white hover:opacity-90"
          style={{ backgroundColor: "#B95F00" }}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Modification...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Modifier le mot de passe
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
