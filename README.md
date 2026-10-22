# Suntory · Plateforme de pilotage merchandising (Refonte V3)

Plateforme web de pilotage (ordinateur) et application de saisie terrain (mobile) pour la mission Suntory. Dépôt du prestataire (profil FREELANCE).

## État
- **Étape A en cours : démonstrateur cliquable sur données fictives**, en français et en anglais.
- **Étape B (MVP, données réelles) : interdite** tant qu'aucun « feu vert B » écrit n'existe dans `docs/DECISIONS.md`.
- Aucun code applicatif à ce jour : le lot A0 (lecture, pile proposée, documents) est le premier lot.

## Lire d'abord
1. `CLAUDE.md` : règles permanentes, vocabulaire, méthode.
2. `docs/DECISIONS.md` : positions arrêtées, points à valider, points ouverts.
3. `docs/PROMPTS/` : prompt maître, lots A0 à A7 et B0 à B9, jeux d'essai, prompt du lot A0.

## Lancer un lot avec Claude Code
1. Donner accès à `REFONTE_V3` en lecture seule.
2. Coller `docs/PROMPTS/02_PROMPT_MAITRE_DEV.md`, puis le prompt du lot (`05_PROMPT_LOT_A0.md` pour A0).
3. Valider le compte rendu du lot avant d'ouvrir le suivant.

## Règles à retenir
- Aucune donnée réelle (client, magasin, intervenant, tarif, budget) dans le dépôt : le `.gitignore` bloque les classeurs et les CSV.
- Aucun secret dans le dépôt.
- Pas de commit, push ni pull request sans demande explicite.
