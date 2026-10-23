# SUNTORY REFONTE V3 · Décisions du 22/10/2026 et conséquences (charte, utilisateurs, identité, agents)

Client : Suntory uniquement. Ce document **complète et corrige** les compléments 10 à 13 : en cas de contradiction, il prévaut.

> **Complément du 22/10/2026 (suite)** : voir aussi `15_DECISIONS_22-10_LOGOS_RS_BUDGETS_AGENTS.md` (logos, RS utilisateurs, chaîne managériale, budgets, agents adoptés).
Trace : décisions exprimées par T. SOEFOU dans la conversation du 22/10/2026. Statut général : **décision du prestataire (T. SOEFOU)** ; tout ce qui engage Impact, la cliente, leur IT ou leurs DPO reste « à confirmer » et n'est pas présenté comme validé par eux.

## 1. Décisions enregistrées

| N° | Décision exprimée | Effet sur les propositions précédentes | Statut |
|---|---|---|---|
| D30 | Écarter le design Norton ; charte **mixte Marvesting × Suntory**, dominante Suntory Beverage ; codes couleur Marvesting **visibles sur les éléments importants** | Remplace « pas de rose » (complément 10). Source Suntory = `suntorybeverageandfood-europe.com-DESIGN.md` | Décidée par T. SOEFOU ; cliente à confirmer |
| D38 | Règles karpathy **adaptées au projet** validées | Intégrées dans `CLAUDE.md` (section « Principes de conduite ») | **Validée** par T. SOEFOU |
| D39 | Trier les agents utiles au développement et à l'audit final des fonctionnalités | Tri au §5 ; aucune installation | Tri fait ; adoption à valider après relecture intégrale |
| D42 (nouvelle) | Les intervenants n'utilisent pas l'outil seuls | Retire le compte intervenant et les parcours mobiles M-1 à M-4 « par l'intervenant » (§3) | Décidée par T. SOEFOU ; Impact à confirmer |
| D43 (nouvelle) | CVR et DR utilisent l'outil selon leurs périmètres budgétaires alloués, **managés par la cliente et l'agence** | Définit le périmètre d'action CVR / DR (§3) | Décidée ; règle d'allocation à préciser |
| D33 / D37 (révisées) | Point 4 des arbitrages : **le fournisseur d'identité sera l'agence** | Remplace « composant d'authentification à choisir » par une fédération avec l'IdP de l'agence (§4) | Décidée par T. SOEFOU ; Impact, cliente, DPO à confirmer |

## 2. Charte mixte Suntory dominant + Marvesting visible

### Constats vérifiés
- Le fichier Suntory Beverage est **mesuré sur le site** (6 pages, extrait le 22/10/2026) : primaire `#3398B1`, accent `#038FB1`, lien `#5BC2DC`, surface `#F7FCFD`, texte `#000000` / `#212529`, **Roboto**, boutons en pilule et en majuscules, cartes à angles droits, profondeur par aplats, grille 8 colonnes (≥ 1024 px) / 3 colonnes, focus bleu clair. Il **diffère** de `design_system_suntory.md` (Inter, `#5BC2DC` primaire, cartes arrondies 16 px). Le fichier mesuré fait désormais foi pour Suntory ; l'autre sert de repli.
- Lacunes que le fichier reconnaît : pas de couleurs d'état (succès / erreur / alerte), pas d'icônes, pas d'animation, pas de mode sombre, **aucune surface après connexion**. Elles seront comblées par nous (jetons V4 : vert `#1B7B45`, ambre `#8A5A00`, rouge `#B3202A`).
- Marvesting (`design_system_marvesting.md`, charte Impact) : rose `#E52365`, rose pâle `#FFC2D5`, marine `#08071E` et `#1A1950`, bleu électrique `#1B1C88`, vert vif `#4BFE61`, beige `#F1EFEA`. La **trame Marvesting × Norton** reste écartée (rouge `#D71921`, document Norton).

### Contrastes calculés aujourd'hui (WCAG 2.x, AA texte = 4,5 ; grand texte et éléments graphiques = 3)
| Paire | Ratio | Usage permis |
|---|---|---|
| `#3398B1` / blanc | 3,35 | Aplat, bordure, icône, grand texte gras. **Pas** de texte courant ni de bouton à texte blanc standard |
| `#038FB1` / blanc | 3,77 | Idem |
| `#00829B` / blanc | 4,50 | Texte et boutons (limite) |
| `#3398B1` / marine `#08071E` | 5,92 | Texte marine sur aplat Suntory : valide |
| `#E52365` / blanc | 4,41 | Éléments graphiques, grands chiffres, indicateur de sélection ; **pas** de texte courant |
| `#E52365` / marine | 4,49 | Texte marine sur rose : à 0,01 du seuil, réserver aux grands textes |
| marine / rose pâle `#FFC2D5` | 13,15 | Étiquette lisible : texte marine sur rose pâle |
| `#E52365` / `#F7FCFD` | 4,26 | Éléments graphiques seulement |
| `#1A1950` / blanc | 16,17 | Texte et titres forts |

