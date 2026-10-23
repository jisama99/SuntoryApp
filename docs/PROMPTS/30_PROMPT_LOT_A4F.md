# Lot A4f : vue Planning (D190)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Dépend de A3 (statuts, entonnoir), A4a (filtres, vues enregistrées) et A5 (couverture, carences). Placé après A5 dans le noyau.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D106, D118, D123 à D126, D145, D151, D159, D160, D182 à D190), docs/GLOSSAIRE_FR_EN.md (sections 4 quinquies et 4 sexies), docs/COMPLEMENTS_CADRAGE/16_CATALOGUE_FONCTIONNEL_V0.1.md (F-10.6, F-10.9, F-10.11 à F-10.13, F-30.7), 30_DIRECTIVES_UX_UI_V0.1.md, comptes rendus A3, A4a, A5.

MAQUETTE VALIDÉE (description, la maquette n'est pas dans le dépôt)
Page fluide : en-tête (titre, bandeau données fictives), filtres (DR, CVR, département, campagne, période) et bascule de mode, quatre indicateurs, puis le mode choisi, puis deux panneaux : Magasins liés (au besoin sélectionné) et Recrutements par département. Style de l'application (jetons, teal dominant, rose réservé à l'action, aucun trait décoratif).

ÉTAPES
1. Données : événements de planning dérivés des besoins (périodes saisies, statut séparé besoin, proposition, recrutement, exécution selon D11), magasins liés à chaque besoin, recrutements et affectations par secteur et par département ; méthodes du `Repository` avec `AccessContext` ; audience par défaut refusée ; codes de zone uniquement via `ZoneLabel`.
2. Écran `/planning` et entrée de menu « Planning » (table `src/domain/menu.ts`, D118, test d'audience) : tous les profils selon leur périmètre ; RS limité à son secteur ; montants masqués là où D118 les retire ; absences en catégories génériques.
3. Quatre modes, état dans l'URL (mode, semaine, jour, filtres) : Frise par semaine (une ligne par besoin, barres par période, statut écrit dans la barre, jamais la couleur seule) ; Calendrier par dates (grille lundi à dimanche, besoins sur leurs jours de présence, trois au plus par jour puis « +n autres », clic sur un jour ouvre le mode Jour) ; Jour (bande de semaine, besoins du jour et magasins du jour) ; Mois (heures par mois, F-10.11).
4. Panneaux : magasins liés (enseigne, département, dates) ; recrutements par département (pourvus, en cours, non couverts, couverture avec numérateur et dénominateur) avec renvoi à l'entonnoir (A3) ; lien vers la carte seulement si A4e est présent.
5. Filtres combinés et vues enregistrées (F-10.9), réutilisation de A4a ; export de la vue en FR et EN (règle 15).
6. Mobile 390 px : bascule Liste, Calendrier, Mois ; bande de semaine avec pastilles de comptage, six semaines sur demande, liste du jour en cartes avec magasins, cibles de 44 px, aucun défilement horizontal de page (la frise défile dans sa boîte) (règle 16).
7. Clavier : flèches dans le calendrier, focus visible, rôles et étiquettes accessibles ; trois états par route (squelette, vide, erreur) ; glossaire respecté, aucun libellé hors glossaire sans le proposer.
8. Performance : 50 besoins sur 10 semaines, premier affichage utile sous 2 s, interaction sous 100 ms (D151).
9. Captures docs/captures/A4f/ (FR et EN, 1440 et 390 px, clair et sombre, quatre modes).

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests : audience (RS, CVR, DR, direction, agence), URL et lien profond, i18n, style, clavier, 390 px, performance.
3. Aucune donnée réelle ; aucune requête externe.
4. docs/COMPTE_RENDU_A4F.md, hypothèses, mise à jour proposée du registre (numéros après D190).
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
