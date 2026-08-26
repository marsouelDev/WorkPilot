"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { useLivrableStore } from "@/stores/livrableStore";

interface SoumettreLivrableDialogProps {
  tacheId: number;
  tacheTitre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

export default function SoumettreLivrableDialog({
  tacheId,
  tacheTitre,
  open,
  onOpenChange,
  onSubmitted,
}: SoumettreLivrableDialogProps) {
  const { token } = useAuthStore();
  const { soumettre } = useLivrableStore();

  const [fichierUrl, setFichierUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token || !fichierUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const ok = await soumettre(token, tacheId, fichierUrl.trim());

      if (ok) {
        toast.success("Livrable soumis — la tâche passe en revue ✅");
        setFichierUrl("");
        onOpenChange(false);
        onSubmitted?.();
      } else {
        toast.error("Impossible de soumettre le livrable.");
      }
    } catch (err) {
      toast.error(`Erreur : ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setFichierUrl("");
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            Soumettre le livrable
          </DialogTitle>
          <DialogDescription>
            Tâche : <strong>{tacheTitre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="text-xs text-emerald-800">
              <p className="font-semibold">Que soumettre ?</p>
              <p className="mt-0.5">
                Le lien vers le travail final : code source, documentation,
                rapport, archive ZIP, etc.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              URL du livrable <span className="text-red-600">*</span>
            </label>
            <Input
              placeholder="https://github.com/... ou https://drive.google.com/... ou lien"
              value={fichierUrl}
              onChange={(e) => setFichierUrl(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !fichierUrl.trim()}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Soumission...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Soumettre
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
