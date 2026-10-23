# DICTIONNAIRE_DONNEES · lot A0b (V0.1 du 23/10/2026)

Client : Suntory uniquement. Statut : **proposition du prestataire** (T. SOEFOU décide). Aucune donnée réelle dans ce document : codes et noms fictifs seulement (voir `FIXTURES.md`).
Sources lues : `COMPLEMENTS_CADRAGE/17` et `/19`, `00_PARTAGE/CONTRAT_MODULE.md`, `DEVIS_CONFORMITE/*`. **Non relus ici : les classeurs Excel eux-mêmes** (aucun fichier Excel ouvert dans cette session).
Mentions : **[Constaté]** lu dans un document, **[Proposé]**, **[À confirmer]**.

## 1. Règles transverses
| Règle | Contenu | Réf. |
|---|---|---|
| Clé technique | `*_id` UUID immuable, jamais affiché. Code lisible séparé (`need_code`, `sector_code`) | E8, A1 |
| Libellés zones | Tout code DR / CVR / RS s'affiche avec son nom via `ZoneLabel` (jamais le code seul) | D106 |
| Droits de lecture | Toute donnée est filtrée **dans la couche données** selon `AccessContext`, jamais par un toggle d'interface | D107 |
| Audience | Champ `audience` : `agency` / `client` / `both`. Défaut **deny** (`agency`) pour tout champ ou alerte non classé | D108 |
| Année | Paramètre `campaign_year`, jamais en dur (le V4 code 2026 en dur : E3) | D50, E3 |
| Dates | Date réelle ISO `aaaa-mm-jj` en interne ; Excel : vraie date, jamais du texte | CONTRAT §5 |
| Langue | Libellés FR + EN dans la table `LISTES` | D104 |
| Sensibilité | `S0` public interne · `S1` pilotage · `S2` personnel (nom, téléphone) · `S3` commercial agence (tarif spécifique, chiffrage) | Proposé |

## 2. Table BESOINS (base de la saisie partagée, 45 colonnes dont 37 côté cliente)
Propriétaire d'écriture : **C** cliente · **A** agence · **K** calculé (jamais saisi) · **S** système. `Aud.` = audience D108.
| Champ technique | Libellé FR / EN | Type | Obl. | Écrit par | Sens. | Aud. | Validation / source |
|---|---|---|---|---|---|---|---|
| `need_id` | (technique) | UUID | oui | S | S0 | both | immuable, jamais réaffecté |
| `need_code` | ID besoin / Need ID | texte | oui | C | S0 | both | unique ; doublon = blocage (CONTRAT §3) |
| `campaign` | Campagne / Campaign | liste | oui | C | S0 | both | Permanent, Saisonnier, Merch Horaire, Second placement ; inconnue = blocage |
| `dr_code` | DR | code→`ZoneLabel` | oui | C | S1 | both | affiché avec nom (D106) |
| `region` | Région | texte | oui | C | S0 | both | |
| `cvr_code` | CVR | code→`ZoneLabel` | oui | C | S1 | both | 18 CVR ; liste fermée |
| `position_label` | Poste / Position | liste | oui | C | S0 | both | Merch Perm 1 à 7 |
| `sector` | Secteur / Sector | texte | oui | C | S0 | both | lien `SECTEURS.sector_code` |
| `departments[]` | Département(s) | liste multi | oui | C | S0 | both | COG INSEE (dossier départements) |
| `rs_code` | RS | code→`ZoneLabel` | oui | C | S1 | both | liste RS ; hors liste = alerte non bloquante |
| `weekly_hours` | Heures / semaine | entier | oui | C | S0 | both | 3, 6, 7, 8, 10, 12, 14, 15, 16, 18, 20, 21, 25, 28, 30, 33, 35 |
| `priority` | Priorité | liste | oui | C | S0 | both | PRIO 1 à 3 |
| `period_no` | Période | entier | oui | C | S0 | both | 1 ou 2 |
| `need_start` / `need_end` | Date début / fin besoin | date | oui | C | S0 | both | bornes 01/01/2026 à 31/12/2028 (module) ; à paramétrer |
| `days` | Jours | liste multi | oui | C | S0 | both | LUN à SAM |
| `hours_slot` | Horaires | texte | oui | C | S0 | both | |
| `store_count` | Nb magasins | entier ≥ 0 | oui | C | S0 | both | |
| `client_comment` | Commentaire cliente | texte libre | non | C | S2 | both | **risque données de santé en texte libre** (5 cas détectés par mots-clés) → consigne de saisie |
| `proposal_status` | Statut proposition | liste | non | A | S1 | both | voir `STATUTS_ET_ETATS.md` |
| `candidate_name` | Nom proposé | texte | non | A | **S2** | both (nom) | minimisation : à confirmer (Q B6) |
| `candidate_phone` | Téléphone | texte | non | A | **S2** | **agency** | jamais exporté vers la cliente par défaut |
| `candidate_source` | Source candidat | liste | non | A | S2 | agency | 10 valeurs observées au source [À confirmer] |
| `availability` | Disponibilité | liste | non | A | S1 | agency | |
| `cv_count` | Nb CV envoyés | entier ≥ 0 | non | A | S0 | both | |
| `recruitment_status` | Recrutement | liste | non | A | S1 | both | |
| `training_date` | Date formation | date | non | A | S0 | both | |
| `kickoff_date` | Date kick-off | date | non | A | S0 | both | |
| `start_work_date` | Date prise de poste | date | non | A | S1 | both | « pickup » du V4 = **prise de poste**, pas remise du véhicule (D11) |
| `vehicle` | Véhicule | liste | non | A | S0 | both | remise du véhicule = événement distinct |
| `proposal_start` / `proposal_end` | Début / fin proposition | date | non | A | S0 | both | |
| `proposed_hours` | Heures proposées | entier | non | A | S0 | both | |
| `agency_comment` | Commentaire agence | texte libre | non | A | S2 | **agency** | jamais visible profils cliente / DR / CVR / RS (D108) |
| `specific_rate` | Taux spécifique | décimal > 0 | non | A | **S3** | **agency** | |
| `training_cost_m1..m3` | Coût formation M1 à M3 | décimal | non | A | **S3** | **agency** | |
| `position_status` | Statut poste | calculé | — | K | S1 | both | dérivé ; jamais saisi |
| `pickup_check` | Contrôle prise de poste | calculé | — | K | S1 | agency | |
| `gap_class` | Classe d'écart | calculé | — | K | S1 | both | |
| `next_actor` / `next_action` | Prochain acteur / action | calculé | — | K | S1 | both | |
| `row_check` | Contrôle ligne | calculé | — | K | S1 | agency | |
| `record_version` | (technique) | entier | oui | S | S0 | agency | anti-écrasement (D51) |
| `source_record_id`, `source_file`, `source_sheet`, `source_row` | Traçabilité import | texte | oui | S | S0 | agency | |
| `campaign_type`, `modified_at`, `modified_by` | Technique | texte / date | oui | S | S1 | agency | `modified_by` = identifiant, pas nom brut en clair côté cliente |
Les 6 colonnes calculées + 6 techniques portent le total à 45+ : décompte exact **[À confirmer]** contre `19_…` à la recette A0b.

