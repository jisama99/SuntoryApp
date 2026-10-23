# Cadrage des imports configurables et de la jointure de sources · V0.1 du 23/10/2026

Suntory uniquement. Décision : D134 validée par T. SOEFOU le 23/10/2026. Objectif exprimé : **anticiper une extraction de structure différente** et la rapprocher des données de l'application par correspondance de colonnes et par jointures. Ce document ne contient aucune valeur réelle ni donnée de personne : seules des structures et des ordres de grandeur sont décrits.

## 1. Structure observée sur l'export d'un dossier de second placement (analyse locale du 23/10/2026)

Analyse faite hors dépôt, sur les en-têtes, les types, les taux de remplissage et le nombre de valeurs distinctes. Aucune valeur n'a été copiée.

| Constat | Détail | Conséquence pour le moteur |
|---|---|---|
| Un seul onglet, 123 colonnes, environ 4 200 lignes | Une ligne = une mission (un magasin, un intervenant) | Grain « mission », distinct du besoin et de l'affectation (E1) |
| Deux lignes d'en-tête | La ligne 1 porte un **bandeau de groupes** (suivi de quota, validation de paie, variables de paie, régulation de frais, frais de paie, régularisation sur salaire) ; les en-têtes sont en ligne 2 | Détecter la ligne d'en-tête **et** le bandeau de groupes au-dessus |
| En-têtes en double | Plusieurs libellés reviennent 2 à 4 fois (indemnité repas, forfait kilométrique, brut, majoration, département, code postal, ville) | Une colonne se désigne par **groupe + libellé normalisé + rang d'occurrence**, jamais par le libellé seul |
| Deux blocs d'adresse | Adresse du magasin puis adresse de l'intervenant, mêmes libellés | Rattacher chaque colonne à son bloc par la position ; l'adresse de l'intervenant est une donnée de personne |
| Données de personnes | Nom, prénom, téléphone, courriel, adresses, tailles, rémunération | Classement S2 obligatoire ; **exclues par défaut** à l'import ou remplacées par une référence pseudonymisée |
| Colonnes vides | Une trentaine de colonnes vides ou presque (frais, régularisations, jour de dimanche) | Colonne vide = « non utilisée par cette extraction », pas une erreur |
| Types mélangés | Dates Excel, dates en texte français, entiers en texte, codes magasin numériques ou textuels | Chaîne de transformation par colonne ; code Nielsen entier ou texte (préfixe de pseudo-code) |
| Jours de la semaine | Sept colonnes de lundi à dimanche, chacune une date ; dimanche présent mais vide | Cohérent avec D132 : dimanche prévu et désactivé par défaut |
| Statuts de commande | Quatre valeurs correspondant aux statuts LOGA connus | Table de correspondance vers les 9 statuts (N18) |
| Opérations | Deux codes d'opération pour un seul métier horaire (second placement et ponctuel) | Voir Q-I1 : opération = campagne, dispositif à déduire |
| Origine de la demande | Deux origines (LOGA et un autre outil) | Colonne conservée comme provenance |
| Nom de fichier trompeur | Le nom évoque permanent et saisonnier alors que le contenu est horaire | **Détection par contenu, jamais par nom de fichier** |
| Clé de mission | Code mission quasi unique : quelques doublons | Règle de doublon : alerte, jamais écrasement silencieux |

## 2. Moteur de profils d'import

### 2.1 Profil d'import (objet versionné, géré par l'agence administration)
| Élément | Contenu |
|---|---|
| Signature | Empreinte de l'ensemble des colonnes (groupe, libellé normalisé, rang) ; nombre de colonnes ; onglet attendu |
| Localisation | Règle de détection de l'onglet, de la ligne d'en-tête, du bandeau de groupes (surchargeables) |
| Correspondances | Colonne source (groupe, libellé, rang) vers champ cible du dictionnaire, avec chaîne de transformation (retrait des espaces, casse, nombre à virgule, date Excel / texte français / ISO, code à zéros, pseudo-code) |
| Sensibilité | Niveau S0 à S3 de chaque colonne source ; S2 jamais écrite côté cliente ; choix par colonne : exclue ou pseudonymisée |
| Tables de valeurs (N18) | Valeur source vers liste fermée, avec date et auteur de la correspondance |
| Jointures | Voir §2.3 |
| Contrôles | Clé unique, colonnes obligatoires, cohérences (somme, nombre de zones attendu), gravité de chaque règle |
| Version | Numéro, date, auteur ; un import mémorise la version du profil utilisée |

