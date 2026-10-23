# Compte rendu du lot A2a : règles pures, journal d'événements, saisie unitaire et duplication

Date : 23/10/2026. Aucun commit, aucun push. Données exclusivement fictives (`is_demo = true`).

## 0. Préparation du poste (autorisée en tête de session)
| Action | Résultat |
|---|---|
| `*.tsbuildinfo` ajouté à `.gitignore` | Fait |
| `pretest:e2e` et `prepreview:shots` (`npm run build`) dans `package.json` | Fait. `npm run test:e2e` construit désormais avant de tester |
| `__dirname` remplacé par `import.meta.dirname` dans `vitest.config.mts` | Fait, l'avertissement Vite a disparu |
| `npm audit --omit=dev` (lecture seule) | `found 0 vulnerabilities`. Aucun `audit fix` lancé. Les 5 alertes « high » vues à l'installation concernent des dépendances de développement |
| Écart ESLint 10 / `eslint-config-next` | `eslint-config-next@16.4.2` et ses plugins (`eslint-plugin-react`, `jsx-a11y`) déclarent ESLint 9 au plus en pair. `npm install` affiche des avertissements ERESOLVE, npm retient ESLint 10.13.0. `npm run lint` passe (0 erreur, 0 avertissement). Risque : un plugin qui lirait une API retirée d'ESLint 10. À surveiller, repli ESLint 9 possible |

## 1. Réalisé
| Bloc | Résultat |
|---|---|
| Semaine ISO (`src/domain/week.ts`) | Module pur : date vers semaine, S53, bascule d'année, lundi et dimanche d'une semaine, semaines couvertes par une période, normalisation de saisie (W13), numéro de tableur (W2), lecture stricte d'une date reçue en texte (W14, W15). 2026 : 53 semaines, 2027 : 52 |
| Jours fériés (`src/domain/holidays.ts`) | Module pur, onze fériés légaux français, Pâques calculé |
| Règles W1 à W21, B1, J1 à J3 (`week-rules.ts`) | Une fonction par règle, un tableau de cas par règle (au moins un cas qui déclenche et un qui ne déclenche pas, vérifié par test) |
| W22 et D1 à D7 (`duplicates.ts`) | Comparaison avec les besoins existants du périmètre complet. Lien vers le besoin existant |
| Gravités paramétrables (`rules.ts`) | V0.4 pour W, D22 / Q7 pour D. Chaque règle peut être rétrogradée ou désactivée (`off`) sans toucher au code |
| Politique d'enregistrement (`need-check.ts`) | Bloquant : refus (sauf W9 : brouillon). Alerte : confirmation explicite. Besoin incomplet : brouillon exclu des totaux. Complet : soumis |
| Journal d'événements (D91) | EV-01, EV-02, EV-03 (fusion), EV-05 (anomalie, audience agence). `audience` obligatoire dans le schéma Zod, filtrage par audience et par périmètre dans `getEvents` |
| Repository | `getNeeds`, `getNeed`, `getNeedTotals`, `getStores`, `getCampaigns`, `getWeekClosures`, `getEvents`, `canWriteNeeds`, `saveNeed`, `duplicateNeed`, tous avec `AccessContext`. État modifiable conservé sur `globalThis` |
| Composants communs (D132, D133) | `DatePicker`, `DateRangePicker`, `WeekPicker`, `WeekdayPicker`, calendrier commun : lundi en premier, numéro de semaine ISO, jour courant de l'horloge de démonstration, jours désactivés avec raison écrite, fériés signalés par une lettre et un texte, clavier (flèches, Début, Fin, Page précédente et suivante, Échap), cibles de 44 px, mode sombre, FR et EN |
| Écrans | `/needs` (liste, totaux, brouillons à part), `/needs/new` (saisie unitaire), `/needs/[id]/edit` (compléter un brouillon), `/needs/[id]/duplicate` (duplication avec décalage). Constats avec gravité en forme et en texte, correction de semaine en un clic, fusion, ajustement ou confirmation |
| Fixtures | 29 besoins, 40 magasins (3 sans rattachement), 4 campagnes, 2 semaines clôturées, 56 événements, graine inchangée : les données de A1 (zones, profils, alertes, horloge) sont identiques octet pour octet |
| Champ `campaign` | Séparé en `dispositif` (4 valeurs) et `campaign_code` rattachée à un seul dispositif (H1, D128). La concordance est refusée par le Repository |

## 2. Non réalisé (hors périmètre A2a, conforme au prompt)
Saisie en lot, collage, brouillon automatique, résumé avant soumission, échéances, blocage après échéance, **réouverture d'une semaine clôturée** (W12 la décrit : mécanisme en A2b), propositions, indicateurs, import Excel (W14, W15 et D7 sont codées et testées sur entrées brutes, l'écran d'import est en A6), base de données, authentification réelle.
Pas d'écran du journal d'événements : il est lu par les tests et par les lots A4c.

