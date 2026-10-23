# Compte rendu du lot A3c : validation CVR, escalade DR, délégations, qualification agence (F-30.1 à F-30.4) et reprises de la revue A3

**C3 : non exécuté** (`.denylist.local` absent de ce poste). Le lot ne se déclare pas conforme à C3 ; la revue ou le poste du prestataire l'exécute avant la fusion. C1, C2, C4 à C7 (tests d'architecture de `guards.test.ts`) sont verts.

Date : 23/10/2026 (horloge de démonstration, 10:30). Données fictives uniquement, aucune requête externe, aucun fichier de données réelles lu, Supabase et Vercel non utilisés. `docs/DECISIONS.md` n'est pas modifié. Aucune pull request (D148).

## 0. Départ et constat sur les reprises de revue
Branche de session contenant `origin/main` (e2af8b0). Présents : D191, D197 à D204, D209 à D211 (et D230 à D232), `COMPTE_RENDU_A3.md`, `REVUE_A3.md`, règles 14, 15, 16, 18. Départ : tsc et lint propres, 681 tests unitaires passés.
**Écart avec le prompt** : les quatre reprises demandées (accord invalidé, besoin stoppé, « même jour », carte Exécution) étaient **déjà codées et testées dans `main`** (compte rendu `COMPTE_RENDU_A3R.md`, tests « reprises de la revue A3 »). Je ne les ai pas recodées : je les ai relues et leurs tests ont été rejoués (verts). Je n'ai donc pas pu écrire un test rouge avant correction pour elles. Ce qui restait réellement : l'heure (voir §1).

## 1. Horloge (corrigée en premier, test d'abord)
- Cause : `memory-repository.ts` lisait l'heure du poste par `Intl.DateTimeFormat(...).format()` sans argument, que le garde ne voyait pas (il ne cherchait que `new Date()` et `Date.now()`).
- Garde étendu (`tests/unit/dates-architecture.test.ts`, analyse syntaxique) : `new Date()`, `new Date(undefined)`, `Date()`, `Date.now()`, `Temporal.Now`, `format()` et `formatToParts()` sans argument. Un test prouve que chaque forme est repérée (donc non contournable par réécriture). Test rouge d'abord : une seule violation, `memory-repository.ts:76`. **Aucune exception ajoutée au garde.**
- Correction : `clock.json` et `DemoClockSchema` portent `time` (`10:30`, Paris, fixe) ; le Repository la lit (`getClock`, `decided_time`). `setTimeSource` est remplacé par `setDemoTime` (test seulement, pose une autre heure fixe). Test : deux lancements donnent `10:30`.
- Captures : **74 images (A3 : 40, A3c : 34) régénérées deux fois sur serveur neuf : empreintes SHA-256 identiques.** Pour y arriver : mouvement réduit, défilement en haut, animations coupées dans `tests/shots/a3.spec.ts` et `a3c.spec.ts`.

## 2. Hygiène
- Test C7 : analysé en A3R (cause non établie, délai de 30 s, un dépassement échoue). Je n'ai pas reproduit d'échec ; non modifié. Aucun autre test instable dans la suite.
- **Instabilité non expliquée** : sur environ 14 lancements de `a3c.spec.ts` (captures), 2 ont échoué sur une erreur de console « 404 » (la capture n'a pas identifié l'URL, absente des réponses 404 suivies) ; 6 lancements consécutifs suivants et les 2 de la génération finale sont verts. Aucune occurrence dans les 119 tests e2e. À surveiller.

## 3. Ce qui existait de F-30.1 à F-30.4 (vérifié par lecture du code)
| Fonction | Avant A3c |
|---|---|
| F-30.1 validation CVR, EV-06, EV-08 | absente (un besoin soumis était réputé validé, H-A3-1 / D209) |
| F-30.2 escalade DR, EV-07 | absente |
| F-30.3 délégations | absente |
| F-30.4 qualification agence | présente (`qualifyNeed`, EV-09, formulaire) ; non liée à la validation |

