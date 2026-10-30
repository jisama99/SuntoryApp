# D191 : intégration par pull request

Amendement autorisé par T. SOEFOU le 30/10/2026. Dépôt concerné : jisama99/SuntoryApp.

Cette règle remplace uniquement les autorisations de fusion locale suivie d'un push direct sur main prévues dans CLAUDE.md (Méthode de travail, point 5), dans la décision D191 historique et dans docs/PROMPTS/31_PROMPT_REVUE_ET_FUSION.md (AUTORISATION et étapes 9 et 10). Les autres exigences de revue, de tests, de confidentialité et de validation restent applicables.

- Travailler sur une branche dédiée ; ne jamais pousser directement sur main.
- La dérogation D148 reste limitée au commit et au push de la branche de session ; elle n'autorise pas la création automatique d'une PR.
- Toute intégration dans main passe par une PR vers jisama99/SuntoryApp:main. La création de la PR nécessite une demande ou une confirmation explicite de T. SOEFOU.
- Avant la PR : revue indépendante, rapport de revue, contrôles requis exécutés et verts, aucun défaut bloquant. Un contrôle non exécuté est déclaré comme tel et bloque le verdict fusionnable selon D191.
- Après corrections ou actualisation de la branche, relancer les contrôles concernés et actualiser le rapport.
- Avant toute fusion : présenter la PR exacte, le SHA de tête, le résultat des contrôles et les écarts restants ; obtenir l'accord explicite de T. SOEFOU pour cette PR et cette version. Toute modification ultérieure impose une nouvelle validation.
- Ne pas exécuter la séquence historique git checkout main / git merge / git push origin main. Fusionner uniquement par la PR, en respectant les règles réellement actives du dépôt.
- Aucun force push sur main, aucune suppression de main, aucun contournement de protection sans autorisation spécifique à l'opération. Si les droits ou l'authentification sont refusés, arrêter et signaler le blocage.
- Ne jamais présenter cette règle documentaire comme une protection technique GitHub. L'activation d'un ruleset, l'abonnement et les contrôles obligatoires doivent être vérifiés séparément ; si inaccessible, écrire non vérifié.
- Ne rendre aucun statut CI obligatoire avant l'existence et la validation du workflow correspondant. Ne pas présenter des tests manuels comme des contrôles GitHub imposés.
- Aucun changement de secret, d'hébergement, de domaine ou déploiement n'est autorisé par cet amendement. Le dépôt TadjEmp/SuntoryApp reste inchangé.

Trace de décision et procédure : docs/AMENDEMENT_D191_PR_WORKFLOW.md.
