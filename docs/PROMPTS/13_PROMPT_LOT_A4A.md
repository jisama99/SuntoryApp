# SUNTORY REFONTE V3 · Prompt du lot A4a (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A3 validé.

```text
LOT A4a · LECTURE, INDICATEURS, ALERTES ET TABLEAU DE BORD PAR RÔLE

OBJECTIF
Lecture d'un coup d'œil sur données fictives : tableau de bord par rôle, actions à traiter, indicateurs, alertes d'échéance, cockpit cliente, classement des secteurs, filtres. Les graphiques suivent la direction visuelle D123 à D126 (tuiles, formes arrondies).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/22 (charte), 24 (échéances), 25 (choix des graphiques), 23 (détail régions, secteurs, magasins), 28 (§3, comparaison N / N-1).
4. src/components/Tile.tsx et ReportTemplate.tsx (modèle de page rapport).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Choix de la bibliothèque de graphiques en début de lot (point P3) : comparer au moins deux options (licence, poids,
   accessibilité, rendu arrondi, absence de requête externe), décider avec justification dans le compte rendu.
   Sans bibliothèque adaptée : formes dessinées en SVG et CSS, valeurs toujours lisibles en texte.
1 ter. Jeux de couleurs des graphiques et indicateurs (D213 proposée, docs/propositions/PROPOSITION_JEUX_COULEURS_GRAPHIQUES_V0.1.md) : trois jeux dérivés du design Marvesting, A Marvesting signature (#ED2567, #2A2A91, #0E0D30, #00829B, neutre #E5E1D3), B Mixte Suntory et Marvesting (#00829B, #1A1950, #5BC2DC, série clé #E52365, neutre #E1E8EC), C Sobre et accessible (dégradé marine vers aqua, série clé #E52365). Jetons `--color-chart-1` à `--color-chart-6`, `--color-chart-key` et `--color-chart-neutral` par jeu, avec variantes du mode sombre, dans les fichiers de jetons (aucune valeur en dur dans les composants). Défaut de l'interface : B ; défaut des exports : A (lu par A4c1). L'agence fixe le défaut dans Paramètres, section « Couleurs des graphiques » ; chaque utilisateur peut choisir le sien dans le sélecteur d'affichage, sauf profil cliente si l'agence verrouille le défaut. Les couleurs de statut (ok, alerte, danger) restent hors des jeux et ne changent pas ; le rose ne signifie jamais erreur ; neutre réservé à « Autres » et « Disponible ». Lime et beige jamais en texte ni en forme sur fond blanc sans libellé foncé voisin. Valeur écrite sur chaque élément, alternative tableau, sens jamais porté par la couleur seule, aucun trait droit. Aperçu de référence : docs/propositions/APERCU_PALETTES_GRAPHIQUES_V0.1.html. Les valeurs exactes de B et C sont des hypothèses à valider après essai à l'écran.
1 quater. Styles de tracé des graphiques et indicateurs (D214 proposée, validée par T. SOEFOU le 24/10/2026, docs/propositions/PROPOSITION_STYLES_GRAPHIQUES_V0.1.md, aperçu docs/propositions/APERCU_STYLES_GRAPHIQUES_V0.1.html) : trois styles combinables avec les jeux de couleurs de l'étape 1 ter. Doux (défaut partout : bouts arrondis, cartes 22 px), Exécutif (coins 5 px, bouts droits, cartes 10 px, chiffres plus grands et tabulaires, repère triangulaire d'objectif, puces d'écart avec sens, graphique d'écart à l'objectif par dispositif), Directionnel (coins 2 px, tronçons en flèche, cartes 6 px, jauge en flèches, cascade du budget au disponible, entonnoir en chevrons). Jetons : rayon des éléments, rayon des cartes, forme des bouts, forme des tronçons, taille des chiffres, présence des repères ; aucune valeur en dur. Exception à D62 limitée aux graphiques et indicateurs : coins moins arrondis et bouts droits autorisés ; restent interdits quadrillage, axe tracé, trait ou barre décoratif, tiret long, icônes d'IA. Réglage : défaut fixé par l'agence dans Paramètres (section « Style des graphiques » à côté de « Couleurs des graphiques »), choix utilisateur dans le sélecteur d'affichage, verrouillable par l'agence pour la cliente. Si A4b1 a déjà créé la couche de jetons (palettes et styles), la compléter sans la dupliquer. Recommandation d'usage : Doux dans l'interface, Exécutif pour les exports de COPIL, Directionnel pour les vues de progression (entonnoir, cascade budgétaire).
2. Tableau de bord par rôle : actions à traiter, indicateurs du périmètre, fraîcheur des données. Tuiles par famille
   d'indicateur, tuile d'ancrage pour le résultat principal, rose réservé à l'action.
3. Couleurs de quota paramétrables ; quotas permanent et saisonnier « à définir » en gris (Q6 sans réponse) ;
   barre d'alerte segmentée, clic = filtre. Pas de quota par secteur (quota au niveau DR et CVR).
4. Classement des secteurs (pas des personnes). Filtres DR, CVR (multiple), RS, campagne, période ; vues enregistrées.
4 ter. Lecture analytique par dispositif et par campagne (docs/COMPLEMENTS_CADRAGE/28 §2 ter) : filtre hiérarchique Dispositif puis Campagne appliqué à tous les écrans de lecture et aux exports, vue « Par campagne » avec sous-totaux, réconciliation des totaux, groupe « Sans campagne », « Non applicable » et « Budget non renseigné » jamais à 0.
4 bis. Comparaison semaine N / N-1 (D127, F-10.14, docs/COMPLEMENTS_CADRAGE/28_CADRAGE_AXES_N1_N2_N3_N9_V0.1.md §3) : bascule sur les tuiles et le tableau, variation en valeur et en pourcentage, « Non comparable » si N-1 absente ou non chiffrée, jamais 0, S01 comparée à la dernière semaine ISO de l'année précédente. Étendre la fixture déterministe à deux semaines consécutives sans modifier les valeurs existantes.
5. Chaque indicateur : période, périmètre, unité, définition, date de calcul, détail selon les droits.
5 bis. Écran Budget (D153, D154, D157) : cockpit cliente en lecture seule et épuré (jauge consommé, prévisionnel, disponible ; répartition par dispositif et campagne ; alerte) ; espace agence en mode administration (budget retenu, retour à la référence, détail de calcul) et mode présentation (contrôles masqués, chiffres agrandis, périmètre figé, aucune donnée modifiée), réservé à l'agence. Filtres Dispositif, Campagne, territoire ; une page, trois blocs au plus. Vue Explorateur de M1 fondue dans les filtres et exports.
6. « Non chiffré » et « Budget non renseigné » jamais à 0 ; couverture avec numérateur et dénominateur ; lignes sans
   géolocalisation dans « Non géolocalisé » et dans les totaux. Montants fictifs étiquetés (D05 à D07 ouverts).
7. Cockpit cliente : alertes et résumés de retard, personnalisé (salutation par prénom, périmètre) ; une alerte
   agence n'apparaît dans aucun profil cliente, CVR, DR, ni dans un e-mail, ni dans un rapport.
8. Écrans lisibles en mode sombre ; alternative tableau pour chaque graphique.
9. Captures : docs/captures/A4a/ par profil concerné.

RÈGLES TRANSVERSES DU LOT (D131, D133)
Filtre de période : DateRangePicker et WeekPicker ; comparaison N / N-1 : choix de la semaine N au WeekPicker. Comparatif de campagnes côte à côte (doc 28 §2 ter) : deux ou trois campagnes choisies, mêmes indicateurs, écart par rapport à la première colonne, « Non comparable » entre unités incompatibles.

HORS PÉRIMÈTRE
Enveloppes et réallocation (A4b), exports PPTX et PDF (A4c1), cartographie, photos, import Excel, moteur financier réel, base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D05 (définition du consommé) : montants fictifs étiquetés, aucun moteur réel.
- Carte : hors lot, lot dédié A4e (D150, plan dans docs/CARTOGRAPHIE.md) ; tableau des zones à la place, qui restera l'alternative accessible. Navigation conforme à la règle 14 (D151).
- P3 (bibliothèque de graphiques) : décidée dans ce lot, validée ensuite par T. SOEFOU.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Test : S01 2027 contre S53 2026, N-1 manquante, N-1 non chiffrée, division par zéro, aucun montant côté RS.
2 ter. Test : somme des campagnes = total du dispositif = total global ; « Sans campagne » inclus ; le filtre s'applique à chaque écran et à l'export.
2 bis. Test : un coût manquant ne devient jamais 0 ; une ligne sans géolocalisation reste dans les totaux.
3. Test d'audience : aucune alerte agence côté cliente, y compris dans les données chargées par la page.
4. Contrastes des nouvelles couleurs testés dans les deux modes ; règles de style toujours vertes.
4 ter. Test des trois styles (Doux, Exécutif, Directionnel) combinés aux jeux A, B, C dans les deux modes : aucun quadrillage ni axe tracé dans aucun style, aucun tiret long, valeurs écrites, alternative tableau, changement de style sans rechargement, défaut agence et verrouillage cliente respectés, rendu 390 px, test de style étendu qui échoue sur toute valeur de forme en dur.
4 bis. Test des jeux A, B et C dans les deux modes : contraste des formes d'au moins 3:1 et du texte d'au moins 4,5:1, six séries distinguables avec libellés, simulation daltonisme documentée, aucune couleur de statut prise dans un jeu, changement de jeu sans rechargement, défaut agence respecté, choix utilisateur mémorisé par compte.
5. Captures A4a, C1 à C7, docs/COMPTE_RENDU_A4A.md, mise à jour proposée du registre.
6. Design et navigation (règles 14 à 16, D151, D159) : chaque écran du lot a son état dans l'URL (retour arrière, rechargement, lien profond testés), ses trois états (squelette, vide, erreur), ses tableaux en cartes sous 640 px, ses transitions sobres, sa confirmation annulable après écriture, ses cibles de 44 px ; aucune valeur de style en dur ; seuils de performance mesurés et reportés (2 s, 100 ms) ; captures 390 px.
7. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A5. N'enchaîne pas.
```
