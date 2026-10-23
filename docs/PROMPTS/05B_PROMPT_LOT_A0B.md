# SUNTORY REFONTE V3 · Prompt du lot A0b (prêt à coller)

Version de travail du 23/10/2026. À coller après `02_PROMPT_MAITRE_DEV.md` et `00B_PROMPT_DE_LANCEMENT.md`. Lot **documents seulement** : aucun code, aucune installation, aucun classeur ouvert.

```text
LOT A0B · CADRAGE DES DONNÉES EXCEL (documents uniquement)

OBJECTIF
Transformer les documents de cadrage V0.1 du 22/10 (docs/COMPLEMENTS_CADRAGE/17 et 19) en référentiel
de données consolidé, vérifié contre le registre, directement utilisable par A2a (modèle de données),
A6 (import en quarantaine) et l'étape B (fichier branché, D51). Tu n'écris aucun code, tu n'installes
rien, tu n'ouvres aucun classeur.

À LIRE (dans cet ordre)
1. CLAUDE.md et docs/DECISIONS.md : D04, D11, D46, D50 à D57, D91, D92, D97 à D103, D106 à D113.
2. docs/COMPLEMENTS_CADRAGE/17_CADRAGE_DONNEES_EXCEL_V0.1.md (en entier, y compris l'addendum §9),
   19_DICTIONNAIRE_ET_EXPORTS_V0.1.md, 18_BROUILLON_DEMANDE_IT_IMPACT.md, 24 (échéances),
   26 (événements EV, rapports R, boucles AUT), 27 (photos).
3. REFONTE_V3/00_PARTAGE/CONTRAT_MODULE.md (en entier) et AUDIT_SAISIE_ONGLETS_COLONNES.md.
4. REFONTE_V3/ORIENTATION APPLICATION METIER/ fichier 03 (contrats Excel et prompts de normalisation).
5. docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/INVENTAIRE_V4_CODE.md, docs/ECARTS_A0.md.
Interdit : tout classeur .xlsx / .xlsm / .xls / .csv, y compris le fichier de 02_SAISIE_PARTAGEE (D52).
Sa structure est déjà relevée dans le doc 17 ; ne pas la revérifier en l'ouvrant. Si une information
de structure manque, la lister en question : je fournirai un squelette sans données.

TÂCHES
A. docs/DICTIONNAIRE_DONNEES.md
   Pour chaque table : BESOINS (45 colonnes), AFFECTATIONS, NON_COUVERTURE, SECTEURS, PARAMETRES,
   LISTES, JOURNAL, plus EVENEMENTS (D91) et PHOTOS (D98 à D103). Par colonne : nom technique
   (anglais, stable), libellé FR et EN, type, obligatoire, propriétaire d'écriture (cliente,
   agence, calculé, technique), source, règle de validation, sensibilité (personnelle, santé, coût),
   audience (D108), identifiant immuable (UUID) distinct du code lisible. Conserver les noms
   d'onglets et de tableaux existants. Aucune valeur réelle.
B. docs/MAPPING_SOURCES.md
   Pour chaque source (4C `T_FAITS` 43 colonnes, TBB positions fixes, Saisonnier, saisie partagée,
   classeur D52, listing, REF_CVR et REF_RS) : colonne source → colonne du dictionnaire, règle de
   transformation, risque. Appliquer D50 (TBB fait foi pour les montants du Permanent, 4C pour le
   détail des périodes). Traiter E1 à E11 du doc 17 : une ligne par écart, traitement proposé.
   Distinguer ce que tu as lu dans CONTRAT_MODULE de ce qui est à relire dans le fichier source.
C. docs/STATUTS_ET_ETATS.md
   Table de correspondance : statuts du classeur (8 dans le mode d'emploi, 5 dans Paramètres, 3 dans
   les données) ↔ statuts séparés (besoin, proposition, recrutement, exécution, finances, D54) ↔
   entonnoir D92 (6 états) ↔ « facturé ? » (doc 17 §9.4). Mettre en évidence les conflits
   (« Pourvu » du doc 17 §5.3 contre D92 « Pourvu = En poste »). Ne rien trancher : proposer.
D. docs/STRUCTURE_FICHIER_BRANCHE.md
   Structure cible du classeur branché, zones (à saisir, calculé, technique), règles d'écriture D51
   (concurrence, idempotence, aperçu, propriété des champs), options d'hébergement A à D du doc 17
   §9.3 avec recommandation. Toute affirmation sur Microsoft Graph, SharePoint ou Power Automate
   est marquée « non vérifié » tant qu'elle n'est pas confirmée par la documentation officielle
   (vérifie-la si tu disposes d'une recherche web, sinon laisse la mention). Reprendre la liste
   à remettre à l'IT d'Impact.
E. docs/FIXTURES_EXCEL.md
   Spécification des trois classeurs fictifs du lot A6 (import_ok : 20 lignes ; import_erreurs :
   date ambiguë, code inconnu, fin avant début, colonne manquante, colonne inconnue, formule dans un
   champ texte, ligne dupliquée ; import_ancien), alignée sur le dictionnaire : colonnes, feuille de
   métadonnées (version du contrat, empreinte, date d'observation), codes fictifs du motif
   docs/FIXTURES.md §3. Pas de génération ici.
F. docs/GLOSSAIRE.md : mettre à jour uniquement les lignes en conflit avec le doc 17 §5 (campagnes,
   territoire, cycle de vie, budget et carences) ; chaque modification référencée.
G. docs/COMPTE_RENDU_A0B.md

HORS PÉRIMÈTRE
Code, schémas Zod, fixtures JSON, scripts, installation, ouverture de classeurs, connecteurs
(GitHub en écriture, Supabase, Vercel), commit, push, envoi de message.

RÈGLES RAPPELÉES
- Données réelles interdites ; tarifs, budgets et carences fictifs étiquetés (le classeur D52 est un
  exemple à tarifs fictifs : ne pas les reprendre).
- Une hypothèse n'est pas une décision ; rien d'écrit comme décidé hors du registre.
- Aucun motif de santé dans un champ visible par la cliente (E11).
- Si un fichier est introuvable, illisible ou contradictoire : le signaler, ne pas combler.
- Chaque affirmation chiffrée reprise d'un ancien document est marquée « rapportée, non revérifiée ».

CRITÈRES D'ACCEPTATION
1. Les sept documents existent et renvoient à leurs sources.
2. Chaque colonne du dictionnaire a un propriétaire d'écriture, une sensibilité et une audience.
3. Chaque écart E1 à E11 a une ligne de traitement dans MAPPING_SOURCES.md.
4. Tous les conflits de statut sont listés dans STATUTS_ET_ETATS.md, aucun n'est tranché sans décision.
5. COMPTE_RENDU_A0B.md : sources lues, partielles, non lues (avec la raison), vérifications non
   exécutées, au plus huit questions classées par blocage avec une recommandation, mise à jour
   proposée du registre.
6. Aucun fichier modifié hors docs/. Aucun commit, aucun push.

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A1.
N'enchaîne pas sur A1.
```

## Pourquoi ce lot avant A1
- Le modèle de données (besoins, affectations, événements, statuts) est utilisé par tout le code ; le fixer en documents coûte moins cher qu'un changement de schéma en A2.
- Il résout par écrit les conflits de vocabulaire de statuts avant qu'ils entrent dans le code.
- Il prépare les classeurs fictifs du lot A6 sans ouvrir de donnée réelle.
