# Lot A4e : carte de France interactive (D150)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt. Dépend de A4a. Accords obtenus (D152) : D25 levé pour la carte, usage de la découpe autorisé. Reste : choisir le jeu de contours ouvert (licence et attribution consignées).

LECTURES : CLAUDE.md, docs/DECISIONS.md (D25, D109 bis, D116, D150, D151, D152), docs/CARTOGRAPHIE.md, F-10.6 du catalogue (doc 16), docs/COMPTE_RENDU_A4A.md.

ÉTAPES
1. Contours embarqués en local (aucune requête externe), sur zones et magasins fictifs ; licence confirmée avant tout contour.
2. Carte : zoom et déplacement fluides (souris, molette, tactile, pincement), survol, clic, sélection de région, département, magasin, enseigne.
3. Retour « France entière », fil d'Ariane, Échap, groupe « Non géolocalisé » (F-10.6).
4. Sélection synchronisée avec filtres et URL (règle 14) ; ZoneLabel pour tout code de zone ; audience respectée.
5. Clavier complet, focus visible, mouvement réduit, 390 px ; tableau des zones équivalent toujours disponible.
6. Importeur générique de découpe locale (D109 bis, D152) : chemin par variable d'environnement vers le dossier local des départements, schéma Zod, rejet des colonnes inattendues, bandeau « DONNÉES RÉELLES LOCALES ». Tests sur fichiers SYNTHÉTIQUES uniquement ; tu ne lis jamais les fichiers réels : T. SOEFOU les branche en local.

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests : interactions clavier, URL partagée restitue la sélection, Échap, groupe non géolocalisé, FR et EN.
3. Performance H3 mesurée (interaction sous 100 ms, hypothèse) et reportée, sans la présenter comme exigence décidée.
4. Captures docs/captures/A4e/, C1 à C7, docs/COMPTE_RENDU_A4E.md, mise à jour proposée du registre.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
