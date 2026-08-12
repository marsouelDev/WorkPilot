import ProjectTasks from "@/app/components/projects/tasks/tasks";
import Navigation from "../../../../components/Navigation/navigation";

interface TasksPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TasksPage({ params }: TasksPageProps) {
  const { id } = await params;

  const projetId = Number(id);

  if (!projetId || Number.isNaN(projetId)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="rounded-lg border bg-background p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-destructive">
            Identifiant du projet invalide.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto w-full px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-6">
        <Navigation projetId={projetId} active="tasks" />
      </div>
      <ProjectTasks projetId={projetId} />
    </main>
  );
}
