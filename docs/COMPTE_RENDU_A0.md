# Compte rendu du lot A0

Date : 23/10/2026 · Lot : A0 (lecture, état réel, pile, glossaire, fixtures, plan) · Aucun code applicatif, aucune installation, aucun commit, aucun push.

## 1. Livrables (tous dans `docs/`)

| Document | Contenu |
|---|---|
| `INVENTAIRE_V4.md` | Modules M1/M2/M3/Comptes, niveau de lecture, règles réutilisables, tests listés |
| `ECARTS_A0.md` | 28 écarts, dont 7 de gravité haute (E01, E02, E04, E05, E11, E19, E25 ; E01 et E11 surtout pour l'étape B) |
| `PILE_PROPOSEE.md` | Versions vérifiées, étape A vers B, workflow d'aperçu, outils à brancher, commandes proposées |
| `GLOSSAIRE.md` | Libellés cibles FR/EN, états de l'entonnoir, pièges de vocabulaire |
| `FIXTURES.md` | Plan de génération, codes fictifs, contrôles C1 à C8 |
| `PLAN_A1_A7.md` | Dépendances, scissions proposées, blocages, points de contrôle d'aperçu |

## 2. Sources : lues, partielles, non lues

| Source | Niveau |
|---|---|
| `CLAUDE.md`, `docs/DECISIONS.md` (D01–D103), `03_LOTS_DEV.md`, prompt du lot A0 | Lus |
| `ORIENTATION APPLICATION METIER` (3 fichiers) | Lus (fichier 03 tronqué à 900 caractères par ligne pour la lecture) |
| `DESIGN SYSTEM/design_system_suntory.md` | Lu |
| `04_JEUX_ESSAI_ET_RECETTE.md`, `02_PROMPT_MAITRE_DEV.md` | Lus |
| Présentation V0.4 (blocs de données C.*) | **Partiellement lue** : lignes non lues = fin de C.PROBS, milieu de C.AUDIT, fin de C.PISTES |
| `Workshop 2027.pdf` | Lu en texte (360 lignes extraites) ; **images et schémas non examinés** |
| `maquette_premium_V4.html` | **Non lue** (titre seulement) |
| `PROMPTS_AJUSTEMENTS_V4` : lisez-moi, rapport d'ajustements (60 premières lignes) | Lus partiellement ; comptes rendus des lots 1 à 6 **non lus** |
| `DEVIS_CONFORMITE` : `QUESTIONS_OUVERTES.md` | Lu ; `CADRAGE_CONFORMITE.md`, `CARTOGRAPHIE_DONNEES.md` **non lus** |
| `00_PARTAGE/CONTRAT_MODULE.md` | En-tête et début lus seulement |
| `06_MODULES_V4` (M1, M2, M3, SECURITE, 00_BASELINE, 00_REF_GEO) | **Structure et tailles seulement** : aucun code lu, aucun HTML ouvert |
| Classeurs de `01_SOURCE_SAISONNIER`, `02_SAISIE_PARTAGEE`, `04_TBB_SBFF` | **Volontairement non ouverts** (consigne) |
| `03_PILOTAGE_4C` | Vide (seul `.DS_Store`), signalé |

## 3. Vérifications exécutées / non exécutées

| Vérification | Statut |
|---|---|
| Versions et licences des paquets (registre npm) | **Exécutée** le 23/10 : voir PILE_PROPOSEE.md §2 |
| Compatibilité croisée des paquets (TypeScript 7, ESLint 10 avec la config Next) | **Non exécutée** (aucune installation) |
| Calendrier ISO (2026 : 53 semaines ; 2027 : 52 ; 28/12/2026 = lundi S53 ; 04/01/2027 = lundi S01 ; 10/11/2026 = S46) | **Exécutée** (Python, bibliothèque standard) |
| Suites de tests des modules V4 | **Non exécutées** ; scores du 19/10 non repris comme preuve |
| `run_baseline.js` (non-régression de calcul) | **Non exécuté** |
| Contrôles C1 à C8 (absence de donnée réelle) | **Non exécutés** : le dépôt ne contient encore ni code ni fixtures |
| Licences des dépendances transitives | **Non auditées** |
| Aperçu visuel (captures) | **Non applicable** à A0 (aucun écran) |

## 4. Écarts majeurs à retenir

1. **E05** : date cible du 10/11 sans lien démontré avec le volume de lots (13 lots, 15 avec scissions).
2. **E04** : la V0.4 ne présente pas reporting, boucles, photos : la cliente n'a pas vu ce périmètre.
3. **E19 / E25** : risque de donnée réelle (JavaScript non bloqué par `.gitignore` ; codes DR réels proposés comme fixtures).
4. **E01 / E02** : la V0.4 décrit une identité et une saisie terrain remplacées par D33 et D42.

## 5. Questions pour T. SOEFOU (10 maximum, par priorité)

| # | Question | Recommandation |
|---|---|---|
| 1 | Valider la pile de l'étape A (Next 16.4.2, React 19.3.1, TypeScript **6.0.3**, Tailwind 4.3.3, Vitest 5.0.5, Playwright 1.64.1, Zod 4.6.7, next-intl 4.14.9) ? | Oui ; essai de TypeScript 7 en branche à part |
| 2 | Périmètre du démonstrateur au 10/11 : noyau ou périmètre complet ? | Noyau (A1, A2, A3, A4a, A5, A6) puis seconde démonstration ; sinon nouvelle date via D26 |
| 3 | Adopter le workflow d'aperçu (D104 proposée) avec navigateur intégré + Playwright par défaut ? | Oui |
| 4 | Démonstrateur : local seulement ou lien partageable ? | Local jusqu'à la décision d'hébergement (D02/D19) ; aucun lien externe avant |
| 5 | Mettre à jour `.gitignore` (E19) et corriger `04_JEUX_ESSAI` (E25, E26, E27) avant A1 ? | Oui, avant A1 |
| 6 | Lancer A0b avant A1 ou avant A2 ? | Avant A2 : A1 n'en dépend pas |
| 7 | Scinder A2 en A2a / A2b et A3 en A3a / A3b ? | A2 oui ; A3 seulement si la première session dépasse le volume |
| 8 | Fond de carte du démonstrateur (D25 ouvert) ? | Fond neutre schématique, sans source soumise à licence |
| 9 | Logos et photo de couverture : placeholders jusqu'à levée de D25 / D75 ? | Oui |
| 10 | Libellés complets de DR, CVR, RS, DNV en FR/EN, format de date EN ? | À demander à la cliente ; sigles et ISO en attendant |

## 6. Mises à jour proposées (aucune appliquée)

| Cible | Proposition |
|---|---|
| `docs/DECISIONS.md` (et copie `01_REGISTRE_DECISIONS.md`) | **D104** Aperçu visuel à chaque étape (navigateur intégré, captures par profil, langue, largeur, console et réseau) ; **D105** Pile de l'étape A, sous réserve des réponses 1 et 4 |
| `CLAUDE.md` | Section « Aperçu » et section « Commandes » (PILE_PROPOSEE.md §5 et §7) ; ajouter l'interdiction de lire `data_real*`, `ref_reel*`, `ref_magasins*`, `communes_*` |
| `.gitignore` | Motifs `data_real*`, `ref_reel*`, `ref_magasins*`, `communes_*`, `*_pack.js`, `*.sqlite`, `*.db` |
| `04_JEUX_ESSAI_ET_RECETTE.md` | Codes fictifs, profils, source V0.4 |
| Présentation V0.4 | Corriger E01, E02, E08 avant diffusion |
| `03_LOTS_DEV.md` | Scissions A2a/A2b, A0b avant A2 |

Ces propositions attendent votre validation ; la mention « enregistré » n'apparaîtra qu'après confirmation.

## 7. Limites de ce compte rendu
- La qualité de l'inventaire des modules est celle de la présentation V0.4 : le code n'a pas été lu.
- Les libellés EN du glossaire sont des propositions.
- Les versions du registre npm reflètent la date de consultation ; leur compatibilité mutuelle n'est pas prouvée.

## 8. Complément du 23/10 : lecture ciblée du code des modules V4

Voir `INVENTAIRE_V4_CODE.md` (19 constats, tableau garder / améliorer / abandonner, 3 règles proposées). Ce complément remplace la ligne « code non lu » du §2 par : moteurs M2 lu en entier, M1 et M3 lus en partie, rendus d'écran non lus. Incident : deux commandes ont affiché quelques centaines de caractères de fichiers de données réelles ; rien n'a été copié ni conservé dans le dépôt.
Constats principaux : le « mode Cliente » est un bouton (aucune protection réelle), les alertes n'ont pas d'audience, les noms affichés à côté des codes sont des noms de personnes, la carte de la maquette premium V4 charge ses contours depuis un CDN externe.
Les questions 1 à 11 restent à valider ; la question 12 est validée (« go »).

## 9. Réponses au questionnaire du 23/10/2026 (registre D104 à D113)

| Question | Réponse de T. SOEFOU | Suite donnée |
|---|---|---|
| Q1 Pile | Oui, TypeScript 6.0.3 | D105 validée |
| Q2 Périmètre du 10/11 | Noyau puis seconde démonstration | D110 validée |
| Q3-Q4 Aperçu et diffusion | Aperçu intégré + démonstration en local | D104 validée |
| Q5 Garde-fous avant A1 | Oui | D111 validée ; correctifs `.gitignore` et fichier 04 à préparer |
| Q6-Q7 Lots | A0b avant A2, A2 scindé | D112 validée ; `03_LOTS_DEV.md` mis à jour dans les deux dépôts |
| Q8 Noms | Libellé de zone **et** nom de la personne : « pas de souci » | D106 décidée ; réserve proposée pour les noms réels (DPO) |
| Q9 Personnalisation | Aucune préférence | D107 **proposée** (recommandation appliquée) |
| Q10 Alertes agence | Aucune préférence | D108 **proposée** : les quatre catégories restent réservées à l'agence |
| Q11 Cartographie | Utiliser aussi la découpe réelle | D109 décidée ; **contradiction avec la règle « aucune donnée réelle »** (écart E32), conditions D109 bis proposées |
| Q12 Visuels | « 3 » : tous les logos fournis ; pas d'icônes de style IA, icônes naturelles pour les menus | D113 décidée ; droits non levés, risque noté |

Deux réponses demandent votre attention :
- **D109 :** utiliser la découpe réelle déroge à CLAUDE.md. J'ai inscrit une dérogation avec conditions (fichier hors Git, jamais dans les prompts, journaux, captures ni fixtures, démonstration sur votre poste). **Elle n'est effective qu'après votre confirmation des conditions D109 bis** et l'accord d'Impact et de la cliente pour l'usage de la découpe.
- **D113 :** le registre D31 conditionnait l'intégration des logos à la levée des droits (D25). Vous avez choisi de les utiliser quand même ; le risque est porté par le prestataire et la mention figure au registre.

Mises à jour proposées, non appliquées : `CLAUDE.md` (dérogation D109, section Aperçu, section Commandes, règle d'icônes), `.gitignore`, `04_JEUX_ESSAI_ET_RECETTE.md`.

## 10. Correctifs appliqués le 23/10/2026 (D111) et confirmation de D109 bis

| Fichier | Modification | Copies |
|---|---|---|
| `.gitignore` | Ajout `data_real*`, `ref_reel*`, `ref_magasins*`, `communes_*`, `*_pack.js`, `*.sqlite`, `*.db`, `.denylist.local`, `data-local/` | Dépôt 08 |
| `04_JEUX_ESSAI_ET_RECETTE.md` | Codes DR fictifs, profil Intervenant remplacé, source V0.4, contrôles C1 à C8 | 07 et 08 (identiques) |
| `CLAUDE.md` | Exception D109 / D109 bis, pile validée D105, périmètre D110, sections Aperçu, Zones / personnalisation / alertes / icônes, commandes proposées | 07 et 08 (identiques) |
| Registre | D109 bis passée à « Validée par T. SOEFOU le 23/10/2026 » | 07 et 08 (identiques) |

Reste ouvert : accord d'Impact et de la cliente pour l'usage de la découpe (avant toute démonstration à la cliente) ; D107 et D108 restent « proposées » ; aucun commit effectué.
