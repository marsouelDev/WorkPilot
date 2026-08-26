"use client";

import { useState } from "react";
import { XCircle, Loader2 } from "lucide-react";
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
import type { PullRequest } from "@/types/pullRequestType";

interface RejectPRDialogProps {
  pr: PullRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (motif: string) => Promise<boolean>;
  isRejecting: boolean;
}

export default function RejectPRDialog({
  pr,
  open,
  onOpenChange,
  onReject,
  isRejecting,
}: RejectPRDialogProps) {
  const [motif, setMotif] = useState("");

  const handleReject = async () => {
    if (motif.trim().length < 10) return;
    const ok = await onReject(motif.trim());
    if (ok) setMotif("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Rejeter la Pull Request 
          </DialogTitle>
          <DialogDescription>
            La Pull Request sera fermée sans fusion sur GitHub et la tâche retournera en
            statut &quot;Attribuée&quot; pour correction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-900">
              {pr.tache?.titre ?? "Tâche"}
            </p>
            <code className="mt-1 inline-block rounded bg-[#6366F1]/10 px-1.5 py-0.5 font-mono text-xs text-[#6366F1]">
              {pr.branche}
            </code>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Motif du rejet <span className="text-red-600">*</span>
            </label>
            <Textarea
              placeholder="Expliquez pourquoi vous rejetez cette Pull Request (minimum 10 caractères)..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              disabled={isRejecting}
              rows={4}
              className="focus-visible:ring-red-500"
            />
            <p
              className={`mt-1 text-xs ${
                motif.trim().length >= 10
                  ? "text-emerald-600"
                  : "text-slate-400"
              }`}
            >
              {motif.trim().length}/10 caractères minimum
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRejecting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting || motif.trim().length < 10}
          >
            {isRejecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejet...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Rejeter la Pull Request 
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
