# SUNTORY REFONTE V3 · Cadrage des données Excel V0.1 (lot A0b)

Version de travail du 22/10/2026 · Client : Suntory uniquement · Statut : **proposition du prestataire ; seules les décisions du §1 sont de T. SOEFOU**.
Sources lues : dossier `ANCIENS AXES METIERS A RETRAVAILLER` (docs 00, 01, 03, 04, 05, 08, 09, 10, 11, 12 ; docs 02, 06, 07 non lus), contrats Excel (doc 03 du dossier d'orientation) et structure (en-têtes, tables, validations, formules, paramètres ; **aucune valeur personnelle reprise ici**) du classeur `02_SAISIE_PARTAGEE/Suivi_Merch_Perm_Saisonnier_2026 (1) 2.xlsx`.
Non lu : `00_PARTAGE/` (`CONTRAT_MODULE.md`, `AUDIT_SAISIE_ONGLETS_COLONNES.md`, `HARMONISATION_TBB_4C.md`) : **absent du dossier connecté** ; dossier `REFONTE VISUELLE` : jamais connecté. Chiffres du 17/10 (données au 05/10) non revérifiés.

## 1. Décisions reçues le 22/10/2026 (T. SOEFOU)
| N° | Décision | Statut |
|---|---|---|
| D50 | **Permanent** : le TBB fait foi pour les **montants**, le 4C pour le **détail des périodes** | Décidée |
| D51 | **Tout est ajustable dans l'application**, puis **écrit dans le fichier Excel branché** (paramètres, référentiels, besoins, affectations) | Décidée sur le principe ; mécanisme technique au §4 |
| D52 | Le fichier présent dans `02_SAISIE_PARTAGEE` est **le fichier validé en dernier** ; il doit être **peaufiné (design et structure)** pour accueillir l'écriture lors du branchement | Décidée ; modèle cible au §3 |
| D53 | Recueillir les **axes métiers actuels** et les **mettre en conformité de langage** dans l'application | Décidée ; glossaire proposé au §5 |

## 2. Hiérarchie des sources (consolidée)
| Donnée | Source de vérité | Règle | Origine |
|---|---|---|---|
| Permanent : **montants** | TBB V18 | Fait foi (D50) | D50, doc 10 |
| Permanent : **détail des périodes** | 4C V9 (`COLLER_PERM_SAISO`, `T_FAITS`) | Alimente les périodes, heures, secteurs | D50, doc 08 |
| Horaire, Second placement | Export LOGA (brut chargé dans le 4C) | Rien n'est projeté au-delà de l'export | Docs 08, 09 |
| Saisonnier 2026 | Source Saisonnier V3 = TBB | Archive clôturée, lecture | Docs 09, 01 |
| Budgets, facturé, historique | TBB V18 | Lu seulement | Doc 09 |
| Besoins, affectations, carences | `Suivi_Merch_Perm_Saisonnier_2026` (D52) | Fichier branché en écriture (B) | D52 |
| Rattachement magasins | Listing V2, puis référentiel de la plateforme | Éditable, daté, journalisé | Doc 08 |
| **Écart Permanent à documenter** | 30 475,45 € entre TBB et 4C (dont ligne « Le Havre R1A1 », 32 406,60 €) | Avec D50 : l'écart se **réconcilie vers le TBB** ; le 4C est corrigé ou annoté, pas l'inverse | Doc 09 §3.1 |

Principe général (D04 / Q20) : **la plateforme est la source unique**, les Excel sont des sources importées et des exports branchés. Ils ne deviennent jamais plusieurs bases maîtres concurrentes.

## 3. Le fichier de référence (D52) : constat et structure cible

### 3.1 Ce que contient le classeur (structure relevée)
| Onglet | Rôle | Grain | Remarque |
|---|---|---|---|
| Mode d'emploi | Règles de saisie | Texte | Statuts décrits : 8 |
| **Affectations** (tableau nommé) | Saisie | **Une période de travail d'une ressource sur un secteur** | 23 colonnes A à W ; saisie en A, D à O ; calculs en B, C, P à W ; lignes prévues : 200 |
| **Carences terrain** (tableau nommé) | Saisie | Une absence ou un jour non couvert | 15 colonnes ; lignes prévues : 100 |
| Secteurs | Référentiel | Un secteur | Code, secteur/ville, RS, département(s), remarque ; 11 lignes |
| Paramètres | Configuration | Listes et tarifs | Délai d'alerte, tarifs, statuts, contrats, règles de carence, exemptions, motifs |
| Alertes, Planning, Facturation, Carences contrats, Heures par mois, Non couvert par mois | **Calculs** | — | Formules ; ne pas écrire |

Le classeur est présenté comme **exemple** : le mode d'emploi indique que types de contrat, heures, absences et tarifs sont fictifs, et `Paramètres` signale « tarifs fictifs ». Il contient 18 lignes d'affectation. Il ne peut donc pas servir de référence chiffrée.

### 3.2 Constats à lever avant branchement (écriture)
| # | Constat | Conséquence | Correction proposée |
|---|---|---|---|
| E1 | **Grain** : une ligne = une affectation, pas un besoin. Le fichier de besoins M2/M3 (`SAISIE_PARTAGEE`, 45 colonnes, 37 côté cliente) porte besoin, proposition, décision | Deux objets distincts (doc 03 contrats : « une nouvelle personne ou proposition ne crée pas automatiquement un nouveau besoin ») | Deux tables liées par `need_id` : **BESOINS** et **AFFECTATIONS** (voir 3.3) |
| E2 | Formules sur plages **figées** (`$2:$201`, `$2:$101`) | Une ligne écrite au-delà n'entre pas dans les calculs, sans message | Références structurées sur les tableaux, ou capacité paramétrée et contrôlée |
| E3 | `Planning` et `Heures par mois` : mois **2026 en dur** | 2027 (fusion saisonnier dans le permanent) impossible sans refonte | Année en paramètre ; champ commun « Campagne / Type » |
| E4 | **Statuts incohérents** : 8 dans le mode d'emploi, 5 dans `Paramètres`, 3 utilisés dans les données | Le champ `Facturé ?` n'existe que pour 5 statuts | Une seule table de statuts avec libellé FR/EN, sens, « facturé ? » (voir §5) |
| E5 | Fonctions **volatiles** (`TODAY()`) et `WORKDAY.INTL` | Résultats variables à l'ouverture ; calcul différent plateforme / Excel | La plateforme calcule ; Excel recalcule en miroir ; date de calcul affichée |
| E6 | Validations et mises en forme conditionnelles **étendues** (extensions Excel) | Un enregistrement par une bibliothèque simple (openpyxl l'a signalé en lecture) **les supprime en silence** | Écriture par **tableau** (API) ou modification ciblée du fichier ; jamais de réécriture complète (§4) |
| E7 | `Secteurs` n'a **ni DR ni CVR** | Chaîne managériale absente du fichier | Jointure avec le référentiel DR › CVR › RS (4C `REF_CVR`, `REF_RS`) ; codes DR `F1` / `D001` à réconcilier (D24) |
| E8 | Codes secteur provisoires (S01…) créés pour des secteurs sans code | Clés instables | Clé technique `sector_id` immuable ; code lisible séparé |
| E9 | Règles de carence = règle générale du Code du travail, « à faire valider RH / juridique » | Ne pas présenter comme conformité | Paramètres versionnés ; validation par les professionnels compétents ; jamais de conclusion juridique par la plateforme |
| E10 | Tarifs fictifs (25 €, 27 €) ; tarifs réels 4C : 37,28 / 38,03 / 38,47 / 39,08 €/h | Calculs faux si repris | Exclure la grille du classeur de tout calcul ; tarifs réels datés en paramètres (D06) |
| E11 | Colonne `Commentaire` libre, et motifs de carence (maladie) | Données de santé | Motif générique côté cliente ; jamais de motif médical dans les exports cliente (déjà acté) |

### 3.3 Structure cible proposée (design et écriture)
Principe : **garder les noms de tableaux et d'onglets existants** (un flux Power Automate peut déjà les lire) et ajouter, à droite, les colonnes techniques. Trois statuts de cellule, comme dans les anciens modules : *à saisir*, *calculé · ne pas modifier*, *technique · géré par la plateforme*.

| Onglet / table | Contenu | Colonnes ajoutées | Écriture |
|---|---|---|---|
| **BESOINS** (nouveau, base de la saisie partagée : 45 colonnes dont 37 côté cliente) | Besoin, décision cliente, proposition agence | `need_id` (immuable), `record_version`, `source_record_id`, `campaign_type`, `modifié_le`, `modifié_par` | Plateforme (champs de la cliente ou de l'agence selon propriété) |
| **AFFECTATIONS** | Période de travail | `assignment_id`, `need_id` (lien facultatif), `record_version`, `campaign_type` | Plateforme sur A, D à O seulement |
| **CARENCES TERRAIN** (renommer : « Non-couverture ») | Épisode non couvert, remplacement, heures non couvertes | `episode_id`, `assignment_id` | Plateforme |
| **SECTEURS** | Référentiel | `sector_id`, `code_cvr`, `code_dr`, date d'effet | Plateforme (référentiel éditable) |
| **PARAMETRES** | Configuration lisible par Excel | Date d'effet, version, auteur | Plateforme (miroir) |
| **LISTES** | Statuts, types, contrats, motifs, exemptions, enseignes | Libellés FR/EN | Plateforme |
| **JOURNAL** | Qui, quoi, quand, avant / après | — | Plateforme |
| Calculs existants | Alertes, planning, facturation, carences contrats | Année en paramètre ; références structurées | Aucune |
Design : thème clair Suntory dominant, accent Marvesting `#E52365`, en-têtes distincts par statut de cellule, volets figés, filtres, listes déroulantes, police unique (à confirmer : Aptos ou système), sans couleur porteuse de sens seule (déjà la règle du mode d'emploi).

## 4. Principe « ajustable dans l'application, écrit dans le fichier branché » (D51)
| Règle | Détail |
|---|---|
| Sens | La plateforme décide ; le fichier branché est une **projection écrite** (et une source relue) |
| Zones | Seules les colonnes *à saisir* et *techniques* sont écrites. Une colonne calculée n'est **jamais** écrite |
| Concurrence | Avant écriture : comparaison de la version lue (`record_version`, `modifié_le`) ; si le fichier a changé, **refus d'écraser** et présentation des deux versions |
| Idempotence | Une écriture rejouée ne crée pas de doublon (clés `need_id`, `assignment_id`) |
| Aperçu | Créations, modifications, inchangés, conflits affichés avant validation humaine |
| Propriété | Un champ cliente n'est écrit que par le rôle cliente ; un champ agence que par l'agence (déjà acté pour M2/M3) |
| Paramètres | Modifiés dans l'application (par la cliente ou l'agence, double validation pour les enveloppes, D46), versionnés, **puis** reflétés dans l'onglet Paramètres |
| Réallocation | Ajustement d'enveloppe visible dans les autres espaces (D46) et écrit dans le fichier branché de façon datée |
| Mécanisme technique | À arbitrer (§7) : écriture par tableau via API (SharePoint / OneDrive, option D21), flux Power Automate, ou fichier d'échange déposé. **Ne jamais ré-enregistrer le classeur entier avec une bibliothèque qui supprime les extensions** |
| Démonstrateur (étape A) | Écriture **simulée** sur copie fictive ; aucun branchement réel avant feu vert B |

## 5. Glossaire : conformité de langage (D53)
Règle : un seul libellé par concept dans l'application (FR et EN), le libellé d'origine conservé comme alias de recherche et dans les exports historiques. Les écarts ci-dessous sont **observés** dans les documents ; la colonne « proposé » est à valider.

### 5.1 Campagnes et périmètres
| Libellés rencontrés | Proposé (FR / EN) | Remarque |
|---|---|---|
| Merch horaire · Merch ponctuel (TBB) · Horaire (4C) | **Horaire** / Hourly | Mapping TBB à démontrer ligne à ligne (doc 09) |
| Second placement · Merch tournées (TBB) · tournée inter-région | **Second placement** / Second placement | Idem |
| Merch permanent · Perm · Permanent | **Permanent** / Permanent | |
| Saisonnier · Orangina (nom d'onglet historique) | **Saisonnier** / Seasonal | Campagne 2026 clôturée ; 2027 fusionnée au permanent |
| Type · Campagne / Type | **Campagne** et **Type** (deux champs) | |

### 5.2 Territoire et acteurs
| Libellés rencontrés | Proposé | Remarque |
|---|---|---|
| DNV, DR, CVR, RS | **Direction nationale des ventes**, **Directeur régional (DR)**, **Chef de vente régional (CVR)**, **Responsable de secteur (RS)** | Sigles à définir avec la cliente ; DNV non défini dans les documents |
| Secteur · Secteur / ville · Poste · Magasin | **Secteur** (périmètre RS), **Poste** (position à pourvoir), **Magasin** (point de vente) | Ne pas employer l'un pour l'autre |
| Région (DR) · Région géographique · Région secteur · Région | **Région commerciale** (secteur) et **Région administrative** (déduite du département) | Deux notions, deux filtres nommés |
| Merch · Merchandiser · Intervenant · Ressource | **Merchandiseur** (personne) ; « intervenant » réservé au vocabulaire de l'agence | Aucun compte intervenant (D42) |
| Code Nielsen · code magasin | **Code magasin (Nielsen)** | Normalisation : texte, zéros de tête retirés avant jointure |

### 5.3 Cycle de vie (statuts)
| Libellés rencontrés | Proposé | Sens |
|---|---|---|
| Projection · À recruter GO SBFF · À recruter | **À recruter** | Poste ouvert, non pourvu |
| En recrutement | **En recrutement** | Candidats en cours |
| En attente retour RS · Proposé | **Proposé** | Proposition agence en attente de décision |
| Validé · Validée | **Validé** | Décision cliente favorable |
| Contrat + matériel OK | **Contrat signé** (étape) | Étape de préparation, pas un statut de décision |
| Pourvu · Pickup · Prise de poste | **Pourvu** (statut) et **Prise de poste** (date) ; **Remise du véhicule** distincte (D11) | « Pourvu » exige une date de prise de poste |
| Désistement · Désistement / Fin PE · Rupture contrat · Annulé · Refusé | **Désistement**, **Rupture**, **Annulé**, **Refusé** (quatre sens distincts) | « Facturé ? » à définir pour chacun |
| Statut proposition · Statut poste · Statut | **Décision** (cliente), **Proposition** (agence), **Poste** (calculé) | Trois statuts jamais condensés |

### 5.4 Budget et carences
| Libellés rencontrés | Proposé | Remarque |
|---|---|---|
| Carences terrain · Carences contrats · Carence intermédiaire · jour de carence | **Non-couverture** (poste non couvert), **Délai de carence entre contrats** (règle RH), **Jours de carence valorisés** (budget) | Trois notions distinctes (doc 03 contrats) |
| Quota · Budget · Enveloppe · Moyens · Rallonge | **Quota** (affecté), **Enveloppe** (périmètre), **Rallonge**, **Dépensé**, **Restant**, **Prévisionnel** | Cohérent avec D46 |
| À confirmer · Consommé · Prévisionnel · Non facturé | Conserver ces quatre états financiers | Non chiffré ≠ 0 |
| Atterrissage · Projeté | **Atterrissage** | Convention à écrire (D05) |
| Pickup (sens) | Voir 5.3 | Sens à arbitrer |

## 6. Axes métiers actuels recueillis
| Axe | Source | Existant | Ce qui est repris | Ce qui est ajusté |
|---|---|---|---|---|
| Pilotage activité | M1 (V3.12 → V4) | Synthèse, Budget, Territoires, Activité, Explorateur ; 4C, TBB, Saisonnier ; carte | Règles de calcul, seuils, baseline chiffrée | Langage (§5), charte mixte, paramètres éditables |
| Saisie des besoins | M2 | 108 besoins issus du recensement ; ID figé ; 6 recommandations | Décisions 1 à 6, moteur de statut, classes d'écart | Grain besoin / affectation, fusion Campagne / Type |
| Réponse agence | M3 | Propositions, chiffrage, export à cases à cocher | Coût d'une ligne, colonnes sensibles décochées | Libellés, propriété des champs, rôle RS/CVR |
| Affectations, non-couverture | Classeur D52 | Alertes, planning, facturation, carences | Principe « une ligne = une période » | Structure (§3), statuts, capacité |
| Référentiels | Listing V2, `REF_CVR`, `REF_RS` | 496 magasins, 7 enseignes | Enseigne / Nom / Ville / Département / Région administrative | D24, alias d'enseignes (Cora à décider) |
| Qualité | « Points à corriger » | 459 anomalies (4C V9) | Cloche, panneau, export | Gravités, propriétaires, règles de clôture |
| Échanges | Exports nommés `SUNTORY_{TYPE}_{CAMPAGNE}_{DATE}.xlsx` | Cases à cocher, registre des transmissions | Nommage, traçabilité | Signature FREELANCE sur les documents externes (D49) |

## 7. Arbitrages nécessaires
1. **Fichier de besoins :** confirmez-vous que `Suivi_Merch_Perm_Saisonnier_2026` est la base, **complétée** par une table BESOINS (structure 45 colonnes) liée aux affectations ? C'est ma recommandation (E1).
2. **Mécanisme d'écriture (D51) :** API sur fichier hébergé (SharePoint ou OneDrive, avec accord d'Impact et de la cliente), flux Power Automate, ou fichier d'échange ? Recommandation : tableaux nommés écrits par API, sinon fichier d'échange.
3. **Statuts (E4) :** valider la table du §5.3, avec « facturé ? » par statut.
4. **Tarifs réels et règles de carence :** fournis ou validés par RH/juridique ? Tant que non, les tarifs du classeur restent exclus (E9, E10).
5. **`00_PARTAGE/` et `REFONTE VISUELLE` :** les ajouter au dossier connecté pour que je lise `CONTRAT_MODULE.md` et les audits d'origine.
6. **DNV et sigles :** à définir avec la cliente.

## 8. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, T. SOEFOU décide pour Suntory : le TBB fait foi pour les montants du Permanent et le 4C pour le détail des périodes ; tout est ajustable dans l'application puis écrit dans le fichier Excel branché ; le fichier de `02_SAISIE_PARTAGEE` est le fichier validé en dernier, à restructurer pour l'écriture ; les axes métiers sont recueillis et mis en conformité de langage. Ouverts : structure besoins + affectations, mécanisme d'écriture, table des statuts, tarifs et règles de carence validés.

## 9. Addendum du 22/10/2026 (soir) : arbitrage des dossiers ajoutés et hébergement

### 9.1 Décisions reçues
| N° | Décision | Statut |
|---|---|---|
| D52 | Base = `Suivi_Merch_Perm_Saisonnier_2026` **complétée d'une table BESOINS** | Confirmée par T. SOEFOU |
| D54 | Table des statuts du §5.3 avec « facturé ? » par statut | Validée par T. SOEFOU ; valeurs « facturé ? » à renseigner (proposition au §9.4) |

### 9.2 Arbitrage des sources ajoutées (`00_PARTAGE/`, `REFONTE VISUELLE `)
Règle appliquée : une source plus récente et mesurée l'emporte ; une source plus ancienne ne sert que si rien ne la contredit. Les fichiers datent du 12 au 14/10 ; les documents « anciens axes » et les décisions des 16 à 22/10 les remplacent sur le design, le parcours et les rôles.

| Source | Date | Statut retenu | Ce qui reste valable | Ce qui est périmé |
|---|---|---|---|---|
| `00_PARTAGE/CONTRAT_MODULE.md` | 13/10 (module V3.12) | **Valable comme contrat de lecture des classeurs sources** (4C, TBB, Saisonnier, saisie partagée), pour les adaptateurs d'import (lot B5) | En-têtes exacts, 43 colonnes de `T_FAITS`, positions fixes (TBB `Merch permanent 2026` D:N, `Saisonniers 2026` D:I, `Budget et projection`), formats (dates, Nielsen, nombres), clés de rapprochement, règle « une erreur de formule dans un montant fait refuser le fichier » | Le module V3.12 (remplacé par M1/M2/M3 V4) ; saisie partagée « V14/V15 » (remplacée par la V3 et le classeur D52) ; décision 3 du §11 (habillage : remplacée par la charte mixte) |
| `00_PARTAGE/AUDIT_SAISIE_ONGLETS_COLONNES.md` | 13-14/10 | **Valable comme méthode et comme constat de qualité** | Liens externes rompus dans la découpe 2026 V3 (293 erreurs) et le saisonnier historique ; saisies libres avec variantes (« OK » / « OK  », majuscules) ; absence de validation numérique ; protection levée le 14/10 | Les nombres exacts (à recompter) ; fichiers 1 à 3 de l'époque |
| `00_PARTAGE/HARMONISATION_TBB_4C.md` | 14/10 | **Remplacé pour les chiffres** par le doc 09 du 17/10 | Référentiel commun = 4C (87 RS, 18 CVR) ; historique janvier-août aligné sur le TBB ; question « Le Havre R1A1 » | Écart Permanent 31 607,97 € (le 17/10 : 30 475,45 €) |
| `00_PARTAGE/DESIGN_TOKENS.md` (+ `.bak` fond sombre) | 13/10 | **Périmé** | — | Thème sombre, police Aptos : remplacés par la charte mixte |
| `REFONTE VISUELLE /SPEC_VUE_CLIENTE_V3.11.md`, modules V3.10 à V3.12, `patch_V3.11`, `TABLEAU_PATTERNS_GENTELELLA.md` | 12-13/10 | **Historique** (non repris comme référence) | Peut éclairer la vue cliente | Vue cliente antérieure à D42 (pas d'intervenant), à D08 (coûts) et à la charte mixte |
| `REFONTE VISUELLE /gentelella-master` | — | **Modèle tiers, non utilisé** | — | Licence et usage à examiner avant tout emprunt |
| `REFONTE VISUELLE /FICHIERS DE PILOTAGE POUR IMPORT/` | 07-14/10 | **C'est là que se trouvent les classeurs mesurés le 17/10** : `REFONTE_V3/03_PILOTAGE_4C/…OCT_2026V9`, `…/02_TBB_V18`, `…/02_SAISIE_PARTAGEE/…PERMANENT_V3`, `…/01_SOURCE_SAISONNIER/…V3` | Base de la baseline chiffrée | — |
| `Guide_ISM & Marvesting_Template.pptx` | 12/10 | Non lu | — | — |

**Constat d'organisation.** Les dossiers `01` à `04` à la racine ne contiennent plus que les fichiers d'origine (saisonnier du 06/07, suivi permanent/saisonnier du 22/10, TBB « Activité merch Horaire » du 05/10 ; `03_PILOTAGE_4C` est vide). Les chemins cités dans les docs 08 et 09 pointent donc vers l'ancien emplacement. **À comparer par empreinte** au démarrage de A0b : TBB racine contre TBB V18, saisonnier racine contre saisonnier V3.
Contrôle de cohérence : les statuts à 5 valeurs du classeur D52 ne reprennent pas les 4 états financiers de `T_FAITS` ; ce sont deux dimensions différentes (cycle de vie du poste contre statut financier).

### 9.3 Hébergement du fichier branché (réponse à la question 2)
**Point de départ.** La documentation officielle Microsoft Graph indique, pour l'ajout d'une ligne dans un tableau Excel, des permissions **déléguées** uniquement (`Files.ReadWrite`) et « Application : non pris en charge ». Des retours de la communauté indiquent qu'un accès **sans utilisateur** peut fonctionner avec `Sites.Selected` sur une bibliothèque donnée, mais cela n'est pas garanti par la documentation : **à tester dans le locataire d'Impact avant d'en dépendre**.

| Option | Principe | Prérequis côté Impact | Avantages | Limites |
|---|---|---|---|---|
| **A. SharePoint de l'agence + Graph (accès sans utilisateur)** | Plateforme écrit dans les tableaux nommés | Bibliothèque SharePoint dédiée à Suntory ; enregistrement d'une application dans Entra ID par un administrateur ; permission `Sites.Selected` limitée à ce site ; secret ou certificat conservé en coffre ; accord écrit d'Impact et du DPO | Données dans le périmètre de l'agence ; journalisation Microsoft ; historique de versions | Support officiel incertain (ci-dessus) ; dépendance à l'IT d'Impact |
| **B. SharePoint + compte de service (délégué)** | Un compte dédié, avec accès limité à la bibliothèque | Licence et compte dédiés ; gestion de l'authentification multifacteur | Cas pris en charge par la doc | Compte à protéger ; l'authentification par mot de passe sans second facteur est déconseillée |
| **C. Flux Power Automate (Excel Online) appelé par la plateforme** | Le flux, propriété de l'agence, lit et écrit les tableaux | Licences Power Automate de l'agence ; propriétaire du flux | Reste dans le périmètre de l'agence ; le classeur contient déjà des tableaux nommés pensés pour cela | Quotas, latence, fragilité en cas de renommage ; exécution sous l'identité du propriétaire du flux |
| **D. Fichier d'échange** (aucun branchement direct) | La plateforme dépose un classeur dans un dossier sécurisé ; l'agence l'ouvre ; un retour est réimporté | Dossier partagé sécurisé | Aucun droit d'écriture externe ; mode déjà éprouvé (M2/M3) | Pas de temps réel ; risque de divergence si deux versions circulent |

**Drive sécurisé hors agence (autre hébergeur).** Possible, avec deux réserves :
- Un classeur **.xlsx** déposé sur un stockage de fichiers (type Google Drive, Dropbox ou stockage objet) ne se modifie pas cellule par cellule : on le télécharge, on le modifie, on le renvoie. Cela expose au risque d'écraser les modifications d'un utilisateur et de supprimer des extensions Excel. Les interfaces cellule par cellule de Google concernent les **Google Sheets** natives, pas les .xlsx.
- Hors du périmètre de l'agence, l'hébergeur devient un **sous-traitant ultérieur** pour des données de la cliente : accord écrit d'Impact et de la cliente, convention de sous-traitance, hébergement dans l'Union européenne.

**Recommandation.** Garder la **plateforme comme base de référence** (D04) et traiter l'Excel comme une **projection**. Étape B : option **D** (fichier d'échange sur la bibliothèque SharePoint d'Impact) pour démarrer, puis **A ou C** après test dans le locataire d'Impact. Un « drive sécurisé » extérieur n'est utile que comme stockage des sauvegardes chiffrées, pas comme fichier de travail.

**Ce dont vous avez besoin pour SharePoint (liste à remettre à l'IT d'Impact) :**
1. Confirmer que l'agence utilise Microsoft 365 avec SharePoint Online (et non un serveur interne).
2. Une **bibliothèque dédiée** à Suntory, avec historique de versions activé, droits limités aux personnes habilitées.
3. Le classeur D52 déposé dans cette bibliothèque, **sans liens externes**, avec des tableaux nommés.
4. Un administrateur du locataire pour **enregistrer l'application** et accorder `Sites.Selected` à ce seul site (ou, selon l'option, créer le compte de service ou le flux).
5. Un lieu sûr pour le secret ou le certificat (coffre), sa durée de vie et son renouvellement.
6. **Accord écrit** d'Impact, de son DPO et de la cliente (cohérent avec les conditions du doc 11 sur l'IdP).
7. Un **essai sur copie fictive** : écriture d'une ligne, lecture, détection de conflit, comportement quand un utilisateur a le fichier ouvert.
8. Journalisation et revue des accès.

### 9.4 Statuts : « facturé ? » proposé (D54, à valider avec la cliente)
| Statut | Facturé ? | Remarque |
|---|---|---|
| À recruter | Non | Déjà non facturé |
| En recrutement | Non | |
| Proposé | Non | |
| Validé | Oui, à partir de la date de prise de poste | Sinon l'estimation compte avant le démarrage |
| Pourvu | Oui | Exige une date de prise de poste |
| Désistement | Non | |
| Rupture | Non à partir de la date de fin effective | Règle de carence éventuelle à part (RH / juridique) |
| Annulé / Refusé | Non | |
