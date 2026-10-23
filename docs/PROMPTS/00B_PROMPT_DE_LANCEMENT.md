# SUNTORY REFONTE V3 · Prompt de lancement de Claude Code (prêt à coller)

Version de travail du 23/10/2026. À coller **en premier** dans la première session ouverte dans `08_PLATEFORME_SUNTORY_V3`, **après** `02_PROMPT_MAITRE_DEV.md` et **avant** le prompt du lot (`05B_PROMPT_LOT_A0B.md`, puis `06_PROMPT_LOT_A1.md`). Il fixe l'usage des connecteurs (GitHub, Supabase, Vercel) pour toute la durée de l'étape A.

```text
LANCEMENT · PLATEFORME SUNTORY REFONTE V3

SITUATION
Dépôt : 08_PLATEFORME_SUNTORY_V3 (CLAUDE.md, docs/DECISIONS.md D01 à D113, documents du lot A0).
Sources : REFONTE_V3 en lecture seule. Étape A uniquement : démonstrateur sur données fictives.
Ordre des lots décidé : A0b (documents), puis A1 (premier code), puis A2a, A2b, A3, A4a, A5, A6, A7
(noyau du 10/11, D110). Un lot = une session ; je valide chaque compte rendu avant le suivant.

CONNECTEURS ACTIVÉS SUR MON COMPTE : GITHUB, SUPABASE, VERCEL. RÈGLES D'USAGE
- GitHub : lecture seulement tant que je ne le demande pas. Aucun commit, push, branche distante,
  pull request, issue ni commentaire sans ma demande explicite pour cette action.
- Supabase : INTERDIT à l'étape A (la base réelle est l'étape B, interdite sans « feu vert B »
  dans docs/DECISIONS.md). Ne crée aucun projet, aucune base, aucune table, aucune clé, aucune
  fonction ; ne lis aucun projet existant.
- Vercel : INTERDIT tant que l'hébergement n'est pas décidé (D02, D19). Aucun déploiement, aucun
  projet, aucune variable d'environnement, aucun lien de prévisualisation. Le démonstrateur
  tourne en local (D104).
- Tout autre connecteur ou service externe : non utilisé sans ma demande.
- Si une tâche semble exiger un de ces connecteurs, arrête-toi et pose la question.

DONNÉES
- Données fictives uniquement. Seule exception : D109 bis (découpe géographique locale, hors dépôt,
  jamais dans un prompt, un journal, une capture ni un compte rendu). Elle ne concerne pas A0b ni A1.
- Interdit en lecture : classeurs Excel et CSV de 01_SOURCE_SAISONNIER, 02_SAISIE_PARTAGEE,
  04_TBB_SBFF et du dossier FICHIERS POUR DEPARTEMENTS ; fichiers data_real*, ref_reel*,
  ref_magasins*, communes_*, *_pack.js. Si une information de structure te manque : liste-la dans
  tes questions, je fournirai un squelette sans données.
- Si une valeur réelle apparaît par erreur dans une sortie, signale-le immédiatement et ne la
  recopie nulle part.

MÉTHODE (rappel)
Réfléchir avant de produire ; énoncer le critère de réussite avant chaque étape ; modifications
chirurgicales ; « terminé » exige une preuve ; un test non lancé n'est pas déclaré passé ; une
hypothèse n'est pas une décision ; propose les mises à jour du registre (« mise à jour proposée »),
ne les enregistre pas. Aperçu visuel à chaque étape de code (D104).

PREMIÈRE ACTION
1. Lis CLAUDE.md, docs/DECISIONS.md et docs/COMPTE_RENDU_A0.md.
2. Annonce en dix lignes : ce que tu as lu, l'état réel du dépôt, les décisions ouvertes qui touchent
   le lot demandé, et les connecteurs que tu n'utiliseras pas.
3. Attends le prompt du lot que je colle ensuite. N'agis pas avant.
```
