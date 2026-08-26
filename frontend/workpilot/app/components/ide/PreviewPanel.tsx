"use client";

import { useState } from "react";
import { ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface PreviewPanelProps {
  previewUrl: string | null;
  statut: string;
}

export default function PreviewPanel({ previewUrl, statut }: PreviewPanelProps) {
  const [key, setKey] = useState(0);

  if (!previewUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#1e1e1e] text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
        <p className="text-sm">{statut}</p>
        <p className="max-w-xs text-center text-xs text-gray-500">
          Le serveur n&apos; est pas prêt. Vérifie dans l&apos; onglet Code que le projet
          contient un package.json et que npm install se termine dans le terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-3 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        <span className="ml-2 flex-1 truncate rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500">
          {previewUrl}
        </span>
        <button onClick={() => setKey((k) => k + 1)} className="rounded p-1 text-gray-500 hover:bg-gray-200" title="Rafraîchir">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <a href={previewUrl} target="_blank" rel="noreferrer" className="rounded p-1 text-gray-500 hover:bg-gray-200" title="Ouvrir dans un onglet">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe key={key} src={previewUrl} title="Aperçu" className="w-full flex-1 border-0" allow="cross-origin-isolated" />
    </div>
  );
}