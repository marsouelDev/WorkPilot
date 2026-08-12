"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import Navigation from "../../../../components/Navigation/navigation";
/*  CONSTANTES COULEURS*/

const COLORS = {
  primary: "#6366F1",
  secondary: "#0F172A",
  tertiary: "#B95F00",
};

/* UTILITAIRES */

function nettoyerNomFichier(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function nettoyerMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim();
}

/* TYPES WORD */

type WordElement = Paragraph | Table;

/*MARKDOWN -> WORD */

function convertirMarkdownEnWord(markdown: string): WordElement[] {
  const lignes = markdown.split(/\r?\n/);
  const elements: WordElement[] = [];

  let i = 0;

  while (i < lignes.length) {
    const ligne = lignes[i];
    const ligneTrim = ligne.trim();

    if (!ligneTrim) {
      i++;
      continue;
    }

    /* ================= CODE ================= */

    if (ligneTrim.startsWith("```")) {
      const code: string[] = [];

      i++;

      while (i < lignes.length && !lignes[i].trim().startsWith("```")) {
        code.push(lignes[i]);
        i++;
      }

      if (i < lignes.length) {
        i++;
      }

      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: code.join("\n"),
              font: "Courier New",
              size: 18,
            }),
          ],
          spacing: {
            before: 120,
            after: 160,
          },
        }),
      );

      continue;
    }

    /*  TABLEAU  */

    const ligneSuivante = lignes[i + 1]?.trim();

    const estSeparateurTableau =
      Boolean(ligneSuivante) &&
      /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(ligneSuivante as string);

    if (ligneTrim.includes("|") && estSeparateurTableau) {
      const lignesTableau: string[][] = [];

      while (i < lignes.length && lignes[i].trim().includes("|")) {
        const cellules = lignes[i]
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cellule) => cellule.trim());

        if (cellules.length > 0) {
          lignesTableau.push(cellules);
        }

        i++;
      }

      if (lignesTableau.length >= 2) {
        lignesTableau.splice(1, 1);
      }

      if (lignesTableau.length > 0) {
        const nombreColonnes = lignesTableau[0]?.length || 1;

        const largeurColonne = Math.floor(9000 / nombreColonnes);

        const rows = lignesTableau.map(
          (cellules, rowIndex) =>
            new TableRow({
              children: cellules.map(
                (cellule) =>
                  new TableCell({
                    width: {
                      size: largeurColonne,
                      type: WidthType.DXA,
                    },
                    margins: {
                      top: 100,
                      bottom: 100,
                      left: 120,
                      right: 120,
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: nettoyerMarkdown(cellule),
                            bold: rowIndex === 0,
                            size: 20,
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
        );

        elements.push(
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows,
          }),
        );
      }

      continue;
    }

    /*  H1  */

    if (ligneTrim.startsWith("# ")) {
      elements.push(
        new Paragraph({
          text: nettoyerMarkdown(ligneTrim.substring(2)),
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 300,
            after: 180,
          },
        }),
      );

      i++;
      continue;
    }

    /*  H2  */

    if (ligneTrim.startsWith("## ")) {
      elements.push(
        new Paragraph({
          text: nettoyerMarkdown(ligneTrim.substring(3)),
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 260,
            after: 150,
          },
        }),
      );

      i++;
      continue;
    }

    /* ================= H3 ================= */

    if (ligneTrim.startsWith("### ")) {
      elements.push(
        new Paragraph({
          text: nettoyerMarkdown(ligneTrim.substring(4)),
          heading: HeadingLevel.HEADING_3,
          spacing: {
            before: 220,
            after: 120,
          },
        }),
      );

      i++;
      continue;
    }

    /* ================= H4 ================= */

    if (ligneTrim.startsWith("#### ")) {
      elements.push(
        new Paragraph({
          text: nettoyerMarkdown(ligneTrim.substring(5)),
          heading: HeadingLevel.HEADING_4,
          spacing: {
            before: 180,
            after: 100,
          },
        }),
      );

      i++;
      continue;
    }

    /*  CHECKBOX  */

    if (ligneTrim.startsWith("- [ ] ")) {
      elements.push(
        new Paragraph({
          text: `☐ ${nettoyerMarkdown(ligneTrim.substring(6))}`,
          spacing: {
            after: 80,
          },
        }),
      );

      i++;
      continue;
    }

    if (ligneTrim.startsWith("- [x] ")) {
      elements.push(
        new Paragraph({
          text: `☑ ${nettoyerMarkdown(ligneTrim.substring(6))}`,
          spacing: {
            after: 80,
          },
        }),
      );

      i++;
      continue;
    }

    /*  LISTE  */

    if (ligneTrim.startsWith("- ") || ligneTrim.startsWith("* ")) {
      elements.push(
        new Paragraph({
          text: nettoyerMarkdown(ligneTrim.substring(2)),
          bullet: {
            level: 0,
          },
          spacing: {
            after: 80,
          },
        }),
      );

      i++;
      continue;
    }

    /*  LISTE NUMÉROTÉE  */

    const listeNumerotee = ligneTrim.match(/^\d+\.\s+(.*)$/);

    if (listeNumerotee) {
      elements.push(
        new Paragraph({
          text: nettoyerMarkdown(listeNumerotee[1]),
          numbering: {
            reference: "liste-numerotee",
            level: 0,
          },
          spacing: {
            after: 80,
          },
        }),
      );

      i++;
      continue;
    }

    /*  CITATION  */

    if (ligneTrim.startsWith("> ")) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: nettoyerMarkdown(ligneTrim.substring(2)),
              italics: true,
            }),
          ],
          indent: {
            left: 500,
          },
          spacing: {
            before: 100,
            after: 100,
          },
        }),
      );

      i++;
      continue;
    }

    /*  SEPARATEUR  */

    if (ligneTrim === "---" || ligneTrim === "***") {
      elements.push(
        new Paragraph({
          text: "────────────────────────────────────────",
          spacing: {
            before: 120,
            after: 120,
          },
        }),
      );

      i++;
      continue;
    }

    /*  PARAGRAPHE  */

    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: nettoyerMarkdown(ligneTrim),
            size: 22,
          }),
        ],
        spacing: {
          after: 120,
          line: 320,
        },
      }),
    );

    i++;
  }

  return elements;
}

