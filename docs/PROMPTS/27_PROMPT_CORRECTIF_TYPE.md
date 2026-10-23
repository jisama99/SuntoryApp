# Prompt type : mini-lot de correctif (D166)

À coller dans Claude Code après `02_PROMPT_MAITRE_DEV.md` et `07_REGLES_COMMUNES_LOTS_APRES_A1.md`. Remplacer les crochets.

Correctif [BUG-n]. Dépôt 08_PLATEFORME_SUNTORY_V3, main à jour. Crée la branche fix/[n].

FICHE : [coller la fiche de bug : page, profil, langue, appareil, étapes pour reproduire, résultat attendu, gravité].

1. Reproduis le bug. Si tu n'y arrives pas, arrête-toi et dis pourquoi.
2. Écris d'abord un test qui échoue et décrit le bug.
3. Corrige au minimum, sans refonte ni changement hors sujet.
4. Lance toute la suite (typecheck, lint, tests unitaires, e2e, style, contraste, i18n) et reporte la sortie.
5. Si le bug touche l'audience (contenu agence vu côté cliente), relance le test d'audience et signale-le en tête de ton compte rendu.
6. Libellés FR/EN selon le glossaire ; règles 14 à 16.
7. Compte rendu docs/COMPTES_RENDUS/FIX-[n].md : cause, correctif, test ajouté, risques ; note de version FR et EN proposée.
8. Aucun commit sur main, aucune pull request. Commit et push de la branche de session seulement (D148).
