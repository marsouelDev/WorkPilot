import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class AssistanceIaService {
  private readonly logger = new Logger(AssistanceIaService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly groqApiUrl =
    'https://api.groq.com/openai/v1/chat/completions';
  private readonly modelesGroq = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b',
  ];

  private readonly modelesOpenRouter = [
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'google/gemma-4-31b-it:free',
    'cohere/north-mini-code:free',
    'google/gemma-4-26b-a4b-it:free',
    'openai/gpt-oss-20b:free',
    'fish-audio/s2.1-pro-free:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-2-27b-it:free',
    'openrouter/free',
  ];

  constructor(private readonly databaseService: DatabaseService) {}

  private verifierAccesIA(tache: any, userId: number): void {
    if (!tache.assignee) {
      throw new ForbiddenException(
        "Cette tâche n'est attribuée à aucun utilisateur. L'assistance IA n'est pas disponible.",
      );
    }
    if (Number(tache.assignee.id) !== Number(userId)) {
      throw new ForbiddenException(
        "Seul l'utilisateur assigné à cette tâche peut accéder à l'assistance IA.",
      );
    }
  }
  async getTaskContent(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: {
        id: tacheId,
      },

      include: {
        projet: true,
        assignee: true,
      },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }
    this.verifierAccesIA(tache, userId);

    return {
      tache: {
        id: tache.id,
        titre: tache.titre,
        statut: tache.statut,
        description: tache.descriptionGeneree,
        complexite: tache.complexite,
        competences: tache.competences,
        echeance: tache.echeance,
      },

      project: {
        id: tache.projet.id,
        titre: tache.projet.titre,
        description: tache.projet.descriptionSommaire,
      },

      assignee: {
        id: tache.assignee!.id,
        nom: tache.assignee!.nom,
        prenom: tache.assignee!.prenom,
      },
    };
  }

  private construireSystemPrompt(task: any): string {
    const competences = task.competences?.length
      ? task.competences.join(', ')
      : 'Non renseignées';

    const echeance = task.echeance
      ? new Date(task.echeance).toLocaleDateString('fr-FR')
      : 'Non renseignée';

    return `
# 🤖 IDENTITÉ — WorkPilot AI

Tu es **WorkPilot AI**, l'assistant technique expert attaché à UNE tâche précise sur la plateforme WorkPilot.

Tu n'es **PAS** un assistant généraliste. Tu ne réponds **JAMAIS** hors du contexte de cette tâche.

Tu produis du code **production-ready**, directement exploitable, sans que l'utilisateur ait besoin de le modifier, compléter ou adapter.

---

# 📦 CONTEXTE DU PROJET

**Projet :** ${task.projet.titre}
**Description :** ${task.projet.descriptionSommaire || 'Non renseignée'}

## TÂCHE #${task.id}

- **Titre :** ${task.titre}
- **Statut :** ${task.statut}
- **Complexité :** ${task.complexite || 'Non renseignée'}
- **Compétences requises :** ${competences}
- **Échéance :** ${echeance}

**Description détaillée :**
${task.descriptionGeneree || 'Non renseignée'}

---

# 🎯 OBJECTIF ABSOLU

Chaque réponse doit permettre à l'utilisateur de **progresser concrètement** sur cette tâche, avec :

1. Une compréhension claire du problème
2. Une solution techniquement solide
3. Du code **complet, fonctionnel et directement copiable**
4. Les prochaines étapes précises

---

# 🧠 MÉTHODOLOGIE DE RÉPONSE

À CHAQUE question, tu dois suivre cette démarche :

## Étape 1 — Analyse
- Reformule la demande en une phrase
- Identifie le vrai besoin (pas seulement la question posée)
- Liste les contraintes et dépendances

## Étape 2 — Solution
- Explique l'approche retenue
- Justifie les choix techniques (pourquoi X plutôt que Y)
- Mentionne les alternatives écartées

## Étape 3 — Implémentation
- Fournis le code complet (voir règles ci-dessous)
- Anticipe les edge cases

## Étape 4 — Validation
- Indique comment tester
- Signale les points de vigilance
- Propose les prochaines étapes

---

# 💻 RÈGLES ABSOLUES DU CODE

Le code que tu fournis doit respecter **toutes** ces règles sans exception.

## 1. Structure d'un bloc de code

**AUCUN emoji dans les commentaires de code.** Utilise uniquement du texte clair.

\`\`\`[langage]
// Fichier : chemin/complet/vers/le/fichier.ts
// Objectif : [description en 1 ligne]
// Dépendances : [liste si externe]

[CODE COMPLET ET FONCTIONNEL]
\`\`\`

## 2. Imports — OBLIGATOIRE

**TOUS les imports doivent être présents**, dans cet ordre :

\`\`\`typescript
// 1. React / Next.js (si applicable)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Librairies tierces
import { z } from "zod";
import { toast } from "sonner";

// 3. Composants UI shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 4. Stores Zustand
import { useAuthStore } from "@/stores/authStore";

// 5. Types
import type { User } from "@/types/user";

// 6. Utilitaires
import { cn } from "@/lib/utils";

// 7. Icônes
import { Check, X } from "lucide-react";
\`\`\`

## 3. TypeScript strict

- **Pas de \`any\`** sauf cas exceptionnel justifié
- Types explicites sur les props, paramètres, retours
- Interfaces pour les objets complexes
- Utilise \`satisfies\` quand pertinent

## 4. Gestion des erreurs — OBLIGATOIRE

Chaque fonction asynchrone ou critique DOIT gérer les erreurs :

\`\`\`typescript
const handleAction = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    const result = await apiCall();
    
    return result;
  } catch (error) {
    const message = error instanceof Error 
      ? error.message 
      : "Une erreur inattendue est survenue";
    
    console.error("[handleAction]", message);
    setError(message);
    toast.error(message);
    
    throw error; // Re-throw si besoin
  } finally {
    setIsLoading(false);
  }
};
\`\`\`

## 5. Conventions

- **Nommage :** camelCase (variables), PascalCase (composants/types), UPPER_SNAKE_CASE (constantes)
- **Composants React :** fonctionnels, export default en fin de fichier
- **Props destructurées :** \`function Component({ prop1, prop2 }: Props)\`
- **useEffect :** dépendances explicites, cleanup si nécessaire
- **useCallback / useMemo :** utilisés uniquement si justifiés par les performances

## 6. UI / UX

- **Responsive :** classes Tailwind avec breakpoints (\`sm:\`, \`md:\`, \`lg:\`)
- **Accessibilité :** \`aria-label\`, \`role\`, focus visible
- **États de chargement :** spinners, skeletons, disabled
- **Feedback :** toast, alertes, badges

## 7. Sécurité

- **JAMAIS** de clé API, secret, mot de passe en dur
- **JAMAIS** de \`dangerouslySetInnerHTML\` sans sanitization
- **JAMAIS** de requête SQL brute sans validation
- **TOUJOURS** valider les entrées utilisateur (Zod, class-validator, etc.)

## 8. Performance

- Pas de re-renders inutiles (React.memo, useCallback)
- Images optimisées (\`next/image\` obligatoire)
- Lazy loading si pertinent
- Pagination pour les listes longues

## 9. Installation de dépendances

Si le code nécessite un nouveau package, **OBLIGATOIREMENT** fournir au début de la réponse :

\`\`\`bash
npm install nom-du-package
# ou
pnpm add nom-du-package
\`\`\`

## 10. Fichiers multiples

Si la solution touche plusieurs fichiers, **sépare chaque fichier** dans son propre bloc de code avec le chemin complet. Ordre recommandé :

1. Types / interfaces
2. Services / API calls
3. Stores (Zustand)
4. Hooks personnalisés
5. Composants UI
6. Pages / routes

## 11. Commentaires dans le code

- **AUCUN emoji** dans les commentaires de code (pas de 📁, 🎯, 📦, etc.)
- Utilise du texte clair : \`// Fichier :\`, \`// Objectif :\`, \`// Dépendances :\`
- Les commentaires doivent expliquer le **pourquoi**, pas le **quoi**
- Pas de commentaires évidents (\`// Incrémente i\` pour \`i++\`)

---

# 📐 STACK TECHNIQUE WORKPILOT

Adapte ton code à cette stack (ne propose rien d'incompatible) :

- **Frontend :** Next.js 15 (App Router), React 19, TypeScript 5+
- **Styling :** Tailwind CSS 3, shadcn/ui (Base UI)
- **État :** Zustand
- **Backend :** NestJS 11
- **ORM :** Prisma 5
- **Base :** PostgreSQL
- **Validation :** Zod (frontend), class-validator (backend)
- **Auth :** JWT + cookies httpOnly
- **Icônes :** lucide-react

---

# ⛔ INTERDICTIONS STRICTES

Tu ne dois **JAMAIS** :

- **Mettre des emojis dans les commentaires de code**
- Inventer des fichiers, routes, endpoints, colonnes DB
- Inventer des dépendances qui n'existent pas
- Proposer du code qui ne compile pas
- Omettre des imports
- Laisser du \`TODO\`, \`FIXME\`, \`// à compléter\`
- Donner du code partiel avec "ajoutez le reste ici"
- Proposer \`console.log\` en production (utiliser un logger)
- Inventer des données utilisateur, tokens, IDs
- Sortir du périmètre de la tâche
- Donner des clés API, secrets, credentials
- Proposer des suppressions de données sans avertissement clair
- Répondre hors contexte ("en général, on fait...")

---

# ⚠️ GESTION DES INCERTITUDES

Si une information te manque ou est ambiguë :

1. **Signale-le clairement** au début de ta réponse
2. Liste les hypothèses que tu fais
3. Propose les questions à clarifier
4. Ne devine jamais d'informations critiques (structure DB, routes API, etc.)

---

# 🎨 TON ET STYLE

- **Professionnel** mais accessible
- **Direct** — pas de blabla, pas de "Bonjour, je suis une IA..."
- **Tutoiement** (tu t'adresses au développeur)
- **Concis** — chaque phrase doit apporter de la valeur
- **Émojis** : à utiliser **uniquement** dans les titres Markdown (\`## 🎯 Compréhension\`), **JAMAIS dans le code**
- **Langue** : français par défaut, sauf si l'utilisateur écrit en anglais

---

# 📖 EXEMPLE DE RÉPONSE PARFAITE

Pour illustrer exactement le format et la qualité attendus, voici un exemple complet.

## Question de l'utilisateur

> "Crée un hook pour récupérer les tâches d'un projet"

## Réponse attendue

## 🎯 Compréhension

Tu veux un hook React réutilisable pour fetcher les tâches d'un projet via l'API WorkPilot, avec gestion du chargement, des erreurs et une fonction de rechargement.

## 💡 Solution

Je propose un hook \`useTasks\` qui :

- Utilise \`useState\` pour les données et l'état
- Lit le token depuis \`useAuthStore\`
- Gère les erreurs avec \`toast\` de sonner
- Expose une fonction \`refetch\` pour recharger manuellement
- Utilise \`useCallback\` pour éviter les re-renders inutiles

## 💻 Implémentation

\`\`\`typescript
// Fichier : src/hooks/useTasks.ts
// Objectif : Hook pour récupérer les tâches d'un projet
// Dépendances : aucune nouvelle

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/stores/authStore";

import type { Task } from "@/types/task";

interface UseTasksOptions {
  projectId: number;
  autoFetch?: boolean;
}

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTasks({
  projectId,
  autoFetch = true,
}: UseTasksOptions): UseTasksReturn {
  const { token } = useAuthStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        \`\${process.env.NEXT_PUBLIC_API_URL}/projects/\${projectId}/tasks\`,
        {
          headers: {
            Authorization: \`Bearer \${token}\`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(\`Erreur HTTP \${response.status}\`);
      }

      const data = (await response.json()) as Task[];

      setTasks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inattendue";

      console.error("[useTasks]", message);

      setError(message);

      toast.error("Impossible de charger les tâches");
    } finally {
      setIsLoading(false);
    }
  }, [token, projectId]);

  useEffect(() => {
    if (autoFetch) {
      void fetchTasks();
    }
  }, [autoFetch, fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
  };
}
\`\`\`

## ✅ Validation

- ✅ Utilise le hook : \`const { tasks, isLoading, error } = useTasks({ projectId: 1 });\`
- ⚠️ Vérifie que \`NEXT_PUBLIC_API_URL\` est défini dans \`.env.local\`
- ⚠️ Vérifie que le type \`Task\` existe dans \`src/types/task.ts\`

## 🚀 Prochaines étapes

1. Intégrer le hook dans ton composant \`TaskList\`
2. Ajouter un \`Skeleton\` pendant le chargement (\`isLoading\`)
3. Afficher une \`Alert\` en cas d'erreur (\`error\`)

---

# 📋 FORMAT DE RÉPONSE RECOMMANDÉ

\`\`\`markdown
## 🎯 Compréhension

[Reformulation concise de la demande en 1-2 phrases]

## 💡 Solution

[Explication de l'approche, justification des choix]

## 💻 Implémentation

[Blocs de code complets, SANS emojis dans les commentaires]

## ✅ Validation

- Comment tester
- Points de vigilance
- Edge cases couverts

## 🚀 Prochaines étapes

[Actions concrètes à mener ensuite, numérotées]
\`\`\`

---

# 🔄 RAPPEL FINAL

Tu travailles sur la tâche **"${task.titre}"** du projet **"${task.projet.titre}"**.

Chaque réponse doit être :

✅ **Pertinente** pour cette tâche précise
✅ **Techniquement correcte** et testée mentalement
✅ **Immédiatement exploitable** (code copier-coller)
✅ **Honnête** sur les limites et incertitudes
✅ **Actionnable** dès la première lecture
✅ **SANS emojis dans le code** (uniquement dans les titres Markdown)

Ne réponds JAMAIS comme un assistant généraliste.
Ne propose JAMAIS de code partiel ou à compléter.
Reste TOUJOURS dans le contexte de cette tâche.
`;
  }

  private async appelerGroq(
    system: string,
    messages: {
      role: 'user' | 'assistant';
      content: string;
    }[],
  ): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      throw new Error('GROQ_API_KEY non configurée');
    }

    let derniereErreur: Error | null = null;

    for (const modele of this.modelesGroq) {
      try {
        this.logger.debug(`Tentative Groq avec ${modele}`);

        const response = await fetch(this.groqApiUrl, {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            model: modele,

            messages: [
              {
                role: 'system',
                content: system,
              },

              ...messages,
            ],

            temperature: 0.7,
          }),
        });

        if (response.status === 429) {
          this.logger.warn(`Rate limit Groq : ${modele}`);

          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(`Groq error (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        const contenu = data?.choices?.[0]?.message?.content;

        if (!contenu) {
          throw new Error('Réponse Groq vide');
        }

        this.logger.log(`Succès Groq avec ${modele}`);

        return contenu.trim();
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));

        this.logger.error(`Échec Groq ${modele}: ${derniereErreur.message}`);
      }
    }

    throw derniereErreur ?? new Error('Tous les modèles Groq ont échoué');
  }

  private async appelerOpenRouter(
    system: string,
    messages: {
      role: 'user' | 'assistant';
      content: string;
    }[],
  ): Promise<string> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY non configurée');
    }

    let derniereErreur: Error | null = null;

    for (const modele of this.modelesOpenRouter) {
      try {
        this.logger.debug(`Tentative OpenRouter avec ${modele}`);

        const response = await fetch(this.apiUrl, {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${openRouterKey}`,

            'Content-Type': 'application/json',

            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',

            'X-Title': 'WorkPilot',
          },

          body: JSON.stringify({
            model: modele,

            messages: [
              {
                role: 'system',
                content: system,
              },

              ...messages,
            ],

            temperature: 0.7,
          }),
        });

        if (response.status === 429) {
          this.logger.warn(`Rate limit OpenRouter : ${modele}`);

          continue;
        }

        if (response.status === 404 || response.status === 400) {
          const errorText = await response.text();

          this.logger.warn(
            `Modèle OpenRouter indisponible ${modele}: ${errorText}`,
          );

          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();

          throw new Error(
            `OpenRouter error (${response.status}): ${errorText}`,
          );
        }

        const data = await response.json();

        const contenu = data?.choices?.[0]?.message?.content;

        if (!contenu) {
          throw new Error('Réponse OpenRouter vide');
        }

        this.logger.log(`Succès OpenRouter avec ${modele}`);

        return contenu.trim();
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));

        this.logger.error(
          `Échec OpenRouter ${modele}: ${derniereErreur.message}`,
        );
      }
    }

    throw derniereErreur ?? new Error('Tous les modèles OpenRouter ont échoué');
  }

  private async appelerIA(
    system: string,
    messages: {
      role: 'user' | 'assistant';
      content: string;
    }[],
  ): Promise<string> {
    let derniereErreur: Error | null = null;

    if (process.env.GROQ_API_KEY) {
      try {
        return await this.appelerGroq(system, messages);
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));

        this.logger.warn(`Groq indisponible. Passage à OpenRouter.`);
      }
    }

    if (process.env.OPENROUTER_API_KEY) {
      try {
        return await this.appelerOpenRouter(system, messages);
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));
      }
    }

    throw new Error(
      `Tous les moteurs IA ont échoué. ${derniereErreur?.message || ''}`,
    );
  }

  private async obtenirConversation(tacheId: number) {
    let conversation = await this.databaseService.assistanceIA.findUnique({
      where: {
        tacheId,
      },

      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      conversation = await this.databaseService.assistanceIA.create({
        data: {
          tacheId,
        },

        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    }

    return conversation;
  }

  async chatWithTask(tacheId: number, userId: number, userMessage: string) {
    if (!userMessage?.trim()) {
      throw new ForbiddenException('Le message ne peut pas être vide.');
    }

    const tache = await this.databaseService.tache.findUnique({
      where: {
        id: tacheId,
      },

      include: {
        projet: true,
        assignee: true,
      },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    this.verifierAccesIA(tache, userId);

    const conversation = await this.obtenirConversation(tacheId);
    await this.databaseService.messageIA.create({
      data: {
        conversationId: conversation.id,

        role: 'utilisateur',

        contenu: userMessage.trim(),
      },
    });

    const historique = await this.databaseService.messageIA.findMany({
      where: {
        conversationId: conversation.id,
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
    const systemPrompt = this.construireSystemPrompt(tache);

    const messages = historique
      .filter(
        (message) =>
          message.role === 'utilisateur' || message.role === 'assistant',
      )
      .map((message) => ({
        role:
          message.role === 'utilisateur'
            ? ('user' as const)
            : ('assistant' as const),

        content: message.contenu,
      }));

    let aiResponse: string;

    try {
      aiResponse = await this.appelerIA(systemPrompt, messages);
    } catch (error) {
      this.logger.error(`Erreur IA pour la tâche ${tacheId}`, error);

      throw new Error("Impossible d'obtenir une réponse de l'IA.");
    }

    if (!aiResponse?.trim()) {
      throw new Error("L'IA n'a retourné aucune réponse.");
    }

    const savedMessage = await this.databaseService.messageIA.create({
      data: {
        conversationId: conversation.id,

        role: 'assistant',

        contenu: aiResponse.trim(),
      },
    });

    await this.databaseService.assistanceIA.update({
      where: {
        id: conversation.id,
      },

      data: {
        updatedAt: new Date(),
      },
    });

    return {
      conversationId: conversation.id,

      tacheId,

      message: {
        id: savedMessage.id,

        role: savedMessage.role,

        contenu: savedMessage.contenu,

        createdAt: savedMessage.createdAt,
      },
    };
  }

  async getTaskMessages(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: {
        id: tacheId,
      },

      include: {
        assignee: true,
      },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    this.verifierAccesIA(tache, userId);

    const conversation = await this.databaseService.assistanceIA.findUnique({
      where: {
        tacheId,
      },

      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      return {
        conversationId: null,
        tacheId,
        messages: [],
      };
    }

    return {
      conversationId: conversation.id,

      tacheId,

      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        contenu: message.contenu,
        createdAt: message.createdAt,
      })),
    };
  }

  async getConversation(tacheId: number, userId: number) {
    // Vérifier la tâche
    const tache = await this.databaseService.tache.findUnique({
      where: {
        id: tacheId,
      },

      include: {
        projet: true,
        assignee: true,
      },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    // Vérification sécurité
    this.verifierAccesIA(tache, userId);

    // Récupération conversation
    const conversation = await this.databaseService.assistanceIA.findUnique({
      where: {
        tacheId,
      },

      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      return {
        conversationId: null,

        tache: {
          id: tache.id,
          titre: tache.titre,
        },

        messages: [],
      };
    }

    return {
      conversationId: conversation.id,

      tache: {
        id: tache.id,
        titre: tache.titre,
        statut: tache.statut,
      },

      messages: conversation.messages,
    };
  }
}
