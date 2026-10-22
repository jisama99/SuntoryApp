# SUNTORY REFONTE V3 · Registre de décisions (développement)

Version de travail du 22 octobre 2026. Mission : plateforme de pilotage merchandising Suntory et application de saisie terrain. Signature des livrables externes : FREELANCE (position du prestataire du 22/10/2026, voir D28).

**Parties et chaîne contractuelle (précisé le 22/10/2026)**
- **Suntory (cliente)** : utilisatrice et propriétaire des données de pilotage de ses collaborateurs.
- **Impact (agence)** : donneuse d'ordre et **payeuse** du prestataire ; responsable de traitement pour ses salariés et intervenants.
- **Prestataire FREELANCE (T. SOEFOU)** : conçoit, développe, héberge et facture à l'agence. Dans ce registre, « l'agence » désigne Impact et « le prestataire » désigne le profil FREELANCE.
- Chaîne retenue : Suntory → Impact → prestataire FREELANCE → hébergeur. Le prestataire est donc **sous-traitant d'Impact** ; l'hébergeur et l'e-mail transactionnel sont ses sous-traitants ultérieurs.

**Lecture des statuts**
- **Position prestataire arrêtée** : décidée par T. SOEFOU, en tant que prestataire, le 22/10/2026 dans la session de cadrage. Elle engage la manière de travailler du prestataire ; elle ne vaut ni accord d'Impact (l'agence), ni accord de la cliente.
- **À valider cliente / IT / DPO** : proposition à soumettre ; Claude Code ne la traite jamais comme acquise.
- **Ouvert** : aucune position. Bloque le lot indiqué.

## 1. Positions arrêtées le 22/10/2026

