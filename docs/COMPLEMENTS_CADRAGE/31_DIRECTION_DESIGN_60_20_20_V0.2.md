# Direction design 60/20/20 · V0.2 du 31/10/2026

Suntory uniquement. Les décisions D250 à D253 ci-dessous sont **validées par T. SOEFOU le 31/10/2026** (message de session). Les numéros sont **provisoires** : la session de revue les attribue après lecture de `docs/DECISIONS.md` (dernière décision relevée : D249). Aucune ligne n'est encore inscrite au registre : mise à jour **proposée, non enregistrée**.

## 1. Décisions validées (numéros provisoires)

| N° | Sujet | Décision | À confirmer par |
|---|---|---|---|
| D250 | Répartition visuelle de l'interface | 60 % extraction du design de l'application Marving (jetons `--ion-*`, `--Spacing-*`, `--Radius-*`, `--Element-*`, `--Background-*`), 20 % Suntory (design system Suntory), 20 % esprit Apple. Remplace la dominante Suntory de D30 et porte l'esprit Apple de 15 % (D63) à 20 %. Les exports restent régis par D70. D123 à D126 restent en vigueur comme cadre de la part Apple | Cliente via Impact |
| D251 | Palettes des graphiques | Deux masques au choix de l'utilisateur (section 3). Le choix passe par le sélecteur d'affichage, défaut fixé par l'agence dans Réglages (même logique que D161 et D184) | Cliente |
| D252 | Cartes d'alerte et icônes | Fonds neutres, plus de fond rose. Icônes : **uniquement celles du code actuel** (`src/components/icons.ts`, gabarit `Icon`, D113 et D125). Aucune famille d'icônes ajoutée | T. SOEFOU |
| D253 | Police | Titres en Poppins semi-gras (identité Marving), corps et chiffres en pile système (SF Pro, Segoe UI, Roboto), sans Inter. Poppins auto-hébergée, aucun appel réseau tiers. Modifie D121 et la ligne « Inter locale » de D159 | Impact |

## 2. Part Marving (60 %)

Source : variables CSS collées par T. SOEFOU le 31/10/2026 depuis l'application Marving. Variables masquées par l'outil (« 25 more », « 4 more ») non fournies : le mode sombre (D124) n'est pas couvert.

| Rôle | Valeur | Remarque |
|---|---|---|
| Primaire | `#2196F3` | 3,1:1 avec du texte blanc : surfaces, grands éléments |
| Primaire sombre | `#0057B2` | Tout bouton ou lien avec texte (environ 7:1) |
| Primaire clair | `#E3F2FD` | Fonds actifs |
| Neutres | `#F5F5F5`, `#BDBDBD`, `#9E9E9E`, `#616161`, `#424242`, `#212121` | `--Element-*` |
| Fonds | `#FFF`, `#F7F7F7`, `#EEE` | `--Background-*` |
| Espacements | 0, 2, 4, 6, 8, 12, 16, 24, 32, 72, 96 px | Ne pas reprendre la série `--old-*` |
| Rayons | 4, 8, 16, 32, 160 px | Contrôles et cartes d'alerte : 8 px |

Anomalies de l'extraction : `--ion-color-success-rgb` ne correspond pas à `#689F38` ; `--ion-color-medium-rgb` du second bloc est corrompue ; deux jeux `--ion-color-*` coexistent (`#2196F3` actif d'après la page de connexion, `#0054e9`).

## 3. Palettes des graphiques : deux masques (D251)

Cinq couleurs par masque plus un gris « Autres » (regroupement au delà de 5 catégories, D88). Écarts de couleur minimaux (CIEDE2000) calculés pour la vision normale, puis simulés pour la protanopie, la deutéranopie et la tritanopie.

| Masque 1 : Marvesting | Hex | Contraste sur blanc |
|---|---|---|
| Indigo | `#1B1C88` | 13,4:1 |
| Sable | `#B08A4E` | 3,2:1 |
| Magenta | `#E52365` | 4,4:1 |
| Cyan graphique | `#1E9DBE` | 3,2:1 |
| Corail | `#FF5648` | 3,1:1 |
| Autres | `#9E9E9E` | |

Écart minimal : 18,1 (normal), 6,8 (protanopie), 5,2 (deutéranopie), 3,7 (tritanopie). Paire fragile : magenta et corail, jamais côte à côte.

| Masque 2 : Suntory sobre | Hex | Contraste sur blanc |
|---|---|---|
| Sarcelle | `#00829B` | 4,5:1 |
| Sable | `#B08A4E` | 3,2:1 |
| Indigo | `#1B1C88` | 13,4:1 |
| Framboise | `#D9456E` | 4,2:1 |
| Gris | `#8D8F99` | 3,2:1 |
| Autres | `#BDBDBD` | |

Écart minimal : 23,1 (normal), 10,4 (protanopie), 10,7 (deutéranopie), 17,0 (tritanopie).

Règles :
1. Une catégorie garde la même couleur sur tous les écrans (Permanent reste toujours la première couleur du masque), jamais décalée selon l'ordre.
2. Le masque ne change que les jetons `--chart-1` à `--chart-5` et `--chart-other` ; les statuts (vert, ambre, rouge) restent inchangés.
3. Le sens d'une alerte passe toujours par un mot écrit ; magenta, corail et framboise ne signifient jamais « erreur » (doc 25).
4. Valeur écrite sur chaque élément, total au centre de l'anneau, tableau équivalent disponible (D116).
5. Le sable `#B08A4E` est un sable foncé choisi pour atteindre 3:1 sur blanc. Un sable clair comme `#E3CFA3` ne sert qu'aux fonds, avec texte sombre.
6. Contraste contrôlé dans les deux thèmes (D124) avant tout code.
7. Le choix de palette s'applique à l'interface ; les exports gardent la palette de leur charte (D70, doc 25) jusqu'à décision contraire.

