/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Loader2, Search, Pencil, Trash2 } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MembreProjet, RoleMembre } from "@/types/projectType";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MembresTableProps {
  projetId: number;
}

const roleLabels: Record<RoleMembre, string> = {
  chef_projet: "Chef de projet",
  developpeur: "Développeur",
  relecteur: "Relecteur",
};

export default function MembresTable({ projetId }: MembresTableProps) {
  const { token } = useAuthStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const {
    membres,
    isLoadingMembres,
    erreurMembres,
    listerMembresProjet,
    changeMemberRole,
    removeMember,
  } = useProjectStore();

  useEffect(() => {
    if (!token || projetId <= 0) {
      return;
    }

    listerMembresProjet(token, projetId);
  }, [token, projetId, listerMembresProjet]);
  

  const [membreSelectionne, setMembreSelectionne] =
    useState<MembreProjet | null>(null);
  const [dialogRoleOpen, setDialogRoleOpen] = useState(false);
  const [dialogRetraitOpen, setDialogRetraitOpen] = useState(false);
  const [nouveauRole, setNouveauRole] = useState<RoleMembre | "">("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const columns = useMemo<ColumnDef<MembreProjet>[]>(
    () => [
      {
        id: "membre",
        accessorFn: (row) => `${row.utilisateur.prenom} ${row.utilisateur.nom}`,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Membre
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },

        cell: ({ row }) => {
          const utilisateur = row.original.utilisateur;

          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {utilisateur.prenom} {utilisateur.nom}
              </span>
            </div>
          );
        },
      },

      {
        id: "email",

        accessorFn: (row) => row.utilisateur.email,

        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Email
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },

        cell: ({ row }) => {
          return <span>{row.original.utilisateur.email}</span>;
        },
      },

      {
        id: "telephone",

        accessorFn: (row) => row.utilisateur.telephone ?? "",

        header: "Téléphone",

        cell: ({ row }) => {
          return (
            <span>{row.original.utilisateur.telephone || "Non renseigné"}</span>
          );
        },
      },

      {
        id: "role",

        accessorFn: (row) => row.role,

        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Rôle
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },

        cell: ({ row }) => {
          const role = row.original.role;

          return (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {roleLabels[role]}
            </span>
          );
        },
      },
      {
        id: "actions",

        header: "Actions",

        enableSorting: false,

        enableGlobalFilter: false,

        cell: ({ row }) => {
          const membre = row.original;

          return (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setMembreSelectionne(membre);
                  setNouveauRole(membre.role);
                  setDialogRoleOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rôle
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  setMembreSelectionne(membre);
                  setDialogRetraitOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Retirer
              </Button>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: membres,
    columns,

    state: {
      sorting,
      globalFilter,
    },

    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });
  const handleChangerRole = async () => {
    if (!token || !membreSelectionne || !nouveauRole) {
      return;
    }

    try {
      setIsActionLoading(true);

      await changeMemberRole(token, projetId, membreSelectionne.id, {
        role: nouveauRole,
      });

      setDialogRoleOpen(false);
      setMembreSelectionne(null);
      setNouveauRole("");

      await listerMembresProjet(token, projetId);
    } catch (error) {
      console.error("Erreur lors de la modification du rôle :", error);
    } finally {
      setIsActionLoading(false);
    }
  };
  const handleRetirerMembre = async () => {
    if (!token || !membreSelectionne) {
      return;
    }

    try {
      setIsActionLoading(true);

      await removeMember(token, projetId, membreSelectionne.id);

      setDialogRetraitOpen(false);
      setMembreSelectionne(null);

      await listerMembresProjet(token, projetId);
    } catch (error) {
      console.error("Erreur lors du retrait du membre :", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoadingMembres) {
    return (
      <div className="flex min-h-100 w-full items-center justify-center rounded-lg border bg-background">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>

          <h2 className="text-lg font-semibold">Chargement des membres</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Récupération des membres du projet...
          </p>
        </div>
      </div>
    );
  }

  if (erreurMembres) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{erreurMembres}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Rechercher un membre..."
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            {/* HEADER */}
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Aucun membre trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Nombre de résultats */}
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} membre
            {table.getFilteredRowModel().rows.length > 1 ? "s" : ""}
          </p>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Précédent
            </Button>

            <span className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} /{" "}
              {Math.max(table.getPageCount(), 1)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={dialogRoleOpen} onOpenChange={setDialogRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>

            <DialogDescription>
              Modifier le rôle de{" "}
              <strong>
                {membreSelectionne?.utilisateur.prenom}{" "}
                {membreSelectionne?.utilisateur.nom}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="nouveau-role">Nouveau rôle</Label>

            <select
              id="nouveau-role"
              value={nouveauRole}
              onChange={(event) =>
                setNouveauRole(event.target.value as RoleMembre)
              }
              disabled={isActionLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un rôle</option>

              <option value="developpeur">Développeur</option>

              <option value="relecteur">Relecteur</option>

              <option value="chef_projet">Chef de projet</option>
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogRoleOpen(false)}
              disabled={isActionLoading}
            >
              Annuler
            </Button>

            <Button
              type="button"
              disabled={
                isActionLoading ||
                !nouveauRole ||
                !membreSelectionne ||
                nouveauRole === membreSelectionne.role
              }
              onClick={handleChangerRole}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogRetraitOpen} onOpenChange={setDialogRetraitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le membre</DialogTitle>

            <DialogDescription>
              Voulez-vous vraiment retirer{" "}
              <strong>
                {membreSelectionne?.utilisateur.prenom}{" "}
                {membreSelectionne?.utilisateur.nom}
              </strong>{" "}
              de ce projet ?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogRetraitOpen(false)}
              disabled={isActionLoading}
            >
              Annuler
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleRetirerMembre}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrait...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Retirer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
