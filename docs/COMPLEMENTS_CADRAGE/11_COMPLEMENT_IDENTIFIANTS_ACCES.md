# SUNTORY REFONTE V3 · Complément de cadrage n°2 : identifiants, authentification et récupération d'accès

Version de travail du 22/10/2026 · Statut : **proposition du prestataire, rien n'est validé** (hors positions déjà inscrites au registre comme « position prestataire », non validées par Impact ni par la cliente). Client : Suntory uniquement. Ce document n'est pas un avis juridique ni une validation de sécurité.

> **Mise à jour du 22/10/2026** : les décisions de T. SOEFOU (charte mixte, intervenants non utilisateurs, IdP = agence, tri des agents) sont dans `14_DECISIONS_22-10_CHARTE_ACCES_AGENTS.md` et **prévalent** en cas de contradiction avec ce document.

> **Complément du 22/10/2026 (suite)** : voir aussi `15_DECISIONS_22-10_LOGOS_RS_BUDGETS_AGENTS.md` (logos, RS utilisateurs, chaîne managériale, budgets, agents adoptés).

## 1. Existant vérifié

| Source | Constat |
|---|---|
| Registre D20 / Q3 | Comptes créés par l'administrateur de la plateforme (prestataire puis administrateurs désignés) ; l'administrateur ne connaît jamais le mot de passe ; lien d'invitation à usage unique ; réinitialisation par e-mail (réponse identique que le compte existe ou non, limitation de débit) ; politique 12 caractères / 4 catégories ou 14 caractères ; révocation côté serveur ; journal d'audit ; SSO (OIDC) en option ultérieure |
| Registre MFA | Obligatoire : agence, administrateurs, accès financiers. RS et intervenants : mot de passe seul, limitation de débit, révocation rapide, **à confirmer** |
| Démonstrateur | Connexion **simulée** avec profils de démo ; aucune authentification réelle avant le lot B1 |
| `GUIDE_ADMIN_COMPTES_V4.md`, `NOTE_OPTION_SECURITE_V4.md`, `COMPTE_RENDU_LOT6.md` (lus) | Modules V4 hors ligne : fichier scellé (AES-256-GCM, PBKDF2 600 000 itérations), comptes nominatifs, clé de récupération unique, verrouillage 15 min, blocage après échecs. Limites reconnues : pas de second facteur, un fichier déjà diffusé reste ouvrable avec l'ancien mot de passe, perte de toutes les clés = trousseau irrécupérable. Tests : Chromium Linux ; Chrome Mac non testé |
| `QUESTIONS_OUVERTES.md` §D | Politique de mot de passe, second facteur pour administrateurs, administrateur des comptes de la cliente, processus de départ, audit indépendant : **toutes ouvertes** |
| Texte CNIL (délibération 2022-100) | Lu via un article de synthèse, **pas le PDF officiel** ; ANSSI non relue : à vérifier avant toute citation |

**Enseignement** : le dispositif V4 est une protection de *fichiers diffusés*. Il ne se transpose pas à une plateforme en ligne : il n'y a plus de fichier à desceller, mais des sessions, des comptes et une révocation instantanée possibles. Le gain principal du passage en ligne est la **révocation réelle**.

