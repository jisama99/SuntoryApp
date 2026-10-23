# SUNTORY REFONTE V3 · Catalogue fonctionnel V0.1 (application et site)

Version de travail du 22/10/2026 · Client : Suntory uniquement · Statut : **cadrage proposé par le prestataire ; rien n'est validé par Impact ni par la cliente** (hors décisions de T. SOEFOU listées au §1).
Ce document ne contient ni code ni écran. Il regroupe ce que les documents existants établissent (WF-A1 à WF-E7 de la cartographie, dossier de cadrage D01–D28, lots A0–B9, modules V4, présentation V0.4) et comble les manques.

## 0. Réponse à votre question : cadrer maintenant ou pendant le développement ?

**Les deux, à deux niveaux.** Ce qui conditionne le modèle de données, les droits, le chiffrage du lot B et la démonstration se cadre **maintenant** ; le détail d'écran se précise **dans chaque lot**, avec votre validation entre deux lots.

| Niveau | Contenu | Quand | Pourquoi |
|---|---|---|---|
| 1 · Catalogue | Modules, fonctions, rôles, phase (A / B / C), règles, indicateurs, alertes, paramètres, imports / exports, automatisations, reporting | **Maintenant** (ce document) | Un oubli ici (ex. paramètre daté, droit d'export) coûte une refonte du modèle ; le devis du lot B s'appuie dessus |
| 2 · Règles testables | Tables de règles (W1–W22, D1–D7, seuils, statuts) | Au début de chaque lot concerné | Les tests s'écrivent table par table |
| 3 · Détail d'écran | Libellés exacts, ordre des colonnes, maquettes, messages d'erreur | **Dans le lot** (A1 à A7) | Il s'ajuste en voyant le démonstrateur |
| 4 · Valeurs | Seuils, délais, tarifs, durées | Paramétrables, jamais figées dans le code ; valeurs réelles décidées par la cliente et l'agence | Évite de coder une hypothèse |

Ce qui reste **à ne pas figer** : valeurs de seuils, textes, formats d'export exacts, apparence des graphiques.

## 1. Décisions reçues le 22/10/2026 (T. SOEFOU)

| N° | Décision | Statut |
|---|---|---|
| D31 | **Usage des logos confirmé** (emplacements du doc. 15 : logo Suntory en en-tête, logo Marvesting en pied de page / connexion). Reste à fournir le logo Suntory officiel, et à lever D25 / Q22 avant intégration au code | Confirmée par T. SOEFOU ; droits à lever |
| D44 / D45 | **Workflow RS validé** : le RS saisit par magasin de son secteur, le CVR valide, le DR arbitre, l'agence propose, la cliente décide | Validée par T. SOEFOU |
| D46 (nouvelle) | **Réallocation budgétaire** : la cliente et l'agence peuvent réallouer ou ajuster le budget dans leurs paramètres ; **l'effet est visible dans les autres espaces** (CVR, DR, RS) | Décidée ; mode de validation (simple ou double) à confirmer, voir §5 |
| D39 | Agents acceptés ; l'activation se fait sur votre poste (copie de `agents-projet/` vers `.claude/agents/`) | Acceptée ; activation par T. SOEFOU |

Non tranchée dans votre message : la couleur de référence Marvesting (`#E52365` interface, `#FF5648` logo). Je retiens ma proposition (interface en `#E52365`, logo inchangé) jusqu'à avis contraire.

## 2. Légende
- **Phase** : **A** = démonstrateur (données fictives) ; **B** = MVP (feu vert B écrit, données réelles) ; **C** = après stabilisation ou hors MVP sans demande validée.
- **Lot** : lot de `03_LOTS_DEV.md`. **Source** : WF = cartographie ; D = décisions ; V4 = modules existants ; V0.4 = présentation.
- Rôles : **Cl** cliente (direction / administratrice), **DR**, **CVR**, **RS**, **Ag-op** agence opérateur, **Ag-adm** agence administrateur, **Adm** administrateur plateforme. L'intervenant n'a pas de compte (D42).

## 3. Catalogue des fonctions

### M0 · Accueil et transverse
| ID | Fonction | Rôles | Phase / lot | Source |
|---|---|---|---|---|
| F-00.1 | **Actions à traiter** : ce qui attend mon action, classé par échéance, avec lien direct, responsable et statut | Tous | A / A4 | Cadrage, V0.4 |
| F-00.2 | Bandeau de **fraîcheur et de statut des données** (fictif / réel / partiel, date de dernière charge) | Tous | A / A1 | Cadrage |
| F-00.3 | Bascule **FR / EN** sans chaîne en dur ; choix de la langue des exports | Tous | A / A1 | D27, V4 |
| F-00.4 | Recherche globale et raccourcis clavier (Ctrl+K) | Tous | A / A4 | V4 |
| F-00.5 | Mode compact, plein écran, zoom sans perte sur cartes et graphiques | Tous | A / A4 | V4 |

### M1 · Pilotage (lecture analytique)
| ID | Fonction | Rôles | Phase / lot | Source |
|---|---|---|---|---|
| F-10.1 | **Synthèse** : quota → consommé → prévisionnel → restant, situation budgétaire en texte + écart | Cl, DR, CVR, Ag | A / A4 | V4, WF-A2 |
| F-10.2 | Atterrissage par campagne et fin de mois | Cl, DR, CVR, Ag | A fictif, B réel / A4, B6 | WF-A4 |
| F-10.3 | Feux budgétaires paramétrables (dépassement, vigilance, sous-consommation) | Cl, DR, CVR, Ag | A / A4 | WF-A3, V4 |
| F-10.4 | Activité : prévu vs réalisé par DR, classement des CVR, carte de chaleur CVR × mois | Cl, DR, Ag | A / A4 | V4 |
| F-10.5 | Classement des **secteurs** (pas des personnes) ; top / flop | Cl, DR, CVR, Ag | A / A4 | WF-A5, V0.4 |
| F-10.6 | **Carte de France** : retour « France entière », fil d'Ariane, Échap, groupe « Non géolocalisé », département → magasins et enseignes | Cl, DR, CVR, Ag | A / A4 | V4 |
| F-10.7 | Territoires : DR › CVR › RS › magasins avec mutations datées | DR, CVR, Ag | A / A1 | WF-D3 |
| F-10.8 | **Explorateur** : lignes détaillées, tri, filtre, pagination, en-têtes fixes | Selon droits | A / A4 | V4 |
| F-10.9 | Filtres combinés (DR, CVR multiples, RS, campagne, période) et **vues enregistrées** | Tous | A / A4 | V0.4 |
| F-10.10 | **Explication d'un indicateur** : définition, formule, période, périmètre, unité, source, date, clic vers les lignes | Tous | A / A4 | Cadrage |
| F-10.11 | Permanent et saisonnier : planning annuel, heures par mois, facturation prévue, secteurs non couverts | Cl, Ag | A fictif, B réel / A4 | Suivi Perm / Saisonnier |
| F-10.12 | Carences et couverture : jours, heures non couvertes, valorisation | Ag, Cl (catégories génériques) | A / A5 | WF-A8 |
| F-10.13 | **Fiche secteur unique** : besoins, propositions, absences, consommation, alertes, historique, actions | Cl, DR, CVR, RS, Ag (selon droits) | A / A4d | Piste L6, doc 28 |
| F-10.14 | **Comparaison semaine N / N-1** des heures, montants fictifs et dépassements ; « Non comparable » si N-1 absente | Cl, DR, CVR, Ag | A / A4a | Piste L5, doc 28 |
| F-10.15 | **Plans d'action sur dépassement** : responsable, action, échéance, statut, rattachés à une alerte | CVR, DR, Ag (Cl en lecture) | A / A4d | Piste R6, doc 28 |

### M2 · Saisie des besoins (RS)
| ID | Fonction | Rôles | Phase / lot | Source |
|---|---|---|---|---|
| F-20.1 | Saisie unitaire ; **magasins limités au secteur du RS** | RS | A / A2 | D44 |
| F-20.2 | **Saisie en lot** (tableau multi-lignes, collage depuis Excel) | RS, CVR | A / A2 | V0.4 |
| F-20.3 | Duplication d'une période ou saison, avec décalage de dates | RS, CVR | A / A2 | WF-B6 |
| F-20.4 | **Brouillon** automatique ; résumé avant soumission ; un besoin incomplet ne se soumet pas | RS | A / A2 | Cadrage |
| F-20.5 | Semaine ISO déduite de la date (2026-S53, 2027-S01) ; 22 cas W1–W22 | Système | A / A2 | WF-B2, B3 |
| F-20.6 | **Doublons** D1–D7 : exact bloquant, autres en alerte, paramétrables | Système | A / A2 | D22, Q7 |
| F-20.7 | Dates limites, urgence, retard de proposition | Système | A / A3 | WF-B8 |
| F-20.8 | **Historique et révisions** : comparaison avant / après ; réexamen des validations touchées | Tous concernés | A / A3 | Cadrage |
| F-20.9 | Fil de commentaires par besoin (remplace les e-mails) | RS, CVR, Ag | C | WF-B7 (V2 dans la présentation) |
| F-20.10 | Import de besoins par Excel (reprise de l'existant) | CVR, Ag | A fictif, B réel / A6, B5 | WF-B5 |
| F-20.11 | Saisie « pour le compte » : auteur de la saisie et personne concernée tracés séparément | RS, CVR, Ag | A / A5 | D42 |

### M3 · Validation managériale, propositions et décisions
| ID | Fonction | Rôles | Phase / lot | Source |
|---|---|---|---|---|
| F-30.1 | **Validation CVR** (dans son enveloppe), refus avec motif | CVR | A / A3 | D45 |
| F-30.2 | **Escalade DR** : hors enveloppe ou arbitrage entre CVR | DR | A / A3 | D45 |
| F-30.3 | Délégations et suppléants (absence d'un CVR / DR), date d'effet | Cl, Ag-adm | A paramétrable / A3 | D09 (ouvert) |
| F-30.4 | Qualification agence : prise en charge, demande de précision, rejet motivé | Ag-op | A / A3 | Cadrage |
| F-30.5 | **Proposition versionnée** avec écart expliqué au besoin ; coût incomplet marqué comme tel | Ag-op | A / A3 | WF-C |
| F-30.6 | **Décision cliente** : valider, refuser, réviser ; validation en lot avec motif commun ; une nouvelle proposition invalide l'ancienne décision | CVR, DR, Cl | A / A3 | WF-C7 |
| F-30.7 | Affectation et planification (statuts séparés : besoin, proposition, recrutement, exécution) | Ag-op | A / A3 | D11 |
| F-30.8 | **Prise de poste** et **remise du véhicule** : deux événements distincts | Ag-op, RS | A / A3 | D11 |
| F-30.9 | Clôture hebdomadaire guidée (checklist alimentée par les contrôles) ; réouverture par l'agence seule | Ag | A / A4 | WF-C8 |
| F-30.10 | **Paramètres par dispositif** (durée minimale, forfait kilométrique, fenêtre de saisie, délai de modification, rôles de saisie), modifiables par l'agence, jamais en dur | Ag-adm | A / A2b | Piste A10, doc 28 |
| F-30.11 | **Règles P1 à P6** de validation par dispositif ; une campagne rattachée à un seul dispositif | Système | A / A2b | Workshop 2027, doc 28 |

### M4 · Terrain et absences
| ID | Fonction | Rôles | Phase / lot | Source |
|---|---|---|---|---|
| F-40.1 | Missions du jour (par RS / CVR) | RS, CVR | A / A5 | D14 |
| F-40.2 | Saisie du réalisé **par mission / site et par jour**, validation avant prise en compte | RS, CVR, Ag | A / A5 | D14, D42 |
| F-40.3 | États **à synchroniser / synchronisé / conflit** (simulés au démonstrateur ; réels selon D14 / D15) | Tous | A / A5, B7 | Cadrage |
| F-40.4 | Signalement d'**absence** en catégories génériques (jamais de motif médical côté cliente) ; remplacement ; heures non couvertes | RS, Ag | A / A5 | V0.4, WF-A8 |
| F-40.5 | KPI absences : jours d'absence, jours sans couverture, taux de couverture, délai de remplacement | Ag, Cl | A / A5 | V0.4 |

### M5 · Budget et enveloppes
| ID | Fonction | Rôles | Phase / lot | Source |
|---|---|---|---|---|
| F-50.1 | **Enveloppes** National › DR › CVR, **datées et versionnées** (quota affecté, dépensé, restant, prévisionnel) | Cl, Ag-adm | A fictif, B réel / A4, B6 | Fichiers TBB |
| F-50.2 | **Réallocation et ajustement** avec propagation de visibilité (§5) | Cl, Ag-adm | A / A4 | D46 |
| F-50.3 | Rallonges avec historique | Cl, Ag-adm | B / B6 | WF-A1 |
| F-50.4 | Réalimentation du quota par jours de carence valorisés | Ag-adm | B / B6 | Fichiers TBB |
| F-50.5 | Chiffrage d'une ligne (heures × semaines × taux + formation), taux datés | Ag-op | B / B6 | WF-C4 (tarifs réels D06 ouvert) |
| F-50.6 | **Couverture de calcul** (numérateur / dénominateur) ; « Non chiffré », « Budget non renseigné » | Tous | A / A4 | Cadrage |
| F-50.7 | Rapprochement activité / facturation | Ag, Cl | C | WF-A9 (hors MVP) |

## 4. Indicateurs (catalogue)

Chaque indicateur affiche : période, périmètre, unité, définition, source, date de calcul, statut des données (F-10.10). **Aucune formule n'est figée tant que D05 à D07 sont ouverts.**

| Famille | Indicateur | Définition de travail | Statut |
|---|---|---|---|
| Budget | Quota affecté, dépensé, restant | Restant = affecté − dépensé | Reprise des fichiers TBB |
| Budget | Dépenses prévisionnelles ; solde | Solde = affecté − dépensé − prévisionnel | idem |
| Budget | % consommé ; % consommé + prévisionnel | Rapports au quota affecté | idem ; seuils à valider |
| Budget | Atterrissage | Consommé retenu + prévisionnel restant | Convention à écrire (D05) |
| Budget | Disponible | Budget comparable − atterrissage ; « Budget non renseigné » si absent | D07 |
| Qualité | Couverture de calcul | Lignes ou heures chiffrables / total | A |
| Besoins | Besoins par statut et par âge | Comptage par statut distinct | A |
| Besoins | Délai de proposition ; retard | Date de soumission → proposition ; écart à l'échéance | Délais cibles à fixer |
| Besoins | Taux de décision cliente | Décisions / propositions ; délai de décision | A |
| Activité | Heures planifiées / travaillées ; magasins activés ; intervenants actifs | Selon import du réalisé | V4 |
| Activité | Écart prévu / réalisé | Par DR, CVR, secteur | V4 |
| Terrain | Taux de couverture ; jours sans couverture ; délai de remplacement | Définitions V0.4 | A |
| Carences | Jours, heures non couvertes, valorisation | Coût jour × jours | B |
| Données | Fraîcheur des sources ; lignes en quarantaine ; magasins sans RS | Selon contrôles | A |
| Classement | Secteurs par taux de dépassement et par écart | **Secteurs, pas personnes** | A ; visibilité cliente à confirmer (WF-A5) |
Non arrêtés : les KPI 2027 (WF-D4). Question à la cliente : lesquels en priorité ?

## 5. Réallocation budgétaire et visibilité (D46)

Principe décidé : la cliente et l'agence réallouent ou ajustent dans leurs paramètres ; **le changement se répercute dans la visibilité des autres espaces**.

### Règles proposées
| Règle | Détail |
|---|---|
| Droit | Cl (administratrice) et Ag-adm peuvent réallouer ; ni le CVR, ni le DR, ni le RS |
| Mode de validation | Paramètre : **simple** (l'un décide, l'autre est notifié) ou **double** (l'un propose, l'autre valide). **Défaut proposé : double**, à confirmer car votre message dit « peut décider » |
| Objet | Une réallocation = déplacer un montant (ou des heures) d'une enveloppe à une autre, ou ajuster une enveloppe ; motif obligatoire, **date d'effet**, version |
| Historique | Jamais de réécriture : l'ancien état reste consultable ; la consommation passée garde sa référence d'origine |
| Contrôle | Interdit si cela rend une enveloppe négative par rapport au consommé ; alerte si un besoin déjà validé dépasse la nouvelle enveloppe |
| Propagation | Recalcul immédiat des jauges, alertes et classements des enveloppes touchées |
| Notification | Aux responsables impactés (CVR, DR), avec lien vers la version et le motif |

### Matrice de visibilité après réallocation (proposition, à valider avec D08)
| Rôle | Voit |
|---|---|
| RS | Le statut de **son** secteur (« dans l'enveloppe », « enveloppe modifiée le … ») ; **pas** les montants des autres secteurs |
| CVR | Son enveloppe (ancienne et nouvelle), les besoins de ses RS touchés |
| DR | Les enveloppes de ses CVR et les mouvements entre eux |
| Cl | Tous les mouvements ; classement des secteurs selon décision |
| Ag-op | Les enveloppes pour proposer ; pas les paramètres de réallocation |
| Ag-adm | Tous, avec journal |
Les montants affichés aux RS dépendent de **D08** (visibilité des coûts), toujours ouvert : par défaut « Non communiqué ».

## 6. Alertes et notifications

Base : tableau du dossier de cadrage (15 événements), toutes valeurs de délai à arbitrer. Chaque alerte : objet, gravité, propriétaire, échéance, lien, statut, règle de clôture, **déduplication, digest, horaires, absence du destinataire, journal de livraison**.

| ID | Événement | Gravité proposée | Destinataire | Phase |
|---|---|---|---|---|
| F-60.1 | Import invalide / rapprochement ambigu | Bloquant | Référent data | A / B |
| F-60.2 | Besoin soumis non pris en charge | À suivre | Ag-op, puis suppléant | A |
| F-60.3 | Besoin en attente de validation CVR / DR | À suivre | CVR / DR | A |
| F-60.4 | Proposition en attente de décision | À suivre | Valideur cliente | A |
| F-60.5 | Démarrage proche sans affectation | Critique métier | Agence + responsable terrain | A |
| F-60.6 | Réalisé non soumis / rejeté | À suivre / Action requise | Auteur | A |
| F-60.7 | Affectation chevauchante | Bloquant ou critique | Planification | A |
| F-60.8 | Estimation partielle / budget non renseigné | Avertissement | Gestionnaire financier | A |
| F-60.9 | Dépassement prévisionnel | Arbitrage | Gestionnaire budget + valideur | A |
| F-60.10 | **Réallocation effectuée / enveloppe modifiée** | Information | CVR, DR impactés | A |
| F-60.11 | **Besoin validé dépassant la nouvelle enveloppe** | Arbitrage | CVR, DR | A |
| F-60.12 | Source vieillissante | Avertissement | Propriétaire de la source | B |
| F-60.13 | Échec de synchronisation terrain | Visible dans la fiche | Auteur, support | B7 |
| F-60.14 | Échec de sauvegarde / de restauration de test | Critique technique | Exploitant | B9 |
| F-60.15 | Accès anormal / export inhabituel | Sécurité | Administrateur sécurité | B |
Canaux : dans l'application (A) ; e-mail avec lien privé (B) ; push sur PWA (C, selon D32). **Le contenu d'une notification ne contient aucun champ interdit.** Une alerte lue n'est pas une approbation.

## 7. Paramètres

Tout paramètre est **daté, versionné, tracé** (qui, quand, avant / après), sans effet rétroactif silencieux. Les valeurs réelles sont décidées par la cliente et l'agence ; le démonstrateur utilise des valeurs fictives étiquetées.

| Groupe | Paramètres | Qui modifie | Validation |
|---|---|---|---|
| Territoires | Référentiel DR / CVR / RS / magasins, mutations, rattachements, nouveaux magasins à valider | Ag-adm, Cl | Revue humaine, suppression bloquée si rattachements |
| Enveloppes | Enveloppes, réallocations, rallonges, versions | Cl, Ag-adm | Mode simple ou double (§5) |
| Seuils | Feux budgétaires, retards, couverture, délais d'alerte | Ag-adm, Cl | Par campagne |
| Règles de saisie | Bloquant / alerte pour chaque règle D1–D7, W1–W22 ; horizon maximal de saisie | Ag-adm | Version datée |
| Calendrier | Semaine de référence (ISO), jours ouvrés, clôtures hebdomadaires et mensuelles | Ag-adm | — |
| Tarifs et chiffrage | Taux datés, véhicule oui / non, formation (réel après D06) | Ag-adm | Valideur désigné |
| Statuts | Libellés FR / EN, table de correspondance des anciens statuts | Ag-adm | Validée avec la cliente |
| Validations | Chaîne RS › CVR › DR, délégations, suppléants, délais | Cl, Ag-adm | RACI (D09) |
| Notifications | Destinataires, digest, horaires, escalade | Ag-adm | — |
| Exports | Modèles par rôle, colonnes autorisées, colonnes sensibles | Ag-adm | Habilitation D08 |
| Imports | Contrats de fichier, versions, seuils de rejet | Ag-adm | Version du contrat |
| Affichage | Langue par défaut, formats, logos (après D25) | Ag-adm | — |
| Conservation | Durées par catégorie, purge (D18 ouvert) | Cl, Ag, DPO | Écrit |
| Sécurité | Durées de lien, session, verrouillage (D36) | Adm | IT |

## 8. Automatisations (déterministes d'abord)

Toutes : règle écrite, testée, journalisée, **validation humaine tant que non décidé autrement**, arrêt d'urgence, reprise après échec (voir complément 12). Aucune n'utilise de modèle de langage au démonstrateur.

| ID | Automatisation | Déclencheur | Validation | Phase |
|---|---|---|---|---|
| F-90.1 | Contrôles à l'import (structure, colonnes, formules, dates, version du contrat, doublons) | Dépôt d'un fichier | Aperçu avant écriture | A / A6 |
| F-90.2 | Détection d'anomalies (doublons, chevauchements, semaine clôturée, magasins sans RS) | Saisie, import | Alerte, jamais de correction muette | A |
| F-90.3 | Relances par gabarit FR / EN (besoin sans décision, réalisé non soumis) | Échéance dépassée | **File « à envoyer » validée par l'agence** | B |
| F-90.4 | Génération des rapports planifiés (§9) | Calendrier | Relecture avant envoi externe | B |
| F-90.5 | Recalcul des indicateurs et des enveloppes après réallocation ou import | Événement | Automatique, tracé | A |
| F-90.6 | Sauvegardes et test de restauration | Calendrier | Alerte à l'échec | B9 |
| F-90.7 | Supervision (erreurs, disponibilité, synchronisations échouées) | Seuils | Alerte exploitant | B |
| F-90.8 | Synthèse rédigée par modèle de langage sur données agrégées | Demande | Brouillon relu | C (D40) |
Non retenu : envoi autonome, décision ou affectation automatiques.

## 9. Reporting

| ID | Rapport | Destinataires | Format | Phase |
|---|---|---|---|---|
| F-70.1 | **Rapport hebdomadaire** : besoins, propositions, décisions, retards, alertes ouvertes | Cl, Ag | Écran, PDF | A écran, B envoi |
| F-70.2 | Point COPIL : synthèse, atterrissage, points d'attention | Cl, Ag | Écran, PDF | A / A4 |
| F-70.3 | **Publication pour la cliente** : vue épurée, intervenants anonymisés, langue au choix (FR / EN) | Cl | HTML autonome, PDF, Excel | A / A4 |
| F-70.4 | Rapport par DR / CVR : enveloppe, consommé, besoins en cours | DR, CVR | Écran, PDF | B |
| F-70.5 | Journal des réallocations et des modifications de paramètres | Cl, Ag-adm | Écran, Excel | A |
| F-70.6 | Schéma stable pour un outil de BI externe (Power BI de la cliente) | Cl | Connexion à décider (Q11) | C |
Chaque rapport porte sa période, son périmètre, la date de calcul et le **statut des données** ; les chiffres du démonstrateur portent « Démo ».

## 10. Imports

| ID | Import | Source (fichier) | Contrat | Règle | Phase |
|---|---|---|---|---|---|
| F-80.1 | Besoins (reprise de l'existant) | Fichier d'échange des besoins | Contrat commun (empreinte, version, provenance fichier / onglet / ligne) | Quarantaine ; jamais d'écrasement ; idempotent | A fictif / A6 ; B5 |
| F-80.2 | Budgets et consommations | Fichier de suivi budgétaire (TBB) | Contrat TBB | Versionnés ; aperçu avant écriture | B5 |
| F-80.3 | Activité réelle | Export opérationnel LOGA | **Contrat d'export à obtenir** ; accès API non supposé | Aperçu, rapprochement magasin / RS | B5 (D24) |
| F-80.4 | Permanent, saisonnier, carences | Fichier de suivi permanent / saisonnier | Contrat dédié | Statuts, dates ISO, secteurs | B5 |
| F-80.5 | Référentiel (découpe, listing magasins) | Fichiers de sectorisation | Contrat dédié | Écarts de codes DR à résoudre (D24) ; nouveaux magasins à valider | B3 |
| F-80.6 | Retour de la cliente (ajustements) | Fichier d'échange | Contrat commun | Un retour cliente ne modifie jamais un coût agence | A6 |
Règles communes : lecture sans macro ni lien externe ; taille et format limités ; journal d'import ; ligne rejetée avec cause et action ; **un import agence ne modifie jamais une décision cliente**. Fréquence réelle des dépôts : à confirmer (WF-E1). SharePoint : option ultérieure (D21).

## 11. Exports

Liste des exports **officiels** non établie dans les documents (la cartographie y renvoie sans la fournir) : à constituer avec la cliente. Proposition de départ :

| ID | Export | Rôles | Règle | Phase |
|---|---|---|---|---|
| F-85.1 | Liste filtrée (besoins, propositions, réalisé) au format Excel, colonnes cochées | Selon droits | Colonnes sensibles **décochées par défaut** ; mêmes droits que l'écran, appliqués côté serveur | A / A4 |
| F-85.2 | Réponse de l'agence à la cliente (fichier d'échange) | Ag-op | Registre des transmissions ; nom de fichier normalisé | A6 |
| F-85.3 | Rapports (§9) en PDF / HTML / Excel | Selon rapport | Langue au choix | A / A4 |
| F-85.4 | Journal d'audit | Ag-adm, DPO | Accès tracé | B |
| F-85.5 | Données de la plateforme pour la BI | Cl | À décider (Q11) | C |
Règles : un export hors périmètre ne renvoie rien ; **tout export de données personnelles est tracé** ; un export contenant des données personnelles ou confidentielles est étiqueté ainsi ; modèles enregistrés par rôle.

## 12. Administration, qualité et audit

| ID | Fonction | Rôles | Phase / lot |
|---|---|---|---|
| F-95.1 | Gestion des comptes, rôles, périmètres (IdP agence, doc. 14) ; revue périodique | Adm, Ag-adm | A simulé / B1 |
| F-95.2 | **Qualité des données** : 7 familles de contrôles V4 (magasins sans RS, campagnes non paramétrées, hors périmètre, CP invalides ou doublons, modification rétroactive de mois clos, bascule du pont, contrôles avant envoi) | Ag | A / A4 |
| F-95.3 | Quarantaine et correction des lignes en erreur | Ag | A / A6 |
| F-95.4 | **Journal d'audit** (qui, quoi, quand, avant / après, motif) | Ag-adm, DPO | A / A1 |
| F-95.5 | Sauvegarde, restauration, journal d'exploitation | Adm | B9 |
| F-95.6 | Gestion de la conservation et de la purge | Ag-adm, DPO | B (D18) |
| F-95.7 | Demandes de droits (accès, rectification, effacement) | DPO, Ag-adm | B (Q9) |

## 13. Ce qui est déjà couvert, ce qui manque

| Existant vérifié | Ce qui manque dans les documents |
|---|---|
| Workflows WF-A1 à WF-E7 ; D01–D28 ; lots A0–B9 ; règles W / D ; alertes (15) ; modules V4 (écrans, règles de calcul, comptes rendus) | Catalogue des **exports officiels** ; liste des **KPI 2027** ; contrat d'export LOGA ; **règle de modification d'enveloppe** (ici proposée) ; **RACI** et suppléants (D09) ; sens de la colonne « AC » ; source maître de la sectorisation (D24) ; seuils et délais réels ; quotas permanent / saisonnier (D22 / Q6) ; durées de conservation (D18) |

## 14. Conséquences sur les lots
- **A1** : ajouter F-00.x, profil « RS » (et non plus « intervenant »), emplacements de logos vides.
- **A2** : F-20.1 limité au secteur du RS ; saisie « pour le compte ».
- **A3** : validation CVR / DR (F-30.1, 30.2), délégations paramétrables.
- **A4** : **ajout de F-50.2** (réallocation et propagation) et des alertes F-60.10 / 60.11.
- **A5** : le terrain devient une saisie par RS / CVR / agence (D42) ; plus de parcours intervenant.
- **A6** : imports F-80.1 et 80.6 sur fichiers fictifs.
Le lot A4 devient plus lourd : **à scinder** (A4a lecture et indicateurs, A4b enveloppes et réallocation). Aucune durée estimée ici.

## 15. Arbitrages nécessaires (liste courte)
1. **T. SOEFOU :** valider ce catalogue comme base des lots (ou retirer / déplacer des fonctions entre A, B, C) ; confirmer le mode **simple ou double** pour la réallocation ; confirmer la couleur Marvesting de référence ; scinder A4.
2. **Cliente :** liste des exports officiels et KPI prioritaires ; visibilité des montants pour les RS et CVR (D08) ; seuils ; classement des secteurs visible ou non.
3. **Impact :** logo Suntory officiel ; réponses sur l'IdP ; fréquence des dépôts de fichiers ; contrat d'export LOGA.
4. **Référents data :** source maître de la sectorisation et codes DR (D24).

## 16. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, T. SOEFOU confirme pour Suntory : usage des logos ; workflow RS › CVR › DR › agence › cliente ; réallocation budgétaire possible par la cliente et l'agence avec répercussion de visibilité dans les autres espaces ; accord sur les agents. Le catalogue fonctionnel V0.1 (12 modules) est proposé comme base de cadrage ; il n'est pas validé. Restent ouverts : mode de validation de la réallocation, exports officiels, KPI 2027, seuils réels, D08.
