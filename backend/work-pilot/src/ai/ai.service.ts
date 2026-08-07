import { Injectable, Logger } from '@nestjs/common';

export interface TacheGeneree {
  titre: string;
  descriptionGeneree: string;
  competences: string[];
  complexite: 'faible' | 'moyenne' | 'élevée';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  private readonly modeles = [
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

  async genererCahierDesCharges(
    titre: string,
    description: string,
  ): Promise<string> {
    const systemPrompt = `Tu es un chef de projet technique expert qui rédige des cahiers des charges professionnels en français.

Rédige un cahier des charges complet avec EXACTEMENT ces 10 sections Markdown :

## 1. Présentation du projet
Résumé exécutif en 3-4 paragraphes.

## 2. Contexte du projet
Pourquoi ce projet existe-t-il ? Quel problème résout-il ?

## 3. Acteurs (Utilisateurs)
Description détaillée de chaque type d'utilisateur avec :
- Rôle dans le système
- Permissions et actions possibles
- Interactions avec les autres acteurs
(Administrateur système, Chef de projet, Développeur, Relecteur technique)

## 4. Objectifs principaux
Liste numérotée des buts à atteindre.

## 5. Besoins fonctionnels
Fonctionnalités attendues, groupées par domaine.

## 6. Besoins non fonctionnels
Performance, sécurité, scalabilité, ergonomie, disponibilité.

## 7. Interfaces utilisateur
Description détaillée des principaux écrans :
- Nom et objectif
- Éléments (formulaires, tableaux, boutons)
- Actions possibles
- Interactions avec autres écrans
(Dashboard, création projet, liste tâches, détail tâche, génération code, PR, admin)

## 8. Contraintes techniques
Technologies, environnement, délais, budget, normes.

## 9. Critères de succès
Indicateurs clés pour mesurer la réussite.

## 10. Matrice Acteurs-Interfaces
Tableau détaillant les accès et interactions entre chaque type d'utilisateur et les interfaces du système.

### 10.1 Matrice d'accès
Présente sous forme de tableau :
| Interface | Administrateur | Chef de projet | Développeur | Relecteur technique |
|-----------|----------------|----------------|-------------|---------------------|
| Dashboard | Complet | Projet | Tâches | PR |
| Création projet | | | | |
| ... | ... | ... | ... | ... |

### 10.2 Flux d'interaction principaux
Description textuelle des parcours utilisateurs typiques :
- Parcours du Chef de projet : de la création à la validation
- Parcours du Développeur : de la sélection de tâche à la soumission de PR
- Parcours du Relecteur : de la notification à la validation de PR
- Parcours de l'Administrateur : supervision et gestion globale

### 10.3 Règles d'accès spécifiques
Précise les règles métier importantes :
- Qui peut voir/modifier/supprimer quoi
- Restrictions spécifiques par rôle
- Conditions particulières d'accès

INSTRUCTION STRICTE : Réponds UNIQUEMENT avec le texte Markdown. Aucun préambule.`;

    const userPrompt = `Titre : ${titre}\nDescription : ${description}`;

    const debut = Date.now();
    const cahier = await this.appelerIA(
      systemPrompt,
      userPrompt,
      8000,
      false,
      0.7,
    );
    const duree = Date.now() - debut;

    this.logger.log(`CDC généré en ${duree}ms (${cahier.length} caractères)`);
    return cahier;
  }

  async genererTaches(
    contenuCahierDesCharges: string,
  ): Promise<TacheGeneree[]> {
    const systemPrompt = `Tu es un expert en gestion de projet qui découpe des cahiers des charges en tâches de développement.

INSTRUCTIONS OBLIGATOIRES (À SUIVRE SCRUPULEUSEMENT) :

1. Réponds avec un TABLEAU JSON contenant des OBJETS (pas des strings)
2. Chaque objet DOIT avoir EXACTEMENT ces 4 champs :
   - "titre" (string) : titre court de la tâche
   - "descriptionGeneree" (string) : 6-10 phrases détaillant ce qu'il faut faire
   - "competences" (array de strings) : compétences requises
   - "complexite" (string) : "faible", "moyenne" ou "élevée"

3. Génère entre 15 et 20 tâches maximum
4. AUCUN texte avant ou après le JSON
5. AUCUNE balise markdown (\`\`\`)

EXEMPLE DE FORMAT PARFAIT À COPIER :

[
  {
    "titre": "Créer la base de données",
    "descriptionGeneree": "Concevoir le schéma PostgreSQL avec les tables utilisateurs, produits et commandes. Utiliser Prisma comme ORM pour la gestion des migrations.",
    "competences": ["backend", "postgresql", "prisma"],
    "complexite": "moyenne"
  },
  {
    "titre": "Développer l'API REST",
    "descriptionGeneree": "Implémenter les endpoints CRUD pour les produits et les commandes avec NestJS. Ajouter l'authentification JWT et la validation des données.",
    "competences": ["backend", "nestjs", "typescript", "authentication"],
    "complexite": "élevée"
  }
]
❌ ERREURS À ÉVITER ABSOLUMENT :

❌ Ne retourne PAS une simple liste de compétences comme ["devops", "docker"]
❌ Ne retourne PAS un objet unique, il faut un tableau
❌ N'ajoute PAS de texte explicatif avant ou après
❌ N'utilise PAS de balises markdown
✅ Retourne UNIQUEMENT le tableau JSON d'objets tâches
   RÈGLE ABSOLUE : Ta réponse DOIT être un tableau JSON d'objets.
Chaque objet DOIT avoir 4 champs : titre, descriptionGeneree, competences, complexite.

INTERDIT : Retourner une simple liste de strings comme ["devops", "docker"].
OBLIGATOIRE : Retourner des objets complets comme :
[{"titre": "...", "descriptionGeneree": "...", "competences": ["..."], "complexite": "faible"}]

[Reste de ton prompt...];
`;

    const userPrompt = `Découpe ce cahier des charges en 10-15 tâches de développement concrètes :

${contenuCahierDesCharges.substring(0, 15000)}

RAPPEL FINAL : Réponds UNIQUEMENT avec un tableau JSON d'objets ayant titre, descriptionGeneree, competences, complexite.`;

    const debut = Date.now();

    const reponse = await this.appelerIA(
      systemPrompt,
      userPrompt,
      10000,
      false,
      0.2,
    );
    this.logger.log(`Réponse IA reçue (${reponse.length} caractères)`);
    let taches = this.parserTaches(reponse);
    if (taches.length === 0) {
      this.logger.warn('Première tentative échouée, retry en cours...');
      const reponseRetry = await this.genererTachesRetry(
        contenuCahierDesCharges,
      );
      taches = this.parserTaches(reponseRetry);
    }

    const duree = Date.now() - debut;
    this.logger.log(`${taches.length} tâches générées en ${duree}ms`);

    return taches;
  }

  private async genererTachesRetry(
    contenuCahierDesCharges: string,
  ): Promise<string> {
    const systemSimplifie =
      'Tu es un assistant qui répond UNIQUEMENT avec du JSON valide.';

    const userSimplifie = `Crée un tableau JSON de 15 tâches de développement à partir de ce texte.

Format OBLIGATOIRE pour chaque tâche :
{
  "titre": "Titre court",
  "descriptionGeneree": "Description en 4 phrases",
  "competences": ["comp1", "comp2"],
  "complexite": "faible"
}

Texte à analyser (tronqué) :
${contenuCahierDesCharges.substring(0, 15000)}

Réponds avec UNIQUEMENT le tableau JSON, rien d'autre.`;

    return this.appelerIA(systemSimplifie, userSimplifie, 10000, false, 0.2);
  }

  private async appelerIA(
    system: string,
    userMessage: string,
    maxTokens: number,
    forceJson: boolean = false,
    temperature: number = 0.2,
  ): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY non configurée');
    }

