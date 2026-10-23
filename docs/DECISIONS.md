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
| D107 | Personnalisation uniforme | Un contexte d'accès unique (profil, périmètre, vocabulaire, langue) pour tous les écrans, e-mails et exports | Proposée (aucune préférence exprimée, recommandation appliquée) | T. SOEFOU |
| D108 | Audience des alertes | Champ `audience` obligatoire (agence, cliente, les deux), défaut refus ; filtrage dans la couche de données. Réservées à l'agence (proposition par défaut) : retards de proposition internes, coûts et chiffrage incomplet, qualité des données et imports, alertes techniques | Proposée (aucune préférence exprimée, recommandation appliquée) | T. SOEFOU, Impact |
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
D107 et D108 restent **proposées**.
