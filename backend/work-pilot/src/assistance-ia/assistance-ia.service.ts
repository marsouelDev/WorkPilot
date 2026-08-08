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
    'google/gemma-4-26b-a4b-it:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-2-27b-it:free',
    'openrouter/free',
  ];

  constructor(private readonly databaseService: DatabaseService) {}

  async getTaskContent(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      include: {
        projet: { include: { membres: true } },
        assignee: true,
      },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    const isMember = tache.projet.membres.some(
      (membre) => membre.utilisateurId === userId,
    );
    const isCreator = tache.projet.createurId === userId;

    if (!isMember && !isCreator) {
      throw new ForbiddenException("Vous n'avez pas accès à cette tâche");
    }

    return {
      tache: {
        id: tache.id,
        titre: tache.titre,
        statut: tache.statut,
      },
      project: {
        id: tache.projet.id,
        titre: tache.projet.titre,
      },
      assignee: tache.assignee
        ? {
            id: tache.assignee.id,
            nom: tache.assignee.nom,
            prenom: tache.assignee.prenom,
          }
        : null,
    };
  }

  private construireSystemPrompt(task: any): string {
    return `
# RÔLE ET IDENTITÉ

Tu es **WorkPilot AI**, l'assistant intelligent spécialisé de la plateforme WorkPilot.
Tu accompagnes les développeurs dans la réalisation de leurs tâches techniques.

⚠️ **Tu n'es PAS un assistant généraliste.** Tu es un expert dédié à UNE tâche précise.

Tu es attaché à une tâche précise.
Tu dois toujours répondre en tenant compte
du contexte de cette tâche.

# CONTEXTE DU PROJET

Projet : ${task.projet.titre}

**Description du projet :**
${task.projet.descriptionSommaire}

# TA MISSION : TÂCHE #${task.id}

## Intitulé : ${task.titre}

**Description détaillée :**
${task.descriptionGeneree}

**Informations clés :**
- Statut actuel : \`${task.statut}\`
- Complexité : \`${task.complexite}\`
- Compétences requises : ${task.competences.join(', ')}

---

# TES RESPONSABILITÉS

Tu dois IMPÉRATIVEMENT :

1. **Analyser la tâche** avant de répondre
   - Comprendre l'objectif final
   - Identifier les dépendances techniques
   - Anticiper les pièges potentiels

2. **Guider l'utilisateur étape par étape**
   - Proposer un plan d'action clair et numéroté
   - Décomposer les problèmes complexes en sous-tâches
   - Prioriser les étapes critiques

3. **Fournir du code de qualité** quand c'est pertinent
   - Code complet et fonctionnel (pas de pseudo-code sauf demande)
   - Respecter les conventions du projet
   - Inclure les imports nécessaires
   - Ajouter des commentaires pour la logique complexe

4. **Rester dans le périmètre de la tâche**
   - Ne pas dériver vers d'autres sujets
   - Ne pas proposer de fonctionnalités hors-scope

---

# RÈGLES STRICTES (NON NÉGOCIABLES)

## CE QUE TU NE DOIS JAMAIS FAIRE :

1. **Ne jamais inventer** des informations sur le projet
   - Si une information manque → dis-le clairement
   - Si tu n'es pas sûr → exprime ton incertitude

2. **Ne jamais donner de conseils dangereux**
   - Pas de suppression de données sans confirmation
   - Pas de contournement de sécurité
   - Pas de credentials en dur dans le code

3. **Ne jamais sortir du contexte**
   - Pas de réponses génériques type ChatGPT
   - Toujours relier à la tâche #${task.id}

##CE QUE TU DOIS FAIRE :

1. **Demander des clarifications** si la question est ambiguë
   - "Peux-tu préciser..."
   - "Je comprends que tu veux..., est-ce correct ?"

2. **Signaler les problèmes potentiels**
   - Bugs possibles
   - Failles de sécurité
   - Problèmes de performance

3. **Proposer des alternatives** quand c'est pertinent
   - Solution A vs Solution B
   - Avantages/inconvénients de chaque approche

---

# FORMAT DE TES RÉPONSES

## Structure recommandée :

1. **Compréhension** (1-2 lignes) : Reformule la question pour confirmer
2. **Solution** : Ta réponse détaillée
3. **Code** (si applicable) : Bloc de code complet et commenté
4. **Prochaines étapes** : Ce que l'utilisateur doit faire ensuite

## Pour le code :

- Utilise les blocs de code Markdown avec le langage :
  \`\`\`typescript
  // Ton code ici
  \`\`\`
  
- Pour les commandes shell :
  \`\`\`bash
  npm install package
  \`\`\`

## Ton et style :

- Professionnel mais accessible
- Direct et concis (pas de blabla inutile)
- Utilise le tutoiement
- Évite les émojis sauf pour les alertes (⚠️ ✅ ❌)

---

# NIVEAU D'EXPLICATION

Adapte ton niveau selon la complexité :

- **Tâche \`faible\`** : Explications courtes, code direct
- **Tâche \`moyenne\`** : Explications structurées, alternatives
- **Tâche \`élevée\`** : Explications détaillées, architecture, trade-offs

---

# RAPPEL FINAL

Tu es l'assistant de la tâche **"${task.titre}"** du projet **"${task.projet.titre}"**.

Chaque réponse doit être :
- ✅ Pertinente pour CETTE tâche
- ✅ Actionnable immédiatement
- ✅ Techniquement correcte
- ✅ Honnête sur tes limites

Commence toujours par analyser la demande avant de répondre.
`;
  }

  private async appelerIA(
    system: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<string> {
    let derniereErreur: Error | null = null;

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      for (const modele of this.modelesGroq) {
        try {
          this.logger.debug(`Tentative Groq avec ${modele}`);

          const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
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
            },
          );

          if (response.status === 429) {
            this.logger.warn(`Rate limit Groq : ${modele}`);
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();

            throw new Error(`Groq error (${response.status}): ${errorText}`);
          }

          const data = await response.json();

          const contenu = data.choices?.[0]?.message?.content;

          if (!contenu) {
            throw new Error('Réponse Groq vide');
          }

          this.logger.log(`Succès Groq avec ${modele}`);

          return contenu.trim();
        } catch (error) {
          derniereErreur = error as Error;

          this.logger.error(`Échec Groq ${modele}: ${derniereErreur.message}`);
        }
      }
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (openRouterKey) {
      for (const modele of this.modelesOpenRouter) {
        try {
          this.logger.debug(`Tentative OpenRouter avec ${modele}`);

          const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
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
            },
          );

          if (response.status === 429) {
            this.logger.warn(`Rate limit OpenRouter : ${modele}`);
            continue;
          }

          if (response.status === 404) {
            this.logger.warn(`Modèle OpenRouter indisponible : ${modele}`);
            continue;
          }

          if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
              `OpenRouter error (${response.status}): ${errorText}`,
            );
          }

          const data = await response.json();

          const contenu = data.choices?.[0]?.message?.content;

          if (!contenu) {
            throw new Error('Réponse OpenRouter vide');
          }

          this.logger.log(`Succès OpenRouter avec ${modele}`);

          return contenu.trim();
        } catch (error) {
          derniereErreur = error as Error;

          this.logger.error(
            `Échec OpenRouter ${modele}: ${derniereErreur.message}`,
          );
        }
      }
    }

    throw new Error(
      `Tous les moteurs IA ont échoué. ${derniereErreur?.message || ''}`,
    );
  }
  async chatWithTask(tacheId: number, userId: number, userMessage: string) {
    const tache = await this.databaseService.tache.findUnique({
      where: {
        id: tacheId,
      },

      include: {
        projet: {
          include: {
            membres: true,
          },
        },

        assignee: true,
      },
    });

    if (!tache) {
      throw new NotFoundException('Tâche introuvable');
    }

    const isMember = tache.projet.membres.some(
      (membre) => membre.utilisateurId === userId,
    );

    const isCreator = tache.projet.createurId === userId;

    if (!isMember && !isCreator) {
      throw new ForbiddenException('Vous n’avez pas accès à cette tâche');
    }

    let conversation = await this.databaseService.assistanceIA.findUnique({
      where: {
        tacheId_utilisateurId: {
          tacheId: tacheId,
          utilisateurId: userId,
        },
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
          tacheId: tacheId,
          utilisateurId: userId,
        },

        include: {
          messages: true,
        },
      });
    }

    await this.databaseService.messageIA.create({
      data: {
        conversationId: conversation.id,
        role: 'utilisateur',
        contenu: userMessage,
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

    const messages = historique.map((message) => ({
      role:
        message.role === 'utilisateur'
          ? ('user' as const)
          : ('assistant' as const),

      content: message.contenu,
    }));

    const aiResponse = await this.appelerIA(systemPrompt, messages);

    if (!aiResponse) {
      throw new Error("L'IA n'a retourné aucune réponse");
    }

    const savedMessage = await this.databaseService.messageIA.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        contenu: aiResponse,
      },
    });

    return {
      conversationId: conversation.id,

      message: {
        id: savedMessage.id,
        role: savedMessage.role,
        contenu: savedMessage.contenu,
        createdAt: savedMessage.createdAt,
      },
    };
  }
}
