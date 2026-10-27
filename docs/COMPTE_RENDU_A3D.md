# Compte rendu du lot A3d : rôles de saisie des besoins (qui saisit, pour qui, comment c'est tracé)

Date : 23/10/2026 (horloge de démonstration). Données exclusivement fictives. `docs/DECISIONS.md` non modifié (mise à jour proposée au §7). Aucune pull request, aucun commit sur `main` (D148). Aucune dépendance ajoutée, aucune requête externe, aucun fichier de données réelles lu.

**C3 : non exécuté** (`.denylist.local` absent). Le lot ne se déclare pas conforme à C3 ; à exécuter sur le poste ou en revue (règle 18).

## 0. Départ
Prérequis vérifiés : A3c fusionné dans `main` (817b25d), compte rendu A3C présent, D234 à D239 inscrites (dernier numéro du registre : D239). Branche de session repartie de `origin/main`. Départ avant modification : tests verts (voir A3c).

## 1. État des lieux (étape 1, constat vérifié dans le code)
| Élément | Avant A3d | Suite |
|---|---|---|
| Qui saisit | RS, agence opération, agence administration (`WRITE_PROFILES`, `ENTRY_PROFILES`) | CVR, DR, direction ajoutés |
| Saisie pour le compte d'un RS | `on_behalf = (profil ≠ RS)` : aurait été vrai pour tout nouveau profil | réservé à l'agence, par la matrice |
| Indicateur « saisi pour le RS » | dans la liste des besoins, absent du dossier | ajouté au dossier ; événement distinct |
| Contrôle de périmètre à la saisie | déjà serveur (`out_of_scope`, magasins du secteur) | inchangé, vérifié pour les nouveaux profils |
| Règle P6 (rôles par dispositif), doublons, semaines, échéances | déjà serveur, indépendants du profil | inchangés ; options de rôles étendues |
| Messages de refus FR et EN | présents (`forbidden`, `out_of_scope`) | réutilisés |

## 2. Réalisé
| Étape | Résultat |
|---|---|
| 2. Droits côté données | Module pur `src/domain/entry-rights.ts` (matrice : saisit, pour le compte, avis à la saisie). La couche de données refuse `forbidden` (prestataire) et `out_of_scope` (secteur hors périmètre), pour la saisie, le brouillon, le lot et la reprise de brouillon. |
| 3. Saisie CVR, DR, direction | Écran de saisie ouvert, secteur choisi parmi les seuls secteurs du périmètre propre (jamais celui d'un délégant : la saisie n'est pas déléguée). Paramètres par dispositif respectés ; les rôles de saisie par dispositif (D128) proposent désormais CVR, DR et direction. |
| 4. Avis donné à la saisie | À la soumission par un CVR (niveau CVR) ou un DR ou la direction (niveau DR) : avis « validé », ligne au dossier marquée `at_entry`, événement EV-49 (audience les deux), libellé « Avis du CVR donné à la saisie ». Un brouillon n'en porte aucun avant sa soumission. Le RS et l'agence restent « à valider » (facultatif, jamais bloquant, D234). |
| 5. Saisie pour le compte d'un RS | Agence seule ; secteur obligatoire (le RS est celui du secteur choisi) ; EV-48 distinct (qui, secteur, date) ; indicateur dans la liste et dans le dossier. Aucun autre profil ne saisit pour le compte d'un autre (testé). |
| 6. Cohérence | Mêmes règles quel que soit le saisissant : doublon exact, échéance dépassée, P6 (testés pour RS, CVR, DR, direction, agence). La nouvelle soumission d'un besoin refusé reste réservée au RS et à l'agence. La saisie est annulable (D159). |
| 7. Écrans | `ZoneLabel` partout, FR et EN, états vide, chargement, erreur inchangés, 390 px sans défilement horizontal, cibles de 44 px (testés sur la saisie). |

