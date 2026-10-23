# Compte rendu des reprises de la revue A3 (D197 à D211)

Date : 23/10/2026. Données fictives uniquement. Départ : `main` à `0a9e262` (fusion A3), branche de session remise à niveau par avance rapide (aucune poussée forcée). `docs/DECISIONS.md` n'est pas modifié : les propositions sont au §6.

## 1. Réalisé (test d'abord : 17 tests rouges, puis verts)
| # | Reprise | Correction minimale | Preuve |
|---|---|---|---|
| 1 | « Recrutement finalisé » restait affiché après un accord invalidé (EV-12) | `funnelState` exige l'accord en vigueur pour « Recrutement finalisé » ; sans accord, retour à « Proposé » (ou « En recrutement » si la proposition est retirée). La date de recrutement et la décision invalidée restent au dossier ; un nouvel accord rétablit l'état. « En poste » (date de prise de poste atteinte) ne dépend pas de l'accord : le poste est occupé. `nextStep` suit : la cliente redécide. Le panneau d'étapes écrit « Enregistré. En attente d'un nouvel accord » | `pipeline.test.ts` (5), `a3-repository.test.ts` « 1 » et « 1 bis » |
| 2 | Le besoin stoppé était exclu des taux avec ses heures effectuées (D211) | Un besoin stoppé **après sa prise de poste** garde ses heures au dénominateur et au numérateur (`performedBeforeStop`), reste sur sa ligne « Stoppés » avec le total des heures effectuées, et sort du stock par état. Stoppé avant démarrage : exclu. Rejeté : jamais compté | `pipeline.test.ts` (3), `a3-repository.test.ts` « 2 » (besoin démarré puis stoppé, besoin stoppé avant démarrage) |
| 3 | Situations « même jour » de D210 non codées | `startLagKind`, `startLagSample`, `startLagStats` : écart entre la date d'acceptation (décision en vigueur) et la prise de poste atteinte, par situation : « même jour » (même jour calendaire, dates au fuseau de Paris), « plus tard dans la journée », « jour ouvré suivant ou plus ». Aucun seuil. Section « Acceptation et poste démarré » de l'entonnoir | `pipeline.test.ts` (5), `a3-repository.test.ts` « 3 », e2e `funnel-lags` |
| 4 | La carte « Exécution » affichait le statut de poste | Nouveau statut d'exécution (non démarrée, prise de poste planifiée, en poste, terminée) dans la carte ; le statut de poste calculé est affiché sur sa propre ligne | `pipeline.test.ts` (2), `a3-repository.test.ts` « 4 », e2e « carte Exécution » |

**Limite de la reprise 3, à trancher** : « plus tard dans la journée » exige l'heure de l'acceptation et de la prise de poste ; le démonstrateur n'enregistre que des dates (horloge de démonstration, sélecteur de date, règle 12). La catégorie existe et se calcule (testée avec des heures), mais reste vide à l'écran : « Donnée indisponible : l'heure n'est pas enregistrée ». Je n'ai pas inventé de champ d'heure ni de seuil. Une prise de poste un jour non ouvré postérieur à l'acceptation n'a pas de catégorie propre : rangée dans « jour ouvré suivant ou plus » (hypothèse).

## 2. Hygiène : test C7 de `guards.test.ts`
Cause **non établie** : le test dure 20 à 80 ms (git lit 79 commits en 25 ms) et n'a pas échoué sous trois suites lancées en parallèle sur 4 cœurs. L'échec observé (5,9 s) dépasse le délai par défaut de 5 s ; hypothèse : tâche de fond de Git après une récupération. Correction : délai de 30 s sur les deux tests Git (C5 index, C7 historique), processus Git limité à 25 s ; **un dépassement de délai échoue désormais le test** au lieu d'être pris pour une absence de dépôt (l'ancien code renvoyait `null` et le test passait en silence). Le délai absorbe une lenteur ponctuelle sans masquer un blocage.
Autres tests instables : un seul trouvé et déjà traité en revue (annulation e2e sur serveur partagé, désormais isolée). Trois exécutions complètes de la suite unitaire en parallèle, deux exécutions complètes de l'e2e : mêmes résultats (110 sur 110).

## 3. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 0 avertissement |
| `npx vitest run` | **30 fichiers, 672 tests passés, 1 ignoré (C3)**. C3 : `.denylist.local` absent, **non exécuté** |
| `npm run build` | réussi |
| `npx playwright test` | **110 sur 110** trois fois de suite (deux avant, une après la dernière retouche d'écran) |
| captures A3 (`tests/shots/a3.spec.ts`) | 7 tests passés, 40 images régénérées |

## 4. Captures de `docs/captures/A3/`
Les 40 images ont été ouvertes dans cette session (planches : 1440 px à 67 %, 390 px en trois colonnes de 1800 px), puis régénérées après deux retouches mineures d'écran (voir ci-dessous). Vues et sans défaut bloquant : liste (agence, CVR, RS ; FR, EN ; 1440, 390 ; sombre), fil du besoin (CVR, agence ; refus, remplacement ; FR, EN ; 1440, 390), entonnoir (FR, EN ; 1440, 390), alertes (FR, EN ; 1440, 390), parcours de décision (FR 1440, EN 390). **Non vues : la queue vide de `thread_refusal_agency_en_1440` (planche 2, page blanche en bas d'image) et la planche 2 de `thread_replacement_agency_fr_1440` relue seulement pour son journal.** Limites : à 390 px les planches réduisent le texte, la lecture porte sur la mise en page, les débordements et le mélange de langues, pas sur chaque mot.
Constats : (a) à 390 px, « MAG-DEMO-003 » se coupait en fin de ligne dans la liste des magasins : corrigé (tiret insécable). (b) la carte « Recrutement » écrivait « Hors entonnoir » pour un besoin simplement à qualifier : corrigé (affiche la qualification). Défauts connus hors lot, inchangés : tableau de la liste coupé par sa hauteur maximale (A2b) ; menu latéral collant visible au milieu des captures plein écran ; motifs de décision et notes saisis en français dans des pages anglaises (données de démonstration).

## 5. Écarts et questions
- Reprise 1 : « En poste » reste affiché si l'accord est invalidé après la prise de poste (le poste est occupé) ; l'étiquette « le besoin a changé depuis la proposition » le signale. À confirmer.
- Reprise 3 : heure de l'acceptation et de la prise de poste (saisie ? horodatage automatique ?) : à décider avant que « plus tard dans la journée » ne se remplisse.
- Libellés d'exécution (« Non démarrée », « Prise de poste planifiée », « En poste », « Terminée ») hors glossaire : à valider.

## 6. Mise à jour du registre proposée (non inscrite)
| N° proposé | Sujet | Contenu |
|---|---|---|
| D212 | État finalisé et accord | « Recrutement finalisé » exige l'accord en vigueur ; accord invalidé : retour à « Proposé », rien d'effacé ; « En poste » indépendant de l'accord. Précise D198 |
| D213 | Besoin stoppé et taux | Mise en œuvre de D211 : heures effectuées avant l'arrêt comptées (besoin stoppé après sa prise de poste), stoppé avant démarrage exclu, rejeté jamais compté |
| D214 | Écart acceptation et poste démarré | Mise en œuvre de D210 en dates ; « plus tard dans la journée » vide tant que l'heure n'est pas enregistrée ; prise de poste un jour non ouvré rangée avec « jour ouvré suivant ou plus » |
| D215 | Statut d'exécution | Quatre valeurs, distinctes du statut de poste calculé ; libellés à ajouter au glossaire |
