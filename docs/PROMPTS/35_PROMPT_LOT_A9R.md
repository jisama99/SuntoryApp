# Lot A9r : réglages tactiles et mobile natif (règles M et N)

Version du 27/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Placé après A3c. Comportement uniquement : aucun changement de design (couleurs, typographie, composants, mise en page).

LECTURES : CLAUDE.md, docs/DECISIONS.md, docs/REGLES_MOUVEMENT_ET_MOBILE.md (règles M1 à M10, N1 à N10, écarts connus §4), tests/unit/motion-mobile-rules.test.ts, règle commune 16.

ÉTAPES (une à la fois, chacune suivie de sa vérification)
1. N1 : remplacer `min-h-screen` de `src/components/AppShell.tsx` par une hauteur en `dvh`. Vérifier qu'il n'existe aucun autre cas (recherche dans `src`).
2. N2 : `viewport-fit=cover` dans la déclaration de viewport de `src/app/layout.tsx` ; marges `env(safe-area-inset-*)` sur les barres fixes en haut et en bas uniquement.
3. N4 : `touch-action: manipulation` sur les éléments tactiles ; état `:active` seulement là où il manque, à partir des jetons existants (aucune couleur nouvelle).
4. N5 : `overscroll-behavior: contain` sur panneaux, tiroirs, feuilles et zones de défilement internes ; aucune gestion JavaScript.
5. Passer `it.todo` N2 en test réel ; mettre à jour le §4 du document de règles (écarts corrigés).

SOUMIS À ACCORD AVANT TOUT CHANGEMENT (changements visibles) : champs de saisie inférieurs à 16 px (N3) et `theme-color` clair et sombre (N7). Les lister avec capture avant, proposer la valeur, attendre la validation écrite de T. SOEFOU.

HORS LOT : jeu de données « pire cas » (règle P, validation séparée), tout changement de couleur, de typographie ou de composant, A4e, A4h.

CRITÈRES
1. Commandes de contrôle exécutées (typecheck, lint, test, test:e2e, build), sortie reportée ; un test non lancé est déclaré non lancé.
2. Captures docs/captures/A9r/ avant et après (FR et EN, 390 px et 1440 px, clair et sombre). Aucune différence visuelle attendue à 1440 px : le déclarer ou la justifier.
3. Appareils réels (Safari iOS, Chrome Android, clavier ouvert, paysage) : déclarés « non vérifiés sur appareil » s'ils ne l'ont pas été (N10).
4. Aucune donnée réelle ; aucune requête externe ; aucune dépendance ajoutée.
5. docs/COMPTE_RENDU_A9R.md, mise à jour proposée du registre (numéro attribué par la revue, hors D212 à D214 et D230 à D233).
6. Aucun commit sur main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