### Règles de la charte mixte (proposition de mise en œuvre de D30)
| Domaine | Suntory (dominant) | Marvesting (visible, ciblé) |
|---|---|---|
| Fond, structure, cartes, navigation | `#FFFFFF`, `#F7FCFD`, texte `#212529`, titres `#000` ; Roboto auto-hébergée ; boutons en pilule ; cartes à angles droits | — |
| Action principale | Bouton `#00829B` (texte blanc), jamais `#3398B1` avec texte blanc | — |
| Éléments importants | — | **Rose `#E52365`** : sélection active (carte, onglet, ligne), pastille « à traiter », chiffre clé de la synthèse (grande taille, gras), indicateur de progression, soulignement du titre de section ; **marine `#1A1950` / `#08071E`** : bandeau d'en-tête, titres de section, fond des modules sombres |
| Étiquettes d'attention | — | Fond rose pâle `#FFC2D5` + texte marine |
| Validation | Vert sémantique `#1B7B45` (texte) | Le vert vif `#4BFE61` n'est pas utilisé pour du texte |
| Alerte et erreur | Ambre `#8A5A00`, rouge `#B3202A` + **icône + texte** | **Le rose ne signifie jamais « erreur »** : il signifie « important / à traiter » |
| Graphiques | Séries en teals Suntory | Une série mise en avant en rose ; palette validée pour daltoniens avant livraison |
| Logos et noms | Aucun logo, aucun nom d'agence ou de prestataire dans les écrans (D25 / D28 inchangés) | Les **codes couleur** Marvesting sont utilisés ; le logo ne l'est pas |
| Mode vue cliente / vue agence | Même charte, un libellé de rôle | — |

Points à valider (cliente, via Impact) : l'usage du rose Marvesting dans une plateforme destinée à la cliente (identité agence visible par les couleurs) ; l'autorisation d'embarquer Roboto auto-hébergée (licence **non vérifiée dans cette session**). Les boutons en majuscules de Suntory peuvent gêner FR / EN et l'accessibilité : à tester.

## 3. Utilisateurs : intervenants non-utilisateurs, CVR et DR par périmètre budgétaire

Lecture retenue de votre consigne (à corriger si elle est inexacte) : les intervenants de terrain **n'ont pas d'accès propre** ; les CVR et DR cliente utilisent l'outil dans les **périmètres budgétaires qui leur sont alloués**, ces périmètres étant **gérés conjointement par la cliente et l'agence**.

### Conséquences
| Élément | Avant | Après (proposition) |
|---|---|---|
| Comptes | Intervenants avec identifiant | **Aucun compte intervenant** ; l'intervenant reste une donnée de référence (`INT-001`) |
| Parcours mobiles M-1 à M-4 | Saisie par l'intervenant | Saisie et consultation par **le RS, le CVR ou l'agence** pour le compte de l'intervenant ; l'auteur de la saisie et l'intervenant concerné sont deux champs distincts, tracés |
| D14 / Q18 « saisie par l'intervenant » | Position prestataire arrêtée | **Révisée** : saisie par mission / site et par jour conservée, **mais par un utilisateur habilité** |
| Question « e-mail pro des intervenants » (D33) | Bloquante | **Levée** |
| Profil de démo « Intervenant terrain » | Présent | Remplacé par un profil « RS terrain » (hypothèse) ; **statut du RS non précisé par vous** : à confirmer |
| RGPD | Intervenants utilisateurs | Intervenants **personnes concernées seulement** : information, minimisation, conservation (D18) restent à traiter |

### Rôles budgétaires (D43)
| Acteur | Action dans son périmètre |
|---|---|
| Cliente | Alloue ou valide les périmètres budgétaires des CVR / DR avec l'agence |
| Agence | Co-gère l'allocation, opère les propositions et affectations |
| DR | Voit et agit sur les CVR et secteurs de son DR, dans l'enveloppe allouée |
| CVR | Agit sur son périmètre, dans l'enveloppe allouée |
Questions ouvertes : qui fixe et qui modifie une enveloppe (double validation cliente + agence proposée) ; que se passe-t-il à dépassement (blocage, alerte, validation supérieure) ; visibilité des coûts (D08) ; maille de l'enveloppe (campagne, période, CVR).
Les budgets restent « Budget non renseigné » au démonstrateur (D07).

