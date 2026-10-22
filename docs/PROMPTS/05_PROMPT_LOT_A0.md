# SUNTORY REFONTE V3 · Prompt du lot A0 (prêt à coller)

Version de travail du 22/10/2026. À coller dans Claude Code **après** `02_PROMPT_MAITRE_DEV.md`, dans un dépôt contenant `CLAUDE.md` à la racine et `docs/DECISIONS.md` (copie de `01_REGISTRE_DECISIONS.md`), avec `REFONTE_V3` accessible en lecture seule.

## Avant de lancer
1. Créer un dépôt vide et y copier `CLAUDE.md` et `docs/DECISIONS.md`.
2. Donner accès à `REFONTE_V3` en lecture seule.
3. Ne pas lancer d'installation de dépendances ni de génération d'application : le lot A0 ne produit que des documents.

```text
LOT A0 · LECTURE, ÉTAT RÉEL ET MISE EN PLACE (aucun code applicatif)

OBJECTIF
Confirmer ce qui existe réellement, décider avec moi de la pile, et préparer
les documents qui serviront aux lots A1 à A7. Tu n'écris aucun écran, aucune
règle métier, aucune configuration d'application et tu n'installes aucune
dépendance.

SOURCES À LIRE (lecture seule, dans cet ordre)
1. CLAUDE.md et docs/DECISIONS.md du dépôt.
2. REFONTE_V3/ORIENTATION APPLICATION METIER/ : les trois fichiers
   (prompt maître avant codage, dossier de cadrage, contrats Excel).
3. REFONTE_V3/PROPOSITION CLEINTE VIA AGENCE/ : présentation cliente V0.4
   (HTML : lire le contenu des données C.* dans le script) et le Workshop 2027 (PDF).
4. REFONTE_V3/DESIGN SYSTEM/ : design_system_suntory.md et la maquette
   MAQUETTES_V4/maquette_premium_V4.html. Ne pas lire les gabarits PowerPoint.
5. REFONTE_V3/06_MODULES_V4/ : M1, M2, M3, SECURITE (HTML livrables et dossiers
   sources/), 00_BASELINE, 00_REF_GEO (structure seulement).
6. REFONTE_V3/PROMPTS_AJUSTEMENTS_V4/ : 00_LISEZ_MOI_ET_REGLES.md et les
   comptes rendus de lot.
7. REFONTE_V3/DEVIS_CONFORMITE/ : CADRAGE_CONFORMITE.md, CARTOGRAPHIE_DONNEES.md,
   QUESTIONS_OUVERTES.md.

Ne pas ouvrir les classeurs Excel de 01_SOURCE_SAISONNIER, 02_SAISIE_PARTAGEE et
04_TBB_SBFF. Le dossier 03_PILOTAGE_4C est vide : le signaler. Ne copie aucune
valeur de ces fichiers ni du référentiel magasins dans le dépôt.

TÂCHES
A. Inventaire des modules existants (docs/INVENTAIRE_V4.md)
   Pour M1, M2, M3 et SECURITE : écrans, règles de calcul, stockage, imports,
   exports, permissions, tests présents. Distinguer ce que tu as lu dans le code
   de ce que tu as lu dans un compte rendu. Lister les règles réutilisables
   (semaine, quotas, statuts, qui doit agir) avec le fichier source.

B. Écarts (docs/ECARTS_A0.md)
   Écarts entre : la présentation V0.4, le cadrage, le registre de décisions et
   les modules observés. Une ligne par écart : source A, source B, nature,
   gravité, question à poser. Ne pas trancher ; proposer.

C. Proposition de pile (docs/PILE_PROPOSEE.md)
   Pile pour le démonstrateur (étape A) ET compatible avec l'étape B :
   framework, interface de dépôt de données (Repository), tests, internationalisation
   FR / EN, accessibilité, build statique ou serveur. Pour chaque choix : versions
   exactes vérifiées sur la source officielle, justification, alternative écartée
   et raison, coût d'exploitation connu ou inconnu. Ne pas inventer de version,
   de prix ou de licence ; si une information n'est pas vérifiable, le dire.
   Prévoir ce qui change entre l'étape A et l'étape B pour éviter une réécriture.
   Remplir la section « Commandes » de CLAUDE.md en proposition, sans l'exécuter.

D. Glossaire (docs/GLOSSAIRE.md)
   Libellés cibles FR et EN pour chaque terme de CLAUDE.md et de la présentation
   (tableau de bord, actions à traiter, recrutement finalisé, poste démarré,
   remise du véhicule, etc.). Terme actuel, terme cible FR, terme cible EN, source.

E. Jeux d'essai (docs/FIXTURES.md)
   Plan de génération des données fictives selon
   04_JEUX_ESSAI_ET_RECETTE.md : volumes, cas, profils de démo, 3 fichiers Excel
   fictifs du lot A6. Plan seulement, pas de génération. Inclure la méthode de
   contrôle qui prouvera qu'aucune valeur réelle n'est entrée dans le dépôt.

F. Plan de lots A1 à A7 ajusté (docs/PLAN_A1_A7.md)
   Reprendre 03_LOTS_DEV.md ; signaler tout lot à scinder, toute dépendance ou
   décision ouverte qui le bloque ; ne pas estimer de durée.

HORS PÉRIMÈTRE
Écrans, composants, règles métier, authentification, base de données, génération
de l'application, installation de dépendances, commit, push, envoi de message.

RÈGLES RAPPELÉES
- Données réelles interdites, tarifs et budgets fictifs étiquetés.
- Une hypothèse n'est pas une décision ; ne rien écrire comme décidé hors du registre.
- Signature : aucun logo, nom ou coordonnée dans les écrans ; ne pas utiliser l'adresse
  de contact du registre ailleurs que dans un bloc de signature de document externe.
- Ne pas considérer un ancien rapport de test comme un test exécuté aujourd'hui.
- Si un fichier est introuvable, illisible ou contradictoire : le signaler, ne pas combler.

CRITÈRES D'ACCEPTATION
1. docs/COMPTE_RENDU_A0.md liste : sources lues intégralement, partiellement, non lues
   (avec la raison), et toute vérification non exécutée.
2. Les cinq documents C à F et A, B existent et renvoient à leurs sources.
3. La pile est proposée avec versions vérifiées ou marquées « non vérifié ».
4. Au plus dix questions pour T. SOEFOU, classées par blocage, chacune avec une
   recommandation.
5. Une mise à jour proposée du registre de décisions (« mise à jour proposée »),
   sans décision non validée.
6. Aucun fichier du dépôt en dehors de docs/ et de la proposition de commandes dans CLAUDE.md.

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu
attends de moi avant A1. N'enchaîne pas sur A1.
```

## Pourquoi ce lot en premier
- Il force la lecture des modules V4 et du design avant de choisir une pile, au lieu de repartir d'un modèle générique.
- Il sépare la décision de pile (la tienne) de la proposition de Claude Code, avec des versions vérifiées et non inventées.
- Il prépare les documents (glossaire FR/EN, jeux d'essai, plan ajusté) sur lesquels reposent A1 à A7, sans écrire de code.
