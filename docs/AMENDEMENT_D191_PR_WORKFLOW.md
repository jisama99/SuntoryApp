# Amendement D191 : intégration par PR

## Décision

Le 30/10/2026, T. SOEFOU a autorisé le passage à un fonctionnement par pull request pour jisama99/SuntoryApp, sans contournement permanent. Cet amendement concerne la procédure de développement ; il ne modifie ni le périmètre métier ni les autorisations de l'étape B.

Le registre historique docs/DECISIONS.md et les textes initiaux sont conservés. Cet amendement remplace leurs seules dispositions autorisant la fusion locale suivie d'un push sur main ou imposant l'absence de PR pour intégrer un lot. Les autres dispositions restent applicables. La lecture du registre ayant été tronquée par le connecteur lors de la préparation, aucune réécriture de son contenu historique n'est effectuée.

## Textes concernés

- CLAUDE.md : Méthode de travail, point 5, exception D191.
- docs/PROMPTS/31_PROMPT_REVUE_ET_FUSION.md : AUTORISATION, étapes 9 et 10.
- docs/DECISIONS.md : dispositions historiques D191 relatives à l'intégration dans main.
- La règle opérationnelle correspondante figure dans .claude/rules/d191-pr-workflow.md. Pour un outil qui ne charge pas ce dossier de règles, lire explicitement cet amendement avant toute intégration.

## Procédure de remplacement

1. Effectuer le développement et les corrections de revue sur une branche dédiée, jamais sur main. Conserver la revue indépendante, les rapports et les exigences de vérification du prompt 31.
2. Exécuter les contrôles requis. Écrire non exécuté avec la raison pour tout contrôle impossible ; ne jamais transformer cette absence en succès.
3. Préparer le rapport avec les constats, les preuves, les écarts et le SHA revu. Obtenir les validations de décisions exigées par le projet.
4. Après autorisation explicite, créer une PR de la branche revue vers main du dépôt jisama99/SuntoryApp. Aucun envoi n'est destiné au dépôt original TadjEmp/SuntoryApp.
5. Présenter l'URL et le numéro de la PR, son SHA de tête, les contrôles exécutés et les écarts restants. Obtenir l'accord explicite de T. SOEFOU sur cette PR et cette version avant fusion. Après tout changement, mettre à jour les preuves et demander une nouvelle validation.
6. Fusionner uniquement via la PR, en respectant les protections réellement actives. Ne jamais pousser directement sur main ni utiliser de force push. Arrêter sur tout refus d'authentification, de permission ou de règle ; aucun contournement implicite.
7. Vérifier le résultat de la fusion. Dans le compte rendu final, indiquer la PR, le SHA fusionné, les contrôles réellement exécutés et les écarts restants. Si non fusionnée, le dire explicitement. Ne pas enchaîner sur le lot suivant sans validation.

## Limites et vérifications distinctes

Cet amendement ne crée aucune protection technique GitHub et ne garantit pas l'existence d'un ruleset. L'offre du compte, les protections de main et les fonctionnalités de sécurité disponibles doivent être vérifiées séparément. Ne pas rendre le dépôt public pour activer une fonctionnalité. Aucun contournement permanent n'est accordé.

Une CI minimale peut être proposée dans un lot séparé. Aucun statut ne devient obligatoire avant que le workflow soit opérationnel et que les noms des contrôles soient confirmés. Aucun workflow CI, secret ou paramètre d'hébergement n'est modifié par ce commit.

## Mise en application

Tant que cette branche n'est pas fusionnée, l'amendement n'est pas présent dans main. La publication de ce commit ne constitue ni une ouverture de PR ni une fusion. Ces opérations font l'objet de confirmations distinctes.
