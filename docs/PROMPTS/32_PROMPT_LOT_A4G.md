# Lot A4g : notifications et préférences d'alerte (D205 à D208 proposées)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Dépend de A2b (échéances et alertes), A3 (événements avec audience), A4a (alertes, cockpit) et A4f. Placé après A4f dans le noyau, premier candidat au report en seconde démonstration si le calendrier du 10/11 est menacé (signaler plutôt que bâcler).

OBJECTIF
Chaque utilisateur règle les alertes qu'il reçoit, par type et par canal (dans l'application, push, e-mail). L'agence fixe les défauts par profil et les alertes obligatoires dans Paramètres. En démonstrateur, le push et l'e-mail sont SIMULÉS : aucun envoi réel. Le code prépare le Web Push réel (lot A9, après abonnement OVHcloud).

LECTURES : CLAUDE.md, docs/DECISIONS.md (D78 à D82, D86, D94, D118, D147, D151, D159, D161, D192 à D196), docs/GLOSSAIRE_FR_EN.md, docs/COMPLEMENTS_CADRAGE/16_CATALOGUE_FONCTIONNEL_V0.1.md et 26_MATRICE_FONCTIONS_EVENEMENTS_RAPPORTS_BOUCLES_V0.1.md (événements et audiences), docs/propositions/PROPOSITION_NOTIFICATIONS_V0.1.md, comptes rendus A2B, A3, A4A, A4F.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Modèle : catalogue des types d'alerte dérivés des événements existants (échéance J-5, J-2, jour J ; décision à prendre ; retard de proposition ; besoin réattribué ou stoppé ; budget dépassé ; rapport publié), canaux (application, push, e-mail), préférence par utilisateur, type et canal, fréquence (immédiat ou résumé quotidien), heures calmes. Méthodes du `Repository` avec `AccessContext`, audience par défaut refusée.
2. Réglages agence dans Paramètres, section Notifications (agence administration seule) : canaux par défaut par profil, alertes obligatoires non désactivables (échéances), heures calmes par défaut ; historique (acteur, date, ancienne et nouvelle valeur).
3. Écran « Mes notifications » près du sélecteur d'affichage (tous les profils, cliente comprise, car D118 retire Paramètres côté cliente) : seuls les types relevant de l'audience du profil sont proposés ; les obligatoires sont visibles et verrouillés avec leur raison. État dans l'URL.
4. Centre de notifications dans l'application : cloche avec compteur de non lus, liste en cartes, marquer lu, lien profond vers l'objet, filtre dans l'URL, trois états (squelette, vide, erreur).
5. File « push à valider » simulée, sur le modèle de la file e-mail (D86, D94) : message (titre, texte, lien), statut, aucune émission ; l'agence valide ou écarte ; essai de deux cycles. Aperçu de la notification telle qu'elle apparaîtrait sur un téléphone (rendu dans l'application, pas un envoi).
6. Audience : filtrage côté données AVANT création de la notification ; une préférence ne peut jamais élargir l'audience ; test d'audience sur chaque type et chaque canal ; absence dans les exports cliente.
7. Contenu : texte FR et EN selon la langue de l'utilisateur, aucun chiffre ni donnée sensible dans le texte, lien vers l'application (cohérent avec l'e-mail du lundi). Aucun trait décoratif, aucun tiret long, aucune icône de type étincelle ou robot.
8. Préparation du push réel : interface de canal abstraite (`NotificationChannel`) avec une implémentation simulée ; AUCUN service worker, AUCUNE clé, AUCUNE requête externe. Rédiger `docs/PUSH_WEB_PREPARATION.md` : clés VAPID, service worker, installation PWA exigée sur iPhone, abonnement par appareil, désabonnement, consentement navigateur, tests iOS et Android, dépendances d'hébergement HTTPS (A9).
9. Événements au journal : préférence modifiée, notification créée, lue, validée, écartée, avec audience.
10. Captures docs/captures/A4g/ : FR et EN, 1440 et 390 px, clair et sombre (réglages agence, Mes notifications, centre, file à valider, aperçu).

HORS PÉRIMÈTRE
Envoi réel de push ou d'e-mail, service worker, PWA, SMS, hébergement, base de données.

BLOCAGES CONNUS (signaler, travailler sur l'hypothèse)
- Liste des alertes obligatoires : hypothèse = échéances J-5, J-2, jour J ; à valider par T. SOEFOU.
- Heures calmes par défaut : hypothèse 20h à 8h, réglable ; à valider.
- Résumé quotidien : heure d'envoi à fixer par l'agence.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées (typecheck, lint, tests, build, e2e), sortie reportée.
2. Tests : audience par type et canal, obligatoires non désactivables, heures calmes, résumé quotidien, aucune émission réelle, i18n, style, clavier.
3. Règles 14 à 16 : état dans l'URL, trois états, tableaux en cartes sous 640 px, cibles de 44 px, seuils de performance reportés, captures 390 px.
4. Aucune donnée réelle ; aucune requête externe.
5. docs/COMPTE_RENDU_A4G.md, mise à jour proposée du registre (numéros après le dernier).
6. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
