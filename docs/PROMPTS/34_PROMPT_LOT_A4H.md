# Lot A4h : vues Tableau et Kanban des recrutements (K1 à K9)

Version du 26/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Dépend de A3 (statuts, entonnoir D92), A4a (filtres, vues enregistrées, alertes, jeux de couleurs et styles) et A4b1 (budget alloué, consommé, prévisionnel). Placé après A4g ; candidat au report en seconde démonstration si le calendrier du 10/11 ne le permet pas.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D85, D92, D106, D108, D116, D151, D162, D213, D214), docs/propositions/PROPOSITION_KANBAN_RECRUTEMENTS_V0.1.md (décisions K1 à K9, validées par T. SOEFOU le 24/10/2026), aperçu docs/propositions/APERCU_VUE_AGENCE_TABLEAU_KANBAN_V0.3.html, docs/STATUTS_ET_ETATS.md, comptes rendus A3, A4a, A4b1.

ÉTAPES
1. Données : une ligne ou carte par besoin avec état D92 (À recruter, En recrutement, Proposé, Validé, Recruté, En poste), zone par `ZoneLabel` uniquement, budget alloué, consommé et prévisionnel (jamais 0 pour une valeur inconnue : « Non chiffré », « Budget non renseigné »), indicateurs (échéance, retard de proposition, seuil budget), journal par besoin. Méthodes du `Repository` avec `AccessContext` ; journal, coûts et délais internes filtrés dans la couche de données (D108), audience par défaut refusée.
2. Écran agence : Tableau par défaut à partir de 760 px avec bascule Kanban (colonnes = états D92, hors flux Stoppé, Réattribué, Zone blanche en bandeau, D85) ; sous 760 px, liste de cartes avec onglets d'état (K1, K2). État de la vue, filtres et onglet dans l'URL (règle 14). Préférence de vue enregistrée par compte dans la couche de données, jamais dans le navigateur (K7).
3. Filtres : ligne de pastilles sur ordinateur et tablette (K4) ; sur mobile, bouton « Filtres » avec compteur, feuille en bas d'écran, pastilles actives retirables d'un geste, « Effacer » vide tout (K3).
4. Pastilles budget et indicateurs visibles par défaut, case pour les masquer (K5) ; seuil d'alerte budget paramétrable, défaut 90 % (K6, valeur de départ à confirmer sur données réelles avant l'étape B). Statuts jamais condensés : un champ par statut.
5. Clic sur une ligne ou une carte : journal du besoin, sous la vue, réservé à l'agence. Aucune modification par glisser-déposer.
6. Vue cliente (K8) : lecture seule, agrégée par zone, sans journal, sans coût, sans délai interne ; les cartes nominatives n'existent pas dans cette vue. Tests d'audience par profil (agence, cliente, DR, CVR, RS).
7. États vide, chargement, erreur et conflit sur chaque vue ; FR et EN (règle 15) ; clavier complet (Entrée et Espace sur lignes et cartes) ; cibles de 44 px ; aucun débordement de page à 360, 390, 768, 1024 et 1440 px (le tableau défile dans son conteneur) ; couleurs et formes lues dans les jetons de graphique et de style (D213, D214), aucune valeur en dur ; couleur jamais seule.
8. Captures docs/captures/A4h/ (FR et EN, 1440, 768 et 390 px, clair et sombre, Tableau, Kanban, feuille de filtres).

HORS LOT : carte, bouteilles et contours (A4e), notifications (A4g). Défis de zone et badges : abandonnés par T. SOEFOU le 26/10/2026.

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests : audience (journal et coûts absents des profils cliente, DR, CVR, RS), URL et lien profond, bascule et filtres au clic et au clavier à chaque largeur, i18n, style, 44 px, aucun débordement de page, aucune erreur console. Navigateurs réellement testés listés ; Safari iOS et Chrome Android déclarés non testés s'ils ne l'ont pas été.
3. Aucune donnée réelle ; aucune requête externe.
4. docs/COMPTE_RENDU_A4H.md, hypothèses, mise à jour proposée du registre : inscrire K1 à K9 sous de nouveaux numéros après le dernier du registre, sans chevauchement avec D205 à D208 ni D215 et suivants (A3c).
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
