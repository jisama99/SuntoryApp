# Reporting : détail régions, secteurs et magasins, droits agence, prototype V3.1 (23/10/2026)

Suntory uniquement. Livrables externes signés FREELANCE. Données de démonstration fictives.

## 1. Décisions du 23/10/2026
| N° | Décision | Statut |
|---|---|---|
| D73 | Le reporting (trame, ajustements, titres, photo de couverture, choix des pages et des exemples, génération) est validé. Les ajustements appartiennent aux profils agence. | Validée par T. SOEFOU |
| D74 | Logos fondus dans les pages, sans pastille : version blanche, marine ou couleur selon le fond, choisie par page | Appliquée au prototype |
| D75 | Photo de couverture fusionnée au fond du gabarit, définition au moins égale à celle du gabarit (144 points par pouce), alerte en dessous | Appliquée au prototype |
| D76 | Titre du rapport et titre de chaque page modifiables. Nom du fichier déduit : `CLIENT_TITRE_PÉRIODE_DATE_Vn` sans accents ni caractères interdits | Appliquée au prototype |
| D77 | Pages de détail région, secteurs, magasins avec pagination, RS non affiché par défaut, liste complète en annexe Excel | Proposée |

| D83 | Le logo Marvesting orange est retiré des exports de reporting. Seul le logo Suntory reste ajouté dans la page, en haut à droite. Remplace D64. Les marques propres au gabarit (Impact en en-tête, signature de la page de clôture) ne sont pas touchées, à confirmer | Appliquée au prototype, confirmation demandée |

## 2. Vérification demandée : régions, secteurs concernés, listes de magasins
| Besoin | Données disponibles | Verdict |
|---|---|---|
| Horaires par région et par secteur | Heures par semaine, jours, créneaux portés par les besoins et affectations ; chaîne DR, CVR, RS, secteur (docs 17 et 19) | Oui |
| Quotas par région et par CVR | Cumul national, DR, CVR (doc 16) | Oui |
| Quota par secteur | Les sources définissent les enveloppes au niveau DR et CVR. Aucun quota de secteur n'est établi. | **Arbitré (D85)** : pas de quota de secteur. Le prototype affiche le consommé, un repère indicatif « poids dans l'enveloppe du CVR » et le statut du besoin (Pourvu, Réattribué, Stoppé, Zone blanche) |
| Liste des magasins d'un secteur | Référentiel de 496 magasins, clé code magasin Nielsen, enseigne, nom, ville, département (doc 15) ; le RS saisit par magasin (D44) | Oui pour la liste |
| Heures et coûts par magasin | Le fichier actuel a pour grain le besoin et l'affectation, avec un nombre de magasins calculé par secteur | **À vérifier au lot A0b** : valable seulement si les besoins sont saisis au grain du magasin |
| Pages prévues avant ce jour | Le catalogue du doc 20 ne contenait que budget par DR ou CVR et carte par département | **Écart comblé** par deux nouveaux types de pages (§3) |

## 3. Nouvelles pages
| Page | Gabarit source | Contenu | Pagination |
|---|---|---|---|
| Détail région | 35 | Chiffres de la région, secteurs concernés avec CVR, magasins, heures par semaine, part du quota | 6 secteurs par page |
| Détail secteur et magasins | 15 | Une ligne par magasin : enseigne, magasin, ville, code, heures par semaine, jours, état de recrutement | 7 magasins par page, plafond de pages réglable |
Paramètres : niveaux de détail (région, secteur, magasin), régions et secteurs cochés, tri, `magasins_par_page`, `pages_max`, affichage du RS (non par défaut), annexe Excel de la liste complète.
Volume : 496 magasins donneraient environ 71 pages à 7 par page. D'où le filtre par secteurs cochés, le plafond de pages et l'annexe Excel pour la liste complète.
Confidentialité : périmètre filtré côté serveur. Le nom du RS ne figure pas dans les exports cliente par défaut (règle « secteurs, pas personnes »). Usage du code Nielsen dans un export cliente à confirmer.

## 4. Droits d'ajustement (D73)
| Profil | Peut |
|---|---|
| Agence administration | Créer et modifier les modèles, régler le minimum de fidélité, gérer le gabarit et les logos |
| Agence opérationnelle | Composer un rapport, modifier titres, photo de couverture, pages, sélections et nom du fichier, générer, relire, soumettre à validation |
| Validation agence | Publier ou renvoyer en correction |
| CVR, DR | Consultent les rapports de leur périmètre, sans ajustement ; rapports publiés partagés par l'agence dans l'application (D87) |
| Cliente | Reçoit le rapport publié |
Chaque ajustement et chaque publication sont tracés (qui, quand, quoi).

## 5. Prototype V3.1
`PROTOTYPE_COPIL_V3_1/` : 12 pages (couverture, ordre du jour à 5 points, synthèse, évolution, recrutements, détail région, 2 pages de magasins, 2 pages de photos, décisions, clôture). Nom généré : `SUNTORY_POINT-COPIL-MERCHANDISING_T4-2026_2026-10-23_V1`. Fidélité au gabarit : 86 à 100 % par page. Contrôle de style : conforme. Mise à jour D85 : colonne « part du quota » remplacée par le poids indicatif dans l'enveloppe du CVR et un point d'attention par statut, statuts Réattribué, Stoppé et Zone blanche sur les pages magasins, ligne « hors taux » sur la page recrutements, délai moyen remplacé par des délais par situation. Mise à jour D83 : plus de logo Marvesting orange ajouté, contrôle de style adapté (logo Suntory seul exigé).
Limites : rendu vérifié en PDF, pas dans PowerPoint ni Keynote. La photo source mesure 2 420 pixels de large ; elle donne 144 points par pouce, comme le gabarit. Une photo plus grande donnerait un rendu plus fin.

## 6. Points ouverts
1. Règle du quota par secteur : tranchée (D85), colonne du prototype à remplacer par le consommé et les statuts.
2. Grain des besoins au magasin (lot A0b).
3. Droits de consultation : tranchés (D87), CVR et DR voient leur périmètre, partage par l'agence dans l'application.
4. Droits : logo Suntory (D25), gabarit Marvesting, police Mont, photo de couverture, usage du code Nielsen.
5. Date limite de saisie des besoins : les 5 questions posées le 22/10 restent à trancher.

## 7. Mise à jour de mémoire proposée (non enregistrée)
Ajustements du reporting réservés aux profils agence (D73), logos fondus, photo de couverture fusionnée, titre et nom de fichier déduit (D74 à D76), pages de détail régions, secteurs, magasins (D77).
