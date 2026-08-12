"use client";

import { use, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import Navigation from "../../../../components/Navigation/navigation";
import InviteMember from "@/app/components/membres/membres";
import MembresTable from "@/app/components/membres/membres-table";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  const projetId = Number(id);
  const { user, token } = useAuthStore();
  const { membres, listerMembresProjet } = useProjectStore();
  useEffect(() => {
    if (!token || !Number.isInteger(projetId) || projetId <= 0) {
      return;
    }

    listerMembresProjet(token, projetId);
  }, [token, projetId, listerMembresProjet]);

  const membreConnecte = membres.find(
    (membre) => membre.utilisateurId === user?.id,
  );

  const estChefProjet = membreConnecte?.role === "chef_projet";

  if (!Number.isInteger(projetId) || projetId <= 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">Identifiant du projet invalide.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <Navigation projetId={projetId} active="members" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membres du projet</h1>

          <p className="text-sm text-muted-foreground">
            Gestion des membres de ce projet
          </p>
        </div>

        {estChefProjet && <InviteMember projetId={projetId} />}
      </div>

      <MembresTable projetId={projetId} />
    </div>
  );
}