/*  PAGE */

export default function CahierDesChargesPage() {
  const params = useParams();
  const router = useRouter();

  const [isDownloading, setIsDownloading] = useState(false);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const projetId = Number(params.id);

  const { token, hasHydrated } = useAuthStore();

  const {
    cahierDesCharges,
    isLoadingCahierDesCharges,
    cahierDesChargesError,
    getCahierDesCharges,
  } = useProjectStore();

  /*  CHARGEMENT */

  useEffect(() => {
    if (!hasHydrated || !token || !projetId || Number.isNaN(projetId)) {
      return;
    }

    getCahierDesCharges(projetId, token);
  }, [hasHydrated, token, projetId, getCahierDesCharges]);

  /*  WORD */

  const telechargerWord = async () => {
    if (!cahierDesCharges) {
      return;
    }

    setIsDownloading(true);

    try {
      const { projet, cahierDesCharges: cahier } = cahierDesCharges;

      const elements = convertirMarkdownEnWord(cahier.contenuGenere);

      const children: WordElement[] = [
        new Paragraph({
          children: [
            new TextRun({
              text: "CAHIER DES CHARGES",
              bold: true,
              size: 36,
              color: COLORS.primary.replace("#", ""),
            }),
          ],
          alignment: "center",
          spacing: {
            after: 300,
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: projet.titre,
              bold: true,
              size: 28,
            }),
          ],
          alignment: "center",
          spacing: {
            after: 180,
          },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: `Document généré le ${new Date(
                cahier.dateGeneration,
              ).toLocaleDateString("fr-FR")}`,
              size: 20,
              color: "666666",
            }),
          ],
          alignment: "center",
          spacing: {
            after: 500,
          },
        }),

        new Paragraph({
          text: "DESCRIPTION DU PROJET",
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 200,
            after: 150,
          },
        }),

        new Paragraph({
          text: projet.descriptionSommaire,
          spacing: {
            after: 300,
            line: 320,
          },
        }),

        ...elements,
      ];

      const document = new Document({
        creator: "WorkPilot",
        title: `Cahier des charges - ${projet.titre}`,
        description: "Cahier des charges généré par WorkPilot",

        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1000,
                  right: 1000,
                  bottom: 1000,
                  left: 1000,
                },
              },
            },
            children,
          },
        ],

        numbering: {
          config: [
            {
              reference: "liste-numerotee",
              levels: [
                {
                  level: 0,
                  format: "decimal",
                  text: "%1.",
                  alignment: "left",
                },
              ],
            },
          ],
        },
      });

      const blob = await Packer.toBlob(document);

      const nomFichier = `cahier-des-charges-${nettoyerNomFichier(
        projet.titre,
      )}.docx`;

      saveAs(blob, nomFichier);
    } catch (error) {
      console.error("Erreur lors de la génération Word :", error);
    } finally {
      setIsDownloading(false);
    }
  };

  /* PDF */

  const telechargerPDF = async () => {
    const element = document.getElementById("cahier-des-charges-document");

    if (!element || !cahierDesCharges) {
      return;
    }

    setIsDownloadingPdf(true);

    let clone: HTMLElement | null = null;

    try {
      const { projet } = cahierDesCharges;

      const nomFichier = `cahier-des-charges-${nettoyerNomFichier(
        projet.titre,
      )}.pdf`;

      clone = element.cloneNode(true) as HTMLElement;

      clone.style.position = "absolute";
      clone.style.left = "-100000px";
      clone.style.top = "0";
      clone.style.width = `${element.scrollWidth}px`;
      clone.style.maxWidth = "none";
      clone.style.height = "auto";
      clone.style.overflow = "visible";

      clone.style.setProperty("background-color", "#ffffff", "important");

      clone.style.setProperty("color", "#111827", "important");

      document.body.appendChild(clone);

      const elements = [clone, ...Array.from(clone.querySelectorAll("*"))];

      elements.forEach((node) => {
        const el = node as HTMLElement;

        el.style.setProperty("background-color", "#ffffff", "important");

        el.style.setProperty("color", "#111827", "important");

        el.style.setProperty("border-color", "#e5e7eb", "important");

        el.style.setProperty("outline-color", "#e5e7eb", "important");

        el.style.setProperty("box-shadow", "none", "important");

        el.style.setProperty("text-shadow", "none", "important");
      });

      /* TITRES */

      clone.querySelectorAll("h1").forEach((node) => {
        const el = node as HTMLElement;

        el.style.setProperty("color", COLORS.primary, "important");

        el.style.setProperty("background-color", "transparent", "important");
      });

      clone.querySelectorAll("h2, h3, h4").forEach((node) => {
        const el = node as HTMLElement;

        el.style.setProperty("color", COLORS.secondary, "important");

        el.style.setProperty("background-color", "transparent", "important");
      });

      /* TEXTE */

      clone
        .querySelectorAll("p, li, td, th, blockquote, span")
        .forEach((node) => {
          const el = node as HTMLElement;

          el.style.setProperty("color", "#374151", "important");
        });

      /* LIENS */

      clone.querySelectorAll("a").forEach((node) => {
        const el = node as HTMLElement;

        el.style.setProperty("color", COLORS.primary, "important");

        el.style.setProperty("text-decoration", "none", "important");
      });

      /* TABLEAUX */

      clone.querySelectorAll("table").forEach((node) => {
        const table = node as HTMLElement;

        table.style.setProperty("background-color", "#ffffff", "important");

        table.style.setProperty("color", "#111827", "important");

        table.style.setProperty("border-collapse", "collapse", "important");

        table.style.setProperty("width", "100%", "important");
      });

      clone.querySelectorAll("thead").forEach((node) => {
        const thead = node as HTMLElement;

        thead.style.setProperty("background-color", "#f3f4f6", "important");

        thead.style.setProperty("color", "#111827", "important");
      });

      clone.querySelectorAll("th").forEach((node) => {
        const th = node as HTMLElement;

        th.style.setProperty("background-color", "#f3f4f6", "important");

        th.style.setProperty("color", "#111827", "important");

        th.style.setProperty("border-color", "#d1d5db", "important");

        th.style.setProperty("break-inside", "avoid", "important");

        th.style.setProperty("page-break-inside", "avoid", "important");
      });

      clone.querySelectorAll("td").forEach((node) => {
        const td = node as HTMLElement;

        td.style.setProperty("background-color", "#ffffff", "important");

        td.style.setProperty("color", "#111827", "important");

        td.style.setProperty("border-color", "#d1d5db", "important");
      });

      /* LIGNES */

      clone.querySelectorAll("tr").forEach((node) => {
        const tr = node as HTMLElement;

        tr.style.setProperty("break-inside", "avoid", "important");

        tr.style.setProperty("page-break-inside", "avoid", "important");
      });

      /* ELEMENTS A NE PAS COUPER */

      clone
        .querySelectorAll("h1, h2, h3, h4, blockquote, pre")
        .forEach((node) => {
          const el = node as HTMLElement;

          el.style.setProperty("break-inside", "avoid", "important");

          el.style.setProperty("page-break-inside", "avoid", "important");
        });

      /* SVG */

      clone.querySelectorAll("svg").forEach((node) => {
        const svg = node as SVGElement;

        svg.style.setProperty("color", COLORS.primary, "important");

        svg.style.setProperty("fill", "none", "important");

        svg.style.setProperty("stroke", COLORS.primary, "important");
      });

      /* IMAGES */

      clone.querySelectorAll("img").forEach((node) => {
        const img = node as HTMLImageElement;

        img.style.setProperty("max-width", "100%", "important");

        img.style.setProperty("height", "auto", "important");

        img.style.setProperty("display", "block", "important");

        img.style.setProperty("margin-left", "auto", "important");

        img.style.setProperty("margin-right", "auto", "important");
      });

      /* DOM STABLE */

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: clone.scrollWidth,
        height: clone.scrollHeight,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      clone.remove();
      clone = null;

      /* PDF */

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 10;
      const marginBottom = 10;

      const contentWidth = pageWidth - marginLeft - marginRight;

      const contentHeight = pageHeight - marginTop - marginBottom;

      const pixelsPerMm = canvas.width / contentWidth;

      const pageHeightPx = Math.floor(contentHeight * pixelsPerMm);

      const nombrePages = Math.ceil(canvas.height / pageHeightPx);

      for (let pageIndex = 0; pageIndex < nombrePages; pageIndex++) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sourceY = pageIndex * pageHeightPx;

        const remainingHeight = canvas.height - sourceY;

        const currentHeightPx = Math.min(pageHeightPx, remainingHeight);

        const pageCanvas = document.createElement("canvas");

        pageCanvas.width = canvas.width;
        pageCanvas.height = currentHeightPx;

        const pageContext = pageCanvas.getContext("2d");

        if (!pageContext) {
          throw new Error("Impossible de créer le contexte Canvas.");
        }

        pageContext.fillStyle = "#ffffff";

        pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        pageContext.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentHeightPx,
          0,
          0,
          canvas.width,
          currentHeightPx,
        );

        const currentHeightMm = currentHeightPx / pixelsPerMm;

        pdf.addImage(
          pageCanvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          marginLeft,
          marginTop,
          contentWidth,
          currentHeightMm,
          undefined,
          "FAST",
        );
      }

      pdf.save(nomFichier);
    } catch (error) {
      console.error("Erreur lors de la génération du PDF :", error);
    } finally {
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }

      setIsDownloadingPdf(false);
    }
  };

  /*CHARGEMENT */

  if (!hasHydrated || isLoadingCahierDesCharges) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${COLORS.primary}15`,
              }}
            >
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{
                  color: COLORS.primary,
                }}
              />
            </div>

            <h2 className="text-lg font-semibold">
              Chargement du cahier des charges
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Préparation de votre document...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ERREUR */

  if (cahierDesChargesError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold">
              Impossible de charger le document
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              {cahierDesChargesError}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              <Button
                onClick={() => {
                  if (token && projetId) {
                    getCahierDesCharges(projetId, token);
                  }
                }}
                style={{
                  backgroundColor: COLORS.primary,
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* AUCUN DOCUMENT */

  if (!cahierDesCharges) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold">Aucun cahier des charges</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Aucun cahier des charges n&apos;est disponible pour ce projet.
            </p>

            <Button
              className="mt-6"
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* DONNÉES */

  const { projet, cahierDesCharges: cahier } = cahierDesCharges;

  /* AFFICHAGE */

  return (
    <>
      <Navigation
        projetId={projet.id}
        active="cahier-des-charges"
        disabled={isDownloading || isDownloadingPdf}
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{
                  color: COLORS.secondary,
                }}
              >
                Cahier des charges
              </h1>

              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${COLORS.primary}15`,
                  color: COLORS.primary,
                }}
              >
                Généré par IA
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Projet :{" "}
              <span
                className="font-semibold"
                style={{
                  color: COLORS.secondary,
                }}
              >
                {projet.titre}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isDownloading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>

            <Button
              variant="outline"
              onClick={telechargerPDF}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Exporter PDF
                </>
              )}
            </Button>

            <Button
              onClick={telechargerWord}
              disabled={isDownloading}
              style={{
                backgroundColor: COLORS.primary,
              }}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger Word
                </>
              )}
            </Button>
          </div>
        </div>

        {/* INFORMATIONS PROJET */}

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText
                className="h-5 w-5"
                style={{
                  color: COLORS.primary,
                }}
              />
              Projet
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 sm:p-6">
            <h2
              className="text-lg font-semibold"
              style={{
                color: COLORS.secondary,
              }}
            >
              {projet.titre}
            </h2>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {projet.descriptionSommaire}
            </p>
          </CardContent>
        </Card>

        {/*DOCUMENT */}

        <div
          id="cahier-des-charges-document"
          className="overflow-hidden rounded-2xl border bg-background shadow-md"
        >
          {/* Document header */}

          <div className="border-b bg-background px-5 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${COLORS.primary}15`,
                }}
              >
                <CheckCircle2
                  className="h-5 w-5"
                  style={{
                    color: COLORS.primary,
                  }}
                />
              </div>

              <div>
                <h2
                  className="text-lg font-semibold sm:text-xl"
                  style={{
                    color: COLORS.secondary,
                  }}
                >
                  Document généré
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Cahier des charges complet généré par WorkPilot.
                </p>
              </div>
            </div>
          </div>

          {/* Document content */}

          <div className="bg-background p-5 sm:p-8 lg:p-12">
            <article
              className="
              prose
              prose-sm
              max-w-none
              dark:prose-invert
              sm:prose-base

              prose-headings:font-bold
              prose-headings:tracking-tight

              prose-h1:mb-8
              prose-h1:text-3xl
              sm:prose-h1:text-4xl

              prose-h2:mt-12
              prose-h2:border-b
              prose-h2:border-border
              prose-h2:pb-3
              prose-h2:text-xl

              prose-h3:mt-8
              prose-h3:text-lg

              prose-h4:mt-6
              prose-h4:text-base

              prose-p:leading-7
              prose-p:text-muted-foreground

              prose-li:leading-7
              prose-li:text-muted-foreground

              prose-strong:text-foreground

              prose-a:font-medium
              prose-a:no-underline

              prose-blockquote:border-primary
              prose-blockquote:bg-muted/30
              prose-blockquote:px-5
              prose-blockquote:py-2

              prose-table:my-8
              prose-table:w-full

              prose-th:border
              prose-th:border-border
              prose-th:bg-muted
              prose-th:px-4
              prose-th:py-3
              prose-th:text-left

              prose-td:border
              prose-td:border-border
              prose-td:px-4
              prose-td:py-3

              prose-code:text-primary

              prose-pre:overflow-x-auto
              prose-pre:rounded-xl
              prose-pre:border
              prose-pre:border-border
              prose-pre:bg-muted
            "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1({ children }) {
                    return (
                      <h1
                        style={{
                          color: COLORS.primary,
                        }}
                      >
                        {children}
                      </h1>
                    );
                  },

                  h2({ children }) {
                    return (
                      <h2
                        style={{
                          color: COLORS.secondary,
                        }}
                      >
                        {children}
                      </h2>
                    );
                  },

                  h3({ children }) {
                    return (
                      <h3
                        style={{
                          color: COLORS.secondary,
                        }}
                      >
                        {children}
                      </h3>
                    );
                  },

                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        style={{
                          color: COLORS.primary,
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    );
                  },

                  table({ children }) {
                    return (
                      <div className="my-8 w-full overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-150 border-collapse">
                          {children}
                        </table>
                      </div>
                    );
                  },

                  img({ src, alt }) {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={src}
                        alt={alt || ""}
                        className="mx-auto max-h-150 max-w-full rounded-xl object-contain"
                      />
                    );
                  },
                }}
              >
                {cahier.contenuGenere}
              </ReactMarkdown>
            </article>
          </div>
        </div>

        {/*FOOTER */}

        <div className="flex flex-col gap-4 rounded-xl border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Généré automatiquement par WorkPilot
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Généré le{" "}
              {new Date(cahier.dateGeneration).toLocaleDateString("fr-FR")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={telechargerPDF}
              disabled={isDownloadingPdf}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Exporter en PDF
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={telechargerWord}
              disabled={isDownloading}
              style={{
                backgroundColor: COLORS.primary,
              }}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter en Word
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
