# Écarts constatés · Lot A0

Date : 23/10/2026 · Version de travail. Une ligne par écart. **Rien n'est tranché ici** : la colonne « Proposition » est une recommandation à valider par T. SOEFOU.
Gravité : **H** bloque ou fausse un lot ; **M** à traiter avant le lot concerné ; **F** cosmétique ou à surveiller.

## 1. Écarts entre la présentation cliente V0.4 (22/10) et le registre de décisions (23/10)

| # | Source A | Source B | Nature | Grav. | Question / proposition |
|---|---|---|---|---|---|
| E01 | V0.4 ARCHI et Q3 : comptes créés par l'administrateur de la plateforme, lien d'invitation, SSO OIDC « option ultérieure » | D33 : fournisseur d'identité = l'agence, OIDC proposé, comptes de secours locaux | Modèle d'identité différent | H (étape B) | Aligner la V0.4 sur D33 avant toute présentation. Sans effet sur l'étape A (profils de démo). |
| E02 | V0.4 Q3/Q18 : RS et intervenants en « mot de passe seul » ; saisie terrain « par l'intervenant » | D42 : aucun compte intervenant, saisie par RS / CVR / agence pour le compte de l'intervenant ; D14/D15 révisées | Acteur de la saisie terrain | H (A5) | Le lot A5 suit D42. Signaler à la cliente que la V0.4 est périmée sur ce point. |
| E03 | V0.4 Q17 : « Pourvu » → « Recrutement finalisé » puis « Poste démarré » | D85 (« Pourvu » statut) puis D92 (six états ; « Pourvu » des rapports = En poste) | Vocabulaire des statuts | M | D92 tranche. Glossaire GLOSSAIRE.md : « Pourvu » conservé en alias de lecture seulement. |
| E04 | V0.4 : périmètre = saisie, propositions, pilotage, terrain, import | Registre D58 à D103 : reporting COPIL PPTX/PDF, boucles, journal d'événements, photos terrain | Périmètre élargi après la V0.4 | H | La V0.4 ne présente ni A4c1, A4c2, ni A5b. Décider si la cliente voit ce périmètre au démonstrateur ou en phase suivante. |
| E05 | V0.4 JALON : démonstrateur cible 10/11/2026 (S46), soit 18 jours après le 23/10 | 03_LOTS_DEV : A0, A0b, A1 à A7 dont A4a, A4b, A4c1, A4c2, A5b ; D26 « date ouverte » | Date contre volume | H | Le registre ne valide aucune date (D26 ouvert). Ne pas confirmer 10/11 sans arbitrage de périmètre : voir PLAN_A1_A7.md §3. |
| E06 | V0.4 C.META : « Marving » = plateforme de la FDV ; « Marving Flex » = application collaborateur | CLAUDE.md et D30/D69/D70 : « Marvesting » (charte rose, gabarit COPIL de 53 diapositives) | Deux noms très proches | M | Confirmer que Marving (outil FDV Suntory) et Marvesting (charte/gabarit) sont deux objets distincts. Le glossaire les sépare ; risque de confusion dans les exports. |
| E07 | V0.4 GLOSS : « Carence » a deux sens (terrain / délai légal) | D16/Q19 ouvert | Terme polysémique | M | Deux entrées de glossaire distinctes (`field_gap` / `legal_waiting_period`). Pas de KPI carence « réel » avant Q19. |
| E08 | V0.4 C.LIMITS : `CONTRAT_MODULE` « introuvable » | `00_PARTAGE/CONTRAT_MODULE.md` existe (24 752 o, statut « PROJET en attente de validation ») ; D55 le retient | Source déclarée absente | M | Corriger la V0.4 : le fichier existe, mais son statut interne est « projet non validé » et il décrit le module V3.12, pas les V4. |
| E09 | V0.4 C.LIMITS : dossier 4C vide, classeur lu depuis les pièces jointes du projet | `03_PILOTAGE_4C` ne contient que `.DS_Store` (vérifié aujourd'hui) | Confirmé | M | Pas d'écart de fait, mais la non-régression des imports 4C ne peut pas être préparée (D24). |
| E10 | V0.4 PROBS P9, Q6 : quotas permanent/saisonnier « à définir » à la maille DR, CVR ou RS | D85 : pas de quota de secteur, quota au niveau DR et CVR ; M1 paramètres : quotas DR/CVR/RS pour l'horaire | Maille du quota | M | Le démonstrateur n'affiche aucun quota au niveau RS pour permanent/saisonnier (D22 « à définir » en gris). À confirmer par la cliente. |
| E11 | V0.4 HOSTING : trois scénarios (cloud UE, hébergeur européen qualifié, locataire cliente) | D02/D19 : le prestataire choisit l'hébergeur et le refacture ; choix précis ouvert | Hébergement non arrêté | H (étape B), M (déploiement de démonstration) | Étape A sans déploiement externe par défaut (voir PILE_PROPOSEE.md §6). |
| E12 | V0.4 ARCHI : application RS en PWA (V2) | D32 : PWA ou native, décision après réponses terrain | Technologie mobile | F | Web responsive d'abord (A5), sans service worker au démonstrateur. |
| E13 | V0.4 PHASES P1b : « 108 besoins après découpage ; un cadrage antérieur en comptait 72 » | Aucune source ouverte aujourd'hui (classeurs interdits au lot A0) | Chiffre réel non rapproché | M | Hors dépôt : ne pas reprendre ces nombres dans les fixtures. À rapprocher à l'étape B. |

## 2. Écarts entre le cadrage / CLAUDE.md et les modules observés

| # | Source A | Source B | Nature | Grav. | Proposition |
|---|---|---|---|---|---|
| E14 | CLAUDE.md : tests Vitest + Playwright (TypeScript) | Modules : tests Python/Playwright (`test_*.py`) | Langage des suites | M | Réécrire les scénarios, pas les exécuter. Les anciens scores ne sont pas des preuves. |
| E15 | CLAUDE.md : « Pickup » remplacé par prise de poste et remise du véhicule | Modules et V0.4 Q17 : « pickup » ambigu | Table de correspondance non validée | M | Table de migration provisoire dans GLOSSAIRE.md ; validation cliente requise (D11, Q17). |
| E16 | CLAUDE.md : « Cockpit » → « Tableau de bord » ; « Points à corriger » → « Actions à traiter » | Modules M1/M2/M3 : libellés actuels | Renommage | F | Appliqué dans le glossaire ; les captures du démonstrateur utiliseront les libellés cibles. |
| E17 | Rapport V4 : `run_baseline.js` non relancé | Rapport : « aucun écart » vs baseline | Preuve indirecte | M | Pas de non-régression de calcul exploitable tant que D05 (définition du consommé) est ouvert. Aucun moteur financier au démonstrateur. |
| E18 | Rapport V4 : suites sous Chromium Linux, script Mac `run_v4_tests_chrome.sh` non lancé | Règle « un test non lancé n'est pas passé » | Preuve de recette | M | Aucun score hérité repris dans le compte rendu A0. |
| E19 | `.gitignore` du dépôt : bloque xlsx, xlsm, xls, csv, pdf | `data_real.js`, `m1_pack.js`, `ref_*.js` sont du JavaScript contenant des données réelles | Lacune de garde-fou | H | Ajouter au `.gitignore` des motifs `data_real*`, `ref_reel*`, `ref_magasins*`, `communes_*`, `*_pack.js` et un test de contrôle (FIXTURES.md C3). **Mise à jour proposée, non appliquée** (hors docs/). |
| E20 | Cadrage : marque « Orangina » dans le titre du Workshop (« Workshop Prépa Orangina 2027 ») | Règle projet : Suntory seul, aucun mélange de clients | Marque du groupe | F | Orangina est une marque du périmètre Suntory selon le contexte du Workshop (déduit, non vérifié) : ne pas la reprendre comme client distinct. À confirmer. |
| E21 | V0.4 C.MODULES Comptes : trousseau hors ligne, rôles sans périmètre | D33/D34 : identité par l'IdP de l'agence | Sécurité V4 vs cible | M | Le module Comptes n'est pas repris ; seule sa politique de mot de passe sert de référence (D36 ouvert). |

## 3. Écarts de portée du lot A0 lui-même

| # | Constat | Gravité | Proposition |
|---|---|---|---|
| E22 | Le prompt A0 liste 7 sources ; `CONTRAT_MODULE`, `DESIGN_TOKENS` (00_PARTAGE) et `maquette_premium_V4.html` ne sont lus que partiellement (voir COMPTE_RENDU_A0.md) | M | Compléter la lecture au début de A1 pour la maquette (références de mise en page). |
| E23 | Le lot A0b (cadrage des données Excel, D50–D53) est placé avant A1 dans 03_LOTS_DEV mais absent du prompt A0 | M | A1 démarre après A0b validé (voir PLAN_A1_A7.md). |
| E24 | La demande du 23/10 « Claude Code met en aperçu les visuels pendant le développement » n'est pas encore une règle du dépôt | M | Mise à jour proposée : décision D104 + section « Aperçu » dans CLAUDE.md (PILE_PROPOSEE.md §5). |

## 4. Écarts découverts en préparant les jeux d'essai

| # | Source A | Source B | Nature | Grav. | Proposition |
|---|---|---|---|---|---|
| E25 | `04_JEUX_ESSAI_ET_RECETTE.md` : codes de DR de la V0.4 proposés pour les fixtures | V0.4 GLOSS : ces codes sont les **codes réels** des DR | Risque de donnée réelle dans les fixtures | H | Codes fictifs à motif distinct (FIXTURES.md §3). Corriger le fichier 04 (mise à jour proposée). |
| E26 | `04_JEUX_ESSAI_ET_RECETTE.md` : profil « Intervenant terrain » | D42 : aucun compte intervenant | Profil de démo périmé | M | Profil remplacé par « RS saisissant pour l'intervenant » (FIXTURES.md §4). |
| E27 | `04_JEUX_ESSAI_ET_RECETTE.md` : tests écrits « à partir de la présentation V0.2 » | Contenu à jour dans la V0.4 (W1–W22, D1–D7 relus) | Source périmée | F | Référencer la V0.4. |
| E28 | CLAUDE.md : libellés « Recrutement finalisé / Poste démarré » | D92 : états « Recruté / En poste » | Deux jeux de libellés pour les mêmes états | F | Libellé court et libellé long (GLOSSAIRE.md G2). |

## 5. Écarts issus de la lecture du code (23/10)

| # | Source A | Source B | Nature | Grav. | Proposition |
|---|---|---|---|---|---|
| E29 | Règle du projet : aucune donnée interne protégée par masquage dans le navigateur | M1/M2 : « mode Cliente » = bouton de masquage de menus | Contournable par l'utilisateur | H | Audience portée par la donnée (D108), voir INVENTAIRE_V4_CODE.md C-1, C-2 |
| E30 | Règle « aucun appel réseau sortant » | `maquette_premium_V4.html` charge des contours depuis un CDN externe | Appel externe dans la référence visuelle | M | Ne pas reprendre ce chargement ; contours embarqués localement |
| E31 | V0.4 et D54 : statuts séparés | M2 : statut de poste unique dérivé, « Pourvu » = date de prise de poste renseignée | Statuts condensés | M | Entonnoir D92 depuis les événements D91 |
| E32 | CLAUDE.md (règles non négociables) : aucune donnée réelle dans le dépôt, les fixtures, les logs, les prompts | D109 : découpe réelle utilisable pour la cartographie | Décision contraire à une règle non négociable | H | Dérogation encadrée par D109 bis ; mise à jour de CLAUDE.md proposée, non appliquée. Question restante : accord d'Impact et de la cliente pour l'usage de la découpe. |
| E33 | D31 : logos intégrés après levée de D25 | D113 : tous les logos utilisables | Droits non levés | M | Risque porté par le prestataire ; photo de couverture et image Suntory à recadrer restent à traiter (D75) |
