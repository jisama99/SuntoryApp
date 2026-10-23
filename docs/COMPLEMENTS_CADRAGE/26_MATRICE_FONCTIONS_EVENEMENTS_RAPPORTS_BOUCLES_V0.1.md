# Étape C : matrice fonctions, événements métier, rapports, boucles d'automatisation et mode recrutements, V0.1 (23/10/2026)

Suntory uniquement. Livrables externes signés FREELANCE. Étape A : données fictives, aucun code applicatif, aucun appel réseau sortant. Proposition du prestataire : seules les demandes rappelées au §1 viennent de T. SOEFOU, les décisions D90 à D97 ont été validées par lui le 23/10/2026.

## 0. Ce qui a été lu et ce qui ne l'a pas été
| Lu | Non lu ou partiel |
|---|---|
| `CLAUDE.md` et registre (début et D62 à D89) ; docs 12, 16, 19, 20, 23, 24, 25 en entier ; doc 22 §5 à §9 ; `03_LOTS_DEV.md` jusqu'au lot A5 ; `rapport_spec.json` du prototype V3.1 ; prompt 21 (partie C) | Cartographie des workflows WF-A1 à WF-E7 (renvois repris des docs 16 et 20, sans relecture) ; docs 10, 11, 13, 14, 15, 17, 18 ; lots A6 à B9 ; contenu des listes `_LISTES` ; formules des onglets de calcul ; aucun COPIL réel (aucun n'est dans le dossier) |
Conséquence : le mapping des états de recrutement sur les colonnes Excel (§7.2) reste une hypothèse à lever au lot A0b. La colonne « Recrutement » compte 4 valeurs, 2 seulement sont connues (OK, En cours).

## 1. Demande et décisions
Demande (prompt 21, partie C, et D68) : matrice fonction, événement métier, rapport, boucle d'automatisation (hebdomadaire, mensuelle, trimestrielle, événementielle) ; classement par valeur et effort ; 3 rapports prioritaires ; détail du mode « état des lieux des besoins selon les recrutements ».

| N° | Sujet | Décision proposée | Statut | À confirmer par |
|---|---|---|---|---|
| D90 | Matrice de référence | Trois catalogues liés : événements EV-01 à EV-37 (§3), rapports R-01 à R-15 (§5), automatisations AUT-01 à AUT-15 (§6). Aucun rapport sans événement source ni boucle | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D91 | Journal des événements métier | Chaque changement d'état est un événement daté deux fois (date d'effet, date de saisie), jamais réécrit. Il est la source des rapports, des alertes et de la reconstitution d'un état à une date. Horloge de démonstration et instantané hebdomadaire de contrôle | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D92 | États de l'entonnoir | Six états en données (À recruter, En recrutement, Proposé, Validé, Recruté, En poste) ; le mot « Pourvu » des rapports désigne « En poste » (poste démarré) ; deux taux affichés (recrutées, en poste) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, métier cliente |
| D93 | Mesure des délais | Quatre jalons, par situation (recrutement nouveau, réattribution, zone blanche), médiane, étendue et effectif ; pas de moyenne unique. Précise D87 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D94 | Boucles | Cinq familles (échéance, hebdomadaire, mensuelle, trimestrielle, événementielle). Le rapport se prépare seul et ne part jamais seul ; rodage de deux cycles en file validée avant tout envoi automatique des e-mails D86 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D95 | Priorités | Trois rapports prioritaires : R-01 état des besoins et recrutements, R-02 COPIL mensuel, R-05 suivi des échéances et retards. Lot A4c scindé en A4c1 (moteur et R-02) et A4c2 (R-01 et boucles) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D96 | Objectif de 80 % | Cible à mesurer sur deux cycles, avec chronométrage de référence de la préparation actuelle (§9) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, Impact |
| D97 | Retours en arrière | Un refus de la cliente ou un désistement ramène le besoin à « En recrutement », avec compteur ; rien n'est effacé | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, métier cliente |

## 2. Définitions et principes
| Terme | Sens dans ce document |
|---|---|
| Événement métier | Fait daté émis par une fonction (EV-xx), enregistré dans le journal. Il porte l'objet concerné, le périmètre (DR, CVR, secteur), le rôle de l'auteur, la date d'effet et la date de saisie |
| Rapport | Spécification versionnée (modèle, périmètre, période, indicateurs, graphiques, langue) qui lit les événements et les états calculés |
| Boucle | Déclencheur, contrôles préalables, composition, relecture, publication. Chaque boucle contient des automatisations AUT-xx |
Principes repris des décisions existantes :
- Un seul chemin de données pour les écrans et les rapports (doc 20). Aucun chiffre calculé à part.
- Règles déterministes, aucun modèle de langage à l'étape A (doc 12, D40).
- Droits appliqués côté serveur avant tout calcul. Les rapports parlent de secteurs, jamais de personnes (D84, D85). Le RS n'est pas affiché par défaut (D77).
- Un coût inconnu s'affiche « Non chiffré », jamais zéro. Statut des données et date de calcul sur chaque page.
- Style des exports : D62, D83, D89. Contrôle automatique avant publication.
- Chaque manipulation d'Excel conservée est justifiée (D67). Les Excel restent des formats d'écriture et d'export (D56).

