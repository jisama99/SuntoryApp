# Lot A1f : connexion par identifiant et comptes (D188, D189)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Dépend de A1e (fusionné). Placé avant A3.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D109 bis, D113, D118, D123 à D126, D151, D159, D161, D182, D188, D189), docs/GLOSSAIRE_FR_EN.md, docs/COMPLEMENTS_CADRAGE/30_DIRECTIVES_UX_UI_V0.1.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (règles 10, 14, 15, 16).

PÉRIMÈTRE : démonstrateur, données fictives. Pas de vraie authentification ni de base de données (étape B). Web sur ordinateur et mobile uniquement.

ÉTAPES
1. Écran de connexion (remplace le choix de profil de `/start`) : champs identifiant et mot de passe, bouton « Connexion », messages d'erreur neutres (« Identifiant ou mot de passe incorrect »), état de chargement, focus, clavier, 390 px, FR et EN (glossaire étendu : Identifiant / Username, Mot de passe / Password, Connexion / Sign in, Se déconnecter / Sign out, Mot de passe temporaire / Temporary password).
2. Trousseau du navigateur : `autocomplete="username"` sur l'identifiant, `autocomplete="current-password"` sur le mot de passe, `name` et `id` stables, formulaire dans une balise `form`, aucun `autocomplete="off"`.
3. **Remplissage automatique sans connexion immédiate** : aucun envoi déclenché par la saisie, le remplissage automatique ou le changement de champ ; la connexion ne part qu'à la soumission explicite (clic sur « Connexion » ou Entrée tapée par l'utilisateur). Tests e2e : (a) remplir les deux champs par programme ne change pas d'URL ; (b) le clic connecte ; (c) à 390 px ; (d) aucun appel de connexion avant le clic (écoute réseau).
4. Comptes fictifs : six identifiants agence, un identifiant direction cliente, un identifiant par DR et par CVR des jeux d'essai ; **aucun compte RS préconfiguré** : l'agence les crée et les attribue dans l'écran de gestion (D189) ; format d'identifiant fictif distinct de toute donnée réelle ; mots de passe fictifs jamais écrits en clair dans le code livré ni dans les captures (hachés dans les fixtures, documentés dans un fichier local non versionné ou généré au lancement).
5. Session : le cookie de session remplace le cookie de profil simulé ; déconnexion ; redirection vers la connexion si aucune session ; audience par défaut refusée inchangée (D118).
6. Gestion des comptes par l'agence (administration seulement) : liste, création d'un identifiant, attribution du profil et du périmètre, désactivation, réinitialisation avec mot de passe temporaire à changer à la première connexion ; traçage au journal (audience agence), aucun mot de passe journalisé ni affiché après création ; l'agence ne crée pas de compte du prestataire ; confirmation annulable (règle 16).
7. Sécurité minimale de démonstrateur : limitation des essais, délai constant de réponse, aucun détail sur l'existence d'un identifiant, pas de mot de passe en journal ni en URL ; liste des écarts à reprendre à l'étape B (hachage réel, verrouillage, double facteur) dans le compte rendu.
8. Captures docs/captures/A1f/ (FR et EN, 1440 et 390 px, clair et sombre).

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests e2e du point 3 passés, avec la preuve qu'aucune connexion n'est envoyée avant le clic.
3. Tests d'audience : un profil cliente n'accède pas à la gestion des comptes ; l'opérateur et le prestataire ne créent pas de compte agence (D189 confirmée).
4. Aucun mot de passe en clair dans le dépôt, les captures, les journaux ; aucune requête externe.
5. docs/COMPTE_RENDU_A1F.md avec hypothèses et mise à jour proposée du registre.
6. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
