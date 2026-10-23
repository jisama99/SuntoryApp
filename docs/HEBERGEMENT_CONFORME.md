# HEBERGEMENT_CONFORME · options d'hébergement (V0.1 du 23/10/2026)

Client : Suntory uniquement. **Pas un avis juridique** : à valider par le DPO / un conseil. Aucun prix cité (non vérifié). Le choix final revient à T. SOEFOU (D02/D19 : le prestataire choisit l'hébergement, refacture à Impact, UE) et ne se fait **qu'à l'étape B** : l'étape A tourne en local sur données fictives (D104).
Mentions : **[Constaté]** lu sur la page officielle du fournisseur le 23/10/2026 · **[Déclaré]** affirmation commerciale du fournisseur, non vérifiée par un tiers · **[Non vérifié]** · **[Proposé]**.

## 1. Critères de conformité retenus
| # | Critère | Pourquoi |
|---|---|---|
| H1 | Données stockées **dans l'UE** (région choisie, sauvegardes et journaux inclus) | « Europe ≠ UE » (Londres, Zurich hors UE) |
| H2 | **DPA / contrat art. 28** disponible, liste des sous-traitants, mesures techniques (TOMs) | exigé pour un sous-traitant |
| H3 | Exposition aux **lois extraterritoriales** (siège / maison mère hors UE, CLOUD Act) | analyse de transferts |
| H4 | Certifications : ISO 27001 (périmètre à lire), HDS / SecNumCloud **si le besoin le justifie** | preuves de sécurité |
| H5 | Services nécessaires : PostgreSQL managé, conteneurs / Node, stockage objet, sauvegardes, chiffrement | architecture B |
| H6 | Réversibilité : export complet, restitution et destruction des données | clause CNIL sous-traitance |
| H7 | Sous-traitant ultérieur déclaré à Impact avant usage | chaîne Suntory → Impact → prestataire → hébergeur |

## 2. Fournisseurs examinés
| Fournisseur | Certifications citées | Régions / lieux | DPA / RGPD | Exposition extraterritoriale | Services utiles (H5) | Lecture |
|---|---|---|---|---|---|---|
| **Scaleway** (Scaleway SAS) | ISO/IEC 27001:2022 [Constaté] ; HDS [Constaté] ; SecNumCloud **non obtenue, qualification en cours** [Constaté] | Paris `fr-par`, Amsterdam `nl-ams`, Varsovie `pl-waw`, 3 zones chacune [Constaté] | DPA téléchargeable ; TOMs et liste de sous-traitants annoncés dans les documents contractuels, **à télécharger et lire** [Constaté] | « Free from the US CLOUD Act », juridiction européenne **[Déclaré]** | Managed PostgreSQL, Serverless Containers, Object Storage dans les 3 régions [Constaté] | **Candidat n° 1** pour l'étape B |
| **OVHcloud** | ISO 27001/27017/27018, ISO 27701, SOC 1-2-3, HDS, offres SecNumCloud [Constaté] ; SecNumCloud limité à des **offres précises** (vSphere, SNC Cloud Platform…) ; la page indique une qualification SNC Cloud Platform en « septembre 2026 » **[à recouper sur la liste ANSSI]** | offres qualifiées : Roubaix, Gravelines, Strasbourg [Constaté] | DPA **non mentionné** sur la page conformité [Non vérifié] | à analyser (siège France) | PostgreSQL managé / conteneurs : **non vérifiés ici** | **Candidat n° 2** ; vérifier le périmètre de chaque certificat |
| **Supabase** (région UE) | SOC 2 Type 2, ISO 27001, HIPAA [Constaté] ; dates non indiquées | régions UE : Irlande `eu-west-1`, Paris `eu-west-3`, Francfort `eu-central-1`, Stockholm `eu-north-1` ; **Londres et Zurich hors UE** [Constaté] ; hébergé sur AWS [Constaté] | DPA disponible ; la page précise que « choisir une région n'est qu'un contrôle de localisation » ; sauvegardes, journaux, Edge Functions et sous-traitants peuvent affecter la résidence ; pas de liste de sous-traitants ni de SCC sur la page [Constaté] | société et infrastructure AWS : exposition à analyser [Non vérifié] | PostgreSQL, Auth, Storage, Edge Functions | **Option accélérée** (déjà connectée) ; analyse de transferts obligatoire avant données réelles |
| **Vercel** | non examiné | fonctions : Paris `cdg1`, Francfort `fra1`, Stockholm `arn1`, Dublin `dub1`… ; **défaut : Washington `iad1`** [Constaté] ; middleware déployé dans toutes les régions [Constaté] | DPA avec clauses types 2021 ; **installations principales aux États-Unis ; aucun engagement de résidence UE** ; sauvegardes « globally replicated » ; AWS, Azure, GCP [Constaté] | forte | — | **Acceptable pour des aperçus à données fictives uniquement** ; **non retenu pour données réelles** sans analyse juridique |
| **Clever Cloud** | HDS (6 activités, référentiel du 16/05/2024), ISO 9001:2015, ISO 27001:2022 ; SecNumCloud non obtenue [Constaté] | lieux **non précisés** dans le texte lu [Non vérifié] | non vérifié | non vérifié | PaaS Node + add-ons : non vérifiés | Alternative française à étudier |
| **Hetzner** (Allemagne) | non confirmées sur les pages lues | non confirmés | DPA non trouvé sur la page lue [Non vérifié] | non vérifié | — | À instruire si besoin de coût bas |
| **3DS Outscale** | page non consultable (robots) | — | — | — | — | **Non instruit** ; candidat SecNumCloud classique |
| **AWS / Azure / GCP** (régions UE) | non examinés | — | — | maison mère hors UE | — | **Non instruit** ; analyse de transferts nécessaire |
Infomaniak (Suisse) : non instruit ; **la Suisse n'est pas dans l'UE** (adéquation à vérifier).

## 3. Recommandation [Proposé]
| Étape | Option | Condition |
|---|---|---|
| A (démonstrateur) | **Local** (Node 22) ; aperçu Vercel autorisé **uniquement avec fixtures fictives** et protection d'accès | aucune donnée réelle, règle D109 bis |
| B (MVP, données réelles) | **Scaleway `fr-par`** : Serverless Containers + Managed PostgreSQL + Object Storage, sauvegardes dans `fr-par` / `nl-ams` | feu vert B écrit, DPA lu et signé, accord écrit d'Impact (sous-traitant ultérieur) |
| B (instruction en cours) | **OVHcloud** (D115) : voir §3 bis ; Scaleway reste la référence de comparaison ; Clever Cloud en réserve | choix après obtention des pièces |
| B accélérée | Supabase `eu-west-3` (Paris) | analyse de transferts + DPA + désactivation de tout service hors UE (journaux, Edge Functions) |
**SecNumCloud n'est pas exigé par défaut** pour ces données (pilotage commercial, noms professionnels, téléphones de candidats) ; à confirmer par le DPO selon le niveau de risque [Proposé].

## 3 bis. Instruction OVHcloud (décision D115, 23/10/2026)
| Point | Constat | Source |
|---|---|---|
| Certifications | ISO/IEC 27001, ISO/IEC 27701 et SOC 2 Type 2 citées sur la page Databases for PostgreSQL [Constaté] ; HDS et SecNumCloud par offre (voir §2) | page PostgreSQL, page conformité |
| Régions Public Cloud | Strasbourg, Gravelines, Roubaix, **Paris 3-AZ**, Milan 3-AZ, Londres, Francfort, Varsovie ; Londres hors UE [Constaté] | page disponibilité |
| PostgreSQL managé | haute disponibilité annoncée « jusqu'à 99,99 % » en 3-AZ ; extensions PostGIS, pgvector ; régions, chiffrement et versions **non précisés sur cette page** [Constaté / Non vérifié] | page PostgreSQL |
| Sauvegardes | PostgreSQL : sauvegarde continue (PITR) et snapshots incrémentiels horaires ; réplication vers une autre région, personnalisable (1 ou 2 régions) ; chiffrées ; **durée de rétention selon le plan, non précisée** [Constaté] | doc sauvegardes |
| DPA | DPA lu = version **OVHcloud US** (`us.ovhcloud.com`) ; le client choisit le lieu de stockage (§3.k) mais le DPA indique que les données « peuvent être transférées et consultées depuis le monde entier » ; sous-traitants ultérieurs en annexe III (dont OVH SAS France, OVH Hosting Ltd Irlande, **Aiven OY Finlande**, plusieurs éditeurs tiers) ; autorisation générale, opposition sous 15 jours ouvrés ; notification de violation « promptly », **sans délai chiffré** ; restitution 15 jours calendaires ; droit français pour les clauses types [Constaté] | DPA US |
| Services conteneurs | Managed Kubernetes / conteneurs : **non vérifiés** | — |
**Points à obtenir avant décision** : (1) le DPA applicable à une entité **européenne** (celui lu est la version US) ; (2) la liste à jour des sous-traitants et leur lieu de traitement, en particulier Aiven pour les bases managées ; (3) la rétention des sauvegardes de l'offre visée ; (4) un délai de notification de violation écrit (≤ 48 h à négocier [Proposé]) ; (5) le périmètre exact de chaque certificat ; (6) un service d'exécution applicatif en région UE (Paris 3-AZ ou Gravelines) ; (7) un engagement écrit de non-transfert hors UE des données de contenu.
Sources : [PostgreSQL](https://www.ovhcloud.com/fr/public-cloud/postgresql/) · [sauvegardes](https://docs.ovhcloud.com/fr/guides/public-cloud/databases/backups) · [disponibilité des régions](https://www.ovhcloud.com/fr/public-cloud/regions-availability/) · [DPA](https://us.ovhcloud.com/legal/data-processing-agreement/) (lu jusqu'au caractère 100 000 sur 127 028).

## 4. Pièces à obtenir avant de choisir (preuves)
1. DPA signé et liste des sous-traitants ultérieurs à jour. 2. Mesures techniques et organisationnelles. 3. **Copie des certificats** (périmètre, dates de validité, organisme). 4. Localisation écrite des données, sauvegardes et journaux. 5. Procédure de notification de violation (délai pour informer le responsable). 6. Clause de réversibilité (export, destruction). 7. Accord écrit d'Impact et de la cliente.

## 5. Limites de ce document
- Une certification ne vaut pas conformité RGPD : la responsabilité de l'application reste partagée.
- Les pages ont été lues par extraction automatique : à recontrôler avant décision, prix et SLA non traités.
- « Free from the US CLOUD Act » est une déclaration commerciale : l'analyse juridique appartient au DPO.
- Aucun hébergeur n'est contractualisé à ce jour. Décision d'hébergement : **non prise** ; D115 enregistre l'instruction d'OVHcloud en premier.

## 6. Sources (consultées le 23/10/2026)
- Scaleway : [sécurité et résilience](https://www.scaleway.com/en/security-and-resilience/) · [contrats (DPA, TOMs)](https://www.scaleway.com/en/contracts/) · [disponibilité des produits par région](https://www.scaleway.com/en/docs/account/reference-content/products-availability/)
- OVHcloud : [conformité](https://www.ovhcloud.com/fr/compliance/) · [SecNumCloud](https://www.ovhcloud.com/fr/compliance/secnumcloud/)
- Supabase : [RGPD](https://supabase.com/docs/guides/security/gdpr-compliance) · [sécurité](https://www.supabase.com/security) · [régions](https://supabase.com/docs/guides/platform/regions)
- Vercel : [régions](https://vercel.com/docs/regions) · [choix des régions](https://vercel.com/guides/choosing-deployment-regions) · [DPA](https://vercel.com/legal/dpa)
- Clever Cloud : [certification HDS](https://www.clever.cloud/blog/press/2025/01/15/clever-cloud-obtains-hds-certification/)
- Hetzner : [DPA](https://www.hetzner.com/legal/dpa/)
- Cadre : `DEVIS_CONFORMITE/CADRAGE_CONFORMITE.md` (CNIL, ANSSI).