## 3. Autres tables
| Table | Grain | Champs clés (technique) | Écriture | Notes |
|---|---|---|---|---|
| `AFFECTATIONS` (A–W, 23 col.) | une période de travail d'une ressource sur un secteur | `sector_code`, `worker_ref`, `campaign_type`, `start_date`, `end_date`, `weekly_hours`, `days`, `hours_slot`, `status`, `contract_type`, `exemption`, `comment`, `key_start`, `key_end` | saisie A, D à O ; calcul B, C, P à W | `worker_ref` = référence pseudonymisée, pas le nom [Proposé] ; lien `need_id` |
| `NON_COUVERTURE` (15 col.) | une absence ou un jour non couvert | à détailler au A1 [À confirmer] | saisie | distinct du délai de carence RH et des jours de carence valorisés (§5.4 doc 17) |
| `SECTEURS` | un secteur | `sector_id` (UUID), `sector_code`, `zone` | plateforme | codes provisoires S01… remplacés par clé technique (E8) |
| `PARAMETRES` | un paramètre daté | `key`, `value`, `valid_from`, `source` | plateforme | tarifs réels datés (D06) ; **jamais** la grille fictive du classeur (E10) |
| `LISTES` | une valeur de liste | `list`, `code`, `label_fr`, `label_en`, `facturable`, `sort` | plateforme | statuts, contrats, motifs, exemptions, enseignes |
| `JOURNAL` | un changement | `at`, `actor_id`, `object`, `field`, `old`, `new`, `reason` | système | conflit de version tracé |
| `EVENEMENTS` | un événement métier | voir D91 | système | funnel 6 états D92 |
| `PHOTOS` | une preuve terrain | voir D98–D103 | terrain | stockage hors table, métadonnées minimales |

## 4. Données personnelles : synthèse
| Catégorie | Champs | Mesure proposée |
|---|---|---|
| Candidats | `candidate_name`, `candidate_phone`, `candidate_source` | minimisation, durée à fixer, jamais en export cliente par défaut |
| Intervenants | `worker_ref`, noms dans imports LOGA | pseudonymisation à l'import, purge de fin de campagne |
| Responsables (DR, CVR, RS) | libellés de zone | affichage nominatif autorisé (réponse Q8 du 23/10) |
| Commentaires libres | `client_comment`, `agency_comment` | consigne « pas de motif médical » ; relecture à prévoir |

## 5. Points ouverts
- Décompte exact des 45 colonnes et types fins : à vérifier contre le fichier réel (non ouvert).
- Valeurs des listes (`candidate_source`, `availability`) : à relever dans le classeur.
- Durées de conservation : décision DPO / cliente (QUESTIONS_OUVERTES B7).
