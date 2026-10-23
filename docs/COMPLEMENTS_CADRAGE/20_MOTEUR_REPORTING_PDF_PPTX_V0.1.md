# SUNTORY REFONTE V3 · Moteur de reporting PDF et PPTX V0.1 (COPIL)

Version de travail du 22/10/2026 · Suntory uniquement · **Proposition du prestataire** ; seules les demandes du §1 sont de T. SOEFOU.
Sources : modèle `Guide_ISM & Marvesting_Template.pptx` (structure mesurée, aucun contenu repris), `design_system_marvesting.md`, guides PPTX V4 déjà produits (recette du 20/10), doc 16 (F-70, F-90), doc 19 §6. **Non lu :** un COPIL réel passé (aucun n'est dans le dossier), les droits d'usage du modèle, la charte d'impression d'Impact.

## 1. Demande reçue (T. SOEFOU, 22/10/2026)
| N° | Demande | Statut |
|---|---|---|
| D58 | Moteur d'export **PDF** et **PPTX** (si possible) pour les présentations COPIL, **basé sur le modèle PPTX Marvesting** | Demandée ; faisabilité démontrée (§2) |
| D59 | Livrables en **paysage**, optimisés, avec **graphiques sélectionnables selon indicateurs et périmètres** | Demandée |
| D60 | **Workflow d'automatisation du reporting selon les boucles métiers** ; la présentation doit **éviter de faire 80 % du travail administratif** | Demandée ; l'objectif de 80 % est à mesurer (§7) |

## 2. Faisabilité : constats et prototype
| Constat | Détail |
|---|---|
| **Le modèle est un guide de marque, pas un gabarit** | 53 diapositives d'exemple au format 16:9 (13,33 × 7,5 po), **11 masques**, des mises en page nommées en espagnol, anglais et français, **aucun graphique natif**, textes d'exemple. Les couleurs de thème lues dans le fichier sont celles d'Office par défaut : la palette Marvesting est portée par les formes, pas par le thème |
| **Conséquence** | On ne génère pas directement dans le modèle. On en dérive un **gabarit COPIL Marvesting** (8 à 10 mises en page propres, couleurs de thème = tokens de marque : `#E52365`, `#08071E`, `#1A1950`, `#1B1C88`, `#F1EFEA`, `#FFC2D5`). À produire et faire valider |
| **Polices** | Le modèle déclare « Mont » (titres) ; son usage et son incorporation sont à vérifier (licence). Le prototype utilise Inter (licence libre) |
| **Prototype réalisé** | `PROTOTYPE_COPIL/SUNTORY_COPIL_PROTOTYPE_DEMO.pptx` et `.pdf` : 4 diapositives paysage, **3 graphiques natifs modifiables dans PowerPoint**, titres-conclusions, textes alternatifs, notes de présentation, étiquette « DÉMO », conversion en PDF vérifiée visuellement. **Données fictives** |
| **Réutilisable** | Les guides PPTX V4 (20/10) ont déjà appliqué : texte alternatif sur chaque capture, note par diapositive, rendu vérifié, anonymisation, absence de requête réseau |
| **Limite connue** | Les tailles du gabarit V3.12 étaient sous 14 pt « par fidélité au design » (recette). Ici : corps ≥ 14 pt, étiquettes de graphique ≥ 12 pt |

Réponse à « si possible » : **oui pour le PPTX et le PDF**. Le PDF se déduit du PPTX (même rendu). Le prototype n'a pas été testé dans PowerPoint ni dans Keynote : à vérifier.

## 3. Architecture du moteur
```
Spécification de rapport (modèle, périmètre, période, indicateurs, graphiques, langue, destinataires)
   → collecte côté serveur (droits appliqués avant tout calcul)
   → contrôles bloquants (couverture de calcul, données périmées, tarifs manquants)
   → calcul déterministe des indicateurs et des écarts
   → composition des diapositives depuis le catalogue (§4)
   → rendu PPTX (graphiques natifs) + PDF
   → relecture humaine (brouillon, commentaires)
   → validation, publication, archivage, journal
```
- **Reproductible :** mêmes paramètres et mêmes données → même fichier (empreinte des données et version du modèle inscrites dans le fichier).
- **Un seul chemin de données** que les écrans : aucun chiffre calculé à part pour le rapport.
- **Aucun modèle de langage au démonstrateur.** Les titres et commentaires sont des **règles** (modèles de phrases + seuils paramétrables). Une synthèse rédigée par un modèle de langage reste une option ultérieure, sur données agrégées et avec relecture (D40).
- **Choix techniques à confirmer au lot :** bibliothèque PPTX (python-pptx utilisé pour le prototype), conversion PDF (LibreOffice sans interface), contrôle visuel automatique (captures de contrôle).

## 4. Catalogue de diapositives COPIL (paysage 16:9)
Une diapositive = **un message**, un titre qui énonce la conclusion, un graphique principal, au plus 6 éléments.

| # | Diapositive | Contenu | Graphique par défaut | Alternatives autorisées |
|---|---|---|---|---|
| 1 | Couverture | Titre, période, statut des données, signature | — | — |
| 2 | Synthèse | 4 à 6 chiffres clés, « à retenir » | Barres horizontales quota / consommé / prévisionnel / restant | Jauge de progression |
| 3 | Budget par périmètre | Enveloppe, consommé, prévisionnel, restant par DR ou CVR | Barres horizontales classées | Barres empilées |
| 4 | Évolution mensuelle | Consommé puis prévisionnel | Colonnes empilées | Courbe |
| 5 | Atterrissage | Fin de mois et fin d'année, écart au budget | Barres + ligne de budget | — |
| 6 | Besoins | Entonnoir par statut, âge, délais | Barres horizontales ordonnées par statut | Barres empilées par période |
| 7 | Couverture et non-couverture | Jours, heures non couvertes, remplacement | Barres + tableau | Courbe |
| 8 | Carte de France | Indicateur au choix par département | Carte (image vectorielle) | Tableau par région |
| 9 | Réallocations du mois | Mouvements d'enveloppe, motifs | Tableau + flèches | — |
| 10 | Qualité des données | Anomalies ouvertes, bloquantes, sources vieillissantes | Barres | Tableau |
| 11 | **Décisions à prendre** | Alertes « arbitrage » et contrôles bloquants | Liste | — |
| 12 | **Suivi du COPIL précédent** | Actions décidées, statut, échéance | Tableau | — |
| 13 | Annexes | Tableaux détaillés par périmètre | Tableau | — |

### Règles de choix du graphique (par type d'indicateur)
| Type d'indicateur | Graphique par défaut | À éviter |
|---|---|---|
| Évolution dans le temps | Colonnes ou courbe | Camembert |
| Comparaison de périmètres | Barres horizontales classées | Plus de 12 barres sans regroupement |
| Statut ou cycle de vie | Barres ordonnées (entonnoir) | Couleur seule pour porter le sens |
| Part d'un total (≤ 5 catégories) | Barres empilées à 100 % ou anneau | Camembert 3D |
| Budget contre seuil | Barres avec trait de seuil | Jauge sans valeur lisible |
| Géographie | Carte, avec tableau alternatif | Carte seule |
Couleurs : bleu `#1B1C88` pour les valeurs réelles, rose `#E52365` pour la progression et le prévisionnel ; **le rose ne signifie jamais « erreur »** (règle de la charte mixte). Aucune information portée par la seule couleur.

## 5. Sélection par indicateurs et périmètres
Le constructeur du doc 19 §6 est réutilisé. Pour un rapport, l'utilisateur choisit :
| Choix | Valeurs |
|---|---|
| Modèle | COPIL mensuel, COPIL trimestriel, hebdomadaire, budget, recrutement, qualité, sur mesure |
| Périmètre | National, DR, CVR, RS, département, enseigne (selon les droits) |
| Période | Mois, trimestre, semaine ISO, période libre ; comparaison à la période précédente ou à l'an passé |
| Indicateurs | Cases à cocher par famille (budget, activité, besoins, couverture, qualité) |
| Graphiques | Le moteur propose, l'utilisateur change le type parmi les alternatives autorisées |
| Diapositives | Ordre, activation, regroupement |
| Langue | FR · EN |
| Sortie | PPTX · PDF · les deux |
| Niveau de détail financier | Selon la visibilité des coûts (D08) du destinataire |
Un modèle choisi peut être **enregistré** (par rôle, versionné) et rejoué.

## 6. Boucles métiers et workflow d'automatisation
Principe : le rapport **se prépare tout seul**, **ne part jamais tout seul**.

| Boucle | Déclencheur | Données | Contrôles préalables | Modèle | Destinataires | Validation |
|---|---|---|---|---|---|---|
| **Hebdomadaire** | Clôture de semaine (jour paramétré) | Besoins, propositions, décisions, retards, alertes | Semaine clôturée, imports à jour | Rapport hebdomadaire (2 à 4 diapositives) | Agence, cliente | Agence |
| **Mensuel** | Clôture mensuelle | Budget, consommé, prévisionnel, atterrissage, activité | Couverture de calcul, tarifs complets, écarts rapprochés | COPIL mensuel (10 à 13 diapositives) | Cliente, agence | Agence puis cliente |
| **Trimestriel** | Fin de trimestre | Tendance, réallocations, carences | Idem + historique figé | COPIL trimestriel | Direction cliente | Agence |
| **Budget** | Réallocation validée (D46) | Mouvement, effet sur les enveloppes | Double validation faite | Note d'une page | CVR, DR concernés | Automatique (information) |
| **Recrutement** | Besoin en retard ou démarrage sans affectation | Statuts, délais | — | Point d'avancement | Agence, RS | Agence |
| **Qualité des données** | Import, anomalie bloquante | Anomalies, sources vieillissantes | — | Fiche de qualité | Référent data | Référent data |
| **Absences et couverture** | Fin de semaine ou événement | Jours non couverts, remplacements | Motifs génériques seulement | Diapositive de couverture | Agence, cliente | Agence |

**États d'un rapport :** `Brouillon automatique` → `Contrôles réussis ou échecs` → `À relire` → `Validé` → `Publié` → `Archivé`. Un rapport en échec de contrôle n'est pas publié : la cause et l'action sont indiquées.
**Garde-fous :** file « à envoyer » validée par l'agence (F-90.3), journal de génération (qui, quand, paramètres, empreinte), arrêt d'urgence, reprise après échec, aucun envoi externe sans validation humaine.

## 7. « Éviter 80 % du travail administratif » : ce qui est automatisé
L'objectif de 80 % est une **cible à mesurer**, pas une promesse. Je propose de mesurer le temps de préparation d'un COPIL avant et après sur 2 cycles.

| Tâche administrative actuelle (hypothèse) | Dans la plateforme |
|---|---|
| Collecter les chiffres dans plusieurs fichiers | Collecte unique côté serveur, mêmes données que les écrans |
| Recalculer et recopier dans des diapositives | Calcul déterministe, graphiques natifs générés |
| Rédiger les titres et les « à retenir » | Titres-conclusions et points d'attention par règles |
| Retrouver les décisions à prendre | Liste générée à partir des alertes « arbitrage » et des contrôles bloquants |
| Reprendre les actions du COPIL précédent | Reprise automatique des décisions, statut et échéance |
| Mettre en forme, paginer, anonymiser | Gabarit, pagination, intervenants anonymisés par défaut |
| Contrôler les chiffres | Contrôles bloquants avant génération ; empreinte et statut des données sur chaque page |
| Exporter en PDF et envoyer | PDF généré ; envoi seulement après validation |

**Ce qui reste humain :** le choix du message, le commentaire qualitatif (champ prérempli, modifiable), la validation et la présentation.

## 8. Règles de qualité et de confidentialité
- **Paysage 16:9**, marges constantes, corps ≥ 14 pt, étiquettes ≥ 12 pt, contraste conforme (doc 14), texte alternatif et notes de présentation sur chaque diapositive.
- **Statut des données** (« Démo », « Partiel », « Réel ») et date de calcul sur chaque page ; chiffres fictifs étiquetés « Démo ».
- **Intervenants anonymisés** par défaut ; coûts et taux selon D08 ; aucune donnée personnelle ni motif médical dans un COPIL.
- Un rapport n'affiche que ce que le destinataire a le droit de voir (filtrage côté serveur).
- **Nom de fichier :** `SUNTORY_COPIL_{PERIODE}_{AAAA-MM-JJ}.pptx` / `.pdf` ; version du modèle et empreinte des données dans les propriétés.
- **Signature :** documents externes signés avec le profil FREELANCE (D49). Le **modèle Marvesting** est un actif de l'agence : son usage par le prestataire est à confirmer par écrit avec Impact (comme les logos, D25).

## 9. Impacts sur les lots et le catalogue
| Élément | Proposition |
|---|---|
| Catalogue (doc 16) | Ajouter **F-70.7** moteur PPTX/PDF, **F-70.8** constructeur de graphiques, **F-90.9** boucles de reporting |
| Lots | Nouveau lot **A4c · Reporting COPIL (PPTX et PDF) sur données fictives**, après A4a et A4b ; gabarit COPIL Marvesting en A0b/A1 ; rapports planifiés réels en B |
| Gabarit | Produire le **gabarit COPIL Marvesting** (8 à 10 mises en page) avant A4c |
| Données | Un COPIL réel passé sert de référence de contenu (voir §10) |

## 10. Arbitrages nécessaires
1. **Un COPIL réel passé** (ou son ordre du jour) : quel contenu la cliente attend-elle ? Sans cela le catalogue du §4 reste une hypothèse.
2. **Modèle Marvesting :** autorisation d'Impact pour dériver un gabarit ; police « Mont » disponible ou remplacée ?
3. **Fréquence et destinataires** de chaque boucle (§6) ; qui valide côté agence et côté cliente.
4. **Niveau de détail financier** montré en COPIL (D08).
5. **Objectif des 80 %** : à mesurer sur 2 cycles ; accord sur la méthode.
6. **Validation du prototype** : mise en page, couleurs, densité.

## 11. Mise à jour proposée de mémoire de mission (non enregistrée)
Le 22/10/2026, T. SOEFOU demande pour Suntory un moteur de reporting PDF et PPTX (paysage, basé sur le modèle Marvesting, graphiques sélectionnables par indicateur et périmètre) alimenté par des boucles d'automatisation métiers, visant à supprimer l'essentiel du travail administratif. Un prototype sur données fictives est produit ; gabarit, contenu COPIL réel et droits d'usage du modèle restent à confirmer.