| ID | Objet | Position | Statut | Reste à valider | Impact développement |
|---|---|---|---|---|---|
| D03 | Périmètre et séquence | Deux étapes. **A : démonstrateur cliquable en priorité** (fonctionnalités montrées d'abord, données fictives). **B : MVP complet** ensuite. | Position prestataire arrêtée | La cliente valide le périmètre B après la démonstration | Lots A0 à A7 d'abord ; lots B interdits sans « feu vert B » écrit |
| D04 / Q20 | Fichier unique du Workshop | **Pont temporaire** : Excel structuré en entrée et sortie contrôlées ; la plateforme devient la source de vérité. Une seule base maître. | Position prestataire arrêtée | Cliente : période de double saisie bornée, date de bascule (Q9) | Import en quarantaine, export contrôlé, jamais deux sources maîtres |
| D02 / D19 / Q2 | Hébergement | **Le prestataire choisit l'hébergeur et le refacture à l'agence Impact** : ligne dédiée du devis, coût transparent. Le choix précis reste à faire. | Position arrêtée sur le principe | Impact : accepte la refacturation. Cliente : autorise la liste des sous-traitants ultérieurs. Offre, région, DPA : à établir | Aucune donnée réelle en ligne avant D02 / D19 complets. Le démonstrateur n'utilise que des données fictives |
| D20 / Q3 | Authentification | **Comptes créés par l'administrateur de la plateforme (le prestataire, puis des administrateurs désignés), réinitialisation par e-mail par l'utilisateur.** Raffinement recommandé : l'administrateur saisit identité, rôle et périmètre mais ne connaît jamais le mot de passe ; l'utilisateur le définit via un lien d'invitation à usage unique. | Orientation arrêtée ; raffinement à confirmer | MFA : voir la ligne dédiée. SSO cliente : option ultérieure | Démonstrateur : écran de connexion simulé avec profils de démo. MVP : auth réelle (lot B1) |
| D11 / Q17 | Sens de « pickup » | **Deux événements distincts** : prise de poste et remise du véhicule. « Recrutement finalisé » ≠ « Poste démarré ». | Position prestataire arrêtée | Métier cliente : table de correspondance des anciens statuts, sens exact de la colonne actuelle de M2 | Statuts séparés dès le démonstrateur (lot A3) ; table de migration marquée « provisoire » |
| D14 / D15 / Q18 | Saisie terrain (démonstrateur) | **Grain mission / site et jour, saisie par l'intervenant**, validation par le RS ou l'agence. | Position prestataire arrêtée pour le démonstrateur | Cliente et IT : équipement, hors ligne, qui valide les corrections (D14), saisie déléguée éventuelle | Lot A5 ; le hors ligne reste simulé |
| D22 / Q7 | Règle de doublon | **Doublon exact (D1) et doublon à l'import (D7) bloquants ; D2, D3, D5 en alerte ; D4, D6 en information.** | Position prestataire arrêtée | Cliente : confirmer ou ajuster règle par règle | Règles paramétrables, pas figées (lot A2) |
| D22 / Q6 | Quotas permanent et saisonnier (démonstrateur) | **Affichage « à définir » en gris**, aucune jauge inventée. | Position arrêtée le 22/10/2026 | Cliente et agence : définir ou non un quota, en heures ou en €, à quelle maille | Lot A4 |
| D20 / Q3 (MFA) | Double facteur au MVP | **Obligatoire pour l'agence, les administrateurs et les accès financiers.** Pour les RS et intervenants : mot de passe seul, avec limitation de débit et révocation rapide. | Position arrêtée | Cliente / IT : accepter ce périmètre ; RS : à reconsidérer si accès à des coûts | Lot B1 |
| D29 | Présentation du devis | **Deux lots séparés** : lot A (démonstrateur) chiffré ferme ; lot B (MVP) chiffré après le démonstrateur et les décisions D05 à D08, conditionné au feu vert. Hébergement en ligne refacturé séparément. Devis adressé à l'agence Impact. | Position arrêtée (nouvelle ligne du 22/10/2026) | Impact : accepte-t-elle ce découpage ? Cliente : accepte-t-elle la structure de coûts ? | Aucun lot B chiffré avant D05 à D08 |
| D17 | Qualification RGPD | **Qualification par traitement avec les deux DPO (cliente, agence), et prestataire sous-traitant d'Impact** (chaîne de sous-traitance via l'agence). | Position arrêtée | Cliente : autorisation du sous-traitant ultérieur (le prestataire) ; DPO : rôles par traitement, registre T1 à T14, contrats article 28, durées ; AIPD | Aucune donnée réelle avant D17 qualifié |
| D27 / Q23 | Langues | **Français et anglais.** Codes métier et listes autorisées identiques derrière les traductions. | Position prestataire arrêtée | Cliente : périmètre de la traduction (écrans, e-mails, exports) | Internationalisation dès le lot A1 ; charge supplémentaire à chiffrer |
| D28 | Signature des livrables | **FREELANCE.** Contact de signature : Tadjidine.smf@gmail.com. | Position prestataire arrêtée | À reporter dans le devis et les contrats d'hébergement (partie contractante : profil FREELANCE) | Livrables externes (présentation, devis, documents) signés FREELANCE ; aucune signature dans les écrans du démonstrateur |

### Conséquences à porter au devis (hébergement refacturé)
- Ligne « Hébergement et services associés (refacturés) » : hébergeur, base, stockage, sauvegardes, envoi d'e-mails, supervision. Montants non fixés ici.
- Le **prestataire FREELANCE** souscrit les abonnements d'hébergement et les refacture à l'agence Impact ; la signature FREELANCE (D28) fait donc de lui la partie contractante du devis et de l'hébergement.
- Le prestataire est sous-traitant d'Impact. Impact est elle-même sous-traitante de Suntory pour ce qu'elle traite pour son compte : le prestataire est alors un **sous-traitant ultérieur** pour Suntory. L'article 28 impose l'autorisation préalable de Suntory et la répercussion de ses obligations dans le contrat du prestataire. Prévoir : contrat Impact → prestataire, liste des sous-traitants ultérieurs (hébergeur, e-mail transactionnel), réversibilité et suppression en fin de mission.
- Pour les données des intervenants d'Impact (absences, affectations, recrutement), Impact est responsable de traitement et le prestataire son sous-traitant : à inscrire dans le registre T4 à T8.
- Les contrats et leur forme juridique sont à faire valider par les DPO ou un conseil ; ce registre ne tient pas lieu d'avis juridique.
- Réversibilité : la cliente doit pouvoir récupérer ses données dans un format ouvert.
- Un service « Europe » n'est pas forcément dans l'UE : vérifier la région exacte de chaque service.

