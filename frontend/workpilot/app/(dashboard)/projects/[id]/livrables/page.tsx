import ListeLivrables from "@/app/components/livrable/ListeLivrables";
import Navigation from "@/app/components/Navigation/navigation";
import { use } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function LivrablesPage({ params }: PageProps) {
  const { id } = use(params);
  const projetId = Number(id);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <Navigation projetId={projetId} active="livrables" />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Livrables du projet
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi des soumissions, validations et rejets des livrables.
        </p>
      </div>

      <ListeLivrables projetId={projetId} />
    </div>
  );
}