## 3. Contrôles exécutés aujourd'hui
| Commande | Résultat |
|---|---|
| `npm run typecheck` | OK, 0 erreur |
| `npm run lint` | OK, 0 erreur, 0 avertissement |
| `npm test` | 17 fichiers, 364 tests passés, 1 ignoré (C3, voir plus bas) |
| `npm run test:e2e` | 35 tests passés sur 35 (23 de A1 + 12 de A2a), après `npm run build` automatique |
| Captures A2a | 50 images dans `docs/captures/A2a/` (liste, saisie, calendrier, W5, doublon D1, alerte, brouillon, clair et sombre, FR et EN, 1440 et 390 px), console vide et aucune requête externe sur chaque parcours |
| C1 | Passé : codes `BES-DEMO-nnn`, `MAG-DEMO-nnn`, `CMP-DEMO-nn` uniques |
| C2 | Passé : `is_demo = true` sur 100 % des entités |
| C3 | **Non exécuté** : `.denylist.local` absent |
| C4, C5, C7 | Passés (`tests/unit/guards.test.ts`) |
| C6 | Passé : les parcours Playwright échouent sur toute requête hors serveur local |
| C8 | Non exécuté (relecture humaine) |

Cas et règles couverts : W1 à W21 (tableaux), W22 et D1 à D7 (tableaux), 2026-S53 et 2027-S01 (semaine, saisie à cheval sur deux années, fixtures), semaine clôturée refusée, besoin incomplet exclu des totaux, un RS ne lit ni n'écrit hors de son secteur, aucun événement sans audience, aucune anomalie (EV-05) côté cliente, dates jamais tapées à la main (test d'architecture), jour courant jamais pris sur l'horloge du poste.

Écran vérifié visuellement : liste (agence, vue étendue), formulaire vide, calendrier ouvert avec semaine clôturée et férié, calendrier de semaine en sombre, duplication en 390 px anglais. Les autres captures sont générées sans erreur mais **je n'ai pas relu chacune des 50 images** : à parcourir par T. SOEFOU.

## 4. Hypothèses d'interprétation à valider (non des décisions)
La V0.4 donne le titre et la gravité de chaque règle, pas son test opérationnel. Choix faits, tous marqués ici :
| Règle | Interprétation retenue |
|---|---|
| Type et intitulé (D1 à D3, D6) | « Même type » = même dispositif ; « même intitulé » = même libellé de poste. Le dictionnaire ne porte ni champ type ni champ intitulé |
| W2 | Numéro égal au calcul par défaut d'un tableur (semaine 1 = celle du 1er janvier) et différent de l'ISO. **Appliquée aux saisies brutes seulement** (import, collage). Une semaine choisie au calendrier relève de W3 ou W5. Constat en cours de lot : en 2027 le numéro de tableur diffère de l'ISO toute l'année, pas seulement autour du 1er janvier |
| W3 | Bon numéro de semaine avec l'année civile au lieu de l'année ISO (ex. 2024-S01 pour le 30/12/2024) |
| W5 | Se tait quand W2 ou W3 expliquent déjà l'écart |
| W7 | Début de semaine renseigné, fin absente, dates sur plusieurs semaines |
| W8 | Période de 7 jours au plus à cheval sur deux semaines ; la semaine retenue est celle du début |
| W10 et W20 | W10 : semaine de début antérieure à la semaine en cours. W20 : début antérieur à la date de saisie dans la semaine en cours, ou période hors fenêtre de campagne (saisonnier exclu, voir W21) |
| W11 | Horizon de 52 semaines, paramètre à valider |
| W12 | Refus si une semaine couverte est clôturée |
| W16 | Dimanche et fériés, paramétrables |
| W17 | Prorata en jours sur 7 |
| W18, W19 | W18 : début de P2 entre le début et la fin de P1 ; W19 : P2 commence avant P1 |
| W22 | Même secteur, même dispositif, même semaine ISO ; se tait devant D1, D2, D3 |
| D6 | Intitulé identique, périodes disjointes et non contiguës (la contiguïté relève de D4) |
| D5 | Même magasin dans deux secteurs sur des périodes qui se recouvrent, tous dispositifs |
| J1 à J3, B1 | Règles ajoutées par le cadrage 28 §8 (jours cochés) et par les bornes du dictionnaire (01/01/2026 à 31/12/2028) |

