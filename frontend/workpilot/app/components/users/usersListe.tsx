"use client";

import { useEffect } from "react";
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
import { ShieldCheck } from "lucide-react";

export default function UsersListes() {
  const { users, getUsers, isLoading, isUpdating, changeStatus } =
    useUserStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-6">
          <Skeleton className="mb-6 h-8 w-56" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-40" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-52" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{user.nom}</TableCell>

                  <TableCell>{user.prenom}</TableCell>

                  <TableCell>{user.email}</TableCell>

                  <TableCell>{user.telephone}</TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        user.roleGlobal === "admin" ? "default" : "secondary"
                      }
                    >
                      {user.roleGlobal}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.roleGlobal === "membre" ? (
                        <Switch
                          checked={user.statut === "actif"}
                          disabled={isUpdating}
                          onCheckedChange={(checked) =>
                            changeStatus(
                              user.id,
                              checked ? "actif" : "suspendu",
                            )
                          }
                        />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"
                          title="Le statut d'un administrateur ne peut pas être modifié"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                      )}

                      <Badge
                        variant={
                          user.statut === "actif" ? "default" : "destructive"
                        }
                      >
                        {user.statut === "actif" ? "Actif" : "Suspendu"}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
