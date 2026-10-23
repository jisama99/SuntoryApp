# Compte rendu du lot A2b : saisie en lot, brouillon, résumé, échéances, blocage, paramètres par dispositif

Date : 23/10/2026 (horloge de démonstration). Données exclusivement fictives (`is_demo = true`). `docs/DECISIONS.md` n'a pas été modifié : les mises à jour du registre sont proposées au §9, sans être inscrites. Commit et push de la branche de session en fin de lot (D148), jamais sur `main`, aucune pull request.

## 0. Préparation et contrôles de départ (avant toute modification)
| Contrôle | Résultat exact |
|---|---|
| Port 3100 | **Contrôle initial non concluant** : la commande `ss` est absente de cette machine et son erreur était masquée, la ligne « port libre » ne prouvait rien. Constat établi ensuite : le serveur lancé plus tard s'est lié au port sans erreur (`Ready`, aucun `EADDRINUSE`) et `/proc/net/tcp` ne montre plus aucune écoute sur 3100 après arrêt. Le port était donc libre, mais le contrôle écrit au début de session était invalide |
| `npm install` | `added 426 packages`, `5 high severity vulnerabilities` (dépendances de développement, voir compte rendu A2a §0), avertissements ERESOLVE ESLint 10 inchangés |
| `npx playwright install chromium` | Chrome Headless Shell 156.0.8078.4 téléchargé |
| `npm run typecheck` | OK, 0 erreur |
| `npm run lint` | OK, 0 erreur |
| `npm test` | 18 fichiers, **370 tests passés, 1 ignoré** (C3), attendu confirmé |
| `npm run test:e2e` | **37 passés sur 37**, attendu confirmé |

Intégration de `origin/main` : la règle commune 14 (navigation web, D151) et D149 à D152 étaient sur `main` (commits `1301c25` et `cf7236b`), pas dans le clone. `git fetch origin` puis `git merge origin/main` : avance rapide, aucun conflit, aucun rebase, aucune force. Règles 14 et 15 lues puis appliquées telles qu'écrites (§1 bis).

## 1. Réalisé
| Étape du prompt | Résultat |
|---|---|
| 1. Calendrier d'échéances | Deux échéances par mois (saisie des besoins, demandes de changement), preset par défaut et date fixe par mois et par type, paramétrés par l'agence administration. Presets Large, Standard, Court calculés avec les jours ouvrés (samedi, dimanche, fériés exclus, recul à la veille ouvrée). Les six dates du doc 24 §3 (novembre et décembre 2026) sont reproduites par test. Aucune valeur de preset en dur : elles sont dans les réglages (`deadline-settings.json`) |
| 2. Blocage après échéance (D78) | Refus **dans le Repository** (`saveNeed`, `duplicateNeed`, lot) avec constat explicite E1 ou E2 (calendrier global) ou P3 ou P4 (règle du dispositif), date limite et mois cité, événement EV-04 d'audience agence. Le calendrier de saisie désactive aussi les jours du mois clos avec la raison écrite, mais seule la couche données décide |
| 2 bis. Paramètres par dispositif | Table `dispositif-params` (4 dispositifs), modifiable par l'agence administration seule, historique (acteur, date, ancienne et nouvelle valeur), valeur de départ visible, statut du doc 28 par paramètre. Règles P1 à P6 branchées sur le moteur d'A2a (`evaluateDispositifRules`), W11, W16 et J3 lisent `horizon_weeks`, `non_working_days` et `days_allowed` (D145). Priorité du dispositif sur le preset global testée, avec recul à la veille ouvrée. Écran « Paramètres des dispositifs », exemple chiffré H2 calculé en direct avec les deux lectures de Q-N9-1. Un dispositif par campagne (P2) |
| 3. Alertes (D79, D82) | J-5, J-2, jour J (cascade réglable, en jours ouvrés), dérivées de l'horloge de démonstration, avec audience filtrée dans la couche de données. J-2 et jour J seulement pour les périmètres en retard. Résumé des retards de la cliente (D81) et bilan chiffré de l'agence au lendemain de la clôture. Aucune alerte d'audience agence côté cliente, CVR, DR, RS (test) |
| 4. Report et réouverture | Report sur M+1 d'une demande tardive, marquée « reportée » (jugée sur M+1). Réouverture : demande par le CVR seul (D87), décision par l'agence administration seule, motif, durée (date de fin), zone, trace (D82, D147). Mois ou semaine clôturée (W12) |
| 5. Saisie en lot | Cartes de lignes (voir §5), collage depuis un tableur, jours collés `LUN;MAR` convertis en cases cochées, validation ligne par ligne par les règles d'A2a, rejets expliqués, aucune ligne perdue en silence (lignes vides comptées, valeurs collées inconnues signalées) |
| 6. Brouillon et résumé | Brouillon automatique côté données, par profil, repris après rechargement. Résumé avant soumission (lignes saisies, complètes, incomplètes, heures, dispositifs) |
| 7. Écrans | `/needs/batch`, `/settings/deadlines` (calendrier, éditeur, demandes de réouverture, trace, courriels préparés), `/settings/dispositifs`, bannière d'échéance (liste, saisie, lot), résumé des retards (liste des besoins), alertes d'échéance (page Alertes). Textes FR et EN |
| 8. Captures | `docs/captures/A2b/` : 108 images (§3) |
| Courriels (blocage connu) | Modélisés dans une **file à valider sans envoi** : rappel du jour J (un message par responsable concerné) et résumé du lundi de la cliente (sans chiffre). L'agence administration valide ou écarte, rien ne part (D86, D94) |

