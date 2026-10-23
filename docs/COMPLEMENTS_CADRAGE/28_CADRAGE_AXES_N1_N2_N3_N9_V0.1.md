# Cadrage des axes N1, N2, N3 et N9 · V0.1 du 23/10/2026

Suntory uniquement. Origine : `docs/AXES_EVOLUTION_NON_CADRES.md` (analyse de la V0.4 et du Workshop 2027). Décision de T. SOEFOU du 23/10/2026 : « cadrons selon tes recos » (D127, D128). Les règles décrites ci-dessous sont des **hypothèses de cadrage** tant que la cliente et l'agence ne les ont pas confirmées. Aucune durée ni charge chiffrée. Aucun nom propre ni chiffre d'enquête de la source.

## 1. Vue d'ensemble

| Axe | Fonction | Lot cible | Nature | Dépend de | Écriture de données |
|---|---|---|---|---|---|
| N9 Règles par dispositif et par campagne | F-30.10, F-30.11 | **A2b** (étape ajoutée) | Paramétrage et validation | A2a (moteur de règles), calendrier D80 | Oui (paramètres, agence seule) |
| N2 Comparaison N / N-1 | F-10.14 | **A4a** (étape ajoutée) | Lecture | Historique fictif de 2 semaines au moins | Non |
| N1 Fiche secteur unique | F-10.13 | **A4d** (nouveau lot) | Lecture | A3 (propositions), A4a (indicateurs), A5 (absences) | Non |
| N3 Plans d'action sur dépassement | F-10.15 | **A4d** | Écriture légère | A4a (alertes), N1 | Oui (actions) |

Ordre de lancement : A2a, A2b (avec N9), A3, A4a (avec N2), A5, **A4d** (N1 puis N3), A6, A7. A4d n'entre pas dans le noyau de la démonstration du 10/11 (D110) : il rejoint la seconde démonstration, sauf demande contraire de T. SOEFOU.

## 2. N9 · Règles par dispositif et par campagne (F-30.10, F-30.11)

### 2.1 Constat et vocabulaire
- Notre dictionnaire contient un champ `campaign` dont les valeurs sont Permanent, Saisonnier, Merch Horaire, Second placement. Ce sont en réalité des **dispositifs**.
- La source demande de distinguer le merch horaire du 2nd placement et d'éviter qu'une même campagne serve aux deux dispositifs.
- **Hypothèse H1 (validée par T. SOEFOU le 23/10/2026)** : introduire deux niveaux. `dispositif` (liste fermée, quatre valeurs actuelles) et `campagne` (instance rattachée à **un seul** dispositif, avec dates). Le champ actuel `campaign` devient `dispositif` ; la campagne est ajoutée. Décision de modèle à valider avant A2b.

### 2.2 Jeu de paramètres par dispositif (F-30.10)
Table `dispositif_params`, modifiable par l'agence seule, **jamais codée en dur** (A10 de la source). Les valeurs de départ ci-dessous viennent du Workshop et sont **à valider** par la cliente.

| Paramètre | Clé | 2nd placement (valeur proposée) | Autres dispositifs | Statut |
|---|---|---|---|---|
| Durée minimale d'intervention | `min_minutes` | 45 | non défini | À valider |
| Forfait kilométrique moyen | `km_flat_rate` | valeur fictive étiquetée au démonstrateur ; valeur réelle via la grille de tarifs datés (D06 / Q14) | non défini | À actualiser |
| Fenêtre de saisie des contrats du mois M+1 | `entry_window` | avant-dernière semaine du mois M | calendrier D80 / D82 | À valider |
| Effet d'une modification en cours de mois | `change_effect` | mois suivant | calendrier D80 / D82 | À valider |
| Délai de modification avant le début du mois suivant | `change_lead_days` | 10 jours | preset Standard (5 jours ouvrés) | À valider, jours calendaires ou ouvrés ? |
| Saisie ouverte à | `entry_roles` | rôles à définir (« CS » non défini, Q ouverte) | tous les rôles de saisie | **Bloquant partiel** |
| Jours de la semaine proposés | `days_allowed` | LUN à SAM | LUN à SAM | DIM désactivé par défaut, Q-J1 |
| Campagne unique par dispositif | `campaign_single_dispositif` | oui | oui | Règle de modèle (H1) |

