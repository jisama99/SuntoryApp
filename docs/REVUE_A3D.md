# Revue du lot A3d : rôles de saisie des besoins

Branche relue : `claude/cool-hawking-ggvkk5` (dernier commit du lot `e93f6c8`), fusionnée avec `origin/main` (397099e) sur `revue/A3d`.

**Réserve d'indépendance (D191).** Le prompt exige une session distincte de celle qui a écrit le lot. Cette revue a été faite par **la session qui a écrit A3d**, sur demande explicite de T. SOEFOU (« réalise une revue et fusionne si non fait »). Elle vérifie par preuve, mais elle n'est pas indépendante : à relire par une session distincte si T. SOEFOU veut la garantie complète.

## 1. Écart : commits hors périmètre
`8ae49ae` et `e93f6c8` (volet de gauche : fond sur toute la hauteur, Réglages et Administration rangés en bas, hauteur du volet avec la bannière) **sortent du périmètre du prompt A3d** (rôles de saisie, et le prompt exclut « tout changement de design »). Ils ont été faits à la demande de T. SOEFOU dans la session (validation de sa recommandation). Évalué comme **écart assumé, non bloquant** : changement limité (`AppShell`, `NavLinks`, `globals.css`, `shell.spec.ts`), testé (3 e2e), hauteur en `dvh` (pas de `100vh`). Il touche tous les profils, pas seulement la saisie. Non listé dans le compte rendu A3D d'origine : ajouté ici.
Constat annexe, antérieur au lot : la coque garde `min-h-screen` (`AppShell.tsx`), écart déjà connu de la règle N1.

## 2. Conformité aux critères du prompt A3d
| Critère | Preuve | Verdict |
|---|---|---|
| 1. Contrôles exécutés | voir §4 | conforme (C3 hors session) |
| 2. Matrice profil × périmètre × action (accepté ou refusé côté données) | `a3d-repository.test.ts` (12 cas dont refus `out_of_scope` et `forbidden`), `entry-rights.test.ts` ; refus testés sur `saveNeed`, brouillon, lot | conforme |
| 2. Saisie CVR « avis donné à la saisie » | tests unitaires (CVR, DR, direction), e2e `a3d-isolated` (dossier, journal EV-49) | conforme |
| 2. Saisie pour le compte d'un RS tracée | EV-48 (qui, secteur, date), indicateur liste et dossier, tests unitaires et e2e | conforme |
| 2. Audience (la cliente ne lit ni coût ni note interne) | test sur le fil et les événements ; aucun texte libre dans les données d'événement | conforme |
| 2. FR et EN, aucune requête externe | e2e (veille requêtes et console), tests i18n | conforme |
| 3. Captures FR et EN, 1440 et 390, clair et sombre | 56 images (voir §5) | conforme avec réserve (menu) |
| 4. Aucune donnée réelle, aucune requête externe, aucune dépendance | `package.json` inchangé, contrôles C1, C2, C4 à C7 verts | conforme |
| 5. Compte rendu et registre proposé (numéros après D239) | `COMPTE_RENDU_A3D.md`, D240 à D243 | conforme |
| 6. Aucun commit sur main, aucune pull request | historique de la branche | conforme |

## 3. Audit (revue de code, accès, vie privée, i18n, minimum de modification)
Fait par moi seul, sans sous-agent, sur le diff (`git diff origin/main...HEAD`, 78 fichiers dont 56 images). Grilles `agents-projet/` lues comme repères, appliquées à la main.
| Constat | Gravité | Suite |
|---|---|---|
| Les droits de saisie sont appliqués dans la couche de données (`saveNeedImpl`, brouillon, lot) ; l'écran ne fait que refléter `canWriteNeeds` | – | conforme |
| La saisie n'est pas déléguée : un suppléant (A3c) saisit sur son périmètre propre ; la liste des secteurs du formulaire est filtrée en conséquence | – | conforme |
| Audience par défaut refusée : EV-48 et EV-49 « les deux » (choix proposé, H-A3d-3), aucun coût ni motif dans leurs données | – | à confirmer par T. SOEFOU (question) |
| Aucun code de zone affiché hors `ZoneLabel` (test), aucune chaîne en dur (test syntaxique), aucune référence interne dans les textes affichés (recherche sur les messages ajoutés) | – | conforme |
| Si l'agence complète un brouillon créé par un RS, `on_behalf` reste faux et EV-48 n'est pas émis | mineur | hypothèse déjà notée ; à trancher avec le registre |
| Le DR et la direction donnent aussi leur avis à la saisie (le prompt ne le dit que pour le CVR) | important (décision) | hypothèse H-A3d-1, soumise à T. SOEFOU |
| Assertion e2e faible : le test anglais de la liste vérifie seulement le mot « agency » dans la ligne | mineur | laissé : les autres tests prouvent l'indicateur |
| Aucun test ne vérifiait la saisie en lot par un CVR ni les écritures simultanées | important | **corrigé** : `a3d-revue.test.ts` (4 tests), commit sur `revue/A3d` |
| Pas d'accès concurrent réel côté serveur : la logique est synchrone dans un processus, donc sans course ; une base (étape B) devra garantir l'unicité | note | limite déclarée (§6) |

