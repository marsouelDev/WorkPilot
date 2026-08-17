"use client";

import { useEffect, useMemo, useState } from "react";

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

import {
  ArrowUpDown,
  Crown,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";

import { useUserStore } from "@/stores/userStore";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CreateUserDialog from "./createUsers";

/* ============================================================
   TYPES
============================================================ */

interface UserRow {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  roleGlobal: "admin" | "membre";
  statut: "actif" | "suspendu";
}

type StatFilter = "tous" | "actif" | "suspendu" | "admin";

/* ============================================================
   COMPOSANT PRINCIPAL
============================================================ */

export default function UsersListes() {
  const { users, getUsers, isLoading, isUpdating, changeStatus } =
    useUserStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statFilter, setStatFilter] = useState<StatFilter>("tous");

  /* ==========================================================
     CHARGEMENT INITIAL
  ========================================================== */

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  /* ==========================================================
     STATISTIQUES
  ========================================================== */

  const stats = useMemo(() => {
    return {
      total: users.length,
      actifs: users.filter((u) => u.statut === "actif").length,
      suspendus: users.filter((u) => u.statut === "suspendu").length,
      admins: users.filter((u) => u.roleGlobal === "admin").length,
    };
  }, [users]);

  const statCards: {
    key: StatFilter;
    label: string;
    value: number;
    icon: typeof Users;
    classes: string;
  }[] = [
    {
      key: "tous",
      label: "Total utilisateurs",
      value: stats.total,
      icon: Users,
      classes: "bg-[#6366F1]/10 text-[#6366F1]",
    },
    {
      key: "actif",
      label: "Actifs",
      value: stats.actifs,
      icon: UserCheck,
      classes: "bg-emerald-500/10 text-emerald-600",
    },
    {
      key: "suspendu",
      label: "Suspendus",
      value: stats.suspendus,
      icon: UserX,
      classes: "bg-red-500/10 text-red-600",
    },
    {
      key: "admin",
      label: "Administrateurs",
      value: stats.admins,
      icon: Crown,
      classes: "bg-amber-500/10 text-amber-600",
    },
  ];

  /* ==========================================================
     FILTRAGE PAR STAT (cartes cliquables)
  ========================================================== */

  const filteredUsers = useMemo(() => {
    switch (statFilter) {
      case "actif":
        return users.filter((u) => u.statut === "actif");

      case "suspendu":
        return users.filter((u) => u.statut === "suspendu");

      case "admin":
        return users.filter((u) => u.roleGlobal === "admin");

      default:
        return users;
    }
  }, [users, statFilter]);

  /* ==========================================================
     COLONNES
  ========================================================== */

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: "nom",
        accessorKey: "nom",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="flex items-center gap-3">
              {/* AVATAR INITIALES */}

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6366F1]/10 text-sm font-semibold text-[#6366F1]">
                {user.prenom?.charAt(0).toUpperCase()}
                {user.nom?.charAt(0).toUpperCase()}
              </div>

              <span className="font-medium">{user.nom}</span>
            </div>
          );
        },
      },
      {
        id: "prenom",
        accessorKey: "prenom",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Prénom
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        id: "telephone",
        accessorKey: "telephone",
        header: "Téléphone",
        cell: ({ row }) => (
          <span
            className={row.original.telephone ? "" : "text-muted-foreground"}
          >
            {row.original.telephone ?? "Non renseigné"}
          </span>
        ),
      },
      {
        id: "roleGlobal",
        accessorKey: "roleGlobal",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rôle
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const role = row.original.roleGlobal;

          return (
            <Badge
              variant="outline"
              className={
                role === "admin"
                  ? "border-amber-200 bg-amber-500/10 text-amber-700"
                  : "border-slate-200 bg-slate-50 text-slate-700"
              }
            >
              {role === "admin" && <Crown className="mr-1 h-3 w-3" />}
              {role === "admin" ? "Administrateur" : "Membre"}
            </Badge>
          );
        },
      },
      {
        id: "statut",
        accessorKey: "statut",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const user = row.original;

          return (
            <div className="flex items-center gap-3">
              {user.roleGlobal === "membre" ? (
                <Switch
                  checked={user.statut === "actif"}
                  disabled={isUpdating}
                  onCheckedChange={(checked) =>
                    changeStatus(user.id, checked ? "actif" : "suspendu")
                  }
                  className="data-checked:bg-[#6366F1]! data-unchecked:bg-red-400!"
                />
              ) : (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"
                  title="Le statut d'un administrateur ne peut pas être modifié"
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
              )}

              <Badge
                variant="outline"
                className={
                  user.statut === "actif"
                    ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                    : "border-red-200 bg-red-500/10 text-red-700"
                }
              >
                {user.statut === "actif" ? "Actif" : "Suspendu"}
              </Badge>
            </div>
          );
        },
      },
    ],
    [isUpdating, changeStatus],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredUsers as UserRow[],
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

  const { pageIndex } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const hasActiveFilters = globalFilter !== "" || statFilter !== "tous";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm"
            >
              <Skeleton className="h-10 w-10 rounded-lg" />

              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-10" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white shadow-sm">
          <div className="p-4">
            <Skeleton className="mb-4 h-10 w-72 rounded-xl" />

            <Table>
              <TableHeader>
                <TableRow>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableHead key={i}>
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-10 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Utilisateurs
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les comptes, les rôles et les statuts des membres de la
            plateforme.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          const isActive = statFilter === stat.key;

          return (
            <button
              key={stat.key}
              type="button"
              onClick={() => setStatFilter(isActive ? "tous" : stat.key)}
              title={
                isActive
                  ? "Afficher tous les utilisateurs"
                  : `Filtrer : ${stat.label.toLowerCase()}`
              }
              className={`flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                isActive
                  ? "border-transparent ring-2 ring-[#6366F1]"
                  : "hover:border-[#6366F1]/40"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.classes}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {stat.label}
                </p>

                <p className="text-xl font-bold tabular-nums text-[#0F172A]">
                  {stat.value}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          placeholder="Rechercher un utilisateur..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#F8F9FF]">
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
                <TableRow key={row.id} className="hover:bg-muted/40">
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
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6366F1]/10">
                      <Users className="h-6 w-6 text-[#6366F1]" />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </p>

                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setGlobalFilter("");
                          setStatFilter("tous");
                        }}
                      >
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-[#0F172A]">{totalRows}</span>{" "}
          utilisateur{totalRows > 1 ? "s" : ""}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>

          <span className="text-sm tabular-nums">
            Page {pageIndex + 1} / {Math.max(table.getPageCount(), 1)}
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
  );
}