## 3. Catalogue des événements métier
Colonnes : fonction source (doc 16), données portées, rapports alimentés. Tous portent date d'effet, date de saisie, rôle de l'auteur, périmètre, version.
| ID | Événement | Fonction | Données portées | Rapports |
|---|---|---|---|---|
| **Besoins** | | | | |
| EV-01 | Besoin créé en brouillon | F-20.1 à 20.3 | besoin, secteur, période, heures par semaine, auteur, saisie « pour le compte » | R-06 |
| EV-02 | Besoin soumis | F-20.4 | idem, mois cible | R-01, R-04, R-05, R-06 |
| EV-03 | Demande de changement sur besoin soumis | F-20.8 | version avant et après, mois cible, écart à l'échéance | R-05, R-06 |
| EV-04 | Saisie bloquée ou reportée sur M+1 | F-20.7, D78 | mois cible, type d'échéance, motif affiché | R-05, R-06 |
| EV-05 | Doublon ou anomalie détecté | F-20.6, F-90.2 | règle W ou D, gravité, lien vers le besoin | R-11 |
| **Validation** | | | | |
| EV-06 | Besoin validé par le CVR | F-30.1 | rôle décideur, enveloppe | R-01, R-04 |
| EV-07 | Besoin escaladé ou arbitré par le DR | F-30.2 | idem | R-01, R-04 |
| EV-08 | Besoin refusé avec motif | F-30.1, 30.2 | motif | R-04 |
| EV-09 | Besoin pris en charge, précisé ou rejeté par l'agence | F-30.4 | décision, motif | R-04, R-06 |
| **Proposition et décision** | | | | |
| EV-10 | Proposition émise (version n) | F-30.5 | écart au besoin, coût complet ou partiel | R-01, R-04 |
| EV-11 | Décision de la cliente (validée, refusée, révisée) | F-30.6 | version décidée, motif | R-01, R-02, R-04 |
| EV-12 | Décision invalidée par une nouvelle proposition | F-30.5 | version remplacée | R-04 |
| **Recrutement et exécution** | | | | |
| EV-13 | Recrutement en cours | F-30.7 | date de début de recherche, nombre de CV (interne) | R-01 |
| EV-14 | Recrutement finalisé | F-30.7 | date | R-01 |
| EV-15 | Formation réalisée | F-30.7 | date | R-01 |
| EV-16 | Poste démarré (prise de poste) | F-30.8 | date | R-01, R-02 |
| EV-17 | Véhicule remis | F-30.8 | date | R-01 |
| EV-18 | Réattribution (merch déjà sur le secteur, nouveau magasin) | D85 | secteur d'origine, magasin | R-01 |
| EV-19 | Besoin stoppé | D85 | motif obligatoire | R-01 |
| EV-20 | Zone blanche déclarée ou levée | D85 | secteur, date | R-01 |
| EV-21 | Désistement ou départ du poste | à créer | date, catégorie générique | R-01, R-10 |
| **Terrain et absences** | | | | |
| EV-22 | Réalisé saisi | F-40.2 | mission ou site, jour, heures, auteur, saisie pour le compte | R-02, R-10 |
| EV-23 | Réalisé validé ou rejeté | F-40.2 | décision, motif | R-02 |
| EV-24 | Absence déclarée (catégorie générique) | F-40.4 | secteur, dates | R-10 |
| EV-25 | Remplacement trouvé ou jour non couvert | F-40.4, 40.5 | heures non couvertes | R-02, R-10 |
| **Budget** | | | | |
| EV-26 | Réallocation proposée | F-50.2 | montant ou heures, enveloppes, motif | R-08 |
| EV-27 | Réallocation validée (double validation) | F-50.2 | version, date d'effet | R-02, R-08, R-09 |
| EV-28 | Dépassement prévisionnel détecté | F-60.9 | enveloppe, écart | R-02, R-12 |
| EV-29 | Besoin validé dépassant la nouvelle enveloppe | F-60.11 | besoin, enveloppe | R-02, R-08 |
| **Échéances** | | | | |
| EV-30 | Échéance proche (J-5, J-2, jour J) | doc 24 | mois cible, type d'échéance | R-05 |
| EV-31 | Échéance atteinte, mois verrouillé | D78 | mois cible | R-05, R-06 |
| EV-32 | Réouverture demandée par un CVR | D87 | motif, durée souhaitée | R-06 |
| EV-33 | Réouverture décidée par l'agence | F-30.9 | décision, durée, trace | R-05, R-09 |
| **Données et clôtures** | | | | |
| EV-34 | Import déposé, accepté ou rejeté | F-90.1 | contrat, version, lignes rejetées | R-11 |
| EV-35 | Source vieillissante | F-60.12 | source, âge | R-11 |
| EV-36 | Clôture hebdomadaire, mensuelle ou trimestrielle | F-30.9 | période | R-02, R-03, R-04 |
| **Reporting** | | | | |
| EV-37 | Rapport généré, contrôle en échec, relu, validé, publié, partagé | F-70.x | spécification, empreinte, auteur | R-09 |
Remarque : EV-21 n'existe dans aucune source lue (ni colonne, ni statut). Sa donnée source est à confirmer (§11, point 3).

