# Pile proposée, workflow d'aperçu et outils à brancher · Lot A0

Date : 23/10/2026 · **Proposition à valider par T. SOEFOU** (aucune installation faite, aucune commande exécutée dans le dépôt).
Versions : lues le 23/10/2026 dans le registre npm (champ `latest`, licence déclarée). Une version publiée n'est pas une garantie de compatibilité entre paquets : les compatibilités marquées « non vérifié » se testent à l'installation du lot A1.

## 1. Principe directeur

| Contrainte du projet | Conséquence sur la pile |
|---|---|
| Filtrage par profil « dans la couche de données, jamais seulement dans l'écran » (CLAUDE.md) | Un **serveur Node** est nécessaire dès l'étape A. Un export statique mettrait toutes les données fictives dans le navigateur : exclu. |
| Aucun appel réseau sortant dans le démonstrateur | Pas de CDN, pas de police distante, pas de télémétrie : polices et icônes embarquées, télémétrie du framework coupée (voir §4). |
| Étape B sans réécriture des écrans | Interface `Repository` + schémas partagés + règles pures. |
| FR / EN sans chaîne en dur | Bibliothèque d'i18n avec test d'exhaustivité. |
| « Simplicité d'abord » | Pas de bibliothèque ajoutée avant le lot qui en a besoin. |

## 2. Pile de l'étape A (versions vérifiées)

