"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";

export function ToasterProvider() {
  const [position, setPosition] = useState<"bottom-right" | "top-center">(
    "bottom-right",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(max-width: 767px)");

    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setPosition(e.matches ? "top-center" : "bottom-right");
    };

    /* Initialisation */
    update(mql);

    /* Écoute des changements (rotation, redimensionnement) */
    mql.addEventListener("change", update as (e: MediaQueryListEvent) => void);

    return () => {
      mql.removeEventListener(
        "change",
        update as (e: MediaQueryListEvent) => void,
      );
    };
  }, []);

  return (
    <Toaster
      position={position}
      richColors
      closeButton
      duration={5000}
      visibleToasts={4}
      expand={false}
      toastOptions={{
        style: {
          borderRadius: "12px",
          fontSize: "14px",
        },
      }}
    />
  );
}
