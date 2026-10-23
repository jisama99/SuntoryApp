# Messages de lancement prêts à coller, un par lot

Version du 23/10/2026. **Un lot = une session Claude Code**, jamais deux lots dans la même session. Entre deux lots : Claude Code remet son compte rendu, je relis la branche de session, j'exécute les contrôles dans le conteneur, je te présente les propositions de registre en questionnaire, je fusionne dans `main` et je pousse ; le message du lot suivant se lance alors. Le dernier numéro du registre à indiquer dans le message est celui de `main` au moment du lancement (D189 aujourd'hui) : le mettre à jour si des décisions ont été inscrites entre-temps.

| Ordre | Lot | Prompt | Quand | Prérequis |
|---|---|---|---|---|
| 1 | A1f | `28_PROMPT_LOT_A1F.md` | Maintenant | Aucun, A1e est fusionné. |
| 2 | A3 | `12_PROMPT_LOT_A3.md` | Après fusion de A1f | A1f fusionné. |
| 3 | A4b1 | `23_PROMPT_LOT_A4B1.md` | Après fusion de A3 | A3 fusionné ; montants réels non fournis : jeux fictifs (D07). |
| 4 | A4a | `13_PROMPT_LOT_A4A.md` | Après fusion de A4b1 | A4b1 fusionné. |
| 5 | A5 | `14_PROMPT_LOT_A5.md` | Après fusion de A4a | A4a fusionné. |
| 6 | A4f | `30_PROMPT_LOT_A4F.md` | Après fusion de A5 | A5 fusionné. |
| 7 | A6 | `15_PROMPT_LOT_A6.md` | Après fusion de A4f | A4f fusionné. |
| 8 | A7 | `16_PROMPT_LOT_A7.md` | Après fusion de A6 (fin du noyau) | A6 fusionné. |
| 9 | A4b2 | `17_PROMPT_LOT_A4B.md` | Seconde démonstration, après retour sur le noyau | Noyau fusionné. |
| 10 | A4d | `21_PROMPT_LOT_A4D.md` | Seconde démonstration | Noyau fusionné. |
| 11 | A4e | `22_PROMPT_LOT_A4E.md` | Seconde démonstration | Noyau fusionné ; jeu de contours ouvert choisi, licence et attribution à consigner dans le lot (D150, D152). |
| 12 | A4c1 | `18_PROMPT_LOT_A4C1.md` | Seconde démonstration | Noyau fusionné. |
| 13 | A4c2 | `19_PROMPT_LOT_A4C2.md` | Seconde démonstration, après A4c1 | A4c1 fusionné. |
| 14 | A5b | `20_PROMPT_LOT_A5B.md` | Seconde démonstration | Noyau fusionné. |
| 15 | A8 | `25_PROMPT_LOT_A8.md` | Après le noyau | A7 fusionné ; adresse de notification en variable d'environnement (D164). |
| 16 | A9 | `26_PROMPT_LOT_A9.md` | Seulement après validation de la démonstration et abonnement OVHcloud (D165) | Démonstration validée par écrit, abonnement pris. Ce lot est le seul qui autorise un travail d'hébergement. |

## Lot A1f
_Maintenant. Prérequis : Aucun, A1e est fusionné._

```text
LANCEMENT · LOT A1f · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/28_PROMPT_LOT_A1F.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A3
_Après fusion de A1f. Prérequis : A1f fusionné._

```text
LANCEMENT · LOT A3 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/12_PROMPT_LOT_A3.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4b1
_Après fusion de A3. Prérequis : A3 fusionné ; montants réels non fournis : jeux fictifs (D07)._

```text
LANCEMENT · LOT A4b1 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/23_PROMPT_LOT_A4B1.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4a
_Après fusion de A4b1. Prérequis : A4b1 fusionné._

```text
LANCEMENT · LOT A4a · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/13_PROMPT_LOT_A4A.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A5
_Après fusion de A4a. Prérequis : A4a fusionné._

```text
LANCEMENT · LOT A5 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/14_PROMPT_LOT_A5.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4f
_Après fusion de A5. Prérequis : A5 fusionné._

```text
LANCEMENT · LOT A4f · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D190 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/30_PROMPT_LOT_A4F.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A6
_Après fusion de A4f. Prérequis : A4f fusionné._

```text
LANCEMENT · LOT A6 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/15_PROMPT_LOT_A6.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A7
_Après fusion de A6 (fin du noyau). Prérequis : A6 fusionné._

```text
LANCEMENT · LOT A7 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/16_PROMPT_LOT_A7.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4b2
_Seconde démonstration, après retour sur le noyau. Prérequis : Noyau fusionné._

```text
LANCEMENT · LOT A4b2 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/17_PROMPT_LOT_A4B.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4d
_Seconde démonstration. Prérequis : Noyau fusionné._

```text
LANCEMENT · LOT A4d · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/21_PROMPT_LOT_A4D.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4e
_Seconde démonstration. Prérequis : Noyau fusionné ; jeu de contours ouvert choisi, licence et attribution à consigner dans le lot (D150, D152)._

```text
LANCEMENT · LOT A4e · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/22_PROMPT_LOT_A4E.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4c1
_Seconde démonstration. Prérequis : Noyau fusionné._

```text
LANCEMENT · LOT A4c1 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/18_PROMPT_LOT_A4C1.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A4c2
_Seconde démonstration, après A4c1. Prérequis : A4c1 fusionné._

```text
LANCEMENT · LOT A4c2 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/19_PROMPT_LOT_A4C2.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A5b
_Seconde démonstration. Prérequis : Noyau fusionné._

```text
LANCEMENT · LOT A5b · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/20_PROMPT_LOT_A5B.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A8
_Après le noyau. Prérequis : A7 fusionné ; adresse de notification en variable d'environnement (D164)._

```text
LANCEMENT · LOT A8 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/25_PROMPT_LOT_A8.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.

Récapitule en dix lignes maximum.
```

## Lot A9
_Seulement après validation de la démonstration et abonnement OVHcloud (D165). Prérequis : Démonstration validée par écrit, abonnement pris. Ce lot est le seul qui autorise un travail d'hébergement._

```text
LANCEMENT · LOT A9 · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D189 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/26_PROMPT_LOT_A9.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu.
Exception à la règle « Vercel interdit » : seul l'hébergement OVHcloud décrit dans le prompt du lot est autorisé ; Supabase et Vercel restent interdits.

Récapitule en dix lignes maximum.
```

