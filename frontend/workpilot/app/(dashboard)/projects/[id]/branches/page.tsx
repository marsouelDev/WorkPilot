import BranchesPage from "@/app/components/branches/branche";
import Navigation from "@/app/components/Navigation/navigation";
import { use } from "react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BranchesPageWrapper({ params }: PageProps) {
  const { id } = use(params);
  const projetId = Number(id);

  return (
    <>
      <div className="mb-6">
        <Navigation projetId={projetId} active="branches" />
      </div>
      <BranchesPage />
    </>
  );
}
