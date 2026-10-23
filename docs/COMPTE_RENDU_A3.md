# Compte rendu du lot A3 : propositions, décisions, qui doit agir, entonnoir

Date : 23/10/2026 (horloge de démonstration). Données exclusivement fictives (`is_demo = true`). `docs/DECISIONS.md` n'a pas été modifié : les mises à jour du registre sont proposées au §8, sans être inscrites. Aucune pull request (D148). Supabase, Vercel et tout appel réseau : non utilisés. Aucun fichier de données réelles lu.

## 0. Départ
Branche de session contenant `origin/main` (vérifié), D191 présent au registre, règles 14, 15 et 16 présentes. Départ avant modification : `typecheck` et `lint` sans erreur, 561 tests unitaires passés (1 ignoré), build, **98 tests e2e passés** (après `npm run demo:accounts`, dont le fichier de mots de passe est local et non versionné ; sans lui, 95 e2e échouent par construction). `src/data/fixtures/accounts.json` régénéré par ce script n'est **pas** inclus dans le commit.

## 1. Réalisé
| Étape | Résultat |
|---|---|
| 1. Statuts séparés | Quatre dimensions stockées et affichées à part : besoin (brouillon, soumis + qualification : à qualifier, pris en charge, précision demandée, rejeté), proposition (en préparation, envoyée, retirée, remplacée), recrutement (jalons datés, entonnoir D92 déduit), exécution (statut de poste à 9 valeurs calculé, prise de poste, remise du véhicule). Jamais de champ unique. |
| 2. Proposition versionnée | Version n+1 à chaque envoi ; décision liée à une version ; éléments déterminants (intervenant, heures, jours, créneau, période, magasins) ; écart au besoin calculé et à expliquer ; une version sans changement déterminant est refusée ; l'envoi invalide les décisions de la version précédente (EV-12) ; une modification du besoin soumis après accord invalide aussi l'accord ; rien n'est effacé. |
| 3. Prise de poste et véhicule | Deux jalons et deux événements (EV-16, EV-17) ; « En poste » seulement à la date de prise de poste atteinte ; facturable à partir de la prise de poste (agence seule). Table de correspondance : reprise de `STATUTS_ET_ETATS.md` §2, **toujours provisoire** (D11). |
| 4. Qui doit agir | Acteur, action, échéance en jours ouvrés, urgence (en retard, urgent, bientôt, dans les temps), retard de proposition ; validation en lot avec motif commun. L'échéance interne de l'agence n'est pas communiquée à la cliente (D108). |
| 5. Entonnoir | 6 états, hors entonnoir à part (à qualifier, stoppé avec motif, rejeté, zone blanche, réattribué), taux d'heures sans zone blanche ni stoppés, taux nul rendu « Donnée indisponible », refus et désistements comptés (D97), délais J1 à J4 par situation (médiane, étendue, effectif, « effectif trop faible » sous 5), âge de vacance des zones blanches. |
| 6. Événements | EV-09 à EV-21 émis avec audience ; EV-44 (note) et EV-45 (proposition retirée) hors catalogue. |
| 7. Écrans | `/proposals` (à traiter), `/proposals/[id]` (fil du besoin), `/proposals/funnel` ; section « Propositions et décisions » de la page Alertes. FR et EN. |
| 8. Captures | `docs/captures/A3/` : 40 images (FR et EN, 1440 et 390 px, parcours besoin → proposition → décision → refus → nouvelle proposition, mode sombre sur la liste). |
| Notes (D162) | Fil de notes sur propositions et décisions : interne par défaut, badge de visibilité, confirmation avant partage, retrait avec trace sans retour à l'interne, destinataire désigné, audience par défaut refusée, événement au journal, filtrage dans la couche de données. |

## 2. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur, 0 avertissement |
| `npx vitest run` | **30 fichiers, 650 tests passés, 1 ignoré** (C3, voir §6) |
| `npm run build` | réussi, routes `/[locale]/proposals`, `/[id]`, `/funnel` |
| `npx playwright test` | **108 passés sur 108** |
| `npx playwright test --config=playwright.shots.config.ts tests/shots/a3.spec.ts` | 7 passés, 40 captures, console et requêtes externes vides |
| Performance H3 (mesurée, `tests/e2e/a3.spec.ts`) | premier affichage utile 353 à 585 ms (seuil 2 s) ; interaction 0,8 à 1,0 ms (seuil 100 ms). Mesure en serveur local de production, non représentative d'un hébergement. |
| C1 à C7 (`docs/FIXTURES.md` §5) | tests unitaires d'architecture verts ; **C3 non exécuté** : `.denylist.local` absent |

Nouveaux tests : `tests/unit/pipeline.test.ts` (45, règles pures), `tests/unit/a3-repository.test.ts` (44 : scénarios refus, modification après accord, remplacement, deux propositions ; droits ; lot ; notes ; audience de tous les événements et alertes ; annulation), `tests/e2e/a3.spec.ts` (10 : URL, retour arrière, rechargement, lien profond, 404, 390 px, 44 px, EN, audience, parcours complet). Une assertion de `a1f.test.ts` a été précisée (elle filtrait `EV-4*` au lieu de `EV-40` à `EV-43`, collision avec EV-44 et EV-45).

