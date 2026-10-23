# Addendum A0 · Lecture du code des modules V4

Date : 23/10/2026 · Suite à la validation de la question 12. Consigne : lire pour **améliorer vers une expérience plateforme**, pas pour copier. Aucune valeur de donnée réelle n'est reproduite dans ce document.

## 1. Périmètre de lecture (honnête)

| Fichier | Lecture |
|---|---|
| `M2/sources/m2_engine.js` (7,5 Ko, identique dans M3) | **Lu en entier** |
| `M1/sources/m1_engine.js` | **Lu en partie** : liste des fonctions, `isoWeek`, `isoWeekYear`, `quotaScope`, `statutQuota`, `controls` (19 contrôles) |
| `core.js` (identique M1 = M2) | **Lu en partie** : liaison magasin ↔ poste, filtres, libellés, persistance du référentiel, bascule de mode |
| `m3_a.js` | **Lu en partie** : `tarifPour`, `chiffre`, `costL`, `feu`, `points` (alertes), `calc` |
| `m2_b.js` | Fonction `decide` seulement |
| `m2_c.js` | Signatures (chiffrement de sauvegarde) |
| `m1_block_a/b/c`, `m3_b/c`, `xl_writer.js`, rendu des écrans | **Signatures seulement** (listes de fonctions), code non lu |
| `data_real.js`, `m1_pack.js`, `ref_*.js`, `communes_*` | **Non lus volontairement** (données réelles) |

**Incident à signaler :** deux commandes de repérage ont affiché par erreur quelques centaines de caractères de `ref_magasins_geo.js` et de `ref_reel.js` (enregistrements de magasins, noms de personnes). Rien n'a été copié ni noté dans le dépôt ; ces valeurs n'apparaissent dans aucun livrable. À savoir : le référentiel réel contient **prénom et nom** de personnes pour les DR.

## 2. Ce que le code montre (constats)

| # | Constat (source) | Conséquence plateforme |
|---|---|---|
| C-1 | **Le « mode Cliente » est un simple bouton** : `App.mode==='cliente'` masque des entrées de menu (`clientHide`) et des actions marquées `agence` (`core.js`). Les données restent chargées et n'importe quel utilisateur peut rebasculer en « Agence » | Aucune protection réelle. Cible : l'audience est portée par la **donnée** (D108), filtrée côté données |
| C-2 | Les alertes de `points()` (M3) n'ont pas d'audience : chaque alerte porte `k` (type), `s` (gravité c/w/i), `t`, `w`, `v` (écran cible). Se mélangent « Besoin incomplet » (cliente), « Chiffrage incomplet », « Aucune sauvegarde générée », « Stockage durable limité » (agence / technique) | Ajouter `audience` (agence, cliente, les deux) et `visibleTo` ; alertes techniques et de chiffrage = agence seule |
| C-3 | M1 `controls()` : 19 contrôles de forme `{id, libellé, valeur, attendu, écart, bloquant, statut, note}`, statut « OK / ÉCART / Alerte » | **À reprendre comme modèle** de « actions à traiter » (bloquant vs alerte). La plupart (LOGA, tarifs, IK, TBB, ajustements) sont **agence seule** |
| C-4 | `lab(k,c)` affiche `code · nom complet` pour DR, CVR, RS, à partir du référentiel (`REF.drs[c]`), où le nom est celui d'une **personne** (prénom + nom) | Le motif « code · nom » existe déjà. Reste à trancher si l'on affiche la personne ou le libellé de zone (question 8). Auditer les écrans qui affichent le code seul |
| C-5 | M2 : `STATUTS` = À pourvoir, En recrutement, Proposé, Validé, Pourvu, Refusé, **dérivé** à la volée ; « Pourvu » = présence d'une `datePickup`. Pickup y signifie donc la **date de prise de poste** | Répond en partie à Q17 : dans le code, pickup = prise de poste. La **remise du véhicule** n'existe pas comme événement (le véhicule sert seulement au tarif) → nouvel événement (D11) |
| C-6 | Un seul statut condensé alors que D54 exige des statuts séparés (besoin, proposition, recrutement, exécution) | Découper en 4 à 5 champs ; l'entonnoir D92 se calcule depuis les événements (D91) |
| C-7 | `decide()` écrase `statutProposition` sur le besoin ; pas de version de proposition, pas d'invalidation de décision | A3 : proposition versionnée, décision liée à une version |
| C-8 | Identifiant d'un besoin = `CVR-MP<poste>-<SECTEUR>-P<période>`, figé à la première complétude (`idFixe`) ; refus si le secteur contient « \| » | Identifiant technique UUID immuable + code lisible séparé (CLAUDE.md) ; le code lisible ne dépend plus du libellé du secteur |
| C-9 | Valeurs en dur : année 2026, clôture `2026-10-05`, fin par défaut `2026-12-31`, 7 postes « Merch Perm », listes d'heures et de jours | Paramètres par campagne et par année (S53 / 2027) ; aucun millésime en dur |
| C-10 | `semainesParMois` : trois conventions (prorata 4,33 ; jours calendaires ÷ 7 ; jours ouvrés ÷ 5), pas de semaine ISO | Ne pas porter avant D05 ; la semaine ISO s'implémente à part (W1–W22) |
| C-11 | Règles de doublon : seul le contrôle « ID en double » existe. Aucune règle D1 à D7, aucun contrôle W1 à W22 | Confirme la V0.4 : tout est à écrire (A2a) |
| C-12 | `isoWeek` / `isoWeekYear` (M1) : méthode du jeudi, conforme à la norme | Réécrire en TypeScript et tester sur les dates repères vérifiées (28/12/2026, 04/01/2027) |
| C-13 | `statutQuota` : Dépassement, Vigilance, Conforme, Sous-consommation, « Hors quota » si quota ≤ 0 avec consommation ; seuils paramétrés (40/90/100 % côté V0.4) | À reprendre tel quel comme règle pure, seuils en paramètres |
| C-14 | `quotaScope` accepte des **ensembles** de CVR (sélection multiple) ; l'interface (`F.cvr`) ne gère qu'une valeur | La sélection multiple de CVR est faisable sans toucher à la règle |
| C-15 | Liaison magasin ↔ poste (`linkCands`) : niveau « sûr » seulement si une ligne unique de chaque côté, même code postal et même CVR ; sinon « à vérifier » avec la liste des raisons | Bon principe (explicabilité) à garder pour le rapprochement (A6 et B5) |
| C-16 | Référentiel DR/CVR/RS **modifiable localement** (`localStorage`, journal de 60 entrées) ; ajustements avec journal de 500 entrées | Plateforme : référentiel gouverné, daté, historisé (P5 de la V0.4) ; le journal devient le journal d'événements (D91) |
| C-17 | Sauvegarde : AES-GCM 256, dérivation PBKDF2 SHA-256, 200 000 itérations (M2, M3) | Sans objet pour la plateforme (sauvegardes serveur) ; ne pas réutiliser comme mécanisme d'accès |
| C-18 | Stockage navigateur (localStorage, IndexedDB) pour toutes les saisies | Remplacé par `Repository` |
| C-19 | Carte : contours en `W.FRANCE` injecté au build (origine non tracée dans le code lu). La maquette premium V4 charge ses contours **depuis un CDN externe** (dépôt GitHub public) | Contredit « aucun appel réseau sortant » ; licence non vérifiée (D25). Embarquer localement une source dont la licence est confirmée |

