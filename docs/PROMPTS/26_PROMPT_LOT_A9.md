# Lot A9 : déploiement OVHcloud, préproduction, production (D165, D166)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. **Ne démarre qu'après validation de la démonstration et prise de l'abonnement OVHcloud** (D165). Préparatifs sans compte autorisés : conteneur, scripts, procédure.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D112 à D116, D148, D165, D166), docs/WORKFLOW_MAINTENANCE.md, HEBERGEMENT_CONFORME.md si présent.

ÉTAPES
1. Construction de production : build Next en mode autonome, conteneur, variables d'environnement documentées (aucun secret dans le dépôt), en-têtes de sécurité, aucune requête externe.
2. Chaîne de livraison : fusion dans `main` déclenche le déploiement en préproduction ; étiquette de version déclenche la mise en production après validation manuelle.
3. Retour arrière documenté vers la version précédente ; sauvegardes ; santé de l'application.
4. Procédure d'exploitation docs/RUNBOOK.md : déployer, revenir en arrière, rotation des secrets, journaux.
5. Données : démonstration fictive ; données réelles seulement après D109 bis et DPO ; bandeau selon l'environnement.

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée ; build de production réussi.
2. Test de fumée après déploiement en préproduction (accueil, un besoin, audience).
3. Retour arrière essayé et reporté.
4. docs/COMPTE_RENDU_A9.md, mise à jour proposée du registre.
5. Aucun commit sur main, aucune pull request ; commit et push de la branche de session (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
