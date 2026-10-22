# CLAUDE.md · Plateforme de pilotage Suntory (Refonte V3)

À copier à la racine du dépôt de la plateforme. Mise à jour : 22/10/2026. Ne jamais mélanger avec un autre client.

## Mission
Plateforme web de pilotage merchandising Suntory (lecture analytique ordinateur) et application de saisie terrain (mobile), partagées entre la cliente (Suntory) et l'agence (Impact). Cadrage complet : `REFONTE_V3/ORIENTATION APPLICATION METIER/` (3 fichiers) et présentation cliente V0.4.

## Parties (convention de vocabulaire)
- **Cliente** : Suntory.
- **Agence** : Impact. Donneuse d'ordre et payeuse. Dans la plateforme, « Agence » est aussi le nom d'un rôle utilisateur.
- **Prestataire** : le profil FREELANCE (T. SOEFOU) qui conçoit, développe, héberge et facture à l'agence. C'est lui qui arrête les positions du registre.
- Chaîne : Suntory → Impact → prestataire → hébergeur. Dans le code et la documentation : écrire « prestataire » pour le développement et l'exploitation, « agence » seulement pour Impact ou le rôle utilisateur.

## Phase en cours
- **Étape A : démonstrateur cliquable sur données fictives, en français et en anglais.** C'est la seule étape autorisée tant qu'aucun « feu vert B » écrit n'existe dans `docs/DECISIONS.md`.
- **Étape B : MVP complet** (base réelle, authentification, droits serveur, imports réels). Interdite sans feu vert B.
- Les décisions arrêtées et ouvertes sont dans `docs/DECISIONS.md` (copie de `01_REGISTRE_DECISIONS.md`). En cas de doute, c'est ce fichier qui fait foi. Une hypothèse n'est pas une décision.

## Règles non négociables
- Aucune donnée réelle (client, magasin, intervenant, tarif, budget) dans le dépôt, les fixtures, les tests, les logs ou les prompts. Données fictives, bandeau « DONNÉES FICTIVES » visible sur chaque écran.
- Aucun tarif fictif présenté comme réel. Aucun coût inconnu transformé en 0 : afficher « Non chiffré », « Donnée indisponible » ou « Budget non renseigné ».
- Aucune formule ou valeur de classeur reprise comme vérité sans contrôle. Les classeurs sources sont en lecture seule.
- Aucune donnée interne protégée par un simple masquage dans le navigateur : le filtrage se fait côté serveur ou, au démonstrateur, dans la couche de données et jamais seulement dans l'écran.
- Aucun changement silencieux de calcul, d'identifiant ou d'historique.
- Aucune validation, notification externe, envoi d'e-mail ou publication autonome. Aucun appel réseau sortant dans le démonstrateur.
- Pas de géolocalisation, photo ou signature sans finalité validée.
- Pas de secret dans le dépôt, dans le front ou dans un fichier Excel.
- Ne pas inventer de prix, délai, licence ou certification.
- Si un fichier, une règle ou une décision manque : le signaler et s'arrêter sur ce point, ne pas combler de mémoire.

## Pile proposée (à confirmer au lot A0, décision de T. SOEFOU)
- TypeScript strict, Next.js (App Router), React.
- Tailwind avec les tokens du design V4 (`DESIGN SYSTEM/design_system_suntory.md`, `00_PARTAGE/DESIGN_TOKENS.md`, maquette `MAQUETTES_V4/maquette_premium_V4.html`).
- Données du démonstrateur : fixtures JSON typées derrière une interface de dépôt (`Repository`). L'étape B remplace l'implémentation par PostgreSQL sans toucher aux écrans.
- Règles métier (semaine ISO, doublons, statuts, droits, import) : modules TypeScript purs et testés, sans dépendance à l'interface.
- Tests : Vitest pour les règles, Playwright pour les parcours (les suites actuelles M1 à M3 utilisent Playwright).
- Le modèle Horizon UI (Chakra, dossier `horizon-ui-chakra-nextjs-main`, licence MIT) n'est **pas** la base : dépendances anciennes, système de composants différent du design V4. Inspiration de mise en page possible, pas de copie du code sans accord.

## Structure cible
```
/docs            DECISIONS.md, GLOSSAIRE.md, comptes rendus de lot
/src/domain      types, règles pures (week, duplicates, status, rights, import)
/src/data        interface Repository, fixtures (étape A), adaptateur PostgreSQL (étape B)
/src/app         pages et composants
/tests           unitaires (Vitest), parcours (Playwright), jeux d'essai
```

## Vocabulaire : code en anglais, interface en français
| Code | Interface (cible) | Remarque |
|---|---|---|
| need | Besoin | Un besoin a des périodes et des lieux liés |
| proposal / decision | Proposition / Décision | Proposition versionnée ; décision liée à une version |
| assignment | Affectation | Une ressource sur un secteur et une période |
| field_mission | Mission terrain | Ne pas confondre avec `mission_id` (mission commerciale Suntory) |
| field_submission | Saisie terrain | Soumise puis validée |
| dashboard | Tableau de bord | Remplace « Cockpit » |
| actions_to_handle | Actions à traiter | Remplace « Points à corriger » |
| hired / started | Recrutement finalisé / Poste démarré | « Pourvu » à remplacer (D11) |
| vehicle_handover | Remise du véhicule | Événement distinct de la prise de poste (position D11, table de migration à valider) |

Les statuts ne sont jamais condensés en un seul champ : besoin, proposition, recrutement, exécution et finances ont chacun le leur.

## Conventions
- Interface en français et en anglais (D27) : tous les libellés passent par des fichiers de traduction, aucune chaîne en dur. Codes métier et listes autorisées identiques dans les deux langues. Dates affichées selon la langue, stockées en ISO `AAAA-MM-JJ` ; semaine stockée avec son année ISO (ex. `2026-S53`).
- Codes (département, magasin, secteur) stockés en texte. Montants en décimal, devise et HT/TTC explicites.
- Identifiants immuables (UUID) séparés des codes métier lisibles.
- Chaque écran : états vide, chargement, erreur, conflit ; accessibilité clavier, contraste et alternative aux couleurs.
- Une erreur bloquante n'est jamais cachée dans un centre de notifications.

## Méthode de travail
1. Un lot = une session. Lire `docs/DECISIONS.md` et le prompt du lot avant toute action.
2. Ne pas passer au lot suivant sans validation écrite de T. SOEFOU.
3. Fin de lot : lancer toutes les suites, produire un compte rendu (fait, non fait, écarts, vérifications non exécutées) dans `docs/`, proposer une mise à jour du registre de décisions (« mise à jour proposée », jamais « enregistré »).
4. Présenter honnêtement la couverture de lecture et les tests non exécutés. Un ancien rapport de test n'est pas un test exécuté aujourd'hui.
5. Ne pas commiter, pousser ni ouvrir de pull request sans demande explicite.
6. Signature (D28) : FREELANCE, pour les livrables externes (documents, devis). Aucune signature, coordonnée ni logo dans les écrans du démonstrateur. Pas de logo d'agence. L'adresse de contact de `docs/DECISIONS.md` ne va ni dans le code, ni dans les fixtures, ni dans les tests.

## Commandes
À renseigner au lot A0 une fois la pile confirmée (installation, développement, tests, vérification de types). Ne pas inventer de commande avant.
