# Règles de semaine (W1 à W22) et de doublon (D1 à D7) · extraction de la présentation V0.4

Source : `PROPOSITION CLEINTE VIA AGENCE/Refonte_V3_Plateforme_Pilotage_Live_Presentation_Cliente_V0.4.html`, variables `C.WEEKS`, `C.WEEKS_GROUPS`, `C.DUPS`, `C.SEV` (lues le 23/10/2026 en ouvrant la page et en lisant `window.C`). Texte repris tel quel, sans ajout. Les gravités sont des **propositions de l'agence** (Q7 de la V0.4), non des décisions de la cliente. `[À VALIDER]` signale une hypothèse de la source.

Utilisation : lot A2a (tests table par table). Les cas « à arbitrer » sont paramétrables, pas figés.

## 1. Règles de semaine

| N° | Groupe | Gravité | Cas | Règle observée | Traitement proposé |
|---|---|---|---|---|---|
| W1 | Calendrier et numérotation | Bloquant | Numéro hors plage | Numéro  53, ou 53 sur une année qui n’en compte pas (2026 : 53 semaines ; 2027 : 52). | Refus et proposition de la semaine déduite de la date. |
| W2 | Calendrier et numérotation | Bloquant | Semaine non ISO | Numéro issu d’un calcul par défaut de tableur, décalé de une semaine autour du 1er janvier. | Recalcul ISO 8601 systématique ; l’ancien numéro est ignoré. |
| W3 | Calendrier et numérotation | Bloquant | Semaine à cheval sur deux années | Le lundi 28/12/2026 ouvre S53 ; le lundi 04/01/2027 ouvre S1 de 2027. | Semaine toujours stockée avec son année ISO (2026-S53, 2027-S01). |
| W4 | Calendrier et numérotation | Alerte | Année ISO différente de l’année civile | Début janvier rattaché à S52 / S53 de l’année précédente, fin décembre rattachée à S1 de l’année suivante. | Affichage de l’année ISO ; alerte si la saisie suppose l’année civile. |
| W5 | Cohérence date ↔ semaine | Bloquant | Date hors de la semaine saisie | La date de début n’appartient pas à la semaine indiquée. | Alerte et correction en un clic (semaine déduite de la date). |
| W6 | Cohérence date ↔ semaine | Bloquant | Fin avant début | Date ou semaine de fin antérieure à celle de début. | Refus. |
| W7 | Cohérence date ↔ semaine | Alerte | Période sur plusieurs semaines saisie comme une seule | Un besoin couvre plusieurs semaines mais une seule semaine est renseignée. | Alerte ; proposition de découper ou d’étendre. |
| W8 | Cohérence date ↔ semaine | Information | Mission à cheval sur deux semaines | Règle actuelle : la semaine retenue est celle de la date de début de la mission. | Règle appliquée et affichée ; information à l’utilisateur [À VALIDER]. |
| W9 | Cohérence date ↔ semaine | Bloquant | Ni date ni semaine | Besoin sans période (cas « — → — » déjà observés dans la saisie actuelle). | Statut « à compléter », exclu des totaux. |
| W10 | Cohérence date ↔ semaine | Alerte | Semaine passée sur un nouveau besoin | Besoin créé pour une semaine déjà écoulée. | Alerte ; justification demandée. |
| W11 | Cohérence date ↔ semaine | Information | Semaine trop lointaine | Besoin saisi au-delà d’un horizon maximal [À VALIDER]. | Alerte. |
| W12 | Cohérence date ↔ semaine | Bloquant | Semaine déjà clôturée | Modification d’un besoin ou d’une proposition sur une semaine clôturée. | Blocage ; réouverture par l’agence uniquement, tracée. |
| W13 | Formats et saisie | Alerte | Format non normalisé | Saisies du type « S5 », « 5 », « 2026-S05 », « W05 », texte ou nombre. | Normalisation automatique vers un format unique. |
| W14 | Formats et saisie | Bloquant | Date au format inversé | Jour et mois permutés (ambigu quand le jour est ≤ 12). | Sélecteur de date ; contrôle à l’import des fichiers. |
| W15 | Formats et saisie | Bloquant | Date non convertie à l’import | Numéro de série de tableur ou texte non reconnu dans un fichier d’échange. | Ligne rejetée avec message explicite. |
| W16 | Formats et saisie | Alerte | Début un jour non ouvré | Début un dimanche ou un jour férié alors que la campagne exclut ces jours. | Alerte ; règle par campagne [À VALIDER]. |
| W17 | Formats et saisie | Information | Début un jour qui n’est pas le premier de la semaine | Besoin hebdomadaire démarrant en milieu de semaine. | Information : semaine partielle, prorata affiché. |
| W18 | Cohérence métier | Bloquant | Périodes P1 et P2 qui se recouvrent | La période 2 commence avant la fin de la période 1. | Refus ; ajustement proposé. |
| W19 | Cohérence métier | Alerte | P2 antérieure à P1 | Ordre des périodes inversé. | Alerte et inversion proposée. |
| W20 | Cohérence métier | Alerte | Mission avant la date du besoin | Semaine de réalisation antérieure à la semaine de création du besoin ou hors campagne. | Alerte. |
| W21 | Cohérence métier | Alerte | Semaine hors fenêtre saisonnière | Besoin saisonnier placé hors de la fenêtre de la campagne. | Alerte ; fenêtre paramétrée par campagne. |
| W22 | Cohérence métier | Alerte | Doublon sur la même semaine | Deux besoins du même secteur et du même type sur la même semaine. | Renvoi vers la règle de doublon (D1 à D7). |

## 2. Règles de doublon

| N° | Gravité | Cas | Règle observée | Traitement proposé |
|---|---|---|---|---|
| D1 | Bloquant | Doublon exact | Même secteur, même type, mêmes dates, mêmes heures. | Bloquant : renvoi vers le besoin existant. |
| D2 | Alerte | Chevauchement partiel | Même secteur et même type, périodes qui se recouvrent partiellement. | Alerte : ajuster les dates ou fusionner. |
| D3 | Alerte | Inclusion | Une période est entièrement contenue dans une autre. | Alerte : probable doublon ou précision. |
| D4 | Information | Périodes contiguës | La fin d’un besoin et le début d’un autre se touchent. | Information : continuité, proposer de prolonger plutôt que créer. |
| D5 | Alerte | Même magasin, secteurs différents | Un magasin apparaît dans deux secteurs sur la même période. | Alerte : arbitrage sur le rattachement. |
| D6 | Information | Même intitulé, dates différentes | Libellés identiques sur des périodes disjointes. | Information : peut être une récurrence légitime. |
| D7 | Bloquant | Doublon à l’import | Ligne importée déjà présente (clé technique ou identifiant de besoin). | Rapprochement : mise à jour et non création. |

## 3. Points d'attention pour A2a

- 2026 compte 53 semaines ISO, 2027 en compte 52 (W1). Stockage toujours avec l'année ISO (`2026-S53`, `2027-S01`, W3).
- Quatre cas portent une hypothèse ou une valeur à paramétrer : W8 (semaine retenue d'une mission à cheval), W11 (horizon maximal), W16 (jours non ouvrés par campagne), W21 (fenêtre saisonnière par campagne).
- W12 recoupe D78 (blocage après échéance) et la réouverture par l'agence seule (D82) : un seul mécanisme de blocage, deux déclencheurs (semaine clôturée, échéance dépassée).
- W22 renvoie à D1 à D7 ; D7 (doublon à l'import) concerne le lot A6.
