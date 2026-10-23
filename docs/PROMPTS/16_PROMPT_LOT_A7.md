# SUNTORY REFONTE V3 · Prompt du lot A7 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A1 à A6 validés (noyau de la démonstration du 10/11/2026, D110).

```text
LOT A7 · RECETTE, SCRIPT DE DÉMONSTRATION, CAPTURES

OBJECTIF
Recette complète, script de démonstration pour la cliente (parcours, ordre, données), jeu de captures, liste des écarts et liste des décisions que la démonstration doit provoquer (Q1 à Q23).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/PROMPTS/04_JEUX_ESSAI_ET_RECETTE.md (parcours de recette), docs/ECARTS_A0.md, tous les comptes rendus A1 à A6.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Exécuter la recette parcours par parcours ; chaque parcours : résultat attendu, résultat obtenu, preuve (capture ou sortie).
2. Script de démonstration : ordre des profils, données à montrer, phrases à ne pas dire (aucune promesse de hors ligne,
   de moteur financier ni de données réelles), durée non estimée.
3. Jeu complet de captures dans docs/captures/A7/ (profils, FR et EN, bureau et mobile, clair et sombre).
4. Liste des décisions à provoquer (Q1 à Q23) avec le décideur et la page qui les illustre.
5. Vérifications non exécutées listées (C3, essais sur Mac, navigateurs non testés).
6. Mise à jour proposée du registre et liste des écarts restants.

HORS PÉRIMÈTRE
Nouvelle fonctionnalité, correction hors recette (les anomalies sont listées, corrigées seulement si bloquantes et après accord), déploiement public.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- Hébergement du démonstrateur : local par défaut (D02 / D19) ; Vercel seulement pour aperçus fictifs (D114).
- Découpe réelle : démonstration sur le poste du prestataire uniquement (D109 bis), accord d'Impact et de la cliente requis.

CRITÈRES D'ACCEPTATION
1. Toutes les suites passent ou les écarts sont expliqués ; sortie reportée.
2. Script de démonstration relu parcours par parcours avec captures.
3. docs/COMPTE_RENDU_A7.md et docs/SCRIPT_DEMONSTRATION.md présents.
4. Design et navigation (règles 14 à 16, D151, D159) : chaque écran du lot a son état dans l'URL (retour arrière, rechargement, lien profond testés), ses trois états (squelette, vide, erreur), ses tableaux en cartes sous 640 px, ses transitions sobres, sa confirmation annulable après écriture, ses cibles de 44 px ; aucune valeur de style en dur ; seuils de performance mesurés et reportés (2 s, 100 ms) ; captures 390 px.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant la démonstration. N'enchaîne pas.
```