### Règles de l'authentification retenue (à implémenter au lot B1)
- Création de compte : e-mail, organisation, rôle, périmètres. Aucun mot de passe saisi par l'administrateur.
- Invitation : lien à usage unique, durée courte (valeur à fixer), invalidé après usage.
- Réinitialisation : lien envoyé par e-mail, à usage unique ; message de réponse identique que le compte existe ou non ; limitation de débit.
- Politique de mot de passe : reprise du module de comptes actuel (12 caractères avec 4 catégories, ou 14 caractères).
- Révocation côté serveur ; sessions limitées ; journal d'audit des connexions et changements de rôle.
- MFA par application d'authentification pour les rôles marqués obligatoires.
- Le choix de la bibliothèque d'authentification se fait au lot B1 après vérification de la maintenance, du support MFA et d'une évolution possible vers OIDC.

## 2. Décisions encore ouvertes

| ID | Objet | À trancher avec | Bloque |
|---|---|---|---|
| D01 | Lever « local uniquement » ; architecture partagée | Cliente, agence, IT | Étape B |
| D05 / Q13 | Consommé et atterrissage (réalisé valorisé, facturé, payé) | Finances cliente, agence | Moteur financier |
| D06 / Q14 | Grille de tarifs contractuels datés (remplace la grille de travail) | Agence, valideur contractuel | Chiffrage réel |
| D07 / Q15 | Budgets de référence par campagne, CVR, période | Cliente (finances) | Alertes budget réelles |
| D08 / Q16 | Visibilité des coûts et des données personnelles par rôle | Cliente, agence, DPO | API et exports |
| D14 / Q4 | Terrain : équipement, hors ligne, validation des corrections | Métier, IT | Application RS réelle |
| D16 / Q19 | Carence terrain et délai de carence légal | RH / juridique, métier | Axe carences réel |
| D18 / Q12 | Durées de conservation, AIPD | DPO des deux parties | Mise en service |
| D21 | Dépôt manuel ou SharePoint | Propriétaire source, IT | Automatisation |
| D22 / Q6 / Q8 | Quotas permanent et saisonnier, semaine ISO (ISO 8601 proposé) | Cliente, agence | Règles métier définitives |
| D23 | Objectifs de reprise (RPO / RTO) et support | Pilote, exploitant | Exploitation |
| D24 | Sources absentes et gabarits contractuels | Référents data | Non-régression des imports |
| D25 / Q22 | Logos, fonds de carte, licences | Cliente, agence | Diffusion |
| D26 | Date de livraison du démonstrateur et du MVP | Sponsor, agence | Planning |

## 3. Hypothèses de travail (non décisions)

- **Contact de signature** : l'adresse e-mail fournie sert uniquement au bloc de signature des livrables externes ; elle n'est utilisée ailleurs ni dans le code ni dans les fixtures.
- **Démonstrateur à la date cible du 10/11/2026** : hypothèse. La date indiquée dans la présentation V0.2 devient la date cible du démonstrateur (étape A), pas du MVP. Aucune date n'est promise pour l'étape B.
- **Pile technique** : proposition du lot A0 (voir `CLAUDE.md`), à confirmer par T. SOEFOU avant le lot A1.
- **Tarifs et budgets du démonstrateur** : valeurs fictives, affichées comme telles, jamais reprises des classeurs réels.

## 4. Mise à jour proposée de mémoire de mission (non enregistrée)

Le 22/10/2026, le prestataire retient pour Suntory : étape A (démonstrateur sur données fictives) puis étape B (MVP) ; fichier unique du Workshop comme pont temporaire ; hébergement choisi par le prestataire et refacturé à Impact au devis ; comptes créés par l'administrateur de la plateforme avec réinitialisation par e-mail. Ces points ne sont validés ni par Impact ni par la cliente. Signature FREELANCE, pickup en deux événements, saisie terrain par l'intervenant, doublon exact bloquant et FR/EN sont également retenus côté prestataire. Le 22/10/2026 sont aussi retenus : quotas permanent et saisonnier affichés « à définir » au démonstrateur ; MFA obligatoire pour l'agence, les administrateurs et les accès financiers ; devis en deux lots (A ferme, B après démonstrateur et décisions D05 à D08) adressé à Impact ; chaîne de sous-traitance Suntory → Impact → prestataire FREELANCE → hébergeur, avec qualification par traitement par les deux DPO. Hébergeur précis, règles financières, durées de conservation, AIPD et autorisation du sous-traitant ultérieur par la cliente restent ouverts.
