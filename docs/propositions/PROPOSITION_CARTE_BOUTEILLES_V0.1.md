# Proposition : carte de France interactive à bouteilles (lot A4e)

Statut : orientations **validées** par T. SOEFOU le 26/10/2026 (L1 à L3). La maquette « défis et badges » est **abandonnée** par T. SOEFOU le 26/10/2026 : aucun défi, badge ni mode ludique dans ce périmètre. Mise à jour du registre **proposée**, non enregistrée.
Périmètre : étape A, données fictives. Aperçu : `docs/propositions/APERCU_CARTE_BOUTEILLES_V0.1.html` (fichier autonome ; il embarque les contours simplifiés et le visuel de bouteille fournis par T. SOEFOU).

## 1. Vérification de doublon (26/10/2026)

| Idée | Existant | Conclusion |
|---|---|---|
| Carte interactive | D150, lot **A4e**, tableau équivalent obligatoire (D116) | Même lot : cette proposition précise A4e, elle n'ouvre pas de lot |
| Contours | D152 (accords déclarés, GeoJSON fournis le 26/10/2026) | Utilisés, simplifiés localement |
| Bouteilles sur la carte | Aucune mention dans `docs/` | Nouveau, intégré à A4e |
| Défis, badges | Abandonnés | Hors périmètre |

Limite : les modules V4 et le dossier REFONTE_V3 hors dépôt n'ont pas été relus.

## 2. Décisions

| # | Objet | Décision | Statut | Décideur |
|---|---|---|---|---|
| L1 | Marqueurs | Une petite bouteille Orangina (visuel fourni dans le dossier LOGOS, accord d'usage déclaré) **par besoin**, posée sur son département. Grisée : reste à faire ; remplie en couleur : étape D92 atteinte ; pastille avec le numéro d'étape (1 à 6) ; pastille rouge si proposition en retard. | Validée 26/10/2026 | T. SOEFOU |
| L2 | Contours | `departements-5m.geojson` fourni par T. SOEFOU, simplifié localement (script `docs/propositions/outils/simplifier_contours_departements.py`), 96 départements de métropole et Corse, environ 370 Ko. Origine et licence déclarées validées. Départements d'outre-mer non traités : à décider. | Validée 26/10/2026 (déclarative) | T. SOEFOU |
| L3 | Taille des bouteilles | Hauteur recommandée : 46 px sur ordinateur et tablette, 38 px sous 560 px de large ; 58 et 46 px après zoom sur un secteur ; zone de clic d'au moins 44 x 44 px ; écart horizontal de 1,4 largeur entre bouteilles d'un même département. Taille constante à l'écran quel que soit le zoom. | Validée 26/10/2026 | T. SOEFOU |

## 3. Interactions de l'aperçu
- Clic ou Entrée sur une bouteille : détail du besoin (étape, échéance, secteur, département).
- Clic sur un département ou bouton de secteur : zoom sur le secteur, bouteilles agrandies ; Échap ou « France entière » : retour.
- Filtres par étape (À recruter, En recrutement, Proposé, Validé, Recruté et en poste) : les autres bouteilles s'estompent.
- Tableau équivalent sous la carte (D116), bouton de secteur au clavier, couleur jamais seule (numéro d'étape écrit).

## 4. Garde-fous
- Secteurs fictifs : regroupement par région d'illustration, sans lien avec la découpe commerciale réelle. Aucune personne représentée, aucune donnée d'intervenant.
- Les fichiers de listing et de découpe réelles du dossier REFONTE_V3 n'ont **pas** été transférés ni lus : seul le fichier de contours a été traité, en local sur le poste.
- Audience (D108) : la carte cliente n'affiche que les zones et les étapes agrégées ; échéances et retards internes restent réservés à l'agence.
- Aucun visuel chargé depuis un CDN (D113). Un besoin sans étape connue : « Donnée indisponible », pas de bouteille vide présentée comme valeur.
- Le visuel de bouteille (marque) est embarqué dans l'aperçu : relire avant tout partage.

## 5. Vérification de l'aperçu
Chromium, 1440, 768, 390 et 360 px : 96 départements et 12 bouteilles rendus, clic sur bouteille, zoom par secteur, retour par Échap, filtre d'étape, sélection au clavier, hauteurs de bouteilles mesurées (45 px et 37 px, 58 px et 46 px après zoom), aucun débordement de page, aucune cible de bouton sous 44 px, aucune erreur console. Non testé : Safari iOS, Chrome Android, lecteur d'écran, performance H3 (D151) sur 50 besoins.

## 6. Mise à jour du registre proposée
Inscrire L1 à L3 sous de nouveaux numéros lors de la revue, en évitant D205 à D208 (notifications) et D215 et suivants (A3c).

## 7. Compléments validés le 26/10/2026 (aperçu V0.3, M1 V4 pris pour référence)
Aperçu : `APERCU_CARTE_BOUTEILLES_V0.3.html` (données fictives, FR et EN). Alignement sur la carte du M1 V4, avec en plus la sélection multiple.
- M1 : quatre niveaux de lecture (département, région, CVR, DR) ; calque Indicateur avec légende et territoires non chiffrés hachurés ; fil d'Ariane géographique et Échap = niveau supérieur ; infobulle de survol ; territoires hors filtre atténués ; panneau détail (indicateurs, enseignes cliquables, liste) ; codes de département selon le zoom ; zoom animé ; plein écran, export CSV, impression.
- Calques Besoins (bouteilles), Magasins (points, quatre statuts distingués par la forme), Indicateur.
- Panneau Filtres à quatre onglets en sélection multiple (territoire, étapes, enseignes, période et campagne) ; état dans l'URL.
- Jeux de couleurs D213 A, B, C appliqués à la carte seule (statuts fixes).
- Pas de mode Agence/Cliente sur la carte : la cliente a son propre espace ; ce mode ne sert qu'à la projection du reporting budget et des indicateurs d'atterrissage (décision du 26/10/2026).
- Points magasins : fictifs dans l'aperçu. Autorisation de lire le listing donnée le 26/10/2026 par T. SOEFOU ; usage limité à son poste (script local, aucune valeur dans le dépôt, les captures ni les comptes rendus) ; extension de D109 à inscrire au registre, accord d'Impact et de la cliente à obtenir avant démonstration.
- Limites déclarées : Safari iOS, Android réels et lecteur d'écran non testés ; cibles des points magasins à 28 px à faible zoom ; départements non parcourables au clavier (bouteilles et panneau de filtres le sont) ; contours simplifiés (bords en escalier au fort zoom).

- Version locale avec les vrais magasins (poste de T. SOEFOU seulement) : script `outils/generer_carte_locale.py` (variable `SUNTORY_GEO_PATH`), sortie hors dépôt, bandeau « DONNÉES RÉELLES LOCALES ». Le 26/10/2026 : 488 magasins sur 496 placés (482 par nom de commune, 6 par code postal), 8 non placés, 481 sur 488 dans le bon département (les autres à la frontière). Les niveaux CVR et DR de la carte restent fictifs ; la découpe réelle (liaison département/CVR) reste à brancher. L'export CSV d'une version locale contient des données réelles : ne pas le diffuser.
