# CLAUDE.md · Plateforme de pilotage Suntory (Refonte V3)

À copier à la racine du dépôt de la plateforme. Mise à jour : 22/10/2026. Ne jamais mélanger avec un autre client.

## Mission
Plateforme web de pilotage merchandising Suntory (lecture analytique ordinateur) et application de saisie terrain (mobile), partagées entre la cliente (Suntory) et l'agence (Impact). Cadrage complet : `REFONTE_V3/ORIENTATION APPLICATION METIER/` (3 fichiers) et présentation cliente V0.4.

## Parties (convention de vocabulaire)
- **Cliente** : Suntory.
- **Agence** : Impact. Donneuse d'ordre et payeuse. Dans la plateforme, « Agence » est aussi le nom d'un rôle utilisateur.
- **Prestataire** : le profil FREELANCE (T. SOEFOU) qui conçoit, développe, héberge et facture à l'agence. C'est lui qui arrête les positions du registre.
- Chaîne : Suntory → Impact → prestataire → hébergeur. Dans le code et la documentation : écrire « prestataire » pour le développement et l'exploitation, « agence » seulement pour Impact ou le rôle utilisateur.

## Phase en cours
- **Démonstration du 10/11 (D110)** : noyau A1, A2 (A2a, A2b), A3, A4b1, A4a, A5, A6. Seconde démonstration : A4b2, A4c1, A4c2, A5b. Date indicative, D26 ouvert. A0b avant A2 (D112).
- **Étape A : démonstrateur cliquable sur données fictives, en français et en anglais.** C'est la seule étape autorisée tant qu'aucun « feu vert B » écrit n'existe dans `docs/DECISIONS.md`.
- **Étape B : MVP complet** (base réelle, authentification, droits serveur, imports réels). Interdite sans feu vert B.
- Les décisions arrêtées et ouvertes sont dans `docs/DECISIONS.md` (copie de `01_REGISTRE_DECISIONS.md`). En cas de doute, c'est ce fichier qui fait foi. Une hypothèse n'est pas une décision.

## Règles non négociables
- Aucune donnée réelle (client, magasin, intervenant, tarif, budget) dans le dépôt, les fixtures, les tests, les logs ou les prompts. Données fictives, bandeau « DONNÉES FICTIVES » visible sur chaque écran.
  - **Exception unique, D109 / D109 bis (validée le 23/10/2026)** : la découpe géographique réelle peut alimenter la cartographie **sur le poste de T. SOEFOU seulement**. Le fichier n'est jamais versionné ; son chemin est donné par une variable d'environnement (`SUNTORY_GEO_PATH`, nom à confirmer en A1) ; il est lu par un importeur générique. Aucune valeur de ce fichier dans les prompts, les journaux, les captures, les fixtures ni les comptes rendus. Bandeau distinct « DONNÉES RÉELLES LOCALES » à l'écran. Accord d'Impact et de la cliente pour l'usage de la découpe : **à obtenir avant toute démonstration à la cliente**. Toute autre donnée réelle reste interdite.
- Aucun tarif fictif présenté comme réel. Aucun coût inconnu transformé en 0 : afficher « Non chiffré », « Donnée indisponible » ou « Budget non renseigné ».
- Aucune formule ou valeur de classeur reprise comme vérité sans contrôle. Les classeurs sources sont en lecture seule.
- Aucune donnée interne protégée par un simple masquage dans le navigateur : le filtrage se fait côté serveur ou, au démonstrateur, dans la couche de données et jamais seulement dans l'écran.
- Aucun changement silencieux de calcul, d'identifiant ou d'historique.
- Aucune validation, notification externe, envoi d'e-mail ou publication autonome. Aucun appel réseau sortant dans le démonstrateur.
- Pas de géolocalisation, photo ou signature sans finalité validée.
- Pas de secret dans le dépôt, dans le front ou dans un fichier Excel.
- Ne pas inventer de prix, délai, licence ou certification.
- Si un fichier, une règle ou une décision manque : le signaler et s'arrêter sur ce point, ne pas combler de mémoire.

