# Glossaire FR / EN · Lot A0

Date : 23/10/2026 · Version de travail. **Les libellés EN sont des propositions du prestataire, non validées par la cliente** (D27 : codes métier identiques dans les deux langues, seuls les libellés changent). Les expansions de sigles (DR, CVR, RS) sont à confirmer par la cliente (V0.4, C.GLOSS).
Colonnes : code = identifiant dans le code (anglais, stable) ; libellé affiché = traduction, jamais une clé.

## 1. Parties et rôles

| Terme actuel | Cible FR | Cible EN | Code | Source / remarque |
|---|---|---|---|---|
| Suntory | Cliente | Client | `client` | CLAUDE.md |
| Impact | Agence | Agency | `agency` | Aussi nom de rôle utilisateur : `role.agency` ≠ `org.agency` |
| Prestataire FREELANCE | Prestataire | Provider | `provider` | Développement et exploitation ; jamais « agence » |
| DR | DR (libellé complet à confirmer) | DR | `dr` | V0.4 GLOSS ; 3 DR dans les modules |
| CVR | CVR (à confirmer) | CVR | `cvr` | Intermédiaire sous le DR |
| RS | RS (à confirmer) | RS | `rs` | Secteur, utilisateur (D44) |
| DNV | DNV (à confirmer) | DNV | `dnv` | Chaîne DNV › DR › CVR › RS (D45) |
| Intervenant | Intervenant | Field worker | `worker` | **Pas de compte** (D42) |
| Marving | Marving (outil FDV Suntory) | Marving | — | Nom propre ; **distinct de Marvesting** (écart E06) |
| Marving Flex | Marving Flex | Marving Flex | — | Application collaborateur, hors périmètre à ce stade (V0.4 Q10) |
| Marvesting | Marvesting (charte, gabarit) | Marvesting | — | D30, D70 ; jamais utilisé comme nom d'outil |

## 2. Écrans et notions de pilotage

| Terme actuel | Cible FR | Cible EN | Code | Source / remarque |
|---|---|---|---|---|
| Cockpit | Tableau de bord | Dashboard | `dashboard` | CLAUDE.md, D81 (« cockpit cliente » = alertes et retards) |
| Points à corriger | Actions à traiter | Actions to handle | `actions_to_handle` | CLAUDE.md ; avec champ, cause, action attendue |
| Qui doit agir | Qui doit agir | Who must act | `owner_of_next_action` | M2/M3 |
| Quota | Quota | Quota | `quota` | Niveau DR et CVR (D85) ; permanent/saisonnier : « à définir » (D22) |
| À définir (quota) | À définir | To be defined | `quota.undefined` | Gris, aucune jauge inventée |
| Consommé | Consommé | Consumed | `consumed` | **Définition ouverte (D05)** : ne pas figer le calcul |
| Prévisionnel | Prévisionnel | Forecast | `forecast` | Idem |
| Atterrissage | Atterrissage | Landing / projected outturn | `landing` | EN à confirmer |
| Non chiffré | Non chiffré | Not costed | `cost.missing` | Jamais 0 (CLAUDE.md) |
| Budget non renseigné | Budget non renseigné | Budget not provided | `budget.missing` | Idem |
| Donnée indisponible | Donnée indisponible | Data unavailable | `data.unavailable` | Idem |
| Clôture hebdomadaire | Clôture de la semaine | Week close | `week_close` | Réouverture par l'agence seule (W12, D87) |
| Bandeau « DONNÉES FICTIVES » | DONNÉES FICTIVES | DEMO DATA | `demo_banner` | Permanent sur chaque écran |

## 3. Besoin, proposition, recrutement

| Terme actuel | Cible FR | Cible EN | Code | Source / remarque |
|---|---|---|---|---|
| Besoin | Besoin | Need | `need` | Périodes et lieux liés |
| Brouillon / À compléter | Brouillon | Draft | `draft` | Exclu des totaux (W9) |
| Proposition | Proposition | Proposal | `proposal` | Versionnée |
| Décision | Décision | Decision | `decision` | Liée à une version de proposition |
| Affectation | Affectation | Assignment | `assignment` | Ressource × secteur × période |
| À recruter | À recruter | To recruit | `funnel.to_recruit` | D92 état 1 |
| En recrutement | En recrutement | Recruiting | `funnel.recruiting` | D92 état 2 |
| Proposé | Proposé | Proposed | `funnel.proposed` | D92 état 3 |
| Validé | Validé | Approved | `funnel.approved` | D92 état 4 (validation cliente) |
| Recruté / « Recrutement finalisé » | Recrutement finalisé | Hiring completed | `funnel.hired` | D92 état 5 ; CLAUDE.md `hired` |
| En poste / « Poste démarré » / ancien « Pourvu » | En poste | In post | `funnel.started` | D92 état 6 ; « Pourvu » = alias de lecture seule (E03) |
| Pickup (ambigu) | **Prise de poste** et **Remise du véhicule** | **Start of assignment** and **Vehicle handover** | `assignment_start`, `vehicle_handover` | D11 ; table de correspondance à valider (Q17) |
| Désistement | Désistement | Withdrawal | `withdrawal` | D97 : retour à « En recrutement » + compteur |
| Réattribué / Stoppé / Zone blanche | Réattribué / Stoppé / Zone blanche | Reassigned / Stopped / White zone | `status.*` | D85 : libellés complets à relire dans le registre |
| Urgence / Retard de proposition | Urgence / Retard | Urgency / Late | `urgency`, `late` | A3 |