## 5. Écarts avec le dictionnaire et le prompt
- **Périodes** : un besoin porte un tableau de 1 à 2 périodes (P1, P2) au lieu d'une ligne par `period_no`, pour tester W18 et W19. Le dictionnaire est à plat (une ligne Excel par période).
- **Secteur** : `sector_id` référence la zone de type RS ; `dr_code`, `cvr_code`, `rs_code` se déduisent de l'arbre des zones et ne sont pas stockés. Le texte `sector` du dictionnaire n'existe pas.
- **Magasins** : `store_codes` (liste de codes `MAG-DEMO-nnn`) ajoutés, le dictionnaire ne porte que `store_count`. Nécessaires à D5 et à la règle F-20.1 (magasins limités au secteur du RS).
- **Code de besoin** : généré (`BES-DEMO-nnn`), non saisi, pour qu'aucun texte libre ne porte de date ou de code.
- **Statut de poste** : champ présent avec les neuf valeurs, nul en A2a (renseigné en A3). États du besoin : brouillon et soumis seulement.
- **EV-03** (« demande de changement ») sert pour la fusion : à confirmer.
- **Compléter un brouillon** (écran d'édition) ajouté : sans lui un brouillon serait une impasse. Un besoin soumis n'est pas modifiable ici (A3).
- **Postes** : libellés « Poste 1 » à « Poste 7 », génériques, stockés en français dans la donnée.
- **Heures par semaine** : liste du dictionnaire (3, 6, 7 … 35).
- Le prompt demande le « module pur des jours fériés » : fait. Q-N9-1 à Q-N9-5 ne concernent pas A2a.

## 6. Défauts repérés hors périmètre
- `tests/unit/guards.test.ts` reste muet (C3 ignoré) tant que `.denylist.local` n'existe pas.
- `tests/shots/shots.spec.ts` (A1) régénère les captures de A1 à chaque `npm run preview:shots`. Pour A2a j'ai lancé uniquement `npx playwright test --config=playwright.shots.config.ts a2a` afin de ne pas toucher aux captures de A1.
- Un serveur de test laissé actif sur le port 3100 a servi un ancien build à Playwright (`reuseExistingServer: true`) et m'a fait perdre des essais. Piège à connaître avant de relancer les tests : vérifier que le port est libre.

## 7. Vérifications non exécutées
C3 et C8 ; essais sur Mac ; navigateurs autres que Chromium ; lecteur d'écran réel sur le calendrier (rôles et libellés ARIA écrits, navigation clavier testée, annonce vocale non écoutée) ; contraste des nouvelles combinaisons du calendrier : elles réutilisent des paires déjà testées dans `contrast.test.ts` (texte sur fond de page, de carte, teinte aqua, sable, sel, blanc sur couleur principale), aucun nouveau jeton.

## 8. Questions pour T. SOEFOU (par ordre de blocage)
1. Valider ou ajuster les interprétations du §4, en priorité D1 à D3 (type = dispositif) et W2 (saisie brute seulement). **Bloque A2b** (les mêmes règles servent à la saisie en lot).
2. Horizon de saisie (W11 : 52 semaines retenu) et jours non ouvrés (W16 : dimanche et fériés) : valeurs par campagne ou par dispositif ?
3. Fusion (D2, D3, D4) : la période du besoin existant est étendue, ses autres champs sont conservés. Acceptable, ou la fusion doit-elle comparer champ par champ ?
4. Libellés de poste : liste fermée « Poste 1 à 7 » conservée, ou valeurs réelles du classeur à fournir sous forme de squelette sans données ?
5. Qui rouvre une semaine clôturée et comment (W12, D82) : prévu en A2b, à confirmer.
6. Créer `.denylist.local` pour activer C3.

## 9. Mise à jour proposée du registre (non enregistrée)
| N° | Sujet | Proposition | Décideur |
|---|---|---|---|
| D140 (proposée) | Interprétations W et D | Adopter le tableau du §4 comme jeu de règles par défaut de A2a, paramétrable | T. SOEFOU |
| D141 (proposée) | Modèle du besoin | Périodes P1 et P2 imbriquées, secteur par référence de zone, magasins par code, besoin soumis ou brouillon, statut de poste nul avant A3 | T. SOEFOU |
| D142 (proposée) | W2 | Règle réservée aux saisies brutes (import, collage) | T. SOEFOU |
| D143 (proposée) | Fusion de doublons | Extension de la période du besoin existant, événement EV-03 | T. SOEFOU, cliente |
| D144 (proposée) | Journal | Anomalies EV-05 d'audience agence, besoins EV-01 et EV-02 d'audience les deux | T. SOEFOU |
| D120 à D122, D133 | Aucune modification | D133 appliquée par les composants `DatePicker`, `DateRangePicker`, `WeekPicker` et un test d'architecture | |

## 10. Suite
Pas de chaînage. Avant A2b : réponses aux questions 1 et 5, puis validation écrite de ce compte rendu. Rien n'est commité ni poussé.
