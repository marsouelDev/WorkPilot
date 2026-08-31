import { Injectable, Logger } from '@nestjs/common';

export interface TacheGeneree {
  titre: string;
  descriptionGeneree: string;
  competences: string[];
  complexite: 'faible' | 'moyenne' | 'élevée';
}

interface ProviderConfig {
  nom: string;
  url: string;
  modeles: string[];
  key: string | undefined;
  headersSupp?: Record<string, string>;
}

const MAX_TOKENS = {
  cahierDesCharges: 16000,
  taches: 10000,
} as const;

/* ==========================================================
   10 SECTIONS OBLIGATOIRES — Toujours générées
========================================================== */
const SECTIONS_CDC = [
  'Présentation du projet',
  'Contexte du projet',
  'Acteurs (Utilisateurs)',
  'Objectifs principaux',
  'Besoins fonctionnels',
  'Besoins non fonctionnels',
  'Interfaces utilisateur',
  'Contraintes techniques',
  'Critères de succès',
  'Matrice Acteurs-Interfaces',
] as const;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly modelesGroq = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
    'openai/gpt-oss-20b',
    'qwen/qwen3-32b',
  ];

  private readonly modelesMistral = [
    'mistral-large-latest',
    'mistral-small-latest',
    'codestral-latest',
    'open-mistral-nemo',
  ];

  private readonly modelesOpenRouter = [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'cohere/north-mini-code:free',
    'qwen/qwen-2.5-72b-instruct:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-12b-it:free',
    'openrouter/free',
  ];

  /* ==========================================================
     GÉNÉRATION DU CAHIER DES CHARGES — 10 sections systématiques
  ========================================================== */
  async genererCahierDesCharges(
    titre: string,
    description: string,
  ): Promise<string> {
    this.logger.log(
      `🎯 Génération CDC complet : 10 sections, ~5000 mots cibles`,
    );

    const systemPrompt = this.construireSystemPromptCDC();
    const userPrompt = `# PROJET À DOCUMENTER

## Titre
${titre}

## Description
${description}

# INSTRUCTION
Rédige maintenant le cahier des charges COMPLET avec EXACTEMENT les 10 sections demandées, avec la profondeur maximale (~5000 mots minimum).

Commence directement par "## 1. Présentation du projet".`;

    const debut = Date.now();
    const cahier = await this.appelerIA(
      systemPrompt,
      userPrompt,
      MAX_TOKENS.cahierDesCharges,
      0.7,
    );
    const duree = Date.now() - debut;

    this.logger.log(
      `✅ CDC généré en ${duree}ms (~${Math.ceil(cahier.length / 3)} tokens, ${cahier.length} caractères)`,
    );
    return cahier;
  }

  /* ==========================================================
     SYSTEM PROMPT — Toujours 10 sections
  ========================================================== */
  private construireSystemPromptCDC(): string {
    const sectionsMarkdown = SECTIONS_CDC.map((s, i) => {
      const guide = this.getGuideSection(s);
      return `## ${i + 1}. ${s}\n${guide}`;
    }).join('\n\n');

    return `# RÔLE
Tu es un **chef de projet technique senior** avec 15 ans d'expérience en rédaction de cahiers des charges professionnels.

# CONTEXTE
Le projet à documenter est de **complexité ÉLEVÉE** (enterprise).
Longueur cible : **~5000 mots minimum**.
Nombre de sections : **10 sections obligatoires**.

# PROFONDEUR — PROJET COMPLEXE
- Documentation exhaustive type enterprise
- Chaque section : 400-800 mots
- Sous-sections détaillées si pertinent
- Cas d'usage multiples et scénarios edge
- Spécifications techniques complètes avec alternatives considérées
- Exemples concrets et précis

# STRUCTURE OBLIGATOIRE — 10 SECTIONS

${sectionsMarkdown}

# QUALITÉ ATTENDUE

## Ton et style
- **Professionnel** : vocabulaire technique précis
- **Direct** : pas de phrases creuses ou de remplissage
- **Actionnable** : un développeur peut implémenter sans questions supplémentaires
- **Français** : terminologie technique française privilégiée

## Structure
- Commence directement par "## 1. Présentation du projet"
- Pas de préambule ("Voici le cahier des charges...")
- Pas de formule de politesse à la fin
- Termine naturellement avec la section 10

## Contenu
- Chaque section doit apporter de la valeur
- Pas de répétition entre sections
- Exemples concrets plutôt que généralités
- Chaque section DOIT être développée en profondeur

# RÈGLES ABSOLUES
- ✅ Réponds UNIQUEMENT avec le texte Markdown du cahier des charges
- ❌ AUCUN préambule, AUCUN commentaire hors document
- ❌ AUCUNE balise de code autour du Markdown
- ❌ AUCUNE mention de "en tant qu'IA"
- ✅ Commence directement par la section 1
- ✅ Respecte la longueur cible (~5000 mots minimum)
- ✅ Les 10 sections sont OBLIGATOIRES, aucune ne peut être omise`;
  }

  /* ==========================================================
     GUIDES PAR SECTION — Détails exhaustifs
  ========================================================== */
  private getGuideSection(nomSection: string): string {
    const guides: Record<string, string> = {
      'Présentation du projet': `Résumé exécutif en 3-4 paragraphes :
- **Paragraphe 1** : Qu'est-ce que le projet ? (nature, type d'application, périmètre global)
- **Paragraphe 2** : À qui s'adresse-t-il ? (public cible, utilisateurs finaux, personas)
- **Paragraphe 3** : Quelle valeur apporte-t-il ? (bénéfices principaux, ROI attendu)
- **Paragraphe 4** : En quoi est-il innovant ou différenciant ? (avantage concurrentiel)

**Contraintes** :
- Évite les généralités vagues ("révolutionner", "disruptif")
- Utilise des chiffres et données concrètes si possible
- 300-500 mots pour cette section`,

      'Contexte du projet': `Développement détaillé du contexte :
- **Problématique** : quel problème concret ce projet résout-il ? (avec exemples)
- **Situation actuelle** : comment font les utilisateurs sans ce système ? (workflow actuel)
- **Limites de l'existant** : frustrations, coûts, inefficacités (chiffrées si possible)
- **Opportunité** : pourquoi lancer ce projet maintenant ? (timing marché, tech)
- **Alignement stratégique** : comment ce projet s'inscrit dans une vision plus large

**Format** : 400-600 mots avec exemples concrets`,

      'Acteurs (Utilisateurs)': `Pour CHAQUE type d'utilisateur, fournis une fiche détaillée :

### Administrateur système
- **Rôle** : supervision globale, gestion comptes, configuration système
- **Permissions** : CRUD complet sur toutes entités, accès logs, gestion rôles
- **Actions principales** : créer/supprimer utilisateurs, configurer paramètres, stats
- **Interactions** : avec tous les autres acteurs
- **Profil type** : responsable IT, CTO

### Chef de projet
- **Rôle** : pilotage projets, découpage tâches, validation livrables
- **Permissions** : créer projets, définir tâches, assigner développeurs, valider PR
- **Actions principales** : rédiger CDC, générer tâches, suivre avancement
- **Interactions** : développeurs, relecteurs, administrateurs
- **Profil type** : Product Owner, Tech Lead

### Développeur
- **Rôle** : implémentation technique des tâches, soumission PR
- **Permissions** : voir ses tâches, modifier code, créer PR
- **Actions principales** : sélectionner tâche, générer code IA, soumettre PR
- **Interactions** : chefs de projet, relecteurs
- **Profil type** : développeur fullstack

### Relecteur technique
- **Rôle** : revue code, validation qualité, approbation PR
- **Permissions** : voir PR, commenter code, approuver/rejeter
- **Actions principales** : analyser PR, laisser commentaires, valider merge
- **Interactions** : développeurs, chefs de projet
- **Profil type** : senior développeur, architecte

**Format** : 500-700 mots avec fiches détaillées`,

      'Objectifs principaux': `Liste numérotée de **8-12 objectifs SMART** :
- **Spécifiques** : précis et sans ambiguïté
- **Mesurables** : avec indicateurs quantifiables
- **Atteignables** : réalistes dans le cadre du projet
- **Relevants** : alignés avec la vision globale
- **Temporellement définis** : avec jalons

**Exemples** :
- "Permettre la génération automatique de code avec taux de réussite > 80%"
- "Réduire le temps de développement par tâche de 40% en 6 mois"
- "Atteindre 100 utilisateurs actifs quotidiens après 3 mois"

**Format** : 200-300 mots avec 8-12 objectifs numérotés`,

      'Besoins fonctionnels': `Organise les fonctionnalités par **domaine fonctionnel** :

### Domaine : Gestion des projets
- F1.1 : Création de projet avec titre, description, équipe
- F1.2 : Modification des informations du projet
- F1.3 : Archivage/suppression de projet
- F1.4 : Génération automatique du cahier des charges à partir d'une description
- F1.5 : Découpage automatique du cahier des charges en tâches
- [ajoute 3-5 fonctionnalités supplémentaires]

### Domaine : Gestion des tâches
- F2.1 : Création manuelle de tâche
- F2.2 : Attribution de tâche à un développeur
- F2.3 : Suivi du statut (à faire, en cours, review, terminé)
- F2.4 : Priorisation et estimation de complexité
- [ajoute 3-5 fonctionnalités supplémentaires]

### Domaine : Génération de code IA
- F3.1 : Analyse du contexte projet (arborescence, fichiers existants)
- F3.2 : Génération de code avec respect des conventions
- F3.3 : Application directe des fichiers générés
- F3.4 : Support multimodal (texte + captures d'écran)
- [ajoute 3-5 fonctionnalités supplémentaires]

### Domaine : Pull Requests et revue
- F4.1 : Création automatique de PR depuis le code généré
- F4.2 : Review de code avec commentaires
- F4.3 : Workflow d'approbation
- F4.4 : Merge automatique après validation
- [ajoute 2-4 fonctionnalités supplémentaires]

### Domaine : Administration
- F5.1 : Gestion des utilisateurs et rôles
- F5.2 : Configuration des providers IA
- F5.3 : Tableau de bord avec statistiques
- F5.4 : Logs d'audit
- [ajoute 2-4 fonctionnalités supplémentaires]

**Format** : 600-900 mots avec 20-30 fonctionnalités détaillées`,

      'Besoins non fonctionnels': `Développe chaque catégorie en détail :

### Performance
- Temps de réponse < 2s pour les opérations courantes
- Génération CDC < 30s, génération tâches < 20s
- Support de 100 utilisateurs simultanés
- Temps de chargement page < 1.5s
- Requêtes API < 500ms (p95)

### Sécurité
- Authentification JWT avec refresh tokens
- Hashage des mots de passe (bcrypt, 12 rounds minimum)
- Protection CSRF, XSS, SQL injection
- Isolation des données entre projets
- Chiffrement des données sensibles au repos
- Rate limiting sur les API publiques
- Audit trail complet

### Scalabilité
- Architecture modulaire permettant l'ajout de nouveaux providers IA
- Support de bases de données relationnelles (PostgreSQL)
- Capacité à gérer 1000+ projets simultanés
- Stockage fichiers scalable (Cloudinary, S3)
- Horizontal scaling si nécessaire

### Ergonomie
- Interface responsive (desktop, tablette, mobile)
- Navigation intuitive avec 3 clics max pour toute action
- Dark mode par défaut
- Accessibilité WCAG 2.1 niveau AA
- Feedback visuel immédiat pour toute action

### Disponibilité
- Uptime cible : 99.5%
- Plan de reprise d'activité (PRA)
- Backups quotidiens avec rétention 30 jours
- Monitoring avec alertes (Sentry, Uptime Robot)

### Maintenabilité
- Code documenté (JSDoc, commentaires)
- Tests unitaires et d'intégration (couverture > 70%)
- CI/CD automatisé
- Logs structurés (JSON) pour debug

**Format** : 500-700 mots avec métriques précises`,

      'Interfaces utilisateur': `Pour CHAQUE écran principal, fournis une fiche détaillée :

### Dashboard
- **Objectif** : Vue d'ensemble des projets et tâches assignées
- **Éléments** :
  - Liste des projets actifs avec avancement (%)
  - Tâches en attente de traitement
  - PR en attente de review
  - Statistiques personnelles (tâches terminées, temps moyen)
  - Notifications récentes
- **Actions** : créer projet, accéder à tâche, ouvrir PR
- **Interactions** : clic projet → détail projet, clic tâche → détail tâche

### Page Création projet
- **Objectif** : Initialiser un nouveau projet
- **Éléments** :
  - Formulaire : titre, description sommaire, équipe (sélection multiple)
  - Générateur IA de cahier des charges (bouton "Générer CDC")
  - Prévisualisation du CDC généré (Markdown render)
  - Édition manuelle du CDC
  - Bouton "Générer les tâches"
- **Actions** : sauvegarder brouillon, générer CDC, valider et créer
- **Interactions** : après validation → redirection vers liste tâches

### Page Liste des tâches (Kanban)
- **Objectif** : Vue Kanban des tâches du projet
- **Éléments** :
  - Colonnes : À faire / En cours / Review / Terminé
  - Cartes tâche (titre, assigné, complexité, deadline)
  - Filtres (par assigné, complexité, statut)
  - Bouton "Ajouter tâche manuelle"
- **Actions** : drag & drop entre colonnes, clic → détail tâche
- **Interactions** : changement statut → notification assigné

### Page Détail tâche + Chat IA
- **Objectif** : Interface principale de travail du développeur
- **Éléments** :
  - Informations tâche (titre, description, deadline, compétences)
  - Panneau chat IA avec historique
  - Zone upload images (captures d'écran)
  - Liste des fichiers générés avec boutons "Appliquer"
  - Bouton "Créer PR"
- **Actions** : envoyer message IA, appliquer code, créer PR
- **Interactions** : code appliqué → preview dans WebContainer

### Page Pull Request
- **Objectif** : Review et validation du code
- **Éléments** :
  - Diff de code (avant/après)
  - Commentaires ligne par ligne
  - Boutons : Approuver / Demander modifications / Rejeter
  - Historique des reviews
- **Actions** : commenter, approuver, merger
- **Interactions** : approbation → notification développeur

### Page Administration
- **Objectif** : Configuration système
- **Éléments** :
  - Liste utilisateurs avec rôles
  - Configuration providers IA (clés API)
  - Statistiques globales (requêtes IA, temps moyen)
  - Logs d'audit
- **Actions** : créer utilisateur, modifier rôles, voir logs
- **Interactions** : modification rôle → notification utilisateur

**Format** : 600-900 mots avec fiches détaillées`,

      'Contraintes techniques': `Développe chaque catégorie :

### Stack technologique imposée
- **Frontend** : Next.js 15+ (App Router), TypeScript strict, Tailwind CSS
- **Backend** : NestJS, Prisma ORM, PostgreSQL
- **IA** : Multi-provider (Gemini, Mistral, Groq, OpenRouter) avec fallback automatique
- **Upload** : Cloudinary (images), WebContainer (code généré)
- **Auth** : JWT avec refresh tokens (httpOnly cookies)
- **Tests** : Jest (unitaires), Playwright (E2E)

### Environnement
- Node.js 20 LTS minimum
- PostgreSQL 15+
- Déploiement : Vercel (frontend) + Railway/Render (backend)
- CI/CD : GitHub Actions
- Monitoring : Sentry, Uptime Robot

### Contraintes de développement
- Pas de dépendances non maintenues (dernière maj < 1 an)
- Code review obligatoire avant merge
- Conventional Commits pour l'historique Git
- Pas de \`any\` TypeScript (strict mode)
- Pas de \`console.log\` en production (logger structuré)
- Couverture de tests > 70%

### Délais et budget
- **Phase 1 (MVP)** : 3 mois — fonctionnalités core (projets, tâches, chat IA)
- **Phase 2** : 2 mois — PR, review, administration
- **Phase 3** : 1 mois — optimisations, monitoring, documentation
- **Budget estimé** : 2 développeurs full-time + 1 PO
- **Coût infra** : ~200€/mois en production

### Normes et conformité
- RGPD pour les données utilisateurs
- OWASP Top 10 pour la sécurité
- Standards WCAG 2.1 pour l'accessibilité
- Documentation technique (README, API docs Swagger)
- Licences open source compatibles (MIT, Apache 2.0)

**Format** : 500-700 mots avec détails techniques`,

      'Critères de succès': `Liste de **8-10 KPIs** pour mesurer la réussite :

### Adoption
- 80% des développeurs utilisent l'IA quotidiennement après 1 mois
- Taux d'adoption > 90% après 3 mois
- NPS (Net Promoter Score) > 40

### Efficacité
- Réduction de 40% du temps de développement par tâche
- 70% du code généré utilisé sans modification majeure
- Temps moyen de review PR réduit de 50%
- Nombre de tâches terminées par sprint augmenté de 30%

### Qualité
- Taux de bugs en production < 1 par 1000 lignes de code
- Satisfaction utilisateur > 4/5 (enquête trimestrielle)
- Taux de complétion des projets > 85%
- Dette technique maintenue sous contrôle

### Performance technique
- Uptime > 99.5% sur 12 mois
- Temps de réponse API < 500ms (p95)
- Coût IA par tâche < 0.10€
- Scalabilité validée jusqu'à 1000 utilisateurs simultanés

### Business
- ROI positif après 6 mois d'utilisation
- Réduction des coûts de développement de 30%
- Augmentation de la vélocité de l'équipe de 25%
- Satisfaction client améliorée (délais respectés)

**Format** : 300-400 mots avec KPIs chiffrés`,

      'Matrice Acteurs-Interfaces': `Développe les 3 sous-sections :

### 10.1 Matrice d'accès
Tableau Markdown avec toutes les interfaces et tous les rôles :

| Interface | Administrateur | Chef de projet | Développeur | Relecteur technique |
|-----------|----------------|----------------|-------------|---------------------|
| Dashboard | Vue globale | Vue projets gérés | Vue tâches assignées | Vue PR à review |
| Création projet | ✅ Complet | ✅ Complet | ❌ Lecture seule | ❌ Lecture seule |
| Liste tâches | ✅ Tous projets | ✅ Projets gérés | ✅ Tâches assignées | ❌ Non visible |
| Détail tâche + Chat IA | ✅ Lecture seule | ✅ Lecture seule | ✅ Complet (si assigné) | ❌ Non visible |
| Pull Request | ✅ Lecture + merge forcé | ✅ Approbation | ✅ Création | ✅ Review + approbation |
| Administration | ✅ Complet | ❌ Non visible | ❌ Non visible | ❌ Non visible |

### 10.2 Flux d'interaction principaux

#### Parcours du Chef de projet
1. Connexion → Dashboard
2. Clic "Créer projet" → formulaire
3. Rédige description → clic "Générer CDC"
4. IA génère cahier des charges → édition si nécessaire
5. Clic "Générer tâches" → IA crée 15-20 tâches
6. Assigne les tâches aux développeurs
7. Suit l'avancement sur Kanban
8. Valide les PR soumises

#### Parcours du Développeur
1. Connexion → Dashboard (voit tâches assignées)
2. Clic sur tâche → page détail
3. Lit description + consulte fichiers pertinents
4. Joint capture d'écran si besoin
5. Envoie message au chat IA
6. IA propose actions + code
7. Clic "Appliquer" sur chaque fichier
8. Teste dans WebContainer
9. Clic "Créer PR"
10. Reçoit notification de review

#### Parcours du Relecteur
1. Reçoit notification "PR à review"
2. Ouvre la PR depuis dashboard
3. Analyse le diff de code
4. Ajoute commentaires ligne par ligne
5. Approuve ou demande modifications
6. Si approuvé → merge automatique
7. Notification envoyée au développeur

#### Parcours de l'Administrateur
1. Connexion → Dashboard admin
2. Crée comptes utilisateurs + attribue rôles
3. Configure clés API providers IA
4. Consulte statistiques globales
5. Analyse logs en cas d'incident
6. Gère paramètres système

### 10.3 Règles d'accès spécifiques
- **Isolation projet** : un utilisateur ne voit que les projets auxquels il est assigné
- **Règle d'assignation** : une tâche = un développeur assigné (pas de multi-assignation)
- **Validation PR** : minimum 1 approbation requise (relecteur ou chef de projet)
- **Suppression projet** : seul l'administrateur peut supprimer (soft delete avec archivage)
- **Modification CDC** : possible uniquement par chef de projet tant qu'aucune tâche n'est "en cours"
- **Génération IA** : limitée à 50 requêtes/jour/utilisateur (configurable par admin)
- **Accès historique** : les messages IA sont conservés 90 jours puis archivés
- **Export données** : chaque utilisateur peut exporter ses propres données (RGPD)
- **Audit trail** : toutes les actions critiques sont loguées avec timestamp + user ID
- **Rate limiting** : protection contre les abus sur les endpoints sensibles

**Format** : 600-800 mots avec matrice complète et flux détaillés`,
    };

    return (
      guides[nomSection] ||
      'Développe cette section de manière professionnelle et complète (400-600 mots).'
    );
  }

  /* ==========================================================
     GÉNÉRATION DES TÂCHES (JSON)
  ========================================================== */
  async genererTaches(
    contenuCahierDesCharges: string,
  ): Promise<TacheGeneree[]> {
    const systemPrompt = this.construireSystemPromptTaches();
    const userPrompt = `# CAHIER DES CHARGES À DÉCOUPER

\`\`\`
${contenuCahierDesCharges.substring(0, 15000)}
\`\`\`

# INSTRUCTION
Découpe ce cahier des charges en 15-20 tâches de développement concrètes, bien dimensionnées (1-3 jours chacune) et directement actionnables.

Couvre tous les aspects : backend, frontend, IA, base de données, authentification, administration.

Réponds MAINTENANT avec UNIQUEMENT le tableau JSON, sans aucun autre texte.`;

    const debut = Date.now();
    const reponse = await this.appelerIA(
      systemPrompt,
      userPrompt,
      MAX_TOKENS.taches,
      0.2,
    );

    let taches = this.parserTaches(reponse);

    if (taches.length === 0) {
      this.logger.warn(
        'Première tentative échouée, retry avec prompt simplifié',
      );
      const reponseRetry = await this.genererTachesRetry(
        contenuCahierDesCharges,
      );
      taches = this.parserTaches(reponseRetry);
    }

    const duree = Date.now() - debut;
    this.logger.log(`✅ ${taches.length} tâches générées en ${duree}ms`);

    return taches;
  }

  private construireSystemPromptTaches(): string {
    return `# RÔLE
Tu es un **expert en gestion de projet agile** spécialisé dans le découpage technique de cahiers des charges en tâches de développement actionnables.

# OBJECTIF
Transformer un cahier des charges en un **tableau JSON de 15 à 20 tâches de développement** concrètes, bien dimensionnées et directement assignables à des développeurs.

# RÈGLES DE QUALITÉ DES TÂCHES

## Granularité
- **Taille idéale** : 1-3 jours de travail pour un développeur mid-level
- **Trop grosse** : "Développer tout le backend" → À découper
- **Trop petite** : "Créer une variable" → À regrouper
- **Bien dimensionnée** : "Implémenter l'endpoint POST /projects avec validation DTO"

## Indépendance
- Chaque tâche doit être **testable indépendamment** si possible
- Les dépendances entre tâches doivent être explicites dans la description
- Ordonne les tâches dans un ordre logique (infrastructure → features → intégration)

## Concret et actionnable
- ✅ "Créer le schema Prisma avec les tables User, Project, Task et leurs relations"
- ❌ "Définir la structure de données" (trop vague)

## Cohérence technique
- Respecte la stack mentionnée dans le cahier des charges
- N'invente PAS de technologies qui ne sont pas mentionnées

# FORMAT DE RÉPONSE OBLIGATOIRE

## Structure JSON stricte
[
  {
    "titre": "string (max 80 caractères, infinitif)",
    "descriptionGeneree": "string (6-10 phrases, 150-300 mots)",
    "competences": ["string", "string"],
    "complexite": "faible" | "moyenne" | "élevée"
  }
]

## Contraintes par champ

### titre
- **Format** : verbe à l'infinitif + objet précis
- **Longueur** : 30-80 caractères
- **Exemples valides** :
  - "Configurer l'authentification JWT avec refresh tokens"
  - "Implémenter le endpoint POST /tasks avec validation"

### descriptionGeneree
- **Longueur** : 6-10 phrases complètes (150-300 mots)
- **Structure recommandée** :
  1. **Quoi** : Que faut-il construire exactement ?
  2. **Comment** : Quelle approche technique adopter ?
  3. **Avec quoi** : Quels outils/librairies utiliser ?
  4. **Contraintes** : Quelles règles respecter ?
  5. **Livrables** : Quels fichiers/modules seront créés ?
  6. **Critères d'acceptation** : Comment valider ?

### competences
- **Format** : tableau de 3-6 strings
- **Niveau** : technologies/pratiques spécifiques
- **Exemples valides** :
  - ["nestjs", "typescript", "prisma", "postgresql"]
  - ["react", "nextjs", "tailwind", "zustand"]

### complexite
- **"faible"** : < 1 jour, pattern connu
- **"moyenne"** : 1-3 jours, nécessite réflexion
- **"élevée"** : 3-5 jours, architecture complexe

# EXEMPLES DE TÂCHES BIEN FORMÉES

## Exemple 1 (complexité : élevée)
{
  "titre": "Implémenter le système d'authentification JWT complet",
  "descriptionGeneree": "Développer un système d'authentification robuste avec JWT access tokens (15 min) et refresh tokens (7 jours) stockés en cookies httpOnly. Créer le module AuthModule NestJS avec les guards JwtAuthGuard et RefreshGuard. Implémenter les endpoints POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout. Hasher les mots de passe avec bcrypt (12 rounds). Gérer les erreurs avec des DTO de validation class-validator. Ajouter un rate limiting (5 tentatives/15min). Stocker les refresh tokens en base pour permettre la révocation.",
  "competences": ["nestjs", "jwt", "bcrypt", "typescript", "security"],
  "complexite": "élevée"
}

## Exemple 2 (complexité : moyenne)
{
  "titre": "Créer le composant React TaskKanban avec drag & drop",
  "descriptionGeneree": "Développer un composant React affichant les tâches sous forme de Kanban avec 4 colonnes. Utiliser @dnd-kit/core pour le drag & drop. Chaque carte affiche le titre, l'assigné, la complexité et la deadline. Au drop, appeler PATCH /tasks/:id pour mettre à jour le statut. Gérer l'état optimiste avec rollback si erreur. Afficher un skeleton loader pendant le chargement. Le composant doit être responsive.",
  "competences": ["react", "typescript", "dnd-kit", "zustand", "tailwind"],
  "complexite": "moyenne"
}

## Exemple 3 (complexité : faible)
{
  "titre": "Créer le DTO de validation CreateTaskDto",
  "descriptionGeneree": "Définir le DTO CreateTaskDto avec class-validator. Champs obligatoires : titre (string, 3-100 caractères), descriptionGeneree (string, 10-2000 caractères), projectId (number, entier positif). Champs optionnels : complexite (enum: faible/moyenne/élevée, défaut: moyenne), assigneeId (number). Ajouter des messages d'erreur en français personnalisés. Exporter depuis le barrel index.ts.",
  "competences": ["nestjs", "class-validator", "typescript", "dto"],
  "complexite": "faible"
}

# ANTI-PATTERNS À ÉVITER

## ❌ Tâches trop vagues
{"titre": "Faire le frontend", "descriptionGeneree": "Développer l'interface complète.", "competences": ["react"], "complexite": "élevée"}

## ❌ Description trop courte
{"titre": "Créer l'API", "descriptionGeneree": "Faire les endpoints REST.", "competences": ["nestjs"], "complexite": "moyenne"}

# RÈGLES ABSOLUES DE FORMAT

1. ✅ Réponds **UNIQUEMENT** avec le tableau JSON
2. ❌ **AUCUN** texte avant le premier \`[\`
3. ❌ **AUCUN** texte après le dernier \`]\`
4. ❌ **AUCUNE** balise markdown (\`\`\`json ou \`\`\`)
5. ❌ **AUCUN** commentaire dans le JSON
6. ✅ JSON valide parsable avec \`JSON.parse()\`
7. ✅ Entre **15 et 20 tâches** (pas moins, pas plus)
8. ✅ Toutes les tâches ont les **4 champs obligatoires**
9. ✅ Valeurs de complexité exactement : "faible", "moyenne" ou "élevée"
10. ✅ Tâches ordonnées logiquement (infra → features → intégration → tests)

# CHECKLIST FINALE

- [ ] Commence par \`[\` et termine par \`]\`
- [ ] Contient entre 15 et 20 objets
- [ ] Chaque objet a exactement 4 champs
- [ ] Tous les titres sont à l'infinitif et précis
- [ ] Toutes les descriptions font 150-300 mots
- [ ] Tous les tableaux competences ont 3-6 éléments
- [ ] Toutes les complexités sont valides
- [ ] Aucune faute de syntaxe JSON
- [ ] Les tâches couvrent l'ensemble du cahier des charges`;
  }

  private async genererTachesRetry(
    contenuCahierDesCharges: string,
  ): Promise<string> {
    const systemSimplifie = `Tu es un générateur JSON strict. Tu réponds UNIQUEMENT avec du JSON valide, sans aucun autre texte.

FORMAT OBLIGATOIRE (à respecter à la lettre) :
[
  {
    "titre": "Verbe infinitif + objet précis (30-80 caractères)",
    "descriptionGeneree": "6-10 phrases détaillant QUOI faire, COMMENT, AVEC QUOI, LIVRABLES (150-300 mots)",
    "competences": ["tech1", "tech2", "tech3"],
    "complexite": "faible"
  }
]

RÈGLES :
- 15 tâches minimum, 20 maximum
- complexite ∈ {"faible", "moyenne", "élevée"}
- competences : 4-8 éléments
- AUCUN texte avant [ ou après ]
- AUCUNE balise markdown`;

    const userSimplifie = `Génère 15 tâches de développement pour ce projet :

${contenuCahierDesCharges.substring(0, 15000)}

Réponds UNIQUEMENT avec le tableau JSON.`;

    return this.appelerIA(
      systemSimplifie,
      userSimplifie,
      MAX_TOKENS.taches,
      0.1,
    );
  }

  /* ==========================================================
     APPEL IA — Factorisé (Groq → Mistral → OpenRouter)
  ========================================================== */
  private async appelerIA(
    system: string,
    userMessage: string,
    maxTokens: number,
    temperature: number = 0.7,
  ): Promise<string> {
    const providers: ProviderConfig[] = [
      {
        nom: 'Groq',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        modeles: this.modelesGroq,
        key: process.env.GROQ_API_KEY,
      },
      {
        nom: 'Mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        modeles: this.modelesMistral,
        key: process.env.MISTRAL_API_KEY,
      },
      {
        nom: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        modeles: this.modelesOpenRouter,
        key: process.env.OPENROUTER_API_KEY,
        headersSupp: {
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
          'X-Title': 'WorkPilot',
        },
      },
    ];

    let derniereErreur: Error | null = null;

    for (const provider of providers) {
      if (!provider.key) {
        this.logger.warn(`${provider.nom} non configuré`);
        continue;
      }

      for (const modele of provider.modeles) {
        try {
          this.logger.debug(`Tentative ${provider.nom} avec ${modele}`);

          const headers: Record<string, string> = {
            Authorization: `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            ...(provider.headersSupp || {}),
          };

          const response = await fetch(provider.url, {
            method: 'POST',
            headers,
            signal: AbortSignal.timeout(120_000),
            body: JSON.stringify({
              model: modele,
              max_tokens: maxTokens,
              temperature,
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: userMessage },
              ],
            }),
          });

          if (
            response.status === 429 ||
            response.status === 404 ||
            response.status === 503
          ) {
            this.logger.warn(
              `${provider.nom} indisponible ${modele} (HTTP ${response.status})`,
            );
            continue;
          }

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
              `${provider.nom} HTTP ${response.status} : ${errorBody.substring(0, 200)}`,
            );
          }

          const data = await response.json();
          const texte = data?.choices?.[0]?.message?.content;

          if (!texte) {
            throw new Error(`Réponse ${provider.nom} vide`);
          }

          this.logger.log(`✅ Succès ${provider.nom} avec ${modele}`);
          return texte.trim();
        } catch (error) {
          derniereErreur =
            error instanceof Error ? error : new Error(String(error));
          this.logger.error(
            `Échec ${provider.nom} ${modele}: ${derniereErreur.message}`,
          );
        }
      }
    }

    throw new Error(
      `Tous les providers IA ont échoué. ${derniereErreur?.message || 'Aucune réponse'}`,
    );
  }

  /* ==========================================================
     PARSING JSON DES TÂCHES
  ========================================================== */
  private parserTaches(reponseBrute: string): TacheGeneree[] {
    this.logger.debug(
      `Parsing de ${reponseBrute.length} caractères — début: "${reponseBrute.substring(0, 100)}..."`,
    );

    const nettoye = reponseBrute
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    try {
      const parsed = JSON.parse(nettoye);
      if (Array.isArray(parsed)) {
        const tachesValides = this.validerTaches(parsed);
        if (tachesValides.length > 0) {
          this.logger.log(`${tachesValides.length} tâches (parse direct)`);
          return tachesValides;
        }
      }
    } catch {
      /* Parse direct échoué, on continue */
    }

    const tableaux = this.extraireTableaux(nettoye);

    if (tableaux.length === 0) {
      this.logger.error(
        `Aucun tableau JSON trouvé. Réponse: ${reponseBrute.substring(0, 500)}`,
      );
      return [];
    }

    for (let i = 0; i < tableaux.length; i++) {
      try {
        const parsed = JSON.parse(tableaux[i]);
        if (!Array.isArray(parsed)) continue;

        const tachesValides = this.validerTaches(parsed);
        if (tachesValides.length > 0) {
          this.logger.log(
            `${tachesValides.length} tâches valides (tableau ${i})`,
          );
          return tachesValides;
        }
      } catch {
        this.logger.warn(`Tableau ${i}: parse échoué`);
      }
    }

    return this.extraireTachesParRegex(nettoye);
  }

  private extraireTableaux(texte: string): string[] {
    const tableaux: string[] = [];
    let profondeur = 0;
    let debut = -1;

    for (let i = 0; i < texte.length; i++) {
      const char = texte[i];

      if (char === '[') {
        if (profondeur === 0) debut = i;
        profondeur++;
      } else if (char === ']') {
        profondeur--;
        if (profondeur === 0 && debut !== -1) {
          tableaux.push(texte.substring(debut, i + 1));
          debut = -1;
        }
      }
    }

    return tableaux;
  }

  private extraireTachesParRegex(texte: string): TacheGeneree[] {
    const regex = /\{[^{}]*"titre"[^{}]*"descriptionGeneree"[^{}]*\}/g;
    const matches = texte.match(regex) || [];

    if (matches.length === 0) {
      this.logger.error('Aucun objet tâche trouvé même par regex');
      return [];
    }

    const taches: TacheGeneree[] = [];
    for (const match of matches) {
      try {
        const parsed = JSON.parse(match);
        const validees = this.validerTaches([parsed]);
        taches.push(...validees);
      } catch {
        /* Objet invalide, on passe */
      }
    }

    if (taches.length > 0) {
      this.logger.log(`${taches.length} tâches extraites par regex (fallback)`);
    }
    return taches;
  }

  private validerTaches(parsed: any[]): TacheGeneree[] {
    const tachesValides: TacheGeneree[] = [];

    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;

      const aTitre =
        typeof item.titre === 'string' && item.titre.trim().length > 0;
      const aDescription =
        typeof item.descriptionGeneree === 'string' &&
        item.descriptionGeneree.trim().length > 0;
      const aCompetences = Array.isArray(item.competences);
      const aComplexite =
        typeof item.complexite === 'string' &&
        ['faible', 'moyenne', 'élevée', 'elevee', 'moyen'].includes(
          item.complexite,
        );

      if (aTitre && aDescription && aCompetences && aComplexite) {
        tachesValides.push({
          titre: item.titre.trim(),
          descriptionGeneree: item.descriptionGeneree.trim(),
          competences: item.competences.filter(
            (c: any) => typeof c === 'string',
          ),
          complexite: this.normaliserComplexite(item.complexite),
        });
      } else {
        this.logger.warn(
          `Tâche incomplète ignorée: ${JSON.stringify(item).substring(0, 150)}`,
        );
      }
    }

    return tachesValides;
  }

  private normaliserComplexite(
    valeur: string,
  ): 'faible' | 'moyenne' | 'élevée' {
    const v = valeur.toLowerCase();
    if (v === 'faible' || v === 'low') return 'faible';
    if (v === 'moyenne' || v === 'moyen' || v === 'medium') return 'moyenne';
    return 'élevée';
  }
}