## 3. Contrôles exécutés (sortie réelle)
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | 0 erreur |
| `npx eslint .` | 0 erreur, 0 avertissement |
| `npx vitest run` | **35 fichiers, 807 tests passés**, 1 ignoré (C3), 2 « todo » |
| Test de garde mouvement et mobile (`motion-mobile-rules.test.ts`) | 10 passés, 2 « todo » (règles de mouvement et de mobile qui ne s'appliquent pas encore) |
| `npm run build` | réussi |
| `npx playwright test` | **132 passés sur 132** (122 existants, dont 3 attentes mises à jour à la nouvelle matrice, plus 10 nouveaux) |
| Performance H3 (`a3d-isolated`) | saisie : premier affichage 236 à 466 ms (seuil 2 s) ; interaction 0,6 ms (seuil 100 ms). Serveur local de production. |
| Captures `tests/shots/a3d-isolated.spec.ts` | 1 test passé, 56 images, console et requêtes externes vides |
| C1, C2, C4 à C7 | tests d'architecture unitaires verts |

Nouveaux tests : `entry-rights.test.ts` (matrice), `a3d-repository.test.ts` (31 : matrice profil par périmètre par action, avis à la saisie, saisie pour le compte tracée, audience, mêmes règles, annulation), `a3d-isolated.spec.ts` (10 e2e sur un serveur dédié, neuf à chaque lancement, port 3103 ; ordre à respecter : `demo:accounts`, `build`, puis `playwright test`).
Tests existants mis à jour parce que l'ancienne règle disait « le CVR, le DR et la direction ne saisissent pas » : `needs-repository`, `a2b-repository`, `needs.spec`, `shell.spec`.

Captures `docs/captures/A3d/` : saisie (CVR, DR, direction, agence) et listes avant et après, dossiers, lecture seule du prestataire, FR et EN, 1440 et 390 px, clair ; sombre pour la saisie du CVR et les dossiers saisis par le CVR et par l'agence. **Relues : 2 sur 56** (dossier du CVR en sombre à 1440 px, saisie du CVR à 390 px) ; les autres sont produites sans erreur de console, non relues une à une. Navigateur réellement testé : Chromium (Playwright). Firefox, Safari bureau, Safari iOS et Android : **non testés** ; aucun écran vérifié sur appareil réel (N10).

## 4. Hypothèses (non des décisions)
- H-A3d-1 : le DR et la direction qui saisissent donnent aussi leur avis à la saisie (niveau DR). Le prompt ne le précise que pour le CVR.
- H-A3d-2 : un CVR, un DR ou la direction qui saisit n'est pas « pour le compte » d'un autre : `on_behalf` reste faux.
- H-A3d-3 : EV-48 et EV-49 d'audience « les deux » : la cliente doit pouvoir lire que l'agence a saisi pour son RS.
- H-A3d-4 : un suppléant (délégation A3c) saisit seulement sur son périmètre propre.
- H-A3d-5 : le RS d'une saisie « pour le compte » est celui du secteur choisi (pas de champ RS séparé : un secteur RS a un seul responsable).

## 5. Écarts avec le prompt
- « Champ du secteur et du RS obligatoire » : un seul champ (le secteur) porte les deux, voir H-A3d-5.
- Mode sombre capturé sur les écrans principaux seulement.

## 6. Défauts repérés hors périmètre (non corrigés)
- Même constat qu'en A3c : `demo:accounts` régénère `accounts.json` (non commité) ; les e2e partagés (port 3100) mutent un serveur commun.
- Sur 390 px, la capture « pleine page » montre la barre d'onglets mobile superposée au contenu (effet de capture, déjà vu en A3).

## 7. Mise à jour du registre proposée (non inscrite ; numéros après D239)
| N° proposé | Sujet | Contenu | Statut proposé |
|---|---|---|---|
| D240 | Droits de saisie des besoins | RS sur son secteur, CVR sur ses secteurs, DR et direction sur leur périmètre, agence pour le compte d'un RS (option conservée, tracée), prestataire en lecture seule ; contrôle côté données | Proposée (règle validée le 23/10 et le 27/10/2026) |
| D241 | Avis donné à la saisie | Un CVR (niveau CVR), un DR ou la direction (niveau DR) qui saisit donne son avis à la soumission, sans supérieur ; EV-49 ; le RS et l'agence restent « à valider », facultatif | Proposée (H-A3d-1) |
| D242 | Saisie pour le compte d'un RS | Agence seule, EV-48 (qui, secteur, date), indicateur liste et dossier, audience les deux | Proposée (H-A3d-3) |
| D243 | Codes hors catalogue | EV-48 et EV-49 à inscrire au doc 26 | À valider |

## 8. Questions pour T. SOEFOU
1. Valider H-A3d-1 : le DR et la direction donnent-ils aussi leur avis à la saisie ?
2. La cliente doit-elle lire l'événement « saisi pour le compte d'un RS » (H-A3d-3) ?
3. Un suppléant doit-il pouvoir saisir pour le périmètre de son délégant (H-A3d-4) ?

## 9. Suite
Lot suivant de l'ordre : **A4b1** (budgets), après votre validation écrite de ce compte rendu. Je n'enchaîne pas.