Aucun constat bloquant.

## 4. Contrôles exécutés (sortie réelle, sur `revue/A3d`)
| Contrôle | Résultat |
|---|---|
| `npm ci` | exécuté |
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint .` | 0 erreur, 0 avertissement |
| `npx vitest run` | **36 fichiers, 811 tests passés**, 1 ignoré (C3), 2 « todo » |
| Garde mouvement et mobile (`motion-mobile-rules.test.ts`) | passe (10 passés, 2 « todo ») |
| `npm run build` | réussi |
| `npx playwright test` | **134 passés sur 134** à la seconde exécution. À la première, 1 échec sur `rule16.spec.ts` (raccourcis clavier) pendant que je générais des images en parallèle ; le test seul passe 3 fois sur 3 et la suite entière passe ensuite : échec attribué à la charge de la machine, non reproduit |
| C3 | **non exécuté** : `.denylist.local` absent (hors session) |
| Performance H3 | saisie 236 à 757 ms (seuil 2 s) ; interaction 0,6 à 1,4 ms (seuil 100 ms) ; serveur local de production |

### Simulation de charge (D191, note CHARGE_ET_DISPONIBILITE §5)
- **S4 (doublons et conflits simultanés) : exécuté, niveau logique seulement** : 2 saisies identiques simultanées (RS et CVR) donnent 1 création ; 30 saisies identiques simultanées donnent 1 création ; 2 modifications simultanées d'un même besoin conservent les deux périodes (version 3, 0 écriture perdue). Seuils du §4 : doublons 0, écritures perdues 0 : respectés. **Limite :** fixtures JSON, un seul processus, aucune base ; ce n'est pas une mesure de capacité.
- **S1, S2, S3, S5 : non applicables / non exécutés.** Le lot n'introduit ni import, ni lot groupé, ni validation groupée. S1 et S2 (80 saisies simultanées par HTTP) et S5 (réseau dégradé) n'ont pas été lancés : ce lot ne change pas le chemin de saisie au delà de la liste des profils.

## 5. Règles communes et captures
Règles 10, 12 à 16 : prouvées par les tests existants qui passent (requêtes externes, `dates-architecture`, `style-rules`, `i18n`, `contrast`, e2e 390 px sans défilement horizontal et cibles de 44 px sur la saisie, retour arrière et rechargement du dossier, trois états de route inchangés). Le volet utilise `100dvh` moins la bannière ; aucun `100vh` ajouté.
Captures `docs/captures/A3d/` (56 images : 28 à 1440, 28 à 390). **Vues : les 56, en planches réduites montrant le haut de chaque page** (280 à 560 px de large, première partie seulement) : le bas des pages (journal, formulaires longs) n'a pas été relu en détail. Aucun débordement, texte tronqué, mélange de langues ou ancien titre repéré. Défauts : (1) **les 28 captures à 1440 montrent l'ancien menu** (Réglages juste sous « À traiter », pas en bas) ; (2) à 390 px, la barre d'onglets se superpose au contenu des captures pleine page (effet de capture déjà connu, pas un défaut de l'écran).
Captures A3c (`docs/captures/A3c/`) : **48 captures à 1440 montrent l'ancien menu** ; non relues dans cette revue.
Aucun appareil réel (N10) : Chromium seul testé ; Firefox, Safari et Android non testés.

## 6. Écarts restants
- Captures à régénérer (A3c 48 à 1440, A3d 28 à 1440) après le changement de menu, ou à accepter telles quelles. Non fait ici (hors périmètre, pas bloquant).
- Compte rendu A3D d'origine non mis à jour des deux commits du volet : couvert par le §1.
- Copie miroir `07_DEV_CLAUDE_CODE` à synchroniser par T. SOEFOU.

## 7. Verdict
**Fusionnable**, sous réserve : tous les contrôles sont verts (seul C3 hors session), aucun bloquant, et validation de T. SOEFOU reçue dans cette session sur D240 à D243 et sur l'écart du §1.
