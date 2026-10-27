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

## 5. Compléments de cadrage du 22/10/2026 (propositions, non validées)

Détail : `COMPLEMENTS_CADRAGE/10` à `13`. Aucune de ces lignes n'est une décision validée.

| N° | Sujet | Proposition du prestataire | Statut | Décideur attendu |
|---|---|---|---|---|
| D30 | Direction visuelle | **Charte mixte** : Suntory Beverage dominant (`suntorybeverageandfood-europe.com-DESIGN.md`), codes couleur Marvesting visibles sur les éléments importants (rose jamais en texte courant, jamais pour « erreur ») ; design Norton écarté | Décidée par T. SOEFOU le 22/10/2026 ; cliente à confirmer | Cliente via Impact |
| D31 | Logos | Dossier `LOGOS` fourni (logo Marvesting `#FF5648` exploitable ; image Suntory = composition à recadrer, logo officiel à demander) ; emplacements prévus mais **aucun logo dans le code avant D25 / Q22** | Fichiers fournis ; usage à confirmer | T. SOEFOU, Impact, cliente |
| D32 | PWA ou native | Web responsive d'abord ; décision après réponses terrain | Ouvert | Métier, IT, Impact |
| D33 | Moyen de connexion | **Fournisseur d'identité = l'agence** (décision T. SOEFOU 22/10/2026) ; fédération OIDC proposée ; comptes de secours locaux ; question « e-mail pro des intervenants » levée (D42) | Décidée par T. SOEFOU ; Impact, cliente, DPO à confirmer | Impact, cliente, DPO |
| D34 | Étendue du second facteur | Position MFA inchangée, **appliquée par l'IdP de l'agence** ; étendue à direction / DR / CVR à décider | Ouvert | Cliente, Impact |
| D35 | Récupération d'un administrateur | Quatre yeux, délai, vérification côté Impact | Proposition | Impact, prestataire |
| D36 | Paramètres de sécurité | Durées de liens, verrouillage, session, revue | Ouvert | Impact, cliente, IT |
| D37 | Composant d'authentification | Réduit à une bibliothèque OIDC éprouvée côté application (IdP = agence) ; versions et licences à vérifier | Ouvert | T. SOEFOU |
| D38 | Principes karpathy | Version adaptée intégrée dans `CLAUDE.md` (section « Principes de conduite ») | **Validée** par T. SOEFOU le 22/10/2026 | — |
| D39 | Agents | **11 agents adoptés en portée projet** (`agents-projet/` du dépôt (activation par copie dans `.claude/agents/`, à faire sur votre poste)) après vérification de fiabilité : audits en lecture seule, aucun `Bash`, aucun réseau ; 2 adaptés (script d'origine absent) ; essai sur données fictives et bilan requis | Décidée par T. SOEFOU sous condition de fiabilité ; vérification faite le 22/10/2026 | T. SOEFOU (bilan d'essai) |
| D40 | Agents métier | Report après le démonstrateur | Proposition | Impact, cliente, DPO |
| D41 | Premières automatisations | Contrôle Excel, anomalies, relances à valider, supervision | Ouvert | Impact, cliente |

## 6. Décisions du 22/10/2026 (T. SOEFOU) : ajouts

