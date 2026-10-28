# Revue du lot A4b1 : enveloppe cliente, allocation de l'agence, prévisionnel par besoin

Revue indépendante du 28/10/2026 (D191), branche `revue/A4b1` créée depuis `origin/claude/gifted-cannon-rhzvmd` (68b16c6), qui contient `origin/main` (10ae79b). Données fictives uniquement ; aucune requête externe, aucun fichier de données réelles lu, Supabase et Vercel non utilisés.

**C3 : non exécuté** (hors session : `.denylist.local` absent). À lancer sur le poste de T. SOEFOU avant fusion.

## 1. Verdict provisoire
**Fusionnable**, sous réserve de la validation de T. SOEFOU (étape 8) : aucun bloquant, trois défauts mineurs corrigés, contrôles verts, C3 à lancer sur le poste.

## 2. Conformité aux critères du prompt A4b1
| Critère | Preuve |
|---|---|
| 1. Commandes de contrôle, sortie reportée | §4 |
| 2. Total réparti borné par l'enveloppe | `a4b1-repository.test.ts` (au centime, 18 lignes inchangées après refus) et `a4b1-revue.test.ts` : propriété sur 300 écritures aléatoires (allocations et versions), `allocated_cents <= enveloppe` et `unallocated >= 0` à chaque pas |
| 2. L'agence ne modifie pas l'enveloppe | `setEnvelope` refusé `forbidden` pour les six autres profils (test) ; e2e : écran en lecture seule pour l'agence et le prestataire, aucun formulaire |
| 2. Au-delà du disponible : alerte, jamais de blocage | test unitaire (besoin enregistré, EV-28, alerte `both`) et e2e (saisie réelle par l'écran, besoin enregistré, alerte côté direction et côté agence) |
| 2. Prévisionnel devenu consommé au pourvoi | test unitaire : `recordStep start_work` fait passer 327,60 euros du prévisionnel au consommé, atterrissage et disponible inchangés |
| 2. Tout est tracé | EV-50, EV-51, EV-28, EV-52 testés (audience, date, motif, ancien et nouveau montant) ; écran Journal |
| 3. Audience : aucun coût ni alerte d'agence côté cliente, CVR, DR | §3 (test profil par profil ajouté en revue) |
| 4. Captures, C1 à C7, compte rendu, mise à jour proposée | 66 captures (relues, §5), tests C1, C2, C4 à C7 verts, `COMPTE_RENDU_A4B1.md`, D244 à D249 proposées non inscrites |
| 5. Design et navigation (règles 14 à 16) | §6 |
| 6. Aucun commit sur main, aucune pull request | respecté (branche de session puis branche de revue) |

## 3. Points demandés en plus
| Point | Résultat | Preuve |
|---|---|---|
| Aucun coût côté cliente (écran, données, journaux, événements) | **Conforme** | `a4b1-revue.test.ts` : pour direction, DR, CVR et RS, toutes les lectures (budget, besoins, tarifs, alertes, événements budgétaires, enveloppes, journal général, pipeline, dossier d'un besoin dépassant) sont sérialisées ; aucune clé de coût (`cost`, `rate`, `consumed`, `forecast`, `landing`, `available`, `from_eur`, `to_eur`, `weeks`), aucune valeur de tarif (2340, 2510, 2780, 2470, `hourly_rate_eur_ht`), `cost_status` nul. Contrôle négatif : le même détecteur trouve bien ces clés côté agence. Journal de la cliente : seulement EV-28 (sans montant) et EV-51 (allocation) ; jamais EV-50 ni EV-52 |
| CVR et RS ne lisent pas le budget | **Conforme** | budget vide, alertes vides, journal budgétaire vide, `getEvents` et dossier sans EV-28 ; 404 de `/fr/budget` (e2e) |
| Seule la direction cliente saisit l'enveloppe ; version sous le total refusée | **Conforme** | tests (sept profils, `below_allocated` au centime) ; fuzz de 300 écritures |
| Aucun coût inconnu à 0 | **Conforme** | tests domaine : « non chiffré » `null` avec raison, tarif daté sans repli, ensemble vide = 0 seulement, maille sans ligne « Budget non renseigné » ; e2e : aucune valeur « 0,00 » affichée à la place d'un inconnu |
| Modification des tests A3c | **Garantie d'origine conservée** | l'ancien test prouvait « sans règle, non évalué » ; ce cas reste prouvé (BES-DEMO-028, maille sans ligne, et `envelopeStatusOf` en domaine ; `NO_ENVELOPE_RULE` reste testé dans `validation.test.ts`). Restent intacts : l'escalade manuelle exige un motif, l'évaluateur posé remplace la règle, et le retour à la règle par défaut. Ajouts : `exceeded` pour BES-DEMO-011, `within` pour BES-DEMO-032. Seule l'attente de la valeur par défaut change, comme annoncé. Texte « règle non arrêtée » devenu inexact : corrigé (§7) |
| Concurrence (S4) sur une même maille | **Conforme dans les limites de l'étape A** | trois tests : deux soumissions simultanées (`Promise.all`) sur CMP-DEMO-04 x CVR-ZV01, somme des coûts exactement avant + 2 x 247 euros (rien perdu, rien doublé), un seul besoin « au-delà » (le dernier dans l'ordre), un seul EV-28 par besoin ; deux soumissions qui dépassent toutes deux : une trace chacune ; allocation et saisie simultanées : total borné. Le cumul est recalculé depuis les données à chaque lecture (jamais incrémenté), donc aucune perte. Limite : un seul processus, aucun verrou testé ; la concurrence réelle se mesure à l'étape B |
| Séries 3 et 4 non employées | **Conforme** | test ajouté : aucun fichier de `src` (hors `chart-tokens.css`) ne contient `chart-3` ni `chart-4` ; barres en séries 1, 2, 5, 6 |
| Captures relues, bas de pages, FR et EN, 390 et 1440 | §5 | |
| C3 | non exécuté, hors session | |

## 4. Contrôles exécutés (sortie réelle, sur `revue/A4b1`)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint .` | 0 erreur, 0 avertissement |
| `npx vitest run` | **41 fichiers, 925 tests passés**, 1 ignoré (C3), 2 « todo » |
| `npm run build` | réussi (exit 0) |
| `npx playwright test` (Chromium préinstallé, `PW_CHROMIUM_PATH`) | **146 passés sur 146** (serveurs de test arrêtés par Playwright en fin de série) |
| Performance H3 (e2e `a4b1`) | budget : 363 à 499 ms (seuil 2 s) ; saisie réactive 4,8 à 12,5 ms (seuil 100 ms) ; changement d'onglet 127 à 467 ms |
| Captures `tests/shots/a4b1-isolated.spec.ts` | 1 passé, 66 images, console et requêtes externes vides |
| Simulation de charge S1 à S5 (§4 bis) | **non exécutée** : le lot n'introduit ni import, ni saisie groupée, ni validation groupée ; le volet concurrence demandé est couvert au §3 |
| Serveur `next dev` demandé en suivi direct | lancé au départ puis arrêté par PID avant le build : `next dev` et `next build` écrivent le même dossier `.next`. Adresse dans le conteneur : `http://localhost:3100/fr` ; ouverture sur un poste impossible depuis un conteneur cloud |

## 5. Captures
Les 66 images ont été régénérées après correction (A4b1 sur `revue/A4b1`). **Vues** : 1440 px, 25 sur 33 (situation direction FR et EN, DR, agence FR, EN, par CVR, clair et sombre ; répartition FR, EN, sombre, refus, après ajout, prestataire ; enveloppe direction (trois états) et agence ; journal agence et direction après dépassement ; prévisionnel FR, EN, au-delà, après dépassement ; alertes agence et direction). 390 px, **27 sur 33, en haut et en bas de page (1 300 px chacun) : le milieu des pages longues n'a pas été regardé**. **Non vues** : 1440 px, situation direction en sombre, journal agence EN, journal agence et direction avant dépassement, alertes agence EN et après dépassement, répartition après ajout après régénération (vue avant régénération), 390 px, situation direction sombre, répartition prestataire sombre, quelques doublons clair des mêmes écrans.
Défauts : (1) colonne « Situation » du prévisionnel tronquée à 1440 px, corrigé ; (2) capture du refus de dépassement prise après rechargement, donc sans le message : corrigé ; (3) tableaux plafonnés à 70 vh dans la page pleine (comportement existant de `DataTable`, la fin de liste n'est pas dans la capture) ; (4) barre d'onglets mobile superposée au contenu sur les captures pleine page (effet de capture déjà connu, A3 et A3d). Aucun mélange de langues, aucun débordement horizontal à 390 px, bandeau « DONNÉES FICTIVES » présent partout.

## 6. Règles communes
| Règle | Vérification |
|---|---|
| 10 réseau | e2e `watch` : requêtes externes vides sur toutes les captures et parcours ; aucune dépendance ajoutée |
| 12 dates | période de l'enveloppe par `DateRangePicker` ; test d'architecture des dates vert |
| 13 jours de semaine | non concernée |
| 14 navigation | regroupement, tri et filtre dans l'URL (e2e : lien profond, retour arrière, rechargement, valeurs inconnues ignorées) ; 404 avant affichage progressif pour les sections interdites (layout au-dessus du `loading.tsx`, vérifié) ; états chargement, vide et erreur ; lien d'évitement et fil d'Ariane existants |
| 15 anglais | `i18n.test.ts` vert, test ajouté sur toutes les valeurs affichées du budget ; e2e anglais ; formats de montant et de date selon la langue |
| 16 jetons et micro-interactions | `design-tokens`, `style-rules`, `contrast`, `motion-mobile-rules`, `chart-tokens` verts ; cibles de 44 px et 390 px sans défilement horizontal (e2e) ; confirmation annulable testée (e2e) |
| Références internes dans les textes (D182) | aucune référence D, EV ou F dans les textes du budget (contrôle par script sur les deux langues) |

## 7. Constats et corrections
| # | Gravité | Constat | Suite |
|---|---|---|---|
| 1 | mineur | Texte du statut « non évalué » du panneau de validation : « la règle de calcul n'est pas encore arrêtée », inexact depuis le branchement | **corrigé** (FR et EN), commit 3a9dcd5 |
| 2 | mineur | Colonne « Dispositif » redondante du prévisionnel : pastille de situation tronquée à 1440 px | **corrigé** |
| 3 | mineur | Capture du refus sans le message de refus (rechargement avant capture) | **corrigé** (capture sans rechargement) |
| 4 | mineur | Tests manquants : audience profil par profil de toutes les lectures, concurrence sur une maille, propriété de la borne, séries 3 et 4 sur tout `src` | **ajoutés** (`a4b1-revue.test.ts`, 12 tests) |
| 5 | mineur, non corrigé | `NO_ENVELOPE_RULE` n'est plus utilisé dans `src` (seulement testé) | à garder ou supprimer au choix de T. SOEFOU |
| 6 | question | Au niveau regroupement par CVR, un besoin dont la maille n'a pas de ligne compte dans le disponible du CVR : « Dépassement » affiché pour Sud-Test 1 alors que ses lignes sont « Dans le budget ». Cohérent avec l'alerte « budget non renseigné », mais peut surprendre | à trancher (question 3 du questionnaire) |
| 7 | question | Le CVR voit « hors enveloppe » (statut, sans montant) dans le panneau de validation, sans autre accès au budget | hypothèse de l'auteur, à trancher |
| 8 | information | Les chiffres du compte rendu de l'auteur sont exacts (913 tests, 146 e2e) à son dernier commit ; 925 tests après la revue | |

## 8. Écarts restants
Série 3 (2,06:1) et série 4 (2,997:1) du jeu B sous 3:1 sur fond blanc (non employées) ; arbitrage d'un dépassement renvoyé à A4b2 ; accès du DR et du CVR au mode présentation non décidé ; simulation de charge S1 à S5 non exécutée (hors périmètre du lot) ; C3 non exécuté ; navigateurs autres que Chromium et appareils réels non testés (N10).