## 4. Matrice fonctions, événements, rapports, boucles
Boucles : **É** échéance, **H** hebdomadaire, **M** mensuelle, **T** trimestrielle, **V** événementielle.
| Fonction (doc 16) | Événements | Rapports | Boucle | Manipulation d'Excel supprimée |
|---|---|---|---|---|
| F-20.1 à 20.4 Saisie des besoins | EV-01 à 05 | R-04, R-05, R-06 | É, H | Consolidation des fichiers de besoins par région, relances par e-mail pour savoir qui a saisi |
| F-20.8 Historique et révisions | EV-03 | R-06 | V | Comparaison manuelle de deux versions de fichier |
| F-30.1, 30.2 Validation CVR, DR | EV-06 à 08 | R-04 | H | Relance des validations en attente |
| F-30.4 Qualification agence | EV-09 | R-04, R-06 | H | File des demandes tenue à la main |
| F-30.5, 30.6 Proposition et décision | EV-10 à 12 | R-01, R-04 | H, V | Aller-retour du fichier d'échange, suivi des décisions attendues |
| F-30.7, 30.8 Recrutement, prise de poste, véhicule | EV-13 à 21 | R-01, R-07, R-10 | H, M, V | Tableau de suivi des recrutements tenu à la main |
| F-30.9 Clôture et réouverture | EV-33, 36 | R-02, R-03, R-04, R-05 | H, M, T | Liste de contrôle de clôture |
| F-40.2, 40.3 Réalisé terrain | EV-22, 23 | R-02 | M | Consolidation du réalisé |
| F-40.4, 40.5 Absences et couverture | EV-24, 25 | R-10 | H | Tableau des absences et des remplacements |
| F-50.1, 50.2 Enveloppes et réallocation | EV-26 à 29 | R-02, R-08, R-09, R-12 | V, M | Mise à jour des enveloppes dans plusieurs classeurs, note de réallocation |
| F-10.x Pilotage | lecture des états | R-02, R-03, R-12 | M, T | Recopie des chiffres dans les diapositives |
| F-60.x Alertes et échéances | EV-30 à 32 | R-05 | É | Relances individuelles, bilan de retards |
| F-90.1, 90.2 Imports et anomalies | EV-05, 34, 35 | R-11 | V | Contrôle visuel des fichiers reçus |
| F-70.x Reporting | EV-37 | R-09 | V | Tenue d'un journal des envois |

## 5. Catalogue des rapports, classement par valeur et effort
Valeur de 1 à 5 : gain de travail administratif, fréquence, visibilité pour la cliente, réduction du risque d'erreur. Effort : **S** modèle et données déjà cadrés ou prototypés ; **M** spécification ou données nouvelles ; **L** dépendance externe ou décision ouverte. Aucune durée n'est estimée.
| Rang | ID | Rapport | Destinataires | Format | Boucle | Valeur | Effort | Phase |
|---|---|---|---|---|---|---|---|---|
| 1 | R-01 | **État des besoins et recrutements** (mode D68, §7) | Cliente, agence ; DR et CVR sur leur périmètre | Écran, PPTX, PDF, annexe Excel | H, M, à la demande | 5 | M | A fictif, B réel |
| 2 | R-05 | **Suivi des échéances et retards de saisie** (doc 24) | Cliente (cockpit et résumé du lundi), DR et CVR sur leur périmètre, agence | Écran, e-mail limité | É, H | 5 | S | A |
| 3 | R-02 | **COPIL mensuel** (doc 20, prototype V3.1) | Cliente, agence | PPTX, PDF | M | 5 | M en A, L en B (D05 à D07) | A4c1 |
| 4 | R-04 | Rapport hebdomadaire | Agence, cliente | Écran, PDF court | H | 4 | S | A |
| 5 | R-06 | File de charge de l'agence | Agence | Écran | É, H | 4 | S | A |
| 6 | R-07 | Point d'avancement sur un recrutement en retard | Agence, RS | Écran, PDF d'une page | V | 3 | S | A |
| 7 | R-08 | Note de réallocation | CVR et DR concernés | Écran, une page | V | 3 | S | A4b |
| 8 | R-11 | Qualité des données et fiche d'import | Référent data | Écran | V | 3 | S | A |
| 9 | R-10 | Couverture et absences | Agence, cliente (catégories génériques) | Écran, une diapositive | H | 3 | M | A5 |
| 10 | R-12 | Rapport par DR et par CVR | DR, CVR | Écran, PDF | M | 3 | M | B (consultation validée, D87) |
| 11 | R-03 | COPIL trimestriel | Direction cliente | PPTX, PDF | T | 3 | M (historique figé) | A4c1 |
| 12 | R-13 | Galerie de photos des opérations | Cliente, agence | Page PPTX, PDF | M, à la demande | 3 | L (droits, consentement, conservation) | Fiche de fonction, étape B |
| 13 | R-09 | Journal des réallocations, paramètres et publications | Cliente, administrateurs agence | Écran, Excel | À la demande | 2 | S | A |
| 14 | R-14 | Rapprochement activité et facturation | Agence, cliente | à définir | M | 2 | L | C (hors MVP, F-50.7) |
| 15 | R-15 | Synthèse rédigée par modèle de langage | Agence | Brouillon relu | À la demande | 1 | L | C (F-90.8, D40) |

