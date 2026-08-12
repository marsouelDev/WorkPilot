"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, User, UserPlus } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  InviteMemberDto,
  RoleMembre,
  UtilisateurRecherche,
} from "@/types/projectType";
import { rechercherUtilisateursParEmail } from "@/services/projectServices";

interface InviteMemberProps {
  projetId: number;
}

export default function InviteMember({ projetId }: InviteMemberProps) {
  const { token } = useAuthStore();

  const { inviteMember, isUpdating, error, clearError } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleMembre | undefined>(undefined);
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurRecherche[]>([]);
  const [utilisateurSelectionne, setUtilisateurSelectionne] =
    useState<UtilisateurRecherche | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!token || !email.trim()) {
      return;
    }

    const recherche = email.trim();
    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const result = await rechercherUtilisateursParEmail(token, recherche);
        setUtilisateurs(result);
      } catch (error) {
        console.error("Erreur recherche utilisateurs :", error);
        setUtilisateurs([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [email, token]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setUtilisateurSelectionne(null);
    setFormError("");
    clearError();
  };
  const handleSelectUser = (utilisateur: UtilisateurRecherche) => {
    setUtilisateurSelectionne(utilisateur);
    setEmail(utilisateur.email);
    setUtilisateurs([]);
    setFormError("");
    clearError();
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      setEmail("");
      setRole(undefined);
      setUtilisateurs([]);
      setUtilisateurSelectionne(null);
      setFormError("");

      clearError();
    }
  };

  const handleInvite = async () => {
    setFormError("");

    if (!token) {
      setFormError("Vous devez être connecté.");

      return;
    }

    if (!utilisateurSelectionne) {
      setFormError("Veuillez sélectionner un utilisateur.");

      return;
    }

    if (!role) {
      setFormError("Veuillez sélectionner un rôle.");

      return;
    }

    const data: InviteMemberDto = {
      email: utilisateurSelectionne.email,
      role,
    };

    try {
      await inviteMember(token, projetId, data);

      setEmail("");
      setRole(undefined);
      setUtilisateurs([]);
      setUtilisateurSelectionne(null);
      setFormError("");

      setOpen(false);
    } catch (error) {
      console.error("Erreur invitation :", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" disabled={isUpdating}>
            <UserPlus className="mr-2 h-4 w-4" />
            Inviter un membre
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>

          <DialogDescription>
            Commencez à saisir une adresse email pour rechercher un utilisateur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          {error && !formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Rechercher un utilisateur</Label>

            <div className="relative">
              <Input
                id="email"
                type="text"
                placeholder="Tapez une lettre ou un email..."
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
                disabled={isUpdating}
                autoComplete="off"
              />

              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {utilisateurs.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-lg border bg-background shadow-sm">
                {utilisateurs.map((utilisateur) => (
                  <button
                    key={utilisateur.id}
                    type="button"
                    onClick={() => handleSelectUser(utilisateur)}
                    className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {utilisateur.prenom} {utilisateur.nom}
                      </p>

                      <p className="truncate text-sm text-muted-foreground">
                        {utilisateur.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!isSearching &&
              email.trim().length > 0 &&
              utilisateurs.length === 0 &&
              !utilisateurSelectionne && (
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur trouvé.
                </p>
              )}
          </div>
          {utilisateurSelectionne && (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="font-medium">
                  {utilisateurSelectionne.prenom} {utilisateurSelectionne.nom}
                </p>

                <p className="text-sm text-muted-foreground">
                  {utilisateurSelectionne.email}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>

            <select
              id="role"
              value={role ?? ""}
              onChange={(event) => {
                const value = event.target.value;

                setRole(value ? (value as RoleMembre) : undefined);

                setFormError("");

                clearError();
              }}
              disabled={isUpdating || !utilisateurSelectionne}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Sélectionner un rôle</option>

              <option value="developpeur">Développeur</option>

              <option value="relecteur">Relecteur</option>

              <option value="chef_projet">Chef de projet</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUpdating}
          >
            Annuler
          </Button>

          <Button
            type="button"
            onClick={handleInvite}
            disabled={isUpdating || !utilisateurSelectionne || !role}
            className=" bg-[#6366F1] hover:bg-[#060af5]"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin  bg-[#6366F1]" />
                Invitation...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Inviter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
