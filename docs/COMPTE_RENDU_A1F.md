# Compte rendu du lot A1f : connexion par identifiant et comptes

Date : 23/10/2026. Branche de session `claude/amazing-babbage-khv4fn`, jamais `main`, aucune pull request (D148). Décisions : D188, D189 ; D183, D186 et D187 (validées) ; D118, D151, D159, D161, D182. Supabase et Vercel non utilisés, aucune requête externe, aucun fichier de données réelles lu.

## 0. Préparation
- `origin/main` récupéré et fusionné trois fois : `f340fe1` au lancement, `ab524d9` en cours de lot (sur demande de vérifier les nouveaux commits), puis `eabde9b` en fin de lot (D191, D192, règle 17, documents seulement). Aucun conflit. Les commits arrivés pendant le lot ont **changé le périmètre** : D183, D186, D187 validées, étape 0 (titres du glossaire 4 quinquies), retour à la page demandée après connexion (D183). Ils sont appliqués ci-dessous. La vue Planning (D190, lot A4f) n'est pas dans ce lot.
- Vérifié : D189 présente au lancement, règles 14, 15 et 16 présentes dans `07_REGLES_COMMUNES_LOTS_APRES_A1.md`.

Règle 17 (D192) : aucun sous-agent n'a été lancé dans ce lot, tout le travail est fait dans la session. D191 : ce compte rendu est destiné à la session de revue distincte (`31_PROMPT_REVUE_ET_FUSION.md`).