## 6. Boucles d'automatisation
Principe : le rapport se prépare seul et ne part jamais seul. Une notification dans l'application destinée à un utilisateur interne n'est pas un envoi externe. Tout ce qui quitte la plateforme (e-mail, rapport publié pour la cliente) passe par la file « à envoyer » (F-90.3).
À l'étape A, une **horloge de démonstration** (date simulée, réglable) joue les échéances sans attendre. Aucun envoi réel : l'e-mail est remplacé par un aperçu du message.

| ID | Boucle | Déclencheur | Entrées | Contrôles préalables | Sortie | Validation | Canal |
|---|---|---|---|---|---|---|---|
| AUT-01 | É | J-5 avant une échéance | Besoins non saisis ou en attente par périmètre | Calendrier ECHEANCES, jours fériés | Rappel regroupé, un message par personne | Aucune (interne) | Application |
| AUT-02 | É | J-2 | Ce qui manque encore | Pas de doublon avec AUT-01 | Relance aux concernés seulement | Aucune (interne) | Application |
| AUT-03 | É | Jour J, 9 h | Retardataires | Absence du destinataire prise en compte | Dernier rappel ; e-mail aux retardataires (D86) | Rodage D94 | Application, e-mail |
| AUT-04 | É | Échéance atteinte | Mois cible | Calendrier | Mois verrouillé (D78), bilan à J+1 pour l'agence et la cliente (EV-31) | Aucune (interne) | Application |
| AUT-05 | É | Demande après verrouillage | Demande | Mois verrouillé | Demande enregistrée « reportée » sur M+1 | Aucune ; réouverture par l'agence seule | Application |
| AUT-06 | H | Clôture de semaine (jour paramétré) | EV-01 à 25 de la semaine | Semaine clôturée, imports à jour | R-04, R-10 en brouillon | Relue par l'agence | Application |
| AUT-07 | H | Lundi, heure paramétrée | Retards et échéances de la semaine | Droits de la cliente | Résumé personnalisé (D84) ; e-mail sans chiffre avec lien (D86) | Rodage D94 | Application, e-mail |
| AUT-08 | H | Vendredi soir | Journal | Cohérence stock et flux | **Instantané hebdomadaire** du stock par état, contrôle de la reconstitution (§7.4) | Aucune | Interne |
| AUT-09 | M | Clôture mensuelle | Budget, consommé, prévisionnel, activité, R-01 | Couverture de calcul, tarifs complets, écarts rapprochés (contrôles bloquants) | R-02 et R-12 en brouillon | Agence, puis cliente | Application, PPTX, PDF |
| AUT-10 | M | Génération du COPIL | Décisions et actions du COPIL précédent | Statuts à jour | Page « suivi du COPIL précédent » préremplie | Relue | Application |
| AUT-11 | T | Fin de trimestre | Historique figé | Idem AUT-09 | R-03 en brouillon | Agence | Application, PPTX, PDF |
| AUT-12 | V | EV-27 réallocation validée | Mouvement | Double validation faite | Recalcul, note R-08, alerte F-60.10 | Automatique (information) | Application |
| AUT-13 | V | Besoin en retard ou démarrage proche sans affectation | Besoin, date de début | Statuts à jour | R-07, alerte F-60.5 | Agence | Application |
| AUT-14 | V | EV-34 ou anomalie bloquante | Import | Contrat de fichier | R-11 | Référent data | Application |
| AUT-15 | V | EV-28 ou EV-29 | Enveloppe, besoin | Seuils paramétrés | Alertes F-60.9, F-60.11 | Arbitrage humain | Application |
Contrôles communs à tout rapport : style (aucun cadratin, aucune construction antithétique, aucun trait droit, D62), fidélité au gabarit (minimum 70 %, D72), droits, couverture de calcul, empreinte des données, statut « Démo » ou « Réel ». Un rapport en échec n'est pas publié ; la cause et l'action sont indiquées. Chaque exécution est journalisée (qui, quand, paramètres, version de la règle), rejouable sans doublon, avec arrêt d'urgence unique (doc 12 §6).