### 2.3 Règles de validation (F-30.11)
| Règle | Intitulé | Gravité proposée | Message |
|---|---|---|---|
| P1 | Durée d'une intervention inférieure à `min_minutes` | Bloquante | « Durée minimale de ce dispositif : 45 minutes. » |
| P2 | Campagne rattachée à plus d'un dispositif | Bloquante (au paramétrage) | « Une campagne ne peut relever que d'un dispositif. » |
| P3 | Saisie hors de la fenêtre `entry_window` | Bloquante après échéance (D78) | Message de D78 + report sur M+1 |
| P4 | Modification déposée après `change_lead_days` | Bloquante, report sur M+1 | « Cette modification prendra effet le mois suivant. » |
| P5 | Forfait kilométrique absent du dispositif | Non bloquante : ligne marquée « Non chiffré », jamais à 0 | « Forfait non renseigné. » |
| P6 | Saisie par un rôle absent de `entry_roles` | Bloquante côté Repository | « Ce dispositif n'est pas ouvert à votre rôle. » |

**Priorité des calendriers** : un paramètre de dispositif, s'il existe, l'emporte sur le preset global (D82) ; sinon le preset global s'applique. La règle est tracée dans l'écran du calendrier (« Règle du dispositif » ou « Preset global »).

### 2.4 Exemple chiffré (hypothèse H2, à confirmer)
Décembre 2026 démarre un mardi (01/12). `change_lead_days` = 10 jours calendaires : 21/11, un samedi, recule à la veille ouvrée **vendredi 20/11** (règle de D80 / D82). La fenêtre « avant-dernière semaine de novembre » vaut S47 (16 au 22/11) si la dernière semaine est S48 (23 au 29/11), ou S48 si l'on compte S49 (30/11 au 06/12) comme dernière. **Question ouverte Q-N9-1** : quelle lecture ? Test à écrire pour les deux, la lecture retenue pilote la fixture.

### 2.5 Écrans et événements
- Écran « Paramètres des dispositifs » (profil agence administration) : tableau, historique des modifications (acteur, date, ancienne valeur, nouvelle valeur), valeur par défaut visible.
- Bannière de saisie : affiche le dispositif, la fenêtre ouverte et la prochaine échéance.
- Événements journalisés : `dispositif_param_modifie`, `saisie_refusee_regle_dispositif`, `demande_reportee`. Audience `agency` par défaut ; `client` pour le résumé de retard seulement (D81).
- Exports et rapports : forfait kilométrique visible selon D08 (ouvert) ; masqué côté cliente tant que D08 n'est pas tranché.

