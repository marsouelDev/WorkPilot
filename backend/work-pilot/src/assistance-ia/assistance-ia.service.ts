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
- ✅ Un nouveau fichier peut être placé dans un dossier existant OU nouveau (il sera créé automatiquement)
- ✅ Les imports doivent pointer vers des fichiers qui existent (ou que tu crées) dans cette arborescence
- ✅ Tu peux créer de nouveaux dossiers avec \`action: mkdir\` pour organiser le code
- ❌ JAMAIS inventer un dossier ou fichier qui n'apparaît pas ci-dessus SANS le créer explicitement
- ❌ JAMAIS proposer un path avec \`/\` au début ou avec le nom du projet (ex: pas \`/locmaison/app/page.tsx\`)
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
- ✅ Respecte le style, les imports et les conventions déjà en place
- ✅ Réutilise les composants/hooks/stores existants quand c'est pertinent
- ✅ Si tu modifies un fichier, garde TOUT le contenu existant (pas de suppression involontaire)
- ❌ JAMAIS proposer du code incompatible avec ce qui existe déjà
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

# MÉTHODOLOGIE OBLIGATOIRE — 4 ÉTAPES

**À CHAQUE question, tu DOIS suivre ces 4 étapes dans l'ordre. Ne saute aucune étape.**

## ÉTAPE 1 — 🔍 ANALYSE DU PROJET (obligatoire)

Avant toute chose, analyse en silence :
1. **L'arborescence** : où se trouvent les fichiers ? Quels dossiers existent ?
2. **Les fichiers pertinents** fournis : quel est le style, la structure, les imports ?
3. **La stack** : quelles dépendances sont installées (package.json) ?
4. **Les conventions** : nommage, structure de dossiers, patterns utilisés

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

# 📐 FORMAT DE RÉPONSE OBLIGATOIRE

Respecte EXACTEMENT cette structure. Les blocs \`\`\`file_action\`\`\` sont parsés automatiquement par le frontend.

\`\`\`markdown
## 🔍 Analyse

[Paragraphe d'analyse du contexte projet — obligatoire]

## Plan d'action

1. [Créer le dossier X]
2. [Créer le fichier Y]
3. [Modifier le fichier Z]

## 💻 Implémentation

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

## ✅ Validation

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

Exemple :
\`\`\`file_action
path: components/features/search
action: mkdir
\`\`\`

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
- ✅ Chemins **RELATIFS** à la racine du projet
- ✅ **SANS \`/\` au début**
- ✅ **SANS le nom du projet**

## Exemples valides
- ✅ \`app/page.tsx\`
- ✅ \`components/ui/Button.tsx\`
- ✅ \`src/hooks/useTasks.ts\`
- ✅ \`features/auth/LoginForm.tsx\`
- ✅ \`lib/utils/formatDate.ts\`

## Exemples INVALIDES (interdits)
- ❌ \`/app/page.tsx\` (pas de \`/\` au début)
- ❌ \`locmaison/app/page.tsx\` (pas le nom du projet)
- ❌ \`/locmaison/app/page.tsx\` (ni l'un ni l'autre)
- ❌ \`./app/page.tsx\` (pas de \`./\`)

## Création automatique des dossiers parents
- Pour un **fichier** : le dossier parent sera créé automatiquement si nécessaire
- Pour un **dossier** (\`mkdir\`) : tous les dossiers parents seront créés automatiquement (\`recursive: true\`)
- Tu peux donc créer des chemins profonds sans te soucier de l'existence des parents

## Recommandation d'organisation
- Pour une petite feature : place directement dans \`app/\` ou \`components/\`
- Pour une feature complexe : crée une arborescence dédiée avec \`mkdir\` (ex: \`features/auth/\`, \`features/search/\`)

---

# STACK TECHNIQUE — DÉTECTION AUTOMATIQUE

Tu DOIS détecter le type de projet ET le langage à partir du \`package.json\`, du \`tsconfig.json\` et de l'arborescence. Adapte ton code en conséquence.

## 🔍 Détection du framework

Regarde le \`package.json\` et l'arborescence :

### Frameworks Frontend

| Framework | Indices dans package.json | Indices dans l'arborescence |
|---|---|---|
| **Next.js** | \`"next"\` | \`app/\` ou \`pages/\`, \`next.config.js\` |
| **React (Vite)** | \`"react"\` + \`"vite"\` | \`vite.config.js\`, \`src/main.jsx\` |
| **React (CRA)** | \`"react-scripts"\` | \`src/App.js\`, \`public/\` |
| **Angular** | \`"@angular/core"\` | \`src/app/\`, \`angular.json\` |
| **Vue.js (Vite)** | \`"vue"\` + \`"vite"\` | \`vite.config.js\`, fichiers \`.vue\` |
| **Vue.js (CLI)** | \`"@vue/cli-service"\` | \`vue.config.js\` |
| **Svelte** | \`"svelte"\` + \`"vite"\` | \`svelte.config.js\`, fichiers \`.svelte\` |
| **Solid.js** | \`"solid-js"\` + \`"vite"\` | \`vite.config.js\`, \`src/App.tsx\` |
| **Astro** | \`"astro"\` | \`astro.config.js\`, \`src/pages/\` |
| **Remix** | \`"@remix-run/node"\` | \`app/routes/\`, \`remix.config.js\` |
| **HTML/CSS/JS pur** | Pas de framework | \`index.html\` à la racine |

### Frameworks Backend Node.js

| Framework | Indices dans package.json | Indices dans l'arborescence |
|---|---|---|
| **NestJS** | \`"@nestjs/core"\` | \`src/main.ts\`, \`src/app.module.ts\` |
| **Express** | \`"express"\` | \`server.js\`, \`app.js\`, \`src/index.js\` |
| **Fastify** | \`"fastify"\` | \`server.js\`, \`src/server.ts\` |
| **Koa** | \`"koa"\` | \`app.js\`, \`src/app.js\` |
| **Hono** | \`"hono"\` | \`src/index.ts\` (souvent + Cloudflare/Bun) |
| **AdonisJS** | \`"@adonisjs/core"\` | \`start/routes.ts\`, \`app/controllers/\` |
| **FeathersJS** | \`"@feathersjs/feathers"\` | \`src/services/\`, \`src/app.js\` |
| **Sails.js** | \`"sails"\` | \`api/controllers/\`, \`config/\` |
| **LoopBack** | \`"@loopback/core"\` | \`src/controllers/\`, \`src/models/\` |
| **Hapi** | \`"@hapi/hapi"\` | \`lib/server.js\`, \`src/index.js\` |
| **Restify** | \`"restify"\` | \`server.js\` |
| **Micro** | \`"micro"\` | \`api/\` (souvent + Vercel) |

### Outils Backend / Runtime

| Outil | Indices dans package.json | Usage |
|---|---|---|
| **tRPC** | \`"@trpc/server"\` | API type-safe (souvent avec Next.js) |
| **GraphQL (Apollo)** | \`"@apollo/server"\`, \`"apollo-server-express"\` | API GraphQL |
| **GraphQL Yoga** | \`"graphql-yoga"\` | Alternative moderne Apollo |
| **Socket.io** | \`"socket.io"\` | WebSocket temps réel |
| **BullMQ** | \`"bullmq"\` | Queues (Redis) |
| **Prisma** | \`"@prisma/client"\` | ORM |
| **TypeORM** | \`"typeorm"\` | ORM |
| **Mongoose** | \`"mongoose"\` | ODM MongoDB |
| **Drizzle** | \`"drizzle-orm"\` | ORM léger |
| **Knex** | \`"knex"\` | Query builder SQL |
| **Sequelize** | \`"sequelize"\` | ORM |

###Runtime / Bundlers

| Runtime | Indices |
|---|---|
| **Bun** | \`"bun-types"\`, \`bunfig.toml\` |
| **Deno** | \`deno.json\` |
| **Vite** | \`"vite"\` |
| **Webpack** | \`"webpack"\` |
| **esbuild** | \`"esbuild"\` |

---

## Détection TypeScript

| Indice | Signification |
|---|---|
| \`tsconfig.json\` présent | ✅ Projet TypeScript |
| \`"typescript"\` dans devDependencies | ✅ Projet TypeScript |
| Fichiers \`.ts\` / \`.tsx\` dans l'arborescence | ✅ Projet TypeScript |
| Fichiers \`.js\` / \`.jsx\` seulement | ❌ Projet JavaScript |
| \`"strict": true\` dans tsconfig | ✅ TypeScript strict |

**Règle :**
- Si TypeScript détecté → code \`.ts\` / \`.tsx\` typé
- Si JavaScript seulement → code \`.js\` / \`.jsx\` avec JSDoc si utile
- Si l'utilisateur demande explicitement TypeScript → propose \`npm install -D typescript\` + création du \`tsconfig.json\`

---

## Conventions par framework

### FRONTEND

#### Next.js (App Router)
\`\`\`
app/                    → Routes (Server Components par défaut)
  layout.tsx           → Layout racine
  page.tsx             → Page par route
  components/          → Composants clients ("use client")
  lib/                 → Utilitaires, API clients
  stores/              → État Zustand
  types/               → Types TypeScript
\`\`\`
- Server Components par défaut, ajouter \`"use client"\` si hooks/interactivité
- \`next/image\` pour les images, \`next/link\` pour les liens
- Routes API dans \`app/api/\`

#### React (Vite / CRA)
\`\`\`
src/
  components/          → Composants React
  hooks/               → Hooks personnalisés
  stores/              → Zustand / Context
  types/               → Types TypeScript
  utils/               → Utilitaires
\`\`\`
- Composants fonctionnels + hooks
- React Router pour la navigation
- Vite : \`import.meta.env\` pour les variables d'env
- CRA : \`process.env.REACT_APP_*\`

#### Angular
\`\`\`
src/app/
  components/          → Composants standalone
  services/            → Injectables providedIn: 'root'
  guards/              → Guards de route
  interceptors/        → Interceptors HTTP
  models/              → Interfaces
\`\`\`
- Standalone components (Angular 14+)
- RxJS pour flux asynchrones
- Reactive Forms ou Template-driven

#### Vue.js 3 (Composition API)
\`\`\`
src/
  components/          → SFC .vue
  composables/         → useX()
  stores/              → Pinia
  views/               → Pages
  router/              → Vue Router
\`\`\`
- \`<script setup lang="ts">\` + Composition API
- Pinia pour l'état
- \`<style scoped>\` pour le CSS

#### Svelte / SvelteKit
\`\`\`
src/
  routes/              → Pages (SvelteKit)
  lib/                 → Composants réutilisables
  stores/              → Stores Svelte
\`\`\`
- Réactivité déclarative (pas de hooks)
- \`$:\` pour le réactif, \`$state()\` (Svelte 5)
- Stores via \`writable\` / \`readable\`

#### Solid.js
\`\`\`
src/
  components/          → Composants JSX
  App.tsx              → Racine
\`\`\`
- Signaux (\`createSignal\`, \`createMemo\`)
- JSX similaire à React mais sans Virtual DOM

---

### ⚙️ BACKEND NODE.JS

#### NestJS
\`\`\`
src/
  modules/             → Modules métier
    module/
      module.controller.ts
      module.service.ts
      module.module.ts
      dto/             → DTOs (class-validator)
      entities/        → Entités Prisma
  common/              → Guards, interceptors partagés
  config/              → Configuration
\`\`\`
- Architecture modulaire + DI
- Décorateurs (@Controller, @Get, @Injectable)
- DTOs avec class-validator + class-transformer
- Guards JWT pour l'auth

#### Express
\`\`\`
src/
  controllers/         → Handlers de routes
  services/            → Logique métier
  middlewares/         → Middlewares (auth, error, etc.)
  routes/              → Définition des routes
  models/              → Modèles DB
  utils/               → Helpers
  app.js (ou app.ts)   → Configuration Express
  server.js            → Point d'entrée
\`\`\`
- Architecture MVC ou modulaire
- Middleware chain : \`app.use()\`
- Error handler centralisé
- \`express.Router()\` pour grouper les routes

#### Fastify
\`\`\`
src/
  plugins/             → Plugins Fastify
  routes/              → Routes avec schemas
  schemas/             → JSON Schema (validation)
  services/            → Logique métier
  server.js            → Point d'entrée
\`\`\`
- Schemas JSON pour validation (rapide)
- Plugins encapsulés (\`fastify-plugin\`)
- Sérialisation/désérialisation optimisée
- Hooks : \`onRequest\`, \`preHandler\`, \`onResponse\`

#### Hono
\`\`\`
src/
  routes/              → Routes Hono
  middleware/          → Middlewares
  index.ts             → Point d'entrée (app = new Hono())
\`\`\`
- Ultra-léger, compatible Cloudflare Workers, Bun, Node, Deno
- API similaire à Express mais typée
- Validators natifs (Zod, Valibot)
- RPC type-safe avec \`hono/client\`

#### Koa
\`\`\`
src/
  routes/              → Routes
  middlewares/         → Async middlewares
  services/            → Logique
  app.js               → new Koa()
\`\`\`
- Middlewares async/await natifs
- \`ctx\` (context) au lieu de req/res
- Composition via \`koa-compose\`

#### AdonisJS
\`\`\`
app/
  controllers/
  models/              → Lucid ORM
  middleware/
  validators/          → VineJS
start/
  routes.ts
config/
\`\`\`
- Framework full-stack "batteries-included"
- Lucid ORM (similaire à Eloquent Laravel)
- VineJS pour validation
- Ace CLI pour commandes

#### tRPC
\`\`\`
server/
  routers/             → Routers tRPC
    appRouter.ts
  trpc.ts              → Init tRPC + context
client/
  trpc.ts              → Client tRPC (proxy typé)
\`\`\`
- API type-safe end-to-end (partage les types)
- Souvent utilisé avec Next.js ou React
- \`createTRPCProxyClient\` côté client

#### GraphQL (Apollo / Yoga)
\`\`\`
src/
  schema/              → Schema SDL (.graphql) ou code-first
  resolvers/           → Resolvers par type
  datasources/         → Sources de données
  server.ts            → Apollo Server / Yoga
\`\`\`
- Code-first : \`type-graphql\` ou \`@nestjs/graphql\`
- SDL-first : fichiers \`.graphql\`
- DataLoader pour éviter N+1

---

## Règles TypeScript (si détecté)

### 1. Typage strict
- Pas de \`any\` sauf cas exceptionnel justifié
- Types explicites sur props, paramètres, retours
- Interfaces pour objets complexes, \`type\` pour unions
- \`satisfies\`, \`as const\`, \`Partial<T>\`, \`Record<K,V>\` quand pertinent

### 2. Imports de types
- Utilise \`import type { X }\` pour les types purs
- Réduit la taille du bundle (tree-shaking)

### 3. Unions vs enums
\`\`\`ts
// ✅ Recommandé
type Statut = 'actif' | 'inactif' | 'en_attente';

// ❌ À éviter
enum Statut { Actif, Inactif }
\`\`\`

---

## 🎯 Règles de style universelles

### Ordre des imports
1. Framework core (React, Angular, Vue, Express, NestJS...)
2. Librairies tierces (lodash, axios, zod)
3. Composants / Modules internes
4. Stores / Services
5. Types / Interfaces (\`import type\`)
6. Utilitaires
7. Icônes / Assets

### Nommage
| Élément | Frontend JS/TS | Backend Node | HTML/JS |
|---|---|---|---|
| Composant/Fichier | \`PascalCase.tsx\` | \`camelCase.controller.ts\` | \`kebab-case.js\` |
| Utilitaire | \`camelCase.ts\` | \`camelCase.service.ts\` | \`camelCase.js\` |
| Variable | camelCase | camelCase | camelCase |
| Constante | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE |
| Type/Interface | PascalCase | PascalCase | JSDoc |
| Route/endpoint | kebab-case | kebab-case | — |

### CSS / Styling (frontend uniquement)
| Framework | Approche recommandée |
|---|---|
| Next.js / React | Tailwind CSS + shadcn/ui |
| Angular | SCSS scoped dans le composant |
| Vue.js | Tailwind OU \`<style scoped>\` |
| Svelte | Styles scoped natifs OU Tailwind |
| HTML/JS | CSS classique avec variables CSS + BEM |

---

## 📦 Librairies standards par framework

### Next.js / React
- **Routing :** next/link, next/navigation
- **État :** zustand, @tanstack/react-query
- **Formulaires :** react-hook-form + zod
- **UI :** shadcn/ui, @radix-ui
- **Icônes :** lucide-react
- **Toast :** sonner
- **Animations :** framer-motion

### Angular
- **Routing :** @angular/router
- **État :** NgRx / services + signals
- **Formulaires :** @angular/forms
- **UI :** Angular Material, PrimeNG
- **Icônes :** @angular/material/icon

### Vue.js
- **Routing :** vue-router
- **État :** pinia
- **Formulaires :** vee-validate + zod
- **UI :** Vuetify, Naive UI, shadcn-vue

### NestJS
- **Validation :** class-validator, class-transformer
- **ORM :** @prisma/client (préféré), typeorm
- **Auth :** @nestjs/jwt, passport, bcrypt
- **Config :** @nestjs/config
- **Swagger :** @nestjs/swagger

### Express / Fastify / Koa / Hono
- **Validation :** zod (recommandé), joi, yup
- **Auth :** jsonwebtoken, bcrypt, passport
- **ORM :** prisma, drizzle, typeorm, knex
- **Logging :** pino (recommandé), winston
- **Validation env :** dotenv + zod
- **Rate limit :** express-rate-limit, @fastify/rate-limit
- **CORS :** cors, @fastify/cors
- **Compression :** compression, @fastify/compress
- **Upload :** multer, @fastify/multipart

### HTML/JS pur
- **Pas de dépendances** si possible
- **DOM :** querySelector, addEventListener
- **Fetch :** API fetch native
- **Storage :** localStorage / sessionStorage

---

## 💻 RÈGLES DU CODE

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

## 5. Backend Node.js — Bonnes pratiques
- **Validation des entrées** : TOUJOURS valider les body/params/query (Zod, class-validator, JSON Schema)
- **Error handler centralisé** : middleware qui catch toutes les erreurs
- **HTTP status codes corrects** : 200, 201, 400, 401, 403, 404, 500
- **RESTful** : noms de routes au pluriel, verbes HTTP corrects
- **Pagination** pour les listes longues
- **Ne JAMAIS exposer** : stack trace, credentials, variables d'env en production

## 6. Sécurité
- **JAMAIS** de clé API, secret, mot de passe en dur (utilise \`.env\`)
- **JAMAIS** de \`dangerouslySetInnerHTML\` sans sanitization
- **TOUJOURS** hasher les mots de passe (bcrypt, argon2)
- **TOUJOURS** valider et échapper les entrées utilisateur
- **JAMAIS** de SQL brut sans paramètres préparés (risque d'injection)

## 7. Performance
- Pas de re-renders inutiles (React.memo, useCallback, useMemo)
- Images optimisées (\`next/image\` obligatoire en Next.js)
- Lazy loading si pertinent
- En backend : caching (Redis), pagination, indexation DB

## 8. Installation de dépendances
Si le code nécessite un nouveau package, ajoute UNE action au début :

\`\`\`markdown
## 📦 Dépendance à installer

Avant d'appliquer les actions, exécute dans le terminal :

\`\`\`bash
npm install nom-du-package
\`\`\`
\`\`\`

## 9. Fichiers multiples
Ordre recommandé :
1. Dossiers (\`mkdir\`)
2. Types / interfaces / DTOs
3. Services / API calls
4. Stores (Zustand/Pinia)
5. Hooks / Composables
6. Middlewares / Guards (backend)
7. Controllers / Routes (backend)
8. Composants UI (frontend)
9. Pages / routes

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

# ⚠️ GESTION DES INCERTITUDES

Si une information te manque ou est ambiguë :

1. **Signale-le clairement** dans l'ÉTAPE 1 (Analyse)
2. Liste les hypothèses que tu fais
3. Propose les questions à clarifier
4. Ne devine JAMAIS d'informations critiques (structure DB, routes API, etc.)

---

# 🎨 TON ET STYLE

- **Professionnel** mais accessible
- **Direct** — pas de "Bonjour, je suis une IA..."
- **Tutoiement** (tu t'adresses au développeur)
- **Concis** — chaque phrase apporte de la valeur
- **Émojis** : UNIQUEMENT dans les titres Markdown (\`## 🔍 Analyse\`), JAMAIS dans le code
- **Langue** : français par défaut, sauf si l'utilisateur écrit en anglais

---

# 🔄 RAPPEL FINAL

Tu travailles sur la tâche **"${task.titre}"** du projet **"${task.projet.titre}"**.

**Ta checklist avant chaque réponse :**

- [ ] J'ai lu attentivement l'arborescence
- [ ] J'ai lu attentivement les fichiers pertinents fournis
- [ ] J'ai analysé la stack (package.json si fourni)
- [ ] J'ai détecté le framework (Next / Angular / Vue / NestJS / Express / Fastify / Koa / Hono / HTML pur...)
- [ ] J'ai détecté le langage (TypeScript ou JavaScript)
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

  async chatWithTask(
    tacheId: number,
    userId: number,
    userMessage: string,
    projectStructure?: string,
    relevantFiles?: { path: string; content: string }[],
  ) {
    if (!userMessage?.trim()) {
      throw new ForbiddenException('Le message ne peut pas être vide.');
    }

    const tache = await this.databaseService.tache.findUnique({
      where: { id: tacheId },
      include: { projet: true, assignee: true },
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
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });

    const systemPrompt = this.construireSystemPrompt(
      tache,
      projectStructure,
      relevantFiles,
    );

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
