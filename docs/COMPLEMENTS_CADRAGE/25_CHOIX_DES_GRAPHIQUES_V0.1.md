# Choix des types de graphiques dans le moteur de configuration du rapport, V0.1 (23/10/2026)

Suntory uniquement. Demande de T. SOEFOU : dans le moteur de configuration du rapport, choisir le type d'éléments graphiques (camemberts, donuts, barres) ou obtenir des propositions intelligentes selon les données à afficher. Livrables signés FREELANCE. Données fictives.

## 1. Décision
| N° | Décision | Statut |
|---|---|---|
| D88 | Chaque graphique d'un rapport a un réglage « Type » : Auto (proposition selon les données) ou un type choisi parmi barres horizontales, colonnes, colonnes empilées, barres à 100 %, donut, camembert, courbe, jauge. Le choix est contrôlé, jamais bloqué sans explication, et tracé | Demandée, règles proposées |

## 2. Réglage dans l'écran « Composer le rapport »
| Élément | Comportement |
|---|---|
| Menu « Type de graphique » par page | Auto par défaut. Les types possibles sont listés avec une vignette |
| Bouton « Pourquoi cette proposition ? » | Une phrase d'explication tirée de la nature des données |
| Aperçu | Mise à jour immédiate avec les données du périmètre coché |
| Contrôle du choix manuel | Trois niveaux : cohérent, avertissement (choix gardé, message affiché), refus (choix impossible, remplacement par la proposition Auto avec explication) |
| Défauts par modèle | Agence administration : type par défaut et liste des types autorisés par modèle de rapport |
| Qui choisit | Agence opérationnelle (D73). Les autres profils ne modifient rien |
| Trace | Type demandé, type retenu, niveau de contrôle, auteur, date, dans la spécification archivée (D71) |

## 3. Règles de proposition automatique
La nature des données est déduite de l'indicateur : temps, comparaison, statut, part d'un total, seuil, avancement.
| Nature | Proposition | Variante | Remarques |
|---|---|---|---|
| Une valeur contre une cible | Jauge, valeur en toutes lettres | Barre de progression | Jamais une jauge sans valeur lisible |
| Évolution dans le temps | Colonnes, empilées si réalisé et prévisionnel | Courbe pour une tendance longue | Jamais en secteurs |
| Part d'un total, 5 catégories au plus, parts positives formant 100 % | Donut avec total au centre | Barre unique à 100 % | Camembert seulement jusqu'à 4 parts |
| Part d'un total, plus de 5 catégories | Barres classées, regroupement en « Autres » | Barres à 100 % | |
| Statut ou cycle de vie | Barres dans l'ordre du cycle | Empilées par période | |
| Valeur contre seuil | Barres avec repère de seuil | Colonnes | |
| Comparaison de périmètres | Barres horizontales classées | Colonnes | Au delà de 12 barres : pagination ou regroupement |

## 4. Contrôles d'un choix manuel
| Cas | Niveau | Effet |
|---|---|---|
| Donut ou camembert sur une évolution dans le temps | Refus | Remplacé par la proposition Auto |
| Donut ou camembert avec valeurs négatives ou parts qui ne forment pas un total | Refus | Remplacé par des barres, message d'explication |
| Donut ou camembert au delà de 5 catégories | Avertissement | Regroupement automatique en « Autres » |
| Camembert à 5 parts | Avertissement | Donut conseillé |
| Courbe sur des statuts ou des parts | Avertissement | Barres conseillées |
| Jauge pour plusieurs valeurs | Avertissement | Barres conseillées |
| Plus de 12 barres | Avertissement | Pagination ou regroupement |
Le refus se limite aux cas où le graphique déformerait la lecture. Pour tout le reste, l'agence garde la main, avec trace.

## 5. Contraintes de style communes (D62, charte)
| Règle | Application aux graphiques |
|---|---|
| Aucun trait droit | Barres à bouts arrondis, donut à bouts arrondis, pas de quadrillage ni d'axe tracé, repère de seuil en pastille |
| Valeurs lisibles | Valeur affichée sur chaque élément, total au centre du donut, texte d'au moins 12 pt |
| Sens jamais porté par la couleur seule | Libellé et valeur toujours présents, le rose ne signifie jamais « erreur » |
| Palette | Rose, marine, indigo, beige, lime, cyan Suntory en accent, dans l'ordre défini par la charte |
| Accessibilité | Texte alternatif généré avec le résumé des valeurs ; tableau des valeurs en annexe sur demande |
| Contrôle de fidélité (D72) | Inchangé : les graphiques dessinés comptent comme éléments ajoutés aux couleurs de la palette |

## 6. Spécification du rapport (extension)
```json
{"type": "besoins_recrutements",
 "graphique": {"type": "auto", "types_autorises": ["barres_h", "empile", "donut"], "regrouper_autres_au_dela": 5,
               "valeurs_affichees": true, "annexe_valeurs": false}}
```
`type` vaut `auto` ou un des types listés au §2. Absent : `auto`. Le module `PROTOTYPE_COPIL_V3_1/choix_graphique.py` contient les règles des §3 et §4 et un jeu d'essais (10 cas, tous conformes aux tableaux ci-dessus).

## 7. Point de conception à trancher
La décision D59 demande des graphiques « sélectionnables », donc avec données éditables dans PowerPoint. La charte D62 demande des formes arrondies sans trait. Les graphiques natifs de PowerPoint ont des barres à angles droits et des axes tracés, ce qui contredit la charte. Deux options :
| Option | Effet |
|---|---|
| A. Graphiques dessinés en formes arrondies (prototype actuel) | Rendu fidèle à la charte, données non éditables dans PowerPoint, valeurs fournies en annexe Excel |
| B. Graphiques natifs | Données éditables, rendu moins conforme (angles droits, axes) |
| C. Dessinés par défaut, option « graphique éditable » en natif pour les pages qui l'exigent | Compromis, un contrôle de style assoupli sur ces pages |
Recommandation : C, avec A par défaut.

## 8. Lots
Moteur de choix et contrôle : A4c. Vignettes et aperçu dans l'écran Composer le rapport : A4c. Défauts par modèle : A4c, droits agence administration.

## 9. Mise à jour de mémoire proposée (non enregistrée)
Type de graphique réglable dans le moteur de rapport, Auto ou choix parmi barres, colonnes, empilées, donut, camembert, courbe, jauge ; choix contrôlé et tracé (D88).
