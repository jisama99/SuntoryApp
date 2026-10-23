# SUNTORY REFONTE V3 · Règles communes aux lots A2 à A7 (état après A1)

Version du 23/10/2026. À coller dans Claude Code **entre** `02_PROMPT_MAITRE_DEV.md` et le prompt du lot. Elles complètent `CLAUDE.md` et ne le remplacent pas. En cas de contradiction : `CLAUDE.md`, puis `docs/DECISIONS.md`, puis ce document.

```text
RÈGLES COMMUNES (lots A2 à A7)

ÉTAT DU DÉPÔT APRÈS A1 (à vérifier, ne pas supposer)
- Pile : Next 16.4.2 (App Router, src/proxy.ts), React 19.3.1, TypeScript 6.0.3 strict, Tailwind 4.3.3,
  Zod 4.6.7, next-intl 4.14.9, Vitest 5.0.5, Playwright 1.64.1, ESLint 10.13.0, Node 22.
- Les sources de A1 ont été construites et testées dans une machine virtuelle Linux. Sur le poste :
  npm install, npx playwright install chromium, puis npm run typecheck, lint, test, test:e2e, build
  AVANT toute modification. Si un contrôle échoue, le signaler et le corriger en premier.
- Structure : src/domain (types, access, menu, contrast), src/data (schemas Zod, repository,
  memory-repository, fixtures JSON), scripts/fixtures-core.ts et generate-fixtures.ts (graine fixe),
  src/components (Icon, Tile, ZoneLabel, StatusTag, Button, Field, DataTable, States, AlertList...),
  src/lib (session, format, theme), src/i18n, messages/fr.json et en.json, tests/unit, tests/e2e, tests/shots.

CONVENTIONS À RESPECTER
1. Données : toute lecture passe par Repository avec un AccessContext. Aucun écran n'importe un fichier de
   fixtures. Toute nouvelle donnée fictive vient de scripts/fixtures-core.ts (déterministe) avec
   is_demo = true et les codes fictifs de docs/FIXTURES.md §3 (MAG-DEMO-nnn, INT-nnn, etc.).
2. Droits : filtrage par profil et par périmètre dans la couche données, jamais seulement à l'affichage.
   Toute alerte ou notification porte un champ audience (agency, client, both), défaut refus (D108).
3. Zones : affichage d'un code DR, CVR ou RS uniquement par ZoneLabel (D106).
4. Événements : chaque action métier émet un événement journalisé avec son audience (D91) ; les rapports
   des lots A4c lisent ce journal.
5. Règles métier : modules purs dans src/domain, testés table par table (Vitest). Les cas « à arbitrer »
   sont paramétrables, pas figés. Une hypothèse n'est pas une décision : elle est signalée dans le compte rendu.
6. Textes : tout texte passe par next-intl (FR et EN, mêmes clés). Aucun tiret, cadratin, demi-cadratin ni
   phrase antithétique dans les textes (D62, D63, test i18n).
7. Style (D123 à D126) : rendu clair et proche d'Apple, mode sombre conservé (Système, Clair, Sombre),
   cartes arrondies à ombre diffuse, AUCUN trait qui souligne, AUCUN trait droit décoratif (bordure de carte,
   séparateur, pointillé, barre latérale), aucun dégradé, aucune icône de style IA. Les tests
   tests/unit/style-rules.test.ts, icons.test.ts, contrast.test.ts et i18n.test.ts doivent rester verts.
   Seules exceptions : bordure de champ de saisie (contraste 3:1) et contour du bouton secondaire.
8. Couleurs : uniquement les jetons de src/app/globals.css, définis dans les deux modes et ajoutés à
   tests/unit/contrast.test.ts. Le rose n'apparaît que sur ce qui demande une action (composant Tile
   attention, étiquette « important »). Vert, ambre et rouge sont réservés aux statuts.
9. Icônes : uniquement via le composant Icon et src/components/icons.ts ; aucune taille ni épaisseur de
   trait réglée dans un écran.
10. Réseau : aucune requête externe (polices, icônes, cartes, scripts). Le test Playwright échoue sinon.
11. Chiffres affichés : « Non chiffré » ou « Non renseigné » ne deviennent jamais 0 (D05 à D07 ouverts :
    montants fictifs étiquetés, aucun moteur financier réel).

APERÇU ET PREUVES
- Après chaque étape visuelle : serveur local, navigateur intégré, capture, console et réseau vérifiés.
  Un écran non vérifié visuellement est déclaré comme tel.
- npm run preview:shots produit les captures du lot dans docs/captures/<lot>/ (profils concernés,
  FR et EN, 1440 et 390 px, mode clair, plus mode sombre sur les écrans principaux).
- Aucun test non lancé n'est déclaré passé. Reporter la sortie exacte de chaque commande.

GARDE-FOUS DE DONNÉES
- Aucune lecture de data_real*, ref_reel*, ref_magasins*, communes_*, *_pack.js ni de classeur Excel réel.
- C1 à C7 de docs/FIXTURES.md §5 relancés à chaque lot ; C3 signalé « non exécuté » sans .denylist.local.

GIT ET LIVRAISON
- Aucun commit ni push sans demande explicite de T. SOEFOU.
- Fin de lot : docs/COMPTE_RENDU_<lot>.md (réalisé, non réalisé, écarts, vérifications non exécutées,
  questions pour T. SOEFOU) et « mise à jour proposée » du registre (jamais écrite comme décidée).
- Récapitulatif de dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi
  avant le lot suivant. N'enchaîne pas.
```