## 4. Codé (tests d'abord : 31 tests de dépôt et 20 tests de règles rouges, puis verts)
- **Règles pures** `src/domain/validation.ts` : état déduit de la dernière trace (à valider, escaladé, validé, refusé), table de transitions, étape « qui doit agir » (CVR, DR, RS) avec échéance en jours ouvrés, délégations (statut, périmètre effectif, contrôles).
- **Dépôt** : traces `Validation` jamais effacées, tours (renvoi après refus), `validateNeed`, `escalateNeed` (trois cas, motif obligatoire, CVR concerné pour l'arbitrage, choisi parmi les CVR frères du même DR), `resubmitNeed`, `validateBatch` (motif commun, contrôle par besoin), `createDelegation`, `stopDelegation`, `getDelegations`. Qualification de l'agence **conditionnée** à la validation (`not_validated`). Entonnoir : « à valider » compté à part, jamais « à qualifier » ni dans les heures.
- **Hors enveloppe** : point d'entrée manuel seulement, aucune règle de calcul, aucune escalade automatique (testé) ; A4b1 le branchera.
- **Délégation** : agence administration seule ; zone de l'absent et du suppléant de même niveau (CVR ou DR) ; dates choisies au calendrier (`DateRangePicker`, règle 12), début au plus tôt aujourd'hui ; un suppléant à la fois par absent ; pas de chaîne ; le suppléant reçoit la zone de l'absent et rien d'autre (fil du besoin, validation, décisions de proposition), jamais celle d'un autre CVR, ni le niveau DR. Arrêt anticipé immédiat, trace conservée.
- **Événements** : EV-06, EV-07, EV-08 (audience « les deux », sans motif ni zone concernée dans les données), EV-46 (renvoi) et EV-47 (délégation, **audience agence**), les deux derniers hors catalogue.
- **Alertes** (aucune notification réelle) : `validationPending`, `validationLate`, `escalationPending` (client), `validationRefused` (les deux), `delegationActive` (agence seule).
- **Écrans** : cinquième carte « Validation » sur le fil du besoin, formulaire CVR / DR, renvoi, historique, bandeau « en suppléance » ; liste « à traiter » avec acteurs CVR et DR, filtre « À valider », colonne Validation, validation en lot ; écran `/settings/delegations` (filtre dans l'URL, cartes sous 640 px) ; lien depuis Paramètres. FR et EN, glossaire et `STATUTS_ET_ETATS.md` complétés.
- **Jeu de démonstration** : besoins antérieurs réputés validés ; 7 nouveaux besoins (BES-DEMO-030 à 036) couvrant à valider (en retard et dans les temps), refusé, escaladé pour arbitrage, validé par le DR, renvoyé puis validé ; 3 délégations (terminée, arrêtée, planifiée).

## 5. Scénarios testés
Unitaires (`a3c-repository.test.ts`, `validation.test.ts`) : CVR valide ; CVR refuse (motif obligatoire) puis renvoi et second tour ; escalade DR (hors périmètre, hors enveloppe manuel) ; arbitrage entre deux CVR ; délégation pendant une absence ; fin de délégation ; délégation planifiée puis annulée ; DR remplacé par un DR ; **tentative hors périmètre refusée côté données** (autre CVR, autre DR, besoin non soumis) ; un suppléant n'élargit jamais le périmètre ; audience de chaque événement et alerte, absence côté cliente des événements agence ; cohérence de la qualification avec les statuts de A3 (besoin rejeté ou en précision sans proposition ni étape). E2E (`a3c-circuit.spec.ts`, serveur isolé port 3102, 9 tests, une seule issue chacun) : parcours complets par profil, URL (retour arrière, rechargement, lien profond), 390 px sans débordement et cibles de 44 px, anglais, console et réseau externe vides.

## 6. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 0 avertissement |
| `npx vitest run` | 32 fichiers, **734 passés, 1 ignoré (C3)** |
| `npm run build` | réussi, route `/[locale]/settings/delegations` |
| `npx playwright test` | **119 passés sur 119** (dont isolé 2, circuit 9) |
| captures A3 et A3c (deux lancements) | 12 tests passés ; 74 images identiques entre les deux |
| C1 à C7 | verts ; **C3 non exécuté** |
Performance (règle 14) : e2e `a3.spec.ts` inchangé et vert (seuils 2 s et 100 ms) ; pas de nouvelle mesure propre à A3c.

## 7. Écarts, non fait, hypothèses
- **Non fait** : notes D162 sur les décisions de validation (les notes portent encore sur proposition et décision seulement) ; édition à l'écran du délai de validation (paramètre en code) ; export. À décider.
- **Captures** : relues en planches à échelle réduite (mise en page, langues, débordements), **pas mot à mot** ; vues individuellement : `cvr_validates_fr_1440`, `list_cvr_to_validate_fr_1440` ; toutes les autres seulement en planches. Artefact connu : la barre d'onglets mobile fixe apparaît au milieu des captures pleine page. Tableau de la liste coupé par sa hauteur maximale (A2b) et motifs de démonstration en français dans les pages anglaises : inchangés.
- Hypothèses (non des décisions) : H-A3C-1 « validation » = validation du **besoin** (doc 26, EV-06 à EV-08), distincte de la décision de la cliente sur une proposition (F-30.6, inchangée) ; « refus puis nouvelle proposition » lu comme refus puis **renvoi du besoin** ; H-A3C-2 délai de validation CVR et DR de 2 jours ouvrés (valeur de départ paramétrable, D09 ouverte, à valider) ; H-A3C-3 le suppléant est une zone de même niveau, le DR de rattachement peut différer ; H-A3C-4 la délégation couvre le circuit de validation et de décision, pas la saisie ni le budget ; H-A3C-5 le CVR concerné par un arbitrage n'a aucun accès au besoin de l'autre ; H-A3C-6 un besoin modifié après validation ne rouvre pas la validation ; H-A3C-7 les besoins antérieurs à A3c sont réputés validés (fixtures).
- Question : le délai de qualification de l'agence (D199, depuis la soumission) doit-il courir depuis la **validation** ? Aujourd'hui il court depuis la soumission : un CVR lent met l'agence en retard.

## 8. Mise à jour du registre proposée (non inscrite, à partir de D215)
| N° | Sujet | Contenu |
|---|---|---|
| D215 | Validation managériale | Cinquième dimension : traces de validation (valide, refusé, escaladé, renvoyé), état déduit ; l'agence ne qualifie qu'un besoin validé ; refus avec motif, renvoi, tours conservés. Précise D45, D209 |
| D216 | Escalade DR | Trois cas (arbitrage entre CVR avec CVR concerné parmi les frères du même DR, hors périmètre, hors enveloppe manuel avec motif) ; le DR valide ou refuse avec motif ; règle d'enveloppe branchée en A4b1 (D43) |
| D217 | Délégations | Suppléant de même niveau, période au calendrier, un seul suppléant à la fois, pas de chaîne, périmètre limité à la zone de l'absent, agence administration seule, arrêt immédiat avec trace ; aucun délai de réponse figé (D09) |
| D218 | Délai de validation | Valeur de départ 2 jours ouvrés, paramétrable, à valider (précise D93, D199) |
| D219 | Codes d'événements | EV-06 à EV-08 émis ; EV-46 (renvoi) et EV-47 (délégation, audience agence) hors catalogue, à inscrire au doc 26 |
| D220 | Alertes de validation | `validationPending`, `validationLate`, `escalationPending` (client), `validationRefused` (les deux), `delegationActive` (agence) ; aucune notification réelle avant A4g |
| D221 | Horloge de démonstration | Date et heure fixes dans `clock.json` ; garde interdisant toute lecture de l'heure du poste sans exception |
(D205 à D208 et D212 à D214 restent réservées.)
