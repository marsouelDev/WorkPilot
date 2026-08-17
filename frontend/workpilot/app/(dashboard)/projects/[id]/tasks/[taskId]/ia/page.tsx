"use client";

import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import AssistanceIaChat from "@/app/components/assistance-ia/AssistanceChat";

export default function AssistanceIaPage() {
  const params = useParams<{
    id: string;
    taskId: string;
  }>();

  console.log("PARAMS IA :", params);

  const projetId = Number(params.id);
  const taskId = Number(params.taskId);

  if (!params.id || Number.isNaN(projetId)) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />

          <h2 className="text-lg font-semibold">
            Identifiant du projet invalide
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Impossible de récupérer l&apos;identifiant du projet.
          </p>
        </div>
      </div>
    );
  }

  // Vérification de la tâche
  if (!params.taskId || Number.isNaN(taskId)) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-destructive" />

          <h2 className="text-lg font-semibold text-destructive">
            Identifiant de tâche invalide
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Identifiant reçu :
            <span className="ml-1 font-medium">
              {params.taskId || "undefined"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-6">
      <AssistanceIaChat taskId={taskId} />
    </div>
  );
}
