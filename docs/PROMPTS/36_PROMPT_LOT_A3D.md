# Lot A3d : rôles de saisie des besoins (qui saisit, pour qui, comment c'est tracé)

Version du 27/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. **Prérequis : A3c fusionné dans main.** Précède A4a. Décision de T. SOEFOU du 23/10/2026, confirmée le 27/10/2026 (compte rendu A3c, D234).

LECTURES : CLAUDE.md, docs/DECISIONS.md (D108, D118, D128, D146, D191, D209, D234 à D239), docs/COMPTE_RENDU_A3C.md (décisions en tête, §4 hypothèses), docs/COMPTE_RENDU_A2A.md et A2B (saisie, doublons, échéances), docs/REGLES_MOUVEMENT_ET_MOBILE.md.

OBJECTIF
Rendre explicite et testé qui peut saisir un besoin, sur quel périmètre, et comment la saisie est tracée. Aucune validation n'est un passage obligé : la saisie remonte à l'agence, la cliente suit le statut (D234).

RÈGLE PAR DÉFAUT (validée)
| Profil | Saisit | Périmètre |
|---|---|---|
| RS | Oui | Son secteur |
| CVR | Oui | Ses secteurs |
| DR et direction cliente | Oui | Leur périmètre |
| Agence (opérateur, administration) | Oui, **pour le compte d'un RS** | Le secteur choisi ; option conservée et tracée |
| Prestataire | Lecture seule | Aucun |

Un besoin saisi par un CVR est marqué « avis donné à la saisie » : son avis managérial est réputé donné, sans passage par un supérieur. Un besoin saisi par un RS reste « à valider » (avis facultatif, jamais bloquant).

ÉTAPES (une à la fois, chacune suivie de sa vérification)
1. État des lieux : lire `ENTRY_PROFILES`, `dispositif-rules.ts`, `entered_by_profile` et `on_behalf` (schémas). Dire ce qui existe déjà et ce qui manque. Ne rien recoder de ce qui est déjà conforme.
2. Droits de saisie dans la couche de données (jamais seulement dans l'écran, règle de CLAUDE.md) : refus serveur pour un profil ou un périmètre non autorisé, message écrit en français et en anglais.
3. Saisie par le CVR, le DR et la direction : écran de saisie ouvert à ces profils sur leur périmètre, secteur choisi parmi les secteurs autorisés uniquement. Paramètres par dispositif (D128) respectés.
4. « Avis donné à la saisie » : statut d'avis posé à la création quand le saisissant est un CVR ; événement d'audit ; visible de la cliente et de l'agence ; jamais de coût ni de note interne côté cliente.
5. Saisie pour le compte d'un RS par l'agence : champ du secteur et du RS obligatoire, événement distinct tracé (qui, pour qui, quand), indicateur visible dans la liste et dans le dossier. Pas de saisie « pour le compte » par un autre profil.
6. Cohérence avec doublons, semaines, échéances et blocage (A2a, A2b) : mêmes règles quel que soit le saisissant. Test de non-régression.
7. Libellés par `ZoneLabel` pour toute zone ; FR et EN (règle 15) ; états vide, chargement, erreur et conflit ; clavier complet ; 44 px.

HORS LOT : validation et escalade (A3c, fait), budgets (A4b1), tableau de bord (A4a), notifications (A4g), tout changement de design.

CRITÈRES
1. Commandes de contrôle exécutées (typecheck, lint, test, build, test:e2e), sortie reportée ; C3 selon la règle 18 ; le test de garde mouvement et mobile passe.
2. Tests : matrice profil par périmètre par action (accepté / refusé côté données), saisie CVR « avis donné à la saisie », saisie pour le compte d'un RS tracée, audience (la cliente ne lit ni coût ni note interne), FR et EN, aucune requête externe.
3. Captures docs/captures/A3d/ (FR et EN, 1440 et 390 px, clair et sombre) ; navigateurs réellement testés listés ; Safari iOS et Android déclarés non testés s'ils ne l'ont pas été.
4. Aucune donnée réelle ; aucune requête externe ; aucune dépendance ajoutée.
5. docs/COMPTE_RENDU_A3D.md (réalisé, non réalisé, écarts, hypothèses, questions) ; mise à jour proposée du registre avec des numéros après le dernier du registre dans `main` au lancement (D239 au 27/10/2026, sauf ajouts depuis), sans réutiliser D212 à D214, D230 à D233.
6. Aucun commit sur main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