## 3. Non réalisé ou limité
- **Validation CVR et escalade DR des besoins (F-30.1, F-30.2, EV-06 à EV-08)** : absentes des étapes du prompt, non codées. Un besoin soumis est traité comme déjà validé par la chaîne managériale (hypothèse H-A3-1).
- Délégations et suppléants (F-30.3, D09 ouvert) : non codés.
- **« Même jour, une heure plus tard »** (étape 5) : aucune source du dépôt ne définit ces situations (seule `doc 26 §7.3` : recrutement nouveau, réattribution, zone blanche). Non inventées ; j'ai mesuré les trois situations de la doc 26. À définir.
- Pas d'édition des paramètres de délai à l'écran (valeurs de départ en code, paramétrables par le dépôt de données).
- Notes : écriture réservée à l'agence ; la cliente lit seulement. Aucun export n'existe : la règle « absente des exports cliente » est tenue par la couche de données (test), pas par un export.
- Scission A3a / A3b : non nécessaire.
- Captures : j'ai relu visuellement la liste agence, la liste CVR, la fiche d'un besoin remplacé, l'entonnoir et le parcours mobile EN ; les autres captures sont produites et sans erreur de console, **non relues une à une**. Mode sombre : liste CVR seulement.

## 4. Hypothèses à valider (non des décisions)
- H-A3-1 : un besoin soumis est réputé validé par la chaîne cliente ; l'agence le qualifie ensuite.
- H-A3-2 : délais cibles de départ en jours ouvrés : qualification 2, proposition 5 depuis la soumission, décision 5 depuis l'envoi ; urgent à 2 jours ouvrés, bientôt à 5 ; effectif minimal 5.
- H-A3-3 : délais J1 à J4 en jours calendaires.
- H-A3-4 : une version doit changer un élément déterminant, sauf si le besoin a changé depuis (renvoi de confirmation autorisé) ; un refus ou une révision de la version précédente est invalidé par l'envoi (uniformité avec EV-12).
- H-A3-5 : un seul accord en vigueur par version ; une décision prise ne se modifie pas côté cliente (la révision passe par l'agence).
- H-A3-6 : envoyer une proposition sans recherche commencée la déclenche (EV-13 marqué implicite).
- H-A3-7 : désistement avant prise de poste, rupture après ; les deux ramènent à « En recrutement » avec compteur, retirent la proposition envoyée et invalident son accord.
- H-A3-8 : stoppé et zone blanche sortent du taux d'heures (doc 26 §11 point 5 reste ouvert pour « stoppé »).
- H-A3-9 : le chiffrage d'une proposition (complet, partiel, non chiffré) est réservé à l'agence ; aucun montant en A3.
- H-A3-10 : une note adressée à un destinataire n'est lisible que par ce destinataire (même niveau, même zone) et l'agence ; son événement reste d'audience agence.
- H-A3-11 : EV-10 n'embarque pas le coût (le doc 26 le prévoit) : le chiffrage ne doit pas atteindre la cliente par le journal.
- H-A3-12 : le RS enregistre prise de poste et remise du véhicule sur son secteur (F-30.8).

## 5. Écarts avec les documents
EV-10 sans coût (H-A3-11) ; EV-44 et EV-45 hors catalogue ; menu « Réponses de l'agence » (A1e) conservé pour l'entrée, titre de page « Propositions et décisions ».

## 6. Défauts repérés hors périmètre (non corrigés)
- Annulation (D159) : la restauration d'instantané est globale ; deux écritures concurrentes rendent l'annulation impossible. Les tests e2e partagent un serveur : l'assertion d'annulation du lot accepte les deux issues.
- `npm run demo:accounts` régénère `accounts.json` à chaque lancement, donc le dépôt change à chaque préparation des tests e2e.
- Le tableau (`DataTable`) limite sa hauteur : sur la liste agence, la dernière ligne visible est coupée jusqu'au défilement.

## 7. Questions pour T. SOEFOU
1. Valider H-A3-1 : faut-il coder la validation CVR et l'escalade DR avant A4a ?
2. Définir « même jour » et « une heure plus tard » comme situations de délai.
3. Valeurs des délais cibles de proposition et de décision (H-A3-2).
4. La cliente peut-elle écrire des notes et réviser sa propre décision ?
5. Le stoppé sort-il du taux (doc 26 §11 point 5) ?
6. Table de correspondance des anciens statuts : validation avec la cliente (D11).

## 8. Mise à jour du registre proposée (non inscrite)
| N° proposé | Sujet | Contenu | Statut proposé |
|---|---|---|---|
| D197 | Dimensions du circuit | Besoin (qualification agence), proposition, recrutement, exécution : stockées à part ; entonnoir et statut de poste calculés | Proposée |
| D198 | Versions et accords | Version n+1 à éléments déterminants changés ; l'envoi ou le retrait ou la modification du besoin invalide l'accord, jamais en silence (EV-12) | Proposée (H-A3-4, 5) |
| D199 | Délais cibles et seuils | Valeurs de départ H-A3-2, jours ouvrés, paramétrables | À valider (précise D93) |
| D200 | Délais par situation | J1 à J4 en jours calendaires, trois situations de la doc 26, effectif minimal 5 | Proposée (H-A3-3) |
| D201 | Audience du circuit | EV-09 à EV-21 et EV-45 d'audience « les deux » ; chiffrage et échéances internes d'agence invisibles de la cliente ; alertes de retard de proposition et de chiffrage d'audience agence | Proposée (H-A3-9, 11) |
| D202 | Notes D162 | Écriture agence, visibilité à trois niveaux, destinataire exact, EV-44 hors catalogue, événement agence pour interne et destinataire | Proposée (H-A3-10) |
| D203 | Désistement et rupture | EV-21 : désistement avant prise de poste, rupture après ; retour à « En recrutement » | Proposée (H-A3-7) |
| D204 | Codes hors catalogue | EV-44 note, EV-45 proposition retirée, à inscrire au doc 26 | À valider |

## 9. Suite
Aucun chaînage vers A4a. Avant A4a : réponses aux questions 1, 2 et 5 (elles pilotent les indicateurs), validation écrite de ce compte rendu.
