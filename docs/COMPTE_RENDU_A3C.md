# Compte rendu du lot A3c : validation managériale, escalade DR, délégations, qualification agence (F-30.1 à F-30.4)

Date : 23/10/2026 (horloge de démonstration). Données exclusivement fictives. `docs/DECISIONS.md` non modifié (mise à jour proposée au §7). Aucune pull request, aucun commit sur `main` (D148). Aucun appel réseau, aucune donnée réelle lue.

## 0. Départ et constat avant codage
Branche de session = `origin/main` (vérifié), D191 et D197 à D211 présents, `COMPTE_RENDU_A3.md` présent, règles 14 à 16 présentes. Avant modification : typecheck propre, 691 tests unitaires, 110 e2e passés.
Constat du code A3 : F-30.4 (qualification : prise en charge, précision, rejet motivé) **existait** (`qualifyNeed`, EV-09). F-30.1, F-30.2, F-30.3 et EV-06 à EV-08 **n'existaient pas**.

## 1. Réalisé
| Étape | Résultat |
|---|---|
| 1. Circuit de validation | Nouvelle dimension « validation managériale » (à valider, validé, refusé, escaladé), stockée à part dans le suivi de recrutement, avec dossier jamais réécrit (tour, niveau, zone dont l'autorité s'exerce, zone du suppléant, motif). Chaîne par secteur : RS, CVR, DR (D45). Le CVR valide, ou refuse avec motif obligatoire. Un besoin soumis entre « à valider » ; l'agence ne peut le qualifier qu'une fois validé (`not_validated`). |
| 2. Escalade DR | Trois cas : arbitrage entre CVR (autre CVR sous le même DR, distinct), hors périmètre, hors enveloppe. Motif obligatoire. Le DR (ou la direction) valide ou refuse avec motif. « Hors enveloppe » : point d'entrée `EnvelopeEvaluator` (`NO_ENVELOPE_RULE` = « non évalué », `setEnvelopeEvaluator` pour A4b1) ; déclenchement manuel seulement, aucune règle inventée (D43 ouverte). |
| Nouvelle soumission | Un besoin refusé revient au RS (ou à l'agence) qui le soumet de nouveau : nouveau tour, historique conservé, EV-47. |
| 3. Délégations | Entité `Delegation` (délégant, suppléant du même niveau CVR ou DR, début, fin incluse, jamais supprimée, révocation tracée). Un seul suppléant à la fois (chevauchement refusé), pas de chaîne, pas de début dans le passé. Agence administration seule. Dates au calendrier (règle 12). Écran `/settings/delegations`, bandeau pour le suppléant et le délégant. Le suppléant a pour périmètre effectif le sien plus celui du délégant, jamais davantage. |
| 4. Qualification | Vérifiée cohérente avec les statuts A3 : précision demandée (action au RS), rejet motivé, prise en charge ; désormais après validation. Aucun code de plus. |
| 5. Qui doit agir | Acteurs « Le CVR » et « Le DR », actions valider, arbitrer, soumettre de nouveau ; échéance en jours ouvrés, urgence, retard ; filtre « Validation et arbitrage » ; validation en lot avec motif commun (annulable en une fois, escalade hors lot). |
| 6. Événements, alertes | EV-06, EV-07, EV-08, EV-47 d'audience « les deux » ; EV-46 (délégation) d'audience agence. Alertes `validationPending`, `validationLate`, `escalationPending`, `resubmitPending` (les deux), `delegationEnding` (agence). Aucune notification réelle. Aucun motif ni texte libre dans les données d'événement (testé). |
| 7. Écrans | Carte « Validation managériale » (cinq statuts séparés), panneau d'action, dossier de validation, écran Délégations avec trace, lot sur la liste, entonnoir (à valider et refusés comptés à part). FR et EN ; glossaire complété (termes marqués « proposé »). Notes D162 : le fil existant s'applique aux propositions et décisions ; aucune nouvelle note n'est posée sur la validation (voir §5, question 4). |
| 8. Captures | `docs/captures/A3c/` : 96 images (48 états, FR et EN, 1440 et 390 px), sans erreur de console ni requête externe. |

Jeu de démonstration : 8 besoins ajoutés (BES-DEMO-030 à 037, fin du jeu, ids existants inchangés), 3 délégations hors période courante (prévue, terminée, révoquée). Les besoins antérieurs sont réputés validés (D209). Aucune délégation en cours au départ.

## 2. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint .` | 0 erreur, 0 avertissement (après correction d'un import inutilisé) |
| `npx vitest run` | **33 fichiers, 770 tests passés**, 1 ignoré (C3) |
| `npm run build` | réussi, route `/[locale]/settings/delegations` ajoutée |
| `npx playwright test` | **122 passés sur 122** (110 existants + 12 nouveaux) |
| Captures `tests/shots/a3c-isolated.spec.ts` | 1 test passé, 96 images, console et requêtes externes vides |
| Performance H3 (`a3c-isolated`) | liste 490 ms, délégations 164 ms (seuil 2 s) ; interaction 0,9 ms (seuil 100 ms). Serveur local de production, non représentatif d'un hébergement. |
| C1, C2, C4 à C7 | tests d'architecture unitaires verts |
| **C3** | **non exécuté** : `.denylist.local` absent. Le lot ne se déclare pas conforme à C3 ; à exécuter sur le poste ou en revue. |

Nouveaux tests : `validation.test.ts` (32, règles pures), `a3c-repository.test.ts` (47 : scénarios, droits, audience, annulation), `a3c-isolated.spec.ts` (12 e2e). Critère 2 : CVR valide ; CVR refuse puis nouvelle soumission ; escalade DR ; arbitrage entre deux CVR ; délégation pendant une absence ; fin de délégation (révocation, terminée par les dates, révoquée) ; tentative hors périmètre refusée côté données (`not_found` / `forbidden`). Critère 3 : audience testée sur chaque événement et alerte ; le suppléant n'élargit jamais le périmètre (testé, y compris DR suppléant et absence de chaîne).
Critère 5 : les e2e du lot tournent sur un serveur dédié (port 3102) **neuf à chaque lancement** (`reuseExistingServer: false`), parcours en série, un besoin par scénario, une seule issue par assertion. Un lancement avec un serveur déjà occupé échoue, par construction.
Ordre à respecter pour les e2e : `npm run demo:accounts`, puis `npm run build`, puis `playwright test` (les mots de passe sont figés dans le build).

## 3. Non réalisé ou limité
- Aucune règle d'enveloppe, aucune notification réelle, aucun indicateur, aucune base (hors périmètre).
- Arbitrage entre deux CVR de DR différents : non codé (l'autre CVR doit être sous le même DR) ; la direction tranche seulement les besoins déjà escaladés. L'autre CVR cité ne reçoit pas d'accès au besoin, seul le DR commun arbitre.
- La délégation couvre la chaîne managériale et les décisions sur propositions (périmètre effectif pour les lectures de la page Propositions, du fil, de l'entonnoir, des alertes et des zones). Elle ne s'étend pas à la page Besoins ni aux autres écrans.
- Pas d'édition du besoin refusé ajoutée : la correction passe par les écrans de saisie existants, puis « Soumettre de nouveau ».
- Délais de validation (2 jours ouvrés) et d'arbitrage (3) : valeurs de départ en code, sans écran de réglage (D09 ouverte).
- Captures : j'ai relu `list_cvr_validation_fr_1440` et `thread_cvr_escalate_filled_fr_1440`. Les 94 autres sont produites, sans erreur de console, **non relues une à une**. Mode sombre : non capturé. Aucun écran vérifié sur appareil réel (N10).

## 4. Hypothèses (non des décisions)
- H-A3c-1 : tout besoin soumis après A3c passe par la validation du CVR, y compris saisi pour le compte d'un RS par l'agence.
- H-A3c-2 : « nouvelle proposition » du prompt lu comme nouvelle soumission du besoin par le RS après refus (la proposition de profil relève de l'agence, inchangée).
- H-A3c-3 : le DR ne valide pas directement ; il agit sur un besoin escaladé. La direction cliente arbitre au niveau DR.
- H-A3c-4 : le délégant garde ses droits pendant sa délégation (la première décision gagne, la seconde reçoit « n'attend plus de validation »).
- H-A3c-5 : suppléant du même niveau que le délégant ; une zone ne peut être délégante et suppléante sur une période qui se recoupe.
- H-A3c-6 : délégation non rétroactive ; fin incluse.
- H-A3c-7 : délais de validation 2 jours ouvrés, d'arbitrage 3, d'alerte de fin de délégation 2 jours ouvrés.

## 5. Défauts repérés hors périmètre (non corrigés)
- Le lot de validation (comme celui d'A3) disparaît de l'écran dès que tout est traité : seule la confirmation annulable le dit.
- `npm run demo:accounts` régénère `accounts.json` et ses mots de passe à chaque lancement (déjà signalé en A3) ; il n'est pas inclus dans le commit.
- Les e2e partagés (port 3100) mutent un serveur commun (déjà signalé en A3).

## 6. Questions pour T. SOEFOU
1. Valider H-A3c-1 (validation CVR aussi pour une saisie par l'agence) et H-A3c-3 (le DR n'agit que sur escalade).
2. Le délégant garde-t-il ses droits pendant sa délégation (H-A3c-4) ?
3. Valeurs des délais de validation et d'arbitrage (D09 ouverte).
4. Les notes D162 doivent-elles s'ouvrir sur le dossier de validation ?
5. Arbitrage entre CVR de DR différents : à la direction ?
6. Table des anciens statuts (D11) : toujours à valider avec la cliente.

## 7. Mise à jour du registre proposée (non inscrite)
| N° proposé | Sujet | Contenu | Statut proposé |
|---|---|---|---|
| D234 | Validation managériale | Dimension à part (à valider, validé, refusé, escaladé), dossier non réécrit, qualification de l'agence seulement après validation ; antérieurs réputés validés | Proposée (H-A3c-1, 3) |
| D235 | Escalade DR | Arbitrage entre CVR du même DR, hors périmètre, hors enveloppe (manuel avec motif, point d'entrée pour A4b1) ; motif obligatoire | Proposée |
| D236 | Délégations | Suppléant du même niveau, un seul à la fois, sans chaîne ni rétroactivité, périmètre effectif plafonné à celui du délégant, révocation tracée, agence administration seule | Proposée (H-A3c-4 à 6, D09 ouverte) |
| D237 | Événements et alertes du lot | EV-06 à EV-08 et EV-47 « les deux » ; EV-46 « agence » ; cinq alertes (une agence seule) | Proposée |
| D238 | Délais de départ | Validation 2 jours ouvrés, arbitrage 3, fin de délégation 2 | À valider (précise D199, D09) |
| D239 | Codes hors catalogue | EV-46, EV-47 à inscrire au doc 26 | À valider |