## 4. Fournisseur d'identité : l'agence (révision de D33 / D37)

### Ce que cela change
| Sujet | Effet |
|---|---|
| Rôle de la plateforme | Elle devient un **service relié à l'IdP de l'agence** (fédération OIDC proposée). Les rôles, périmètres et enveloppes restent **dans la plateforme** |
| Mot de passe, second facteur, oubli, verrouillage | Gérés par **l'IdP de l'agence**. Le parcours « oubli » du complément 11 ne s'applique plus qu'aux **comptes de secours locaux** |
| Cycle de vie | Création et départ au niveau de l'IdP (informatique de l'agence) **et** attribution de rôle / périmètre dans la plateforme (administrateur de la plateforme). Deux gestes, deux responsables : **séparation des tâches** |
| Utilisateurs de la cliente (DR, CVR) | Leurs identités seraient détenues par l'agence : **la cliente et son DPO doivent y consentir par écrit** (cadre sous-traitance D17) |
| Disponibilité | Si l'IdP tombe, personne ne se connecte : prévoir des comptes de secours (administrateurs, MFA, hors ligne) et fixer l'objectif de reprise (D23) |
| Second facteur | Position inchangée (agence, administrateurs, accès financiers) mais **appliquée par l'IdP** ; la plateforme vérifie le niveau d'authentification reçu |
| Composant à choisir (D37) | Réduit à une **bibliothèque OIDC éprouvée** côté application ; plus de service d'authentification maison ou tiers à retenir |
| Sessions | Courte durée + revalidation ; déprovisionnement par l'IdP effectif à l'expiration ; **suspension immédiate** possible dans la plateforme |
| Prestataire | Doit disposer d'un compte (invité ou externe) dans l'IdP de l'agence **ou** d'un compte local de secours, selon la politique d'Impact |

### Informations manquantes (à demander à Impact, aucune hypothèse sur le produit)
1. Quel IdP, quels protocoles (OIDC / SAML), hébergement (UE ?), journaux accessibles.
2. Peut-il créer des comptes **externes** (employés Suntory) et y appliquer le second facteur ?
3. Procédure de départ et délai de désactivation côté agence ; qui est l'administrateur de l'IdP.
4. Support de récupération (mot de passe, facteur perdu) : qui, horaires, vérification d'identité.
5. Contrat : l'IdP agence est-il couvert par le cadre sous-traitance/DPA vis-à-vis de Suntory ?

### Récupération et administration (révisé)
| Cas | Géré par | Détail |
|---|---|---|
| Oubli de mot de passe, facteur perdu, compte verrouillé | **IdP agence** (support IT Impact) | La plateforme n'intervient pas ; elle journalise la connexion suivante |
| Rôle ou périmètre erroné, suspension métier | Administrateur de la plateforme | Journal d'audit |
| IdP indisponible | Compte de secours local (au moins deux, MFA, mot de passe en coffre hors ligne) | Usage tracé, alerte envoyée |
| Compte administrateur de la plateforme perdu | Un autre administrateur (quatre yeux) ; à défaut prestataire après vérification par Impact | Dossier d'incident |
| Départ | IdP : désactivation ; plateforme : retrait des droits et réaffectation | Les deux traces rapprochées lors de la revue périodique |

## 5. Tri des agents pour le développement et l'audit final

Principe : **aucune installation**. Tri sur les descriptions de ~96 agents des divisions `engineering`, `testing`, `security` et `design`, puis relecture partielle des candidats (en-tête, recherche de commandes réseau ou d'installation, aucun champ de restriction d'outils relevé : **un agent copié hérite des droits de la session**). Les autres divisions (marketing, jeux, GIS, ventes, etc.) sont écartées d'office. Aucune relecture intégrale n'a été faite, sauf `Code Reviewer` (76 lignes).

### A. Utiles au développement (retenus, 5)
| Agent | Rôle dans le projet | Lecture faite | Point d'attention |
|---|---|---|---|
| Minimal Change Engineer | Diffs minimaux, aligné sur la règle 3 (modifications chirurgicales) | Débuts | À mettre en cohérence avec `CLAUDE.md` pour éviter une double consigne |
| Code Reviewer | Revue de chaque lot avant fusion (correctitude, sécurité, tests, performance) | **Intégrale** | Format 🔴 / 🟡 / 💭 acceptable ; consignes en anglais |
| Test Automation Engineer | Parcours Playwright (stabilité des sélecteurs, traces) | En-tête + commandes | Exemples de CI avec `npx playwright install` : ne pas exécuter sans validation |
| Internationalization Engineer | FR / EN, ICU, pluriels, dates, absence de chaîne en dur (D27) | En-tête | Très pertinent ; relecture intégrale avant usage |
| Technical Writer | Documentation des lots, README, comptes rendus | En-tête | Exemples `npm install` à ignorer ; style à aligner sur le français du projet |

