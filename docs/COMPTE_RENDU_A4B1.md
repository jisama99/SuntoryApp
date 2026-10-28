# Compte rendu du lot A4b1 : enveloppe cliente, allocation de l'agence, prévisionnel par besoin

Date : 28/10/2026 (horloge de démonstration : 23/10/2026). Données exclusivement fictives, montants fictifs en euros hors taxes. `docs/DECISIONS.md` non modifié (mise à jour proposée au §7). Aucune pull request, aucun commit sur `main` (D148). Aucune dépendance ajoutée, aucune requête externe, aucun fichier de données réelles lu. Supabase et Vercel non utilisés.

**C3 : non exécuté** (`.denylist.local` absent). Le lot ne se déclare pas conforme à C3 ; à exécuter sur le poste ou en revue (règle 18).

## 0. Départ
Prérequis vérifiés : D191 et D243 présents (dernier numéro du registre : D243), règles 14, 15 et 16 présentes, branche de session contenant `origin/main` (10ae79b). Base avant modification : `tsc` 0 erreur, `eslint` 0, Vitest 36 fichiers et 811 tests passés.

## 1. Réalisé
| Étape du prompt | Résultat |
|---|---|
| 1. Modèle | Enveloppe versionnée (période, montant, motif, auteur, date), ligne d'allocation (campagne donc dispositif, CVR donc DR), tarif horaire fictif daté et étiqueté. Fixtures : 1 version d'enveloppe (100 000,00 €), 18 lignes, 4 tarifs. Tout passe par le `Repository` avec `AccessContext`. |
| 2. Calcul unique | `src/domain/budget.ts`, module pur en centimes entiers : affecté, consommé, prévisionnel, atterrissage, disponible, couverture (besoins chiffrés sur besoins comptés). Coût inconnu = « Non chiffré », absence de ligne = « Budget non renseigné », jamais 0 ; 0 seulement pour un ensemble réellement vide. |
| 3. Espaces | Direction cliente : saisit l'enveloppe (version, date, motif dès la 2e version). Agence : la lit sans pouvoir la modifier ; alloue en administration ; le total réparti ne dépasse jamais l'enveloppe (au centime). Une version sous le total déjà réparti est refusée. |
| 4. Prévisionnel par besoin | Coût = heures par semaine x semaines ISO touchées x tarif daté. Imputation dérivée du besoin (campagne, CVR) : un changement de périmètre ou de coût la déplace et laisse un événement daté EV-52 (agence). |
| 5. Au-delà du disponible | Autorisé, jamais bloqué (D156) : alerte aux deux côtés (sans montant), événement EV-28 du catalogue, une seule fois par besoin. L'arbitrage lui-même reste à A4b2. |
| 6. Pourvu | Le coût passe du prévisionnel au consommé quand le poste est démarré (état « En poste » de A3). Testé : atterrissage et disponible inchangés. |
| 7. Journal | EV-50 (enveloppe, agence seule), EV-51 (allocation, les deux côtés, motif, ancien et nouveau montant), EV-52, EV-28. Écran Journal. |
| 7 bis. Jetons de graphique | `src/app/chart-tokens.css` : jeu B et style Doux par défaut, variantes sombres, jetons de forme des bouts ; barres de l'écran lisent ces jetons. Tests de contraste. |
| 8. Navigation et anglais | Cinq écrans (Situation, Enveloppe, Répartition, Prévisionnel par besoin, Journal), regroupement, tri et filtres dans l'URL, états chargement, vide, erreur, FR et EN, 390 px, cibles de 44 px. |

Branchement A3c : le point d'entrée « hors enveloppe » du CVR lit désormais le budget de la maille (`exceeded` si le besoin fait dépasser, `within`, sinon `not_evaluated`). Hypothèse H-A4b1-1 (D43 reste ouverte).

## 2. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint .` | 0 erreur, 0 avertissement |
| `npx vitest run` | **40 fichiers, 913 tests passés**, 1 ignoré (C3), 2 « todo » (4 fichiers et 102 tests ajoutés) |
| `npm run build` | réussi |
| `npx playwright test` | **146 passés sur 146** (134 existants dont 1 attente mise à jour, 12 nouveaux dans `a4b1-isolated`, serveur dédié port 3104, neuf à chaque lancement) |
| Performance H3 | budget : premier affichage 305 à 411 ms (seuil 2 s) ; saisie réactive 4,8 à 12,5 ms (seuil 100 ms) ; changement d'onglet 194 à 467 ms (aller-retour serveur, seuil 2 s retenu) |
| C1, C2, C4 à C7 | tests d'architecture unitaires verts |
| Captures `tests/shots/a4b1-isolated.spec.ts` | 1 test passé, 66 images dans `docs/captures/A4b1/`, console et requêtes externes vides |

Ordre à respecter pour les e2e : `demo:accounts`, `build`, puis `playwright test` (identique à A3c et A3d). `demo:accounts` régénère `accounts.json`, restauré avant commit.

