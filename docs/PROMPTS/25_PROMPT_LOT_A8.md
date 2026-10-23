# Lot A8 : signalement d'un problème et écran Demandes (D164)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Placé après le noyau de la démonstration.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D118, D148, D149, D151, D159, D164 à D166), docs/WORKFLOW_MAINTENANCE.md, docs/MODELES/FICHES_DEMANDE_ET_BUG.md, docs/GLOSSAIRE_FR_EN.md (ajouter les libellés du signalement avant fr.json et en.json).

ÉTAPES
1. Modèle de données et Repository : demande (type, gravité, description détaillée, étapes, résultat attendu, capture facultative, contexte capturé, statut, auteur, audience), Zod, événements au journal.
2. Bouton « Signaler un problème » dans chaque espace ; formulaire avec description obligatoire ; contexte capturé sans donnée métier ; avertissement : ne pas saisir de donnée personnelle.
3. Écran « Demandes » : chaque auteur voit les siennes et leur statut ; le prestataire voit tout, filtre, change le statut, relie à une décision ou à un correctif.
4. Notification : e-mail avec type, gravité, titre, extrait du détail et lien ; adresse lue dans `SUPPORT_NOTIFY_EMAIL`, jamais écrite dans le code ni le dépôt ; en démonstration l'envoi reste en file de validation, rien n'est envoyé.
5. Libellés FR/EN selon le glossaire ; règles 14 à 16.

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests : description obligatoire ; un auteur ne voit que ses demandes ; aucune adresse e-mail dans le dépôt (garde ajoutée) ; aucun envoi réel en démonstration ; audience.
3. Captures docs/captures/A8/, docs/COMPTE_RENDU_A8.md, mise à jour proposée du registre.
4. Aucun commit sur main, aucune pull request. En fin de lot, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
