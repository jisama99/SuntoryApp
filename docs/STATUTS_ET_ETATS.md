# STATUTS_ET_ETATS · lot A0b (V0.1 du 23/10/2026)

Principe (D54, doc 17 §5.3) : **plusieurs dimensions distinctes, jamais condensées en un seul champ**. Table à 9 statuts et règle « facturé à partir de la prise de poste » **validées par T. SOEFOU le 23/10/2026** ; la colonne « facturé ? » reste à confirmer avec la cliente.

## 1. Les dimensions
| Dimension | Qui décide | Valeurs | Origine |
|---|---|---|---|
| **Décision** | cliente | à décider · Validé · Refusé **[valeurs proposées]** | doc 17 §5.3 |
| **Proposition** | agence | aucune · en cours · Proposé · retirée **[valeurs proposées]** | M3 / CONTRAT §3 (`Statut proposition`) |
| **Poste** (calculé) | système | À recruter · En recrutement · Proposé · Validé · Pourvu · Désistement · Rupture · Annulé · Refusé | doc 17 §5.3 + §9.4 |
| **Financier** | agence / TBB | Consommé · Prévisionnel · À confirmer · Non facturé | `T_FAITS` (CONTRAT §2.5) |
| **LOGA (mission)** | LOGA | ASSIGNED · PENDING_VALIDATION · VALIDATED · CANCELED | lecture seule |
| **Entonnoir (D92)** | système | 6 états du funnel recrutement | D92, détail dans `DECISIONS.md` |
Le statut financier et le cycle de vie du poste sont **deux dimensions différentes** (doc 17 §9.2).

## 2. Table de correspondance (existant → cible)
| Libellés rencontrés | Statut cible | Facturé ? (proposé) |
|---|---|---|
| Projection · À recruter GO SBFF · À recruter | À recruter | Non |
| En recrutement | En recrutement | Non |
| En attente retour RS · Proposé | Proposé | Non |
| Validé · Validée | Validé | Oui, à partir de la date de prise de poste |
| Contrat + matériel OK | étape « Contrat signé » (pas un statut) | — |
| Pourvu · Pickup · Prise de poste | Pourvu + date de prise de poste ; remise du véhicule distincte (D11) | Oui |
| Désistement | Désistement | Non |
| Rupture contrat | Rupture | Non à partir de la date de fin effective (carence éventuelle : RH / juridique) |
| Annulé · Refusé | Annulé · Refusé (sens distincts) | Non |

## 3. Conflits à arbitrer
| # | Conflit | Constat | Proposition |
|---|---|---|---|
| S1 | « Pourvu » du V4 = présence de `datePickup` | le V4 confond prise de poste et statut | « Pourvu » exige une date de prise de poste ; la remise du véhicule est un événement séparé |
| S2 | Statuts V4 condensés (6 : À pourvoir, En recrutement, Proposé, Validé, Pourvu, Refusé) | perd Désistement, Rupture, Annulé | table cible à 9 valeurs |
| S3 | Classeur D52 : 8 statuts (mode d'emploi), 5 (Paramètres), 3 (données) | « Facturé ? » n'existe que pour 5 | une table `LISTES` unique FR/EN avec indicateur `facturable` |
| S4 | « Pickup » : sens à arbitrer | prise de poste vs remise véhicule | D11 : deux champs |
| S5 | « Non facturé » ≠ 0 | un montant non chiffré n'est pas nul | conserver « À confirmer » comme état financier |
| S6 | « Facturé ? » pour Validé avant prise de poste | risque de compter l'estimation avant démarrage | règle : facturable seulement à partir de `start_work_date` |

## 4. Transitions autorisées (proposition)
`À recruter → En recrutement → Proposé → Validé → Pourvu` ; sorties possibles depuis tout état amont : `Refusé`, `Annulé` ; depuis `Validé` ou `Pourvu` : `Désistement`, `Rupture`. Toute transition est **journalisée** (acteur, date, motif) et produit un événement (D91). **[Proposé, à valider]** ; non codé.

## 5. À valider
- (Table et règle validées le 23/10/2026.) Colonne « facturé ? » avec la cliente (D54 : valeurs à renseigner).
- Règle de carence après rupture (RH / juridique, hors périmètre technique).
- Mapping exact vers les 6 états du funnel D92 (à écrire à partir de `DECISIONS.md` en A1).
