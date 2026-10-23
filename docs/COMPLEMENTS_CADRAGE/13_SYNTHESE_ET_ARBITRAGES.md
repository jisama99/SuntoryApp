# SUNTORY REFONTE V3 · Synthèse des compléments de cadrage et arbitrages nécessaires

Version de travail du 22/10/2026 · Client : Suntory · Statut : **aucune décision de ce document n'est validée** ; chaque ligne est une proposition du prestataire en attente de trace.

> **Mise à jour du 22/10/2026** : les décisions de T. SOEFOU (charte mixte, intervenants non utilisateurs, IdP = agence, tri des agents) sont dans `14_DECISIONS_22-10_CHARTE_ACCES_AGENTS.md` et **prévalent** en cas de contradiction avec ce document.

> **Complément du 22/10/2026 (suite)** : voir aussi `15_DECISIONS_22-10_LOGOS_RS_BUDGETS_AGENTS.md` (logos, RS utilisateurs, chaîne managériale, budgets, agents adoptés).

## 1. Lecture rapide

| Volet | Existant vérifié | Principal manque | Recommandation | Bloque quoi |
|---|---|---|---|---|
| Design | Design system Suntory, jetons V4, garde-fous d'interface, comptes rendus | Charte unique, mobile, états d'interface, accessibilité non auditée | Suntory dominant, sans rose ni signature ; `#00829B` pour le texte, cyan en graphiques seulement ; Inter auto-hébergée ; mobile web responsive d'abord | Maquettes du démonstrateur (lot A1) |
| Accès | Positions D20 / Q3 + MFA ; modules V4 scellés (autre logique) | Population intervenants, IdP inconnus, parcours d'urgence | UUID technique ; connexion adresse pro ou identifiant interne ; MFA admin / agence / accès financiers ; oubli par lien à usage unique ; administrateur récupéré à quatre yeux | Lot B1 (pas l'étape A) |
| Agents | Deux dossiers lus (agents : 324 `.md` + scripts ; karpathy : 4 principes) | Gain démontré nul à ce jour | Ne rien installer ; principes karpathy en texte ; automatisations déterministes d'abord ; agents métier après le démonstrateur | Rien pour l'étape A |

## 2. Constats à retenir (corrigent ou précisent un acquis)

1. **Contraste** : le cyan `#5BC2DC` ne passe pas en texte (2,06 : 1) ; `#00829B` passe tout juste (4,50) ; texte bleu sur fond aqua échoue (4,03) ; le rose Marvesting échoue de peu (4,41). Calculé aujourd'hui.
2. **Source à écarter** : `marvesting_trame_system_design.md` est un document **Norton**. Il ne doit pas alimenter Suntory.
3. **Les modules V4 scellés ne se transposent pas** à la plateforme en ligne : leur vraie limite (un fichier diffusé reste ouvrable) disparaît avec la révocation côté serveur.
4. **`install.sh` d'agency-agents écrit dans le dossier utilisateur** (portée globale, toutes missions) : incompatible avec la règle « ne jamais mélanger les clients ».
5. **Karpathy** : 4 principes en texte, sans code ; la licence MIT est *déclarée* dans le manifeste, mais aucun fichier de licence n'est présent.

## 3. Ce qui reste non vérifié
- Charte officielle Suntory : non fournie ; le design system vient d'un site institutionnel.
- Maquettes V4 : structure repérée, **pas inspectées visuellement** dans cette session.
- Accessibilité, lecteur d'écran, Chrome Mac : non testés.
- Réseau d'`agency-agents` : aucune commande relevée par recherche de motifs, **scripts non lus intégralement**.
- Versions, licences et coûts de tout composant d'authentification ou d'hébergement : non vérifiés.
- Comportement des notifications et du stockage hors ligne des navigateurs mobiles : à tester sur appareils réels.
- Aucun test exécuté dans cette phase ; aucun fichier source ni module modifié.

## 4. Registre : décisions nouvelles (mise à jour proposée, non enregistrée comme validée)

