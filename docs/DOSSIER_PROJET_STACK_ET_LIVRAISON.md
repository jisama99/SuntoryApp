# DOSSIER_PROJET_STACK_ET_LIVRAISON · SUNTORY REFONTE V3 (V0.1 du 23/10/2026)

Client : Suntory uniquement (chaîne Suntory → Impact → prestataire → hébergeur). Auteur : T. SOEFOU, prestataire. **Signature : profil FREELANCE (D49, confirmé D117 le 23/10/2026).** Document de travail, **pas un avis juridique** ni une attestation de conformité.
Légende des statuts : **Réalisé** (produit et lu) · **Cadré** (décrit, non codé) · **Audité** (relu avec constats) · **Non exécuté** (jamais lancé) · **Décision attendue**.
Règle de lecture : rien n'est dit « conforme », « sécurisé » ou « livré » sans la preuve citée en colonne Preuve.

## 1. Où en est le projet (23/10/2026)
| Bloc | Statut | Preuve |
|---|---|---|
| Cadrage métier et fonctionnel (docs 10 à 27) | Cadré | `docs/COMPLEMENTS_CADRAGE/` |
| Lot A0 : inventaire V4, écarts, pile, plan, fixtures, glossaire | **Réalisé** | `docs/INVENTAIRE_V4*.md`, `ECARTS_A0.md`, `PILE_PROPOSEE.md`, `PLAN_A1_A7.md`, `FIXTURES.md`, `GLOSSAIRE.md`, `COMPTE_RENDU_A0.md` |
| Questionnaire A0 → D104 à D113 | **Réalisé** (décidé) | `DECISIONS.md` |
| Lot A0b : cadrage des données Excel | **Réalisé en V0.1** (documents) | `DICTIONNAIRE_DONNEES`, `MAPPING_SOURCES`, `STATUTS_ET_ETATS`, `STRUCTURE_FICHIER_BRANCHE`, `FIXTURES_EXCEL` |
| Hébergement | Cadré ; **choix non fait** | `HEBERGEMENT_CONFORME.md` |
| Code de la plateforme (étape A) | **Non commencé** | aucune ligne de la V3 écrite ; dépôt à un commit initial |
| Modules V4 (M1, M2, M3) | Livrés avec réserve (HTML autonomes, non scellés) | `DEVIS_CONFORMITE/` |
| Étape B (données réelles, base, authentification) | **Interdite** sans feu vert écrit | D104 |

## 2. Inventaire des livrables par phase
| Phase | Livrable | Statut | Preuve / emplacement |
|---|---|---|---|
| Existant V4 | 3 modules HTML (pilotage, besoins, réponse agence) | Réalisé | `06_MODULES_V4/` |
| Existant V4 | Tests : 11 suites de base (612 contrôles) + test sécurité lot 6 (64) | Réalisé, **au vert le 20/10 sous Chrome 155 / macOS 26.6.2** (déclaré dans la note interne) ; recette manuelle « OK » déclarative | `DEVIS_CONFORMITE/NOTE_INTERNE_AVANT_ENVOI.md` |
| Audit devis | Audit lot 0, cartographies applicative et données, cadrage conformité, 24 questions, synthèse 2 pages | Réalisé / Audité | `DEVIS_CONFORMITE/*.md` |
| Audit Excel | Onglets verrouillés, erreurs, listes (14/10) | Audité ; protection levée sur onglets de saisie | `00_PARTAGE/AUDIT_SAISIE_ONGLETS_COLONNES.md` |
| Contrat de lecture | Contrat module V3.12 | Valable pour les adaptateurs d'import (D55) | `00_PARTAGE/CONTRAT_MODULE.md` |
| Cadrage plateforme | Catalogue fonctionnel V0.1, matrice fonctions / événements / rapports / boucles, design UX/UI, identifiants et accès, automatisations, reporting PDF/PPTX, graphiques, échéances, photos terrain | Cadré | docs 10 à 27 |
| A0 | Lecture du code V4 : 19 constats ; 33 écarts E01–E33 | Audité | `INVENTAIRE_V4_CODE.md`, `ECARTS_A0.md` |
| A0b | 5 documents données + hébergement + ce dossier | Réalisé V0.1 | `docs/` |
| Pilotage de projet | Registre D01–D113 (+ D109 bis), prompts Claude Code, agents projet (11) | Réalisé ; **D107, D108 « proposées » ; D114 non enregistrée** | `DECISIONS.md`, `docs/PROMPTS/`, `agents-projet/` |
| Code étape A (A1 à A7) | Plateforme cliquable FR/EN, données fictives, exports | **Cadré, non exécuté** | `PLAN_A1_A7.md` |