## 1 bis. Règles 14 et 15 appliquées (D149, D151)
| Exigence | Réalisation | Vérification |
|---|---|---|
| Filtres, période, périmètre, onglets dans l'URL | Liste des besoins (`?filter=`, `?month=`), calendrier (`?dispositif=`, `?months=`), paramètres (`?dispositif=`, `?history=`) : liens `FilterTabs`. Filtre de résultat du lot : `history.pushState` | e2e : lien profond, retour arrière, rechargement, valeur inconnue repliée sur le défaut |
| États chargement et erreur sur chaque route | `loading.tsx` sur chaque route du lot, `error.tsx` sur `needs`, `settings`, `[section]` | test unitaire d'architecture |
| 404 conservé | Un `loading.tsx` fait partir la réponse avant un contrôle d'accès fait dans la page : une page interdite répondait 200. Contrôles déplacés dans des `layout.tsx` au-dessus des états de chargement (`needs`, `(write)`, `[id]`, `settings`, `[section]`). Routes réorganisées en groupes `(list)` et `(write)` | e2e A2a « entrée absente du menu = 404 » repassé au vert |
| Fil d'Ariane, lien d'évitement | `Breadcrumb` sur toutes les pages du lot, lien d'évitement de l'A1 | e2e |
| Aucune perte de saisie sans avertissement | `useUnsavedWarning` (fermeture, rechargement, clic sur un lien interne) dans le lot et le formulaire, brouillon automatique | e2e (boîte de dialogue) |
| Mobile 390 px, mouvement réduit | Débordement horizontal trouvé sur le lot (listes de secteurs trop larges), corrigé dans `SelectField` | e2e : aucun débordement sur 5 écrans ; mouvement réduit hérité de l'A1 |
| Seuils de performance H3 (hypothèse, non décidée) | Mesurés par e2e sur le build de production, Chromium sans interface, dans le conteneur : plus grand affichage utile 84 à 172 ms sur les cinq écrans (liste 172, lot 116, calendrier 140, paramètres 84, alertes 108), `DOMContentLoaded` 77 à 153 ms. Seuil 2 s respecté. Mesure d'un conteneur sans réseau, **à refaire sur le poste** | `test-results/h3-a2b.json` |
| Règle 15 (anglais) | Tous les textes passent par le dictionnaire, tests i18n étendus (alertes dérivées, motifs de collage, valeurs de paramètres, jours fériés, règles P et E) | tests unitaires |

