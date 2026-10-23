# SUNTORY REFONTE V3 · Dictionnaire de données et exports V0.1 (lot A0b, suite)

Version de travail du 22/10/2026 · Suntory uniquement · **Proposition du prestataire** ; seules les décisions du §1 sont de T. SOEFOU.
Sources : structure (en-têtes, validations, nature saisie / formule) de `SUNTORY_SAISIE_PARTAGEE_PERMANENT_V3.xlsx` (onglet `SAISIE_PARTAGEE`, 45 colonnes A à AS) et du classeur D52 (`Affectations`, `Carences terrain`, `Secteurs`, `Paramètres`) ; doc 17 ; doc 11 (M2) ; contrats Excel. **Aucune valeur personnelle reprise.** Non vérifié : contenu des listes `_LISTES`, formules complètes, onglets de calcul.

## 1. Décision reçue (T. SOEFOU, 22/10/2026)
| N° | Décision | Statut |
|---|---|---|
| D56 | **On travaille sur la plateforme.** Les Excel servent à l'**écriture** (fichier branché, projection) et à l'**export**, selon les **paramètres choisis** et les **axes** de reporting | Décidée sur le principe ; hébergement à confirmer avec Impact (option 1 du doc 17 comme socle) |

Conséquence : la demande à l'IT d'Impact (doc 18) devient **facultative** (écriture directe dans leur SharePoint = ajout ultérieur). Le socle est une plateforme hébergée dans l'UE, avec exports et échanges de fichiers.

## 2. Trois usages de l'Excel
| Usage | Contenu | Écrit par | Lu en retour | Phase |
|---|---|---|---|---|
| **Écriture** (fichier branché) | Projection des tables BESOINS, AFFECTATIONS, NON-COUVERTURE, SECTEURS, PARAMÈTRES, LISTES | Plateforme, colonnes *à saisir* et *techniques* seulement | Oui, avec contrôle de version | A simulé, B |
| **Échange** | Classeur « cliente → agence » et « agence → cliente » (colonnes cochées) | Plateforme | Oui (rapprochement par clé) | A (fictif), B |
| **Reporting** | Extractions par axes et paramètres (§4) | Plateforme | Non | A, B |