### 2.6 Hors périmètre N9
Saisie dans l'application collaborateur de l'agence (le Workshop l'évoque en question), test sur région pilote, règles de coût réel, import des paramètres depuis Excel.

### 2.7 Critères d'acceptation N9
1. Aucune valeur du tableau 2.2 en dur dans le code : tests qui changent un paramètre et observent le comportement.
2. P1 à P6 testées, une fois par règle, avec message FR et EN.
3. Un lot de saisie partiellement invalide (P1) ne crée que les lignes valides et liste les rejets (critère A2b).
4. Priorité dispositif / preset testée, y compris le recul à la veille ouvrée et les jours fériés.
5. Aucune alerte agence côté cliente, CVR, DR, RS (audience).
6. Captures : paramètres, refus P1, bannière de fenêtre, report P4, FR et EN, clair et sombre.

## 2 ter. Lecture analytique par dispositif et par campagne (exigence transversale, D128)

Chaque dispositif et chaque campagne se lisent **indépendamment**, en plus de la vue globale.

| Règle | Contenu |
|---|---|
| Filtre hiérarchique | Barre de filtres commune à tous les écrans de lecture : Dispositif puis Campagne (choix multiple), avec DR, CVR, RS et période (F-10.9). Choisir un dispositif restreint la liste des campagnes ; le filtre est porté par l'adresse de la page et enregistrable en vue |
| Portée du filtre | Tuiles, graphiques et leur alternative tableau, classement des secteurs, comparaison N / N-1 (F-10.14), fiche secteur (F-10.13), alertes, plans d'action, exports et rapports : tous obéissent au même filtre, aucun écran ne l'ignore |
| Vue « Par campagne » | Tableau d'analyse, une ligne par campagne (et sous-total par dispositif) avec les mêmes indicateurs : besoins, taux pourvu, délai de prise de poste, heures, consommé fictif, couverture, dépassements, variation N / N-1, part du total |
| Réconciliation | Somme des campagnes = total du dispositif ; somme des dispositifs = total global. Écart affiché et testé, jamais masqué |
| Lignes sans campagne | Groupe « Sans campagne » visible et inclus dans les totaux, jamais éliminé |
| Indicateur non applicable | Un indicateur qui n'a pas de sens pour un dispositif (exemple : forfait kilométrique hors 2nd placement) affiche « Non applicable », jamais 0 ; aucune moyenne ne mélange des unités différentes |
| Budget | Budget de campagne absent = « Budget non renseigné », jamais 0 (F-10.2) |
| Droits | Le filtre ne change jamais le périmètre d'accès : il restreint à l'intérieur de `AccessContext` |
| Comparatif côte à côte (D131) | Dans la vue « Par campagne », choix de deux ou trois campagnes (ou dispositifs) comparées colonne par colonne sur les mêmes indicateurs, avec écart en valeur et en pourcentage par rapport à la première colonne ; « Non comparable » entre unités incompatibles ; le filtre de période s'applique aux colonnes ; export A4 |

Tests : comparatif de campagnes (unités incompatibles, écart à la première colonne) ; réconciliation campagnes / dispositif / global ; « Sans campagne » inclus ; filtre appliqué à chaque écran listé ; liste de campagnes restreinte par le dispositif ; filtre conservé après rechargement et dans l'export.

## 3. N2 · Comparaison semaine N / N-1 (F-10.14)

- **Objet** : afficher la tendance des heures, des montants fictifs étiquetés et du nombre de dépassements d'une semaine à la précédente. Lecture seule.
- **Profils** : cliente, DR, CVR, agence (RS : sa propre semaine seulement, sans montants, selon D08 ouvert).
- **Définition** (H3) : variation = valeur de la semaine N moins valeur de la semaine N-1, en valeur absolue et en pourcentage ; la semaine N-1 est la **semaine ISO précédente** (S01 compare à la dernière semaine ISO de l'année précédente : 53 semaines en 2026, 52 en 2027).
- **Règles** :
  - Si N-1 est absente ou « non chiffrée », la variation n'est **pas calculée** (jamais 0, jamais infinie) : affichage « Non comparable ».
  - Division par zéro : variation en pourcentage non affichée, variation en valeur affichée.
  - Direction de la variation et couleur : la couleur d'un statut (vert, ambre, rouge) n'est utilisée que si une règle de feu budgétaire s'applique (F-10.3) ; sinon teinte neutre. Jamais de flèche seule : texte « hausse » ou « baisse » en plus.
  - Chaque comparaison affiche période, périmètre, unité, définition et date de calcul (F-10.10).
- **Écrans** : bascule « Comparer à la semaine précédente » sur les tuiles et le tableau du tableau de bord (A4a) ; colonne de variation dans l'alternative tableau ; ligne de variation sous le chiffre de chaque tuile.
- **Données** : la fixture fictive doit contenir au moins deux semaines consécutives (S42 et S43) par zone ; la génération déterministe (`scripts/fixtures-core.ts`, graine 20261023) est étendue sans changer les valeurs existantes.
- **Hors périmètre** : comparaison à l'année précédente (N / N-1 annuel), prévisions, tendance glissante.
- **Critères d'acceptation** : tests de S01 en 2027 (N-1 = S53 de 2026), N-1 manquante, N-1 non chiffrée, division par zéro, audience (aucun montant côté RS), contraste des teintes neutres dans les deux modes, captures par profil.

## 4. N1 · Fiche secteur unique (F-10.13)

- **Objet** : un écran par secteur qui réunit besoins, propositions, absences, consommation et historique. Sert aussi à préparer le point mensuel (N8, futur cadrage).
- **Accès** : depuis le classement des secteurs (F-10.5), une alerte, la carte (plus tard) ou un lien. Le périmètre vient de `AccessContext` : le RS ne voit que son secteur, le CVR ses secteurs, le DR les siens, l'agence tout, la cliente selon D08.
- **Contenu**, une section par bloc, chacune avec son état vide et son état d'erreur :

| Bloc | Contenu | Source de lot | Règle de visibilité |
|---|---|---|---|
| Identité | `ZoneLabel` du secteur, chaîne DR › CVR › RS, période affichée | A1 | Noms selon D106 |
| Besoins | Besoins du secteur par période et par dispositif, 9 statuts, « Zone blanche » en ligne séparée | A2, A3 | D85 |
| Propositions | Version courante, écart expliqué, décision cliente | A3 | Coût incomplet marqué comme tel |
| Absences | Jours d'absence, jours sans couverture, taux de couverture | A5 | **Catégories génériques** uniquement côté cliente |
| Consommation | Heures, montants fictifs étiquetés, couverture avec numérateur et dénominateur | A4a | « Non chiffré » jamais à 0 ; pas de quota de secteur (D85) |
| Alertes | Alertes du secteur dans le périmètre de l'utilisateur | A1, A4a | Audience : aucune alerte agence côté cliente |
| Historique | Journal des événements du secteur, plus récent en premier | A2 à A5 | Acteur affiché selon D106 et D08 |
| Actions | Plans d'action liés au secteur (N3) | A4d | Selon rôle |

- **Principes** : un secteur n'est jamais classé « par personne » (F-10.5) ; aucun champ nominatif d'intervenant côté cliente ; aucun motif médical ; export A4 réutilise le modèle de rapport (D125).
- **Mise en page** : modèle `ReportTemplate` (tuile d'ancrage, tuiles par famille d'indicateur), conforme à D123 à D126 : pas de trait décoratif, pas de tiret dans les textes, rose réservé aux actions.
- **Hors périmètre** : édition des besoins depuis la fiche (renvoi vers les écrans de saisie), carte, photos terrain (A5b), comparaison entre secteurs.
- **Critères d'acceptation** : un test par profil de ce qui est visible et masqué ; test que la fiche d'un secteur hors périmètre renvoie « introuvable » sans fuite d'information ; test d'audience des alertes ; test « Non chiffré » ; captures par profil, FR et EN, clair et sombre, A4.

## 5. N3 · Plans d'action sur dépassement (F-10.15)

- **Objet** : rattacher à une alerte de dépassement (budget, heures, échéance) un **responsable**, une **action** et une **échéance**, et suivre leur statut. Valeur moyenne, effort faible dans la source (R6, phase V3) ; ici cadré légèrement pour rester compatible avec la fiche secteur.
- **Objet de données `action_plan`** (H4) : `id`, `alert_id`, `zone_id`, `owner_role_ref` (rôle ou personne via `ZoneLabel`), `description` (texte libre limité, sans donnée personnelle de tiers), `due_date`, `status` (Ouverte, En cours, Faite, Abandonnée avec motif), `audience`, journal (créée, modifiée, clôturée).
- **Règles** :
  - Une action est créée **depuis une alerte** ou depuis la fiche secteur ; elle ne crée pas d'alerte.
  - Création et modification : CVR et DR sur leur périmètre, agence partout ; la cliente consulte les actions d'audience `client` ou `both` ; le RS consulte celles de son secteur.
  - Échéance : jour ouvré ; une action en retard produit une alerte d'audience `both` à J+1 ouvré, jamais plus d'une relance par action et par jour.
  - Une alerte clôturée avec action « Faite » enregistre le lien ; une action ne peut pas être supprimée, seulement abandonnée avec motif (traçabilité, D18).
  - Texte libre : avertissement à la saisie « n'indiquez aucune donnée personnelle ou médicale » ; limite de longueur ; pas de pièce jointe.
- **Écrans** : bouton « Ajouter une action » sur l'alerte (c'est une action, donc rose autorisé), liste des actions sur la fiche secteur et sur le tableau de bord (« Mes actions à traiter »), états vides soignés.
- **Données** : écriture via `Repository` (nouvelles méthodes créer, modifier, clôturer, lister) avec `AccessContext` obligatoire, refus côté données.
- **Hors périmètre** : e-mails réels, fil de commentaires (F-20.9), affectation à une personne nominative côté cliente, suivi du coaching (N13).
- **Critères d'acceptation** : test de refus d'écriture hors périmètre ; test que la cliente ne voit pas une action d'audience `agency` ; relance unique par jour ; suppression impossible ; captures.

## 6. Découpage des lots (mise à jour proposée du plan)

| Lot | Ajout | Étape ajoutée au prompt |
|---|---|---|
| A2b | N9 : paramètres par dispositif, règles P1 à P6, écran des paramètres | Étape 2 bis du prompt A2b |
| A4a | N2 : comparaison N / N-1 | Étape 4 bis du prompt A4a |
| **A4d** (nouveau) | N1 puis N3 | Prompt `21_PROMPT_LOT_A4D.md` |

## 7. Questions ouvertes

| N° | Question | À trancher par | Hypothèse utilisée |
|---|---|---|---|
| Q-N9-1 | Quelle « avant-dernière semaine du mois » (S47 ou S48 pour novembre 2026) ? | Cliente, agence | S47 : dernière semaine = dernière semaine ISO entièrement dans le mois |
| Q-N9-2 | « 10 jours » avant le mois suivant : calendaires ou ouvrés ? | Cliente | Calendaires, recul à la veille ouvrée |
| Q-N9-3 | « CS » : qui est ce rôle ? Qui peut saisir le 2nd placement ? | Cliente | `entry_roles` non restreint au démonstrateur, rôle vide signalé |
| Q-N9-4 | Forfait kilométrique : valeur de référence, périodicité d'actualisation, visibilité côté cliente | Cliente, agence | Valeur fictive étiquetée, masquée côté cliente |
| Q-N9-5 | Un dispositif unique par campagne : confirmé ? Changement de nom du champ `campaign` acceptable ? | T. SOEFOU | Oui (H1) |
| Q-J1 | Le dimanche est-il à proposer pour certains dispositifs ? | Cliente, agence | DIM désactivé par défaut |
| Q-N2-1 | La semaine N-1 est-elle la semaine ISO précédente ou la même période de l'an passé ? | T. SOEFOU | Semaine ISO précédente |
| Q-N1-1 | La cliente voit-elle les montants au secteur ? | Cliente (D08) | Non, par défaut refus |
| Q-N3-1 | Qui peut créer une action sur un dépassement de la cliente ? | Cliente, agence | CVR, DR, agence |

## 8. Saisie des jours de la semaine (D132)

- Le champ `days` d'un besoin devient un **sélecteur de cases à cocher** : un seul jour ou plusieurs (composant `WeekdayPicker`), sur toutes les saisies de besoin (unitaire, lot, duplication).
- Jours proposés : LUN à DIM. Le dictionnaire portait LUN à SAM : écart signalé, DIM **désactivé par défaut** et activable par dispositif (paramètre `days_allowed`, F-30.10). Question Q-J1 : le dimanche est-il à proposer pour certains dispositifs ?
- Raccourcis : « Lun à ven », « Lun à sam », « Tous », « Aucun ». Au moins un jour est exigé (message explicite).
- Contrôles : avertissement non bloquant si aucun des jours cochés ne tombe entre la date de début et la date de fin du besoin ; avertissement si un jour coché est férié sur toute la période.
- Saisie en lot : le collage de jours (LUN;MAR;JEU) est accepté et converti en cases cochées ; valeur inconnue = ligne rejetée avec explication.
- Stockage : liste de codes ISO (1 à 7) ; affichage FR (lun, mar) et EN (Mon, Tue). Accessibilité : groupe de cases étiqueté, navigation clavier, état coché lisible sans la couleur.

## 9. Sélecteur de date partout (D133)

Aucune date ne se tape à la main. Composants communs `DatePicker` (une date), `DateRangePicker` (période) et `WeekPicker` (semaine ISO). Spécification : règle 12 de `PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md`.

| Écran ou axe | Lot | Composant | Jours désactivés |
|---|---|---|---|
| Début et fin de besoin ; décalage de duplication | A2a | DateRangePicker, DatePicker | Hors bornes paramétrées, fériés signalés |
| Calendrier d'échéances (N9, D80), durée de réouverture | A2b | DatePicker, DateRangePicker | Non ouvrés, fériés |
| Dates du tableau de saisie en lot | A2b | DatePicker en cellule | Après échéance (D78) |
| Prise de poste, remise du véhicule, dates limites de décision | A3 | DatePicker | Avant la décision |
| Filtre de période, choix de la semaine N (N2) | A4a | DateRangePicker, WeekPicker | Hors données disponibles |
| Début et fin d'absence, remplacement | A5 | DateRangePicker | Selon règles A5 |
| Échéance d'un plan d'action (N3) | A4d | DatePicker | Non ouvrés |
| Projection annuelle ou semestrielle (N10, non cadré) | futur | DateRangePicker | À définir |

Exigences : semaine commençant le lundi, numéro de semaine ISO affiché, jour courant issu de l'horloge de démonstration (23/10/2026, S43), raison écrite de chaque jour désactivé, clavier complet, cibles tactiles de 44 px, mode sombre et contraste testés, format de date selon la langue (D118), valeur interne ISO. Un test d'architecture interdit `type="date"` et les champs texte de date hors de ces composants.
