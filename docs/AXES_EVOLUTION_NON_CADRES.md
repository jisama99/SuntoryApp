# Axes d'évolution et pistes d'amélioration non cadrés · analyse du dossier « Proposition cliente via agence »

Date : 23/10/2026. Statut : **analyse et propositions**, aucune décision. Aucun chiffre ni nom propre de la source n'est repris ici.

> **Mise à jour du 23/10/2026** : N1, N2, N3 et N9 sont cadrés (D127, D128) dans `COMPLEMENTS_CADRAGE/28_CADRAGE_AXES_N1_N2_N3_N9_V0.1.md`. D129 et D130 restent proposées. Les autres axes restent non cadrés.

## 1. Sources lues
| Source | Contenu exploité |
|---|---|
| `Refonte_V3_..._Presentation_Cliente_V0.4.html` (et V0.3, V0.2 pour comparaison) | Lecture de `window.C` : 13 problématiques, 12 audits, **37 pistes d'amélioration** (L, A, F, R), 23 questions de décision, glossaire, limites, alertes, indicateurs d'absence, phases |
| `Workshop 2027.pdf` (20 pages) | 5 sujets, 16 thèmes : dispositifs, recrutement et RH, données et pilotage, budget et ROI, process et partage ; propositions de contrôle qualité ; audit saisonniers ; feuille de route S41 à S13 |
| `Suntory_Refonte_V3_..._Prompt_Claude_Code.md` | Déjà exploité au lot A0 (workflows WF-A1 à WF-E7) |
Comparé à : catalogue fonctionnel V0.1 (doc 16), registre `DECISIONS.md`, `STATUTS_ET_ETATS.md`, `DICTIONNAIRE_DONNEES.md`, prompts de lots.

## 2. Ce qui est déjà cadré (30 des 37 pistes)
Contrôles à la saisie, semaine ISO, alertes configurables, vues enregistrées, couleurs et légende, définitions d'indicateurs, relances, clôture guidée, duplication, rapport hebdomadaire, saisie en ligne partagée, statuts partagés, validation en lot, notifications, application RS en PWA, absences, authentification, journal d'audit, tableau de bord de service agence, reporting des carences.

