# SUNTORY REFONTE V3 · Décisions du 22/10/2026 (suite) : logos, RS, chaîne managériale, budgets, agents

Client : Suntory uniquement. Ce document complète le n°14 ; en cas de contradiction, c'est le plus récent qui prévaut.
Trace : décisions de T. SOEFOU dans la conversation du 22/10/2026. Statut : décisions **du prestataire** ; ce qui engage Impact, la cliente, leur IT ou leurs DPO reste à confirmer. Aucune donnée réelle (nom, e-mail, téléphone, montant) n'est reprise ici : seules les **structures** des classeurs ont été lues.

## 1. Décisions enregistrées

| N° | Décision exprimée | Statut |
|---|---|---|
| D30 | Rose Marvesting accepté dans l'espace de la cliente | Accord de T. SOEFOU ; la cliente le verra au démonstrateur |
| D31 | Dossier `LOGOS` créé avec les logos disponibles | Fichiers fournis ; **usage dans les écrans à confirmer** (voir §2) |
| D39 | Agents : accord si leur fiabilité est constatée | Fiabilité vérifiée (§5) ; 11 agents déposés en portée projet |
| D44 (nouvelle) | Les **RS sont utilisateurs** : ils saisissent les besoins par magasin | Décidée |
| D45 (nouvelle) | Le workflow managérial suit **la chaîne managériale et la sectorisation** des fichiers présents | Décidée ; règles de détail à valider (§3) |
| D43 (précisée) | La règle d'allocation des budgets **suit les classeurs et le module de pilotage** | Décidée ; points non couverts listés (§4) |

## 2. Logos

| Fichier (dossier `LOGOS`) | Constat (image ouverte) | Utilisable ? |
|---|---|---|
| `logo_marvesting_rouge.webp` | Mot-symbole « marvesting », 1900 × 399, fond transparent. **Couleur mesurée `#FF5648` (corail)**, et non `#E52365` | Oui comme visuel ; **incohérence de couleur à trancher** (voir ci-dessous) |
| `suntory-alstef-group1-scaled.webp` | 2880 × 1728, **fond blanc, pas de transparence** : composition avec une grande forme bleue, un disque marine et le texte « SUNTORY BEVERAGE & FOOD FRANCE » (teinte mesurée `#5AC1DA`). Ce n'est **pas** un logo isolé : il faut recadrer le texte. Je n'infère rien du nom du fichier | **Non en l'état** : image de composition ; demander le logo officiel (idéalement vectoriel) |
Aucun fichier vectoriel, aucune charte d'usage (zone d'exclusion, tailles minimales). Les fichiers du dossier ne sont pas modifiés.

### Point de couleur à trancher
La charte Marvesting (`design_system_marvesting.md`) donne le rose `#E52365`, mais le logo est en `#FF5648` (corail, contraste 3,15 sur blanc). Le module V4 utilisait déjà un survol corail `#FF7A6B`. Proposition : **`#E52365` pour les éléments d'interface importants (D30)**, `#FF5648` **uniquement pour le logo**, sans le mélanger. À confirmer : quelle couleur Marvesting fait référence pour l'interface.

### Usage proposé (révise D28, à confirmer)
| Emplacement | Proposition | Condition |
|---|---|---|
| En-tête de l'espace cliente | Logo Suntory (version officielle recadrée ou vectorielle) | Droit d'usage confirmé (D25 / Q22) |
| Pied de page ou écran de connexion | Logo Marvesting discret, mention « plateforme opérée par » | Accord d'Impact |
| Écrans, exports, PDF | Aucun nom ni coordonnée du prestataire (D28 inchangé pour la signature FREELANCE, réservée aux documents externes) | — |
Aucun logo n'est intégré au code avant la levée de D25 / Q22. Le démonstrateur peut prévoir deux emplacements vides.

## 3. RS utilisateurs et chaîne managériale (D44, D45)