## 2. Manques
1. Public réel des intervenants terrain : disposent-ils d'une adresse professionnelle ? **Inconnu**. S'ils n'en ont pas, « adresse professionnelle comme identifiant » ne fonctionne pas pour eux.
2. IdP (fournisseur d'identité) de la cliente et de l'agence : **inconnu** ; aucune hypothèse sur un produit particulier.
3. Qui administre les comptes côté cliente (Q17 des questions ouvertes) : ouvert.
4. Parcours d'oubli, de perte de facteur, de compte administrateur : non conçus.
5. Aucun mécanisme choisi pour réaliser l'authentification (composant, service, hébergement) : lié à D02 / D19.
6. Politique de départ / mobilité : seulement sur le principe.

## 3. Identifiants : options

Distinction obligatoire : **identifiant technique** (immuable, jamais affiché, jamais réutilisé, UUID généré) ≠ **moyen de connexion** (modifiable : e-mail, identifiant interne, compte d'entreprise). Toute trace d'audit, tout droit et toute donnée métier pointent vers l'identifiant technique.

| Option | Pour | Contre | Convient à |
|---|---|---|---|
| A · Adresse professionnelle | Familière, sert aussi à la récupération, rattachée à l'organisation | Change (mariage, fusion, départ) ; inexistante pour certains intervenants ; une adresse partagée est une faille | Cliente, agence |
| B · Identifiant interne (ex. `INT-001`) | Stable, existe pour tous, pseudonyme | À communiquer ; la récupération passe par un autre canal (téléphone, tiers) ; risque de collision avec les références de démo | Intervenants sans messagerie professionnelle |
| C · Compte d'entreprise (SSO) | Pas de mot de passe supplémentaire, départ géré à la source, MFA de l'entreprise | Dépend de l'IT de l'organisation ; deux organisations (cliente, agence) ; délai de mise en place | Cliente, agence, si IT d'accord |
| D · Combinaison | Chaque population a son moyen | Plus de cas à tester et à expliquer | Réalité probable |

**Recommandation** : l'identifiant technique est toujours un UUID. Le moyen de connexion est **A par défaut**, **B + canal de récupération défini** pour les intervenants sans adresse professionnelle, **C en option** par organisation quand son IT le permet. Un compte = une personne (pas de compte partagé) ; l'e-mail de connexion est modifiable avec confirmation sur l'ancienne et la nouvelle adresse.

## 4. Authentification : options par profil

| Méthode | Atouts | Limites | À retenir pour |
|---|---|---|---|
| Mot de passe seul | Simple, universel | Hameçonnage, réutilisation ; exige limitation de débit et détection de mots de passe compromis | Intervenants, RS (position actuelle) |
| Mot de passe + application TOTP | Gratuit, répandu | Perte de téléphone = parcours de récupération à concevoir | Agence, administrateurs |
| Clé d'accès (passkey, WebAuthn) | Résiste à l'hameçonnage, simple sur mobile | Dépend des appareils et des gestionnaires ; récupération à penser (risque d'annuler le gain) | Option cible agence / administrateurs ; intérêt mobile à tester |
| SMS en second facteur | Sans application | Faible (détournement de carte SIM) ; coût d'envoi ; numéro = donnée personnelle | À éviter comme seul facteur |
| SSO (OIDC / SAML) | Centralisé, départ immédiat | Dépend de l'IdP de chaque organisation | Cliente et agence, option ultérieure |

Matrice recommandée (proposition) :

| Profil | Connexion | Second facteur | Remarque |
|---|---|---|---|
| Administrateur plateforme / agence admin | Mot de passe ou SSO | **Obligatoire** (passkey ou TOTP) | Alignement avec la position MFA du registre |
| Agence opérateur | Idem | **Obligatoire** | |
| Cliente avec accès financier (si D08 l'autorise) | SSO si possible, sinon mot de passe | **Obligatoire** | |
| Direction, DR, CVR cliente sans coûts | Mot de passe ou SSO | Fortement recommandé ; décision cliente | Pas de coûts = enjeu moindre |
| RS, intervenants | Mot de passe, limitation de débit, révocation rapide | Optionnel (passkey volontaire) | **Position à confirmer** ; à reconsidérer si accès à des données personnelles d'autres personnes |

Réalisation : **ne pas écrire de mécanisme d'authentification maison**. Le choix d'un composant ou d'un service vérifié (hébergement dans l'UE, journal d'audit, TOTP / passkey, SSO ultérieur) est à faire au lot A0 / B1 avec versions, licences et coûts *vérifiés sur sources officielles* (non vérifiés à ce jour). Un point à lever : la dépendance éventuelle à un service tiers est un sous-traitant ultérieur à déclarer (D02 / D19).

## 5. Cycle de vie du compte

| Étape | Déclencheur | Qui agit | Règle | Trace |
|---|---|---|---|---|
| Demande | Besoin d'accès, rôle et périmètre précisés | Responsable de l'organisation (cliente ou agence) | Demande écrite, un demandeur ≠ le futur titulaire | Demande conservée |
| Création | Demande validée | Administrateur | Identité, organisation, rôle, périmètre ; **aucun mot de passe saisi** ; compte « en attente » | Qui, quand, quoi |
| Invitation | Création | Système | Lien à usage unique, durée limitée (valeur à fixer, ex. 72 h, **proposition**), un seul actif à la fois | Envoi, ouverture, expiration |
| Première connexion | Clic sur le lien | Utilisateur | Définit son mot de passe (politique 12 / 14), enrôle le second facteur si requis, accepte l'information sur les données personnelles | Succès / échec |
| Attribution du rôle | Création | Administrateur | Moindre privilège ; un rôle = un jeu de droits défini au registre ; le périmètre ne s'étend jamais seul | Avant / après |
| Changement de périmètre | Mutation, nouvelle mission | Administrateur sur demande du responsable | Droits recalculés ; **sessions ouvertes réévaluées ou fermées** ; ancien périmètre retiré à la date effective | Avant / après, demandeur |
| Revue périodique | Rythme à fixer (proposition : semestriel) | Responsable + administrateur | Liste des comptes et droits à confirmer ou retirer | PV de revue |
| Suspension | Absence longue, incident, doute | Administrateur | Connexion refusée, sessions révoquées, données conservées | Motif, date |
| Départ | Fin de contrat ou de mission | Responsable (signalement) → administrateur | Désactivation **le jour du départ** ; révocation immédiate des sessions et jetons ; réattribution des tâches ; suppression ou archivage selon durée de conservation (D18, **ouverte**) | Date, demandeur, exécutant |
| Révocation d'urgence | Perte d'appareil, compte compromis | Administrateur ou support | Sessions et jetons révoqués, mot de passe invalidé, facteurs retirés, utilisateur notifié ailleurs que sur l'adresse suspecte si possible | Horodatage, justification |

## 6. Oubli de mot de passe : parcours

**Côté utilisateur**
1. « Mot de passe oublié » → saisie de l'identifiant (adresse).
2. Message **identique** que le compte existe ou non : « Si ce compte existe, un message vient d'être envoyé. »
3. Le message contient un lien à usage unique, valable peu de temps (proposition : 30 min), un seul actif ; une nouvelle demande invalide la précédente.
4. Page de réinitialisation : politique de mot de passe affichée, refus des mots de passe courants ou déjà compromis, jamais l'ancien.
5. Succès : toutes les sessions et jetons sont révoqués ; l'utilisateur se reconnecte (et repasse son second facteur si requis).
6. Notification « votre mot de passe a été modifié » à l'adresse du compte et, s'il existe, au canal secondaire déclaré.

**Vérification d'identité** : la possession de la boîte e-mail suffit pour les profils sans second facteur. Pour un profil avec second facteur, la réinitialisation du mot de passe **ne désactive pas** le second facteur ; elle ne donne pas l'accès seule.

**Protections contre les abus**
| Menace | Parade |
|---|---|
| Énumération de comptes | Même réponse et même durée de traitement |
| Bourrage de demandes | Limitation par adresse, par IP et globale ; temporisation progressive ; CAPTCHA seulement en dernier recours (accessibilité) |
| Jeton volé ou rejoué | Jeton aléatoire long, stocké haché côté serveur, usage unique, expiration |
| Lien transmis ailleurs | Lien lié à la demande, pas de mot de passe dans le message |
| Détournement de boîte e-mail | Second facteur pour les rôles sensibles ; alerte de changement |
| Fuite par journaux | Aucun jeton ni mot de passe dans les journaux ni dans les URL de suivi |

## 7. Cas particuliers

| Cas | Parcours proposé | Qui décide | Trace |
|---|---|---|---|
| Perte du second facteur | 1. Codes de secours remis à l'enrôlement (à conserver hors appareil). 2. Sinon, deuxième facteur enregistré (passkey + TOTP). 3. Sinon, demande à un administrateur : **vérification hors canal** (appel à un numéro connu, ou confirmation du responsable hiérarchique), réinitialisation du facteur, nouvel enrôlement obligatoire à la connexion suivante | Administrateur (jamais seul pour un administrateur) | Demande, vérificateur, motif, heure |
| Adresse professionnelle inaccessible (départ de boîte, fusion) | Le responsable de l'organisation demande le changement ; l'administrateur modifie l'adresse de connexion, annule les liens en cours, exige une nouvelle confirmation par lien envoyé à la **nouvelle** adresse ; second facteur conservé | Responsable + administrateur | Ancien / nouvel identifiant masqués partiellement |
| Compte verrouillé (tentatives) | Verrou temporaire progressif (ex. quelques minutes, **valeur à fixer**) ; message neutre ; déblocage automatique ; l'utilisateur peut réinitialiser son mot de passe pendant le verrou | Système ; administrateur si demande | Tentatives, IP, déblocage |
| Compte administrateur perdu | Voir §8 (procédure d'urgence à deux personnes) | Deux administrateurs ou, à défaut, prestataire après vérification par Impact | Dossier d'incident |
| Soupçon de compromission | Révocation d'urgence (§5), rotation des secrets si nécessaire, notification selon la procédure de violation (Q21, ouverte) | Administrateur, DPO si données personnelles | Incident |

## 8. Administration : qui débloque, comment, avec quelles traces

| Action | Qui peut | Conditions | Trace minimale |
|---|---|---|---|
| Débloquer un utilisateur standard | Administrateur de l'organisation de l'utilisateur | Demande de l'utilisateur ou du responsable ; vérification d'identité hors canal pour un facteur perdu | Demandeur, vérification, exécutant, horodatage |
| Débloquer un opérateur agence | Administrateur agence | Idem | Idem |
| Débloquer un administrateur | **Un autre administrateur** (règle des quatre yeux) | Jamais en auto-service | Les deux identités |
| Dernier administrateur perdu | Prestataire (support) | Demande écrite de l'agence Impact ; vérification d'identité par Impact ; délai de sécurité (proposition : 24 h) avec notification à tous les contacts d'administration ; compte rétabli en mode « réenrôlement obligatoire » | Dossier complet, conservé |
| Consulter le journal d'audit | Administrateur ; DPO sur demande | Journal en lecture seule | Accès journalisé |

Garde-fous : au moins **deux administrateurs actifs** par organisation en production ; aucun mot de passe connu d'un administrateur ; le support prestataire n'a pas d'accès permanent aux données métier ; toute action sensible est inscrite dans un journal **inaltérable à usage humain** (qui, quoi, quand, sur qui, motif, résultat) conservé selon D18 (ouverte).

## 9. SSO : qui récupère quoi

| Situation | Récupération gérée par l'IdP de l'organisation | Récupération gérée par l'application |
|---|---|---|
| Mot de passe oublié (compte SSO) | Oui : portail de l'organisation | Non : l'application n'a pas de mot de passe |
| Perte du second facteur de l'entreprise | Oui : support IT de l'organisation | Non |
| Compte supprimé ou suspendu à la source | Effet immédiat à la prochaine connexion | Désactivation locale **à prévoir** pour les sessions déjà ouvertes (durée de session courte ; fin de session globale) |
| Droits et périmètre métier | Non (sauf attributs fournis) | **Oui : rôles et périmètres restent dans l'application** |
| Compte « de secours » pour l'administrateur | Non | **Oui** : au moins un compte local de secours avec second facteur, conservé hors ligne, pour le cas d'IdP indisponible |

Dépendance : SSO exige l'accord et le temps de l'IT de chaque organisation ; il reste donc **option ultérieure** (position actuelle inchangée).

## 10. Dépendances
D02 / D19 (hébergeur, sous-traitants) ; D08 (accès aux coûts → niveau de MFA) ; D18 (durées de conservation et d'archivage des comptes et journaux) ; D14 (appareils des intervenants) ; Q17 / Q21 des questions ouvertes (administration côté cliente, violation) ; réponse Impact sur l'e-mail des intervenants.

## 11. Décisions attendues
| N° | Décision | Décideur |
|---|---|---|
| D33 | Moyen de connexion par population (A, B, C) et canal de récupération des intervenants sans e-mail professionnel | Impact, cliente |
| D34 | Niveau d'exigence second facteur au-delà des administrateurs et accès financiers (direction, DR, CVR, RS) | Cliente, IT |
| D35 | Procédure de récupération d'un compte administrateur (quatre yeux, délais, vérificateur côté Impact) | Impact, prestataire |
| D36 | Valeurs : durée du lien d'invitation, du lien de réinitialisation, verrouillage, session, revue périodique | Impact, cliente, IT |
| D37 | Choix du composant d'authentification (après vérification des versions, licences, coûts, hébergement UE) | T. SOEFOU, avec Impact pour la refacturation |
