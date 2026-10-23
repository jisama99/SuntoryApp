# Proposition : styles de tracé des graphiques et indicateurs (V0.1, 24/10/2026)

Statut : proposition du prestataire, VALIDÉE par T. SOEFOU le 24/10/2026 (trois styles, exception à D62 limitée aux graphiques et indicateurs, Doux par défaut, Exécutif conseillé pour les COPIL, Directionnel pour les vues de progression, verrouillage du style pour la cliente), non inscrite au registre (à inscrire par la session de revue). Demande de T. SOEFOU le 24/10/2026 : alternatives moins arrondies, plus directionnelles et exécutives, en trois versions paramétrables. Suntory uniquement, livrables signés FREELANCE, données fictives. Complète PROPOSITION_JEUX_COULEURS_GRAPHIQUES_V0.1.md (D213 proposée).

## 1. Conflit avec les règles validées, à trancher
La règle ferme du 23/10/2026 (D62 et règle de style : « aucun trait droit », formes arrondies, pas de barres décoratives droites) s'oppose aux styles Exécutif et Directionnel. Le style Doux reste le défaut. Les deux autres styles sont proposés comme réglage de tracé des seuls graphiques et indicateurs, sans quadrillage ni axe tracé, sans trait décoratif ; la direction est portée par des repères triangulaires, des flèches et des cascades. Cette exception doit être validée expressément avant tout codage.

## 2. Trois styles
| Style | Forme | Lecture | Éléments propres |
|---|---|---|---|
| Doux (actuel, défaut) | Bouts arrondis, pastilles, cartes à 22 px | Convivial, cohérent avec la charte validée | Aucun |
| Exécutif | Coins à 5 px, bouts droits, cartes à 10 px, chiffres plus grands, chiffres tabulaires | Lecture d'un coup d'œil en comité | Repère triangulaire d'objectif, puces d'écart avec sens (au-dessus, sous), graphique d'écart à l'objectif par dispositif |
| Directionnel | Coins à 2 px, tronçons en flèche, cartes à 6 px | Progression et enchaînement | Jauge en flèches, cascade du budget au disponible, entonnoir en chevrons |

Les trois styles se combinent librement avec les jeux de couleurs A, B, C (D213) et les modes clair et sombre. Les couleurs de statut restent fixes.

## 3. Réglage
Paramètre « Style des graphiques » avec les mêmes niveaux que le jeu de couleurs : défaut fixé par l'agence dans Paramètres, choix utilisateur dans le sélecteur d'affichage, défaut des exports par modèle de rapport (verrouillable pour la cliente). Jetons : rayon des éléments, rayon des cartes, forme des bouts, forme des tronçons, taille des chiffres, présence des repères. Aucune valeur en dur dans les composants.

## 4. Décision proposée
| N° | Sujet | Décision proposée |
|---|---|---|
| D214 | Styles de tracé des graphiques | Trois styles Doux (défaut), Exécutif, Directionnel, combinables avec les jeux D213, réglables par l'agence, l'utilisateur et le modèle de rapport. Exception limitée aux graphiques et indicateurs à la règle « aucun trait droit » : coins moins arrondis et bouts droits autorisés, mais jamais de quadrillage, d'axe tracé, de trait ou de barre décoratifs, ni de tiret long. |

## 5. Points à valider
Exception à D62 pour Exécutif et Directionnel, nom des styles, présence du style Directionnel dans les exports PPTX (formes dessinées, voir doc 25 §7), et verrouillage pour la cliente.

## 6. Lots
A4a (jetons, réglages, tests des trois styles dans les deux modes), A4c1 (lecture du style pour les exports), A4b1 (graphiques de l'enveloppe).
