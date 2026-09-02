import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type MessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail?: string } }
    >;

type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
};

const MAX_TOKENS = {
  gemini: 65536,
  mistral: 8192,
  groq: 8192,
  openrouter: 16384,
} as const;

const estUrlImageValide = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('https://')) return false;
  if (/^https:\/\/res\.cloudinary\.com\/[^/]+\//.test(url)) return true;
  if (/^https:\/\/i\.ibb\.co\//.test(url)) return true;
  if (/\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(url)) return true;
  return false;
};

async function imageVersBase64(url: string): Promise<{
  base64: string;
  mime: string;
} | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') || 'image/png';
    return { base64: buffer.toString('base64'), mime };
  } catch {
    return null;
  }
}

@Injectable()
export class AssistanceIaService {
  private readonly logger = new Logger(AssistanceIaService.name);

  private readonly groqApiUrl =
    'https://api.groq.com/openai/v1/chat/completions';
  private readonly openRouterApiUrl =
    'https://openrouter.ai/api/v1/chat/completions';
  private readonly geminiApiBase =
    'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly mistralApiUrl = 'https://api.mistral.ai/v1/chat/completions';

  /* Modèles Gemini — TEXTE + VISION (fallback automatique) */
  private readonly modelesGemini = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash-8b',
  ];

  /* Modèles Groq : TEXTE */
  private readonly modelesGroq = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b',
    'qwen/qwen3-32b',
  ];

  /* Modèles Groq : VISION */
  private readonly modelesGroqVision = [
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-vision-preview',
    'llava-v1.5-7b-4096-preview',
  ];

  /* Modèles OpenRouter : TEXTE */
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

  /* Modèles OpenRouter : VISION */
  private readonly modelesOpenRouterVision = [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-2-27b-it:free',
    'mimo-v2/mimo-v2.5:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'openrouter/free',
  ];

  /* Modèles Mistral : TEXTE */
  private readonly modelesMistral = [
    'mistral-large-latest',
    'mistral-small-latest',
    'codestral-latest',
    'open-mistral-nemo',
  ];

  /* Modèles Mistral : VISION */
  private readonly modelesMistralVision = [
    'pixtral-large-latest',
    'pixtral-12b-2409',
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

  private construireContenuUser(
    contenu: string,
    images?: string[],
  ): MessageContent {
    const urlsValides = (images ?? []).filter(estUrlImageValide);
    if (urlsValides.length === 0) return contenu || '[Image jointe]';
    return [
      { type: 'text', text: contenu || '[Image jointe]' },
      ...urlsValides.map((url) => ({
        type: 'image_url' as const,
        image_url: { url, detail: 'auto' },
      })),
    ];
  }

  private contientImages(message: any): boolean {
    return Array.isArray(message.images) && message.images.length > 0;
  }

  private async appelerGemini(
    system: string,
    messages: AIMessage[],
  ): Promise<string> {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('GEMINI_API_KEY non configurée');

    // Construit le contenu une seule fois (partagé entre tous les modèles)
    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      >;
    }> = [];

    for (const msg of messages) {
      if (msg.role === 'system') continue;
      const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else if (Array.isArray(msg.content)) {
        for (const item of msg.content) {
          if (item.type === 'text') {
            parts.push({ text: item.text });
          } else if (item.type === 'image_url') {
            const img = await imageVersBase64(item.image_url.url);
            if (img) {
              parts.push({
                inlineData: { mimeType: img.mime, data: img.base64 },
              });
            }
          }
        }
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: MAX_TOKENS.gemini,
      },
    };

    // Fallback : essaie chaque modèle dans l'ordre
    let derniereErreur: Error | null = null;

    for (const modele of this.modelesGemini) {
      try {
        this.logger.debug(`Tentative Gemini avec ${modele}`);

        const res = await fetch(
          `${this.geminiApiBase}/${modele}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          },
        );

        if (res.status === 429) {
          this.logger.warn(`Rate limit Gemini : ${modele}, passage au suivant`);
          continue;
        }

        if (res.status === 404) {
          this.logger.warn(`Modèle Gemini indisponible : ${modele}`);
          continue;
        }

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Gemini ${modele} error (${res.status}): ${errorText}`,
          );
        }

        const data = await res.json();
        const contenu = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!contenu) {
          // Parfois Gemini renvoie une réponse vide (sécurité, filtre)
          const blockReason = data?.candidates?.[0]?.finishReason;
          if (blockReason === 'SAFETY') {
            this.logger.warn(`Blocage sécurité Gemini (${modele})`);
            continue;
          }
          throw new Error('Réponse Gemini vide');
        }

        this.logger.log(
          `Succès Gemini ${modele} (~${Math.ceil(contenu.length / 3)} tokens)`,
        );
        return contenu.trim();
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Échec Gemini ${modele}: ${derniereErreur.message}`);
      }
    }

    throw derniereErreur ?? new Error('Tous les modèles Gemini ont échoué');
  }

  private async appelerMistral(
    system: string,
    messages: AIMessage[],
    avecVision: boolean,
  ): Promise<string> {
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (!mistralKey) throw new Error('MISTRAL_API_KEY non configurée');

    const modelesAUtiliser = avecVision
      ? this.modelesMistralVision
      : this.modelesMistral;

    let derniereErreur: Error | null = null;

    for (const modele of modelesAUtiliser) {
      try {
        this.logger.debug(
          `Tentative Mistral avec ${modele} (vision: ${avecVision})`,
        );

        const response = await fetch(this.mistralApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${mistralKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modele,
            messages: [{ role: 'system', content: system }, ...messages],
            temperature: 0.7,
            max_tokens: MAX_TOKENS.mistral,
          }),
        });

        if (response.status === 429) {
          this.logger.warn(`Rate limit Mistral : ${modele}`);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mistral error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const contenu = data?.choices?.[0]?.message?.content;

        if (!contenu) throw new Error('Réponse Mistral vide');

        this.logger.log(
          `Succès Mistral avec ${modele} (~${Math.ceil(contenu.length / 3)} tokens)`,
        );
        return contenu.trim();
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Échec Mistral ${modele}: ${derniereErreur.message}`);
      }
    }

    throw derniereErreur ?? new Error('Tous les modèles Mistral ont échoué');
  }

  private async appelerGroq(
    system: string,
    messages: AIMessage[],
    avecVision: boolean,
  ): Promise<string> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error('GROQ_API_KEY non configurée');

    const modelesAUtiliser = avecVision
      ? this.modelesGroqVision
      : this.modelesGroq;

    let derniereErreur: Error | null = null;

    for (const modele of modelesAUtiliser) {
      try {
        this.logger.debug(
          `Tentative Groq avec ${modele} (vision: ${avecVision})`,
        );

        const response = await fetch(this.groqApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modele,
            messages: [{ role: 'system', content: system }, ...messages],
            temperature: 0.7,
            max_tokens: MAX_TOKENS.groq,
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

        if (!contenu) throw new Error('Réponse Groq vide');

        this.logger.log(
          `Succès Groq avec ${modele} (~${Math.ceil(contenu.length / 3)} tokens)`,
        );
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
    messages: AIMessage[],
    avecVision: boolean,
  ): Promise<string> {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY non configurée');

    const modelesAUtiliser = avecVision
      ? this.modelesOpenRouterVision
      : this.modelesOpenRouter;

    let derniereErreur: Error | null = null;

    for (const modele of modelesAUtiliser) {
      try {
        this.logger.debug(
          `Tentative OpenRouter avec ${modele} (vision: ${avecVision})`,
        );

        const response = await fetch(this.openRouterApiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'WorkPilot',
          },
          body: JSON.stringify({
            model: modele,
            messages: [{ role: 'system', content: system }, ...messages],
            temperature: 0.7,
            max_tokens: MAX_TOKENS.openrouter,
          }),
        });

        if (
          response.status === 429 ||
          response.status === 404 ||
          response.status === 400
        ) {
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

        if (!contenu) throw new Error('Réponse OpenRouter vide');

        this.logger.log(
          `Succès OpenRouter avec ${modele} (~${Math.ceil(contenu.length / 3)} tokens)`,
        );
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
    messages: AIMessage[],
    avecVision: boolean,
  ): Promise<string> {
    let derniereErreur: Error | null = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.appelerGemini(system, messages);
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Gemini indisponible. Passage à Mistral.`);
      }
    }

    if (process.env.MISTRAL_API_KEY) {
      try {
        return await this.appelerMistral(system, messages, avecVision);
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Mistral indisponible. Passage à Groq.`);
      }
    }

    if (process.env.GROQ_API_KEY) {
      try {
        return await this.appelerGroq(system, messages, avecVision);
      } catch (error) {
        derniereErreur =
          error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Groq indisponible. Passage à OpenRouter.`);
      }
    }

    if (process.env.OPENROUTER_API_KEY) {
      try {
        return await this.appelerOpenRouter(system, messages, avecVision);
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
      where: { tacheId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      conversation = await this.databaseService.assistanceIA.create({
        data: { tacheId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    return conversation;
  }

  async getTaskContent(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      include: { projet: true, assignee: true },
    });

    if (!tache) throw new NotFoundException('Tâche introuvable');
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

  private construireSystemPrompt(
    task: any,
    projectStructure?: string,
    relevantFiles?: { path: string; content: string }[],
  ): string {
    const competences = task.competences?.length
      ? task.competences.join(', ')
      : 'Non renseignées';

    const echeance = task.echeance
      ? new Date(task.echeance).toLocaleDateString('fr-FR')
      : 'Non renseignée';

    const structureSection = projectStructure
      ? `
## ARBORESCENCE ACTUELLE DU PROJET (À LIRE ATTENTIVEMENT)

Voici la structure exacte du projet dans le WebContainer.
**Tu DOIS analyser cette arborescence avant de proposer la moindre action.**

\`\`\`
${projectStructure}
\`\`\`

**Règles d'utilisation :**
- Un nouveau fichier peut être placé dans un dossier existant OU nouveau (il sera créé automatiquement)
- Les imports doivent pointer vers des fichiers qui existent (ou que tu crées) dans cette arborescence
- Tu peux créer de nouveaux dossiers avec \`action: mkdir\` pour organiser le code
- JAMAIS inventer un dossier ou fichier qui n'apparaît pas ci-dessus SANS le créer explicitement
- JAMAIS proposer un path avec \`/\` au début ou avec le nom du projet (ex: pas \`/locmaison/app/page.tsx\`)
`
      : '';

    const filesSection =
      relevantFiles && relevantFiles.length > 0
        ? `
## FICHIERS PERTINENTS DU PROJET (contenu actuel)

Voici le contenu actuel des fichiers importants pour cette tâche.
**Tu DOIS les lire attentivement avant de proposer du code.**

${relevantFiles
  .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
  .join('\n\n')}

**Règles d'utilisation :**
- Respecte le style, les imports et les conventions déjà en place
- Réutilise les composants/hooks/stores existants quand c'est pertinent
- Si tu modifies un fichier, garde TOUT le contenu existant (pas de suppression involontaire)
- JAMAIS proposer du code incompatible avec ce qui existe déjà
`
        : '';

    const packageJsonInfo = relevantFiles?.find((f) =>
      f.path.endsWith('package.json'),
    );

    const stackSection = packageJsonInfo
      ? `
## STACK DÉTECTÉE (depuis package.json)

Voici les dépendances réellement installées dans le projet.
**Utilise UNIQUEMENT ces packages, n'en invente pas d'autres.**

\`\`\`json
${packageJsonInfo.content}
\`\`\`
`
      : '';

    return `
# IDENTITÉ — WorkPilot AI

Tu es **WorkPilot AI**, l'assistant technique expert attaché à UNE tâche précise.
Tu n'es PAS un assistant généraliste. Tu as accès au projet RÉEL de l'utilisateur et tu peux agir directement sur ses fichiers.

Ton objectif : produire du code **production-ready** et **directement applicable** au projet, sans que l'utilisateur ait à le modifier.

---

# CONTEXTE DE LA TÂCHE

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

${structureSection}
${filesSection}
${stackSection}

---

# 🖼️ ANALYSE D'IMAGES

Tu peux recevoir des **images** (captures d'écran, maquettes, diagrammes, erreurs navigateur).

Quand une image est jointe :

1. **Analyse-la attentivement** :
   - Messages d'erreur, stack traces, logs console
   - Interfaces utilisateur, maquettes, designs
   - Diagrammes UML, architectures, schémas
   - Code source visible dans une capture
   - Problèmes visuels (débordements, alignements, couleurs)

2. **Relie l'image au contexte** :
   - Corrèle les erreurs avec le code du projet
   - Compare les maquettes avec les composants existants
   - Identifie les patterns visuels à implémenter

3. **Propose des actions concrètes** :
   - Corrections de bugs avec les fichiers précis à modifier
   - Adaptation du code pour correspondre au design
   - Implémentation de l'architecture décrite dans le diagramme

**Important :** Mentionne toujours CE QUE TU VOIS dans l'image avant de proposer du code.

---

# MÉTHODOLOGIE OBLIGATOIRE — 4 ÉTAPES

**À CHAQUE question, tu DOIS suivre ces 4 étapes dans l'ordre. Ne saute aucune étape.**

## ÉTAPE 1 — 🔍 ANALYSE DU PROJET (obligatoire)

Avant toute chose, analyse en silence :
1. **L'arborescence** : où se trouvent les fichiers ? Quels dossiers existent ?
2. **Les fichiers pertinents** fournis : quel est le style, la structure, les imports ?
3. **La stack** : quelles dépendances sont installées (package.json) ?
4. **Les conventions** : nommage, structure de dossiers, patterns utilisés
5. **Les images jointes** (si présentes) : que voit-on ? erreurs, design, architecture ?

Écris un paragraphe "## 🔍 Analyse" qui résume ce que tu as compris.

## ÉTAPE 2 — 🧠 PLAN D'ACTION

Avant de coder, liste précisément :
- Les **dossiers** à créer (si nécessaire pour organiser le code)
- Les fichiers à **créer** (avec leur chemin exact)
- Les fichiers à **modifier** (avec justification)
- Les fichiers à **supprimer** (si nécessaire)
- Les dépendances à **installer** (si nécessaire)
- L'ordre d'exécution des actions (les dossiers AVANT les fichiers qu'ils contiennent)

Écris une section "## 🧠 Plan d'action" numérotée.

## ÉTAPE 3 — 💻 IMPLÉMENTATION

Produis le code complet pour chaque action en respectant le format ci-dessous.
**Chaque fichier = 1 action = 1 bloc \`file_action\` + 1 bloc de code.**
**Chaque dossier = 1 action = 1 bloc \`file_action\` seul (sans code).**

## ÉTAPE 4 — ✅ VALIDATION

Termine par une section "## ✅ Validation" qui explique :
- Comment tester la fonctionnalité
- Les points de vigilance
- Les prochaines étapes recommandées

---

# FORMAT DE RÉPONSE OBLIGATOIRE

Respecte EXACTEMENT cette structure. Les blocs \`\`\`file_action\`\`\` sont parsés automatiquement par le frontend.

\`\`\`markdown
## 🔍 Analyse

[Paragraphe d'analyse du contexte projet — obligatoire]

## Plan d'action

1. [Créer le dossier X]
2. [Créer le fichier Y]
3. [Modifier le fichier Z]

## Implémentation

### Action 1 : Créer le dossier features/auth

\`\`\`file_action
path: features/auth
action: mkdir
\`\`\`

### Action 2 : Créer le composant LoginForm

\`\`\`file_action
path: features/auth/LoginForm.tsx
action: create
\`\`\`

\`\`\`tsx
// Fichier : features/auth/LoginForm.tsx
// Objectif : Formulaire de connexion
[CODE COMPLET]
\`\`\`

### Action 3 : Modifier app/page.tsx

\`\`\`file_action
path: app/page.tsx
action: update
\`\`\`

\`\`\`tsx
// Fichier : app/page.tsx
// Objectif : Page d'accueil
[CODE COMPLET AVEC TOUT LE CONTENU]
\`\`\`

## Validation

- Comment tester : [...]
- Points de vigilance : [...]
- Prochaines étapes : [...]
\`\`\`

---

# RÈGLES DES ACTIONS

## Les 4 types d'actions

### 1. \`action: mkdir\` — Créer un dossier
- Crée un nouveau dossier (et tous ses parents si nécessaire grâce à \`recursive: true\`)
- **PAS de bloc de code après** (juste le bloc \`file_action\`)
- Utilise-la pour organiser le code en modules logiques

### 2. \`action: create\` — Créer un fichier
- Crée un nouveau fichier avec le contenu fourni
- Le dossier parent sera créé automatiquement si nécessaire
- Le code doit être COMPLET (pas de TODO, pas de "...")

### 3. \`action: update\` — Modifier un fichier
- Remplace INTÉGRALEMENT le contenu d'un fichier existant
- Tu DOIS inclure TOUT le contenu (pas de diff, pas de "code existant ici")
- Préserve tout ce qui n'est pas modifié

### 4. \`action: delete\` — Supprimer
- Supprime un fichier ou un dossier (avec \`recursive: true\`)
- **PAS de bloc de code après**
- À utiliser avec prudence et justification claire

---

# 🗺️ RÈGLES ABSOLUES DES CHEMINS

## Format obligatoire
- Chemins **RELATIFS** à la racine du projet
- **SANS \`/\` au début**
- **SANS le nom du projet**

## Exemples valides
- \`app/page.tsx\`
- \`components/ui/Button.tsx\`
- \`src/hooks/useTasks.ts\`
- \`features/auth/LoginForm.tsx\`
- \`lib/utils/formatDate.ts\`

## Exemples INVALIDES (interdits)
- \`/app/page.tsx\` (pas de \`/\` au début)
- \`locmaison/app/page.tsx\` (pas le nom du projet)
- \`/locmaison/app/page.tsx\` (ni l'un ni l'autre)
- \`./app/page.tsx\` (pas de \`./\`)

---

# STACK TECHNIQUE — DÉTECTION AUTOMATIQUE

Tu DOIS détecter le type de projet ET le langage à partir du \`package.json\`, du \`tsconfig.json\` et de l'arborescence. Adapte ton code en conséquence.

---

# RÈGLES DU CODE

## 1. Complétude absolue
- Code **COMPLET**, pas de TODO, pas de "à compléter", pas de "..."
- **Tous les imports présents**
- Pas de commentaires évidents (\`// Incrémente i\`)

## 2. En-tête obligatoire
Chaque fichier DOIT commencer par :
\`\`\`
// Fichier : chemin/relatif/complet.tsx
// Objectif : [description courte]
// Dépendances : [liste si packages externes utilisés]
\`\`\`

## 3. Cohérence avec le projet
- Réutilise les composants/hooks/stores/modules existants
- Respecte le style (nommage, indentation, quotes)
- Si \`package.json\` est fourni, n'utilise QUE ces dépendances

## 4. Gestion des erreurs
Chaque fonction asynchrone DOIT avoir :
- \`try/catch/finally\`
- Gestion d'état de chargement (frontend)
- Feedback utilisateur (toast, error state)
- Log approprié (pas de \`console.log\` en production)

## 5. Sécurité
- **JAMAIS** de clé API, secret, mot de passe en dur (utilise \`.env\`)
- **JAMAIS** de \`dangerouslySetInnerHTML\` sans sanitization
- **TOUJOURS** hasher les mots de passe (bcrypt, argon2)
- **TOUJOURS** valider et échapper les entrées utilisateur
- **JAMAIS** de SQL brut sans paramètres préparés (risque d'injection)

## 6. Installation de dépendances
Si le code nécessite un nouveau package, ajoute UNE action au début :

\`\`\`bash
npm install nom-du-package
\`\`\`

---

# INTERDICTIONS STRICTES

Tu ne dois **JAMAIS** :

- Mettre des emojis dans les commentaires de code
- Inventer des fichiers, routes, endpoints, colonnes DB
- Inventer des dépendances qui n'existent pas dans package.json
- Proposer du code qui ne compile pas
- Omettre des imports
- Laisser du \`TODO\`, \`FIXME\`, \`// à compléter\`, \`// ...\`
- Donner du code partiel avec "ajoutez le reste ici"
- Proposer \`console.log\` en production (utiliser un logger ou toast)
- Inventer des données utilisateur, tokens, IDs
- Sortir du périmètre de la tâche
- Donner des clés API, secrets, credentials
- Proposer des suppressions de données sans avertissement clair
- Répondre hors contexte ("en général, on fait...")
- Sauter l'étape d'analyse (ÉTAPE 1)
- Sauter l'étape de plan (ÉTAPE 2)
- Oublier un bloc \`file_action\` avant un bloc de code
- Mettre un bloc de code après un \`mkdir\` ou \`delete\`
- Inventer un framework qui n'est pas dans le \`package.json\`

---

# TON ET STYLE

- **Professionnel** mais accessible
- **Direct** — pas de "Bonjour, je suis une IA..."
- **Tutoiement** (tu t'adresses au développeur)
- **Concis** — chaque phrase apporte de la valeur
- **Émojis** : UNIQUEMENT dans les titres Markdown (\`## 🔍 Analyse\`), JAMAIS dans le code
- **Langue** : français par défaut, sauf si l'utilisateur écrit en anglais ou dans une autre langue

---

# RAPPEL FINAL

Tu travailles sur la tâche **"${task.titre}"** du projet **"${task.projet.titre}"**.

**Ta checklist avant chaque réponse :**

- [ ] J'ai lu attentivement l'arborescence
- [ ] J'ai lu attentivement les fichiers pertinents fournis
- [ ] J'ai analysé la stack (package.json si fourni)
- [ ] J'ai détecté le framework (Next / Angular / Vue / NestJS / Express / Fastify / Koa / Hono / HTML pur...)
- [ ] J'ai détecté le langage (TypeScript ou JavaScript)
- [ ] J'ai analysé les images jointes (si présentes)
- [ ] Mon ÉTAPE 1 (Analyse) est rédigée
- [ ] Mon ÉTAPE 2 (Plan) liste toutes les actions dans le bon ordre
- [ ] J'ai créé les dossiers nécessaires avec \`mkdir\` AVANT les fichiers
- [ ] Chaque fichier a son bloc \`file_action\` + son code complet
- [ ] Chaque \`mkdir\` et \`delete\` a son bloc \`file_action\` SEUL (sans code)
- [ ] Chaque chemin est RELATIF, sans \`/\` au début, sans nom de projet
- [ ] Aucun emoji dans les commentaires de code
- [ ] Code complet, pas de TODO, pas de "..."

**Ne réponds JAMAIS sans avoir rempli cette checklist.**
`;
  }

  async chatWithTask(
    tacheId: number,
    userId: number,
    userMessage?: string,
    images?: string[],
    projectStructure?: string,
    relevantFiles?: { path: string; content: string }[],
  ) {
    const hasMessage =
      typeof userMessage === 'string' && userMessage.trim().length > 0;
    const hasImages = Array.isArray(images) && images.length > 0;

    if (!hasMessage && !hasImages) {
      throw new ForbiddenException(
        'Tu dois envoyer un message ou au moins une image.',
      );
    }

    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      include: { projet: true, assignee: true },
    });

    if (!tache) throw new NotFoundException('Tâche introuvable');
    this.verifierAccesIA(tache, userId);

    const urlsValides = (images ?? []).filter(estUrlImageValide);
    const conversation = await this.obtenirConversation(tacheId);

    await this.databaseService.messageIA.create({
      data: {
        conversationId: conversation.id,
        role: 'utilisateur',
        contenu: (userMessage ?? '').trim() || '[Image jointe]',
        images: urlsValides,
      },
    });

    const historique = await this.databaseService.messageIA.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const systemPrompt = this.construireSystemPrompt(
      tache,
      projectStructure,
      relevantFiles,
    );

    const avecVision = historique.some((m) => this.contientImages(m));

    const messages: AIMessage[] = historique
      .filter((m) => m.role === 'utilisateur' || m.role === 'assistant')
      .map((message) => ({
        role:
          message.role === 'utilisateur'
            ? ('user' as const)
            : ('assistant' as const),
        content:
          message.role === 'utilisateur'
            ? this.construireContenuUser(message.contenu, message.images)
            : message.contenu,
      }));

    let aiResponse: string;

    try {
      aiResponse = await this.appelerIA(systemPrompt, messages, avecVision);
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
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      tacheId,
      message: {
        id: savedMessage.id,
        role: savedMessage.role,
        contenu: savedMessage.contenu,
        images: [],
        createdAt: savedMessage.createdAt,
      },
    };
  }

  async getTaskMessages(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      include: { assignee: true },
    });

    if (!tache) throw new NotFoundException('Tâche introuvable');
    this.verifierAccesIA(tache, userId);

    const conversation = await this.databaseService.assistanceIA.findUnique({
      where: { tacheId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      return { conversationId: null, tacheId, messages: [] };
    }

    return {
      conversationId: conversation.id,
      tacheId,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        contenu: message.contenu,
        images: message.images ?? [],
        createdAt: message.createdAt,
      })),
    };
  }

  async getConversation(tacheId: number, userId: number) {
    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      include: { projet: true, assignee: true },
    });

    if (!tache) throw new NotFoundException('Tâche introuvable');
    this.verifierAccesIA(tache, userId);

    const conversation = await this.databaseService.assistanceIA.findUnique({
      where: { tacheId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      return {
        conversationId: null,
        tache: { id: tache.id, titre: tache.titre },
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
      messages: conversation.messages.map((message) => ({
        id: message.id,
        role: message.role,
        contenu: message.contenu,
        images: message.images ?? [],
        createdAt: message.createdAt,
      })),
    };
  }
}
