# Charte des exports, gabarit Marvesting à 70 % et paramétrage des pages, V0.2 (22/10/2026)

Remplace la V0.1 et le prototype V2, jugés trop éloignés du gabarit. Suntory uniquement. Livrables externes signés FREELANCE. Maquettes sur données fictives.

## 1. Décisions du 22/10/2026
| N° | Décision | Statut |
|---|---|---|
| D62 | Exports sans ligne droite, sans cadratin, sans phrase antithétique | Validée |
| D63 | Même douceur dans l'interface, esprit Apple dosé à 15 % | Validée, sens de « 15 % » à confirmer |
| D64 | Logos Suntory et Marvesting sur tous les exports de reporting | Remplacée par D83 (logo Marvesting orange retiré) |
| D65 à D69 | Photos de rayons sans personne, coûts à la main de l'agence, principe « moins d'Excel », mode recrutements, dossier REPORTING | Voir registre |
| D70 | Exports de reporting : trame Marvesting conservée à hauteur de 70 %. Pour les exports, cette règle remplace la dominante Suntory. L'interface garde la charte mixte. | Validée par T. SOEFOU |
| D71 | Pages et exemples paramétrés par une spécification de rapport, avec pagination automatique (§4) | Proposée |
| D72 | Garde-fou de fidélité au gabarit : minimum 70 %, réglable par l'agence (§5) | Proposée |

## 2. Ce que veut dire « 70 % Marvesting »
| Part | Contenu |
|---|---|
| 70 % conservé du gabarit | Pages clonées des diapositives du gabarit, fonds bleu nuit, indigo, beige et rose, vagues et images de couverture, blocs de couleur pleine page, grands chiffres, titres à leur place, police du gabarit, marque Impact |
| 30 % adapté | Pastille blanche arrondie avec les logos Suntory et Marvesting, capsules et cartes arrondies à la place des filets, des tableaux à grille et des cadres à contour, accent cyan Suntory dans les graphiques |
Tension signalée : le gabarit lui-même contient des lignes et des cadres à contour. Pour respecter D62, je les retire et je garde les blocs de couleur pleine page, qui font la structure du gabarit. Les panneaux flottants deviennent arrondis.

## 3. Pages construites sur le gabarit
| Page | Diapositive source du gabarit | Contenu |
|---|---|---|
| Couverture | 2 | Titre, trimestre, date, statut des données |
| Ordre du jour | 3 (4 points) ou 4 (6 points) | Points numérotés |
| Synthèse budget | 35 | 4 grands chiffres, barres en capsules, à retenir |
| Évolution mensuelle | 15 | Colonnes en capsules |
| Besoins et recrutements | 36 | Parcours par statut, 2 chiffres, comparaison de deux dates |
| Photos terrain | 15 | Cartes photo, heures, coût |
| Décisions | 19 | 3 colonnes numérotées |
| Clôture | 46 | Prochaine échéance |
Pages du gabarit encore disponibles pour de nouveaux exemples : chiffres clés (31, 33), comparaison (24), chronologie (21), citation (17), colonnes d'icônes (18), cartes bénéfices (26).

## 4. Réponse : comment paramétrer plus de pages et d'autres exemples
Le rapport est décrit par une spécification (écran « Composer le rapport », stockée en fichier `rapport_spec.json`, exemple fourni).
1. **Choisir un modèle** de rapport enregistré (COPIL trimestriel, point mensuel).
2. **Cocher et ordonner les pages** dans le catalogue du §3. Une page peut être ajoutée plusieurs fois.
3. **Régler chaque page** : période, date de référence, date de comparaison, secteurs à cocher, indicateurs (financiers, heures, jours, délais), langue, affichage des coûts.
4. **Choisir les exemples** (photos, décisions, points d'ordre du jour), selon trois modes :
   - manuel : cases à cocher dans la galerie ;
   - règle : par exemple les 6 opérations les plus lourdes en heures, ou la dernière photo validée de chaque secteur ;
   - mixte : une règle, puis exclusions ou ajouts à la main.
5. **Pagination automatique** : chaque type de page a une capacité (photos 3 par page, décisions 3, ordre du jour 4 ou 6). Au delà, une page est ajoutée, le titre est recalculé par règle (« Deux autres opérations illustrent 108 heures… ») et la mention « page 2 sur 2 » apparaît. Le réglage `par_page` (1 à 4) et le plafond `pages_max` bornent la longueur. Les éléments au delà du plafond sont proposés en annexe en planche de photos.
6. **Aperçu et compteur** : la liste des pages générées et leur nombre s'affichent avant production.
7. **Contrôles, relecture, validation** : voir §5, puis relecture humaine avant publication.
8. **Reproductibilité** : la spécification, l'empreinte des données et la version du gabarit sont archivées avec l'export.
Les boucles automatiques (hebdomadaire, mensuelle, trimestrielle) rappellent la même spécification sur de nouvelles dates.
Démonstration : le prototype produit 9 pages avec 5 photos sélectionnées, soit 2 pages de photos (3 puis 2) et un ordre du jour qui bascule de la diapositive 3 à la diapositive 4 au delà de 4 points.

## 5. Contrôle automatique et fidélité
Le script `check_style_v3.py` refuse l'export si : forme rectiligne remplie, ligne, tableau à grille ou contour visible, cadratin ou tournure antithétique repérée par mots-clés, texte explicite sous 12 pt, logo manquant, fidélité sous le minimum.
Fidélité par page = 30 % page issue du gabarit + 30 % part de la surface d'origine conservée + 20 % palette Marvesting + 20 % police du gabarit. Résultat du prototype : 86 à 99 % par page, 95 % en moyenne, minimum exigé 70 %.
Limites : ce score mesure l'écart au gabarit, il ne remplace pas ton jugement visuel. La taille des textes hérités du gabarit n'est pas contrôlée. Les tournures antithétiques sont repérées par mots-clés seulement.

## 6. Prototype V3
`PROTOTYPE_COPIL_V3/SUNTORY_COPIL_PROTOTYPE_DEMO_V3.pptx` et `.pdf`, construits directement à partir du fichier du gabarit (`build_prototype_v3.py`, `rapport_spec.json`). Chiffres fictifs recalculés : 1 881 + 589 + 180 = 2 650 k€, 71 % et 93 %, 214 + 108 = 322 h de photos.
Rendu vérifié en PDF seulement, pas dans PowerPoint ni Keynote. Le gabarit utilise la police Mont : sans elle, l'affichage bascule sur une police de remplacement.

## 7. Points ouverts
1. Droits : dériver et diffuser un document issu du gabarit Marvesting (accord d'Impact), police Mont, logo Suntory (D25), photo de couverture.
2. Graphiques dessinés en formes arrondies donc non modifiables comme des données. Confirmer ce choix, avec export Excel des données en complément.
3. Marque Impact : le gabarit la porte en haut à gauche de plusieurs pages et sur la clôture. Je la garde. À confirmer pour les exports cliente.
4. Sens de « 15 % » dans l'interface.
5. Trame de COPIL réelle toujours à fournir.
6. Le corps du lot A5 contient une ligne antérieure à D42 (saisie par l'intervenant). Relecture avant A5.

## 8. Mise à jour de mémoire proposée (non enregistrée)
Exports de reporting : trame Marvesting à 70 % (D70), spécification de rapport avec pagination automatique (D71), garde-fou de fidélité réglable (D72).

## 9. Suite
Étape C : matrice fonctions, événements métier, rapports et boucles, avec le détail du mode recrutements. Puis étape B : fiche de fonction photos.