## 1 ter. Ajout demandé après relecture des captures : gabarit de l'application (hors périmètre strict d'A2b)
Retour de T. SOEFOU : le menu latéral n'a pas de volet dépliable, il reste en haut d'une page longue avec un grand vide dessous, et les captures pleine page ne donnent pas l'expérience d'un écran de bureau. Le gabarit relève de l'A1 ; il est corrigé ici à la demande, sur la même branche.
| Élément | Réalisation | Vérification |
|---|---|---|
| Bureau | Menu latéral **collant** sur toute la hauteur de l'écran (plus de vide), **repliable en rail d'icônes** par un bouton (`aria-expanded`), libellés conservés pour les lecteurs d'écran et en info-bulle, préférence mémorisée dans le cookie `demo_sidebar` lu côté serveur (aucun saut à l'affichage) | e2e : repli, rechargement, position fixe pendant le défilement |
| Mobile | **Barre d'onglets fixe en bas**, colonnes de largeur égale (Accueil, Besoins, Alertes, puis « Plus » pour les autres sections), bouton **« + » central** qui ouvre la saisie complète d'un besoin (`/needs/new` : bannière d'échéances, règles W, D, J, P et E côté données, brouillon, report sur M+1). Le « + » n'existe que pour les profils qui peuvent saisir (RS, agence) ; les profils en lecture ont quatre onglets. Volet « Plus » fermé par Échap, au choix d'une entrée ou au changement de page. Marge basse réservée : aucun contenu masqué par la barre, zone de sécurité des téléphones prise en compte | e2e : barre collée en bas pendant le défilement, quatre colonnes de même largeur (écart d'un pixel au plus), volet, « + » présent ou absent selon le profil, enregistrement d'un brouillon depuis le « + », aucun débordement |
| Captures | 20 vues **à la taille de l'écran** (`shell_*`) : bureau déployé, défilé, replié, sombre ; mobile barre du bas (haut de page, défilé), volet « Plus » ouvert, profil en lecture sans « + », saisie ouverte depuis le « + », en français et en anglais ; les 88 captures pleine page ont été régénérées avec le nouveau gabarit | relues : `shell_desktop_expanded_scrolled_fr`, `shell_desktop_collapsed_params_fr`, `shell_desktop_expanded_top_en`, `shell_desktop_dark_batch_fr`, `shell_mobile_closed_scrolled_fr`, `shell_mobile_more_open_fr`, `shell_mobile_readonly_profile_en`, `shell_mobile_new_need_agency_fr` ; les autres vues `shell_*` ne sont pas relues |
Le tiroir mobile du premier jet (bouton « Menu » en haut) a été remplacé par la barre du bas à la demande suivante de T. SOEFOU. Les captures de l'A1 et de l'A2a n'ont pas été régénérées : elles montrent l'ancien gabarit.

## 2. Non réalisé (hors périmètre, conforme au prompt)
Propositions et décisions, indicateurs, courriels réels (aucun envoi), import Excel, base de données. Pas d'écran d'affectation d'une campagne à un dispositif (P2 est testée au niveau du Repository et affichée en lecture). Pas de chaîne de reports (un report ne se reporte pas). Pas de modification d'un besoin soumis (A3). Événements EV-30 et EV-31 **non émis** : sans planificateur, les alertes sont dérivées à la lecture (voir §4, H-A2b-11).

