"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { useLivrableStore } from "@/stores/livrableStore";

interface RejeterLivrableDialogProps {
  livrableId: number;
  tacheTitre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejected?: () => void;
}

export default function RejeterLivrableDialog({
  livrableId,
  tacheTitre,
  open,
  onOpenChange,
  onRejected,
}: RejeterLivrableDialogProps) {
  const { token } = useAuthStore();
  const { rejeter } = useLivrableStore();

  const [motif, setMotif] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const handleReject = async () => {
    if (!token || motif.trim().length < 10) return;

    setIsRejecting(true);
    try {
      const ok = await rejeter(token, livrableId, motif.trim());

      if (ok) {
        toast.success(
          "Livrable rejeté  la tâche retourne en attribution pour correction",
        );
        setMotif("");
        onOpenChange(false);
        onRejected?.();
      } else {
        toast.error("Impossible de rejeter le livrable.");
      }
    } catch (err) {
      toast.error(`Erreur : ${(err as Error).message}`);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setMotif("");
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Rejeter le livrable
          </DialogTitle>
          <DialogDescription>
            Tâche : <strong>{tacheTitre}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avertissement */}
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="text-xs text-red-800">
              <p className="font-semibold">Conséquences du rejet</p>
              <p className="mt-0.5">
                L&apos;assigné recevra une notification avec votre motif et
                devra soumettre un nouveau livrable corrigé.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Motif du rejet <span className="text-red-600">*</span>
            </label>
            <Textarea
              placeholder="Expliquez ce qui doit être corrigé (minimum 10 caractères)..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              disabled={isRejecting}
              rows={4}
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {motif.length}/10 caractères minimum
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRejecting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleReject}
            disabled={isRejecting || motif.trim().length < 10}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isRejecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejet...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Rejeter le livrable
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