## Pile de l'étape A (validée le 23/10/2026, D105)
Versions : Next 16.4.2, React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.3, Vitest 5.0.5, Playwright 1.64.1, Zod 4.6.7, next-intl 4.14.9 (détail et licences : `docs/PILE_PROPOSEE.md`). Node 22.x. Compatibilité croisée à vérifier à l'installation de A1 ; TypeScript 7 s'essaie en branche à part. Un serveur Node est nécessaire dès l'étape A (filtrage par profil côté données, pas d'export statique).
- TypeScript strict, Next.js (App Router), React.
- Tailwind avec les jetons de la **charte mixte décidée le 22/10/2026** : Suntory Beverage dominant (source `DESIGN SYSTEM/suntorybeverageandfood-europe.com-DESIGN.md`), codes couleur Marvesting visibles sur les éléments importants (`design_system_marvesting.md`). Détail et règles de contraste : `docs/COMPLEMENTS_CADRAGE/14_DECISIONS_22-10_CHARTE_ACCES_AGENTS.md` ; logos, RS, chaîne managériale, budgets, agents : `docs/COMPLEMENTS_CADRAGE/15_DECISIONS_22-10_LOGOS_RS_BUDGETS_AGENTS.md`. Agents du projet : `agents-projet/` (non actifs ; lecture seule pour les audits). `marvesting_trame_system_design.md` (Norton) est écarté. Références de mise en page : maquette `MAQUETTES_V4/maquette_premium_V4.html`.
- Données du démonstrateur : fixtures JSON typées derrière une interface de dépôt (`Repository`). L'étape B remplace l'implémentation par PostgreSQL sans toucher aux écrans.
- Règles métier (semaine ISO, doublons, statuts, droits, import) : modules TypeScript purs et testés, sans dépendance à l'interface.
- Tests : Vitest pour les règles, Playwright pour les parcours (les suites actuelles M1 à M3 utilisent Playwright).
- Le modèle Horizon UI (Chakra, dossier `horizon-ui-chakra-nextjs-main`, licence MIT) n'est **pas** la base : dépendances anciennes, système de composants différent du design V4. Inspiration de mise en page possible, pas de copie du code sans accord.

## Structure cible
```
/docs            DECISIONS.md, GLOSSAIRE.md, comptes rendus de lot
/src/domain      types, règles pures (week, duplicates, status, rights, import)
/src/data        interface Repository, fixtures (étape A), adaptateur PostgreSQL (étape B)
/src/app         pages et composants
/tests           unitaires (Vitest), parcours (Playwright), jeux d'essai
```

## Vocabulaire : code en anglais, interface en français
| Code | Interface (cible) | Remarque |
|---|---|---|
| need | Besoin | Un besoin a des périodes et des lieux liés |
| proposal / decision | Proposition / Décision | Proposition versionnée ; décision liée à une version |
| assignment | Affectation | Une ressource sur un secteur et une période |
| field_mission | Mission terrain | Ne pas confondre avec `mission_id` (mission commerciale Suntory) |
| field_submission | Saisie terrain | Soumise puis validée |
| dashboard | Tableau de bord | Remplace « Cockpit » |
| actions_to_handle | Actions à traiter | Remplace « Points à corriger » |
| hired / started | Recrutement finalisé / Poste démarré | « Pourvu » à remplacer (D11) |
| vehicle_handover | Remise du véhicule | Événement distinct de la prise de poste (position D11, table de migration à valider) |

Les statuts ne sont jamais condensés en un seul champ : besoin, proposition, recrutement, exécution et finances ont chacun le leur.

## Conventions
- Interface en français et en anglais (D27) : tous les libellés passent par des fichiers de traduction, aucune chaîne en dur. Codes métier et listes autorisées identiques dans les deux langues. Dates affichées selon la langue, stockées en ISO `AAAA-MM-JJ` ; semaine stockée avec son année ISO (ex. `2026-S53`).
- Codes (département, magasin, secteur) stockés en texte. Montants en décimal, devise et HT/TTC explicites.
- Identifiants immuables (UUID) séparés des codes métier lisibles.
- Chaque écran : états vide, chargement, erreur, conflit ; accessibilité clavier, contraste et alternative aux couleurs.
- Une erreur bloquante n'est jamais cachée dans un centre de notifications.

## Principes de conduite (adaptés des lignes directrices « karpathy-guidelines », validés par T. SOEFOU le 22/10/2026)
Reformulation pour ce projet, pas une copie. Inspiration : dépôt `andrej-karpathy-skills` (licence MIT déclarée dans son manifeste ; fichier de licence absent du dossier).
1. **Réfléchir avant de produire.** Énoncer les hypothèses. Si une règle, un fichier ou une décision manque, ou si deux lectures sont possibles : le dire et poser la question, ne pas choisir en silence. Une hypothèse n'est pas une décision. Signaler une approche plus simple quand elle existe.
2. **Simplicité d'abord.** Le minimum qui satisfait le lot en cours. Aucune fonctionnalité, option ou abstraction hors lot (l'interface `Repository` prévue pour passer de l'étape A à l'étape B est l'exception documentée). Une automatisation simple avant un agent.
3. **Modifications chirurgicales.** Ne toucher que le périmètre du lot. Les sources (classeurs Excel, modules V4, référentiel magasins) restent en lecture seule. Un défaut repéré hors périmètre est signalé, pas corrigé. Supprimer uniquement ce que sa propre modification a rendu inutile. Chaque ligne modifiée se rattache à la demande du lot.
4. **Exécution guidée par des critères vérifiables.** Avant d'agir : énoncer le critère de réussite et la vérification (test, capture, contrôle). « Terminé » exige la preuve. Un test non lancé n'est pas présenté comme passé ; un ancien rapport n'est pas un test d'aujourd'hui. Pour un travail en plusieurs étapes : plan court, chaque étape suivie de sa vérification.