### Ce que montrent les classeurs (structure seule)
| Fichier | Rôle constaté | Colonnes utiles à la sectorisation |
|---|---|---|
| `FICHIERS POUR DEPARTEMENTS/DECOUPE 2026 V3 JUIN 1.xlsx` | Découpe de la force de vente : environ 4 037 lignes ; onglets de recap par profil, « Modifs 2026 », « A supprimer » | Codes magasin (statistique / Nielsen), TYPE FDV, **CODE DR, CODE CVR, CODE RS**, CODE AC, noms |
| `LISTING MAGASINS DEPARTEMENTS - NETTOYE V2.xlsx` | Référentiel du module V4 : 496 magasins, clé **Code Nielsen** | Code RS, DR, CVR, enseigne, département ; onglets DEPARTEMENTS, LIAISON_DEP_CVR, REFERENTIEL_DR_CVR_RS, ANOMALIES |
| `Suivi_Merch_Perm_Saisonnier_2026` | Affectations par **code secteur (code RS)** ; statuts ; carences ; facturation | Secteurs, RS responsable, statut (Projection, À recruter, En recrutement, En attente retour RS, Validé, Contrat + matériel OK, Désistement, Rupture) |
| `TBB SBFF …` et `Tableau de bord Suntory 2026` | Quotas, consommations, détail par DR / CVR / RS | Hiérarchie DR › CVR › RS |

**Chaîne retenue** : DNV (profil de niveau national, sigle non défini dans les fichiers) › **DR** (`F1`…) › **CVR** (`C01A`…) › **RS** (`R1A1`…) › **magasins** (clé Code Nielsen). D'après l'onglet REFERENTIEL_DR_CVR_RS, un RS dépend d'un seul CVR ; **un département peut relever de plusieurs DR et CVR** (colonne « Alerte : plusieurs DR » du listing) : le rattachement se fait **par magasin**, jamais par département.

### Écarts constatés entre fichiers (à lever, D24)
| Écart | Détail |
|---|---|
| Deux schémas de codes DR | `F1`… dans le listing, `D001`… dans l'onglet RECAP de la découpe |
| Volumes | Découpe : environ 4 037 lignes ; listing : 496 magasins. Le périmètre commun n'est **pas expliqué** par les fichiers |
| Codes « X- » | Magasins sans liaison dans le référentiel (onglet ANOMALIES : gravité « Bloquant ») |
| Colonne « AC » | Présente dans la découpe et dans le tableau de bord ; signification non définie dans les fichiers : **non inférée** |
| Source maître | Aucun fichier ne déclare lequel fait foi entre découpe (juin) et listing nettoyé V2 |