    let derniereErreur: Error | null = null;
    const modelesEssayes: string[] = [];

    for (const modele of this.modeles) {
      try {
        this.logger.log(`Tentative : ${modele} (temp: ${temperature})`);
        modelesEssayes.push(modele);

        const body: any = {
          model: modele,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userMessage },
          ],
          temperature: temperature,
        };

        if (forceJson) {
          body.response_format = { type: 'json_object' };
        }

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
            'X-Title': 'WorkPilot',
          },
          body: JSON.stringify(body),
        });

        if (response.status === 429) {
          this.logger.warn(`Rate limit sur ${modele}`);
          continue;
        }

        if (response.status === 404) {
          this.logger.warn(`Modèle ${modele} indisponible (404)`);
          continue;
        }

        if (response.status === 503) {
          this.logger.warn(`Service indisponible sur ${modele}`);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          this.logger.error(
            `Erreur ${response.status} : ${errorBody.substring(0, 200)}`,
          );
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const texte = data.choices?.[0]?.message?.content;

        if (!texte) {
          throw new Error('Réponse IA vide');
        }

        this.logger.log(`Succès avec ${modele}`);
        return texte.trim();
      } catch (error) {
        derniereErreur = error as Error;
        this.logger.error(`Échec ${modele}: ${derniereErreur.message}`);
      }
    }

    throw new Error(`Tous les modèles ont échoué. ${derniereErreur?.message}`);
  }
  private parserTaches(reponseBrute: string): TacheGeneree[] {
    this.logger.log(`Parsing de ${reponseBrute.length} caractères`);
    this.logger.debug(`Début réponse: ${reponseBrute.substring(0, 200)}`);

    //  Nettoyer les balises markdown
    const nettoye = reponseBrute
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      const testParse = JSON.parse(nettoye);
      if (
        Array.isArray(testParse) &&
        testParse.length > 0 &&
        typeof testParse[0] === 'string'
      ) {
        this.logger.error(
          "L'IA a retourné un tableau de strings au lieu d'objets",
        );
        this.logger.error(`Contenu: ${JSON.stringify(testParse)}`);
        return [];
      }
    } catch {
      // Continuer avec le parsing normal
    }

    //  Extraire tous les tableaux
    const tableaux = this.extraireTableaux(nettoye);

    if (tableaux.length === 0) {
      this.logger.error('Aucun tableau JSON trouvé');
      this.logger.error(`Réponse complète: ${reponseBrute.substring(0, 500)}`);
      return [];
    }

    this.logger.log(`${tableaux.length} tableau(x) trouvé(s)`);

    for (let i = 0; i < tableaux.length; i++) {
      try {
        const parsed = JSON.parse(tableaux[i]);

        if (!Array.isArray(parsed)) {
          this.logger.warn(`Tableau ${i}: pas un array`);
          continue;
        }

        const tachesValides = this.validerTaches(parsed);

        if (tachesValides.length > 0) {
          this.logger.log(
            `✅ ${tachesValides.length} tâches valides (tableau ${i})`,
          );
          return tachesValides;
        }
      } catch (_) {
        this.logger.warn(`Tableau ${i}: parse échoué`);
      }
    }

    this.logger.error('Aucune tâche valide trouvée');
    this.logger.error(`Réponse complète: ${reponseBrute.substring(0, 1000)}`);
    return [];
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

  private validerTaches(parsed: any[]): TacheGeneree[] {
    const tachesValides: TacheGeneree[] = [];

    for (const item of parsed) {
      if (typeof item === 'string' || typeof item === 'number') {
        this.logger.warn(`Ignoré (non-objet): "${item}"`);
        continue;
      }

      if (!item || typeof item !== 'object') {
        continue;
      }

      const aTitre =
        typeof item.titre === 'string' && item.titre.trim().length > 0;
      const aDescription =
        typeof item.descriptionGeneree === 'string' &&
        item.descriptionGeneree.trim().length > 0;
      const aCompetences = Array.isArray(item.competences);
      const aComplexite = ['faible', 'moyenne', 'élevée', 'elevee'].includes(
        item.complexite,
      );

      if (aTitre && aDescription && aCompetences && aComplexite) {
        tachesValides.push({
          titre: item.titre.trim(),
          descriptionGeneree: item.descriptionGeneree.trim(),
          competences: item.competences.filter(
            (c: any) => typeof c === 'string',
          ),
          complexite: item.complexite === 'elevee' ? 'élevée' : item.complexite,
        });
      } else {
        this.logger.warn(
          `Tâche incomplète: ${JSON.stringify(item).substring(0, 150)}`,
        );
      }
    }

    return tachesValides;
  }
}