## 3. Stack (D105)
| Couche | Choix | Version | Statut |
|---|---|---|---|
| Runtime | Node 22.x | 22.23.4 (poste), npm 10.9.9 | Validé, présent sur le poste |
| Framework | Next.js (App Router, serveur Node : filtrage de profil dans la couche données, pas d'export statique) | 16.4.2 | Validé, **non installé** |
| UI | React · TypeScript strict · Tailwind | 19.3.1 · 6.0.3 (essai 7.0.2 en branche) · 4.3.3 | Validé |
| Validation / i18n | Zod · next-intl (FR/EN) | 4.6.7 · 4.14.9 | Validé |
| Tests | Vitest · Playwright | 5.0.5 · 1.64.1 | Validé |
| Qualité | ESLint (repli ESLint 9) | 10.13.0 | Validé |
| Graphiques | Recharts | 3.10.1 | **À évaluer en A4a** |
| Excel | ExcelJS 4.4.0 ou read-excel-file 9.3.12 | — | **À trancher en A6** |
| Exports | pptxgenjs 4.0.1 + Playwright `page.pdf` | — | A4c1 |
| Accessibilité | axe-core | — | **Non installé** (licence MPL-2.0 à examiner) |
| Icônes | Lucide / Phosphor / Tabler, sans style « IA » | — | À choisir en A1 (D113) |
| Données A → B | interface `Repository` sur fixtures JSON typées → PostgreSQL | — | Cadré |
Les versions viennent des décisions du registre ; **elles n'ont pas été revérifiées sur les registres de paquets dans cette session**.

## 4. Architecture et règles non négociables
- Modules de domaine purs et testés : semaine ISO, doublons D1–D7, règles W1–W22, statuts, droits, import.
- `ZoneLabel` : code toujours accompagné du nom (D106). `AccessContext` : droits appliqués dans la couche données (D107). `audience` des alertes `agency` / `client` / `both`, refus par défaut (D108).
- Journal d'événements (D91), entonnoir à 6 états (D92), photos (D98 à D103).
- Interdits d'étape A : donnée réelle (sauf D109 bis : découpe réelle, accord d'Impact et de la cliente requis avant toute démo cliente), appel réseau sortant (la maquette V4 charge un GeoJSON depuis un CDN : à remplacer), commit sans demande.

## 5. Données personnelles et RGPD
Base : registre simplifié V4 (T1 à T8) de `CARTOGRAPHIE_DONNEES.md`. Pour la plateforme, extension **proposée** :
| N° | Traitement | Statut |
|---|---|---|
| T1–T8 | Pilotage, intervenants, besoins, candidats, magasins, ajustements, connexion, sauvegardes | Projet de registre V4, **non opposable**, rôles non qualifiés |
| T9 | Comptes et authentification de la plateforme | Proposé |
| T10 | Journal d'audit et événements | Proposé |
| T11 | Photos terrain | Proposé (D98–D103) |
| T12 | Alertes et notifications | Proposé |
| T13 | Imports / exports Excel | Proposé |
| T14 | Reporting PDF / PPTX | Proposé |
| Registre, art. 28, AIPD | Hors périmètre technique | **À qualifier avec DPO / Impact / cliente** : rôles, bases légales, durées, droits des personnes, notification de violation (72 h CNIL si risque) |
Réponses déjà données (23/10) : affichage nominatif des DR, CVR, RS autorisé. Questions ouvertes : `DEVIS_CONFORMITE/QUESTIONS_OUVERTES.md` (24).

## 6. Sécurité
| Thème | État | Remarque |
|---|---|---|
| Modules V4 | Auth locale AES-256-GCM, PBKDF2 600 000 itérations (lot 6), **livrés non scellés**, sans 2FA | limites documentées : essai hors ligne, pas de révocation à distance |
| Plateforme | Cadrée : contrôle d'accès en couche données, `.denylist.local` (C3), fixtures fictives | **Aucun test de sécurité exécuté** (pas de code) |
| Backups V4 | PBKDF2 200 000 itérations (M2/M3) vs 600 000 (lot 6) | incohérence à aligner |
| Secrets | `.gitignore` mis à jour ; aucune clé dans le dépôt | contrôle par grep à rejouer avant tout commit |
| Chaîne d'approvisionnement | dépendances à épingler, `npm audit`, licences | **non exécuté** |
| À faire | revue OWASP ASVS niveau à choisir, MFA pour comptes admin, journalisation protégée, test de restauration | Décision attendue |

## 7. Risques
| # | Risque | Gravité | Mesure |
|---|---|---|---|
| R1 | Donnée réelle (découpe, noms) dans le dépôt ou une démo | Haute | D109 bis, denylist C3, accord écrit avant démo |
| R2 | Alertes agence visibles côté cliente | Haute | `audience` deny-by-default, tests par profil |
| R3 | Accord Impact / cliente pour la découpe réelle non obtenu | Haute | blocage de toute démo cliente |
| R4 | Hébergement choisi sans DPA / analyse de transferts | Haute | `HEBERGEMENT_CONFORME.md` §4 |
| R5 | Droits sur logos Suntory / Marvesting, carte, coordonnées | Moyenne | D113 ; licences à vérifier |
| R6 | Versions de pile périmées / inexactes | Moyenne | revérification au démarrage de A1 |
| R7 | Écart Permanent TBB / 4C non réconcilié | Moyenne | D50 ; recalcul sur fichiers réels |
| R8 | Dépendances externes des classeurs sources (liens rompus) | Moyenne | import par adaptateur, zéro lien externe |
| R9 | Écriture Excel branchée (Graph non vérifié) | Moyenne | option D d'abord |
| R10 | Tests V4 faits sous un seul navigateur | Basse | Playwright multi-navigateurs en A7 |