## Aperçu à chaque étape (D104)
Après chaque étape de code d'un lot : lancer le serveur local, ouvrir la page dans le navigateur intégré, prendre une capture, lire la console et les requêtes réseau. Répéter par profil de démo concerné, en français puis en anglais, en largeur bureau puis mobile (390 px). Les captures vont dans `docs/captures/<lot>/` et sont référencées dans le compte rendu. Un écran non vérifié visuellement est déclaré comme tel. Démonstrateur **en local** : aucun lien externe ni déploiement tant que l'hébergement n'est pas décidé (D02/D19). Claude dans Chrome sert seulement à la vérification finale d'un lot.

## Zones, personnalisation, alertes, icônes (D106 à D108, D113)
- **Zones (D106)** : tout code DR, CVR ou RS s'affiche avec son libellé de zone et le nom de la personne responsable, par le seul composant `ZoneLabel` (interface, e-mails, exports). Noms fictifs au démonstrateur ; noms réels : avis des DPO avant l'étape B.
- **Personnalisation (D107, proposée)** : un seul `AccessContext` (profil, périmètre, vocabulaire, langue) dont dérivent titres, salutation, filtres par défaut et contenu des e-mails et exports.
- **Alertes (D108, proposée)** : champ `audience` obligatoire (`agency`, `client`, `both`), défaut refus, filtrage dans la couche de données. Réservées à l'agence : retards de proposition internes, coûts et chiffrage incomplet, qualité des données et imports, alertes techniques. Aucun « mode Cliente » par bouton de masquage.
- **Icônes (D113)** : pictogrammes usuels pour les menus ; interdits les symboles de style IA (étincelles, baguette, robot, cerveau, bulle d'assistant). Aucune icône chargée depuis un CDN.
- **Logos (D113)** : tous les logos fournis sont utilisables au démonstrateur ; droits non levés (D25, D75), risque porté par le prestataire.

## Méthode de travail
1. Un lot = une session. Lire `docs/DECISIONS.md` et le prompt du lot avant toute action.
2. Ne pas passer au lot suivant sans validation écrite de T. SOEFOU.
3. Fin de lot : lancer toutes les suites, produire un compte rendu (fait, non fait, écarts, vérifications non exécutées) dans `docs/`, proposer une mise à jour du registre de décisions (« mise à jour proposée », jamais « enregistré »).
4. Présenter honnêtement la couverture de lecture et les tests non exécutés. Un ancien rapport de test n'est pas un test exécuté aujourd'hui.
5. Ne pas commiter, pousser ni ouvrir de pull request sans demande explicite. Exception (D148, 23/10/2026) : en fin de lot, après le compte rendu, commit et push de la branche de session uniquement, jamais sur main, jamais de pull request. Exception (D191) : une session de revue lancée avec `docs/PROMPTS/31_PROMPT_REVUE_ET_FUSION.md` peut fusionner la branche d'un lot dans `main` et pousser `main`, après contrôles verts et validation de T. SOEFOU, jamais en force ni par pull request.
6. Signature (D28) : FREELANCE, pour les livrables externes (documents, devis). Aucune signature, coordonnée ni logo dans les écrans du démonstrateur. Pas de logo d'agence. L'adresse de contact de `docs/DECISIONS.md` ne va ni dans le code, ni dans les fixtures, ni dans les tests.

## Commandes
Proposées (D104, D105), **à créer et à vérifier à l'installation de A1** ; ne rien lancer avant l'existence de `package.json`. Les noms ci-dessous sont des noms de scripts prévus, non des commandes éprouvées.
- `npm run dev` : serveur local ; `npm run typecheck` ; `npm run lint` ; `npm run test` (Vitest) ; `npm run test:e2e` (Playwright) ; `npm run preview:shots` (captures par profil, langue, largeur) ; `npm run build`.
- Contrôles « aucune donnée réelle » C1 à C8 : `docs/FIXTURES.md` §5.
