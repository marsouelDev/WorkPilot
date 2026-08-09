import type { Metadata } from "next";
import "./globals.css";
import "react-phone-number-input/style.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import "@/styles/phone-input.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "WorkPilot",
  description: "Projet de gestion des projets et des tâches assisté par IA",
  icons: {
    icon: "/logo.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