## 8. Traçabilité (exigence → décision → document → test prévu)
| Exigence | Décision | Document | Test prévu |
|---|---|---|---|
| Noms à côté des codes DR/CVR/RS | D106 | GLOSSAIRE, FIXTURES | rendu de chaque vue |
| Pas de message agence côté cliente | D107, D108 | INVENTAIRE_V4_CODE, DICTIONNAIRE | matrice 7 profils × alertes |
| TBB fait foi, 4C pour le détail | D50 | MAPPING_SOURCES | réconciliation sur fixtures |
| Écriture dans l'Excel branché | D51 | STRUCTURE_FICHIER_BRANCHE | conflit de version |
| Statuts séparés, « facturé ? » | D54 | STATUTS_ET_ETATS | table de transitions |
| Pas d'icônes de style IA | D113 | PILE_PROPOSEE §9 | revue visuelle A1 |
| Aperçu intégré pendant le développement | D104 | PLAN_A1_A7 | démo à chaque lot |
| Aucune donnée réelle | D109 bis | FIXTURES | contrôles C1–C8 |

## 9. Recette et critères de fin de lot
Chaque lot A1–A7 : build vert, lint, tests Vitest (domaine), Playwright (parcours), contrôles C1–C8, aperçu validé par T. SOEFOU, compte rendu avec « non exécuté » listé, aucune décision prise par Claude Code. **Définition de fini de l'étape A** : parcours des 7 profils, FR/EN, exports fictifs, zéro appel réseau sortant, zéro donnée réelle, dossier de livraison à jour. Plan détaillé : `PLAN_A1_A7.md`.

## 10. Livraison, transfert, réversibilité
| Élément | État |
|---|---|
| Dépôt, historique, licences des dépendances | Dépôt local, un commit ; avis de licences à produire |
| Documentation d'exploitation (installation, variables, sauvegarde / restauration) | **À écrire** en fin d'étape A, puis B |
| Propriété du code et des données, réutilisation pour d'autres clients | **À fixer au contrat** (Q22) |
| Support, maintenance, correctifs | **Non défini** |
| Réversibilité (export complet, destruction) | À prévoir au contrat d'hébergement |
| Recette client et procès-verbal | À organiser avec Impact |

## 11. Normes de livraison : grille de référence
Pratiques courantes, **non confirmées contractuellement** : à demander à Impact quel référentiel s'applique.
| Domaine | Référence usuelle | Où c'est traité |
|---|---|---|
| Protection des données | RGPD (art. 25 conception, 28 sous-traitance, 30 registre, 32 sécurité, 35 AIPD) ; guides CNIL | §5, `DEVIS_CONFORMITE/CADRAGE_CONFORMITE.md` |
| Sécurité applicative | OWASP ASVS / Top 10 | §6, **niveau à choisir** |
| Sécurité de l'information | ISO/IEC 27001 (cadre) ; hébergeur certifié | `HEBERGEMENT_CONFORME.md` |
| Accessibilité | WCAG 2.x / RGAA : référentiel exigé **à confirmer** | axe-core non installé |
| Qualité logicielle | tests automatisés, revue, versionnage sémantique | §9 |
| Exploitation | sauvegarde 3-2-1 testée, journalisation, supervision | §10, non fait |
| Gestion de projet | registre de décisions, traçabilité, recette signée | §8, §9 |

## 12. Non exécuté / décisions attendues
- Non exécuté : toute ligne de code V3 ; `npm audit` ; contrôle de licences ; revérification des versions ; test Chrome sur Mac des modules V4 hors suites déclarées ; relecture des commentaires libres ; ouverture des classeurs Excel pour l'A0b ; lecture complète du DPA OVHcloud (127 028 caractères, 100 000 lus).
- Décisions attendues : valider D107, D108 ; choisir l'hébergement B après instruction d'OVHcloud (D115) ; accord Impact / cliente sur la découpe réelle ; référentiels d'accessibilité et de sécurité (D116) ; qualifier les rôles RGPD.

## 13. Registre : décisions enregistrées le 23/10/2026
D54 (9 statuts et règle de facturation), D114 (connecteurs), D115 (instruire OVHcloud d'abord, rien de retenu), D116 (référentiels de livraison à fixer avec Impact), D117 (signature FREELANCE). Détail : `DECISIONS.md`.