### Calendrier type, vérifié au 23/10/2026
Jours ouvrés comptés avec les fériés de novembre et décembre 2026 (le 11/11 est férié).
| Échéance | Date limite | J-5 | J-2 | Jour J, 9 h | J+1 (bilan) |
|---|---|---|---|---|---|
| Novembre, changements (date fixe) | ven. 30/10 | **ven. 23/10, aujourd'hui** | mer. 28/10 | ven. 30/10 | lun. 02/11 |
| Décembre, saisie des besoins (Standard) | mar. 17/11 | lun. 09/11 | ven. 13/11 | mar. 17/11 | mer. 18/11 |
| Décembre, changements (Standard) | mar. 24/11 | mar. 17/11 | ven. 20/11 | mar. 24/11 | mer. 25/11 |
Pour l'échéance du 30/10, le rappel J-5 tombe aujourd'hui : en production il partirait immédiatement. Les lundis de résumé à la cliente de novembre : 02, 09, 16, 23 et 30.

## 7. Mode « état des lieux des besoins selon les recrutements » (D68)

### 7.1 Objet
Montrer à la cliente, à une date donnée, où en sont les besoins de merchandising selon les recrutements effectués, comparer deux dates et expliquer les écarts, sans que l'agence reconstitue le tableau à la main. Le mode alimente le rapport R-01 et la page de type `besoins_recrutements` du moteur (doc 22).

### 7.2 États de l'entonnoir
Les statuts ne sont jamais condensés en un seul champ (CLAUDE.md). L'entonnoir est calculé à partir des événements, avec un seul état courant par besoin.
| État | Définition | Entre par | Source probable (colonne du dictionnaire) | Mapping |
|---|---|---|---|---|
| À recruter | Besoin validé par la chaîne managériale et pris en charge par l'agence, sans recherche commencée | EV-06 ou EV-07, puis EV-09 | Statuts de besoin | À confirmer |
| En recrutement | Recherche en cours | EV-13 | AA « Recrutement » = En cours ; Z nombre de CV | À confirmer (4 valeurs dont 2 connues) |
| Proposé | Candidat proposé à la cliente, décision attendue | EV-10 | V « Nom proposé » renseigné ; U vide | À confirmer |
| Validé | Décision « Validée » de la cliente, recrutement à finaliser | EV-11 | U « Statut proposition » = Validée | À confirmer |
| Recruté | Recrutement finalisé (D11) | EV-14 | AA = OK (hypothèse) | À confirmer |
| En poste | Poste démarré (D11) | EV-16 | AD « Date de prise de poste » atteinte | À confirmer |
Positions hors entonnoir (D85), comptées à part :
| Position | Règle |
|---|---|
| Réattribué | Merch déjà sur le secteur qui prend un nouveau magasin. Compté dans « En poste » avec le secteur d'origine affiché (EV-18) |
| Stoppé | Besoin arrêté, motif obligatoire (EV-19). Sort du taux (proposition, voir §11 point 5) |
| Zone blanche | Non pourvable (EV-20). Sort du taux « heures pourvues », ligne « non pourvable » séparée |
Retours en arrière (D97) : un refus de la cliente (U = Refusée) ou un désistement (EV-21) ramène le besoin à « En recrutement » ; le compteur de refus et de désistements est affiché. Une nouvelle proposition invalide la décision précédente (EV-12).

**Mot « Pourvu ».** D11 demande de remplacer « Pourvu » par « Recrutement finalisé » et « Poste démarré ». D85 valide « Pourvu » comme statut visible au secteur. Proposition D92 : conserver « Pourvu » dans les rapports de la cliente avec le sens « En poste », et afficher en regard « Recruté, poste pas encore démarré » pour ne pas masquer l'écart.