## 3. Dictionnaire : table BESOINS (45 colonnes de `SAISIE_PARTAGEE`)
Nature : **S** saisie · **C** calculé (ne jamais écrire) · **T** technique. Propriétaire : Cl cliente, Ag agence, Réf référentiel, Cal calculé. Sens : sensible (données personnelles ou internes ; décoché par défaut à l'export cliente).

| Col. | Libellé d'origine | Champ canonique | FR / EN proposé | Type | Nature | Propriétaire | Remarque |
|---|---|---|---|---|---|---|---|
| A | ID besoin | `need_code` | Code du besoin / Need code | texte | C dans le fichier | Cal | Formule dérivée (CVR, poste, secteur, période). Dans la plateforme : `need_id` (UUID immuable) + `need_code` **figé à la création** (D de M2) ; 14 doublons connus |
| B | Campagne | `campaign` | Campagne / Campaign | liste | C | Cal | « Permanent » ; devient saisie avec la fusion 2027 (`campaign_type`) |
| C | DR | `dr_code` | Directeur régional / Regional director | code | C | Réf | Déduit du CVR. Écart de codes `F1` / `D001` (D24) |
| D | Région | `region_commercial` | Région commerciale / Sales region | texte | C | Réf | À distinguer de la région administrative |
| E | Code CVR | `cvr_code` | Code CVR | liste | S | Cl | Liste = `REF_CVR` (18) |
| F | CVR (auto) | `cvr_label` | CVR | texte | C | Réf | |
| G | Poste | `position_label` | Poste / Position | liste | S | Cl | « Merch Perm 1 » à « 7 » |
| H | Secteur | `sector` | Secteur / Sector | texte | S | Cl | Le caractère `|` est interdit (clé) |
| I | Département(s) | `departments[]` | Départements / Departments | liste multiple | S | Cl | Relations, pas du texte libre (déjà décidé) |
| J | Code RS | `rs_code` | Responsable de secteur (RS) | liste | S | Cl | Liste filtrée par CVR |
| K | RS (auto) | `rs_label` | RS | texte | C | Réf | |
| L | Heures / semaine | `weekly_hours` | Heures par semaine / Hours per week | liste | S | Cl | 3 à 35 (17 valeurs) |
| M | Priorité | `priority` | Priorité / Priority | liste | S | Cl | 1 à 3 |
| N | Période | `period_no` | Période / Period | liste | S | Cl | 1 ou 2 |
| O | Date début besoin | `need_start` | Début du besoin | date ISO | S | Cl | Plage 2026 à 2028 dans le contrat |
| P | Date fin besoin | `need_end` | Fin du besoin | date ISO | S | Cl | Vide = date de fin par défaut |
| Q | Jours | `days` | Jours / Days | liste | S | Cl | Lundi à samedi |
| R | Horaires | `hours_slot` | Horaires / Time slot | texte | S | Cl | |
| S | Nb magasins | `store_count` | Nombre de magasins | entier | C | Cal | Compte via `REFERENTIEL_MAGASINS` |
| T | Commentaire cliente | `client_comment` | Commentaire cliente | texte | S | Cl | |
| U | Statut proposition | `proposal_status` | Décision cliente / Client decision | liste | S | Cl | « Validée », « Refusée » (2 valeurs) |
| V | Nom proposé | `candidate_name` | Nom proposé | texte | S | Ag | **Sens** (donnée personnelle) |
| W | Téléphone | `candidate_phone` | Téléphone | texte | S | Ag | **Sens** ; jamais transmis par défaut |
| X | Source candidat | `candidate_source` | Source du candidat | liste | S | Ag | **Sens** (interne) |
| Y | Disponibilité | `availability` | Disponibilité | liste | S | Ag | |
| Z | Nb CV envoyés | `cv_count` | Nombre de CV | entier ≥ 0 | S | Ag | Interne |
| AA | Recrutement | `recruitment_status` | Recrutement / Recruitment | liste | S | Ag | OK, En cours (4 valeurs) |
| AB | Date formation | `training_date` | Date de formation | date | S | Ag | |
| AC | Date kick-off | `kickoff_date` | Date de lancement | date | S | Ag | |
| AD | Date prise de poste (pickup) | `start_work_date` | Date de prise de poste | date | S | Ag | Exige un statut « Pourvu » |
| AE | Véhicule | `vehicle` | Véhicule | liste | S | Ag | **Sens** (coût) |
| AF | Date début proposition | `proposal_start` | Début de la proposition | date | S | Ag | |
| AG | Date fin proposition | `proposal_end` | Fin de la proposition | date | S | Ag | |
| AH | Heures proposées | `proposed_hours` | Heures proposées | liste | S | Ag | |
| AI | Commentaire agence | `agency_comment` | Commentaire agence | texte | S | Ag | **Sens** (interne) |
| AJ | Taux spécifique (€/h) | `specific_rate` | Taux spécifique | décimal > 0 | S | Ag | **Sens** (coût) |
| AK à AM | Formation … (€) | `training_cost_m[1..3]` | Formation (€) par mois | décimal | C | Cal | En-têtes en formule : à rendre fixes (E1 du doc 17) |
| AN | Statut poste | `position_status` | Statut du poste | liste | C | Cal | Issu de `T_SOURCE_PERM` |
| AO | Contrôle pickup | `pickup_check` | Contrôle de prise de poste | texte | C | Cal | |
| AP | Classe d'écart | `gap_class` | Classe d'écart | liste | C | Cal | 7 classes (tolérances 5 j / 10 j / 60 j) |
| AQ | Qui doit agir | `next_actor` | Qui doit agir | liste | C | Cal | |
| AR | Action attendue | `next_action` | Action attendue | texte | C | Cal | |
| AS | Contrôle | `row_check` | Contrôle de ligne | texte | C | Cal | |

**Champs techniques à ajouter (à droite, sans décaler)** : `need_id`, `record_version`, `source_record_id`, `campaign_type`, `modified_at`, `modified_by`, `source_file`, `source_sheet`, `source_row`.

## 4. Dictionnaire : table AFFECTATIONS (classeur D52)
| Col. | Libellé | Champ canonique | Type | Nature | Remarque |
|---|---|---|---|---|---|
| A | Code secteur | `sector_code` | code | S | Lie à SECTEURS |
| B, C | Secteur, RS responsable | — | texte | C | Lookups sur SECTEURS |
| D | Merchandiser | `worker_ref` | texte | S | **Sens** ; pseudonymisé dans les exports cliente par défaut |
| E | Type | `campaign_type` | liste | S | Permanent, Saisonnier |
| F, G | Date début, fin | `start_date`, `end_date` | date ISO | S | Plage ≥ 2025-01-01 ; jamais de texte |
| H | Heures / semaine | `weekly_hours` | nombre | S | |
| I, J | Jours, Horaires | `days`, `hours_slot` | texte | S | |
| K | Statut | `status` | liste | S | Table des statuts validée (D54) |
| L | Contrat de travail | `contract_type` | liste | S | CDI, CDD, CDD saisonnier, Intérim (RH : à valider) |
| M | Exemption carence | `exemption` | liste | S | 7 motifs |
| N | Commentaire | `comment` | texte | S | **Sens** (peut contenir des données RH) |
| O | Modifié le | `modified_at` | date | S/T | Sert de base à la détection de conflit |
| P à S | Jours avant fin, Alerte, Nb semaines, Heures totales | — | — | C | |
| T, U | Tarif horaire, Montant estimé HT | — | — | C | Tarifs **fictifs** du classeur exclus (E10) |
| V, W | Clé fin, Clé début (technique) | `key_end`, `key_start` | texte | T | Utilisées par les alertes |
**À ajouter** : `assignment_id`, `need_id` (facultatif), `record_version`.

## 5. Dictionnaire : NON-COUVERTURE, SECTEURS, PARAMÈTRES
| Table | Colonnes saisies | Calculées | Remarque |
|---|---|---|---|
| **NON-COUVERTURE** (« Carences terrain ») | Code secteur, merch absent, **motif**, date début, date fin, remplacé ?, remplaçant, déduire de la facture ?, commentaire | Type, heures prévues, jours d'ouverture, heures non couvertes, situation | Le **motif** est générique côté cliente (jamais médical) ; la déduction de facture dépend d'une règle contractuelle validée, pas du simple mot « absent » |
| **SECTEURS** | Code secteur, secteur/ville, RS responsable, département(s), remarque | — | Ajouter `sector_id`, `code_cvr`, `code_dr`, date d'effet (E7, E8) |
| **PARAMÈTRES** | Délai d'alerte, tarifs, statuts, contrats, règles de carence, exemptions, motifs | — | Chaque valeur : date d'effet, version, auteur ; tarifs réels datés (D06) |
| **LISTES** | Statuts, types, contrats, motifs, enseignes, postes, priorités… | — | Libellés FR/EN ; table d'alias des anciens libellés |

## 6. Constructeur d'exports : paramètres et axes (D56)
### Paramètres de chaque export
| Paramètre | Valeurs | Règle |
|---|---|---|
| Type | Écriture · Échange · Reporting | |
| Campagne et type | Horaire, Second placement, Permanent, Saisonnier, toutes | |
| Période | Début / fin, mois, semaine ISO (2026-S53), trimestre | Règle de chevauchement : `début ≤ P2` et `fin ≥ P1` |
| Périmètre | National, DR, CVR, RS, département, région, enseigne, magasin | **Filtré côté serveur selon les droits** ; un périmètre non autorisé ne renvoie rien |
| Colonnes | Cases à cocher par groupe | Colonnes **sensibles décochées**, confirmation explicite |
| Indicateurs | Quota, dépensé, restant, prévisionnel, % consommé, % consommé + prévisionnel, atterrissage, heures, besoins par statut, écarts | Chaque indicateur porte période, périmètre, unité, définition, source, date de calcul |
| Langue | FR · EN | Libellés du glossaire (doc 17 §5) |
| Format | Excel (.xlsx) · PDF · HTML autonome | Étiqueté « Démo » si données fictives |
| Modèle | Enregistré par rôle | Versionné |

### Axes de reporting
| Axe | Niveaux |
|---|---|
| Temps | Semaine ISO, mois, trimestre, année, période libre |
| Territoire | National › DR › CVR › RS › département › magasin ; région commerciale et région administrative séparées |
| Réseau | Enseigne, magasin |
| Campagne | Horaire, Second placement, Permanent, Saisonnier, type |
| Cycle de vie | Statut du poste, décision, recrutement, classe d'écart, priorité |
| Budget | Enveloppe, version, mouvement de réallocation (D46) |
| Qualité | Couverture de calcul, anomalies, lignes en quarantaine |

### Règles
- Nom du fichier : `SUNTORY_{TYPE}_{CAMPAGNE}_{AAAA-MM-JJ}.xlsx`, avec la période si elle est filtrée.
- Onglet de couverture : paramètres, période, périmètre, date de calcul, **statut des données**, version du modèle, langue.
- Tout export de données personnelles ou internes est **tracé** (qui, quand, quelles colonnes, combien de lignes) et **étiqueté**.
- Les exports de reporting sont en lecture seule et ne modifient jamais le classeur branché.
- Un export « cliente » n'inclut jamais le coût agence, le taux spécifique, le téléphone ni la source de candidat.

## 7. Écarts à lever dans cette phase
| # | Écart | Proposition |
|---|---|---|
| M1 | `ID besoin` est une **formule** dans le fichier, figé à la création dans M2 | Clé technique immuable + code lisible figé |
| M2 | En-têtes `AK à AM` en formule | En-têtes fixes, mois en paramètre |
| M3 | 45 colonnes (V3) contre 42 (doc 05) et 37 côté cliente | Dictionnaire du §3 fait foi ; version cliente = sous-ensemble |
| M4 | Statuts de décision à 2 valeurs, statut du poste à plus de valeurs | Trois statuts séparés (décision, proposition, poste) |
| M5 | Plages de validation fixées (lignes 8 à 157) | Références structurées ou capacité paramétrée |
| M6 | Listes dans `_LISTES` (masqué) | Table LISTES visible, éditée dans la plateforme |
| M7 | `T_SOURCE_PERM` alimente les colonnes calculées | À remplacer par le calcul de la plateforme ; Excel en miroir |

## 8. Non vérifié, à faire au démarrage du lot
Contenu exact de `_LISTES`, formule complète de `ID besoin`, onglets `A_TRAITER`, `LIGNES_AGENCE`, `SYNTHESE_PERM`, `AJUSTEMENTS_FACTURATION`, `T_SOURCE_PERM` ; comparaison par empreinte des classeurs de la racine et de `REFONTE VISUELLE` ; jeux d'essai fabriqués (aucune donnée réelle).

## 9. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, T. SOEFOU précise pour Suntory : les utilisateurs travaillent sur la plateforme ; les Excel servent à l'écriture et à l'export selon les paramètres choisis et les axes de reporting. L'écriture directe dans le SharePoint d'Impact devient facultative. Dictionnaire et constructeur d'exports proposés (doc 19), non validés.
