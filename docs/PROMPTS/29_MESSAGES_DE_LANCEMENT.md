# Messages de lancement des lots (à coller en premier dans une nouvelle session Claude Code)

Version du 23/10/2026. Un lot par session. Le message impose de partir de `main` à jour, puis renvoie au prompt du lot. Ordre actuel du noyau : A1f, A3, A4b1, A4a, A5, A6, A7 ; seconde démonstration : A4b2, A4d, A4e, A4c1, A4c2, A5b ; ensuite A8 puis A9 (après validation de la démonstration et abonnement OVHcloud).

## Modèle commun

```text
LANCEMENT · LOT <CODE> · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient <DERNIERE_DECISION> et docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/<FICHIER_PROMPT>, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A1f (à lancer maintenant)

Remplacer dans le modèle : `<CODE>` par `A1f`, `<DERNIERE_DECISION>` par `D189`, `<FICHIER_PROMPT>` par `28_PROMPT_LOT_A1F.md`.

## Lot A3 (à lancer après fusion de A1f et validation de D183 à D187)

`<CODE>` = `A3`, `<DERNIERE_DECISION>` = `D189` (ou le dernier numéro inscrit après validation de D183 à D187), `<FICHIER_PROMPT>` = `12_PROMPT_LOT_A3.md`. Prérequis rappelés dans le prompt : A2b validé ; D162 (notes) intégrée à ce lot.

## Lots suivants

| Lot | `<FICHIER_PROMPT>` | Prérequis avant lancement |
|---|---|---|
| A4b1 | `23_PROMPT_LOT_A4B1.md` | A3 fusionné ; D07 (montants réels, sinon fictifs) |
| A4a | `13_PROMPT_LOT_A4A.md` | A4b1 fusionné |
| A5 | `14_PROMPT_LOT_A5.md` | A4a fusionné |
| A6 | `15_PROMPT_LOT_A6.md` | A5 fusionné |
| A7 | `16_PROMPT_LOT_A7.md` | A6 fusionné |
| A4b2 | `17_PROMPT_LOT_A4B.md` | Noyau fusionné et premier retour de démonstration |
| A4d, A4e, A4c1, A4c2, A5b | `21_`, `22_`, `18_`, `19_`, `20_` | Noyau fusionné ; A4e : jeu de contours ouvert à choisir et licence à consigner |
| A8 | `25_PROMPT_LOT_A8.md` | A7 fusionné ; adresse de notification en variable (D164) |
| A9 | `26_PROMPT_LOT_A9.md` | Démonstration validée et abonnement OVHcloud pris (D165) |

Après chaque lot : je relis la branche de session, j'exécute les contrôles dans le conteneur, je fusionne dans `main` et je pousse.
