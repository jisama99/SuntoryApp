# SUNTORY REFONTE V3 · Lots de développement

Version de travail du 22/10/2026. Convention reprise de `PROMPTS_AJUSTEMENTS_V4` : un lot = une session, validation de T. SOEFOU entre deux lots, suites de tests relancées en fin de lot, compte rendu écrit.

Chaque lot se lance après le prompt maître (`02_PROMPT_MAITRE_DEV.md`). Les durées ne sont pas estimées ici : elles dépendent du volume et seront chiffrées après le lot A0.

## Étape A · Démonstrateur (données fictives)

| Lot | Objet | Dépend de |
|---|---|---|
| A0 | Lecture, état réel, pile, dépôt vide, jeux d'essai | Aucun (aucun code applicatif) |
| A1 | Socle : design V4, navigation par rôle, profils de démo | A0 validé |
| A2 | Saisie des besoins : unitaire, en lot, contrôles de semaine et doublons | A1 |
| A3 | Propositions, décisions, qui doit agir, urgence | A2 |
| A4 | Pilotage : tableau de bord, couleurs de quota, alertes, classement, filtres | A3 |
| A5 | Terrain mobile et absences génériques | A3 |
| A6 | Import Excel en quarantaine (fichiers fictifs) | A2 |
| A7 | Recette, script de démonstration, captures | A1 à A6 |

### Lot A0 · Lecture et mise en place (aucun code applicatif)
**Objectif.** Confirmer l'état réel des sources et préparer le dépôt.
**Tâches.**
- Lire `CLAUDE.md`, `docs/DECISIONS.md`, les trois fichiers du dossier `ORIENTATION APPLICATION METIER`, `DESIGN SYSTEM/design_system_suntory.md` et la maquette V4.
- Inventorier `06_MODULES_V4` (M1, M2, M3, SECURITE) : écrans, règles réutilisables, tests existants. Ne pas considérer leurs anciens comptes rendus comme des tests exécutés aujourd'hui.
- Proposer la pile (versions exactes, justification, alternatives) et la structure du dépôt. Renseigner la section « Commandes » de `CLAUDE.md` après validation.
- Écrire `docs/GLOSSAIRE.md` (libellés cibles) et `docs/FIXTURES.md` selon `04_JEUX_ESSAI_ET_RECETTE.md`.
**Hors périmètre.** Écrans, règles métier, authentification, base de données.
**Critères d'acceptation.** Compte rendu listant : sources lues et non lues, écarts entre spécifications et modules observés, pile proposée, questions pour T. SOEFOU.

### Lot A1 · Socle et navigation
**Objectif.** Un cadre d'application fidèle au design V4, utilisable sur ordinateur et mobile.
**Tâches.**
- Tokens et composants de base (boutons, champs, tableaux, étiquettes de statut, états vide, chargement, erreur, conflit).
- Navigation par profil de démo (cliente, agence, DR / CVR, RS terrain, administrateur) : le profil détermine les entrées et les données visibles via la couche de données, pas seulement l'affichage.
- Écran de connexion simulé avec profils de démo ; bandeau « DONNÉES FICTIVES » permanent.
- Internationalisation FR / EN (D27) : fichiers de traduction, sélecteur de langue, formats de date par langue, test qui échoue si une chaîne est en dur ou manquante dans une langue.
- Accessibilité : clavier, contraste, alternative aux couleurs.
**Critères d'acceptation.** Chaque profil ne voit que ses entrées et ses données ; test automatique inter-profils ; aucun profil n'affiche une donnée interdite, même dans les données chargées par la page.

### Lot A2 · Saisie des besoins
**Objectif.** Saisir vite et sans erreur (attentes A1, A2, A5 de la présentation).
**Tâches.**
- Saisie unitaire, duplication, saisie en lot (tableau multi-lignes, collage), brouillon automatique, résumé avant soumission.
- Règles pures et testées : semaine ISO déduite de la date, gestion de 2026-S53 et du passage à 2027-S01 ; 22 cas W1 à W22 ; 7 règles de doublon D1 à D7 (voir la présentation). Les cas « à arbitrer » sont paramétrables, pas figés.
- Alertes selon la position D22 / Q7 : D1 et D7 bloquants ; D2, D3, D5 en alerte ; D4 et D6 en information. Lien vers le besoin existant ; fusion, ajustement ou confirmation. Paramétrable, pas figé.
- Une période à compléter reste un brouillon et est exclue des totaux.
**Critères d'acceptation.** Tests table par table sur W1 à W22 et D1 à D7 ; un besoin incomplet ne peut pas être soumis ; une semaine clôturée refuse la modification.

### Lot A3 · Propositions, décisions, urgence
**Objectif.** Le circuit besoin → proposition → décision, visible par chaque acteur.
**Tâches.**
- Statuts séparés : besoin, proposition, recrutement, exécution (jamais un statut unique).
- Proposition versionnée ; une décision est liée à une version ; une nouvelle proposition dont les éléments déterminants changent invalide la décision précédente.
- « Qui doit agir », dates limites, niveau d'urgence, retard de proposition ; validation en lot.
- Prise de poste et remise du véhicule modélisées comme deux événements distincts (position D11) ; table de correspondance des anciens statuts provisoire, à valider avec la cliente.
**Critères d'acceptation.** Scénarios : refus, modification après accord, remplacement, deux propositions sur un besoin ; aucun accord obsolète conservé silencieusement.

