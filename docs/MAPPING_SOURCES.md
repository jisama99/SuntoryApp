# MAPPING_SOURCES · lot A0b (V0.1 du 23/10/2026)

Statut : proposition. Base : `00_PARTAGE/CONTRAT_MODULE.md` (module V3.12, valable comme **contrat de lecture** des sources, D55), doc 17 §2, `DEVIS_CONFORMITE/AUDIT_DEVIS_LOT0.md`. **Aucun classeur ouvert dans cette session** : tout ce qui suit est [Constaté] dans les documents, [À confirmer] sur les fichiers.

## 1. Règle d'autorité (D50)
| Donnée | Source qui fait foi | Source de détail | Traitement de l'écart |
|---|---|---|---|
| Permanent : montants | TBB | — | l'écart se réconcilie vers le TBB ; le 4C est annoté |
| Permanent : périodes, heures, secteurs | 4C (`COLLER_PERM_SAISO`, `T_FAITS`) | — | |
| Saisonnier 2026 | Source Saisonnier = TBB | archive clôturée | lecture seule |
| Budgets, facturé, historique | TBB | — | lecture seule |
| Rattachement magasins | Listing V2 puis référentiel plateforme | — | éditable, daté, journalisé |

## 2. Adaptateurs d'import (lot B5) · table source → cible
| Source | Onglet / zone | Détection | Colonnes obligatoires | Cible plateforme | Clé de rapprochement |
|---|---|---|---|---|---|
| Brut LOGA | `COLLER_LOGA` | en-têtes dans les 8 premières lignes avec « Opération » + « Statut de la commande » | 20 sur 42 (dont Code Mission, Code Nielsen, Magasin, Ville, Code Région FDV, Date de début, Statut, Profil, Prénom, Nom, IK, heures, Réalisé, frais) | `faits` (réalisé) | `Code Mission|date|Prénom Nom` (+ `#n` si doublon) |
| Permanent | `COLLER_PERM_SAISO` | « ID période » + ≥ 3 colonnes de mois, 25 premières lignes | ID période, Code CVR, Code RS, Secteur, Nom proposé, 12 colonnes `€ Mois` | `faits` (Permanent) | `ID période|AAAA-MM` ; mois à 0 = pas de ligne |
| Saisonnier | `T_FAITS_SAISO` | « ID fait » + « ID contrat », 25 premières lignes | ID fait, Campagne, Statut financier, Mois, Code CVR, Code RS, Intervenant, ID contrat, Semaines, Montant HT | `faits` (Saisonnier) | `ID fait` |
| 4C `T_FAITS` | 43 colonnes A–AQ | en-têtes ligne 4 | tout en-tête doit appartenir à la liste (inconnu = blocage) | `faits` | `ID fait` |
| Saisie partagée | feuille « SAISIE… » | « ID besoin » dans les 15 premières lignes | 20 colonnes client | `BESOINS` | `need_code` ; le dernier import d'une campagne remplace le précédent |
| TBB | 3 onglets (`Merch permanent 2026`, `Saisonniers 2026`, `Budget et projection`) | ≥ 2 sur 3 | position fixe : Permanent D–N (février–décembre), Saisonniers D–I (mai–octobre), Budget L, M, N, O, P, S, T, Z | `budgets`, `facture` | CVR (col. A) |
| Listing magasins / COG | CSV INSEE 2025, `table-appartenance-geo-communes-2026.xlsx` | — | code commune, département | `magasins`, `zones` | code Nielsen / code commune |
| DECOUPE 2026 V3 | `DECOUPE` | — | usage selon D109 bis (accord Impact / cliente requis avant démo cliente) | `secteurs`, `rattachements` | à définir [À confirmer] |

## 3. Règles de lecture à reprendre telles quelles
| Sujet | Règle |
|---|---|
| En-têtes | comparés sans accents, sans majuscules, espaces réduits |
| Nombres | vrai nombre, ou texte avec virgule/point ; texte non numérique dans un montant = erreur bloquante (Permanent, Saisonnier, TBB) |
| Cellules en erreur | `#REF!`, `#NAME?`… comptées et bloquantes pour Permanent, Saisonnier, TBB |
| Codes CVR / RS | majuscules, espaces retirés |
| Code Nielsen | nombre → entier ; sinon texte majuscule ; préfixe `X-` = pseudo-code |
| Contrôle TBB | 18 CVR attendus ; somme mois Permanent = col. S ; somme Saisonnier = col. L ; tolérance 0,01 € ; écart = alerte, pas refus |
| Erreurs du fichier | R8 : un fichier en erreur est refusé en entier, rien n'est modifié |

## 4. Écarts E1–E11 et traitement dans la plateforme
| Écart | Traitement proposé |
|---|---|
| E1 grain besoin ≠ affectation | deux objets : `BESOINS` et `AFFECTATIONS`, liés par `need_id` |
| E3 année en dur | `campaign_year` paramètre ; champ commun Campagne / Type |
| E4 statuts incohérents (8 / 5 / 3) | table `LISTES` unique, voir `STATUTS_ET_ETATS.md` |
| E5 fonctions volatiles (`TODAY()`, `WORKDAY.INTL`) | la plateforme calcule, Excel en miroir, date de calcul affichée |
| E8 codes secteur provisoires | clé technique `sector_id` + code lisible séparé |
| E10 tarifs fictifs du classeur | exclus de tout calcul ; tarifs réels datés en `PARAMETRES` (D06) |
| Écart Permanent TBB / 4C | voir §1 ; montant précis à reprendre de doc 09, **non recalculé ici** |
| E2, E6, E7, E9, E11 | détail dans doc 17 §2 ; **non relu ligne à ligne ici** [À confirmer] |

## 5. Constats de qualité des sources (audit du 14–20/10)
- Six familles de fichiers pour une même campagne, sans référence désignée ; liens externes rompus (DECOUPE : 293 `#N/A`, Saisonnier : 91 + 1).
- Deux exports LOGA à structures différentes (72 puis 123 colonnes) ; nom évoquant Permanent / Saisonnier mais contenu Ponctuel / 2nd placement : **à confirmer avec LOGA**.
- Saisies libres avec variantes (« OK » / « OK  », casse, espaces) → listes fermées et normalisation à l'import (trim, casse).
- Le module garde **sa propre copie** des tarifs, quotas, référentiel territoire : la plateforme doit être l'unique référence (D04).

## 6. À relire dans les fichiers sources avant A2
1. En-têtes réels du fichier `Suivi_Merch_Perm_Saisonnier_2026` (D52) contre `BESOINS` / `AFFECTATIONS`.
2. Valeurs distinctes des colonnes à liste (source candidat, disponibilité, recrutement, motifs).
3. Présence de liens externes dans le fichier branché (doit être zéro).
4. Écart TBB / 4C : reproduire le calcul sur le fichier réel.
