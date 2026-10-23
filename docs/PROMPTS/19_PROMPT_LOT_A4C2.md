# SUNTORY REFONTE V3 · Prompt du lot A4c2 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A4c1 validé.

```text
LOT A4c2 · ÉTAT DES BESOINS ET RECRUTEMENTS (R-01), BOUCLES D'AUTOMATISATION, HORLOGE

OBJECTIF
Rapport R-01 (état des besoins et recrutements), boucles d'automatisation AUT-06 à AUT-11 en file validée (rien n'est envoyé automatiquement), horloge de démonstration, instantané hebdomadaire.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/26 (§7 en particulier), 12 (automatisations), 21 et 24.
4. Décisions D90 à D97.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Horloge de démonstration avançable (jour, semaine) ; toutes les dates calculées à partir d'elle.
2. Instantané hebdomadaire des indicateurs ; lecture du journal d'événements émis depuis A2 et A3.
3. R-01 : état des besoins et recrutements par situation (pas de moyenne unique de délai), mode recrutements.
4. Boucles AUT-06 à AUT-11 : déclencheurs, destinataires, contenu ; les messages restent dans une file validée par
   l'agence pendant deux cycles d'essai ; aucun envoi réel.
5. Rappel de saisie au jour J pour les retardataires, résumé du lundi à la cliente sans chiffres avec lien vers l'application.
6. Audience : aucun message ni rapport cliente ne contient une alerte agence.
7. Captures : docs/captures/A4c2/.

HORS PÉRIMÈTRE
Envoi réel de courriels ou de messages, connecteurs externes, base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D93, D94, D96 : seuils et délais à confirmer ; paramètres par défaut proposés.
- Objectif de 80 % de travail administratif évité : mesuré sur deux cycles, pas déclaré atteint.

CRITÈRES D'ACCEPTATION
0. Anglais (D149) : e-mails, file d'automatisation et R-01 disponibles en EN, mêmes tests que A4c1.
1. Commandes de contrôle exécutées, sortie reportée.
2. Test : la file validée n'envoie rien ; une alerte agence n'entre dans aucun message cliente.
3. Test de l'horloge : avancer d'une semaine met à jour instantané, rappels et échéances.
4. Captures A4c2, C1 à C7, docs/COMPTE_RENDU_A4C2.md, mise à jour proposée du registre.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A5b. N'enchaîne pas.
```