| N° | Sujet | Proposition du prestataire | Statut | Décideur attendu |
|---|---|---|---|---|
| D30 | Direction visuelle | Suntory dominant, pas de rose, Inter auto-hébergée, texte en `#00829B` ou `#1A1A1A` | Proposition | Cliente via Impact |
| D31 | Charte officielle et logos | Fournir la charte et dire si les logos sont embarqués | Ouvert | Cliente |
| D32 | PWA ou native | Interface web responsive d'abord ; décision après 4 réponses terrain | Ouvert | Métier, IT, Impact |
| D33 | Moyen de connexion par population | Adresse pro par défaut ; identifiant interne pour intervenants sans e-mail pro ; SSO option | Proposition | Impact, cliente |
| D34 | Étendue du second facteur | Au-delà de la position actuelle : à décider pour direction / DR / CVR / RS | Ouvert | Cliente, IT |
| D35 | Récupération d'un administrateur | Quatre yeux, délai de sécurité, vérification côté Impact | Proposition | Impact, prestataire |
| D36 | Paramètres de sécurité | Durées des liens, verrouillage, session, revue | Ouvert (valeurs d'exemple dans le complément) | Impact, cliente, IT |
| D37 | Composant d'authentification | Ne pas écrire de mécanisme maison ; choisir après vérification | Ouvert | T. SOEFOU, Impact |
| D38 | Principes karpathy | Texte dans `CLAUDE.md`, pas de plugin | Proposition | T. SOEFOU |
| D39 | Essai d'agents ciblés | 3 à 4 agents copiés dans le dépôt, après relecture intégrale | Ouvert | T. SOEFOU |
| D40 | Agents métier | Report après le démonstrateur | Proposition | Impact, cliente, DPO |
| D41 | Premières automatisations | Contrôle Excel, anomalies, relances à valider, supervision | Ouvert | Impact, cliente |

## 5. Liste courte des arbitrages nécessaires pour poursuivre

**Pour T. SOEFOU (avant les maquettes et le lot A1)**
1. Valider la direction visuelle (D30) et la règle « pas de texte en cyan ».
2. Valider « ne rien installer » et le sort des principes karpathy (D38, D39).
3. Valider que les compléments entrent dans le dépôt et le registre comme **propositions**.

**Pour Impact (agence)**
4. Réponse sur les intervenants : adresse professionnelle ou non, appareils, zones sans réseau, flotte (D32, D33).
5. Qui administre côté Impact, qui vérifie l'identité en cas de récupération d'un administrateur (D35).
6. Acceptation de la refacturation de l'hébergeur et d'un éventuel composant d'authentification (D02, D37).

**Pour la cliente (via Impact)**
7. Charte officielle et droit d'usage des logos (D31, D25).
8. Niveau de second facteur au-delà des administrateurs, et accès aux coûts (D34, D08).
9. Périmètre autorisé de l'IA sur les données (famille 3) : reporter à après le démonstrateur (D40).

**Pour l'IT et les DPO**
10. Fournisseur d'identité et faisabilité du SSO ; paramètres de sécurité (D34, D36) ; durées de conservation et AIPD (D18).

## 6. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, le prestataire a produit trois compléments de cadrage pour Suntory (design, accès, automatisations et agents). Sont proposés, sans validation : direction visuelle Suntory dominante ; connexion par adresse professionnelle avec solution de repli pour les intervenants ; récupération d'administrateur à quatre yeux ; aucune installation d'agent à ce stade. Les dossiers « agents » et « karpathy » ont été lus ; leur installation n'est pas retenue. Le fait que `marvesting_trame_system_design.md` appartient à Norton est noté pour éviter tout mélange.

## 7. Pour votre reconversion (gain transférable)
| Ce que vous avez fait | Reformulation stratégique |
|---|---|
| Cadrer qui voit quoi par rôle, avec un test qui prouve l'absence de fuite | Conception de contrôle d'accès à moindre privilège (RBAC) et validation par tests négatifs |
| Distinguer identifiant technique, moyen de connexion et récupération | Gestion du cycle de vie des identités (IAM) et analyse des scénarios de récupération |
| Refuser d'installer 324 agents sur la foi de leurs noms | Évaluation de la chaîne d'approvisionnement logicielle et gestion du risque lié aux outils d'IA tiers |
| Classer agents / scripts / opérations métier avec validations humaines | Gouvernance de l'IA : périmètre d'autonomie, supervision humaine, journalisation |
Pour aller plus haut : compléter par une lecture du cadre OWASP pour les applications et les systèmes à base de modèles de langage, et du RGPD (analyse d'impact) — sources officielles à lire en entier.
