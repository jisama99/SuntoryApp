# Directives UX et UI : 10 priorités (proposition)

Version du 23/10/2026. **Validée par T. SOEFOU le 23/10/2026 (D159).** Fait suite à D149, D150, D151. Constats tirés de l'état fusionné (A2a) : `src/app/globals.css`, `States.tsx`, `DataTable.tsx`, tests de style.

## Constats sur l'existant
| Point | État observé |
|---|---|
| Jetons de couleur, rayons, ombre, mode sombre | Présents et testés (contraste, style) |
| Échelles d'espacement et de typographie | **Absentes** : seules couleurs, rayons et ombre sont des jetons |
| Focus visible, mouvement réduit | Présents, globaux |
| Transitions et survol | **Aucune transition définie** dans les styles globaux |
| Chargement | Composant `LoadingState` avec icône qui tourne, **aucun squelette**, aucun `loading.tsx` |
| Tableau | `DataTable` avec défilement horizontal seulement : pas de version carte mobile, tri ni en-tête fixe |
| Police | Pile système avec « Inter Variable » nommée ; **chargement local à vérifier** (règle 10, aucune requête externe) |

## Les 10 directives
| N° | Directive | Fichier ou zone | Critère testable | Lot |
|---|---|---|---|---|
| 1 | Échelles de jetons : espacement (pas de 4 px), typographie (6 tailles), durées et courbes de mouvement | `globals.css` | Test qui échoue sur une couleur, taille ou durée en dur | Règle 16, appliquée dès A2b |
| 2 | Transitions sobres : survol, focus, ouverture de panneaux (150 à 250 ms), désactivées en mouvement réduit | `globals.css`, `Button`, `Tile`, `NavLinks` | Test sur la durée maximale et sur `prefers-reduced-motion` | A2b |
| 3 | Squelettes à la place du spinner, `loading.tsx` et `error.tsx` par route | `States.tsx`, `src/app/[locale]/**` | Chaque route a ses trois états ; capture de chacun | A2b puis chaque lot |
| 4 | Retour après action : confirmation visible avec annulation possible, focus replacé | Formulaires, `NeedForm`, `DuplicateForm` | Test e2e : message visible, annonce lecteur d'écran, focus | A2b |
| 5 | État dans l'URL : filtres, période, périmètre, tri, onglets | Tous les écrans de lecture | Retour arrière, rechargement, lien profond restituent l'état | A2b, A4a |
| 6 | Tableaux mobiles : cartes empilées sous 640 px, colonnes clés, tri, en-tête fixe | `DataTable` | Capture 390 px sans défilement horizontal du contenu essentiel | A2b, A4a |
| 7 | Cibles tactiles 44 px, police de base 16 px, pickers en feuille plein écran sur mobile | Pickers, boutons, champs | Test de taille minimale ; capture 390 px | A2b |
| 8 | Performance : rendu serveur par défaut, composants clients limités (pickers, carte), découpage par route, polices locales | Architecture | Seuils H3 : 2 s premier affichage utile, 100 ms interaction carte, mesurés en e2e | Règle 14, tous les lots |
| 9 | Navigation globale : fil d'Ariane, lien d'évitement, raccourcis clavier documentés, vue présentation agence (D154) | `layout.tsx`, `NavLinks` | Parcours clavier complet de chaque lot | A2b, A4a |
| 10 | Carte fluide : zoom et déplacement inertiels, survol des régions et des magasins, regroupement des points, tableau équivalent | Composant carte | Interaction sous 100 ms, clavier, tactile | A4e |

## Règle 16 (D159) (design et micro-interactions)
Aucun style en dur (couleur, espacement, taille, durée) hors jetons ; transitions de 150 à 250 ms, désactivées en mouvement réduit ; trois états par route (chargement par squelette, vide, erreur) ; confirmation visible après toute action d'écriture ; tableaux en cartes sous 640 px ; cibles de 44 px. Tests de style étendus en conséquence.

## Validé
1. Les 10 directives et leur lot.
2. La règle 16 comme règle commune, appliquée dès A2b.
3. Chargement local de la police Inter (vérification demandée à Claude Code en A2b).