### Workflow proposé (à valider, RACI de D09)
| Étape | Acteur | Règle de périmètre | Sortie |
|---|---|---|---|
| 1. Saisie du besoin | **RS** | Uniquement les **magasins de son secteur** (code RS → magasins) | Brouillon, puis « Soumis » |
| 2. Contrôle | RS (alertes) | Doublon exact bloquant, autres cas en alerte (D22) | Besoin valide ou corrigé |
| 3. Validation managériale | **CVR** du RS | Besoins de ses RS, **dans son enveloppe** (D43) | Validé / refusé avec motif |
| 4. Escalade | **DR** | Si hors enveloppe du CVR ou arbitrage entre CVR | Validé / refusé |
| 5. Proposition | **Agence** | Besoins validés ; ressources disponibles | Proposition |
| 6. Décision | Cliente (**CVR / DR** selon l'enveloppe) | Périmètre budgétaire | Accord / refus / réexamen |
| 7. Suivi terrain | RS, CVR, agence | Saisie **pour le compte** de l'intervenant (D42) | Statuts prise de poste / remise véhicule distincts (D11) |
À trancher : suppléants et délégations en cas d'absence d'un CVR ou d'un DR ; délai de réponse et relance ; qui valide quand le RS n'a pas de CVR rattaché ; traitement d'un changement de secteur en cours de besoin (les fichiers « Modifs 2026 » prouvent que la découpe bouge).

### Droits à tester
Un RS ne voit et ne saisit rien hors de son secteur ; un CVR ne voit que ses RS ; un DR que ses CVR ; un appel de données hors périmètre ne renvoie aucune ligne. Le référentiel étant **modifiable** (mutations), toute modification de rattachement est journalisée et recalcule les droits (acquis V4 : suppression bloquée tant que des éléments sont rattachés).

## 4. Allocation des budgets : ce que les fichiers établissent, et ce qui manque (D43)

### Règles lisibles dans `TBB SBFF …` (structure et formules, sans montants)
| Règle | Source (onglet) | Lecture |
|---|---|---|
| Hiérarchie **National › DR › CVR** : le quota d'un niveau est la **somme** de ses enfants | « Suivi des conso Vs quotas » | Roll-up par somme |
| Un quota est **affecté**, puis **dépensé**, puis **restant** ; s'y ajoutent les dépenses **prévisionnelles** | idem | Restant = affecté − dépensé ; solde = affecté − dépensé − prévisionnel |
| Deux ratios : **% consommé** et **% consommé + prévisionnel** | idem | Base des alertes |
| Les quotas sont **datés et versionnés** (« quota global au 02/05 », « au 29/08 », « affecté à avril ») | « SUMMURY QUOTA », « Suivi des conso Vs quotas » | Historique obligatoire |
| Quotas par **campagne / opération** distincts (ponctuel, tournée inter-région…) | « SUMMURY QUOTA », « Suivi des quotas INTER REGION » | Enveloppes par campagne |
| Jours de **carence interne** valorisés au **coût jour** puis **ajoutés au quota** du CVR concerné | « SUIVI CARENCES », « CARENCE INTERNE » (tableau de bord) | Règle de réalimentation |
| Feuilles de projection avec **coefficients de répartition** (50 %, 25 %, 15 %, 10 %) | « Budget avec projection », « BUDGET DEF CVR » | **Signification non confirmée** par le fichier |
| Seuils « Dépassement / Vigilance / Sous-consommation » | Module M1 (lecture seule, constat du lot 0) | Valeurs et validation à reprendre |

### Constats sur les quotas permanent et saisonnier
Les onglets examinés du suivi permanent / saisonnier portent des **heures, semaines, statuts et facturation** ; je n'y ai **pas retrouvé** d'enveloppe allouée par CVR ou DR. **D22 / Q6 reste ouvert** (« à définir » en gris au démonstrateur). Lecture limitée aux en-têtes : à confirmer par un examen détaillé des formules avec vous.

### Manques (non couverts par les fichiers)
1. **Qui fixe et qui modifie** une enveloppe (cliente, agence, les deux) et sur quelle trace. Proposition : double validation cliente + agence, version datée, motif.
2. **Maille** : les fichiers donnent DR et CVR ; l'enveloppe par **RS** n'apparaît pas.
3. **Dépassement** : blocage, alerte ou validation supérieure ? (D05 à D08 ouverts.)
4. **Valeurs des seuils**, et rôle de l'accusé de lecture (« accusé de lecture ≠ approbation » dans le dossier de cadrage).
5. **Visibilité des coûts** par rôle (D08) : un RS voit-il l'enveloppe de son CVR ?
6. Signification des coefficients 50 / 25 / 15 / 10 %.
Le démonstrateur reproduit la **structure** (roll-up, versions datées, deux ratios) sur données fictives, avec « Budget non renseigné » là où la règle manque.

## 5. Agents : fiabilité constatée (D39)

### Contrôles faits sur les 11 agents retenus
Recherche de motifs sur les fichiers entiers : commandes réseau, suppression, exécution distante, encodage, jetons, consignes d'ignorer ou de contourner les règles, ouverture de ports, écriture hors du dépôt. Lecture ciblée des sections de règles de chaque agent, lecture intégrale de Code Reviewer. **Pas de lecture ligne à ligne des ~2 450 lignes au total.**

| Agent | Constat | Verdict |
|---|---|---|
| Code Reviewer | Consignes saines, aucune commande | Fiable |
| Minimal Change Engineer | Consignes saines ; recoupe la règle 3 ; exception `Repository` ajoutée | Fiable |
| Test Automation Engineer | Exemples Playwright et CI ; aucune action cachée | Fiable, périmètre borné |
| Internationalization Engineer | Très pertinent FR / EN ; déborde (RTL, TMS) | Fiable, périmètre réduit à FR / EN |
| Technical Writer | Exemples avec fausses URL et `npm install` | Fiable, avertissement ajouté |
| **Reality Checker** | **Étape 1 obligatoire appelle `qa-playwright-capture.sh`, absent du dépôt**, et suppose Laravel | **Adapté** : preuves fournies par les suites du projet |
| **Evidence Collector** | Même dépendance au script absent | **Adapté** |
| Accessibility Auditor | `npx @axe-core/cli` et `npx lighthouse` non épinglés | Fiable, commandes non lancées par l'agent ; versions à épingler |
| AI-Generated Code Auditor | Cible les secrets et droits par ligne ; exemples Supabase | Fiable |
| Privacy Engineer | Pertinent ; techniques avancées hors besoin | Fiable, **hors rôle juridique** |
| Identity & Access Engineer | OIDC, rotation, récupération ; aligné sur l'IdP agence | Fiable, adapté à D33 |
Aucun motif d'inquiétude (exfiltration, destruction, injection) n'a été relevé. **Fiabilité de fond non démontrée** : un essai sur données fictives avec bilan reste la condition de maintien.

### Mise en place (dans le dépôt, rien dans le profil utilisateur, **agents non actifs**)
`08_PLATEFORME_SUNTORY_V3/agents-projet/` : 11 fichiers + `README.md` + licence. Chaque fichier : champ `tools` (audits en **lecture seule**, développement avec édition, **aucun `Bash`, aucun réseau**), bloc « Cadre projet Suntory » prioritaire, empreinte de l'original, corps d'origine inchangé. Aucun `install.sh` utilisé ; aucun commit ; retrait = suppression du dossier.
Écartés confirmés : Secrets & Credential Engineer (B1), Application Security Engineer, UI Finish-Gate Reviewer, Persona Walkthrough, Data Visualization Engineer et le reste.

## 6. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, T. SOEFOU décide pour Suntory : rose Marvesting accepté dans l'espace cliente ; dossier `LOGOS` fourni (usage à confirmer) ; RS utilisateurs saisissant les besoins par magasin ; workflow managérial selon la chaîne DR › CVR › RS et la sectorisation des fichiers ; allocation budgétaire selon les classeurs et le module de pilotage ; 11 agents adoptés en portée projet après vérification de fiabilité. Restent ouverts : logo Suntory officiel, couleur Marvesting de référence, règles de modification d'enveloppe, quotas permanent / saisonnier, source maître de la sectorisation.

## 7. Arbitrages restants (liste courte)
1. **T. SOEFOU :** confirmer l'usage des logos (§2) et la couleur Marvesting de référence ; valider le workflow du §3 et la double validation d'enveloppe du §4.
2. **Impact :** fournir le logo Suntory officiel (ou le droit d'usage) ; confirmer RS utilisateurs, intervenants non utilisateurs, informations IdP (document 14).
3. **Cliente (CVR, DR, finances) :** règle de modification des enveloppes, dépassement, seuils, visibilité des coûts, sens de « AC » et des coefficients ; fichier maître de la sectorisation.
4. **DPO des deux parties :** conservation, identités cliente chez l'agence, intervenants personnes concernées.
