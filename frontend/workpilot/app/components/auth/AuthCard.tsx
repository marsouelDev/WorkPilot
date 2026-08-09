"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";

interface AuthCardProps {
  formTitle: string;
  panelTitle: string;
  panelDescription: string;
  ctaLabel: string;
  ctaHref: string;
  bottomText: string;
  bottomLinkLabel: string;
  bottomLinkHref: string;
  children: ReactNode;
}

export default function AuthCard({
  formTitle,
  panelTitle,
  panelDescription,
  ctaLabel,
  ctaHref,
  bottomText,
  bottomLinkLabel,
  bottomLinkHref,
  children,
}: AuthCardProps) {
  const { error } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-100 via-slate-50 to-indigo-100 px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-700 hover:shadow-[0_35px_80px_rgba(0,0,0,0.18)] md:grid-cols-2">
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-floating"
            style={{
              backgroundImage: "url('/logo.png')",
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,.55), rgba(99,102,241,.35), rgba(49,46,129,.55))",
            }}
          />

          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 py-16 text-center text-white">
            <h2 className="mb-5  text-4xl font-bold">{panelTitle}</h2>

            <p className="mb-10 max-w-md  text-lg leading-8 text-white/95">
              {panelDescription}
            </p>

            <Link
              href={ctaHref}
              className="rounded-xl bg-white px-8 py-3 font-semibold text-indigo-600 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>

        <div className=" animate-fade-up p-10 md:p-14">
          <h1 className="mb-8 text-center text-4xl font-bold text-gray-900">
            {formTitle}
          </h1>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-600 shadow-sm">
              {String(error)}
            </div>
          )}

          {children}

          <p className="mt-10 text-center text-gray-500">
            {bottomText}{" "}
            <Link
              href={bottomLinkHref}
              className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
            >
              {bottomLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