## 3. Contrôles exécutés aujourd'hui (fin de lot)
| Commande | Résultat |
|---|---|
| `npm run typecheck` | OK, 0 erreur |
| `npm run lint` | OK, 0 erreur, 0 avertissement |
| `npm test` | **24 fichiers, 494 tests passés, 1 ignoré** (C3) |
| `npm run test:e2e` | **56 passés sur 56** (23 de l'A1, 14 de l'A2a, 14 de l'A2b, 5 du gabarit), après `npm run build` automatique |
| Captures | `npx playwright test --config=playwright.shots.config.ts a2b` : 7 parcours passés, 108 images (88 pleine page + 20 vues à la taille de l'écran), console vide et aucune requête externe vérifiées sur chaque parcours |
| C1, C2 | Passés (`tests/unit/fixtures-a2b.test.ts` et existants) |
| C3 | **Non exécuté** : `.denylist.local` absent |
| C4, C5, C7 | Passés (`tests/unit/guards.test.ts`) |
| C6 | Passé : les parcours Playwright échouent sur toute requête hors serveur local |
| C8 | Non exécuté (relecture humaine) |

Couverture des critères d'acceptation : P1 à P6 une fois chacune (`dispositif-rules.test.ts`, `a2b-repository.test.ts`), priorité dispositif sur preset avec recul à la veille ouvrée et fériés (`deadlines.test.ts`), refus d'écriture par le Repository après échéance puis rétablissement par la réouverture de l'agence, un CVR ne peut pas rouvrir lui-même, ni aucun autre profil que l'agence administration, audience (aucune alerte agence côté cliente, CVR, DR, RS), lot partiellement invalide qui ne crée que les lignes valides et liste les rejets, aucun événement sans audience.

### Captures `docs/captures/A2b/` (108 images)
30 vues, en français et en anglais (les vues de la phase 2 en français à 1440 px, hors alertes J-2 et bandeau de réouverture, faits dans les deux langues et largeurs), 1440 et 390 px, clair ; mode sombre sur la liste, le lot, le calendrier et les paramètres. Liste : `list_*`, `form_banner_*`, `calendar_locked_november_rs`, `batch_*` (vide, collé, résumé, résultat avec blocage après échéance), `deadlines_admin`, `params_*`, `alerts_j5_*`, `alerts_j2_rs`, `reopen_*`, `calendar_nonworking_admin`, `params_editor_open_admin`, `params_history_admin`, `deadlines_after_edit_admin`, `*_dark_*`.

**Relues image par image :** `batch_result_blocked_rs_fr_1440`, `calendar_locked_november_rs_fr_1440`, `list_direction_client_fr_1440`, `alerts_j2_rs_fr_1440`, `reopen_request_cvr_fr_1440`, `calendar_nonworking_admin_fr_1440`, `params_dark_admin_fr_1440`, `batch_summary_rs_en_1440` (relue avant la correction du séparateur « Permanent : 3 », régénérée depuis sans nouvelle relecture), ainsi que les premiers aperçus du lot, de la liste, du calendrier et des paramètres (régénérés depuis). `batch_result_blocked_rs_fr_390` : **relue en partie seulement** (haut de page et début de la ligne rejetée, découpe de 1 600 px sur 6 335).
**Non relues (environ 78 images) :** générées sans erreur, console vide, aucune requête externe, mais pas parcourues une à une. Les captures à 390 px d'écrans longs et les versions anglaises hors `batch_summary` sont à parcourir par T. SOEFOU.

## 4. Hypothèses d'interprétation à valider (non des décisions)
| N° | Hypothèse appliquée |
|---|---|
| H-A2b-1 | Jours ouvrés des échéances : lundi à vendredi hors fériés (les dates du doc 24 §3 ne se retrouvent qu'ainsi). Distincts des jours non ouvrés de mission (W16, D145 : dimanche et fériés) |
| H-A2b-2 | Mois cible d'un besoin : mois du premier jour de sa première période. Pour une fusion, mois du besoin modifié |
| H-A2b-3 | Le blocage D78 s'applique à tout mois dont l'échéance est passée, **y compris le mois en cours et les mois passés**. Conséquence : W10 et W20 ne sont plus atteignables dans le Repository pour ces mois sans réouverture (elles restent testées en règles pures). Deux tests e2e d'A2a ont été adaptés (voir §5) |
| H-A2b-4 | Fenêtre `entry_window` : borne la clôture seulement (dernier jour ouvré de l'avant-dernière semaine du mois précédent). La saisie anticipée avant l'ouverture est permise. Lecture A de Q-N9-1 par défaut (dernière semaine = dernière semaine entière du mois), lecture B sélectionnable |
| H-A2b-5 | P1 : la durée d'une intervention est la longueur du créneau horaire saisi. Créneau illisible : la règle se tait |
| H-A2b-6 | P5 : forfait « applicable » mais sans montant. Second placement : valeur **fictive** étiquetée 10,00 € HT. Autres dispositifs : « Non applicable ». Jamais 0 ni masqué par un zéro. Montant non communiqué côté cliente (D08 ouvert) |
| H-A2b-7 | Le paramètre du dispositif l'emporte sur le calendrier global, date fixe du mois comprise |
| H-A2b-8 | Novembre 2026 : changements au plus tard le 30/10/2026 (date fictive de D80). La saisie des besoins de novembre reste au preset Standard (19/10, déjà passée) |
| H-A2b-9 | Report sur M+1 : les dates saisies sont conservées, la demande est marquée « reportée » et jugée sur M+1 ; si M+1 est clos, le report est refusé |
| H-A2b-10 | Réouverture : la zone est obligatoire (DR, CVR ou RS, une réouverture couvre ses descendants), durée jusqu'à une date au plus 90 jours après l'horloge, décision réservée à l'agence administration (l'opérateur et le prestataire n'ont pas ce droit) |
| H-A2b-11 | Alertes dérivées à la lecture : pas de planificateur, donc pas d'événement EV-30 ni EV-31. Cascade 5, 2, 0 jours ouvrés |
| H-A2b-12 | État d'un secteur : à jour s'il a au moins un besoin soumis pour le mois, sinon en retard si la saisie est close, à suivre sinon. Libellé de zone seul (sans nom ni code) dans le résumé des retards |
| H-A2b-13 | Brouillon automatique côté données, par profil (non dans le navigateur) |
| H-A2b-14 | Lot : une ligne incomplète est rejetée (jamais enregistrée en brouillon), une alerte se confirme ligne par ligne, une date collée ambiguë (jour inférieur ou égal à 12) est rejetée par W14 |
| H-A2b-15 | EV-04 (blocage et report) d'audience agence, EV-32 et EV-33 d'audience les deux, EV-38 (paramètre ou échéance modifié) d'audience agence : **EV-38 est un code proposé hors catalogue** |

## 5. Écarts avec le prompt, le dictionnaire et les tests d'A2a
- **Lot en cartes de lignes**, pas en tableau HTML : le calendrier de sélection s'ouvre en fenêtre flottante et serait coupé dans un tableau défilant. Chaque ligne reste un bloc de champs étiquetés (clavier, lecteur d'écran, mobile).
- Champ `deferred_from_month` ajouté au besoin (facultatif, aucune fixture d'A1 ni d'A2a modifiée, vérifié par test de déterminisme).
- Règles ajoutées au moteur : P1 à P6, E1 et E2 (E1 et E2 pour le calendrier global, P3 et P4 quand la règle vient du dispositif).
- Clés de paramètre ajoutées : `change_lead_unit` (Q-N9-2) et `entry_window.reading` (Q-N9-1).
- Routes de `/needs` réorganisées en groupes `(list)` et `(write)` pour garder le code 404 (voir §1 bis).
- **Tests d'A2a modifiés** (`tests/e2e/needs.spec.ts`) : les tableaux de la page Besoins sont désormais deux (retards et liste), le sélecteur désigne le tableau par son titre ; le test du jour férié du calendrier utilise Noël au lieu de la Toussaint, car novembre est clos (D78) et affiche donc une autre raison.
- Alertes d'exemple de l'A1 (`deadline_d5`, `deadline_d2`) toujours présentes : elles font doublon avec les alertes d'échéance dérivées. À retirer ou à conserver ?
- Aperçu interactif : les captures sont locales. Aucun déploiement ni lien externe (D104, D114). L'interactif s'obtient avec `npm run dev` sur le poste.

## 6. Défauts repérés hors périmètre
- Libellés anglais d'A2a : « Hours per week » et « Hours » (horaires) se ressemblent, à reformuler.
- `tests/unit/guards.test.ts` reste muet pour C3 sans `.denylist.local`.
- `tests/shots/shots.spec.ts` (A1) et `a2a.spec.ts` n'ont pas été relancés : captures d'A1 et d'A2a intactes.
- Écart ESLint 10 et `eslint-config-next` inchangé.

## 7. Vérifications non exécutées
C3 et C8 ; essais sur Mac ; navigateurs autres que Chromium ; lecteur d'écran réel (rôles et libellés ARIA écrits, annonce vocale non écoutée) ; mesures H3 sur le poste réel ; relecture visuelle d'environ 78 captures (§3). Contraste : aucun nouveau jeton, paires réutilisées (texte sur carte, teinte sable, teinte lavande, avertissement sur fond d'avertissement, erreur sur carte), déjà couvertes par `contrast.test.ts`.

## 8. Questions pour T. SOEFOU (par ordre de blocage)
1. Date exacte de novembre (D80) : le 30/10/2026 est une date fictive. Et la saisie des besoins de novembre : preset Standard déjà passé (19/10) ou date fixe ?
2. Le blocage D78 doit-il s'appliquer au mois en cours et aux mois passés (H-A2b-3), ce qui rend W10 et W20 inatteignables sans réouverture ?
3. Q-N9-1 : lecture A (S47) ou B (S48) de « avant-dernière semaine de novembre » ? Q-N9-2 : jours calendaires ou ouvrés pour les 10 jours ?
4. Q-N9-3 : qui est le rôle « CS » ? Il n'est pas proposé dans les rôles de saisie en attendant.
5. Réouverture : l'agence opérateur peut-elle décider ? La zone obligatoire convient-elle ?
6. Report sur M+1 : dates conservées (retenu) ou décalées dans le mois suivant ?
7. P1 : la durée d'intervention est-elle bien le créneau horaire saisi ?
8. Retirer les alertes d'exemple `deadline_d5` et `deadline_d2` de l'A1 ?
9. Lot en cartes de lignes : acceptable, ou tableau strict malgré le calendrier flottant ?
10. Forfait kilométrique fictif de 10,00 € HT pour le démonstrateur : valeur à garder ou à laisser « Non chiffré » ?

## 9. Mise à jour du registre proposée (non inscrite dans `docs/DECISIONS.md`)
Numéros proposés à partir de D153, à attribuer par T. SOEFOU.
| N° proposé | Sujet | Contenu | Statut proposé |
|---|---|---|---|
| D153 | Jours ouvrés des échéances | Lundi à vendredi hors fériés, distincts des jours non ouvrés de mission (D145) | Proposée (H-A2b-1) |
| D154 | Mois cible et blocage | Mois du premier jour de la première période ; blocage applicable à tout mois dont l'échéance est passée, réouverture seule issue | Proposée (H-A2b-2, 3), arbitrage question 2 |
| D155 | Fenêtre de saisie du dispositif | Borne la clôture, saisie anticipée permise, lecture A par défaut (Q-N9-1) | Proposée (H-A2b-4) |
| D156 | Priorité des échéances | Paramètre du dispositif avant date fixe avant preset par défaut | Proposée (H-A2b-7), précise D82 et D128 |
| D157 | Report sur M+1 | Dates conservées, marque « reportée », jugé sur M+1, sans chaîne | Proposée (H-A2b-9) |
| D158 | Réouverture | Zone obligatoire, durée par date de fin (90 jours au plus), décision réservée à l'agence administration | Proposée (H-A2b-10), précise D147 |
| D159 | Alertes d'échéance dérivées | Cascade 5, 2, 0 jours ouvrés, J-2 et jour J réservés aux périmètres en retard, bilan chiffré d'audience agence ; EV-30 et EV-31 reportés aux automatisations (A4a) | Proposée (H-A2b-11, 12) |
| D160 | Saisie en lot | Ligne incomplète rejetée, alerte confirmée par ligne, brouillon automatique côté données, collage avec explications | Proposée (H-A2b-13, 14) |
| D161 | Courriels préparés | File à valider sans envoi, un message par responsable concerné, résumé du lundi sans chiffre | Proposée (précise D86 et D94) |
| D162 | Journal | EV-04 (agence), EV-32 et EV-33 (les deux), **EV-38 hors catalogue** (agence) à inscrire au doc 26 | Proposée (H-A2b-15) |
| D163 | Navigation web | Règle 14 appliquée en A2b ; contrôles d'accès dans des `layout.tsx` au-dessus des états de chargement pour garder le 404 | Constat technique, à confirmer |

## 10. Suite
Pas de chaînage vers A3. Gabarit : la préférence du menu replié n'est pas une décision du registre (proposition à valider avec le reste). Avant A3 : réponses aux questions 1 à 4 (elles pilotent les dates et les règles par défaut), validation écrite de ce compte rendu, relecture des captures non parcourues.
