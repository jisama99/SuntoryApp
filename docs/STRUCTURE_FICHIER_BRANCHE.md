# STRUCTURE_FICHIER_BRANCHE · lot A0b (V0.1 du 23/10/2026)

Statut : proposition. Base : doc 17 §3 et §9.3, D51, D52, D56, `18_BROUILLON_DEMANDE_IT_IMPACT.md`. **Étape A : aucun branchement, données fictives uniquement.** Tout branchement réel relève de l'étape B (feu vert écrit dans `DECISIONS.md`).

## 1. Principe
- La **plateforme est la base de référence** (D04, D56) ; l'Excel est une **projection** (écriture, échange, reporting).
- Fichier cible : `Suivi_Merch_Perm_Saisonnier_2026` (D52, dernier fichier validé), **complété** par la table `BESOINS`, **sans liens externes**, avec tableaux nommés conservés.
- Les noms d'onglets et de tableaux existants sont **gardés** (un flux Power Automate peut déjà les lire) ; les colonnes techniques s'ajoutent **à droite**.

## 2. Onglets et zones
| Onglet | Rôle | Zones de cellules | Écriture plateforme |
|---|---|---|---|
| Mode d'emploi | consignes | texte | non |
| Affectations (tableau nommé, 23 col. A–W) | une période de travail | saisie : A, D à O ; calculé : B, C, P à W | colonnes de saisie uniquement |
| Carences terrain (15 col.) | non-couverture | saisie | oui |
| BESOINS (nouveau, 45 col.) | besoin / décision / proposition | selon propriétaire C / A / K / S (voir `DICTIONNAIRE_DONNEES.md`) | colonnes C et A selon rôle ; jamais K |
| Paramètres | tarifs, listes, règles | configuration | non (la plateforme est la source) |
| LISTES | statuts, contrats, motifs | libellés FR/EN | non |
| MÉTADONNÉES (nouveau) | version du schéma, date d'export, empreinte | système | oui |
Trois statuts de cellule distincts par couleur **et** par libellé d'en-tête (jamais la couleur seule) : *à saisir*, *calculé · ne pas modifier*, *technique*.

## 3. Règles d'écriture (D51)
| Règle | Contenu |
|---|---|
| Colonnes calculées | jamais écrites par la plateforme |
| Anti-écrasement | `record_version` comparé avant écriture ; version plus récente dans le fichier = **refus + conflit journalisé** |
| Validation | aucune écriture sans validation humaine |
| Idempotence | rejouer le même export ne change rien (clés `need_id`) |
| Recalcul | Excel recalcule en miroir ; la plateforme affiche la date de calcul |
| Fonctions volatiles | `TODAY()` / `WORKDAY.INTL` interdites dans les colonnes lues |
| Colonnes sensibles | `candidate_phone`, `specific_rate`, `training_cost_*`, `agency_comment` exclues des fichiers destinés à la cliente |
| Format | vraies dates, pas de texte ; fichiers sources recalculés au moins une fois (sinon « vide » côté lecture) |

## 4. Options d'hébergement du fichier branché
| Option | Principe | Prérequis côté Impact | Limites |
|---|---|---|---|
| A. SharePoint + Graph, accès sans utilisateur (`Sites.Selected`) | écriture dans les tableaux nommés | bibliothèque dédiée, application enregistrée par un admin, secret en coffre, accord écrit | **non vérifié** : la doc Graph décrit des permissions déléguées pour l'ajout de ligne ; le sans-utilisateur repose sur des retours communautaires |
| B. SharePoint + compte de service | compte dédié délégué | licence, MFA | compte à protéger |
| C. Flux Power Automate (Excel Online) | flux propriété de l'agence | licences, propriétaire | quotas, latence, fragilité |
| **D. Fichier d'échange** (recommandé pour démarrer) | dépôt / reprise d'un classeur dans une bibliothèque sécurisée | dossier partagé | pas de temps réel ; risque de deux versions |
Un « drive » hors périmètre agence rendrait l'hébergeur **sous-traitant ultérieur** : accord écrit d'Impact et de la cliente, convention art. 28, UE. Un .xlsx stocké sur un simple stockage objet ne se modifie pas cellule par cellule.

## 5. Liste à remettre à l'IT d'Impact (brouillon `18_…`, non envoyé)
1. Microsoft 365 / SharePoint Online confirmé ? 2. Bibliothèque dédiée, historique des versions. 3. Classeur sans liens externes, tableaux nommés. 4. Administrateur pour l'enregistrement d'application (`Sites.Selected`) ou compte de service / flux. 5. Coffre pour le secret, durée de vie, renouvellement. 6. Accord écrit Impact + DPO + cliente. 7. Essai sur copie fictive (écriture, lecture, conflit, fichier ouvert par un utilisateur). 8. Journalisation et revue des accès.
Signature du courrier : profil FREELANCE (coordonnées à compléter) · **non envoyé**.

## 6. Garde-fous
- Aucune écriture réelle avant le feu vert B écrit.
- Les affirmations Graph restent « non vérifié » jusqu'à l'essai dans le locataire d'Impact.
- Sensibilité : les classeurs d'échange sont **en clair par conception** dans le V4 → chiffrer ou protéger les envois contenant des données personnelles (Q20).
