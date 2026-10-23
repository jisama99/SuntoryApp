# Démarrage de Claude Code pour la plateforme Suntory · Liste de contrôle

Version de travail du 23/10/2026. Pour T. SOEFOU, sur son poste. Je n'ai exécuté aucune de ces commandes.

## 1. Avant d'ouvrir Claude Code

| # | Action | Pourquoi | Vérification |
|---|---|---|---|
| 1 | Node 22 installé (poste : v22.23.4 constaté, npm 10.9.9) | Exigé par Next 16 et Vitest 5 | `node -v` |
| 2 | Relire le dépôt `08_PLATEFORME_SUNTORY_V3` : `git status` | État propre ou connu | Les fichiers non suivis sont les documents A0 et `agents-projet/` |
| 3 | **Commit des documents A0 et correctifs** (à votre demande seulement) | Point de retour avant le premier code | Exemple de message : « Lot A0 : documents, décisions D104 à D113, garde-fous » |
| 4 | Activer les 11 agents (D39) : créer `.claude/agents/` et y copier les fichiers `engineering-*.md`, `security-*.md`, `testing-*.md` de `agents-projet/` | Revue de code, i18n, accessibilité, confidentialité | `ls .claude/agents` : 11 fichiers (hors README et licence) |
| 5 | Droits de lecture : refuser à Claude Code la lecture des dossiers de données réelles (voir §2) | Règles D109 bis et CLAUDE.md | Test : demander la lecture d'un fichier interdit, refus attendu |

## 2. Interdictions de lecture proposées (syntaxe à vérifier dans la documentation Claude Code avant usage)

Chemins à interdire en lecture : `REFONTE_V3/01_SOURCE_SAISONNIER`, `REFONTE_V3/02_SAISIE_PARTAGEE`, `REFONTE_V3/04_TBB_SBFF`, `REFONTE_V3/FICHIERS POUR DEPARTEMENTS/DECOUPE*`, `REFONTE_V3/FICHIERS POUR DEPARTEMENTS/LISTING*`, et tout fichier `data_real*`, `ref_reel*`, `ref_magasins*`, `communes_*`, `*_pack.js`, `*.xlsx`, `*.xls*`, `*.csv`. Pour la cartographie (lot ultérieur), la découpe réelle sera autorisée uniquement via la variable d'environnement locale de D109 bis, pas par lecture libre.

## 3. Ouvrir la session

1. Ouvrir Claude Code **dans** `08_PLATEFORME_SUNTORY_V3`. Ajouter `REFONTE_V3` en lecture seule.
2. Coller dans cet ordre : `02_PROMPT_MAITRE_DEV.md`, `00B_PROMPT_DE_LANCEMENT.md`, puis le prompt du lot (`05B_PROMPT_LOT_A0B.md` d'abord, `06_PROMPT_LOT_A1.md` ensuite, une session chacun).
3. Le lot A1 installe les dépendances et télécharge le navigateur de test (Playwright) : accès réseau de développement attendu, **distinct** du démonstrateur qui n'en fait aucun.
4. Aperçu : le navigateur intégré de l'application de bureau est le défaut ; Claude dans Chrome sert à la vérification finale.

## 4. À valider en fin de A1

| Contrôle | Où |
|---|---|
| Captures A1 des sept profils en FR et EN, bureau et mobile | `docs/captures/A1/` |
| Compte rendu et vérifications non exécutées | `docs/COMPTE_RENDU_A1.md` |
| Choix de bibliothèque d'icônes et absence d'icône de style IA | Compte rendu |
| Test inter-profils sur les alertes agence | Sortie de `npm run test` |
| Choix de TypeScript 6.0.3 et d'ESLint confirmés ou repli noté | Compte rendu |

## 5. Ordre des lots ensuite (D112)

**A0b** (documents, choisi avant A1 le 23/10) → A1 → A2a → A2b → A3 → A4a → A5 → A6 → A7 (noyau du 10/11, D110). Puis A4b, A4c1, A4c2, A5b.

## 6. Ce qui reste à votre charge
- Accord d'Impact et de la cliente pour l'usage de la découpe réelle (avant toute démonstration, D109 bis).
- Construction du fichier d'empreintes `.denylist.local` (contrôle C3), hors dépôt.
- Réponses aux questions 9 et 10 si vous voulez remplacer mes valeurs par défaut (D107, D108).

## 7. Après A1 (mise à jour du 23/10/2026)
A1 est livré (A1 bis à quater inclus : mode sombre, direction visuelle D123 à D126, icônes harmonisées, tuiles colorées). Pour enchaîner : `09_INDEX_LOTS.md` donne l'ordre, les prompts `10_` à `20_` couvrent A2a à A5b, et `07_REGLES_COMMUNES_LOTS_APRES_A1.md` se colle avant chaque prompt de lot. Relancer d'abord les contrôles sur votre poste (§1 de l'index).