### 7.3 Mesures
| Mesure | Définition |
|---|---|
| Entonnoir | Nombre de besoins et heures par semaine, par état, à la date de référence |
| Heures demandées | Somme des heures par semaine des besoins actifs à la date de référence |
| Taux d'heures recrutées | Heures par semaine à l'état Recruté ou En poste ÷ heures demandées, Zone blanche exclue du numérateur et du dénominateur |
| Taux d'heures en poste | Heures par semaine à l'état En poste ÷ heures demandées, même règle |
| Heures sur la période | Heures par semaine × semaines couvertes entre début et fin du besoin, recoupées avec la période du rapport |
| Jours et créneaux | Répartition demandé et pourvu par jour de la semaine et par créneau (colonnes Q et R) |
| Désistements et refus | Nombre et part des besoins revenus à « En recrutement » |
| Retard de prise de poste | Jours ouvrés entre le début demandé du besoin et la prise de poste ; un besoin non pourvu après sa date de début est « en retard » |
| Âge de vacance | Pour une zone blanche : durée depuis la décision, sans délai de recrutement |
| Financier | Aux niveaux national, DR et CVR : quota, consommé, prévisionnel, restant, atterrissage. Au secteur : consommé et poids indicatif dans l'enveloppe du CVR, aucun quota (D85). Coût engagé « Non chiffré » si le tarif manque |
**Délais (D87, précisé par D93).** Quatre jalons : J1 soumission à proposition, J2 proposition à décision, J3 décision à recrutement finalisé, J4 décision à prise de poste. Chaque jalon est mesuré **par situation** : recrutement nouveau, réattribution (zone blanche : pas de délai, voir âge de vacance). Indicateurs : médiane, minimum, maximum, effectif. Sous un effectif minimal (valeur proposée : 5, paramétrable), la page écrit « effectif trop faible pour conclure ». La mesure sur un trimestre reste à lancer (D87).

### 7.4 Historisation et comparaison
- Le journal (D91) contient chaque changement d'état. L'état d'un besoin à la date T est le dernier événement dont la date d'effet est inférieure ou égale à T.
- Deux lectures : **état effectif** (ce qui était vrai à la date T, corrections tardives incluses) et **état connu** (ce que la plateforme savait à la date T, selon la date de saisie). Défaut proposé : état effectif ; l'état connu sert à expliquer un écart avec un rapport déjà publié.
- Comparaison T1 puis T2 : stock à T1 + entrées − sorties = stock à T2, par état. Les flux (nouveaux besoins, passages d'un état à l'autre, stoppés, zones blanches) sont affichés, ce qui explique chaque variation.
- L'instantané hebdomadaire (AUT-08) fige le stock par état chaque vendredi. Il sert de contrôle : l'état reconstitué à cette date doit lui être identique.
- Une correction rétroactive est un nouvel événement avec sa date de saisie, jamais une réécriture. Un mois clos refuse la modification (règle existante de la clôture).

