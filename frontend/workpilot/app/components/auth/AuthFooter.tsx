"use client";

import Link from "next/link";

interface AuthFooter {
  mode: "login" | "register";
}

export default function AuthFooter({ mode }: AuthFooter) {
  const isLogin = mode === "login";

  return (
    <>
      <p className="text-slate-400">
        {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
      </p>

      <Link
        href={isLogin ? "/register" : "/login"}
        className="mt-2 inline-block text-emerald-500 hover:underline"
      >
        {isLogin ? "Créer un compte" : "Se connecter"}
      </Link>
    </>
  );
}
