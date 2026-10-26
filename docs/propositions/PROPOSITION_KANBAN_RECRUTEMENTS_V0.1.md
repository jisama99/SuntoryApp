# Proposition : vue agence des recrutements (tableau, Kanban, filtres)

Statut : **validée** par T. SOEFOU le 24/10/2026 (« je valide tout »). Mise à jour du registre **proposée**, non enregistrée.
Périmètre : maquette de l'étape A (données fictives). Aucune donnée réelle.
Aperçu : `docs/propositions/APERCU_VUE_AGENCE_TABLEAU_KANBAN_V0.3.html` (fichier autonome, données fictives).

## 1. Décisions validées

| # | Objet | Décision | Décideur |
|---|---|---|---|
| K1 | Affichage par défaut, ordinateur et tablette (≥ 760 px) | Tableau. Bascule vers Kanban (colonnes = états D92). | T. SOEFOU |
| K2 | Affichage mobile (< 760 px) | Liste de cartes. Les onglets d'état (Tous, À recruter, En recrutement, Proposé…) tiennent lieu de Kanban. | T. SOEFOU |
| K3 | Filtres mobiles | Bouton « Filtres » avec compteur, feuille en bas d'écran, pastilles actives retirables d'un tap, « Effacer » vide tout. | T. SOEFOU |
| K4 | Filtres ordinateur | Ligne de pastilles en haut de la vue. | T. SOEFOU |
| K5 | Pastilles budget et indicateurs | Visibles par défaut ; masquables par une case. | T. SOEFOU |
| K6 | Seuil d'alerte budget | 90 % consommé. Valeur de départ, à confirmer sur données réelles avant l'étape B. | T. SOEFOU |
| K7 | Préférence de vue | Mémorisée par compte côté données (pas dans le navigateur). | T. SOEFOU |
| K8 | Verrouillage du style pour la cliente | Lecture seule, agrégée par zone, sans journal, sans coût, sans délai interne. | T. SOEFOU |
| K9 | Lot dédié | Vues tableau et Kanban dans un lot séparé, **A4h**. Numéro vérifié libre le 26/10/2026 ; intégré au plan, à l'index, aux messages de lancement et au prompt `34_PROMPT_LOT_A4H.md`. | T. SOEFOU |

Décisions non changées : états D92 (À recruter, En recrutement, Proposé, Validé, Recruté, En poste) ; hors flux (Stoppé, Réattribué, Zone blanche, D85) ; audience D108 (journal agence seul) ; zones D106 (`ZoneLabel`) ; textes FR et EN (règle 15).

## 2. Contrat d'affichage par support

| Largeur | Vue par défaut | Comportement |
|---|---|---|
| ≥ 1024 px | Tableau | Kanban en bascule. Le tableau ne déborde pas de la page ; la zone défile seule si besoin. |
| 760 à 1024 px | Tableau | Idem. Pastilles qui passent à la ligne. |
| < 760 px | Liste de cartes | Onglets d'état en défilement horizontal (cibles ≥ 44 px). Pas de tableau. |

Règles transverses :
- Aucune largeur fixe de page ; contenu fluide.
- Cibles tactiles ≥ 44 px.
- Clic sur une ligne ou une carte : ouvre le journal (agence seule), en dessous de la vue.
- Chaque vue porte ses états vide, chargement, erreur et conflit (règle des écrans).

## 3. Vérification réalisée (aperçu V0.3)

Contrôle dans un navigateur réel (Chromium, Playwright), script de contrôle dans le dossier de travail de la session :

| Largeur | Débordement de page | Bascule Tableau/Kanban | Clic carte → journal | Filtres / états | Erreurs console | Cibles < 44 px |
|---|---|---|---|---|---|---|
| 1440 | 0 px | OK | OK | n/a | 0 | 0 |
| 1024 | 0 px | OK | OK | n/a | 0 | 0 |
| 768 | 0 px | OK | OK | n/a | 0 | 0 |
| 390 | 0 px | OK (liste → Kanban) | n/a | OK (état « En recrutement » : 2 cartes ; état « Proposé » : message vide) ; feuille ouverte et fermée | 0 | 0 |
| 360 | 0 px | OK | n/a | OK | 0 | 0 |

Corrections faites au passage : la bascule ordinateur ne montrait pas le Kanban (règle CSS manquante) ; le filtre par état mobile masquait la carte qu'il devait montrer ; les pastilles étaient à 36 px.

## 4. Limites (non exécuté)

- Testé uniquement dans Chromium. **Non testé** : Safari iOS, Chrome Android, appareil réel, lecteur d'écran, navigation clavier complète.
- Le Kanban mobile n'est pas une grille de colonnes : les onglets d'état le remplacent.
- Données fictives. Les seuils (90 %) et les libellés d'échéance sont des valeurs de maquette.

## 5. Points à vérifier avant l'étape B

- Tests sur appareils réels (iOS Safari, Android Chrome) avant la démonstration du 10/11.
- Seuil 90 % : à confirmer avec les règles de budget réelles (Impact).
- Contrôle d'audience : la vue cliente ne doit recevoir aucun journal ni coût, filtré dans la couche de données (règle D108), jamais masqué à l'écran seulement.

## 6. Mise à jour du registre proposée

Inscrire K1 à K9 dans `docs/DECISIONS.md` sous de nouveaux numéros. Les numéros D205 à D208 sont réservés aux notifications et D215 et suivants aux propositions A3c : à attribuer lors de la revue, sans chevauchement.