### 7.5 Paramètres du mode
| Paramètre | Valeurs |
|---|---|
| Date de référence | Jour précis (clôture de semaine ou de mois proposées par défaut) |
| Lecture | Effectif (défaut) ou connu |
| Comparaison | Aucune, date antérieure, période précédente, même période de l'an passé |
| Périmètre | National, régions, secteurs (cases à cocher), regroupements par DR et CVR ; niveau de détail région, secteur, magasin (doc 23, annexe Excel de la liste complète) |
| Campagne et type | Permanent, Saisonnier, Horaire, Second placement, toutes |
| Indicateurs financiers | Quota, consommé, prévisionnel, restant, atterrissage, coût engagé |
| Indicateurs d'horaires et de jours | Heures par semaine, heures sur la période, jours, créneaux, couverture, non-couverture |
| Délais | Situations affichées, effectif minimal |
| Affichage | RS non affiché par défaut, coûts affichés ou non (D66, choix de l'agence), langue FR ou EN, type de graphique Auto ou choisi (D88) |
| Sortie | Écran, PPTX, PDF, annexe Excel (D89) |
Qui règle : agence opérationnelle (D73). CVR et DR consultent leur périmètre sans ajuster (D87).

### 7.6 Pages du mode et graphiques (selon doc 25)
| Page | Contenu | Graphique par défaut |
|---|---|---|
| Entonnoir | Besoins et heures par état, positions hors entonnoir sur lignes séparées | Barres dans l'ordre du cycle |
| Heures demandées et pourvues | Taux recrutées et en poste, écart à la cible | Jauge avec valeur écrite, ou barre de progression |
| Évolution entre deux dates | Stock à T1 et T2, flux entre états | Colonnes empilées |
| Délais par situation | Médiane, étendue, effectif par jalon | Barres avec tableau |
| Retards et besoins à risque | Besoins en retard, démarrages sans affectation, désistements | Tableau classé |
| Régions, secteurs, magasins | Pages de détail paginées (doc 23), statuts Pourvu, Réattribué, Stoppé, Zone blanche | Tableau |
| Finances | Quota, consommé, prévisionnel, restant au niveau DR et CVR | Barres horizontales classées |
| Décisions à prendre | Arbitrages issus des alertes | Liste |
Extension de la spécification de rapport (clés existantes conservées, nouvelles clés facultatives) :
```json
{"type": "besoins_recrutements",
 "date_reference": "2026-10-15",
 "date_comparaison": "2026-09-01",
 "lecture": "effectif",
 "secteurs": ["Région 1", "Région 2"],
 "regroupement": "dr",
 "campagnes": ["Permanent", "Saisonnier"],
 "indicateurs": ["entonnoir", "heures", "jours", "delais", "desistements"],
 "indicateurs_financiers": ["quota", "consomme", "previsionnel", "restant", "atterrissage"],
 "delais": {"situations": ["nouveau", "reattribution"], "effectif_min": 5},
 "afficher_rs": false,
 "graphique": {"type": "auto"},
 "annexe_excel": true}
```

### 7.7 Critères d'acceptation vérifiables
1. Pour toute date de référence, la somme des besoins par état, plus les stoppés, plus les zones blanches, égale le nombre de besoins actifs à cette date.
2. Entre deux dates, stock initial + entrées − sorties = stock final, état par état.
3. L'état reconstitué à une date d'instantané hebdomadaire est identique à l'instantané.
4. Une zone blanche n'entre ni au numérateur ni au dénominateur des taux ; elle a sa ligne.
5. Un coût inconnu ne devient jamais zéro ; un tarif manquant donne « Non chiffré ».
6. Aucun nom d'intervenant ni de RS dans l'export de la cliente par défaut ; un périmètre non autorisé ne renvoie rien.
7. Sous l'effectif minimal, aucun délai n'est présenté comme conclusion.
8. Mêmes paramètres et mêmes données donnent le même fichier (empreinte identique).
9. Jeux d'essai fictifs couvrant : refus de la cliente, désistement, réattribution, besoin stoppé, zone blanche, correction rétroactive, 2026-S53 vers 2027-S01.

### 7.8 Cas limites à tester
Prise de poste avant décision de la cliente (incohérence signalée, jamais corrigée en silence) ; besoin modifié après proposition ; besoin sur plusieurs magasins ; changement de secteur d'un merch ; saisie tardive après clôture ; deux désistements successifs sur un même besoin ; besoin à cheval sur deux mois dont l'un est verrouillé.

## 8. Les trois rapports prioritaires
| Rapport | Pourquoi maintenant | Contenu minimal | Déclencheur | Validation | Critère de réussite |
|---|---|---|---|---|---|
| **R-01 État des besoins et recrutements** | Demande explicite de T. SOEFOU (D68) ; alimente R-02 et R-05 | Entonnoir, heures demandées et pourvues, délais par situation, comparaison de deux dates | Clôture de semaine, clôture de mois, à la demande | Agence avant publication | Critères du §7.7 passés sur jeux d'essai fictifs |
| **R-02 COPIL mensuel** | Cœur de la demande D58 à D60 (objectif 80 %) ; prototype V3.1 déjà disponible | Synthèse, budget, évolution, recrutements, détail région, photos, décisions, suivi du COPIL précédent | Clôture mensuelle | Agence, puis cliente | Génération sans saisie manuelle de chiffres ; contrôles bloquants actifs |
| **R-05 Suivi des échéances et retards** | Traite la cause du débordement sur le mois suivant (23/10) ; décisions D78 à D82 prêtes | Compte à rebours, avancement, retards par région, bilan J+1, résumé du lundi | Cascade AUT-01 à 05 | Interne ; e-mail en rodage | Aucun besoin saisi après verrouillage sans passer par le report ou la réouverture |
Viennent ensuite R-04 et R-06, qui réutilisent les mêmes événements à faible effort.
Lots : R-05 en A4a, R-02 en A4c1, R-01 et boucles AUT-06 à 11 en A4c2. Les événements EV sont émis dès A2 et A3, faute de quoi A4c2 n'aurait rien à lire.

## 9. Objectif « éviter 80 % du travail administratif » : méthode de mesure (D96)
Cible à mesurer, jamais une promesse. Aucun chiffre de référence n'a été fourni : toutes les cases « temps actuel » restent à renseigner.
| Tâche administrative | Fréquence | Temps actuel | Temps cible dans la plateforme | Source de l'écart |
|---|---|---|---|---|
| Collecter les chiffres dans plusieurs fichiers | par COPIL | à mesurer | quelques minutes de relecture | Collecte unique côté serveur |
| Recalculer, recopier dans les diapositives | par COPIL | à mesurer | nul | Calcul déterministe, graphiques générés |
| Rédiger titres et « à retenir » | par COPIL | à mesurer | relecture | Règles de phrases |
| Relancer les retardataires | par échéance | à mesurer | nul | AUT-01 à 03 |
| Consolider les besoins par région | par mois | à mesurer | nul | Saisie directe, R-05, R-06 |
| Suivre décisions et recrutements | par semaine | à mesurer | relecture | R-01, R-04 |
| Contrôler les chiffres | par COPIL | à mesurer | contrôle des alertes bloquantes | Contrôles automatiques |
| Exporter, mettre en forme, envoyer | par COPIL | à mesurer | validation | File « à envoyer » |
Méthode : chronométrer deux cycles actuels (temps humain actif, hors attente), puis deux cycles dans la plateforme. Gain = 1 − (temps après ÷ temps avant). Le temps de relecture, de commentaire qualitatif et de validation compte dans « après ».

## 10. Impacts
| Élément | Ajout proposé |
|---|---|
| Catalogue doc 16 | F-70.9 état des besoins et recrutements (R-01) ; F-70.10 suivi des échéances (R-05) ; F-95.8 journal des événements métier ; F-90.10 horloge de démonstration ; F-90.11 instantané hebdomadaire. Reprises du doc 20 : F-70.7, F-70.8, F-90.9 |
| Alertes | F-60.20 désistement ou départ ; F-60.21 rapport en échec de contrôle (s'ajoutent à F-60.16 à 19 du doc 24) |
| Lots | A2 : émission EV-01 à 05 et 30 à 33 ; A3 : EV-06 à 21 ; A4a : R-04, R-05, R-06 ; A4b : EV-26 à 29, R-08, R-09 ; A4c1 : moteur, R-02, R-03 ; A4c2 : R-01, AUT-06 à 11, horloge ; A5 : EV-22 à 25, R-10 ; A6 : EV-34. A0b : lever le mapping du §7.2 |
| Données | Tables EVENEMENTS (append seulement), INSTANTANES_HEBDO, ECHEANCES (doc 24), RAPPORT_SPEC (versionnée), RAPPORT_EXECUTION (empreinte, statut), FILE_ENVOIS. Interface `Repository` inchangée |
| Droits | Écran de composition réservé aux profils agence (D73) ; consultation de leur périmètre pour CVR et DR (D87) ; aucune donnée sensible dans une alerte ou un message |
| Tests | Table de règles des états, reconstitution à date, flux, calendrier avec jours fériés, contrôle de style, jeux d'essai du §7.7 |
Charge : A4c devient lourd, d'où la scission proposée en D95. Aucune durée estimée ici.

## 11. Points ouverts et questions
| # | Question | À trancher avec |
|---|---|---|
| 1 | « Pourvu » dans les rapports désigne-t-il « En poste » (proposition D92) ? | T. SOEFOU, métier cliente |
| 2 | Après deux cycles en file validée, les rappels D86 peuvent-ils partir automatiquement ? Ils contiennent un gabarit sans chiffre, mais ils sortent de la plateforme | T. SOEFOU, Impact |
| 3 | Où est enregistré aujourd'hui un désistement ou un départ de poste (EV-21) ? Aucune source lue ne le porte | Impact |
| 4 | Valeurs exactes de la colonne « Recrutement » et sens de « OK » (lot A0b) | Impact, métier cliente |
| 5 | Un besoin stoppé sort-il du dénominateur des taux ? Proposé oui, avec ligne séparée | T. SOEFOU |
| 6 | Effectif minimal des délais (5 proposé) | T. SOEFOU |
| 7 | Lecture par défaut : état effectif ou état connu ? | T. SOEFOU |
| 8 | Durée de conservation du journal d'événements (D18) | Impact, DPO |
| 9 | COPIL réel passé : toujours absent, le contenu de R-02 reste une hypothèse | Impact |
| 10 | Chronométrage de référence du §9 : qui le réalise et sur quels cycles ? | Impact |
| 11 | Droits déjà ouverts et non répétés ici : logo Suntory (D25), gabarit et police du modèle, photo de couverture, code Nielsen dans les exports | Impact, cliente |
| 12 | Synchronisation du dépôt : les copies des docs 22 à 24 dans `08_PLATEFORME_SUNTORY_V3/docs/COMPLEMENTS_CADRAGE/` diffèrent des originaux et le doc 25 n'y figure pas | T. SOEFOU |

## 12. Mise à jour de mémoire proposée (non enregistrée)
Étape C cadrée le 23/10/2026 : trois catalogues liés (37 événements, 15 rapports, 15 automatisations) ; journal d'événements daté deux fois ; entonnoir de recrutement à six états avec « Pourvu » = poste démarré ; délais par situation en médiane, étendue et effectif ; cinq familles de boucles, rien ne part seul ; trois rapports prioritaires (état des besoins et recrutements, COPIL mensuel, suivi des échéances) ; A4c scindé ; objectif de 80 % à mesurer sur deux cycles. Décisions D90 à D97 validées par T. SOEFOU le 23/10/2026.
