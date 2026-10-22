# SUNTORY REFONTE V3 · Jeux d'essai et recette du démonstrateur

Version de travail du 22/10/2026. Toutes les données ci-dessous sont **fictives** : aucun nom, magasin, code ou montant réel. Les valeurs servent à provoquer des cas, pas à représenter la réalité.

## 1. Jeu de données fictif (`docs/FIXTURES.md`)

| Entité | Volume proposé | Remarque |
|---|---|---|
| DR | 3 (F1, F2, F3) | Libellés fictifs |
| CVR | 6 | Au moins un DR avec trois CVR pour tester la sélection multiple |
| RS | 12 | Dont un secteur sans besoin |
| Magasins | 40 | Dont 3 sans rattachement et 2 sans géolocalisation |
| Besoins | 25 | Cas du tableau 2 |
| Propositions | 10 | Dont une révisée après accord |
| Absences | 6 | Catégories génériques uniquement |
| Utilisateurs de démo | 7 | Tableau 3 |

Règles : codes en texte ; périodes en dates ISO ; semaines avec année ISO ; montants fictifs affichés « Démo » ; aucun nom de personne réel, remplaçants et intervenants désignés par une référence (ex. `INT-001`).

## 2. Cas de test des besoins

| Cas | Ce qu'il provoque |
|---|---|
| Doublon exact | D1 bloquant |
| Chevauchement partiel, inclusion, contiguïté | D2, D3, D4 |
| Même magasin, deux secteurs | D5 |
| Besoin début 28/12/2026 | Semaine 2026-S53 |
| Besoin début 04/01/2027 | Semaine 2027-S01 |
| P2 qui commence avant la fin de P1 | W18 bloquant |
| Besoin sans date ni semaine | W9 : brouillon « à compléter », exclu des totaux |
| Besoin sur semaine clôturée | W12 : refus, réouverture par l'agence seule |
| Format de semaine « S5 », « 5 », « W05 » | W13 : normalisation |
| Besoin saisonnier hors fenêtre de campagne | W21 : alerte |
| Besoin avec coût inconnu | « Non chiffré », jamais 0 |
| Magasin sans code RS | Quarantaine / « actions à traiter » |

Les tests des règles (W1 à W22, D1 à D7) sont écrits **table par table** à partir de la présentation V0.2 ; les cas « à arbitrer » sont paramétrables.

## 3. Profils de démo et visibilité attendue

| Profil | Voit | Ne voit jamais |
|---|---|---|
| Direction cliente | Synthèse de son périmètre | Coûts internes agence, données personnelles non nécessaires |
| DR cliente | Son DR | Autres DR |
| CVR cliente | Son CVR | Coûts, sauf habilitation (D08 ouvert : le démonstrateur affiche « Non communiqué » par défaut) |
| RS / demandeur | Son secteur | Budgets nationaux |
| Intervenant terrain | Ses missions | Budgets, autres intervenants |
| Agence (opérateur) | Besoins et ressources de la mission | Droits d'administration |
| Agence (administrateur) | Périmètre de la mission, paramètres | Données de l'organisation cliente hors mission |

Test attendu : un appel à la couche de données avec le profil A ne retourne aucune ligne hors de son périmètre, même si l'écran ne l'affiche pas.

## 4. Fichiers Excel fictifs pour le lot A6

| Fichier | Contenu |
|---|---|
| `import_ok.xlsx` | 20 lignes valides, contrat à jour |
| `import_erreurs.xlsx` | Date ambiguë, code inconnu, fin avant début, colonne manquante, colonne inconnue, formule dans un champ texte, ligne dupliquée |
| `import_ancien.xlsx` | Retour basé sur une version obsolète d'un besoin modifié entre-temps |

Chaque fichier a une feuille de métadonnées (version du contrat, empreinte attendue, date d'observation). Générés par un script versionné du dépôt, jamais copiés d'un classeur réel.

## 5. Parcours de recette

| Parcours | Résultat attendu |
|---|---|
| Besoin → proposition → décision → affectation → terrain | Chaque profil fait son action ; historique visible |
| Refus, puis nouvelle proposition | La décision précédente est invalidée, pas conservée |
| Modification après accord | Réexamen déclenché, comparaison avant / après |
| Import du même lot deux fois | Aucun doublon, résultat d'idempotence affiché |
| Retour Excel obsolète | Conflit détecté, aucun écrasement |
| Coût manquant | « Non chiffré », couverture visible |
| Magasin non géolocalisé | Compté dans « Non géolocalisé » ; total national explicable |
| Accès hors périmètre | Aucune donnée retournée |
| Période clôturée | Modification refusée avec message explicite |
| Saisie terrain hors réseau (simulée) | « À synchroniser » puis « Synchronisé » ; pas de perte |
| Mobile | Parcours terrain testé en largeur mobile, clavier et lecteur d'écran sur les formulaires |
| Langue | Même parcours en français puis en anglais : aucun libellé manquant ni en dur, codes métier identiques |
| Statuts | Prise de poste et remise du véhicule enregistrées séparément ; un recrutement finalisé n'implique pas un poste démarré |

## 6. Script de démonstration pour la cliente (lot A7)

1. Contexte en 2 minutes : problème de saisie ligne à ligne, risque de doublons et d'erreurs de semaine.
2. Saisie en lot avec alerte de doublon et correction de semaine.
3. Proposition de l'agence et décision de la cliente.
4. Tableau de bord, couleurs de quota, classement des secteurs.
5. Vue RS mobile et signalement d'absence.
6. Import Excel en quarantaine (le pont temporaire).
7. Décisions que la démonstration doit provoquer : visibilité des coûts, quotas permanent et saisonnier, règle de doublon, semaine de référence, terrain, hébergement.

Aucun chiffre de la démonstration n'est présenté comme réel.

## 7. Critères de fin de l'étape A
- Toutes les suites passent, ou les écarts sont expliqués.
- Aucune donnée réelle dans le dépôt (contrôle de balayage sur noms, codes et montants des classeurs sources).
- Aucun appel réseau sortant observé pendant les parcours.
- Compte rendu de chaque lot présent dans `docs/`.
- Liste des décisions à obtenir de la cliente, avec décideur attendu.
