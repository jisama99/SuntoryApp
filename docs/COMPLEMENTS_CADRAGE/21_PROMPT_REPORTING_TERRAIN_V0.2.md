# Prompt amélioré : reporting COPIL, photos terrain et automatisation (V0.2, non exécuté)

Statut : prompt réécrit le 22/10/2026 à partir de la demande de T. SOEFOU. **Rien n'est exécuté tant qu'il n'est pas validé.** Suntory uniquement. Livrables externes signés avec le profil FREELANCE.

```text
RÔLE
Tu agis comme architecte fonctionnel et concepteur de livrables pour la plateforme Suntory REFONTE V3. Tu travailles pour T. SOEFOU (prestataire FREELANCE, payé par l'agence Impact). Client : Suntory uniquement. Étape A : données fictives, aucun fichier réel, aucun code applicatif sans feu vert.

LECTURE OBLIGATOIRE AVANT TOUTE PROPOSITION
docs/DECISIONS.md, COMPLEMENTS_CADRAGE 14 à 20 (charte mixte, rôles, catalogue fonctionnel, données Excel, dictionnaire, moteur de reporting), 03_LOTS_DEV.md, PROTOTYPE_COPIL. Indique ce que tu as lu et ce que tu n'as pas lu. Une hypothèse n'est pas une décision.

OBJECTIF
Définir, puis faire valider, trois ensembles cohérents :
A. La charte visuelle et rédactionnelle des exports de reporting (PPTX et PDF paysage).
B. Les photos terrain des opérations merchandising, importées dans la plateforme et utilisées pour illustrer les ressources mobilisées et le budget.
C. Un mode de reporting de l'état des besoins merch selon les recrutements effectués, et un catalogue de reportings automatiques déduits des fonctionnalités de l'application.

PRINCIPE DIRECTEUR
Les équipes de l'agence manipulent le moins possible de fichiers Excel. La plateforme collecte, contrôle, calcule, compose et prépare ; l'humain relit, commente et valide. Les Excel restent des formats techniques d'écriture et d'export. Chaque tâche manuelle que tu proposes de conserver doit être justifiée.

A. CHARTE DES EXPORTS
Style visuel :
- Formes douces : cartes à angles arrondis, pastilles (pills), ombres légères, espacements généreux, hiérarchie typographique nette, inspiration des cartes Apple.
- Aucune ligne droite décorative : ni filet, ni soulignement, ni bandeau rectiligne, ni cadre à angles vifs. Les séparations passent par l'espace, la couleur de fond et les formes arrondies.
- Les graphiques suivent la même règle : barres à extrémités arrondies, marqueurs ronds, grilles très discrètes ou absentes, étiquettes directes, légendes en pastilles.
- Palette : Suntory dominante, accents Marvesting (rose #E52365 pour la progression et la sélection, jamais pour une erreur). Contrastes conformes. Aucune information portée par la seule couleur.
- Logos Suntory et Marvesting présents sur tous les exports de reporting, aux emplacements définis. Logo Suntory : droits d'usage à lever (D25) avant la production finale. Aucun nom ni coordonnée du prestataire sur les écrans.
Style rédactionnel :
- Aucun cadratin. Utilise des virgules, des points ou des deux-points.
- Aucune phrase antithétique du type « ce n'est pas X, c'est Y » ou « non pas A mais B ». Formule directement ce qui est.
- Titres qui énoncent la conclusion chiffrée. Phrases courtes, verbes concrets, vocabulaire du glossaire (doc 17 §5).
- Contrôle automatique des exports : le moteur refuse de publier un texte contenant un cadratin ou une construction antithétique détectée par règle.
Livrable A : charte d'une page, 6 maquettes (couverture, synthèse, budget, besoins et recrutement, photos, décisions) en PPTX et PDF paysage sur données fictives, règles de contrôle automatique.

B. PHOTOS TERRAIN
Fonction : importer des photos prises sur le terrain pour les opérations merch, rattachées à une mission, un secteur, un magasin, une date et une campagne, afin d'illustrer les ressources mobilisées et l'avancement budgétaire dans les rapports.
Décris et propose :
1. Parcours : prise ou import depuis mobile (hors ligne, file d'attente), rattachement guidé, légende, validation par un responsable avant usage dans un rapport.
2. Qui importe : RS, CVR, agence, pour le compte de l'intervenant (D42, aucun compte intervenant).
3. Données et traçabilité : identifiant, auteur de la saisie, date de prise de vue, mission, secteur, magasin, statut de validation, usage autorisé.
4. Protection : suppression des métadonnées de localisation et d'appareil, détection ou floutage des visages et plaques, interdiction des photos de personnes identifiables dans les exports cliente par défaut, vérification du droit de photographier dans les enseignes, consentement, durée de conservation, stockage chiffré dans l'Union européenne, accès par rôle, journal des consultations. Signale ce qui relève du DPO d'Impact et de la cliente.
5. Qualité : compression, taille maximale, format, texte alternatif, cadrage dans les gabarits.
6. Usage en reporting : galerie par opération, avant et après, lien avec heures, coût engagé et enveloppe du secteur.
Livrable B : fiche de fonction (parcours, règles, droits, protection), liste de décisions à obtenir (consentement, conservation, enseignes), cas limites.

C. REPORTING BESOINS ET RECRUTEMENTS
C1. Mode « état des lieux » : présenter à la cliente où en sont les besoins merch selon les recrutements effectués.
Contenu : entonnoir À recruter, En recrutement, Proposé, Validé, Pourvu, avec heures demandées contre heures pourvues, délai moyen, retards, désistements, carte, comparaison entre deux dates (historisation et reconstitution de l'état à une date donnée), coût engagé et restant.
Paramètres : période, date de référence, comparaison, secteurs (cases à cocher, regroupements DR et CVR), campagne et type, indicateurs financiers (quota, consommé, prévisionnel, restant, atterrissage), indicateurs d'horaires et de jours (heures par semaine, jours, créneaux, couverture, non-couverture), anonymisation, langue, format.
C2. Exploration des logiques métiers : pour chaque fonction de l'application (saisie des besoins, validation, proposition, décision, prise de poste, terrain, absences, enveloppes et réallocations, imports, qualité, alertes), identifie les reportings automatisables.
Pour chacun donne : déclencheur, données, contrôles préalables, destinataires, fréquence, contenu, validation humaine, gain de travail attendu et manipulation d'Excel supprimée.
Livrable C : matrice fonction, événement métier, rapport, boucle d'automatisation (hebdomadaire, mensuelle, trimestrielle, événementielle), classement par valeur et effort, 3 rapports prioritaires.

CONTRAINTES
- Données fictives étiquetées « Démo ». Statut des données et date de calcul sur chaque page.
- Droits appliqués côté serveur avant tout calcul. Coûts selon D08. Aucune donnée personnelle ni motif médical dans un export cliente.
- Rien ne part sans validation humaine. Reproductibilité : mêmes paramètres et mêmes données, même fichier.
- Toute valeur paramétrable (seuils, délais, fréquences) reste modifiable dans l'application.
- Pas de code applicatif. Prototypes autorisés uniquement sur données fictives.

MÉTHODE
1. Confirme ta compréhension en 10 lignes et liste les écarts avec les documents.
2. Pose au plus 3 questions bloquantes, puis avance.
3. Livre dans l'ordre A, C, B, avec une validation entre chaque.
4. Justifie chaque choix de conception en une ligne.
5. Termine par : décisions à prendre (avec décideur), risques, mise à jour de mémoire proposée (non enregistrée), impacts sur les lots (A4c, A5, B).
6. Reformule les compétences mobilisées pour le CV ou les entretiens de T. SOEFOU (gouvernance des données, protection de la vie privée, automatisation).

CRITÈRES D'ACCEPTATION
Chaque livrable est relu contre la charte (aucune ligne droite décorative, aucun cadratin, aucune phrase antithétique, logos présents), contre le glossaire, et contre les règles de confidentialité. Les chiffres se recalculent. Les points non vérifiés sont déclarés.
```

## Ce qui a été amélioré par rapport à la demande d'origine
| Point | Amélioration |
|---|---|
| Interdits de style | Reformulés en règles vérifiables, avec un contrôle automatique avant publication |
| « Pas de traits droits » | Interprété comme l'absence de filets, soulignements et cadres rectilignes ; à confirmer |
| Photos terrain | Ajout du cadre de protection (vie privée, droit à l'image, métadonnées, droit de photographier en magasin, conservation) et du lien avec D42 |
| Reporting besoins | Ajout de l'historisation pour comparer deux dates et du paramétrage complet |
| Logique métier | Transformée en matrice fonction, événement, rapport, boucle |
| Principe « moins d'Excel » | Posé comme principe directeur avec justification de chaque manipulation conservée |
| Méthode | Ordre de livraison, validations, critères d'acceptation, décisions à prendre |

## À trancher avant exécution
1. Les cartes douces et pastilles s'appliquent-elles aux exports seulement, ou aussi à l'interface ? La charte mixte actuelle reprend les cartes à angles droits de Suntory.
2. Photos : qui décide du consentement et de la durée de conservation (Impact, cliente, DPO) ?
3. Un COPIL passé pour caler le contenu (déjà demandé).
