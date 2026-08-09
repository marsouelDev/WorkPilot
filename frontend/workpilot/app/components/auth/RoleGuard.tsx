"use client";

import { useAuthStore } from "@/stores/authStore";

interface Props {
  role: "admin" | "membre";
  children: React.ReactNode;
}
export default function RoleGuard({ role, children }: Props) {
  const { user } = useAuthStore();
  if (!user) {
    return null;
  }
  if (user.role !== role) {
    return null;
  }
  return <>{children}</>;
}
