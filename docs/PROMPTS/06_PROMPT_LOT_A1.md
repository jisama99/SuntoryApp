# SUNTORY REFONTE V3 · Prompt du lot A1 (prêt à coller)

Version de travail du 23/10/2026. À coller dans Claude Code **après** `02_PROMPT_MAITRE_DEV.md`, dans le dépôt `08_PLATEFORME_SUNTORY_V3` (contenant `CLAUDE.md`, `docs/DECISIONS.md` D01 à D113, les documents du lot A0), avec `REFONTE_V3` accessible en lecture seule. Voir `00_DEMARRAGE_CLAUDE_CODE.md` pour la préparation du poste.

```text
LOT A1 · SOCLE, NAVIGATION PAR PROFIL, i18n, ACCESSIBILITÉ, APERÇU (premier code)

OBJECTIF
Poser le socle de la plateforme : projet initialisé, design V4 en charte mixte,
sept profils de démo, navigation par profil, interface FR / EN, composants communs
(ZoneLabel, contexte d'accès, alertes avec audience), couche de données Repository,
captures d'aperçu automatiques. Tu n'écris AUCUNE règle métier (semaine, doublons,
statuts, quotas : lots A2 et suivants) et AUCUN écran fonctionnel de saisie.

L'installation de dépendances est autorisée pour CE lot, limitée à la pile validée
(D105) et à une bibliothèque d'icônes (voir plus bas).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md et docs/DECISIONS.md (D104 à D113 en particulier).
2. docs/COMPTE_RENDU_A0.md, docs/PILE_PROPOSEE.md, docs/GLOSSAIRE.md, docs/FIXTURES.md,
   docs/PLAN_A1_A7.md, docs/INVENTAIRE_V4_CODE.md (§2 à §4), docs/ECARTS_A0.md.
3. REFONTE_V3/DESIGN SYSTEM/design_system_suntory.md, DESIGN SYSTEM/MAQUETTES_V4/
   maquette_premium_V4.html (lecture complète : non lue au lot A0) et
   00_PARTAGE/DESIGN_TOKENS.md. Charte et accès : docs/COMPLEMENTS_CADRAGE/14 et 15.
   Ne pas reprendre le chargement de contours depuis un CDN de la maquette.
4. Interdit en lecture : data_real*, ref_reel*, ref_magasins*, communes_*, *_pack.js,
   classeurs Excel de 01_SOURCE_SAISONNIER, 02_SAISIE_PARTAGEE, 04_TBB_SBFF.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Initialisation
   - .nvmrc (Node 22), package.json aux versions exactes de D105 (Next 16.4.2, React 19.3.1,
     TypeScript 6.0.3 strict, Tailwind 4.3.3, Vitest 5.0.5, Playwright 1.64.1, Zod 4.6.7,
     next-intl 4.14.9) ; fichier de verrouillage ; ESLint : tester ESLint 10.13.0 avec
     eslint-config-next 16.4.2, sinon repli ESLint 9 et le consigner.
   - Désactiver la télémétrie du framework : vérifier le nom exact dans la documentation
     officielle avant de l'écrire. Aucune requête externe (polices Inter et icônes locales).
   - Scripts : dev, typecheck, lint, test, test:e2e, preview:shots, build (noms de CLAUDE.md).
   - Bibliothèque d'icônes : essayer Lucide, Phosphor, Tabler (licences vérifiées au registre),
     en retenir une, documenter le choix. Aucune icône de style IA (D113) ; test sur une liste
     de noms interdits (étincelles, baguette, robot, cerveau, assistant).
   - Ne pas installer @axe-core/playwright (licence MPL-2.0, point P5 non tranché) :
     contrôles d'accessibilité par tests Playwright maison et revue manuelle.
2. Tokens et composants de base
   - Jetons de la charte mixte (Suntory dominant, rose Marvesting #E52365 sur éléments
     importants selon D30, règles de contraste du doc 14), Inter embarquée.
   - Boutons, champs, tableaux, étiquettes de statut, états vide / chargement / erreur / conflit.
   - Style doux (D62, D63) : formes arrondies. Test sur les fichiers de traduction FR et EN :
     aucun cadratin, aucune phrase antithétique repérable par motif.
3. Couche de données
   - Interface Repository qui reçoit toujours un contexte d'accès ; implémentation en mémoire
     sur fixtures JSON typées (schémas Zod). Aucun écran n'importe un fichier de fixtures.
   - scripts/generate-fixtures.ts déterministe (graine fixe) limité à : référentiel de zones
     (3 DR, 6 CVR, 12 RS, codes fictifs du motif FIXTURES.md §3, libellés de zone et noms de
     personnes fictifs), sept profils de démo, une dizaine d'alertes d'exemple de toutes
     audiences. Rien d'autre (les besoins viennent en A2).
4. Profils et navigation
   - Sept profils (FIXTURES.md §4). Sélecteur de profil simulé : cookie nommé et formaté
     distinctement d'une future session (jamais présenté comme authentification).
   - Entrées de menu et données déterminées par le profil via Repository, pas par l'écran.
   - Pages vides titrées par entrée de menu (aucun contenu fonctionnel).
5. ZoneLabel (D106)
   - Composant unique « libellé de zone · nom de la personne responsable · code ».
   - Test statique : aucun fichier ne rend un code DR / CVR / RS sans passer par ZoneLabel.
6. Contexte d'accès et alertes (D107, D108)
   - AccessContext : profil, périmètre, vocabulaire, langue ; titres, salutation et filtres
     par défaut en dérivent (D84 : repli sans nom inventé).
   - Alerte : champ audience obligatoire (agency, client, both), défaut refus.
   - Test inter-profils : pour chaque profil cliente, CVR, DR, RS, direction, Repository ne
     retourne aucune alerte agency (vérifié sur la donnée retournée, pas sur le DOM).
     Aucun « mode Cliente » par bouton de masquage.
7. Internationalisation (D27)
   - next-intl, FR et EN, sélecteur, dates selon la langue (stockage ISO, semaine 2026-S53).
   - Test d'exhaustivité : clé manquante dans une langue, chaîne en dur dans un composant.
8. Accessibilité
   - Clavier complet, focus visible, contraste des jetons calculé en test, alternative aux
     couleurs (forme ou texte) pour les statuts.
9. Bandeau « DONNÉES FICTIVES » permanent. Test Playwright : toute requête hors serveur
   local fait échouer le parcours.
10. Aperçu (D104)
   - npm run preview:shots : une capture par profil × langue × largeur (1440 et 390 px)
     dans docs/captures/A1/. Pendant le développement : serveur local, navigateur intégré,
     capture, console, requêtes réseau, après chaque étape visuelle.
   - Un écran non vérifié visuellement est déclaré comme tel.
11. Garde-fous de données (docs/FIXTURES.md §5)
   - Écrire et lancer C1, C2, C4, C5, C6, C7. C3 (empreintes) : prévoir le test, qui doit
     signaler « non exécuté » en l'absence du fichier local .denylist.local ; ne jamais
     lire de source réelle pour le produire.
12. Cartographie : HORS CODE. Écrire seulement docs/CARTOGRAPHIE.md : sources publiques
   (COG, table d'appartenance), contours à embarquer localement avec licence à vérifier
   (D25), importeur générique de la découpe locale selon D109 bis, découpage en lots.
   Aucune carte, aucun contour, aucun fichier de découpe lu.

HORS PÉRIMÈTRE
Règles de semaine ISO et de doublon, saisie des besoins, propositions, indicateurs, quotas,
carte, import Excel, export PPTX / PDF, photos, authentification réelle, base de données,
déploiement, commit, push, envoi de message.

RÈGLES RAPPELÉES
- Données fictives uniquement ; l'exception D109 bis ne concerne pas ce lot.
- Logos : emplacements prévus ; D113 autorise les logos fournis, mais A1 n'a pas besoin de les
  intégrer. Aucune signature, coordonnée ni logo d'agence ou de prestataire dans les écrans.
- Une hypothèse n'est pas une décision ; rien d'écrit comme décidé hors du registre.
- Aucun test non lancé n'est déclaré passé ; aucun ancien rapport n'est un test d'aujourd'hui.
- Si un fichier est introuvable, illisible ou contradictoire : le signaler, ne pas combler.
- Chaque ligne modifiée se rattache à une étape du lot (modifications chirurgicales).

CRITÈRES D'ACCEPTATION
1. npm run typecheck, lint, test, test:e2e, build exécutés ; sortie exacte reportée.
2. Sept profils fonctionnels ; test inter-profils sur les alertes et sur les entrées de menu.
3. Test statique ZoneLabel, exhaustivité i18n, cadratin, icônes interdites : tous présents.
4. Captures A1 : 7 profils × 2 langues × 2 largeurs, console vide, aucune requête externe.
5. Contrôles C1, C2, C4, C5, C6, C7 exécutés ; C3 signalé non exécuté si .denylist.local absent.
6. docs/COMPTE_RENDU_A1.md : réalisé, non réalisé, écarts, vérifications non exécutées,
   compatibilités constatées (ESLint, TypeScript), choix d'icônes, questions pour T. SOEFOU.
7. docs/CARTOGRAPHIE.md présent. Mise à jour proposée du registre, sans décision non validée.
8. Aucun commit, aucun push.

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi
avant A0b et A2. N'enchaîne pas.
```

## Pourquoi ce lot en premier
- Il rend visible un premier écran par profil dès la fin du lot, donc validable sans lire du code.
- Il fixe tôt les trois mécanismes transversaux demandés (noms à côté des codes, personnalisation uniforme, alertes par audience), qu'il serait coûteux de retrofiter.
- Il installe la boucle d'aperçu (D104) que tous les lots suivants réutilisent.