## 1. Réalisé
| Étape | Réalisation | Vérification |
|---|---|---|
| 0. Titres (D186) | Section 4 quinquies appliquée en un passage (espace de noms `titles`, mêmes clés FR et EN) : Saisir un besoin, Saisir plusieurs besoins, Fixer les échéances de saisie, Dates limites mois par mois, Régler les dispositifs, Réouvertures à décider, Saisies à relancer, Courriels à valider, Ce qui demande votre attention, Connexion, Gérer les accès. Aucun autre titre inventé. | `a1f.test.ts` : chaque titre égal à la ligne du glossaire ; e2e FR et EN sur chaque écran |
| 1. Connexion | `/start` devient l'écran de connexion (visuel forêt conservé) : Identifiant, Mot de passe, bouton « Connexion », message d'échec unique « Identifiant ou mot de passe incorrect », bouton désactivé et `aria-busy` pendant l'envoi, feuille mobile, FR et EN. Le choix de profil a disparu de l'écran. | e2e, captures |
| 2. Trousseau | Une balise `form`, `autocomplete="username"` et `current-password`, `name` et `id` stables, aucun `autocomplete="off"` sur l'écran de connexion. | e2e et test de source |
| 3. Remplissage sans connexion | La connexion ne part qu'à la soumission explicite. Le composant n'a aucun gestionnaire de saisie, de changement, de perte de focus ni d'animation d'autoremplissage. | e2e (a) remplissage par programme plus événements d'entrée, de changement et d'autoremplissage simulés : URL inchangée pendant 1,2 s ; (b) le clic connecte ; (c) à 390 px ; (d) **écoute réseau : 0 appel avant le clic, 1 après** ; Entrée tapée connecte aussi |
| 4. Comptes fictifs | 17 comptes : six agence (une administration, cinq opérateurs), un direction cliente, 3 DR, 6 CVR, un prestataire. **Aucun RS.** Format `Demo` + rôle + numéro. Empreintes scrypt avec sel dans `src/data/fixtures/accounts.json`, mots de passe en clair dans `.demo-passwords.local.json` (ignoré par git, droits 600), produit par `npm run demo:accounts` (tirage aléatoire à chaque exécution, qui remplace les deux fichiers). | Tests : comptes, format, périmètres, empreintes seules ; analyse de tous les fichiers versionnés et non ignorés : aucun mot de passe en clair ; journal du serveur sans mot de passe |
| 5. Session | Cookie `demo_session` signé (HMAC), `httpOnly`, `SameSite=Lax`, 8 h ; compte relu à chaque requête (désactiver coupe l'accès). Sans session : redirection vers la connexion **avec retour à la page demandée** (état compris : filtre, tri), adresse de retour limitée aux chemins internes. Déconnexion. Route `POST /api/login` (corps JSON obligatoire). Le cookie de profil simulé est remplacé. | Unit : jeton falsifié refusé ; adresses de retour piégées (double barre, barre inverse, schéma, remontée de dossier, langue inconnue, boucle) ; e2e : retour, cookie falsifié, déconnexion |
| 6. Gestion des comptes | `/settings/accounts` (titre « Gérer les accès ») : liste (filtre par statut et tri dans l'URL, cartes sous 640 px), création, attribution du profil et de la zone, désactivation et réactivation, réinitialisation. Mot de passe temporaire **rendu une seule fois**, jamais relu, jamais journalisé, à changer à la première connexion (page `/change-password`, 12 caractères avec lettre et chiffre). Événements EV-40 à EV-43 (audience agence). Confirmation annulable. | Unit (journal sans mot de passe, annulation d'une création) et e2e (parcours complet, annulation d'une réinitialisation et d'une création) |
| 7. Sécurité de démonstrateur | Limitation : 5 échecs en 10 minutes bloquent l'identifiant 5 minutes, qu'il existe ou non ; durée de réponse minimale constante (400 ms, 50 ms en test) ; un seul calcul de hachage dans tous les cas (empreinte factice pour un inconnu) ; réponse d'échec unique ; aucun mot de passe en journal, en adresse ni en stockage. | Unit : durée et résultat identiques pour inconnu et mauvais mot de passe, blocage même avec le bon mot de passe ; e2e : même message et même corps, rien dans l'adresse, le stockage ni les cookies |
| 8. Captures | `docs/captures/A1f/` : 44 images, FR et EN, 1440 et 390 px, clair et sombre. | Voir 5 |

**Visualisation « comme » (D188 : « reste réservé au prestataire »).** Le sélecteur de profil de la barre d'outils n'apparaît que pour le compte du prestataire, par le cookie `demo_view_as`, ignoré pour tout autre compte. Il sert aussi aux tests (aucun RS préconfiguré). Un prestataire qui consulte comme l'agence administration **ne gère pas les comptes** (test).

## 2. Contrôles exécutés aujourd'hui
| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | OK, 0 erreur |
| `npm run lint` | OK, 0 avertissement |
| `npm test` (Vitest) | **28 fichiers, 561 tests passés, 1 ignoré** (C3 : `.denylist.local` absent) ; 560 à la livraison, +1 pour les brouillons par compte |
| `npm run build` puis `npm run test:e2e` | **98 passés sur 98** à la livraison initiale (21 nouveaux pour A1f), avec un échec isolé non expliqué ; **cause identifiée et corrigée le 23/10** (voir « Corrections après relecture »). **Réexécution complète le 23/10 après corrections : typecheck et lint propres, 561 tests unitaires, build puis 98 e2e sur 98**, sur Chromium 1243 (version installée dans l'environnement de correction). |
| `npx playwright test --config=playwright.shots.config.ts a1e a1f` | 10 parcours passés, captures régénérées |
| Mots de passe en clair | Aucun dans les fichiers versionnés et non ignorés ; aucun dans le journal du serveur ; captures : champ masqué, mot de passe temporaire remplacé par des points avant la prise de vue |
| Premier affichage utile (LCP, serveur local) | Connexion 96 à 132 ms, gestion des comptes 124 ms, accueil et pilotage 96 à 156 ms (seuil 2 s) |

Les exécutions répétées du même fichier sur un serveur déjà lancé échouent sur « identifiant déjà pris » (comptes créés par le test précédent) : relancer `npm run test:e2e` redémarre un serveur propre.

## 3. Audience
- Seule l'agence administration, connectée en son nom, liste, crée, attribue, désactive et réinitialise ; direction, DR, CVR, RS, opérateur, prestataire et prestataire en visualisation de l'agence sont refusés par la couche données (test sur les sept profils) et `/settings/accounts` répond 404 pour tous sauf l'agence administration (contrôle placé au-dessus de l'état de chargement).
- Aucun profil cliente n'a le menu Réglages (D118) ; DR et CVR voient le périmètre de leur compte.
- L'agence ne crée, ne modifie, ne désactive ni ne réinitialise aucun compte du prestataire, et ne peut pas désactiver son propre compte.

## 4. Hypothèses d'interprétation (à valider, pas des décisions)
1. **Répartition des six comptes agence** : une administration et cinq opérateurs (D189 ne la fixe pas).
2. **Profils que l'agence peut créer** : direction, DR, CVR, RS, opérateur et administration, jamais le prestataire. **Décidé par T. SOEFOU le 23/10/2026 (message de session) : l'agence peut créer tous ces profils, administration comprise.** Reste à inscrire au registre (D194).
3. **Mot de passe temporaire montré une seule fois** à l'agence (nécessaire pour le transmettre), jamais relu ni journalisé : lecture de « aucun mot de passe affiché après création ».
4. **Politique de mot de passe** : 12 caractères, une lettre, un chiffre, différent du temporaire.
5. **Prénom** : les comptes créés n'ont pas de prénom (salutation « Bonjour » seule) ; les comptes préconfigurés en ont un, repris des jeux d'essai.
6. **Titre de l'écran de connexion** : « Connexion », le titre de l'application passe en ligne au-dessus.
7. **Choix du skin** : suit désormais le compte (et non le profil) ; en visualisation, il suit le profil consulté.
8. **Brouillons de saisie en lot** : ~~rattachés au profil~~ **corrigé le 23/10/2026** : rattachés au compte (et au profil consulté en visualisation) ; deux comptes d'un même profil ne partagent plus de brouillon (test `a2b-repository.test.ts`).

## 5. Captures : couverture de lecture
44 images produites dans `docs/captures/A1f/`. **Décompte rectifié le 23/10/2026** : à la livraison, 6 images A1f avaient été relues (`login_light_fr_1440`, `login_error_light_fr_390`, `accounts_dark_en_1440`, `account_created_light_fr_390`, `change_password_dark_en_390`, `accounts_light_fr_390`) ; les deux images `start_*` citées avaient été relues sur la génération précédente (A1e) et ne comptent pas parmi ces 44. Le « 12 relues » de la première version était erroné ; les 38 autres sont relues le 23/10/2026, image par image, par la session qui a corrigé ce compte rendu. **Les 44 images A1f sont donc relues.** Relecture visuelle seulement : pas de mesure de contraste ni de lecteur d'écran.

Constats de la relecture (aucun n'est corrigé dans ce lot) :
- Les boutons d'actions d'une ligne de compte passent sur plusieurs lignes à 1440 px **en français comme en anglais** (le compte rendu initial ne le disait que pour l'anglais).
- À 390 px, l'en-tête (thème, skin, langue, déconnexion) occupe environ la moitié de l'écran avant le contenu de la gestion des comptes ; le contenu s'ouvre sous la ligne de flottaison.
- Sur la connexion et le changement de mot de passe en mode clair à 1440 px, le logo Suntory est pâle sur la carte translucide (lisible, contraste faible).
- Réglages : le libellé « Skin d'accueil » reste en français avec un terme anglais (« Home theme » en anglais) ; hors périmètre A1f, à voir avec le glossaire.
- Le champ de mot de passe reste masqué dans toutes les captures ; le mot de passe temporaire est remplacé par des points.

**Les captures de l'A1, A2a, A2b et A1e (hors écran de connexion) ne sont pas régénérées** : titres et menus y sont d'avant D186.

## Corrections après relecture (23/10/2026)
| Point | Constat | Suite |
|---|---|---|
| Échec isolé du parcours de gestion des comptes | **Cause identifiée** : le test cliquait « Se déconnecter » puis reconnectait l'agence sans attendre la fin de la déconnexion ; la suppression du cookie par l'action serveur pouvait arriver après la nouvelle connexion, la session sautait et la page affichait la connexion (le bouton `Désactiver` attendu n'existait pas). Reproduit une fois sur une exécution complète le 23/10 ; ce n'était pas un problème de durée : le parcours dure environ 6 s. | Attente de l'adresse `/fr/start` ajoutée après le clic ; le délai de 90 s, qui masquait le symptôme, est retiré (délai par défaut de 30 s). Trois exécutions du fichier passées après correction. Un défaut du test, pas du produit. |
| Hypothèse 2 | Décidée par T. SOEFOU (voir section 4). | Aucun changement de code : l'agence pouvait déjà créer l'administration. |
| Hypothèse 8 | Brouillons partagés entre comptes d'un même profil. | Corrigé et testé (section 4). |
| Visualisation « comme » | **Pas en lecture seule** : le prestataire qui consulte comme un profil peut écrire avec les droits de ce profil. C'est voulu à ce stade, car tous les tests de parcours (besoins, lots, échéances) s'en servent pour agir comme un RS, aucun compte RS n'étant préconfiguré. Le journal attribue l'écriture au **profil consulté**, sans mention du compte du prestataire. | **Non modifié** : le rendre en lecture seule casse l'ensemble des parcours. Écart à traiter à l'étape B (journal avec compte réel et profil consulté), ou décision de créer un compte RS de démonstration pour les tests. À arbitrer par T. SOEFOU. |
| Verrouillage par identifiant | Un tiers peut bloquer le compte d'autrui (5 essais). | Déjà listé en section 6, à traiter à l'étape B. |

## 6. Écarts à reprendre à l'étape B (liste demandée)
- **Hachage** : scrypt aux paramètres par défaut, sel par compte ; paramètres de coût à valider et empreintes en base.
- **Session** : jeton signé sans stockage côté serveur (clé tirée au démarrage, sessions perdues au redémarrage ; pas de révocation fine, pas de rotation, pas de durée glissante).
- **Limitation des essais** : en mémoire, par identifiant seulement (pas par adresse ni par appareil), non partagée entre instances.
- **Verrouillage** de compte, déblocage par l'agence, journal des échecs de connexion (aucun événement n'est écrit pour les échecs).
- **Double facteur**, récupération de mot de passe, politique de renouvellement.
- **Mot de passe temporaire** transmis hors de l'application (canal à définir) ; aucun envoi automatique (aucun e-mail, règle du démonstrateur).
- **Cookies** : `Secure` et `__Host-` à activer avec le HTTPS de l'hébergement.
- **Origine des requêtes** : contrôle d'en-tête `Origin` en plus de `SameSite` et du corps JSON ; protection contre les attaques par force brute au niveau de l'hébergement.
- **Visualisation « comme »** : écritures permises et attribuées au profil consulté, sans le compte du prestataire dans le journal (voir « Corrections après relecture »).
- **Sans JavaScript** : le formulaire de connexion ne fonctionne pas (envoi par `fetch`).
- **Annulation** (D181) : restauration d'instantané en démonstrateur, compensation en base à l'étape B ; l'annulation d'une création de compte supprime le compte sans trace dans le journal des comptes autre que l'événement EV-39.

## 7. Vérifications non exécutées
Test sur de vrais gestionnaires de mots de passe (seule la structure du formulaire et les événements d'entrée simulés ont été vérifiés dans Chromium) ; navigateurs autres que Chromium ; largeurs autres que 1440 et 390 px ; LCP hors serveur local ; relecture humaine C8.

## 8. Mise à jour du registre proposée (non inscrite dans `docs/DECISIONS.md`)
Dernière décision du registre à la dernière récupération : D192 (D191 revue par une session distincte, D192 économie de modèles). Numéros proposés à partir de D193.
| N° proposé | Sujet | Contenu | Statut proposé |
|---|---|---|---|
| D193 | Comptes préconfigurés | Six comptes agence (une administration, cinq opérateurs), un direction, un par DR et CVR, un prestataire, aucun RS ; identifiants `Demo` + rôle + numéro ; empreintes scrypt versionnées, mots de passe dans `.demo-passwords.local.json` non versionné, régénérables par `npm run demo:accounts` | Précise D189 (hypothèse 1) |
| D194 | Pouvoirs de l'agence sur les comptes | Créer, attribuer, désactiver, réinitialiser tous profils sauf prestataire, administration comprise ; jamais son propre compte ; création d'une administration **décidée par T. SOEFOU le 23/10/2026** ; EV-40 à EV-43 hors catalogue, à inscrire au doc 26 | Décidée par T. SOEFOU le 23/10/2026 (message de session), à inscrire au registre |
| D195 | Mot de passe temporaire et politique | Montré une seule fois, jamais journalisé, à changer à la première connexion ; 12 caractères avec lettre et chiffre | À valider (hypothèses 3 et 4) |
| D196 | Session et sécurité de démonstrateur | Cookie signé httpOnly 8 h, relu à chaque requête ; limitation 5 échecs en 10 minutes pour 5 minutes par identifiant ; durée de réponse constante ; échec unique ; liste des écarts de la section 6 à traiter à l'étape B | Proposée |
| D197 | Visualisation « comme » | Réservée au compte du prestataire, sans gestion des comptes en visualisation ; sert à la démonstration et aux tests | Précise D188 |
| D198 | Titre de l'écran de connexion | « Connexion », titre de l'application en ligne au-dessus | À valider (hypothèse 6) |
| D199 | Libellés de connexion et de comptes hors glossaire | Section 4 septies du glossaire (Comptes, Profil, Périmètre, Statut, Actif, Désactivé, Créer un compte, Attribuer, Désactiver, Réactiver, Réinitialiser le mot de passe, Nouveau mot de passe, Confirmer le mot de passe, mention de démonstration) | À valider |

## 9. Suite
Pas de chaînage vers A3. Avant A3 : validation écrite de ce compte rendu, relecture des captures non relues, arbitrage des hypothèses et de D193 à D199.
