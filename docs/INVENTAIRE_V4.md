# Inventaire des modules V4 · Lot A0

Date : 23/10/2026 · Version de travail · Aucune donnée réelle reprise dans ce document.
Sources : `REFONTE_V3/06_MODULES_V4/` (structure et noms de fichiers listés), présentation cliente V0.4 (fiches modules C.MODULES), `PROMPTS_AJUSTEMENTS_V4/` (lisez-moi, rapport d'ajustements).

> Mise à jour 23/10 : une lecture ciblée du code a été faite ensuite, voir `INVENTAIRE_V4_CODE.md`. Le tableau ci-dessous décrit l'état **avant** cette lecture.

## 0. Niveau de lecture (honnêteté)

| Élément | Niveau |
|---|---|
| Fiches modules M1, M2, M3, Comptes (écrans, limites, reprise, évolutions) | **Lues** dans la présentation V0.4 (C.MODULES), qui est un document de l'agence, pas le code |
| Rapport d'ajustements V4 du 19/10 (scores, baseline, poids) | **Lu partiellement** (60 premières lignes) ; chiffres rapportés, **non rejoués aujourd'hui** |
| Code source des modules (`core.js`, `m1_engine.js`, `m2_engine.js`, `m*_a/b/c.js`) | **Non lu** : structure et tailles listées seulement |
| HTML livrables M1, M2, M3, Gestion des comptes | **Non ouverts** |
| Suites de tests Python/Playwright | **Listées, non lancées** |
| `data_real.js`, `ref_reel.js`, `ref_magasins_geo.js`, `communes_cvr.js` | **Structure seulement** (noms et tailles), aucune valeur lue ni copiée |

Conséquence : toute règle ci-dessous marquée « à relire dans le code » doit être confirmée par lecture du fichier source avant d'être reprise en TypeScript (lot A2 et suivants).

## 1. Vue d'ensemble

| Module | Livrable | Taille livrable | Public | Stockage | Réseau |
|---|---|---|---|---|---|
| M1 Pilotage activité Merch | `M1/M1_Pilotage_Activite_Merch_V4.html` | 2 253 833 o (rapport : limite interne 2,5 Mo) | Agence (mode Cliente en lecture) | Données embarquées au moment de la livraison | Aucun appel (rapport du 19/10) |
| M2 Saisie des besoins (cliente) | `M2/M2_Saisie_Besoins_Cliente_V4.html` | 1 124 128 o | Cliente (DR, CVR, RS) | Stockage local du poste, échange par fichier, sauvegarde JSON chiffrée | Aucun appel |
| M3 Réponse agence | `M3/M3_Reponse_Agence_V4.html` | 1 582 040 o | Agence | Stockage local, échange par fichier, registre des transmissions | Aucun appel |
| Gestion des comptes (agence) | `SECURITE/Suntory_Gestion_Comptes_Agence.html` | non relevée | Agence uniquement | Fichier « trousseau » hors ligne | Aucun appel |

Les trois modules partagent `core.js` (68 801 o) et `core.css` (44 085 o) : même noyau, copié dans chaque dossier `sources/`. Le design V4 est donc déjà factorisé côté noyau.

## 2. Écrans par module (source : V0.4)

### M1 Pilotage activité Merch
| Groupe | Écrans |
|---|---|
| Pilotage | Synthèse, Budget, Territoires (carte), Activité (classement CVR, Top 5 RS, cartes de chaleur), Explorateur (détail département × enseigne × campagne) |
| Périmètres | Horaire, Second placement, Permanent, Saisonnier (pas de quota affiché pour permanent et saisonnier) |
| Données | Imports (brut d'activité), Points à corriger (19 contrôles), Exports Excel, Magasins et géographie, Paramètres, Clôture hebdomadaire |

### M2 Saisie des besoins (cliente)
Cockpit, Saisie des besoins, Mes demandes (« qui doit agir »), Ressources agence, Points à corriger, Échanges et sauvegarde.

### M3 Réponse agence
Cockpit agence, Import fichier cliente, Besoins cliente, Propositions, Chiffrage (prorata 4,33, jours calendaires ÷ 7, jours ouvrés ÷ 5), Points à corriger, Magasins et géographie, Échanges et sauvegarde.

### Gestion des comptes
Créer un trousseau, ouvrir un trousseau, comptes et clés (scellement des modules). Politique de mot de passe : 12 caractères et 4 catégories, ou 14 caractères avec majuscules, minuscules et chiffres.

## 3. Règles réutilisables (à relire dans le code avant reprise)

| Règle | Où elle vit (fichier source) | Statut de lecture | Cible plateforme |
|---|---|---|---|
| Calcul consommé, prévisionnel, à confirmer, atterrissage, quotas | `M1/sources/m1_engine.js` (39 274 o) | Non lu | `src/domain` après relecture ; **à ne pas porter avant D05** (définition du consommé ouverte) |
| Statuts de poste, « qui doit agir » | `M2/sources/m2_engine.js` et `M3/sources/m2_engine.js` (7 532 o, identiques en taille) | Non lu | A3, avec séparation des statuts (D54) |
| Rapprochement retour agence par clé technique puis identifiant | M2/M3 `m*_b.js`, `m*_c.js` | Non lu | A6 (import en quarantaine) |
| Chiffrage (prorata de semaines, tarifs avec date d'effet) | `M3/sources/m3_*.js` | Non lu | **Hors démonstrateur** : tarifs réels interdits (D06 ouvert) ; montants fictifs étiquetés |
| Écriture Excel (xlsx) | `xl_writer.js` (12 090 o, identique dans M1, M2, M3) | Non lu | A6 et exports : à évaluer face à une bibliothèque tierce (voir PILE_PROPOSEE) |
| Géographie magasins, communes, CVR | `00_REF_GEO/*` | Structure seulement | Fixtures fictives uniquement ; aucune coordonnée réelle |
| Contrats de lecture des classeurs | `00_PARTAGE/CONTRAT_MODULE.md` (24 752 o) | En-tête lu | Retenu comme contrat de lecture (D55) ; **présent**, contrairement à la mention « introuvable » de la V0.4 |

## 4. Tests existants (listés, non rejoués)

| Suite | Fichier | Score rapporté le 19/10 |
|---|---|---|
| M1 | `M1/sources/test_m1.py` | 11 OK, 0 KO |
| M2 | `test_m2.py`, `test_guard.py`, `test_map.py` | 40/40, 32/32, 8/8 |
| M3 | `test_m3.py`, `test_guard.py`, `test_map_m3.py` | 51/51, 32/32, 10/10 |
| Lots 1 à 4 | `_build/tests_lot1` à `tests_lot4`, `_build/tests_lot6` | 70, 176, 79, 103 contrôles |
| Non-régression | `00_BASELINE/baseline_v312.json` + `run_baseline.js` | Écart maximal 0,03 € (rapport) ; `run_baseline.js` **non relancé** à l'époque |

Réserve du rapport lui-même : suites exécutées sous Chromium Linux, pas Chrome Mac. **Rien de tout cela n'est un test exécuté aujourd'hui.** Les tests sont en Python/Playwright ; la plateforme prévoit Vitest + Playwright (TypeScript) : les scénarios sont à **réécrire**, pas à exécuter tels quels.

## 5. Ce que la plateforme reprend, remplace, abandonne

| Reprendre | Remplacer | Abandonner |
|---|---|---|
| Design V4 (charte mixte D30), navigation, carte à points, graphiques interactifs, filtres en cascade, règles de statut après relecture | Stockage local et échange par fichier → dépôt de données (fixtures A, PostgreSQL B) ; trousseau de comptes → identité par l'IdP de l'agence (D33) | Données embarquées dans le HTML ; moteur de chiffrage avec tarifs réels ; `.bak` et `_avant_correction` |

## 6. Signalements (hors périmètre, non corrigés)
- `03_PILOTAGE_4C` ne contient que `.DS_Store` : le classeur 4C n'est pas disponible sur ce poste (cité par la V0.4 comme déjà signalé).
- `M2/sources` contient des fichiers `.bak` (`test_guard.py.bak`, etc.) : à ne pas reprendre.
- `data_real.js` (288 216 o) et `m1_pack.js` (520 423 o) contiennent des données réelles : **ne jamais copier dans le dépôt de la plateforme** (`.gitignore` bloque `*.xlsx`, `*.xlsm`, `*.xls`, `*.csv`, `*.pdf` mais **ni `.js`, ni `.json`, ni les images** : lacune à combler, voir FIXTURES.md) : voir FIXTURES.md, contrôle C3.