## 4. Temps et calendrier

| Terme actuel | Cible FR | Cible EN | Code | Source / remarque |
|---|---|---|---|---|
| Semaine ISO | Semaine ISO (ex. 2026-S53) | ISO week (e.g. 2026-W53) | `iso_week` | **Vérifié aujourd'hui** : 2026 a 53 semaines ISO, 2027 en a 52 ; lundi 28/12/2026 ouvre S53, lundi 04/01/2027 ouvre S01 |
| Format stocké | `AAAA-Snn` | `YYYY-Wnn` à l'affichage EN | — | Stockage unique `2026-S53` ; affichage selon la langue |
| Date | JJ/MM/AAAA | MM/DD/YYYY ou AAAA-MM-JJ | — | Stockage ISO ; **format EN à confirmer** (Royaume-Uni ou États-Unis ?) |
| Échéance mensuelle | Échéance | Deadline | `deadline` | D78–D82, saisie bloquée après échéance |
| Cascade J-5 / J-2 / jour J | J-5 / J-2 / jour J | D-5 / D-2 / due day | `reminder.*` | D82 ; e-mails limités (D86) |

## 5. Absences et carences

| Terme actuel | Cible FR | Cible EN | Code | Source / remarque |
|---|---|---|---|---|
| Carence (terrain) | Secteur non couvert | Coverage gap | `field_gap` | V0.4 GLOSS, Q19 |
| Carence (légale) | Délai de carence légal | Statutory waiting period | `legal_waiting_period` | **À ne jamais fusionner avec le précédent** |
| Absence | Absence (catégorie générique) | Absence (generic category) | `absence` | Aucun motif de santé (V0.4 ABS_FIELDS) |
| Statut d'absence | Déclarée · Remplacement en cours · Couverte · Non couverte | Declared · Replacement in progress · Covered · Not covered | `absence.status.*` | V0.4 ABS_FIELDS |
| Taux de couverture | Taux de couverture | Coverage rate | `coverage_rate` | (jours d'absence − jours sans couverture) ÷ jours d'absence |

## 6. Données, import, photos

| Terme actuel | Cible FR | Cible EN | Code | Source / remarque |
|---|---|---|---|---|
| Fichier d'échange | Fichier d'échange | Exchange file | `exchange_file` | Pont temporaire (D04) |
| Quarantaine | Zone de contrôle | Quarantine | `quarantine` | Import A6, validation humaine |
| Idempotence | Réimport sans doublon | Safe re-import | `idempotent_import` | Critère A6 |
| Journal des événements | Journal des événements | Event log | `event_log` | D91 ; jamais réécrit |
| Photo terrain | Photo terrain | Field photo | `field_photo` | D98 à D103 ; sans personne |
| Statut photo (7) | à relire dans doc 27 | to be translated | `photo.status.*` | D100 ; libellés à traduire en A5b |
| Charte douce | Charte douce | Soft style | — | D62 : aucune ligne droite, aucun cadratin, aucune phrase antithétique, **vérification automatique à prévoir sur les libellés FR et EN** |
| Audience (alerte) | Audience | Audience | `alert.audience` | Valeurs : `agency`, `client`, `both` ; défaut refus (proposition D108) |
| Libellé de zone | Libellé · code | Label · code | `ZoneLabel` | Proposition D106 ; personne ou zone : question 8 |

## 7. Points à trancher sur le glossaire

| # | Question | Recommandation |
|---|---|---|
| G1 | Libellés complets de DR, CVR, RS, DNV en FR et EN | Demander à la cliente ; en attendant, afficher les sigles |
| G2 | « Recrutement finalisé / Poste démarré » (CLAUDE.md) ou « Recruté / En poste » (D92) comme libellé court | Garder les deux : court dans les filtres, long dans les fiches |
| G3 | Format de date EN | Choisir un format ; à défaut ISO partout en EN |
| G4 | La règle D62 (pas de cadratin) s'applique-t-elle aux libellés EN ? | Oui, par cohérence ; test automatique unique FR + EN |
