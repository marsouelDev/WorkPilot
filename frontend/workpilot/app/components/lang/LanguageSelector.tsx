"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Languages, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface GoogleTranslateElement {
  new (
    options: { pageLanguage: string; autoDisplay?: boolean },
    id: string,
  ): void;
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: { TranslateElement: GoogleTranslateElement };
    };
  }
}

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "it", label: "Italiano", flag: "🇮" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

/* Lit la langue depuis le cookie (safe SSR) */
function getInitialLang(): string {
  if (typeof document === "undefined") return "fr";
  const match = document.cookie.match(/googtrans=\/fr\/([a-zA-Z-]+)/);
  return match?.[1] ?? "fr";
}

export default function LanguageSelector() {
  const [current, setCurrent] = useState<string>(getInitialLang);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /* Callback appelé par le script Google */
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;

      new window.google.translate.TranslateElement(
        { pageLanguage: "fr", autoDisplay: false },
        "google_translate_hidden",
      );

      /* Attend que le select interne soit monté */
      const check = window.setInterval(() => {
        if (document.querySelector(".goog-te-combo")) {
          setReady(true);
          window.clearInterval(check);
        }
      }, 200);
      window.setTimeout(() => window.clearInterval(check), 10000);
    };
  }, []);

  const changeLanguage = (code: string) => {
    if (code === current) return;

    /* Retour au français : cookie + reload */
    if (code === "fr") {
      // eslint-disable-next-line react-hooks/immutability
      document.cookie =
        "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setCurrent("fr");
      window.location.reload();
      return;
    }

    /* Méthode fiable pour piloter le select Google directement */
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

    if (select) {
      select.value = code;
      select.dispatchEvent(new Event("change"));
      setCurrent(code);
    } else {
      /* Fallback : cookie + reload */
      // eslint-disable-next-line react-hooks/immutability
      document.cookie = `googtrans=/fr/${code}; path=/`;
      setCurrent(code);
      window.location.reload();
    }
  };

  const activeLang = LANGUAGES.find((l) => l.code === current);

  return (
    <>
      <div
        id="google_translate_hidden"
        className="pointer-events-none fixed -top-16 left-0 opacity-0"
        aria-hidden="true"
      />

      <Script
        id="google-translate-script"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="lazyOnload"
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium
            text-muted-foreground transition-colors hover:bg-muted hover:text-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Languages className="h-4 w-4" />
          <span>{activeLang?.flag}</span>
          <span className="hidden sm:inline">{activeLang?.label}</span>
          {!ready && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
              {current === lang.code && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
