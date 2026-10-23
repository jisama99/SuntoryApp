# COMPTE_RENDU_A0B · cadrage des données Excel (23/10/2026)

## 1. Produit
| Document | Contenu |
|---|---|
| `DICTIONNAIRE_DONNEES.md` | règles transverses, BESOINS (champs, propriétaire d'écriture, sensibilité, audience), autres tables, données personnelles |
| `MAPPING_SOURCES.md` | autorité des sources (D50), adaptateurs d'import, règles de lecture, écarts E1–E11 |
| `STATUTS_ET_ETATS.md` | dimensions de statut, correspondance, conflits S1–S6, transitions proposées |
| `STRUCTURE_FICHIER_BRANCHE.md` | onglets, règles d'écriture D51, options A–D, liste IT d'Impact |
| `FIXTURES_EXCEL.md` | jeux fictifs et 7 cas d'erreur |
| `HEBERGEMENT_CONFORME.md` | critères, 8 fournisseurs, recommandation, sources |
| `DOSSIER_PROJET_STACK_ET_LIVRAISON.md` | inventaire, stack, RGPD, risques, traçabilité, recette, livraison |

## 2. Lu / partiellement lu / non lu
| Statut | Éléments |
|---|---|
| Lu en entier | docs 17 et 19 ; `CONTRAT_MODULE.md` (§2 à §6) ; `CADRAGE_CONFORMITE`, `CARTOGRAPHIE_DONNEES` ; brouillon 18 |
| Lu partiellement (extraits) | `AUDIT_SAISIE_ONGLETS_COLONNES`, `AUDIT_DEVIS_LOT0`, `QUESTIONS_OUVERTES`, `CARTOGRAPHIE_APPLICATIVE`, synthèse, note interne |
| Non lu | `MATRICE_BESOIN_PREUVE`, `BOUCLE_METIER_REALISEE`, `HARMONISATION_TBB_4C` (cité via doc 17), dossiers DEVIS_PDF, DIAGRAMMES_COPIL, LIVRABLES_FORMATION, REPORTING |
| Jamais ouverts | **tous les classeurs Excel** (par règle : données réelles) |

## 3. Non exécuté
- Aucune vérification de colonnes sur les fichiers réels (45 colonnes BESOINS, valeurs de listes, écart TBB / 4C).
- Aucune génération de .xlsx (prévue en A2a).
- Hébergeurs : lecture par extraction automatique de pages officielles ; Outscale non consultable ; OVHcloud, Clever Cloud, Hetzner partiellement vérifiés.
- Aucun commit.

## 4. Points à signaler
- OVHcloud : la page SecNumCloud cite « septembre 2026 » pour SNC Cloud Platform ; à recouper sur la liste officielle de l'ANSSI.
- Les valeurs de « Décision » et « Proposition » dans `STATUTS_ET_ETATS.md` sont proposées, non relues dans une source.
- Le glossaire n'a pas été modifié : les conflits de vocabulaire avec doc 17 §5 sont traités dans `STATUTS_ET_ETATS.md`.

## 5. Questions (≤ 8)
1. Hébergement étape B : retenez-vous Scaleway `fr-par` comme cible, ou souhaitez-vous instruire OVHcloud / Clever Cloud ?
2. Autorisez-vous l'ouverture en lecture de `Suivi_Merch_Perm_Saisonnier_2026` pour vérifier les 45 colonnes (sans copier de donnée) ?
3. Valeurs de « Décision » et « Proposition » : validées ou à corriger ?
4. Table des statuts à 9 valeurs : validée ?
5. « Facturé ? » pour Validé avant prise de poste : règle « à partir de la date de prise de poste » acceptée ?
6. Courrier à l'IT d'Impact : l'envoyer maintenant ou après l'étape A ?
7. Référentiel d'accessibilité et niveau de sécurité attendus par Impact ?
8. Signature du dossier : profil FREELANCE ou agence ?

## 6. Mise à jour proposée du registre (non enregistrée)
D114 politique de connecteurs · D115 choix d'hébergement B · D116 référentiels de livraison. Statut D107 / D108 : à valider.

## 7. Suite du 23/10/2026
Réponses reçues : signature FREELANCE ; instruction d'OVHcloud en premier ; statuts à 9 valeurs et règle de facturation validés ; D114 à D116 enregistrées (+ D117) ; dossier `_to_delete` supprimé. Voir `DECISIONS.md` et `HEBERGEMENT_CONFORME.md` §3 bis.
