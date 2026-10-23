# Revue du lot A3 (D191)

Relecteur indépendant, branche `revue/A3` depuis `claude/gracious-goldberg-pggi8w` (f2fd6f9), `origin/main` (e05a9cd) fusionné sans conflit. Données fictives uniquement, aucune requête externe, aucun fichier de données réelles lu. `docs/DECISIONS.md` n'est pas modifié à ce stade.

## 1. Verdict : **fusionnable** (contrôles §4 verts, aucun bloquant, validation de T. SOEFOU reçue dans la session le 23/10/2026)
Aucun bloquant. Deux défauts importants et deux mineurs corrigés sur `revue/A3` (§3). Écarts restants au §6.

## 2. Conformité aux critères du prompt A3
| Critère | Preuve |
|---|---|
| 1. Contrôles exécutés | §4 |
| 2. Scénarios refus, modification après accord, remplacement, deux propositions | `tests/unit/a3-repository.test.ts` : « scénario : refus puis nouvelle proposition », « modification après accord » (version différente, version identique refusée, écart non expliqué refusé, besoin modifié par fusion : EV-12 invalide l'accord, la décision reste au dossier avec `invalidated_reason`), « deux propositions sur un besoin », remplacement dans les fixtures. Rejoués ici : 46 tests verts. |
| 3. Jamais un statut unique | test « chaque dimension évolue seule » ; quatre cartes distinctes sur le fil du besoin |
| 4. Audience de tous les événements et alertes | tests « audience de tous les événements et de toutes les alertes » (valeur dans `AUDIENCES`, aucune donnée de coût, de note ou de motif dans le journal, aucun événement d'audience agence côté cliente pour les 4 profils clientes, alertes d'agence absentes côté cliente) |
| 5. Captures, C1 à C7, compte rendu, registre | 40 captures régénérées, C1/C2/C4/C5/C6/C7 verts, C3 non exécuté (§4), compte rendu présent, registre proposé §8 |
| 6. Règles 14 à 16 | URL (filtre, tri, retour, rechargement, lien profond : `a3.spec.ts`), trois états par route (`loading.tsx` dans chaque route, `error.tsx` de section, vide dans la liste), 404 avant streaming (`[id]/layout.tsx`), cartes sous 640 px (corrigé, §3), cibles de 44 px (e2e 390 px), jetons (tests de style verts), perf mesurée : premier affichage 0,35 à 0,6 s, interaction 1 ms |
| 7. Git | aucun commit sur `main` par le lot, aucune pull request |

## 3. Constats et corrections (un commit par correction)
| # | Gravité | Constat | Correction |
|---|---|---|---|
| 1 | Important | `getNeedThread` rendait à la cliente une note partagée posée sur un **brouillon** de proposition (le brouillon est invisible de la cliente, pas ses notes dans le fil) | filtre `onHiddenDraft` dans le fil et dans `getNotes`, test d'abord |
| 2 | Important | La cliente pouvait décider (seule ou en lot) sur un besoin **stoppé ou rejeté** | `decideOne` refuse `not_decidable`, formulaire masqué, test d'abord |
| 3 | Important | Tableaux de l'entonnoir (stock, délais) non convertis en cartes sous 640 px : colonnes de droite coupées à 390 px (vu sur capture) | remplacés par `DataTable`, contrôle e2e à 390 px |
| 4 | Important | Test d'annulation e2e acceptant deux issues (serveur partagé) | projet Playwright `isolated`, serveur 3101, fichier `undo-isolated.spec.ts` : une seule issue (« Modification annulée », puis état restauré après rechargement) ; l'ancien test est retiré de `a3.spec.ts` |
| 5 | Mineur | Pluriels « 1 besoins », « 1 refus, 1 désistements » | déjà corrigés par le lot après capture ; captures régénérées ici |
| 6 | Mineur | Espace avant les deux-points en anglais (« Hours per week : 28 ») | ponctuation par langue |
| 7 | Mineur | Test « taux nul » conditionnel, pouvant ne rien affirmer | rendu inconditionnel |
| 8 | Mineur, hors lot | `guards.test.ts` C7 (`git log --all`) dépasse parfois 5 s sous charge (échec unique observé, relancé vert) | signalé, non corrigé |

Questions de périmètre (e) : **F-30.1 et F-30.2 absentes** (aucun code ni événement EV-06 à EV-08 ; seul un commentaire de `types.ts` les mentionne). **F-30.3 (délégations)** : absente. **F-30.4 (qualification agence)** : présente, `qualifyNeed` (prise en charge, précision demandée, rejet motivé, motif obligatoire, EV-09, formulaire `QualifyForm`, une qualification unique). Hypothèse du lot à trancher : un besoin soumis est réputé validé par la chaîne cliente.

## 4. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 0 avertissement |
| `npx vitest run` | **30 fichiers, 652 tests passés, 1 ignoré (C3)** |
| `npm run build` | réussi |
| `npx playwright test` | **109 passés sur 109** (dont 2 du projet isolé) |
| `npx playwright test --config=playwright.shots.config.ts tests/shots/a3.spec.ts` | 7 passés, 40 captures, console et réseau externe vides |
| C3 (`guards.test.ts`) | **non exécuté** : `.denylist.local` absent de cette session (fichier local de T. SOEFOU, jamais versionné) ; C1, C2, C4, C5, C6, C7 exécutés et verts |

## 5. Captures
Regardées dans cette revue (images ouvertes) : `list_rs_en_1440`, `thread_decision_pending_cvr_en_1440`, `funnel_direction_en_390` (avant et après correction), `alerts_agency_en_1440`, `list_cvr_dark_fr_1440`, `flow_3_refused_fr_1440`, `list_agency_operator_en_390`. Vues pendant la session du lot (avant régénération, même rendu) : `list_agency_operator_fr_1440`, `list_cvr_client_fr_1440`, `funnel_direction_fr_1440`, `thread_replacement_agency_fr_390` (échelle réduite), `flow_4_..._en_390`.
Couverture : /proposals (agence, CVR, RS ; FR, EN ; 1440, 390 ; sombre), /proposals/[id] (CVR, agence ; FR, EN ; 1440 ; 390), /proposals/funnel (direction ; FR, EN ; 1440, 390), alertes agence EN. **Non vues, donc non attestées visuellement : 24 des 40 images**, dont `thread_refusal_agency` (4), `thread_replacement_agency` EN et 1440 après régénération, `alerts_agency` FR et 390, `list_*` FR 390, `list_cvr` EN 390, `list_rs` FR, `flow_1`, `flow_2`, `flow_4` FR. Leurs pages sont couvertes par les tests e2e (aucune erreur de console, aucune requête externe, pas de débordement horizontal, cartes à 390 px).
Vu : rendu cohérent, états lisibles en clair et en sombre, FR et EN séparés, bandeau « DONNÉES FICTIVES » présent, contraste correct, tableau liste coupé par la hauteur maximale du composant commun (défaut connu d'A2b, hors lot). Défaut des captures plein écran : le menu latéral collant apparaît au milieu de la page (artefact de capture, déjà présent en A2b). Mineur sémantique : la carte « Exécution » affiche le statut de poste (« Refusé », « Proposé »), libellé à revoir avec A3c.

## 6. Écarts restants (non corrigés, à arbitrer)
- **Accord invalidé après recrutement finalisé** : si le besoin change après le recrutement, l'accord est invalidé mais l'état « Recrutement finalisé » reste (signalé par l'étiquette « le besoin a changé »). À trancher avec A3c.
- **Besoin stoppé et taux** : le code exclut tout le besoin du taux (numérateur et dénominateur), y compris les heures déjà effectuées. Ce n'est pas la règle proposée (D211) : à coder avec le lot qui consomme le taux.
- **Délais « même jour » et « plus tard dans la journée »** : non codés (le lot mesure J1 à J4 par situation de recrutement). À coder avec A4a ou A4c2 (D210).
- F-30.1, F-30.2, F-30.3 : A3c.
- Annulation globale par instantané (D181) : limite connue de l'étape A.

## 7. Registre
Validées par T. SOEFOU dans la session de revue et inscrites : D197 à D204 (A3), D209 (A3c), D210, D211. D205 à D208 (notifications) restent **proposées** (non inscrites), renumérotées dans `docs/propositions/PROPOSITION_NOTIFICATIONS_V0.1.md`, `docs/PROMPTS/32_PROMPT_LOT_A4G.md` et `docs/PLAN_A1_A7.md`. Les mentions D197 à D199 de `docs/COMPTE_RENDU_A1F.md` sont l'ancienne numérotation d'A1f, déjà fusionnée sous d'autres numéros : laissées telles quelles (document historique).