Détail : `COMPLEMENTS_CADRAGE/14_DECISIONS_22-10_CHARTE_ACCES_AGENTS.md`.

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D42 | Intervenants | Ils n'utilisent pas l'outil seuls : aucun compte intervenant ; saisie par RS / CVR / agence pour leur compte ; révise D14 / Q18 (saisie « par l'intervenant ») | Décidée par T. SOEFOU | Impact |
| D43 | CVR et DR | Utilisent l'outil selon leurs périmètres budgétaires alloués, managés par la cliente et l'agence ; règle d'allocation, dépassement et visibilité des coûts à préciser | Décidée ; règle ouverte | Cliente, Impact |
| — | Statut du RS | Non précisé : utilisateur ou non ? | Ouvert | T. SOEFOU |

### Mise à jour proposée de mémoire (non enregistrée)
Voir la section 6 du document 14.

### Compléments du 22/10/2026 (suite) : détail dans `COMPLEMENTS_CADRAGE/15_...`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D44 | RS | **Utilisateurs** : ils saisissent les besoins par magasin de leur secteur | Décidée par T. SOEFOU | Impact, cliente |
| D45 | Workflow managérial | Suit la chaîne DNV › DR › CVR › RS › magasins et la sectorisation des fichiers (découpe, listing, référentiel) ; rattachement par magasin, jamais par département | Décidée ; RACI, suppléants et délais ouverts (D09) | Cliente, Impact |
| D43 | Allocation budgétaire | Suit les classeurs (roll-up National › DR › CVR, quota affecté / dépensé / restant / prévisionnel, versions datées, réalimentation par carence) et le module de pilotage ; qui modifie une enveloppe, maille RS, dépassement, seuils : ouverts | Décidée sur le principe ; règles ouvertes | Cliente, Impact |
| D30 | Rose Marvesting | Accepté dans l'espace cliente (accord de T. SOEFOU) ; couleur de référence `#E52365` ou `#FF5648` à trancher | Accord prestataire | Cliente au démonstrateur |
| D24 | Sectorisation | Écarts entre fichiers : codes DR `F1` / `D001`, 4 037 lignes de découpe contre 496 magasins, colonne « AC », source maître non déclarée | Ouvert | Référents data |

### Compléments du 22/10/2026 (fin de journée) : détail dans `COMPLEMENTS_CADRAGE/16_CATALOGUE_FONCTIONNEL_V0.1.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D31 | Logos | Usage confirmé par T. SOEFOU (Suntory en en-tête, Marvesting en pied de page / connexion) ; logo Suntory officiel à demander à Impact ; aucun logo dans le code avant D25 / Q22 | Confirmée ; droits à lever | Impact, cliente |
| D44 / D45 | Workflow RS | Validé par T. SOEFOU | Validée | Impact, cliente |
| D46 | Réallocation budgétaire | La cliente et l'agence réallouent ou ajustent dans leurs paramètres ; l'effet est visible dans les autres espaces. Mode simple ou double validation : proposé « double », à confirmer | Décidée sur le principe ; mode ouvert | T. SOEFOU, cliente, Impact |
| D39 | Agents | Acceptés ; activation par T. SOEFOU sur son poste | Acceptée | T. SOEFOU |
| D47 | Catalogue fonctionnel | 12 modules, phases A / B / C ; proposé comme base des lots ; A4 à scinder (A4a / A4b) | Proposé, non validé | T. SOEFOU |

### Arbitrages du 22/10/2026 (T. SOEFOU) sur le catalogue 16

| N° | Sujet | Décision | Statut |
|---|---|---|---|
| D47 | Catalogue fonctionnel V0.1 | Validé comme base des lots | Validée par T. SOEFOU (cliente et Impact : à confirmer) |
| D46 | Réallocation | Double validation (l'un propose, l'autre valide) ; visibilité propagée | Validée par T. SOEFOU |
| D30 | Rose Marvesting | `#E52365` pour l'interface ; logo inchangé | Validée par T. SOEFOU |
| D48 | Lot A4 | Scindé en A4a et A4b | Validée |
| D31 | Logo Suntory | Utiliser le logo fourni, sans demande à Impact ; le recadrage et la levée de D25 / Q22 restent à traiter avant intégration au code | Décidée ; droits à lever |
| D49 | Signature des livrables externes | Profil FREELANCE | Décidée |

### Décisions du 22/10/2026 (données Excel) : détail dans `COMPLEMENTS_CADRAGE/17_CADRAGE_DONNEES_EXCEL_V0.1.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D50 | Source du Permanent | TBB fait foi pour les montants ; 4C pour le détail des périodes | Décidée par T. SOEFOU | Cliente, Impact |
| D51 | Ajustement et écriture | Tout est ajustable dans l'application, puis écrit dans le fichier Excel branché ; écriture simulée à l'étape A | Décidée sur le principe ; mécanisme ouvert | T. SOEFOU, Impact |
| D52 | Fichier de besoins | Le fichier de `02_SAISIE_PARTAGEE` (Suivi Merch Perm Saisonnier 2026) est le dernier validé ; à restructurer pour l'écriture. Proposé : tables BESOINS et AFFECTATIONS liées par `need_id` | Décidée ; structure proposée | T. SOEFOU |
| D53 | Langage | Axes métiers recueillis et mis en conformité de langage (FR/EN) ; glossaire §5 du doc 17 | Proposé | T. SOEFOU, cliente |

### Suite du 22/10/2026 (soir) : détail dans `COMPLEMENTS_CADRAGE/17_...` §9

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D52 | Fichier de besoins | Confirmé : base `Suivi_Merch_Perm_Saisonnier_2026` + table BESOINS liée aux affectations | Confirmée par T. SOEFOU | — |
| D54 | Statuts | Table du §5.3 et valeurs « facturé ? » du §9.4 validées | Validée par T. SOEFOU | Cliente |
| D55 | Sources ajoutées | `CONTRAT_MODULE` retenu comme contrat de lecture des classeurs sources ; harmonisation et design périmés ; modules V3.10-3.12 historiques | Arbitré par le prestataire (T. SOEFOU : « tu arbitreras ») | T. SOEFOU |
| D56 | Plateforme et Excel | Les utilisateurs travaillent sur la plateforme ; les Excel servent à l'écriture (projection) et à l'export selon paramètres et axes. Socle : hébergeur UE autorisé + fichiers d'échange ; écriture directe dans le SharePoint d'Impact facultative (doc 18 en brouillon) | Décidée sur le principe par T. SOEFOU ; hébergeur à valider avec Impact et la cliente | Impact, cliente |
| D57 | Constructeur d'exports | Paramètres (type, campagne, période, périmètre, colonnes, indicateurs, langue, format) et axes de reporting du doc 19 §6 | Proposé | T. SOEFOU |

### Reporting du 22/10/2026 : détail dans `COMPLEMENTS_CADRAGE/20_MOTEUR_REPORTING_PDF_PPTX_V0.1.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D58 | Export PDF et PPTX | Moteur basé sur le modèle Marvesting ; PPTX et PDF paysage | Demandée par T. SOEFOU ; faisabilité démontrée par prototype fictif | Impact (droits du modèle) |
| D59 | Graphiques | Sélectionnables selon indicateurs et périmètres ; règles de choix du doc 20 §4 | Demandée ; règles proposées | T. SOEFOU |
| D60 | Boucles de reporting | Workflow d'automatisation par boucles métiers ; rapport préparé automatiquement, jamais envoyé sans validation ; objectif « 80 % d'administratif évité » à mesurer | Demandée ; objectif à mesurer | T. SOEFOU, cliente |
| D61 | Lot A4c | Reporting COPIL (PPTX et PDF) sur données fictives, après A4a et A4b ; gabarit COPIL Marvesting à produire avant | Proposé | T. SOEFOU |

### Charte douce et reporting terrain du 22/10/2026 : détail dans `COMPLEMENTS_CADRAGE/22_CHARTE_DOUCE_EXPORTS_V0.1.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D62 | Style des exports | Aucune ligne droite, aucun cadratin, aucune phrase antithétique ; cartes, pastilles, capsules ; contrôle automatique avant publication | Validée par T. SOEFOU | Aucun |
| D63 | Style de l'interface | Même douceur, esprit Apple dosé à 15 % dans l'interactivité et les éléments graphiques (sens de « 15 % » à confirmer) | Validée par T. SOEFOU | T. SOEFOU |
| D64 | Logos des exports | Logos Suntory et Marvesting sur tous les exports de reporting | Validée par T. SOEFOU | Cliente (droits, D25) |
| D65 | Photos terrain | Photos de rayons et d'actions merchandising, aucune personne ; visibles par la cliente ; durée de conservation fixée par Impact | Validée par T. SOEFOU | Impact (durée), enseignes (droit de photographier) |
| D66 | Coûts dans les exports cliente | L'agence choisit de les afficher ou non, rapport par rapport | Validée par T. SOEFOU | Aucun |
| D67 | Principe d'automatisation | L'agence manipule le moins possible d'Excel ; chaque manipulation conservée est justifiée | Validée par T. SOEFOU | Aucun |
| D68 | Reporting besoins selon recrutements | Mode paramétrable : dates, secteurs, indicateurs financiers, heures et jours | Validée sur le principe ; contenu à détailler (étape C) | T. SOEFOU |
| D69 | Dossier REPORTING | Gabarit Marvesting de 53 diapositives (guide générique) et deux photos de couverture ; aucune trame de COPIL réelle fournie ; photo de couverture et gabarit : droits à confirmer | Constat du prestataire | Impact |

### Trame Marvesting et pages paramétrées du 22/10/2026 : détail dans `COMPLEMENTS_CADRAGE/22_CHARTE_EXPORTS_ET_PAGES_V0.2.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D70 | Trame des exports de reporting | Trame Marvesting conservée à hauteur de 70 % ; remplace la dominante Suntory pour les exports seulement, l'interface garde la charte mixte | Validée par T. SOEFOU | Aucun |
| D71 | Pages et exemples | Spécification de rapport (pages, options, sélection manuelle, par règle ou mixte), pagination automatique, plafond de pages | Proposée | T. SOEFOU |
| D72 | Fidélité au gabarit | Garde-fou : minimum 70 % par page, réglable par l'agence ; le score mesure l'écart au gabarit | Proposée | T. SOEFOU |

### Reporting terrain et échéances de saisie du 23/10/2026 : détails dans `COMPLEMENTS_CADRAGE/23_...` et `24_...`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D73 | Ajustements du reporting | Reporting validé ; trame, titres, photo de couverture, pages, sélections et génération réservés aux profils agence | Validée par T. SOEFOU | Droits de consultation CVR, DR |
| D74 | Logos | Logos fondus dans les pages, sans pastille, version blanche, marine ou couleur selon le fond | Appliquée au prototype | Cliente (droits, D25) |
| D75 | Photo de couverture | Fusionnée au fond du gabarit, définition minimale 144 points par pouce, alerte en dessous | Appliquée au prototype | Impact (droits de la photo) |
| D76 | Titre et nom de fichier | Titre modifiable ; nom déduit `CLIENT_TITRE_PÉRIODE_DATE_Vn` | Appliquée au prototype | Aucun |
| D77 | Détail région, secteurs, magasins | Deux types de pages avec pagination ; RS non affiché par défaut ; annexe Excel ; quota par secteur et heures par magasin à vérifier | Proposée | T. SOEFOU |
| D78 | Après échéance | Saisie bloquée pour le mois concerné | Validée par T. SOEFOU | Aucun |
| D79 | Alerte avant échéance | Alerte obligatoire avant la date finale | Validée par T. SOEFOU | Aucun |
| D80 | Deux échéances par mois | Saisie des besoins et demandes de changement, calendrier paramétré par l'agence ; novembre : changements au plus tard cette semaine | Validée sur le principe | T. SOEFOU (date exacte) |
| D81 | Cockpit cliente | Alertes et résumés des retards, présentation soignée et lisible | Validée par T. SOEFOU | Aucun |
| D82 | Presets, cascade, report, réouverture | Preset Standard recommandé, cascade J-5, J-2, jour J, report sur M+1, réouverture par l'agence seule | Proposée | T. SOEFOU |
| D83 | Logo Marvesting orange | Retiré des exports de reporting, seul le logo Suntory reste ajouté dans la page ; remplace D64 ; marques propres au gabarit à confirmer | Demandée par T. SOEFOU le 23/10/2026 ; appliquée au prototype | T. SOEFOU |
| D84 | Expérience personnelle par utilisateur | Salutation par prénom, titres, chiffres, alertes et actions limités au périmètre et au rôle ; repli sans nom inventé ; aucun nom d'autre utilisateur dans les écrans cliente | Condition posée par T. SOEFOU le 23/10/2026 ; maquettes Carine (cliente) et Julien (CVR), fictives | T. SOEFOU |
| D85 | Quota et statuts au secteur | Pas de quota de secteur (quota au niveau DR et CVR) ; consommé et statuts Pourvu, Réattribué (merch déjà sur le secteur, nouveau magasin), Stoppé (motif), Zone blanche (hors taux pourvu, ligne séparée) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D86 | E-mail | Complément limité : rappel jour J aux retardataires, résumé du lundi à la cliente, sans chiffre, lien vers l'application | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D87 | Délais, réouverture, consultation | Délai mesuré par situation ; réouverture demandée par les CVR seuls, décidée par l'agence ; CVR et DR consultent leur périmètre ; partage des rapports publiés par l'agence dans l'application | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D88 | Choix des types de graphiques | Réglage par graphique : Auto (proposition selon la nature des données) ou barres, colonnes, empilées, donut, camembert, courbe, jauge ; contrôle en trois niveaux (cohérent, avertissement, refus), trace dans la spécification ; arbitrage éditable ou dessiné à trancher (doc 25 §7) | Demandée par T. SOEFOU le 23/10/2026 ; règles proposées | T. SOEFOU |
| D89 | Graphiques dessinés ou éditables | Dessinés en formes arrondies par défaut, option « graphique éditable » en natif page par page avec contrôle de style assoupli, valeurs toujours en annexe Excel ; arbitre D59 et D62 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |

### Étape C du 23/10/2026 : matrice fonctions, événements, rapports, boucles et mode recrutements, détail dans `COMPLEMENTS_CADRAGE/26_MATRICE_FONCTIONS_EVENEMENTS_RAPPORTS_BOUCLES_V0.1.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D90 | Matrice de référence | Trois catalogues liés : 37 événements EV, 15 rapports R, 15 automatisations AUT ; aucun rapport sans événement source ni boucle | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D91 | Journal des événements métier | Chaque changement d'état est un événement daté (effet, saisie), jamais réécrit ; base des rapports, alertes et reconstitution à une date ; horloge de démonstration et instantané hebdomadaire | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D92 | États de l'entonnoir | Six états (À recruter, En recrutement, Proposé, Validé, Recruté, En poste) ; « Pourvu » des rapports = En poste ; deux taux affichés. Précise D11 et D85 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, métier cliente |
| D93 | Mesure des délais | Quatre jalons, par situation, médiane, étendue, effectif ; effectif minimal paramétrable. Précise D87 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D94 | Boucles | Cinq familles ; le rapport se prépare seul et ne part jamais seul ; rodage de deux cycles en file validée avant envoi automatique des e-mails D86 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D95 | Priorités | R-01 état des besoins et recrutements, R-02 COPIL mensuel, R-05 suivi des échéances ; lot A4c scindé en A4c1 et A4c2 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D96 | Objectif de 80 % | Cible mesurée sur deux cycles avec chronométrage de référence | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, Impact |
| D97 | Retours en arrière | Refus de la cliente ou désistement : retour à « En recrutement » avec compteur, rien d'effacé | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, métier cliente |

### Étape B du 23/10/2026 : fiche de fonction photos terrain, détail dans `COMPLEMENTS_CADRAGE/27_FICHE_DE_FONCTION_PHOTOS_TERRAIN_V0.1.md`

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D98 | Fonction photos terrain | Finalité d'illustration des rapports, contenu sans personne (D65), import par RS, CVR, agence (D42), validation par l'agence avant tout usage | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU ; Impact et cliente (finalité) |
| D99 | Protection à l'import | Dix mesures (métadonnées retirées, ré-encodage, signalement de visages et plaques, stockage UE chiffré, accès par rôle, journal) ; la détection signale, l'humain tranche ; original non flouté non conservé après validation | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU ; DPO |
| D100 | Statuts et usage | Sept statuts distincts ; usage interne ou rapports de la cliente réglé à la validation | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D101 | Règle par enseigne | Paramètre photos autorisées par enseigne, défaut « à confirmer », import refusé sans autorisation | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU ; Impact (enseignes) |
| D102 | Conservation | Durée paramétrable fixée par Impact, purge programmée incluant dérivés et exports archivés, limite écrite pour les fichiers déjà téléchargés | Validée par T. SOEFOU le 23/10/2026 | Impact, DPO |
| D103 | Lot A5b | Photos terrain sur images fictives, après A5 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |

### Questionnaire A0 du 23/10/2026 : réponses de T. SOEFOU (détail dans `docs/COMPTE_RENDU_A0.md` §9)

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D104 | Aperçu visuel à chaque étape | Serveur local, navigateur intégré, captures Playwright par profil, langue et largeur, lecture console et réseau ; démonstrateur **en local**, aucun lien externe avant la décision d'hébergement (D02/D19) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D105 | Pile de l'étape A | Next 16.4.2, React 19.3.1, TypeScript 6.0.3, Tailwind 4.3.3, Vitest 5.0.5, Playwright 1.64.1, Zod 4.6.7, next-intl 4.14.9 ; compatibilité vérifiée à l'installation de A1 ; essai de TypeScript 7 en branche à part | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D106 | Noms à côté des codes DR, CVR, RS | **Libellé de zone et nom de la personne responsable** affichés à côté du code, par un composant unique `ZoneLabel` (interface, e-mails, exports). Noms fictifs au démonstrateur ; noms réels à l'étape B | Décidée par T. SOEFOU le 23/10/2026 (« pas de souci ») ; réserve proposée : avis des DPO avant noms réels (D17, D18) | DPO |
| D107 | Personnalisation uniforme | Un contexte d'accès unique (profil, périmètre, vocabulaire, langue) pour tous les écrans, e-mails et exports | Validée par T. SOEFOU le 23/10/2026 (recommandation suivie) | T. SOEFOU |
| D108 | Audience des alertes | Champ `audience` obligatoire (agence, cliente, les deux), défaut refus ; filtrage dans la couche de données. Réservées à l'agence (proposition par défaut) : retards de proposition internes, coûts et chiffrage incomplet, qualité des données et imports, alertes techniques | Validée par T. SOEFOU le 23/10/2026 (recommandation suivie) | T. SOEFOU, Impact |
| D109 | Cartographie | **La découpe réelle peut être utilisée** (réponse de T. SOEFOU). Contredit la règle « aucune donnée réelle » de CLAUDE.md : dérogation proposée aux conditions de D112 bis ci-dessous | Décidée par T. SOEFOU le 23/10/2026 ; conditions proposées | T. SOEFOU, Impact et cliente (accord d'usage de la découpe) |
| D109 bis | Conditions de la dérogation D109 (proposées) | Fichier de découpe **jamais versionné**, chemin local par variable d'environnement ; lu par un importeur générique ; aucune valeur dans les prompts, journaux, captures ni fixtures ; bandeau « DONNÉES RÉELLES LOCALES » distinct du bandeau fictif ; démonstration à la cliente sur le poste du prestataire seulement ; contours cartographiques embarqués localement, licence vérifiée (D25) | Validée par T. SOEFOU le 23/10/2026 (confirmation des conditions) | Impact et cliente : accord d'usage de la découpe |
| D110 | Périmètre de la démonstration du 10/11 | Noyau A1, A2, A3, A4a, A5, A6 ; A4b, A4c1, A4c2, A5b à la seconde démonstration ; la date reste indicative (D26 ouvert) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU, cliente |
| D111 | Garde-fous avant A1 | Corriger `.gitignore` et `04_JEUX_ESSAI_ET_RECETTE.md` (codes fictifs, profil Intervenant) avant A1 ; modifications préparées par Claude, appliquées par T. SOEFOU | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D112 | Ordre et découpage des lots | A0b avant A2 (A1 n'en dépend plus) ; A2 scindé en A2a (règles pures, événements, saisie unitaire) et A2b (saisie en lot, brouillon, échéances) | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D113 | Logos, photo de couverture, icônes | **Tous les logos fournis utilisables** au démonstrateur (réponse de T. SOEFOU) ; droits non levés (D25, D75, D31) : risque porté par le prestataire. **Aucune icône de style « IA »** (étincelles, baguette, robot, cerveau) : pictogrammes usuels et naturels pour les menus | Décidée par T. SOEFOU le 23/10/2026 | Impact, cliente (droits) |

### Réponses de T. SOEFOU du 23/10/2026 après lot A0b

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D54 (complément) | Statuts et « facturé ? » | Table de **9 statuts** de `STATUTS_ET_ETATS.md` validée ; règle : « Validé » facturable **à partir de la date de prise de poste** | Validée par T. SOEFOU le 23/10/2026 | Cliente (colonne « facturé ? ») |
| D114 | Politique de connecteurs (Supabase, Vercel, GitHub) | À l'étape A : lecture et aperçu uniquement avec fixtures fictives ; aucune donnée réelle, aucun déploiement public | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D115 | Hébergement de l'étape B | **Instruire OVHcloud d'abord** (`HEBERGEMENT_CONFORME.md` §3 bis). **Aucun hébergeur retenu** ; choix et contrat après instruction | Validée (instruction) le 23/10/2026 ; choix non fait | T. SOEFOU, Impact, DPO |
| D116 | Référentiels de livraison | Accessibilité (WCAG/RGAA) et niveau de sécurité (ASVS) à fixer avec Impact avant la fin de l'étape A | Validée (point ouvert enregistré) le 23/10/2026 | Impact |
| D117 | Signature des livrables externes | Profil **FREELANCE** pour le dossier de stack et de livraison | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
D107 et D108 validées le 23/10/2026 (recommandations suivies).

### Direction visuelle du 23/10/2026 (A1 bis)

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D123 | Direction visuelle | Rapport éditorial clair, finition proche d'Apple : fond clair, cartes à ombre diffuse et bordure discrète, pile typographique système (SF Pro sur Apple, Inter en repli local), chiffres tabulaires, une couleur dominante dans les graphiques, aucun style « IA » (dégradés, étincelles, cadres anguleux). Modèle de page rapport ajouté à la bibliothèque de composants | Validée par T. SOEFOU le 23/10/2026 (recommandations acceptées) | T. SOEFOU, Impact |
| D124 | Mode sombre | **Conservé** (écart avec la recommandation de l'exclure en v1) : choix Système, Clair ou Sombre, mémorisé dans le cookie `demo_theme`, appliqué côté serveur sans flash ; contrastes WCAG testés dans les deux modes | Décidée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D125 | Icônes et page papier | Gabarit unique `Icon` (quatre tailles, trait ajusté à la taille), menu latéral avec pastille d'icône de 36 px (active : pastille pleine), plus aucun réglage de taille ou de trait dans les écrans. Rendu A4 du modèle de rapport (`@page` A4, marges de 14 mm, éléments d'interface masqués à l'impression), capture `rapport_A4_fr.png` et `rapport_A4_en.png` | Validée par T. SOEFOU le 23/10/2026 (demande d'une interface d'application premium) | T. SOEFOU |
| D126 | Cartes colorées et règle « aucun rendu IA » | Tuiles de chiffres clés : teintes par famille d'indicateur (aqua, lavande marine, sable), tuile d'ancrage marine pour le résultat principal (options A et C retenues). Rose réservé aux cartes qui demandent une action. Vert, ambre et rouge réservés aux statuts. Règle ferme : aucun trait qui souligne, aucun trait droit décoratif (bordures de cartes, séparateurs, pointillés, barre latérale du menu), aucun tiret dans les textes ; verrouillée par `tests/unit/style-rules.test.ts` | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |

### Cadrage des axes d'évolution du 23/10/2026 (analyse du dossier « Proposition cliente via agence »)

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D127 | Axes N1, N2, N3 | Fiche secteur (F-10.13, lot A4d), comparaison N / N-1 (F-10.14, dans A4a) et plans d'action sur dépassement (F-10.15, lot A4d) ajoutés au catalogue. Cadrage dans `docs/COMPLEMENTS_CADRAGE/28_CADRAGE_AXES_N1_N2_N3_N9_V0.1.md` | Décidée par T. SOEFOU le 23/10/2026 (« cadrons selon tes recos ») ; règles de détail en hypothèses H3, H4 | Cliente (D08 pour la visibilité des montants) |
| D128 | Axe N9 | Dimension « dispositif » distincte de la campagne (une campagne pour un seul dispositif) et paramètres par dispositif (F-30.10, F-30.11, règles P1 à P6) intégrés à A2b ; valeurs du Workshop reprises comme **valeurs de départ à valider**, pas en dur ; le paramètre du dispositif l'emporte sur le preset global (D82) | Décidée par T. SOEFOU le 23/10/2026 (cadrage) ; **H1 validée le 23/10/2026** ; hypothèse H2 et questions Q-N9-1 à Q-N9-5 ouvertes | Cliente, agence |
| D129 | Frontière de périmètre (N11, N12, N13) | Décision de frontière avant tout développement : lecture, écriture ou hors plateforme | Proposée, non cadrée | T. SOEFOU, cliente, agence |
| D130 | Données de personnes (N6, N7, N11) | Conditionnés à la qualification RGPD et à la durée de conservation D18 | Proposée, non cadrée | DPO, Impact |
| D131 | Lecture analytique par dispositif et par campagne | Filtre hiérarchique Dispositif puis Campagne sur tous les écrans de lecture et exports, vue « Par campagne » avec sous-totaux et réconciliation, **comparatif de campagnes côte à côte** (deux ou trois) | Décidée par T. SOEFOU le 23/10/2026 | Cliente |
| D132 | Saisie des jours | Cases à cocher LUN à DIM (un ou plusieurs jours, au moins un) pour tous les besoins ; DIM désactivé par défaut, paramètre du dispositif ; écart au dictionnaire LUN à SAM | Décidée par T. SOEFOU le 23/10/2026 ; Q-J1 ouverte sur le dimanche | Cliente, agence |
| D133 | Dates | Aucune date saisie à la main : calendrier de sélection (DatePicker, DateRangePicker, WeekPicker) pour tous les axes comportant une date ; règle commune 12 et test d'architecture | Décidée par T. SOEFOU le 23/10/2026 | T. SOEFOU |

### Validation du 23/10/2026 des points ouverts de A1 (recommandations suivies)

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D118 | Menu par profil | Table de `src/domain/menu.ts` : pas de Paramètres ni d'Administration côté cliente, pas de Budget pour le CVR, Administration réservée au prestataire | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D119 | Date en anglais | jj/mm/aaaa (en-GB) et semaine « W » ; format FR inchangé | Validée par T. SOEFOU le 23/10/2026 ; hypothèse à faire confirmer par la cliente | Cliente |
| D120 | Cookie de simulation | `demo_profile_simule`, valeur `sim.<profil>`, réservé à la démonstration, supprimé avant toute authentification réelle | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D121 | Police | Inter locale en attendant l'avis sur Roboto ; pile système Apple en premier (D123) | Validée par T. SOEFOU le 23/10/2026 | Impact |
| D122 | Noms de fixtures | Prénoms génériques fictifs conservés pour le démonstrateur, toujours étiquetés fictifs ; noms réels à l'étape B (D106) | Validée par T. SOEFOU le 23/10/2026 | DPO (avant noms réels) |
| Q-J1 | Dimanche dans les jours de saisie | Désactivé par défaut, activable par dispositif (D132) | Validée par T. SOEFOU le 23/10/2026 | Cliente, agence |
| D134 | Imports configurables | Profils d'import versionnés (N17 à N19) intégrés au lot A6 : correspondance de colonnes proposée et validée par un humain, jointures vers référentiels et entre fichiers, dérive de structure signalée ; analyse de structure des extractions réelles en local, sans valeur versionnée. Cadrage : `COMPLEMENTS_CADRAGE/29_CADRAGE_IMPORTS_CONFIGURABLES_V0.1.md` | Décidée par T. SOEFOU le 23/10/2026 ; questions Q-I1 à Q-I6 ouvertes | Cliente, agence |
| D136 | Opération, campagne et dispositif | Le second placement est un dispositif distinct (Workshop) ; une opération d'extraction est une campagne ; table `operation_dispositif` tenue par l'agence administration ; opération inconnue = ligne bloquée | Décidée par T. SOEFOU le 23/10/2026 | Cliente, agence |
| D137 | Gestion des profils d'import | Profils gérés par l'agence en mode administration seule ; doublons de code mission mis en attente ; données de personnes exclues par défaut à l'import | Décidée par T. SOEFOU le 23/10/2026 | DPO (données de personnes) |
| D138 | Statut en cas de divergence | Une source de référence par dimension : plateforme pour décision cliente, proposition, poste et facturation ; extraction en lecture seule pour le statut de mission LOGA ; divergence = alerte d'écart d'audience agence, aucune correction automatique | Décidée par T. SOEFOU le 23/10/2026 | Cliente |
| D139 | Codes magasin textuels | File « à rapprocher » visible de l'agence seule, suggestion sans application, confirmation humaine, rapprochement mémorisé, ligne non rapprochée comptée sous « Magasin non rapproché » | Décidée par T. SOEFOU le 23/10/2026 | Agence |

### Validation du 23/10/2026 après le lot A2a (recommandations suivies)

| N° | Sujet | Décision | Statut | À confirmer par |
|---|---|---|---|---|
| D140 | Interprétations W et D | Tableau du §4 de `COMPTE_RENDU_A2A.md` adopté comme jeu de règles par défaut de A2a, paramétrable (en particulier « type = dispositif » pour D1 à D3) | Validée par T. SOEFOU le 23/10/2026 | Cliente (valeurs finales) |
| D141 | Modèle du besoin | Périodes P1 et P2 imbriquées, secteur par référence de zone, magasins par code, états brouillon et soumis, statut de poste nul avant A3, **liste fermée « Poste 1 à 7 »** conservée jusqu'aux profils d'import (D134) | Validée par T. SOEFOU le 23/10/2026 | |
| D142 | W2 | Règle réservée aux saisies brutes (import, collage) | Validée par T. SOEFOU le 23/10/2026 | |
| D143 | Fusion de doublons | Extension de la période du besoin existant, autres champs conservés, **aperçu avant et après avant confirmation**, événement EV-03 ; comparaison champ par champ avec l'historique des révisions (A3) | Validée par T. SOEFOU le 23/10/2026 | Cliente |
| D144 | Journal | Anomalies EV-05 d'audience agence ; besoins EV-01 et EV-02 d'audience les deux | Validée par T. SOEFOU le 23/10/2026 | |
| D145 | Horizon et jours non ouvrés | W11 (horizon de saisie, 52 semaines au départ) et W16 (jours non ouvrés, dimanche et fériés au départ) deviennent des **paramètres par dispositif**, avec une valeur globale par défaut ; ajoutés à F-30.10 (`horizon_weeks`, `non_working_days`) en A2b | Validée par T. SOEFOU le 23/10/2026 | Cliente |
| D146 | Semaines dans le formulaire | Semaines de début et de fin **déduites des dates et affichées**, non demandées ; correction par un lien « corriger la semaine » ; W5 et W8 restent actives pour les imports et collages | Validée par T. SOEFOU le 23/10/2026 | |
| D147 | Réouverture d'une semaine clôturée | Aucune nouvelle décision : D82 et D87 s'appliquent (agence seule, motif, durée, trace ; demande par le CVR) ; mécanisme en A2b | Confirmée le 23/10/2026 | |
| D148 | Commit et push en fin de lot | Claude Code peut, en fin de lot et après le compte rendu, commiter et pousser **sa branche de session** ; jamais sur `main`, jamais de pull request ; fusion dans `main` après relecture. Règle mise à jour dans CLAUDE.md, le prompt maître et les règles communes | Décidée par T. SOEFOU le 23/10/2026 | |
| D149 | Export des rapports en anglais | Option de langue FR/EN dans la spécification de rapport ; un seul dictionnaire, aucune chaîne en dur dans les gabarits ; test « mêmes clés FR/EN » étendu aux exports ; test qui génère chaque rapport en EN et échoue sur toute chaîne française, clé brute ou format de date ou nombre FR ; contrôle visuel de chaque page EN ; glossaire métier FR/EN validé par T. SOEFOU avant A4c1 ; e-mails et file d'automatisation inclus (A4c2) | Validée par T. SOEFOU le 23/10/2026 (principe et périmètre) | Glossaire FR/EN validé le 23/10/2026 (`docs/GLOSSAIRE_FR_EN.md`) |
| D150 | Carte de France interactive | Lot dédié **A4e**, après levée de D25 ; zoom et déplacement fluides, survol et clic, sélection qui met à jour filtres et URL, Échap et fil d'Ariane, clavier complet, tactile, tableau équivalent toujours disponible (D116), contours embarqués en local | Validée par T. SOEFOU le 23/10/2026 | Licence D25 |
| D151 | Navigation web globale | Règle commune 14, appliquée dès A2b : état des filtres, période et périmètre dans l'URL (retour arrière, liens profonds, vues partageables) ; états chargement, vide et erreur sur chaque écran ; focus visible, lien d'évitement, fil d'Ariane, raccourcis clavier ; mobile et mouvement réduit ; seuils de performance mesurés en e2e | Validée par T. SOEFOU le 23/10/2026 | Seuils H3 : premier affichage utile sous 2 s, interaction carte sous 100 ms, **confirmés par T. SOEFOU le 23/10/2026** |
| D152 | Accords carte et découpe | Accords de l'agence et de la cliente **déclarés obtenus** par T. SOEFOU le 23/10/2026 : l'accord d'usage de la découpe (D109 bis) est levé ; D25 est levé (cartographie, logos). Source locale : dossier « FICHIERS POUR DEPARTEMENTS » (COG INSEE 2025, base des codes postaux, découpe, listing magasins, table d'appartenance communes), **hors dépôt, jamais versionné, jamais lu par Claude Code dans son environnement**. Aucun fichier de contours dans ce dossier ; les modules HTML V4 (M1, M2, M3) embarquent déjà des contours de départements (`W.FRANCE`, tracés SVG, 600 x 577,4). Origine **déclarée** par T. SOEFOU le 23/10/2026 : fichiers GeoJSON fournis avec les fichiers des départements ; ces GeoJSON sont **introuvables** dans les dossiers accessibles (aucun .geojson présent) : à fournir pour tracer la licence avant réutilisation, sinon jeu ouvert à embarquer en A4e (licence et attribution consignées). Trace écrite de l'accord à conserver par T. SOEFOU. **Portée de D25 étendue aux logos** (confirmée par T. SOEFOU le 23/10/2026) ; D31 reste valable pour la forme (logo Suntory fourni à recadrer, Marvesting en pied de page) | Validée par T. SOEFOU le 23/10/2026 (déclaratif) | Trace de l'accord ; origine et licence des contours V4 |
| D153 | Chaîne budgétaire | Le budget est une donnée unique lue sur trois axes combinables (territoire, dispositif, campagne). Chaîne : (1) la cliente saisit dans son espace l'enveloppe qu'elle alloue, datée et versionnée ; (2) elle descend à l'agence, qui la voit sans pouvoir la modifier ; (3) l'agence l'alloue par dispositif, campagne, DR et CVR en mode administration, sans dépasser l'enveloppe ; (4) chaque besoin porte un coût estimé qui compte en prévisionnel sur la maille ; (5) les changements de périmètre déplacent le budget ; (6) un poste pourvu transforme du prévisionnel en consommé ; (7) atterrissage, disponible et alertes ; (8) réallocation et rallonges à double validation. Quatre mesures, un calcul unique en domaine (budget affecté, consommé, prévisionnel, atterrissage, disponible). « Budget non renseigné » jamais à 0. Toute modification passe par le Repository et laisse un événement avec motif | Validée par T. SOEFOU le 23/10/2026 | D07 (montants réels) |
| D154 | Cockpit budget et mode présentation | Cockpit cliente : lecture seule, épurée (jauge, répartition par dispositif et campagne, alerte), sans coûts internes. Espace agence : mode administration (budget retenu avec retour à la référence, détail de calcul) et **mode présentation** qui masque les contrôles et éléments internes, agrandit les chiffres, fige le périmètre et ne change aucune donnée. Mode présentation réservé à l'agence ; ouverture au DR et au CVR non décidée. Écran sur une page, trois blocs au plus (situation, répartition, alertes) | Validée par T. SOEFOU le 23/10/2026 (accès DR et CVR au mode présentation : non décidé) | |
| D155 | Données budgétaires | Les budgets des classeurs Excel du dossier alimentent le modèle par les profils d'import (D134 à D139) et seulement en local sur le poste du prestataire, avec bandeau « DONNÉES RÉELLES LOCALES » ; la démonstration publique reste en montants fictifs étiquetés. Configuration et allocation se font dans l'application | Validée par T. SOEFOU le 23/10/2026 | |
| D156 | Besoin au-delà du budget | Autorisé avec alerte à la cliente et à l'agence, puis arbitrage ; aucun blocage. Le dépassement est tracé au journal | Validée par T. SOEFOU le 23/10/2026 (hypothèse retenue) | |
| D157 | Lots budget | A4b scindé : **A4b1** (enveloppe cliente, allocation agence, versions, journal, prévisionnel par besoin) placé dans le noyau avant A4a ; **A4b2** (réallocation à double validation, rallonges) en seconde démonstration. A4a ajoute l'écran Budget (cockpit cliente, mode administration, mode présentation). Vue Explorateur de M1 fondue dans les filtres et exports de A4a | Validée par T. SOEFOU le 23/10/2026 | |
| D158 | Rallonges budgétaires | **La cliente peut ajouter une rallonge** à son enveloppe (nouvelle version datée, motif, descend à l'agence pour allocation). **L'agence peut demander une rallonge** (montant, périmètre, motif, pièces) ; **la décision revient à la cliente** (acceptée, refusée ou modifiée), l'agence ne crée jamais de budget seule. Historique, journal avec audience, alerte de dépassement liée (D156). Livré en A4b2 | Validée par T. SOEFOU le 23/10/2026 (principe) ; **la cliente décide et valide** (confirmé le 23/10/2026), l'agence ne décide seule dans aucun cas, y compris sous un seuil | |
| D159 | Directives UX et UI | Les 10 directives de `docs/COMPLEMENTS_CADRAGE/30_DIRECTIVES_UX_UI_V0.1.md` et la **règle commune 16** (design et micro-interactions) : aucun style en dur (couleur, espacement, taille, durée) hors jetons ; échelles d'espacement, de typographie et de mouvement ; transitions de 150 à 250 ms désactivées en mouvement réduit ; trois états par route (squelette, vide, erreur) ; confirmation visible et annulable après toute écriture ; tableaux en cartes sous 640 px ; cibles de 44 px ; police Inter chargée en local ; appliquées dès A2b | Validée par T. SOEFOU le 23/10/2026 | |
| D160 | Identité visuelle et titres | Titre de l'application « Pilotage merchandising » ; menus : Mon cockpit, Pilotage, Besoins merch, Réponses de l'agence, Équipes terrain, Budget, À traiter, Réglages, Gestion de la mission (EN dans le glossaire) ; titres d'écran reformulés en termes d'action. Visuel **C** (nature, lac et chais) en accueil, visuel **A** (produits, fondu dans la page) sur les écrans de pilotage, visuel **B** (forêt) à la connexion, sans zoom excessif ; versions **mobile** recadrées et allégées (WebP 640, 1280, 1920 px, chargement prioritaire, aucune requête externe, contraste contrôlé, voile renforcé en mode sombre) ; logo Suntory en en-tête, Marvesting discret en pied | Validée par T. SOEFOU le 23/10/2026 | |
| D161 | Skin d'accueil réglable | Fonction de réglage du « skin » de l'écran d'accueil (Produits, Nature, Sobre sans visuel). **L'agence fixe le défaut dans Paramètres** ; l'utilisateur choisit le sien par le sélecteur d'affichage (près du thème), car D118 retire Paramètres côté cliente. Lecture déduite par le prestataire, à confirmer | Validée par T. SOEFOU le 23/10/2026 ; emplacement confirmé le 23/10/2026 (défaut agence dans Paramètres, choix utilisateur par le sélecteur d'affichage) | |
| D162 | Notes et commentaires | Fil de notes sur les objets clés (besoin, zone, campagne, budget et rallonge, plan d'action, rapport, recrutement). Visibilité choisie à chaque note : **Interne agence**, **Partagée avec la cliente**, **Partagée avec un destinataire** (DR, CVR, RS) ; **interne par défaut** ; badge de visibilité toujours affiché ; confirmation avant partage ; une note partagée se retire avec trace, ne redevient pas interne ; audience par défaut refusée ; événement au journal ; jamais dans un export cliente ; pose du fil et des règles en A3, extension ensuite | Validée par T. SOEFOU le 23/10/2026 | |
| D163 | Origine des visuels | Visuels de nature, produits et logos : origine **déclarée** « recherche Google, mot-clé Suntory » (23/10/2026) ; droits non établis ; risque porté par le prestataire (D113, D152). Usage limité à la démonstration ; dépôt privé requis ; remplacement ou autorisation écrite avant toute diffusion ou mise en production (D115) ; origine consignée dans `docs/CREDITS_VISUELS.md` | Constat consigné ; validée par T. SOEFOU le 23/10/2026 | Autorisation écrite d'Impact ou de la cliente |
| D164 | Signalement et notifications | Bouton « Signaler un problème » dans chaque espace (agence et cliente) : type (bug, plantage, fonctionnalité demandée, parcours à refaire, texte ou traduction), gravité (bloquant, gênant, mineur), **description détaillée obligatoire** (ce qui s'est passé, étapes pour reproduire, résultat attendu), capture facultative ; contexte capturé automatiquement (page, profil, langue, thème, appareil, version, heure), aucune donnée métier. Écran « Demandes » : chaque auteur suit les siennes, le prestataire trie. Notification par e-mail à une adresse dédiée, **adresse fournie par T. SOEFOU, valeur en variable d'environnement, jamais dans le dépôt** ; l'e-mail porte type, gravité, titre, extrait du détail et lien ; en démonstration l'envoi reste en file de validation | Validée par T. SOEFOU le 23/10/2026 ; contenu de l'e-mail (extrait du détail) : lecture du prestataire de « il faut le détail du problème », à confirmer | Contenu de l'e-mail |
| D165 | Hébergement | **OVHcloud retenu** (précise D115) ; abonnement non pris, **à prendre après validation de la démonstration** ; deux espaces identiques (préproduction, production) ; aucun travail d'hébergement avant la validation, sauf préparatifs sans compte (conteneur, scripts, procédure) | Validée par T. SOEFOU le 23/10/2026 | Abonnement, DPO (D115) |
| D166 | Parcours de correction et de mise à jour | Neuf étapes : réception, décision (évolution) ou fiche de bug, correction par Claude Code sur branche `fix/<n>` ou `evol/<n>` (test qui échoue d'abord), revue, fusion et étiquette de version, déploiement automatique en préproduction, recette, mise en production validée, clôture et note de version FR/EN ; retour arrière documenté ; hotfix le jour même pour un bug bloquant. Détail dans `docs/WORKFLOW_MAINTENANCE.md` | Validée par T. SOEFOU le 23/10/2026 | |
| D167 | Jours ouvrés des échéances | Lundi à vendredi hors jours fériés, distincts des jours non ouvrés de mission (D145) | Validée par T. SOEFOU le 23/10/2026 | Précise D145 |
| D168 | Mois cible et blocage | Mois du premier jour de la première période ; blocage applicable à **tout mois dont l'échéance est passée, y compris le mois en cours et les mois passés** ; la réouverture est la seule issue | Validée par T. SOEFOU le 23/10/2026 | Précise D78, D79. Novembre 2026 : dates fictives étiquetées (date fixe 30/10, preset Standard 19/10), à confirmer par la cliente (D80) |
| D169 | Fenêtre de saisie du dispositif | Borne la clôture, saisie anticipée permise ; **lecture A** de « avant-dernière semaine de novembre » (S47) et **10 jours calendaires** ; modifiable ensuite dans les paramètres | Validée par T. SOEFOU le 23/10/2026 | Q-N9-1 |
| D170 | Priorité des échéances | Paramètre du dispositif, puis date fixe, puis preset par défaut | Validée par T. SOEFOU le 23/10/2026 | Précise D82, D128 |
| D171 | Report sur M+1 | Dates conservées, marque « reportée », jugé sur M+1, sans chaîne de reports ; refusé si M+1 est clos | Validée par T. SOEFOU le 23/10/2026 |  |
| D172 | Réouverture | Zone obligatoire (et ses descendants), durée par date de fin (90 jours au plus), **décision réservée à l'agence administration** ; l'opérateur et le prestataire ne décident pas | Validée par T. SOEFOU le 23/10/2026 | Précise D147 |
| D173 | Alertes d'échéance dérivées | Cascade 5, 2, 0 jours ouvrés ; J-2 et jour J réservés aux périmètres en retard ; bilan chiffré d'audience agence ; alertes d'exemple deadline_d5 et deadline_d2 retirées ; envois automatiques EV-30 et EV-31 reportés aux automatisations (A4a) | Validée par T. SOEFOU le 23/10/2026 |  |
| D174 | Saisie en lot | Ligne incomplète rejetée, alerte confirmée par ligne, brouillon automatique côté données, collage avec explications ; lignes en cartes (règle 16), tableau possible au bureau | Validée par T. SOEFOU le 23/10/2026 |  |
| D175 | Courriels préparés | File à valider **sans envoi réel** (règle 10), un message par responsable concerné, résumé du lundi sans chiffre ; envoi réel avec A4a | Validée par T. SOEFOU le 23/10/2026 | Précise D86, D94 |
| D176 | Journal | EV-04 (agence), EV-32 et EV-33 (les deux), EV-38 (paramètre ou échéance modifié, agence) ajouté au catalogue du doc 26 | Validée par T. SOEFOU le 23/10/2026 |  |
| D177 | Navigation web | Règle 14 appliquée en A2b ; contrôles d'accès dans des `layout.tsx` au-dessus des états de chargement pour garder le 404 | Validée par T. SOEFOU le 23/10/2026 | Précise D151 |
| D178 | Annulation après écriture | Jeton opaque par écriture, une seule annulation à la fois tant qu'aucune autre écriture n'a eu lieu, même profil ; le journal n'est jamais réécrit ; EV-39 (annulation) ajouté au catalogue du doc 26 | Validée par T. SOEFOU le 23/10/2026 | Règle 16 ; voir D181 |
| D179 | Raccourcis clavier | `?` liste, `g` puis `h d n a s` pour naviguer, `c` nouveau besoin ; inactifs dans les champs, aucun n'écrit | Validée par T. SOEFOU le 23/10/2026 | Directive 9 |
| D180 | Libellés hors glossaire | Annuler / Undo, Enregistré / Saved, Fermer / Close, Modification annulée / Change undone, Trier le tableau / Sort table, Raccourcis clavier / Keyboard shortcuts | Validée par T. SOEFOU le 23/10/2026 | Glossaire 4 quater |
| D181 | Annulation après écriture | L'annulation de A2b (restauration d'un instantané en mémoire) est de niveau démonstrateur ; **à l'étape B elle est refaite par compensation en base** (écriture inverse tracée au journal), jamais par restauration | Validée par T. SOEFOU le 23/10/2026 | |
| D182 | Textes affichés sans références internes | Aucune référence interne (numéros de décision D…, « Lecture A » ou « B », nom du prestataire, « Hypothèse Hn ») dans les textes affichés aux profils ; ces mentions restent dans la documentation et les comptes rendus ; carte « Rouvrir sans demande » alignée sur la largeur de sa voisine ; corrigés en A1e | Validée par T. SOEFOU le 23/10/2026 | |
| D183 | Écran d'entrée | Route `/start` sans menu, visuel forêt ; **devient l'écran de connexion** (D188). Toute page demandée sans session renvoie à la connexion, puis **retour à la page demandée** après connexion. Mention « pas une connexion » retirée avec le choix de profil simulé | Validée par T. SOEFOU le 23/10/2026 | Précise D188 |
| D184 | Skins et visuels | Nature (lac, visuel C) par défaut, Produits (visuel A), Sobre (aucun visuel) sur l'accueil ; l'écran de pilotage garde le visuel produits ; défaut agence dans Réglages (agence administration), choix utilisateur par le sélecteur d'affichage, jamais écrasé par un nouveau défaut ; EV-38 au changement du défaut | Validée par T. SOEFOU le 23/10/2026 | Précise D161 |
| D185 | Gabarit des visuels | WebP 640, 1280, 1920 px sans agrandissement, recadrage mobile 4:3, image d'accueil mobile sous 250 Ko, chargement prioritaire, voile `--veil-alpha` (0,90 clair, 0,94 sombre), contraste 4,5 testé sur les images réelles | Validée par T. SOEFOU le 23/10/2026 | |
| D186 | Titres d'écran | Titres reformulés en termes d'action selon le glossaire étendu (section 4 quinquies, liste proposée par le prestataire et **validée d'avance** par T. SOEFOU le 23/10/2026) ; appliqués en un seul passage dans le lot A1f ; tout nouveau titre passe d'abord par le glossaire | Validée par T. SOEFOU le 23/10/2026 | Précise D160 |
| D187 | Organisation des routes | Groupes `(app)` (gabarit avec menu) et `(entry)` (pages sans menu) sous `[locale]` | Validée par T. SOEFOU le 23/10/2026 | |
| D188 | Connexion par identifiant et mot de passe | Écran de connexion avec **identifiant unique par personne** (exemple de forme : Suntory32) et mot de passe, version web sur ordinateur et sur mobile (pas d'application installée). Le navigateur peut proposer l'enregistrement et le remplissage du mot de passe (attributs `autocomplete` standard). **Le remplissage automatique ne connecte jamais seul** : la connexion n'est envoyée qu'au clic sur le bouton « Connexion » (ou Entrée donnée par l'utilisateur après remplissage), testé sur le web et à 390 px. Démonstrateur : comptes et mots de passe fictifs, mention « démonstration » ; le choix de profil simulé disparaît de l'écran d'entrée ou reste réservé au prestataire | Validée par T. SOEFOU le 23/10/2026 | |
| D189 | Comptes et attribution | Six identifiants pour l'agence ; un identifiant pour la direction cliente, puis un identifiant par DR et par CVR. **L'agence peut créer de nouveaux identifiants et les attribuer** (profil, périmètre de zones). Confirmé le 23/10/2026 : création, attribution, désactivation et réinitialisation réservées à l'agence (administration) ; mot de passe initial temporaire à changer à la première connexion ; aucun mot de passe affiché ni journalisé ; **les comptes RS ne sont pas préconfigurés : l'agence les crée et les attribue dans l'interface d'administration** ; création, attribution et désactivation tracées au journal (audience agence) ; l'agence ne crée pas de compte du prestataire | Validée par T. SOEFOU le 23/10/2026 | Précise D118 |
| D190 | Vue Planning | Écran **Planning** (menu, tous profils selon leur périmètre) : indicateurs (besoins par statut, heures planifiées, couverture avec numérateur et dénominateur, non couverts), **quatre modes** : Frise par semaine (une ligne par besoin, barres par période saisie, statut écrit dans la barre), Calendrier par dates (grille de semaines, besoins sur leurs jours de présence, trois au plus par jour puis « +n »), Jour (besoins et magasins d'une date, bande de semaine), Mois (heures par mois, F-10.11). Magasins liés à chaque besoin (enseigne, département, dates) ; recrutements par secteur et par département (pourvus, en cours, non couverts) avec renvoi à l'entonnoir (A3) et à la carte (A4e). Filtres DR, CVR, secteur, département, campagne, période, vues enregistrées. Audience : périmètre de chacun, RS limité à son secteur, montants masqués là où D118 les retire, catégories génériques pour les absences. Mobile : bande de semaine avec pastilles de comptage, six semaines sur demande, liste du jour en cartes (confirmé sur maquette). Maquette validée ; lot **A4f**, après A5 dans le noyau | Validée par T. SOEFOU le 23/10/2026, y compris le mobile et les quatre modes (Jour compris) | Précise F-10.11, F-10.12, F-10.13 |
| D191 | Revue et fusion par une session de revue | Après chaque lot, une **session Claude Code distincte** de celle qui a écrit le lot, lancée avec `docs/PROMPTS/31_PROMPT_REVUE_ET_FUSION.md`, relit la branche (audit avec les agents de `agents-projet`), exécute les contrôles (typecheck, lint, tests, build, e2e, règles communes), relit **toutes** les captures, corrige les défauts mineurs sur une branche `revue/<lot>`, produit `docs/REVUE_<LOT>.md`, soumet à T. SOEFOU en questionnaire les propositions de registre, puis, **seulement si** tous les contrôles sont verts, aucun défaut bloquant ne reste et T. SOEFOU a validé, fusionne dans `main` (`--no-ff`) et pousse `main`. Garde-fous : jamais de poussée forcée, jamais de pull request sans demande, jamais de décision inscrite sans validation, jamais de donnée réelle, contrôle C3 hors session (il exige `.denylist.local`, fichier local) ; en cas d'échec ou de doute, arrêt et rapport. Les sessions de lot restent soumises à D148 (branche de session seulement). Précise D148 | Validée par T. SOEFOU le 23/10/2026 | Précise D148 |
| D192 | Économie de modèles et de sous-agents | Claude Code délègue aux sous-agents les seules tâches volumineuses ou mécaniques, avec le **modèle le plus économique suffisant** (léger pour chercher, lister, extraire, lancer et résumer ; intermédiaire pour relecture ordinaire et tests ; principal pour architecture, sécurité, droits, vie privée, arbitrages, verdict). Un résultat douteux est refait avec un modèle supérieur ; décision, verdict, registre et fusion jamais délégués. Règle commune 17, rappelée dans le prompt de revue | Validée par T. SOEFOU le 23/10/2026 | Règle 17 |
| D193 | Comptes agence de démonstration | **6 comptes agence de démonstration : 1 administration, 5 opérateurs.** Répartition retenue pour le lot A1f et valable pour toute la phase démonstrateur. | Validée par T. SOEFOU le 23/10/2026 (revue A1f) | Précise D189 |
| D194 | Profils créables par l'agence administration | **L'agence administration peut créer des comptes de tous les profils sauf prestataire, administration comprise.** Confirmé oralement en session d'écriture A1f, formalisé lors de la revue. | Validée par T. SOEFOU le 23/10/2026 (revue A1f) | Précise D189 |
| D195 | Visualisation « comme » au démonstrateur | **En démonstrateur (étape A) : la visualisation « comme » (impersonation) donne les droits d'écriture du profil consulté.** Voulu pour les tests de parcours (aucun compte RS préconfiguré). En B : le journal devra distinguer le compte réel et le profil consulté. Un compte RS de démonstration sera créé avant l'étape B. | Validée par T. SOEFOU le 23/10/2026 (revue A1f) | Précise D189, D191 |
| D196 | Politique de mot de passe au démonstrateur | **Mot de passe de démonstration : 12 caractères minimum, au moins 1 lettre et 1 chiffre, différent du mot de passe temporaire.** Politique appliquée dès le lot A1f. À revoir avant l'étape B selon la politique réelle d'Impact ou de Suntory. | Validée par T. SOEFOU le 23/10/2026 (revue A1f) | Précise D189 |
| D197 | Dimensions du circuit | Quatre dimensions stockées à part : **besoin** (brouillon, soumis, qualification agence : à qualifier, pris en charge, précision demandée, rejeté), **proposition** (en préparation, envoyée, retirée, remplacée), **recrutement** (jalons datés) et **exécution** (prise de poste, remise du véhicule). L'entonnoir D92 et le statut de poste à 9 valeurs sont calculés, jamais saisis en un champ unique. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Précise D11, D54, D92 |
| D198 | Versions et accords | Une version de proposition change au moins un élément déterminant (intervenant, heures, jours, créneau, période, magasins), sauf si le besoin a changé depuis ; un écart au besoin est expliqué à l'envoi. L'envoi d'une nouvelle version, le retrait de la proposition ou la modification du besoin invalide l'accord en vigueur (EV-12) ; la décision reste au dossier, jamais effacée ni conservée en silence. Une seule décision en vigueur par version. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Réserve : l'état « Recrutement finalisé » après invalidation est à traiter en A3c |
| D199 | Délais cibles de départ | Valeurs de départ, en jours ouvrés, paramétrables et non figées : qualification 2, proposition 5 depuis la soumission, décision 5 depuis l'envoi, « urgent » à 2 jours, « bientôt » à 5, effectif minimal 5. | Validée par T. SOEFOU le 23/10/2026 (revue A3) comme valeurs de départ | À valider avec la cliente ; précise D93 |
| D200 | Délais par situation | Jalons J1 (soumission à proposition), J2 (proposition à décision), J3 (décision à recrutement finalisé), J4 (décision à prise de poste), en jours calendaires, par situation (recrutement nouveau, réattribué, zone blanche sans délai, âge de vacance), médiane, étendue et effectif ; « effectif trop faible pour conclure » sous le minimum. Jamais une moyenne unique. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Précise D87 et D93 ; complétée par D210 |
| D201 | Audience du circuit | EV-09 à EV-21 et EV-45 d'audience « les deux ». Le chiffrage d'une proposition et les échéances internes de l'agence ne sont pas communiqués à la cliente ; les alertes de retard de proposition, de qualification et de chiffrage incomplet sont d'audience agence ; EV-10 n'embarque pas le coût. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Précise D108 |
| D202 | Notes D162 | Écriture par l'agence ; lecture par la cliente selon la visibilité : interne agence (défaut), partagée avec la cliente, partagée avec un destinataire exact (même niveau, même zone). Confirmation avant partage, retrait avec trace sans retour à l'interne, notes d'un brouillon de proposition invisibles de la cliente, EV-44 d'audience agence pour l'interne et le destinataire. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Précise D162 |
| D203 | Désistement et rupture | EV-21 : désistement avant la prise de poste, rupture après. Les deux ramènent à « En recrutement » avec compteur (D97), retirent la proposition envoyée et invalident son accord ; le cycle terminé reste au dossier. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Précise D97 |
| D204 | Codes d'événements hors catalogue | EV-44 (note ajoutée ou retirée) et EV-45 (proposition retirée), à inscrire au doc 26. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | Mise à jour du doc 26 à faire |
| D209 | Validation CVR, escalade DR, délégations | F-30.1 (validation CVR), F-30.2 (escalade DR) et F-30.3 (délégations et suppléants) hors du lot A3, livrées par le lot correctif A3c (prompt 33). Le déclencheur « hors enveloppe » est branché en A4b1 ; d'ici là, déclenchement manuel par le CVR avec motif. En A3, un besoin soumis est réputé validé par la chaîne cliente. F-30.4 (qualification agence) est livrée en A3. | Validée par T. SOEFOU le 23/10/2026 (revue A3) | D09 reste ouverte |
| D210 | Mesure des délais « même jour » | Aucun seuil figé (D93 à D97). Mesurer l'écart entre l'acceptation de la proposition et le poste démarré (« Pourvu » = En poste, D92). Situations : « même jour » (même jour calendaire, fuseau Paris), « plus tard dans la journée », « jour ouvré suivant ou plus ». « Une heure plus tard » est remplacé ; son sens précis est à confirmer avec la cliente. À coder avec A4a ou A4c2 (non codé en A3). | Validée par T. SOEFOU le 23/10/2026 (revue A3) (hypothèse à confirmer) | Cliente |
| D211 | Besoin stoppé et taux d'heures | Un besoin stoppé sort du dénominateur du taux d'heures, comme la zone blanche, et s'affiche sur sa propre ligne avec son motif ; les heures déjà effectuées avant l'arrêt restent comptées. Le code A3 exclut aujourd'hui tout le besoin, heures effectuées comprises : à coder avec A4a. | Validée par T. SOEFOU le 23/10/2026 (revue A3) (hypothèse à valider) | Précise D85 ; doc 26 §11 point 5 |
| D230 | État finalisé, accord invalidé et « En poste » | « Recrutement finalisé » exige l'accord en vigueur : un accord invalidé (EV-12) ramène à « Proposé » sans rien effacer. **« En poste » est maintenu** quand l'accord est invalidé après la prise de poste (le poste est occupé), signalé par l'étiquette « le besoin a changé depuis la proposition ». **À coder** : une action « à traiter » côté agence (renvoyer la proposition pour confirmation) et une alerte d'audience agence tant que l'accord n'est pas rétabli. Réserve : à confirmer avec la cliente si le changement est substantiel (période, heures), pour la facturation. | Validée par T. SOEFOU le 23/10/2026 (reprises de revue A3) | Précise D198 ; mise en œuvre partielle en A3 (état), alerte et action à coder |
| D231 | Heure d'acceptation et de prise de poste | **Acceptation : horodatage automatique** de la décision (fuseau de Paris). **Prise de poste : heure effective saisie en option**, par sélecteur d'heure, jamais en texte libre. Aucun seuil figé : le sens de « plus tard dans la journée » (ex. « une heure plus tard ») est **à confirmer avec la cliente avant de coder**. Sans heure enregistrée, la catégorie reste vide (« Donnée indisponible »). | Validée par T. SOEFOU le 23/10/2026 (reprises de revue A3) | Précise D210 ; à coder après la réponse de la cliente |
| D232 | Libellés du statut d'exécution | Quatre valeurs, distinctes du statut de poste calculé : **Non démarrée / Not started**, **Prise de poste planifiée / Start planned**, **En poste / In post**, **Poste terminé / Post ended** (« Terminée » abandonné : il prêtait à confusion avec une mission menée à son terme ; il s'agit d'un arrêt, besoin stoppé ou rupture). À ajouter au glossaire. | Validée par T. SOEFOU le 23/10/2026 (reprises de revue A3) | Hors glossaire jusqu'à cette décision |
| D234 | Validation managériale | Dimension à part (à valider, validé, refusé, escaladé), dossier non réécrit ; **avis facultatif, jamais bloquant pour l'agence** ; antérieurs réputés validés. Un avis refusé reste une information visible et ne ferme pas le besoin : l'agence **confirme** sa prise en charge (case à cocher, refus `confirm_required` sinon, trace `over_refused_avis` dans EV-09) ; précision et rejet n'exigent aucune confirmation | Validée par T. SOEFOU le 27/10/2026 (compte rendu A3c) | Précise D209. Reste ouverte avec la cliente : l'agence peut-elle recruter sur un besoin refusé par le CVR ? |
| D235 | Escalade DR | Arbitrage entre CVR du même DR, hors périmètre, hors enveloppe (manuel avec motif, point d'entrée pour A4b1) ; motif obligatoire | Validée par T. SOEFOU le 27/10/2026 (compte rendu A3c) | Le DR ne valide pas directement : il agit sur un besoin escaladé ; la direction cliente arbitre au niveau DR. Arbitrage entre CVR de DR différents : à la direction (à confirmer avec la cliente) |
| D236 | Délégations | Suppléant du même niveau, un seul à la fois, sans chaîne ni rétroactivité, fin incluse, périmètre effectif plafonné à celui du délégant ; le délégant garde ses droits (première décision gagne) ; révocation tracée ; agence administration seule | Validée par T. SOEFOU le 27/10/2026 (compte rendu A3c) | Précise D209 ; D09 reste ouverte |
| D237 | Événements et alertes du lot | EV-06 à EV-08 et EV-47 « les deux » ; EV-46 « agence » ; cinq alertes dont une réservée à l'agence | Validée par T. SOEFOU le 27/10/2026 (compte rendu A3c) | Audience par D108 |
| D238 | Délais de départ | Validation 2 jours ouvrés, arbitrage 3, alerte de fin de délégation 2 | Validée par T. SOEFOU le 27/10/2026 (compte rendu A3c) | Précise D199 et D09 ; valeurs de départ à confirmer sur données réelles avant l'étape B |
| D239 | Codes hors catalogue | EV-46 et EV-47 à inscrire au doc 26 | Validée par T. SOEFOU le 27/10/2026 (compte rendu A3c) | Inscription au doc 26 à faire |
