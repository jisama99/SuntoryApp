# SUNTORY REFONTE V3 · Index des lots et ordre de lancement

Version du 23/10/2026. État : A0, A0b et A1 (avec A1 bis, ter et quater : direction visuelle, mode sombre, icônes, tuiles colorées) livrés et poussés. Les prompts ci-dessous sont prêts ; chaque lot = une session Claude Code et une validation de T. SOEFOU avant le suivant. Aucune durée n'est estimée.

## 1. Ordre de lancement (noyau de la démonstration du 10/11/2026, D110)

| Ordre | Lot | Prompt | Dépend de | Bloquants connus (hypothèse retenue) | Validation attendue avant le suivant |
|---|---|---|---|---|---|
| 1 | A2a | `10_PROMPT_LOT_A2A.md` | A1 | Règles W et D retrouvées (`docs/REGLES_SEMAINE_ET_DOUBLONS_V0.4.md`) ; Q6 à Q8, D22 / Q7 (valeurs par défaut) | Tests W1 à W22 et D1 à D7, captures |
| 2 | A2b | `11_PROMPT_LOT_A2B.md` | A2a | D80 (date de novembre), D82 proposée (Standard, cascade, report) ; paramètres par dispositif ajoutés (D128, Q-N9-1 à Q-N9-5) | Blocage après échéance et alertes par audience |
| 2 bis | A1e | `24_PROMPT_LOT_A1E.md` | A2b | D160 à D163 | Titres, visuels, skin d'accueil |
| 2 ter | A1f | `28_PROMPT_LOT_A1F.md` | A1e | D188, D189 | Connexion identifiant et mot de passe, trousseau, comptes gérés par l'agence |
| 3 | A3 | `12_PROMPT_LOT_A3.md` | A2b | Table de correspondance des anciens statuts (D11), D93 à D97 | Scénarios refus, remplacement, deux propositions |
| 3 bis | A3c | `33_PROMPT_LOT_A3C.md` | A3 | D09 ouverte ; enveloppe branchée en A4b1 | Circuit CVR, DR, délégations, audience |
| 3 ter | A3d | `36_PROMPT_LOT_A3D.md` | A3c | Aucun (décision du 23/10/2026, confirmée le 27/10/2026 : D234) | Matrice des droits de saisie, saisie CVR « avis donné à la saisie », saisie pour le compte d'un RS tracée |
| 4 bis | A4b1 | `23_PROMPT_LOT_A4B1.md` | A3 | D07 (montants réels) ; D153 à D157 | Enveloppe cliente, allocation agence, prévisionnel par besoin |
| 4 | A4a | `13_PROMPT_LOT_A4A.md` | A3, A3d | D05 (consommé : montants fictifs), P3 (graphiques, décidé dans le lot) ; comparaison N / N-1 ajoutée (D127) | Tableau de bord par rôle, audience des alertes |
| 5 | A5 | `14_PROMPT_LOT_A5.md` | A3 | D14 et D15 (hors ligne simulé), Q19 | Parcours mobile, absences génériques |
| 5 bis | A4f | `30_PROMPT_LOT_A4F.md` | A5 | D190 | Vue Planning : frise, calendrier, jour, mois, magasins liés, recrutements |
| 5 ter | A4g | `32_PROMPT_LOT_A4G.md` | A3, A4a, A4f | Alertes obligatoires, heures calmes (hypothèses) ; push et e-mail simulés | Préférences par type et canal, audience, file push à valider |
| 5 quater | A4h | `34_PROMPT_LOT_A4H.md` | A3, A4a, A4b1 | Seuil budget 90 % (hypothèse) ; navigateurs mobiles réels non testés | Tableau et Kanban des recrutements, filtres, pastilles budget, journal agence |
| 5 quinquies | A9r | `35_PROMPT_LOT_A9R.md` | A3c | Réglages tactiles : comportement uniquement, sans changement de design ; champs 16 px et `theme-color` soumis à accord (règles M et N) | Écarts N1, N2, N4, N5 corrigés, captures avant et après, appareils réels déclarés |
| 6 | A6 | `15_PROMPT_LOT_A6.md` | A2 | D51, D24, P4 (bibliothèque Excel) ; profils d'import configurables (D134, Q-I1 à Q-I6) | Idempotence et conflits d'import |
| 7 | A7 | `16_PROMPT_LOT_A7.md` | A1 à A6 | Hébergement local par défaut, accord d'usage de la découpe | Script de démonstration, Q1 à Q23 |

## 2. Seconde démonstration (hors noyau)

| Lot | Prompt | Dépend de | Bloquants connus |
|---|---|---|---|
| A4d | `21_PROMPT_LOT_A4D.md` | A3, A4a, A5 | Q-N1-1 (D08), Q-N3-1 | Fiche secteur et plans d'action |
| A4e | `22_PROMPT_LOT_A4E.md` | A4a | Aucun bloquant (D152) ; choix du jeu de contours |
| A4b2 | `17_PROMPT_LOT_A4B.md` | A4b1, A4a | D43 et D46 (règles d'allocation), D05 à D07 |
| A4c1 | `18_PROMPT_LOT_A4C1.md` | A4a, A4b | D61 et D69 (gabarit COPIL), D25 et D75 (droits logos et photo), D83 |
| A4c2 | `19_PROMPT_LOT_A4C2.md` | A4c1 | D93, D94, D96 |
| A5b | `20_PROMPT_LOT_A5B.md` | A5 | D101 (enseignes), D102 (durée de conservation) |

## 3. Comment lancer un lot dans Claude Code
1. Sur le poste : `npm install`, `npx playwright install chromium`, puis `npm run typecheck`, `lint`, `test`, `test:e2e`, `build` doivent passer avant toute modification (les sources de A1 ont été testées dans une machine virtuelle Linux).
2. Ouvrir Claude Code dans `08_PLATEFORME_SUNTORY_V3`, `REFONTE_V3` en lecture seule, interdictions de lecture de `00_DEMARRAGE_CLAUDE_CODE.md` §2 actives.
3. Coller dans cet ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis le prompt du lot.
4. En fin de lot : relire le compte rendu et les captures, trancher les « mises à jour proposées », puis (à votre demande) commiter et pousser avant d'ouvrir le lot suivant.

## 4. Décisions à prendre côté T. SOEFOU avant ou pendant le noyau
- D107, D108, D118 à D122 et Q-J1 : validées le 23/10/2026 (recommandations suivies).
- Accord d'Impact et de la cliente pour la découpe réelle ; fichier `.denylist.local` pour le contrôle C3 ; référentiels WCAG/RGAA et ASVS (D116) ; choix d'hébergeur (D115, OVHcloud en instruction).
| Après noyau | A8 | `25_PROMPT_LOT_A8.md` | A7 | D164 | Signalement et écran Demandes |
| Après démonstration | A9 | `26_PROMPT_LOT_A9.md` | Démonstration validée, abonnement OVHcloud | D165, D166 | Déploiement, retour arrière, Web Push réel (préparé en A4g) |