### 2.2 Proposition automatique de correspondances
Pour chaque colonne source, un score explicable est calculé en local :
| Critère | Poids indicatif | Détail |
|---|---|---|
| Similarité du libellé | fort | Libellé normalisé (sans accent, casse, espaces), dictionnaire de synonymes par champ cible, distance d'édition |
| Compatibilité de type | moyen | Type observé (date, entier, décimal, texte, code) contre type attendu |
| Profil de contenu | moyen | Motif des valeurs (code de zone, code magasin, semaine ISO entre 1 et 53), cardinalité, taux de remplissage |
| Contexte de groupe | faible à moyen | Groupe du bandeau, voisinage de colonnes |
Trois niveaux d'affichage : reconnue (proposée cochée), à confirmer, non reconnue. **Chaque proposition affiche pourquoi.** Aucune correspondance n'est appliquée sans validation humaine ; la validation enregistre le profil. Les poids sont indicatifs et se règlent après mesure sur les variantes d'essai (§4).

### 2.3 Jointures
| Type | Exemple de besoin | Règle |
|---|---|---|
| Interne au fichier | Deux blocs d'adresse, deux jeux de colonnes de frais | Le bloc est une dimension du profil (bloc magasin, bloc intervenant, bloc paie) |
| Vers un référentiel | Code magasin vers le référentiel des magasins ; code région vers `ZoneLabel` ; code d'opération vers campagne puis dispositif ; secteur vers secteurs | Clé source, clé cible, normalisation, cardinalité attendue (n vers 1) |
| Entre fichiers | Extraction brute et saisie partagée par code mission ou code besoin ; extraction et classeur de suivi budgétaire | Jointure par clé commune, avec contrôle des écarts |
Pour chaque jointure : **taux de rapprochement** affiché à l'aperçu (lignes rapprochées, non rapprochées, ambiguës). Non rapprochée : au choix, rejetée, mise en attente de rapprochement manuel, ou créée en attente (jamais créée silencieusement). **Détection de clés candidates** : une colonne dont les valeurs recoupent fortement un référentiel est proposée comme clé de jointure, avec le taux de recouvrement.

### 2.4 Dérive de structure (N19)
À chaque import, comparaison à l'empreinte du profil : colonne ajoutée (listée, ignorée), colonne obligatoire absente (blocage), colonne renommée ou déplacée (renommage proposé), nouveau bandeau, nombre de colonnes différent. Alerte d'audience agence (AUT-14). Un fichier de structure inconnue ouvre l'assistant de création de profil.

## 3. Garde-fous
- Traitement 100 % local, déterministe, aucune requête externe ; aucun envoi de valeurs à un service d'IA. Un modèle ne pourrait voir que des **noms d'en-têtes**, jamais de valeurs : non retenu par défaut.
- Un profil contient des en-têtes, des règles et des tables de correspondance non personnelles. Il ne contient aucune valeur de personne.
- Données de personnes (S2) : exclues par défaut, pseudonymisation par clé propre à l'environnement si une référence d'intervenant est indispensable (D17, D18, D130). Jamais de nom, d'adresse, de téléphone ni de courriel côté cliente.
- Les fichiers d'essai sont **générés** : même structure que l'extraction (bandeau, en-têtes en double, 123 colonnes) avec des valeurs fictives. Aucun extrait réel dans le dépôt, les prompts, les journaux ou les captures.
- Un import agence ne modifie jamais une décision cliente (rappel de A6).

## 4. Jeux d'essai et mesure de robustesse
Un générateur produit, à partir du gabarit fictif, des **variantes** : colonnes réordonnées, renommées (synonymes, accents, casse), supprimées, ajoutées, bandeau absent, ligne d'en-tête décalée, doublon d'en-tête, onglet renommé, colonnes vides. Mesures reportées au compte rendu : taux de colonnes reconnues, de jointures rapprochées, nombre de faux positifs. Le seuil d'acceptation est fixé après la première mesure (aucun seuil inventé ici). Test de fiabilité sur extraction réelle : analyse de structure locale par T. SOEFOU, hors dépôt.

## 5. Questions ouvertes
| N° | Question | Hypothèse utilisée |
|---|---|---|
| Q-I1 | Les deux opérations de l'export sont-elles deux campagnes d'un même dispositif horaire, ou l'une relève-t-elle du dispositif second placement ? Le Workshop distingue le merch horaire du second placement (dispositif) | Opération = campagne ; table opération vers dispositif tenue par l'agence |
| Q-I2 | Quel statut fait foi quand l'extraction et la plateforme divergent ? | La plateforme pour les décisions cliente ; l'extraction pour le statut LOGA (lecture seule) |
| Q-I3 | Doublons de code mission : erreur, scission de mission ou reprise ? | Alerte et mise en attente, jamais d'écrasement |
| Q-I4 | Qui crée et valide les profils ? | Agence administration seule |
| Q-I5 | Référence d'intervenant : exclusion totale ou pseudonyme ? | Exclusion par défaut |
| Q-I6 | Code magasin textuel (pseudo-codes) : rapprochement par ville et adresse autorisé ? | Non au démonstrateur, mise en attente |
