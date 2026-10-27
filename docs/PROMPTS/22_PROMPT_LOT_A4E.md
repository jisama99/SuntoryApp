# Lot A4e : carte de France interactive (D150)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt. Dépend de A4a. Accords obtenus (D152) : D25 levé pour la carte, usage de la découpe autorisé. Reste : contours. Les modules V4 embarquent déjà des tracés de départements (`W.FRANCE` dans M1) : T. SOEFOU en fournit l'extraction et l'origine ; à défaut d'origine et de licence consignées, utiliser un jeu ouvert.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D25, D109 bis, D116, D150, D151, D152), docs/CARTOGRAPHIE.md, F-10.6 du catalogue (doc 16), docs/COMPTE_RENDU_A4A.md, docs/propositions/PROPOSITION_CARTE_BOUTEILLES_V0.1.md, aperçu docs/propositions/APERCU_CARTE_BOUTEILLES_V0.1.html, script docs/propositions/outils/simplifier_contours_departements.py.

ÉTAPES
1. Contours des départements embarqués en local (réutilisation des tracés V4 si origine et licence établies) (aucune requête externe), sur zones et magasins fictifs ; licence confirmée avant tout contour.
2. Carte : zoom et déplacement fluides (souris, molette, tactile, pincement), survol, clic, sélection de région, département, magasin, enseigne.
3. Retour « France entière », fil d'Ariane, Échap, groupe « Non géolocalisé » (F-10.6).
4. Sélection synchronisée avec filtres et URL (règle 14) ; ZoneLabel pour tout code de zone ; audience respectée.
5. Clavier complet, focus visible, mouvement réduit, 390 px ; tableau des zones équivalent toujours disponible.
6. Importeur générique de découpe locale (D109 bis, D152) : chemin par variable d'environnement vers le dossier local des départements, schéma Zod, rejet des colonnes inattendues, bandeau « DONNÉES RÉELLES LOCALES ». Tests sur fichiers SYNTHÉTIQUES uniquement ; tu ne lis jamais les fichiers réels : T. SOEFOU les branche en local.
7. Bouteilles sur la carte (L1 et L3, validées le 26/10/2026) : une bouteille par besoin, posée sur son département ; le visuel de bouteille Orangina est fourni par T. SOEFOU (dossier LOGOS du poste ; accord d'usage déclaré le 26/10/2026) et copié par lui dans le dépôt à un emplacement convenu au début du lot ; tu ne lis pas ce dossier. Bouteille grisée = reste à faire, couleur = étape D92 atteinte, pastille avec le numéro d'étape, pastille rouge si retard. Taille : 46 px (38 px sous 560 px de large), 58 px (46 px) après zoom sur un secteur, zone de clic de 44 x 44 px au moins, écart de 1,4 largeur entre bouteilles d'un même département. Clic ou Entrée : détail du besoin ; filtres par étape ; tableau équivalent toujours disponible ; couleur jamais seule. Aucun défi, badge ni habillage ludique.
8. Contours (L2) : T. SOEFOU fournit le fichier de contours simplifié (sortie du script `simplifier_contours_departements.py`, environ 370 Ko, métropole et Corse) ; origine et licence déclarées validées le 26/10/2026, sans nouvelle vérification de ta part. Tu ne lis jamais le dossier « FICHIERS POUR DEPARTEMENTS » ni les listings et découpes réels : chemin par variable d'environnement, schéma Zod, tests sur GeoJSON SYNTHÉTIQUE uniquement. Départements d'outre-mer : à demander, non décidé.

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests : interactions clavier, URL partagée restitue la sélection, Échap, groupe non géolocalisé, FR et EN.
3. Performance H3 mesurée (interaction sous 100 ms, hypothèse) et reportée, sans la présenter comme exigence décidée.
4. Captures docs/captures/A4e/, C1 à C7, docs/COMPTE_RENDU_A4E.md, mise à jour proposée du registre.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
9. Parité avec la carte du M1 V4 et compléments (section 7 de `docs/propositions/PROPOSITION_CARTE_BOUTEILLES_V0.1.md`, aperçu `APERCU_CARTE_BOUTEILLES_V0.3.html`) : niveaux département, région, CVR, DR ; calques Besoins, Magasins, Indicateur ; panneau Filtres en sélection multiple ; fil d'Ariane et Échap ; infobulle ; jeux D213 ; FR et EN ; pas de mode Agence/Cliente sur la carte. Les points magasins du démonstrateur restent fictifs ; aucune lecture du listing réel par le lot.