| Rôle | Choix | Version | Licence | Pourquoi | Alternative écartée (raison) | Statut |
|---|---|---|---|---|---|---|
| Runtime | Node.js | 22.x (poste du prestataire : v22.23.4, vérifié) | MIT (non revérifiée) | Exigé par Next (≥ 20.9) et Vitest (^22.12) | Node 20 (Vitest l'exclut) | À figer dans `.nvmrc` au lot A1 |
| Framework | Next.js, App Router | 16.4.2 | MIT | Pages serveur + routes API dans un seul dépôt, passage naturel à l'étape B ; déjà inscrit dans CLAUDE.md | Vite + React (SPA) : plus léger, mais pas de couche serveur pour filtrer par profil → réécriture en B | Proposé |
| UI | React | 19.3.1 | MIT | Imposé par Next 16 (peer `^19.0.0`, vérifié) | | Proposé |
| Langage | TypeScript strict | **6.0.3** (dernière 6.x) | Apache-2.0 | Version majeure précédente : outils de lint et de test éprouvés | TypeScript 7.0.2 (dernière du registre) : **compatibilité avec ESLint, Next et Vitest non vérifiée** ; à tester en branche à part | Proposé, avec essai de la 7 |
| Style | Tailwind CSS | 4.3.3 | MIT | Jetons de la charte mixte en variables CSS, cohérent avec CLAUDE.md | CSS modules : plus verbeux pour les jetons ; Chakra (Horizon UI) : écarté par CLAUDE.md | Proposé |
| Validation | Zod | 4.6.7 | MIT | Schémas uniques pour fixtures, formulaires, import (A6) et API (B) | Valibot, Yup : non évalués | Proposé |
| i18n | next-intl | 4.14.9 (peer Next 16 déclaré compatible, vérifié) | MIT | Messages FR/EN, formats de date par langue, App Router | i18next : plus lourd ; maison : risque de chaînes en dur | Proposé |
| Graphiques | Recharts | 3.10.1 (peer React 19 déclaré) | MIT | Barres, courbes, donut, jauge à composer ; D88 demande des types sélectionnables | Graphiques SVG maison : à garder pour les formes arrondies de D89 si Recharts ne suffit pas | **À évaluer au lot A4a** (ne pas installer avant) |
| Tests règles | Vitest | 5.0.5 | MIT | Rapide, TypeScript natif, tests table par table W1–W22 / D1–D7 | Jest : configuration plus lourde | Proposé |
| Tests parcours | Playwright Test | 1.64.1 | Apache-2.0 | Déjà utilisé par les modules V4 (en Python) ; captures et accessibilité | Cypress : non évalué | Proposé |
| Accessibilité auto | @axe-core/playwright | 4.14.0 | **MPL-2.0** (copyleft de fichier, à valider) | Contrôle de contraste et clavier dans les parcours | Contrôle manuel seul | À évaluer au lot A1 |
| Lint | ESLint + eslint-config-next | 10.13.0 + 16.4.2 | MIT | Config Next exige `eslint ≥ 9` (vérifié) ; **ESLint 10 non vérifié avec cette config** | ESLint 9 : repli si incompatibilité | Proposé, repli prévu |
| Tableaux | — | — | — | Tableaux HTML + tri maison au départ ; TanStack Table 9.3.1 existe mais n'est pas justifié avant A4a | | Non installé |
| Excel (A6) | ExcelJS (lecture/écriture) | 4.4.0, **dernière publication 20/12/2024** | MIT | Lecture sans macro, écriture de classeurs d'export | `xlsx` (SheetJS) 0.18.5 : version npm ancienne (la distribution actuelle est hors npm : non vérifié) ; `read-excel-file` 9.3.12 (lecture seule, MIT) si l'écriture n'est pas utile | **À trancher en A6** (projet peu actif : risque de maintenance noté) |
| PPTX / PDF (A4c1) | pptxgenjs ; PDF via Playwright `page.pdf` | 4.0.1 (dernière publication 26/06/2025) ; Playwright 1.64.1 | MIT ; Apache-2.0 | Exports COPIL (D58) : PPTX natif, PDF depuis HTML déjà rendu | Bibliothèque PDF dédiée : non évaluée | **À trancher en A4c1** |

Non fait : aucune de ces versions n'a été installée ni testée ensemble ; les licences des dépendances transitives ne sont pas auditées.

## 3. Ce qui change entre l'étape A et l'étape B

| Sujet | Étape A | Étape B | Précaution dès A |
|---|---|---|---|
| Données | Fixtures JSON typées, générées par script déterministe, derrière `Repository` | PostgreSQL (version non vérifiée) | Aucun écran n'importe un fichier de fixtures directement |
| Droits | Profil de démo dans un cookie, filtrage dans l'implémentation `Repository` | Identité par l'IdP de l'agence (D33), droits côté serveur et base | Interface `Repository` reçoit toujours un **contexte d'accès** (profil, périmètre) |
| Auth | Aucune : sélecteur de profils fictifs | OIDC (ex. `openid-client` 6.8.8 MIT, D37 : bibliothèque à vérifier) | Le cookie de démo n'est **pas** une session : nom et format volontairement distincts |
| Écriture | Dans la mémoire du processus, réinitialisable | Transactions SQL, journal d'audit en ajout seul | Chaque changement d'état émet un événement (D91) dès A2 |
| Excel (D51) | Écriture simulée | Écriture réelle dans le fichier branché | Contrat commun de fichier (empreinte, version, provenance) dès A6 |
| ORM / SQL | — | À choisir en B0 (ex. `drizzle-orm` 0.45.4, `pg` 8.23.1 : vérifiés au registre, non évalués) | Schémas Zod dérivables en tables |
| Déploiement | Local d'abord (§6) | Hébergeur UE choisi (D02/D19) | Aucune dépendance à un service propriétaire d'hébergeur |

## 4. Configuration à prévoir au lot A1 (proposition, non exécutée)

- Désactiver la télémétrie du framework (variable d'environnement dans le script, **vérifier son nom dans la documentation officielle avant d'écrire la commande**).
- Polices embarquées (Inter) et icônes locales ; aucune requête externe. Test Playwright qui échoue sur toute requête hors `localhost`.
- `.env.example` sans valeur ; aucun secret dans le dépôt.
- `.gitignore` : ajouter `data_real*`, `ref_reel*`, `ref_magasins*`, `communes_*`, `*_pack.js`, `*.sqlite`, `*.db` (écart E19).

## 5. Workflow « aperçu pendant le développement » (demande du 23/10)

Objectif : à chaque étape, Claude Code **montre** ce qu'il vient de coder (écran, parcours, fonction), pas seulement le dit.

| Étape de chaque lot | Ce que fait Claude Code | Outil | Preuve laissée |
|---|---|---|---|
| 1. Plan court | Énonce le critère de réussite et la vérification (principe 4 de CLAUDE.md) | — | Bloc « critère » dans le compte rendu |
| 2. Serveur de développement | Lance l'application en local sur un port fixe, sans réseau sortant | Commande `dev` (§7) | Journal du serveur sans erreur |
| 3. Aperçu visuel | Ouvre la page dans le navigateur, prend une capture, lit la console et les requêtes réseau | Navigateur intégré à l'application de bureau (`preview_start`) ou Claude dans Chrome | Capture dans `docs/captures/<lot>/` + console vide |
| 4. Aperçu par profil | Répète pour chaque profil de démo concerné (cliente, agence, DR/CVR, RS, admin) et pour FR puis EN | Playwright, scénario `preview-<lot>` | 1 capture par profil × langue |
| 5. Aperçu mobile | Redimensionne à une largeur de téléphone | Redimensionnement de fenêtre ou projet Playwright « mobile » | Captures 390 px |
| 6. Contrôle automatique | Lance Vitest, Playwright, vérification de types, lint | Commandes §7 | Sortie complète collée dans le compte rendu |
| 7. Fin de lot | Compte rendu : fait, non fait, écarts, vérifications non exécutées ; captures référencées | — | `docs/COMPTE_RENDU_<lot>.md` |

Règles : une capture n'est montrée que si l'écran contient le bandeau « DONNÉES FICTIVES » ; un écran non vérifié visuellement est déclaré comme tel ; les captures ne contiennent aucune donnée réelle (par construction, tout est fictif).

**Mise à jour proposée (non appliquée)** : décision **D104 « Aperçu visuel à chaque étape »** + section « Aperçu » dans `CLAUDE.md` reprenant le tableau ci-dessus. Statut : proposé.

## 6. Outils à brancher (conseil)

Principe : brancher peu, brancher ce qui sert **l'étape A**, repousser le reste. « Disponible dans cette session » signifie que l'outil est listé ; **aucun n'a été appelé pour ce lot**.

| Priorité | Outil | Usage | Étape | Recommandation |
|---|---|---|---|---|
| 1 | **Navigateur intégré de l'application de bureau** (aperçu du serveur local, captures, console, réseau) | Boucle « coder → voir → corriger » | A | **Oui, par défaut** : séparé de votre Chrome, pas de session personnelle exposée |
| 2 | **Playwright** (déjà dans la pile) | Captures systématiques par profil, langue et largeur ; parcours de recette ; contrôle « aucune requête externe » | A | **Oui** : c'est la preuve reproductible, indépendante de l'IA |
| 3 | **Claude dans Chrome** | Vérification finale dans votre vrai navigateur (rendu Mac, polices) avant présentation | A (fin de lot) | Oui, ponctuel ; éviter pour le développement courant (accès à vos sessions) |
| 4 | **GitHub** (dépôt privé, `gh`) | Historique, relecture, intégration continue plus tard | A→B | Oui pour le dépôt privé ; **aucun commit ni push sans votre demande** |
| 5 | **Agents du projet** (`agents-projet/`, 11 fichiers) | Revue de code, i18n, accessibilité, confidentialité, preuves | A | À activer par copie dans `.claude/agents/` sur votre poste (D39) ; ils auditent, ne codent pas |
| 6 | **Vercel** (prévisualisation en ligne) | Lien de démonstration partageable à Impact ou à la cliente | A (option) | **À différer** : hébergement non arrêté (D02/D19), données fictives seulement, accès protégé, région UE à vérifier, coût non vérifié. Alternative : démonstration en local ou sur votre poste |
| 7 | **Supabase** (PostgreSQL géré, MCP) | Base de l'étape B | **B uniquement** | **Non maintenant** : interdit sans feu vert B ; hébergement et région à décider |
| 8 | Figma, Canva | Maquettes | — | Inutile : la maquette V4 HTML et le design system existent |
| 9 | Storybook 10.6.3 (MIT) | Catalogue de composants | A1 (option) | À évaluer en A1 : utile si les composants se multiplient, sinon page « galerie » interne suffisante |

Mon avis, sans détour : le gain le plus important n'est pas un outil de plus, c'est de **verrouiller le trio serveur local + navigateur intégré + Playwright** dès A1. Le reste est du confort ou relève de l'étape B.

## 7. Section « Commandes » proposée pour CLAUDE.md (non appliquée)

À valider, puis à inscrire au lot A1 **après** `npm init` effectif. Les noms de scripts sont une proposition ; les commandes d'installation sont données à titre indicatif et **ne doivent pas être lancées avant validation de cette pile**.

```text
Installation       npm ci                         (après création du fichier de verrouillage en A1)
Développement      npm run dev                    (serveur local, port fixe à décider)
Types              npm run typecheck              (tsc --noEmit)
Lint               npm run lint
Règles métier      npm run test                   (Vitest)
Parcours           npm run test:e2e               (Playwright)
Aperçu             npm run preview:shots          (captures par profil, langue, largeur)
Construction       npm run build                  (vérifie que la production compile)
```

Aucune commande n'a été exécutée pour cette section.

## 8. Points ouverts sur la pile (décision T. SOEFOU)

| # | Question | Recommandation |
|---|---|---|
| P1 | TypeScript 6.0.3 ou 7.0.2 ? | 6.0.3 pour démarrer ; essai de la 7 en branche à part |
| P2 | Exécution du démonstrateur : local seulement ou lien partagé ? | Local au départ ; lien après décision d'hébergement |
| P3 | Graphiques : Recharts ou SVG maison ? | Décider à A4a sur un prototype |
| P4 | Excel : ExcelJS ou lecture seule ? | Trancher en A6 selon le besoin d'écriture simulée (D51) |
| P5 | Accepter MPL-2.0 pour axe-core en développement ? | Oui si usage en test seulement ; à confirmer |

## 9. Icônes (D113)

Règle : pictogrammes usuels pour les menus (maison, liste, calendrier, carte, utilisateur, cloche, réglages, graphique). **Sont exclus** les symboles associés à l'IA : étincelles, baguette magique, robot, cerveau, bulle « assistant ».
Bibliothèques vérifiées au registre npm le 23/10/2026 : Lucide (`lucide-react` 1.61.0, ISC), Phosphor (`@phosphor-icons/react` 2.1.10, MIT), Tabler (`@tabler/icons-react` 3.49.0, MIT). Choix à faire en A1 sur un essai visuel ; **le test d'exclusion se fait sur une liste de noms d'icônes interdits** (contrôle automatique). Aucune icône n'est chargée depuis un CDN.