## 3. Garder, améliorer, abandonner

| Garder (réécrit en TypeScript) | Améliorer vers la plateforme | Abandonner |
|---|---|---|
| Seuils et statuts de quota (C-13) ; semaine ISO (C-12) ; forme des contrôles (C-3) ; niveau de confiance du rapprochement (C-15) ; classes d'écart besoin / proposition et leurs actions (M2 `CLASSES`, tolérances 5 / 10 / 60 jours, à paramétrer) | **Audience par alerte** (C-1, C-2) ; **statuts séparés et événements** (C-5 à C-7) ; **identifiants** (C-8) ; **paramètres par campagne et année** (C-9) ; **personnalisation uniforme** : un contexte d'accès unique (profil, périmètre, vocabulaire, langue) lu par chaque écran, e-mail et export ; **« code · libellé »** systématique (C-4) | Mode Cliente par bouton ; stockage et sauvegarde chiffrée côté navigateur ; données embarquées ; ID dépendant du libellé ; moteurs de chiffrage tant que D05 / D06 sont ouverts |

## 4. Nouvelles règles proposées par les consignes du 23/10

| Consigne | Règle de mise en œuvre proposée (non encore décidée) | Critère de test |
|---|---|---|
| Noms à côté des codes DR / CVR / RS | Composant unique `ZoneLabel` : `libellé · code` (clé de traduction FR/EN) ; **un seul endroit** produit cet affichage, y compris exports et e-mails. Nom de personne : selon la réponse à la question 8 | Test statique : aucun écran n'affiche un code DR/CVR/RS sans passer par `ZoneLabel` |
| Personnalisation uniforme | Un `AccessContext` créé à la connexion simulée ; titres, salutation, périmètre, vocabulaire, langue et filtres par défaut en dérivent | Même parcours sur 7 profils : snapshot des intitulés et des chiffres, comparés à une table attendue |
| Pas d'alerte agence côté cliente, CVR, DR | `audience` obligatoire sur toute alerte ; filtrage dans `Repository` ; défaut = **refus** (alerte sans audience invisible partout sauf agence) ; mêmes règles pour e-mails et rapports (D86, D73) | Test inter-profils : aucune alerte `agence` ne sort de la couche de données pour un profil cliente |