### B. Utiles à l'audit final des fonctionnalités (retenus, 6)
| Agent | Contrôle apporté | Lecture faite | Quand |
|---|---|---|---|
| Reality Checker | Certification fondée sur preuves, verdict « à retravailler » par défaut | En-tête | Fin de chaque lot A et avant démonstration |
| Evidence Collector | Reproduction avec captures, anomalies documentées | En-tête | Recette des parcours |
| Accessibility Auditor | WCAG 2.1 AA, lecteur d'écran, clavier (comble le manque du complément 10) | En-tête + commandes `axe` / `lighthouse` | Avant A7 ; un audit **automatique** ne vaut pas test lecteur d'écran |
| AI-Generated Code Auditor | Secrets en dur, droits par ligne absents, failles typiques du code généré par IA | En-tête | Avant le lot B1 et à chaque fusion sensible |
| Privacy Engineer | Minimisation, conservation, données personnelles (intervenants personnes concernées) | En-tête | Lot B ; **ne remplace ni DPO ni juriste** |
| Identity & Access Engineer | Revue de la fédération OIDC avec l'IdP agence, sessions, révocation | Débuts | Lot B1 |

### C. Conditionnels (à ne pas adopter maintenant)
Secrets & Credential Engineer (B1), Application Security Engineer (535 lignes, B1), UI Finish-Gate Reviewer et Persona Walkthrough (revue d'interface : simulation de persona ≠ test utilisateur), Data Visualization Engineer (choix de graphiques), Software Architect et Git Workflow Master (utiles si le dépôt grossit), API Tester et Performance Benchmarker (lot B).

### D. Écartés
Les ~80 autres agents des quatre divisions (blockchain, WordPress, Drupal, embarqué, vidéo, réseau, paiement, etc.), `Rapid Prototyper` (incitation à aller vite, contraire à la règle 3), `Multi-Agent Systems Architect` et `Autonomous Optimization Architect` (autonomie hors périmètre), `Whimsy Injector`, `Image Prompt Engineer`.

### Condition d'entrée dans le dépôt
1. Relecture intégrale de chaque agent retenu par T. SOEFOU.
2. Copie dans `.claude/agents/` **du dépôt Suntory uniquement**, version épinglée avec date et empreinte ; pas de `install.sh` ; pas d'installation globale.
3. Essai sur données fictives et bilan (gain mesuré, faux positifs).
4. Rôle limité : **recommandation**. Un agent d'audit ne valide pas une fonctionnalité ; la décision « fonctionnalité conforme » revient à T. SOEFOU, puis à la cliente pour l'acceptation.

### Grille d'audit final d'une fonctionnalité (preuves attendues)
| Contrôle | Preuve |
|---|---|
| Règles métier | Tests de table passés (date d'exécution) |
| Droits | Appel de données refusé hors périmètre |
| Accessibilité | Rapport automatique + passage clavier + lecteur d'écran |
| Langues | Parcours FR puis EN sans libellé manquant |
| Données | Aucun chiffre réel, marqueur « Démo » présent |
| États d'interface | Vide, erreur, refus, brouillon, conflit présents |
| Charte | Contrastes conformes au §2 |
| Trace | Décision liée au registre |

## 6. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, T. SOEFOU décide pour Suntory : charte mixte à dominante Suntory Beverage avec codes couleur Marvesting visibles sur les éléments importants (design Norton écarté) ; règles karpathy adaptées validées dans `CLAUDE.md` ; intervenants non utilisateurs, CVR / DR actifs dans des périmètres budgétaires gérés par la cliente et l'agence ; fournisseur d'identité = l'agence ; tri des agents (5 développement, 6 audit), aucune installation. Restent à confirmer par Impact / la cliente / DPO : usage du rose Marvesting, consentement à ce que l'agence détienne les identités de la cliente, règle d'allocation budgétaire.

## 7. Arbitrages restants (liste courte)
1. **Impact :** informations IdP (§4, 5 questions) et confirmation que les intervenants n'ont pas d'accès (D42).
2. **Cliente via Impact :** accord sur la charte mixte (rose Marvesting), sur l'agence comme IdP pour ses utilisateurs, sur les enveloppes CVR / DR (D43) et sur l'accès aux coûts (D08).
3. **T. SOEFOU :** statut du RS (utilisateur ou non) ; relecture des 5 + 6 agents avant leur copie dans le dépôt ; accord sur la lecture du §3.
4. **DPO des deux parties :** intervenants comme personnes concernées, identités cliente chez l'agence, conservation (D18).