## 4. Icônes : celles du code actuel (D252)

Le code utilise Lucide, via le seul point d'entrée `src/components/icons.ts` et le gabarit `src/components/Icon.tsx` (quatre tailles, trait ajusté à la taille). `tests/unit/icons.test.ts` interdit tout autre import. Font Awesome (famille des jetons Marving) **n'est pas adoptée**.

| Vue (clé de menu) | Icône actuelle |
|---|---|
| Accueil (`home`) | House |
| Cockpit (`dashboard`) | LayoutDashboard |
| Besoins (`needs`) | ClipboardList |
| Réponses (`proposals`) | ClipboardCheck |
| Équipes terrain (`field`) | Store |
| Budget (`budget`) | Wallet |
| À traiter (`alerts`) | Bell |
| Réglages (`settings`) | Settings |
| Gestion (`admin`) | ShieldCheck |

États et alertes : `ok` CircleCheck, `attention` TriangleAlert, `risk` OctagonAlert, `neutral` Circle, `important` Flag, `info` Info, `empty` Inbox, `conflict` GitMerge. Une alerte garde son icône d'état **et** son mot (Dépassement, Vigilance) : le sens ne passe jamais par la couleur seule.

Ajout éventuel, à ajouter dans `icons.ts` uniquement : un pictogramme de carte pour la vue Carte (lot A4e) et un pour la vue Planning (CalendarDays existe déjà sous `calendar`).

## 5. Cartes d'alerte

Fond neutre (`#F7F7F7`), rayon 8 px, aucune pastille ni disque coloré, un seul bouton principal en `#0057B2` avec texte blanc. Le rose n'est plus un fond de carte : il reste disponible comme couleur de série du masque 1. Cette décision modifie D126 (rose réservé aux cartes d'action) et la ligne de D30 sur le rose de l'interface.

## 6. Police (D253)

Titres Poppins semi-gras à 20 px et plus ; corps et chiffres en pile système, chiffres tabulaires exigés (D123). À vérifier avant code : chiffres tabulaires de Poppins, auto-hébergement et licence. Les aperçus produits en session utilisent des polices de remplacement (DejaVu Sans, FK Grotesk Neue) : le rendu final des polices n'est pas représenté.

## 7. Versions V2 et V3 conservées pour revue

Ces deux aperçus de la vue Budget (direction financière de la cliente, données fictives) sont conservés pour une **session de revue Claude Code** qui tranche ou mixe. Les images n'ont pas pu être versionnées par la session : T. SOEFOU les dépose dans `docs/captures/propositions/` sous les noms `apercu_budget_directrice_financiere_v2.png`, `apercu_budget_directrice_financiere_v3.png` et `palettes_graphiques_deux_masques.png`.

| Version | Parti pris |
|---|---|
| V2 | Sections en cartes blanches arrondies avec ombre diffuse ; barre d'enveloppe segmentée ; colonnes empilées par mois ; anneau du consommé par dispositif ; barres classées par direction régionale ; bloc « À décider » à fond rose |
| V3 | Sections plates sans ombre, rayon 8 px, menu pleine hauteur ; tableau chiffré par direction régionale avec total, barres intégrées, tri et statuts ; infobulle (i) sur chaque indicateur ; phrase de comparaison à l'an dernier ; un seul bouton principal |

Grille de revue : densité, hiérarchie, conformité à D123 à D126, D159 et à ce document, accessibilité (contraste, couleur jamais seule), trois blocs au plus (D154), tableau équivalent (D116). Proposition de départ : structure V3, avec les ajustements D251 à D253. Chiffres fictifs cohérents entre eux : enveloppe 1 200 k, consommé 768 k, prévisionnel 204 k, atterrissage 972 k (81 %), disponible 228 k, DR Ouest à 102 %.

Questions de la direction financière et graphiques associés (doc 25, D88) : situation de l'enveloppe (barre avec repère de seuil), répartition (anneau, 5 catégories au plus), tension par territoire (barres classées ou tableau), évolution (colonnes empilées, jamais en secteurs), décision à prendre (carte d'alerte).

## 8. Points ouverts

| N° | Point |
|---|---|
| T2 | Mode sombre (D124) : jetons sombres Marving non fournis |
| T4 | Intégrer Budget, Planning et Carte au cockpit en onglets avec l'état dans l'URL : proposition, non validée (toucherait D160 et D190) |
| T5 | Accord de la cliente et d'Impact sur D250 (comme D30) |
| T6 | Visibilité des coûts par rôle (D08) pour la vue cliente |
| T7 | Chiffres tabulaires et licence de Poppins |

## 9. Garde-fous

Aucune donnée réelle, aucun déploiement, aucune connexion Supabase ou Vercel à l'étape A (D114, D104, D165). Aucun jeton n'est inscrit dans `src/` : l'intégration relève d'un lot dédié avec prompt, tests et revue (D191). Les captures de référence externes (Outpost, Saleng) servent à l'analyse seulement et ne sont pas versionnées.