## 3. Axes non cadrés ou cadrés en surface
| N° | Axe | Source | Constat dans nos documents | Proposition | Décision attendue |
|---|---|---|---|---|---|
| N1 | **Fiche secteur unique** : besoins, propositions, absences, consommation et historique d'un secteur sur un écran | Piste L6 (valeur haute) | Absente du catalogue | Fonction F-10.13, écran de A4a ou seconde démonstration ; sert aussi de base au point mensuel (N8) | T. SOEFOU |
| N2 | **Comparaison semaine N / N-1** des heures, montants et dépassements | Piste L5 | Absente | Option de lecture des tuiles et graphiques de A4a, sans nouveau calcul de fond | T. SOEFOU |
| N3 | **Plans d'action sur dépassement** (responsable, action, échéance) | Piste R6 | Absente | Objet « action » rattaché à une alerte ; alimente le suivi du coaching (N13) | T. SOEFOU |
| N4 | **Couche carences sur la carte** | Piste L4 | Carences cadrées, pas leur représentation cartographique | À prévoir avec la carte (`CARTOGRAPHIE.md`), pas avant | Aucune maintenant |
| N5 | **Indicateurs de recrutement et de fidélisation** : renouvellement par dispositif, canaux d'origine des candidatures, fidélisation | Workshop (sujet 1), V0.4 (repères KPI 2027) | Entonnoir D92 cadré ; ces indicateurs absents. La liste des KPI 2027 reste ouverte (doc 16 §13) | Famille d'indicateurs « recrutement » dans le catalogue ; à fixer avec la cliente | Cliente : KPI prioritaires |
| N6 | **Vivier de saisonniers recommandés** (transmission de la matrice des recommandés) | Workshop, feuille de route | Absent | Fonction réservée à l'agence ; **traitement de données de personnes nommées** : qualification RGPD et durée de conservation avant tout cadrage fonctionnel | DPO, Impact |
| N7 | **Enquêtes de satisfaction** (bilan de mission, audit des saisonniers) comme indicateurs | Workshop (sujet 5) | Absent | Import d'indicateurs agrégés par l'agence, sans donnée individuelle ; hors cœur de la plateforme | T. SOEFOU |
| N8 | **Point avant démarrage et point mensuel CVR / coachs** : validation de la localisation, ordre du jour alimenté par les données | Workshop (sujet 1) | Absent | Rapport « préparation du point mensuel » dans la matrice de boucles (A4c2), nourri par la fiche secteur (N1) | T. SOEFOU |
| N9 | **Règles par dispositif et par campagne** (second placement 2027) : durée minimale d'intervention, forfait kilométrique moyen, saisie l'avant-dernière semaine du mois, effet le mois suivant, dépôt dix jours avant, une campagne pour un seul dispositif | Piste A10, question Q21 de la V0.4, Workshop | Seules les deux échéances mensuelles (D80) sont cadrées. **Q21 de la V0.4 n'existe pas dans notre registre** (notre Q21 traite d'autre chose) | Ajouter la dimension « dispositif » aux campagnes et un jeu de paramètres par dispositif, inclus dans A2b ; forfait kilométrique dans les tarifs datés (D06) | Cliente, agence |
| N10 | **Projection annuelle ou semestrielle** avec semaines de début et de fin, et transmission des besoins de l'année | Workshop (sujet 1 bis et feuille de route) | Projection évoquée dans les statuts, pas comme fonction | Saisie ou import d'une projection par secteur, comparée ensuite au besoin réel | T. SOEFOU |
| N11 | **Passerelle avec l'application collaborateur de l'agence** : disponibilités, collaborateurs déjà intervenus sur le secteur, souhait du RS | Workshop, Q10 de la V0.4 | Glossaire seulement (« hors périmètre à ce stade ») | Décision de frontière d'abord ; si retenue : lecture seule, pas de nouveau compte intervenant (D42) | Agence, cliente |
| N12 | **Contrôle qualité des visites** (toutes les visites, relance le jour même, reporting à trois rythmes : jour, semaine, mois) | Workshop (proposition), piste R10 | Absent | **Ne pas coder** tant que la frontière n'est pas qualifiée avec les propriétaires des outils de visite ; prévoir un contrat de données en lecture et un indicateur de taux d'anomalies par secteur | Agence, cliente |
| N13 | **Suivi du coaching** et rôle « coach » | Workshop (sujet 3) | Aucun profil coach ; nos sept profils ne couvrent ni coach ni chef de projet | Question de périmètre : le coaching reste hors plateforme, sauf consultation de la fiche secteur | T. SOEFOU |
| N14 | **ROI du merchandising** : méthode partagée (indicateurs, périmètre, fréquence) | Workshop (sujet 4), V0.4 (« impact commercial non mesuré ») | Absent | Étude de cadrage, pas du développement : dépend de données de ventes de la cliente | Cliente |
| N15 | **Aide en ligne, FAQ et « qui fait quoi »** pour les CVR et les RS | Workshop (sujet 5) | Absent ; le RACI figure comme manquant (doc 16 §13) | Page « qui fait quoi » et aide contextuelle, contenus par l'agence ; faible effort | T. SOEFOU |
| N16 | **Rapprochement activité et facturation** | Piste R5, Workshop (sujet 3) | Classé phase C (F-50.7), alors que la source le juge de valeur haute | Réexaminer le classement après le démonstrateur | T. SOEFOU, cliente |

## 4. Points à clarifier avec la source
| Point | Problème | Question |
|---|---|---|
| « Indice de passage envoyé via l'application » | Terme non défini dans nos documents | Que désigne-t-il et à qui est-il envoyé ? |
| « CS » dans les règles du second placement | Acronyme absent du glossaire | Quel rôle, côté cliente ou agence ? |
| Accès des RS à leur budget et à leurs carences dans un outil de BI | La source propose la BI ; notre cadrage propose la plateforme (D08, D43, D44) | Où les RS consultent-ils leur budget, et avec quelle visibilité des coûts ? |
| Deux numérotations de questions | Les Q1 à Q23 de la V0.4 diffèrent des questions du questionnaire A0 (ex. Q10, Q11) | Préfixer les questions de la V0.4 (Q-V0.4-nn) dans le registre |

## 5. Tensions avec nos principes
- **Personnes ou secteurs.** Nos règles classent des secteurs, jamais des personnes (F-10.5). Le contrôle qualité et le suivi du coaching de la source portent sur des promoteurs et des coachs nominativement : incompatible sans décision explicite.
- **Données de personnes.** Vivier (N6), enquêtes individuelles (N7), disponibilités (N11) créent de nouveaux traitements : qualification RGPD, durée de conservation (D18) et visibilité par rôle (D08) avant cadrage.
- **Périmètre.** Contrôle qualité, formation, congés et FAQ relèvent d'autres outils selon la source. Chaque ajout doit dire s'il est lu, écrit ou seulement référencé.
- **Calendrier.** La feuille de route du Workshop (mise en place du fichier unique et des alertes, ouverture du suivi de recrutement aux RS, kick-off 2027 avec les CVR) doit être alignée avec la démonstration du 10/11 et le MVP.