Tests ajoutés : `budget.test.ts` (29, domaine), `a4b1-repository.test.ts` (38 : borne de l'enveloppe, agence sans droit sur l'enveloppe, dépassement sans blocage, pourvu consommé, tout tracé, audience par profil, déplacement d'imputation, annulation), `chart-tokens.test.ts` (13), `money.test.ts` (23). Test existant mis à jour : A3c (unitaire et e2e) attendait « non évalué » par défaut.

Captures : **relues 3 sur 66** (situation de l'agence 1440 avant et après correction, situation de la direction 390 en sombre). Les autres sont produites sans erreur de console, non relues une à une. Une capture a révélé un tableau trop large (colonnes DR et dispositif), corrigé. Navigateur réellement testé : Chromium (Playwright). Firefox, Safari, appareils réels : non testés (N10).

## 3. Hypothèses (non des décisions)
- H-A4b1-1 : « hors enveloppe » = un besoin fait dépasser le montant alloué à sa maille (campagne, CVR), les besoins étant cumulés dans l'ordre de soumission.
- H-A4b1-2 : « poste pourvu » = poste démarré (« En poste »). Le coût passe en bloc au consommé, sans prorata ni réalisé valorisé (D05 ouverte).
- H-A4b1-3 : sont comptés les besoins soumis, hors refusés par la chaîne managériale, écartés par l'agence ou stoppés ; les brouillons n'y entrent jamais.
- H-A4b1-4 : seule la direction cliente saisit l'enveloppe ; le DR et le CVR ne la lisent pas. Une seule enveloppe courante (la dernière version), période informative.
- H-A4b1-5 : par défaut, la cliente ne lit aucun coût (consommé, prévisionnel, atterrissage, disponible, coût par besoin) ; elle lit enveloppe, répartition et alertes sans montant. Le CVR et le RS n'ont aucun accès au budget, sauf le statut « hors enveloppe » dans le panneau de validation (sans montant).
- H-A4b1-6 : une version d'enveloppe inférieure au total déjà réparti est refusée (la réduction passera par A4b2).
- H-A4b1-7 : tarifs fictifs 23,40 / 25,10 / 27,80 / 24,70 € de l'heure, datés du 01/01/2026.
- H-A4b1-8 : séries 5 et 6 du jeu B empruntées au jeu C.

## 4. Écarts avec le prompt
- Arbitrage d'un dépassement : alerte et trace faites, l'écran d'arbitrage est hors périmètre (A4b2).
- Aucun écran ne modifie aujourd'hui le secteur ou la campagne d'un besoin soumis : le déplacement d'imputation est vérifié par simulation de données dans le test unitaire, pas par un parcours d'écran.
- Jeu B : la série 3 (2,06:1) et la série 4 (2,997:1, soit 0,003 sous 3:1) n'atteignent pas 3:1 sur carte blanche ; elles ne sont pas employées (barres en séries 1, 2, 5, 6) ; valeurs à confirmer à l'écran (D213).
- Accès du DR et du CVR au mode présentation : non décidé, non traité (A4a).

## 5. Défauts repérés hors périmètre (non corrigés)
- Même constat qu'en A3c et A3d pour `demo:accounts` et les e2e partagés (port 3100).
- Un `notFound()` sous un `loading.tsx` de niveau supérieur répond 200 : les sections gardées ont donc leur propre `loading.tsx` sous leur layout (garde au-dessus du chargement).

## 6. Vérifications non exécutées
C3 ; Firefox, Safari, appareils réels ; captures non relues (63 sur 66).

## 7. Mise à jour du registre proposée (non inscrite ; numéros après D243)
| N° proposé | Sujet | Contenu | Statut proposé |
|---|---|---|---|
| D244 | Règle « hors enveloppe » | Un besoin est hors enveloppe quand il fait dépasser le montant alloué à sa maille (campagne, CVR), cumul par ordre de soumission ; coût inconnu ou maille sans ligne : non évalué (H-A4b1-1). Précise D43 | Proposée |
| D245 | Consommé et pourvu | Le coût estimé d'un besoin passe du prévisionnel au consommé au poste démarré, sans prorata (H-A4b1-2) | Proposée |
| D246 | Visibilité des coûts | La cliente lit enveloppe, répartition et alertes sans montant ; les mesures de coût et le coût par besoin sont réservés à l'agence ; le CVR et le RS ne lisent pas le budget (H-A4b1-4 et 5) | Proposée |
| D247 | Enveloppe et réduction | Seule la direction cliente saisit ; une version sous le total réparti est refusée (H-A4b1-6) | Proposée |
| D248 | Codes d'événement | EV-28 utilisé pour le dépassement ; EV-50, EV-51, EV-52 hors catalogue, à inscrire au doc 26 | À valider |
| D249 | Jetons de graphique | Couche livrée (jeu B, style Doux) ; séries 3 et 4 non employées faute de 3:1 ; séries 5 et 6 en hypothèse | À valider avec D213 et D214 |

## 8. Questions pour T. SOEFOU
1. La cliente doit-elle lire les mesures agrégées (consommé, prévisionnel, disponible) pour la jauge du cockpit de A4a (D154) ?
2. Le CVR voit-il « hors enveloppe » dans le panneau de validation sans autre accès au budget (état actuel) ?
3. Qui arbitre un besoin au-delà du disponible (cliente, DR, agence) avant A4b2 ?
4. Valider les tarifs fictifs et la période de l'enveloppe fictive.

## 9. Suite
Lot suivant : **A4a**, après votre validation écrite de ce compte rendu. Je n'enchaîne pas.