### Lot A4 · Pilotage
**Objectif.** Lecture d'un coup d'œil sur données fictives.
**Tâches.**
- Tableau de bord par rôle : actions à traiter, indicateurs du périmètre, fraîcheur des données.
- Code couleur unique des quotas avec seuils paramétrables ; quotas permanent et saisonnier affichés « à définir » en gris (Q6 sans réponse) ; barre d'alerte segmentée avec clic = filtre.
- Classement des secteurs (pas des personnes) par taux de dépassement et par écart.
- Filtres DR, CVR (sélection multiple), RS, campagne, période ; vues enregistrées.
- Chaque indicateur : période, périmètre, unité, définition, date de calcul, détail des lignes selon les droits.
- Budget : « Non chiffré » et « Budget non renseigné » jamais affichés à 0 ; couverture avec numérateur et dénominateur.
**Hors périmètre.** Moteur financier réel (D05 à D07 ouverts) : le démonstrateur utilise des montants fictifs étiquetés.
**Critères d'acceptation.** Test : un coût manquant ne devient jamais 0 ; une ligne sans géolocalisation reste dans un groupe « Non géolocalisé » et dans les totaux.

### Lot A5 · Terrain mobile et absences
**Objectif.** Montrer le parcours terrain sans promettre le hors ligne définitif (D14, D15 ouverts).
**Tâches.**
- Missions du jour, saisie par l'intervenant au grain mission / site et jour (site, date, heures effectuées, anomalie), validation par le RS ou l'agence, résumé avant envoi, états « à synchroniser » et « synchronisé » simulés.
- Signalement d'absence en catégories génériques, sans motif de santé ni nom côté cliente ; statut Déclarée, Remplacement en cours, Couverte, Non couverte.
- KPI absences : définitions de la présentation (jours d'absence, jours sans couverture, taux de couverture, délai de remplacement, valorisation fictive).
**Critères d'acceptation.** Aucun champ de motif médical dans le modèle ni dans les fixtures ; une période clôturée refuse la saisie avec un message explicite.

### Lot A6 · Import Excel en quarantaine
**Objectif.** Démontrer le pont temporaire (position D04 / Q20).
**Tâches.**
- Import de fichiers fictifs (3 gabarits de `04_JEUX_ESSAI_ET_RECETTE.md`) : lecture sans macro ni lien externe, aperçu (créations, modifications, inchangés, rejets, conflits), validation humaine, rapport.
- Contrat commun du fichier `03_Contrats_Excel...` : empreinte, version du contrat, provenance fichier / onglet / ligne.
- Idempotence : le même lot réimporté ne crée aucun doublon. Conflit de version : refus d'écraser et présentation des deux versions.
- Un import agence ne modifie jamais une décision cliente ; un retour cliente ne modifie jamais un coût agence.
**Critères d'acceptation.** Tests d'idempotence, de fichier renommé au même contenu, de retour ancien, de formule dans un champ texte, de fichier trop volumineux.

### Lot A7 · Recette et démonstration
**Tâches.** Recette complète (parcours de `04_JEUX_ESSAI_ET_RECETTE.md`), script de démonstration pour la cliente (parcours, ordre, données), captures, liste des écarts, liste des décisions que la démonstration devra provoquer (Q1 à Q23).
**Critères d'acceptation.** Toutes les suites passent ou les écarts sont expliqués ; vérifications non exécutées listées ; mise à jour proposée du registre.

## Étape B · MVP (interdite sans « feu vert B »)

Conditions minimales avant de commencer (critère « prêt à coder » du cadrage) :
- Démonstrateur validé par la cliente et périmètre B arrêté (D03).
- Hébergement choisi et contractualisé, région exacte, sous-traitants listés (D02 / D19).
- Matrice de droits et visibilité des coûts validée (D08).
- Tarifs contractuels, budgets et convention de calcul approuvés (D05, D06, D07).
- Gabarits contractuels et référentiels obtenus (D24).
- Qualification RGPD amorcée avec les DPO (D17).

| Lot | Objet |
|---|---|
| B0 | Environnements, dépôt privé, intégration continue, secrets, sauvegardes |
| B1 | Authentification : invitation, réinitialisation par e-mail, MFA, révocation, audit |
| B2 | Modèle PostgreSQL, migrations, droits par organisation, territoire et champ, côté serveur |
| B3 | Référentiels datés et historique |
| B4 | Besoins, propositions, décisions, affectations (reprise des règles du démonstrateur) |
| B5 | Import réel en quarantaine, adaptateurs par axe, rapprochement |
| B6 | Moteur financier validé, budgets, alertes |
| B7 | Terrain réel selon décisions D14 / D15 |
| B8 | Reprise des données, pilote restreint, retour arrière |
| B9 | Sauvegarde et restauration testées, supervision, mise en service |
