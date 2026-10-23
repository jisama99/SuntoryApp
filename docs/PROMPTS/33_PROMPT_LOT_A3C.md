# Lot A3c : validation managériale CVR, escalade DR, délégations, qualification agence (F-30.1 à F-30.4)

Version du 23/10/2026. Complète A3 (fusionné). À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. **Prérequis : A3 fusionné dans main.** Le nom A3c évite la confusion avec la scission optionnelle A3a / A3b du plan (propositions / entonnoir), déjà livrées ensemble dans A3. Dépend de A3 ; précède A4b1, qui branche le déclencheur « hors enveloppe ».

OBJECTIF
Le catalogue (doc 16, M3) place en A3 la validation CVR (F-30.1), l'escalade DR (F-30.2), les délégations et suppléants (F-30.3) et la qualification agence (F-30.4). Le prompt A3 ne les listait pas ; le compte rendu A3 signale F-30.1 et F-30.2 comme non codées. Ce lot comble l'écart, sans refonte de A3.

À LIRE AVANT TOUTE ACTION
1. CLAUDE.md, docs/DECISIONS.md (D43, D45, D46, D87, D118, D147, D162, D191 à D196, et D197 à D204 telles que fusionnées), docs/COMPTE_RENDU_A3.md (en entier, y compris §8 et les écarts), docs/COMPLEMENTS_CADRAGE/16 (M3, F-30.1 à F-30.6) et 26, docs/STATUTS_ET_ETATS.md, docs/GLOSSAIRE_FR_EN.md.
2. Vérifie d'abord, par lecture du code, ce qui existe déjà de F-30.1 à F-30.4 dans A3 ; code uniquement ce qui manque et dis ce qui existait.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Circuit de validation : chaîne RS, CVR, DR selon la sectorisation (D45), rattachement par magasin. Le CVR valide dans son périmètre, ou refuse avec motif obligatoire (F-30.1). Aucun nouveau statut unique : le circuit s'ajoute aux statuts séparés de A3.
2. Escalade DR (F-30.2) : cas « arbitrage entre CVR » et cas « hors périmètre ». Le cas « hors enveloppe » est modélisé par un point d'entrée (interface) dont la règle de calcul est branchée en A4b1 ; en attendant, il n'est déclenchable que manuellement par le CVR avec motif. Ne pas inventer de règle d'enveloppe (D43 ouverte).
3. Délégations et suppléants (F-30.3) : suppléant désigné, date d'effet et de fin choisies au calendrier (règle 12), paramétrable par l'agence administration seule, trace complète. Hypothèse : absence d'un CVR ou d'un DR, un seul suppléant à la fois. D09 ouverte : signaler, ne pas figer de délai de réponse.
4. Qualification agence (F-30.4) : prise en charge, demande de précision, rejet motivé ; vérifier la cohérence avec les statuts de proposition de A3.
5. Qui doit agir : intégrer CVR et DR au tableau « à traiter » avec urgence et retard ; validation en lot avec motif commun (F-30.6).
6. Événements avec audience à chaque transition (validation, refus, escalade, délégation, qualification) ; absence côté cliente des événements agence ; ajouter au catalogue des alertes sans créer de notification réelle (A4g les consommera).
7. Écrans : actions dans le fil du besoin et de la proposition, écran Délégations, textes FR et EN, glossaire respecté. Notes D162 sur les nouvelles décisions.
8. Captures docs/captures/A3c/ (CVR valide, CVR refuse avec motif, escalade DR, délégation, qualification agence), FR et EN, 1440 et 390 px.

HORS PÉRIMÈTRE
Règle de calcul d'enveloppe (A4b1), envoi réel de notifications (A4g), indicateurs (A4a), base de données.

BLOCAGES CONNUS (signaler, travailler sur l'hypothèse)
- D09 (RACI, suppléants, délais) ouverte : pas de délai figé.
- Table des anciens statuts (D11) toujours à valider avec la cliente.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées (typecheck, lint, tests, build, e2e), sortie reportée ; C3 exécuté s'il est possible, sinon écrit « non exécuté ».
2. Scénarios testés : CVR valide, CVR refuse puis nouvelle proposition, escalade DR, arbitrage entre deux CVR, délégation pendant une absence, fin de délégation, tentative hors périmètre refusée côté données.
3. Test d'audience sur chaque événement et alerte ; un suppléant n'élargit jamais le périmètre au-delà de celui du délégant.
4. Règles 14 à 16 : état dans l'URL, trois états, cartes sous 640 px, cibles de 44 px, performance reportée, captures 390 px.
5. Tout test e2e est déterministe (serveur ou données isolés) : aucun test qui accepte deux issues contradictoires.
6. docs/COMPTE_RENDU_A3C.md, mise à jour proposée du registre (numéros après le dernier).
7. Aucun commit sur main, aucun push de main, aucune pull request. Commit et push de la branche de session seulement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
