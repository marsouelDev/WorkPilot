"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import { Tache } from "@/types/projectType";

interface TaskDetailsDialogProps {
  task: Tache | null;
  onClose: () => void;
}

const getStatutLabel = (statut: string) => {
  switch (statut) {
    case "disponible":
      return "Disponible";
    case "attribuee":
      return "Attribuée";
    case "en_revue":
      return "En revue";
    case "retiree":
      return "Retirée";
    case "terminee":
      return "Terminée";
    default:
      return statut;
  }
};

const getStatutClassName = (statut: string) => {
  switch (statut) {
    case "disponible":
      return "border-green-200 bg-green-50 text-green-700";
    case "attribuee":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "en_revue":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "retiree":
      return "border-red-200 bg-red-50 text-red-700";
    case "terminee":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "Aucune échéance";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

export default function TaskDetailsDialog({
  task,
  onClose,
}: TaskDetailsDialogProps) {
  return (
    <Dialog
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        {task && (
          <>
            <DialogHeader className="border-b pb-5 pr-12">
              <DialogTitle className="text-xl font-bold leading-7">
                {task.titre}
              </DialogTitle>

              <DialogDescription>
                Détails de la tâche numéro : {task.id}
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[65vh] space-y-5 overflow-y-auto py-2 pr-2">
              <div className="rounded-xl border bg-muted/20 p-5">
                <h3 className="mb-3 text-sm font-semibold">Description</h3>

                <p className="text-sm leading-7 text-muted-foreground">
                  {task.descriptionGeneree || "Aucune description disponible."}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-5">
                <h3 className="mb-3 text-sm font-semibold">
                  Compétences requises
                </h3>

                {task.competences?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.competences.map((competence) => (
                      <Badge
                        key={competence}
                        variant="outline"
                        className="rounded-full px-3 py-1 text-xs font-normal"
                      >
                        {competence}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune compétence spécifiée.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Assignée à</p>

                  <p className="mt-1 text-sm font-medium">
                    {task.assignee
                      ? `${task.assignee.prenom} ${task.assignee.nom}`
                      : "Non assignée"}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Échéance</p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(task.echeance)}
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Statut</p>

                  <Badge
                    variant="outline"
                    className={`mt-2 ${getStatutClassName(task.statut)}`}
                  >
                    {getStatutLabel(task.statut)}
                  </Badge>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Complexité</p>

                  <p className="mt-1 text-sm font-medium capitalize">
                    {task.complexite}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
