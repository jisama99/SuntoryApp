# SUNTORY REFONTE V3 · Prompt du lot A4b (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A4a validé, seconde démonstration (hors noyau du 10/11).

```text
LOT A4b · ENVELOPPES ET RÉALLOCATION À DOUBLE VALIDATION

OBJECTIF
Enveloppes budgétaires fictives et réallocation entre périmètres : une partie propose, l'autre valide, l'effet est visible dans les autres espaces (D43, D46).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/16 et 26, décisions D43 et D46.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Modèle d'enveloppe fictif (montants étiquetés), rattaché aux niveaux DR et CVR (pas par secteur).
2. Réallocation : proposition par l'une des parties, validation par l'autre (double validation), historique complet.
3. Effet visible dans les espaces concernés après validation ; une réallocation refusée n'a aucun effet.
4. Règles d'allocation incomplètes (D43, D46) : paramètres par défaut proposés, non décidés.
5. Événements avec audience ; coûts masqués par défaut côté cliente, l'agence décide de leur affichage dans les exports.
6. Captures : docs/captures/A4b/.

HORS PÉRIMÈTRE
Moteur financier réel, tarifs contractuels, exports (A4c1), base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D43 et D46 : règles d'allocation à préciser avec T. SOEFOU et la cliente.
- D05 à D07 : montants fictifs uniquement.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Test : une réallocation exige deux acteurs distincts ; un refus ne change aucun montant.
3. Test d'audience sur les coûts et alertes.
4. Captures A4b, C1 à C7, docs/COMPTE_RENDU_A4B.md, mise à jour proposée du registre.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A4c1. N'enchaîne pas.
```
