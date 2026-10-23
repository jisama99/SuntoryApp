# Plan des lots A1 à A7 ajusté · Lot A0

Date : 23/10/2026 · Base : `03_LOTS_DEV.md` (validé le 23/10 avec A4c1, A4c2, A5b). **Aucune durée n'est estimée** (consigne du lot). Les scissions ci-dessous sont des **propositions**, non des décisions.

## 1. Tableau de synthèse

| Lot | Objet (rappel) | Dépend de | Décisions ouvertes qui le touchent | Verdict A0 |
|---|---|---|---|---|
| A0b | Cadrage des données Excel (D50–D53) | A0 | D24 (sources absentes, 4C vide), D51 mécanisme | Absent du prompt A0 ; à lancer **avant A2**, pas nécessairement avant A1 |
| A1 | Socle, navigation par profil, i18n, accessibilité, aperçu | A0 validé | D25 (logos, fonds de carte), D30–D31 | **À lancer en premier** ; comprend l'installation, `.gitignore` corrigé, workflow d'aperçu |
| A2 | Saisie des besoins, semaine ISO, doublons, échéances | A1, A0b | Q6–Q8, D78–D82 | **À scinder** en A2a et A2b (voir §2) |
| A1e | Identité visuelle, titres, skin d'accueil (D160, D161) | A2b | D163 (droits des visuels) | Noyau ; prompt `24_PROMPT_LOT_A1E.md` |
| A1f | Connexion par identifiant et comptes gérés par l'agence (D188, D189) | A1e | Aucune (D189 validée) | Noyau, avant A3 ; prompt `28_PROMPT_LOT_A1F.md` |
| A3 | Propositions, décisions, qui doit agir, entonnoir | A2 | D11/D92, D97 | Charge élevée ; scission optionnelle A3a / A3b |
| A3c | Validation CVR, escalade DR, délégations, qualification agence (F-30.1 à F-30.4) | A3 fusionné | D09 (RACI, délais), D43 (enveloppe, branchée en A4b1) | Correctif de périmètre issu du compte rendu A3 ; prompt `33_PROMPT_LOT_A3C.md` |
| A4b1 | Enveloppe cliente, allocation agence, prévisionnel par besoin (D153, D157) | A3 | D07 | Noyau ; prompt `23_PROMPT_LOT_A4B1.md` |
| A4a | Lecture, indicateurs, alertes, tableau de bord cliente | A3 | D05–D08 (moteur financier : montants fictifs seulement), P3 graphiques | Garde ; fixer le choix de bibliothèque de graphiques en début de lot |
| A4d | Fiche secteur unique et plans d'action sur dépassement (D127) | A3, A4a, A5 | Q-N1-1 (D08), Q-N3-1 | Seconde démonstration ; prompt `21_PROMPT_LOT_A4D.md` |
| A4e | Carte de France interactive (D150) | A4a | Débloqué (D152) | Seconde démonstration ; prompt `22_PROMPT_LOT_A4E.md` |
| A4b2 | Réallocation à double validation et rallonges | A4b1, A4a | D43, D46 (règles d'allocation à préciser) | Garde ; dépend de règles incomplètes |
| A4c1 | Moteur de reporting, COPIL mensuel/trimestriel (PPTX, PDF) | A4a, A4b | D25, D69, D75 (droits logos, photo, gabarit), D83 | **Bloqué en partie** : gabarit COPIL « à produire avant » (D61), aucune trame réelle fournie (D69) |
| A4c2 | R-01 État des besoins et recrutements, boucles AUT-06 à 11, horloge | A4c1 ; événements de A2/A3 | D93, D94, D96 | Garde ; dépend de l'émission d'événements dès A2 |
| A5 | Terrain mobile, absences | A3 | D14/D15 révisées par D42, Q19 | À relire à la lumière de D42 (pas de compte intervenant) |
| A4f | Vue Planning (D190) | A5 | Aucune | Noyau, après A5 ; prompt `30_PROMPT_LOT_A4F.md` |
| A4g | Notifications et préférences d'alerte : réglages agence, « Mes notifications », centre, file push simulée (D205 à D208 proposées) | A3, A4a, A4f | Alertes obligatoires, heures calmes (hypothèses à valider) | Noyau si le calendrier du 10/11 le permet, sinon seconde démonstration ; prompt `32_PROMPT_LOT_A4G.md` ; aucun envoi réel |
| A5b | Photos terrain sur images fictives | A5 | D101 (enseignes), D102 (durée par Impact) | Garde ; images générées |
| A6 | Import Excel en quarantaine | A2 | D04/Q20, D51, P4 (bibliothèque) | Garde |
| A7 | Recette, script de démonstration, captures | A1 à A6 | Q1–Q23 à provoquer | Garde |
| A8 | Signalement d'un problème et écran Demandes (D164) | A7 | Adresse de notification en variable | Après le noyau ; `25_PROMPT_LOT_A8.md` |
| A9 | Déploiement OVHcloud (D165, D166) | Démonstration validée, abonnement | Abonnement à prendre | Après validation ; `26_PROMPT_LOT_A9.md` ; porte aussi le Web Push réel et la PWA (service worker, clés VAPID, HTTPS) |

## 2. Scissions proposées

| Lot | Scission | Raison |
|---|---|---|
| A2 → A2a | Règles pures (semaine ISO, W1–W22, D1–D7), événements, saisie unitaire et duplication | Cœur testable table par table ; peu de dépendance visuelle |
| A2 → A2b | Saisie en lot, brouillon automatique, résumé, échéances et blocage (D78–D82), alertes J-5/J-2 | Dépend du calendrier paramétré par l'agence et de l'écran de lot |
| A3 → A3a / A3b (optionnel) | A3a propositions versionnées, décisions, qui doit agir ; A3b entonnoir D92, retours D97, délais D93 | Éviter une session trop longue ; A3b alimente A4c2 |
| A4c1 | Première session = moteur et un gabarit **sans** logos ni photo de couverture réels ; seconde = intégration des visuels quand D25/D75 sont levés | Droits non résolus |

## 3. Chemin critique et date

- Séquence minimale : A0 → A1 → A2a → A2b → A3 → A4a → … → A7. A0b et A6 se placent hors de la chaîne principale.
- Nombre de lots du registre : 13 (A0, A0b, A1, A2, A3, A4a, A4b, A4c1, A4c2, A5, A5b, A6, A7), 15 avec les scissions A2 et A3 proposées. Chaque lot = une session + validation entre deux (règle projet).
- La V0.4 annonce un démonstrateur cible au **10/11/2026 (S46)**, soit 18 jours calendaires après le 23/10 (calcul vérifié). **Je ne peux pas, sans estimation de durée, affirmer que ce périmètre tient.** Constat factuel : le périmètre validé depuis la V0.4 (reporting, boucles, photos) n'y figure pas (écart E04).
- **Option à décider** (recommandation) : présenter à la date cible un **noyau** (A1, A2, A3, A4a, A5, A6) et reporter A4b, A4c1, A4c2, A5b à une seconde démonstration annoncée comme telle. Alternative : tenir le périmètre complet et annoncer une nouvelle date (D26 est ouvert dans le registre).

## 4. Points de contrôle d'aperçu par lot (selon PILE_PROPOSEE.md §5)

| Lot | Captures attendues (profils × FR/EN × bureau/mobile) |
|---|---|
| A1 | Connexion simulée, une page vide par profil, bandeau « DONNÉES FICTIVES », sélecteur de langue |
| A2a/A2b | Saisie unitaire, alerte doublon, correction de semaine, saisie en lot, blocage après échéance |
| A3 | Besoin → proposition → décision, refus puis nouvelle proposition |
| A4a/A4b | Tableau de bord par rôle, barre d'alerte, classement, réallocation à double validation |
| A4c1/A4c2 | Aperçu des pages du COPIL, R-01, pages de détail (sans logos tant que D25 est ouvert) |
| A5/A5b | Parcours mobile 390 px, absence, galerie photos fictives |
| A6 | Aperçu d'import, conflit, rapport d'idempotence |
| A7 | Jeu complet de captures du script de démonstration |

## 5. Ce qui bloque et qui peut décider

| Blocage | Lot | Décideur | Action |
|---|---|---|---|
| Droits logos / fonds de carte (D25, Q22) | A1, A4c1 | Cliente, agence | Placeholders et fond neutre en attendant |
| Gabarit COPIL (D61, D69) | A4c1 | T. SOEFOU, Impact | Produire le gabarit ou travailler sur une trame minimale |
| Définition du consommé (D05) | A4a | Finances cliente, agence | Montants fictifs étiquetés, aucun moteur réel |
| Libellés DR/CVR/RS (G1) | A1 | Cliente | Sigles affichés |
| Hébergement (D02/D19) | Déploiement du démonstrateur | T. SOEFOU | Local par défaut |

## 6. Critères d'acceptation ajoutés par les consignes du 23/10 (propositions)

| Lot | Critère |
|---|---|
| A1 | Composant `ZoneLabel` unique ; `AccessContext` unique ; champ `audience` obligatoire sur les alertes ; tests statiques et inter-profils correspondants (INVENTAIRE_V4_CODE.md §4) |
| A2a / A2b | Alertes de saisie et d'échéance émises avec leur audience |
| A4a | Tableau de bord et « actions à traiter » : une alerte agence n'apparaît dans aucun profil cliente, CVR, DR, ni dans l'e-mail ni dans le rapport |
| A4c1 | Exports : mêmes libellés de zone et mêmes règles d'audience que l'interface |
| A1 (cartographie) | Document `docs/CARTOGRAPHIE.md` seulement (plan, sources, licence à vérifier, importeur local D109 bis) ; la carte elle-même vient en A4a |
