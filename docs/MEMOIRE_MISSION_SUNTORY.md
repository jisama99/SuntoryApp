# Mémoire de mission · Suntory (Refonte V3)

Relevé du 31/10/2026. Confirmé par T. SOEFOU le 31/10/2026. Ne jamais mélanger avec un autre client.

## État du dépôt (relevé en lecture seule)
- Étape A (démonstrateur sur données fictives) en cours. L'étape B reste interdite sans « feu vert B » écrit dans `docs/DECISIONS.md` (non vérifié lors de ce relevé).
- Dernier lot fusionné dans `main` : A4b1 (28/10/2026, D244 à D249). Lots A3c, A3d et A9r également fusionnés.
- Lots A4a, A5 et A6 (noyau de la démonstration du 10/11, D110) : aucun compte rendu ni commit visible lors du relevé.
- Démonstration du 10/11/2026 : date indicative (D26 ouvert).

## Direction design
- Direction validée le 31/10/2026 : 60 % Marving, 20 % Suntory, 20 % esprit Apple. Détail, palettes, icônes (celles du code), police et versions V2 et V3 pour revue : `docs/COMPLEMENTS_CADRAGE/31_DIRECTION_DESIGN_60_20_20_V0.2.md`. Numéros D250 à D253 provisoires, registre non mis à jour.

## Points à traiter
1. Auditer les 17 branches (12 `claude/...`, 4 `revue/...`, `main`) : comparer chacune à `main`, lister celles déjà fusionnées.
2. Vérifier la pull request n°1 : l'API la donne fermée et non fusionnée, alors que `main` contient un commit « Merge pull request #1 ».
3. Mettre à jour `CLAUDE.md` (daté du 22/10/2026) pour refléter l'amendement D191 et la nouvelle direction design.
4. Contrôler l'absence de données réelles dans le dépôt (contrôles C1 à C8, `docs/FIXTURES.md`).
5. Revue des aperçus V2 et V3 par une session Claude Code.

## Décisions et hypothèses
- Pas de Supabase ni de Vercel avant un feu vert B et une décision d'hébergement écrite (D114, D115, D165).
- Signature des livrables externes : FREELANCE (D28, D49) selon le registre ; à reconfirmer à chaque livrable.

## Limites du relevé
Lu : racine, `CLAUDE.md`, liste de `docs/`, registre des décisions (copie Drive du 22/10, arrêtée à D243), docs 25, 28 et 30, `icons.ts`, `Icon.tsx`, `menu.ts`, commits, branches, pull requests. Non lu : le reste de `src/`, `tests/`, les comptes rendus, le contenu du zip du skill ui-ux-pro-max. Aucun test exécuté.