## 6. Mise à jour proposée du registre (non enregistrée)
| Réf. | Objet | Proposition |
|---|---|---|
| D127 | Axes N1 à N3 | Fiche secteur, comparaison N / N-1 et plans d'action ajoutés au catalogue (F-10.13 à F-10.15), à placer après A4a |
| D128 | Dispositifs | Dimension « dispositif » et paramètres par dispositif (N9) intégrés à A2b ; Q21 de la V0.4 reprise sous un identifiant distinct |
| D129 | Frontière de périmètre | N11, N12, N13 : décision de frontière avant tout développement (lecture, écriture ou hors plateforme) |
| D130 | Données de personnes | N6, N7 et N11 conditionnés à la qualification RGPD et à D18 |

## 7. Axes complémentaires du 23/10/2026 : imports d'extractions et automatisations

Constat. Les lots prévoient des automatisations de **sortie** (AUT-01 à AUT-05 en A2b, AUT-06 à AUT-11 en A4c2, AUT-12 à AUT-15 selon A4a et A4b) et un import Excel en quarantaine (A6) limité à **trois gabarits fictifs fixes**. Les adaptateurs de `MAPPING_SOURCES.md` §2 détectent les fichiers par des règles d'en-têtes écrites à la main. Aucun classeur ni extraction réelle n'a été ouvert (A0b) : les structures réelles ne sont pas vérifiées.

| N° | Axe | Constat | Proposition | Décision attendue |
|---|---|---|---|---|
| N17 | **Assistant de mappage d'import configurable** | Les adaptateurs sont figés ; une extraction qui change de structure (le brut LOGA existe en deux variantes de 72 et 123 colonnes) casserait l'import | Profils d'import versionnés (onglet, ligne d'en-tête, colonne source vers champ cible, transformations, clé de rapprochement). Proposition automatique de correspondances par similarité des en-têtes normalisés et par type de contenu (date, code CVR, code Nielsen, entier), validée par un humain puis enregistrée | T. SOEFOU |
| N18 | **Dictionnaire de valeurs à l'import** | Saisies libres avec variantes (casse, espaces, « OK » / « OK  ») | Table de correspondance valeur source vers liste fermée, alimentée à la validation de l'aperçu, réutilisée aux imports suivants | T. SOEFOU |
| N19 | **Détection de dérive de structure** | Colonne ajoutée, renommée ou déplacée : aujourd'hui blocage sec | Empreinte de structure par profil ; écart classé (colonne inconnue ignorée et listée, colonne obligatoire absente bloquante, renommage proposé) ; alerte réservée à l'agence (AUT-14) | T. SOEFOU |
| N20 | **Ingestion automatique des extractions** | D21 (dépôt manuel ou SharePoint) et D51 ouverts ; le Workshop évoque des alertes par Power Automate | Dépôt surveillé ou boîte de réception dédiée, passage au contrat de fichier, aperçu en file de validation. Rien n'est appliqué sans validation humaine tant que le rodage D94 n'est pas fait. Dépend du choix d'hébergement (D02, D19) et du mécanisme de dépôt (D21) | Impact, IT |
| N21 | **Annulation d'un import** | A6 couvre l'idempotence et le refus d'écraser, pas le retour arrière | Annuler un lot importé : restitue l'état précédent, tracé (acteur, motif), refusé si une décision cliente en dépend | T. SOEFOU |
| N22 | **Réconciliation automatique entre sources** | Écart TBB / 4C et LOGA traité seulement à l'étape B5 | Contrôles de cohérence à chaque import (somme des mois, nombre de CVR attendus, tolérance 0,01 €) avec écart en alerte, comme `MAPPING_SOURCES.md` §3 | T. SOEFOU |

**Ce que l'on sait faire et ce que l'on ne peut pas affirmer**
- Faisable : lecture d'un classeur ou d'un export, détection de l'onglet et de la ligne d'en-tête, correspondance colonne vers champ, normalisation, aperçu et rapport, idempotence. Tout se fait localement et de façon déterministe, sans envoyer les données à un service externe.
- Non affirmable aujourd'hui : que la détection fonctionne sur les extractions **réelles** de l'agence, faute de les avoir lues. La fiabilité se mesure sur des fichiers réels, par un test de structure (en-têtes, types de colonnes, taux de reconnaissance) sans copier de valeur dans le dépôt.
- Usage d'un modèle d'IA générative pour proposer les correspondances : possible sur les **seuls noms d'en-têtes**, jamais sur les valeurs ni sur des données de personnes (D17, D130). Non retenu par défaut.

**Mise à jour proposée du registre (non enregistrée)**
| Réf. | Objet | Proposition |
|---|---|---|
| D134 | Imports configurables | N17 à N19 ajoutés au périmètre de A6 comme profils d'import versionnés ; l'analyse de structure sur extractions réelles se fait en local, sans valeur versionnée, sous les conditions de D109 bis |
| D135 | Ingestion et annulation | N20 et N21 réservés à l'étape B (dépendent de D21, D02, D19) ; N22 reprend `MAPPING_SOURCES.md` §3 en A6 |
