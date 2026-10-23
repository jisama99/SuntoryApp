# Étape B : fiche de fonction « Photos terrain », V0.1 (23/10/2026)

Suntory uniquement. Livrables externes signés FREELANCE. Étape A : images fictives, aucun appel réseau sortant, aucun traitement de photo réelle. Proposition du prestataire : D65 est la seule décision déjà validée sur le sujet ; les décisions D98 à D103 ont été validées par lui le 23/10/2026. Ce document ne constitue pas un avis juridique : les points de droit sont renvoyés aux DPO d'Impact et de la cliente.

## 0. Ce qui a été lu
| Lu | Non lu |
|---|---|
| Registre (D14, D18, D25, D32, D42, D65, D66, D73, D84 à D97) ; `CLAUDE.md` (règle « pas de photo sans finalité validée ») ; docs 10 §9, 20, 21 (partie B et questions), 22 §3 à §5, 23, 26 ; `rapport_spec.json` (page `photos`) | Cartographie WF ; docs 11, 13 à 15, 17 ; origine des fixtures P01 à P05 du prototype ; politique photo des enseignes ; registre des traitements T1 à T14 ; appareils réels des RS |
Hypothèse de travail : aucune règle d'enseigne ni de DPO n'est connue. Tout ce qui en dépend est un paramètre, pas une valeur figée.

## 1. Finalité et périmètre
| Point | Position proposée |
|---|---|
| Finalité | Illustrer dans les rapports (COPIL, point mensuel) les opérations de merchandising réalisées, avec les heures et le coût engagé, afin de rendre visible les ressources mobilisées. Aucune autre finalité (pas de contrôle individuel, pas de suivi de personnes, pas de géolocalisation) |
| Contenu autorisé | Rayons, linéaires, mises en place, avant et après (D65) |
| Contenu exclu | Toute personne identifiable (clients, salariés d'enseigne, merchandisers), visages, plaques, documents lisibles, écrans |
| Qui importe | RS, CVR, agence. Aucun compte intervenant (D42). L'auteur tracé est la personne qui importe, jamais l'intervenant photographié ou concerné |
| Qui voit | Cliente : photos validées et autorisées pour les rapports (D65). DR et CVR : leur périmètre. Agence : tout |
| Hors périmètre | Photos de preuve de présence, reconnaissance faciale, géolocalisation, scan de documents, vidéo (les vidéos du lot 3 des supports de formation sont un autre sujet) |
La règle `CLAUDE.md` « pas de photo sans finalité validée » s'applique : tant que la finalité ci-dessus n'est pas validée par Impact et la cliente (D98), la fonction reste un démonstrateur sur images fictives.

## 2. Parcours
| # | Étape | Acteur | Détail |
|---|---|---|---|
| 1 | Prise ou choix de l'image | RS, CVR, agence | Depuis le navigateur du mobile (sélecteur d'image avec appareil photo) ou depuis l'ordinateur. Pas de verrou PWA ou native tant que D32 est ouvert |
| 2 | Rattachement guidé | Importateur | Magasin (obligatoire, limité au secteur du RS, D44), campagne et type, date de prise de vue. Facultatif : besoin ou saisie de réalisé liés. Légende courte |
| 3 | Pré-contrôles automatiques | Plateforme | Format réel du fichier, taille, doublon, suppression des métadonnées, signalement de visages ou de plaques, qualité (flou, luminosité) |
| 4 | File d'attente hors ligne | Plateforme | États « à synchroniser », « synchronisé », « conflit » (simulés à l'étape A, comme F-40.3) |
| 5 | Validation | Agence opérationnelle | Galerie « Photos à valider », validation en lot, refus avec motif, floutage ou exclusion si un signalement est confirmé |
| 6 | Autorisation d'usage | Agence opérationnelle | Usage « interne » ou « rapports de la cliente », réglé à la validation |
| 7 | Usage en rapport | Agence opérationnelle | Sélection manuelle, par règle ou mixte (doc 22 §4) ; pagination 3 par page ; heures et coût rapprochés |
| 8 | Retrait | Agence | Une photo peut être retirée à tout moment, avec motif et trace ; effet sur les rapports non encore publiés immédiat |
| 9 | Purge | Plateforme | À la date de fin de conservation, suppression de la photo, de ses dérivés et traitement des exports archivés (§6) |
Le travail humain se limite à l'étape 5 et à l'étape 7. Les photos sans signalement arrivent regroupées dans « prêtes à valider », celles avec signalement dans « à examiner », pour que l'agence regarde d'abord ce qui compte (principe D67).

## 3. Statuts d'une photo
Un statut de photo est distinct de tous les autres statuts du projet.
| Statut | Sens | Visible par la cliente |
|---|---|---|
| Brouillon | Importée, rattachement incomplet | Non |
| À valider | Pré-contrôles faits, attend l'agence | Non |
| Validée, usage interne | Contrôlée, réservée à l'agence et aux périmètres DR et CVR | Non |
| Validée, rapports de la cliente | Contrôlée et autorisée | Oui |
| Refusée | Motif obligatoire (identifiable, flou, hors sujet, enseigne non autorisée, doublon) | Non |
| Retirée | Retirée après validation, motif et trace | Non |
| Purgée | Fichier supprimé, fiche conservée sans image pour la traçabilité | Non |

## 4. Données conservées par photo
| Champ | Type | Remarque |
|---|---|---|
| `photo_id` | UUID | Immuable |
| `store_code`, `sector_code`, `campaign_type` | codes texte | Contrôlés côté données contre le secteur de l'importateur |
| `need_id`, `submission_id` | UUID facultatifs | Liens avec le besoin ou le réalisé |
| `taken_on` | date ISO | Lue avant suppression des métadonnées, modifiable par l'importateur, jamais l'heure dans les exports de la cliente |
| `uploaded_at`, `uploaded_by_ref`, `uploaded_by_role` | horodatage, référence | Donnée personnelle de l'importateur : jamais affichée à la cliente |
| `caption`, `alt_text` | texte | Texte alternatif proposé par règle, relu. Légende soumise aux règles de style (D62) |
| `status`, `usage_scope`, `validated_by_ref`, `validated_at`, `rejection_reason` | | Trace complète |
| `precheck_flags` | liste | Visage signalé, plaque signalée, flou, doublon, métadonnées retirées |
| `file_hash`, `width`, `height`, `bytes`, `format` | | Doublon et définition minimale |
| `retention_until`, `purged_at` | dates | Calculées par la règle de conservation (§6) |
| `record_version` | entier | Comme les autres tables |
Jamais stocké : coordonnées GPS, modèle d'appareil, numéro de série, nom d'une personne photographiée.

## 5. Protection à l'import (ordre du traitement)
| # | Mesure | Détail |
|---|---|---|
| 1 | Transport chiffré | Dès la sortie du mobile |
| 2 | Contrôle du format réel | Le contenu doit être une image (JPEG, PNG) ; l'extension seule ne suffit pas. Autres formats, dont HEIC des iPhone : conversion à prévoir, faisabilité selon la pile non vérifiée |
| 3 | Lecture de la date, puis suppression de toutes les métadonnées | GPS, appareil, logiciel, miniature intégrée |
| 4 | Ré-encodage de l'image | Écarte aussi les contenus cachés dans le fichier ; applique une taille maximale (valeur paramétrable, à tester) |
| 5 | Empreinte | Détecte les doublons exacts ; un doublon est signalé, jamais supprimé en silence |
| 6 | Détection de visages, de silhouettes et de plaques | Elle **signale**, ne tranche pas. Aucune détection ne remplace la validation humaine. À l'étape A, le signalement est simulé par un marqueur des fixtures |
| 7 | Floutage | Proposé en cas de signalement confirmé par l'agence. L'original non flouté n'est pas conservé après la validation (proposition D99, à confirmer par les DPO) |
| 8 | Stockage | Chiffré au repos, dans l'Union européenne ; hébergeur non encore choisi (D02, D19). Aucune photo réelle avant ce choix et le contrat article 28 |
| 9 | Accès | Par rôle et périmètre côté serveur ; liens d'affichage à courte durée de vie ; jamais d'URL publique permanente |
| 10 | Journal | Import, validation, refus, consultation par la cliente, export, retrait, purge |
| 11 | Sous-traitants | Aucun service externe de détection ou d'analyse d'image sans autorisation préalable de la cliente (sous-traitant ultérieur, D17) |

## 6. Conservation, purge, droits des personnes
| Sujet | Position proposée |
|---|---|
| Durée | Fixée par Impact (D65), paramétrable par catégorie, jamais codée en dur. Valeur non fournie |
| Point de départ | Date de validation, ou de prise de vue ; à choisir avec le DPO |
| Purge | Tâche programmée : suppression de la photo, de ses miniatures et de ses copies dérivées ; la fiche reste avec le statut « Purgée » |
| Exports archivés | Un rapport publié contient des copies des photos. Proposition : la durée de conservation de l'export est alignée sur celle de la photo, ou l'export est régénéré sans l'image. À trancher |
| Fichiers déjà téléchargés | Un PPTX ou un PDF envoyé à la cliente sort de la plateforme. La purge ne peut pas le rappeler : cette limite est écrite dans les conditions d'usage |
| Retrait à la demande | Une enseigne, une personne reconnaissable ou le DPO peuvent demander le retrait : même procédure que « Retirée », avec effet sur les rapports non publiés et marquage des exports archivés (Q9, demandes de droits) |
| Qualification | Le DPO d'Impact et celui de la cliente qualifient le traitement. Les photos sont à inscrire au registre (famille T4 à T8 ou nouvelle ligne) et à examiner dans l'analyse d'impact si D18 la prévoit |

## 7. Règles par enseigne
Paramètre `photos_autorisees` par enseigne : **oui**, **non** ou **à confirmer** (valeur par défaut). Pour « non » et « à confirmer », l'import est refusé avec un message qui explique pourquoi. Le droit de photographier en magasin dépend de chaque enseigne ; la plateforme applique la règle fournie, elle ne la devine pas. Renseignement par l'agence administration, avec date et source de l'autorisation.

## 8. Droits
| Rôle | Importer | Voir | Valider | Choisir pour un rapport | Régler conservation et enseignes |
|---|---|---|---|---|---|
| RS | Son secteur | Ses photos | Non | Non | Non |
| CVR | Son périmètre | Son périmètre | Non (signale) | Non | Non |
| DR | Non | Son périmètre, photos validées | Non | Non | Non |
| Agence opérationnelle | Oui | Toutes | Oui | Oui (D73) | Non |
| Agence administration | Oui | Toutes | Oui | Oui | Oui |
| Cliente | Non | Photos « rapports de la cliente » : galerie en lecture seule et rapports publiés | Non | Non | Non |
| Intervenant | Aucun compte (D42) | Rien | Rien | Rien | Rien |
Pour la cliente, la galerie n'affiche ni auteur, ni heure, ni nom de RS ou d'intervenant (règle « secteurs, pas personnes »). Question ouverte : galerie dans l'application en plus des rapports ? D65 dit « visibles par la cliente » sans préciser.

## 9. Usage en reporting
| Élément | Règle |
|---|---|
| Page `photos` | Déjà dans le moteur (doc 22) : 3 photos par page, `pages_max` réglable, sélection manuelle, par règle ou mixte |
| Règles de sélection | « Les N opérations les plus lourdes en heures », « la dernière photo validée par secteur », « un avant et un après par magasin » |
| Carte photo | Image, secteur, date de prise de vue, heures, coût engagé si l'agence autorise l'affichage des coûts (D66). Un coût inconnu s'écrit « Non chiffré », jamais zéro. Pas de quota de secteur (D85) : poids indicatif dans l'enveloppe du CVR |
| Texte | Titre de page recalculé par règle ; légende et texte alternatif contrôlés (aucun cadratin, aucune construction antithétique) |
| Qualité | Définition minimale calculée à partir de la taille de la carte, cible 144 points par pouce comme la photo de couverture (D75) ; alerte en dessous. Valeur par défaut de taille à valider par essai |
| Reproductibilité | Mêmes règles et mêmes données donnent la même sélection (ordre de départage fixé) |
| Données fictives | Étiquette « Démo » sur chaque page ; images synthétiques générées pour l'étape A (aucune photo d'un magasin réel) |

## 10. Événements, alertes, automatisations, lots
Prolonge le doc 26.
| Élément | Ajout proposé |
|---|---|
| Événements | EV-38 photo importée ; EV-39 photo validée ou refusée ; EV-40 photo retirée ; EV-41 photo purgée |
| Fonctions du catalogue (doc 16, module M4) | F-40.6 import de photo ; F-40.7 pré-contrôles ; F-40.8 validation en lot ; F-40.9 galerie ; F-40.10 retrait ; F-40.11 règles par enseigne ; F-40.12 conservation et purge |
| Alertes | F-60.22 photos en attente de validation au delà d'un délai paramétré ; F-60.23 fin de conservation proche |
| Automatisations | AUT-16 pré-contrôles à l'import (A, local) ; AUT-17 purge programmée (B) |
| Rapports | R-13 galerie de photos (doc 26) devient réalisable ; page `photos` du moteur |
| Lots | Nouveau lot **A5b Photos terrain sur images fictives** après A5 : import simulé, pré-contrôles réels sur fixtures, validation, galerie, retrait, purge à horloge simulée. La page `photos` de A4c1 lit les fixtures. B : stockage réel, détection retenue, purge réelle |
| Charge | Aucune durée estimée ici. A5b est un lot à part pour ne pas alourdir A5 |

## 11. Critères d'acceptation vérifiables (étape A)
1. Une image de test portant des métadonnées de position et d'appareil ressort sans aucun champ de métadonnées.
2. Un fichier nommé en image mais dont le contenu n'en est pas une est refusé.
3. Un RS ne peut rattacher une photo qu'à un magasin de son secteur, y compris si la requête est forgée.
4. Un profil cliente ne reçoit aucune photo non autorisée, même dans les données chargées par la page.
5. L'export de la cliente ne contient ni auteur, ni heure, ni nom de RS.
6. Un magasin d'une enseigne « non » ou « à confirmer » refuse l'import avec explication.
7. Un doublon exact est signalé et non supprimé.
8. Avec l'horloge de démonstration, la purge à la date de fin supprime la photo et ses dérivés, marque les exports archivés et laisse la fiche « Purgée ».
9. Un coût manquant donne « Non chiffré » sur la carte photo.
10. Même sélection et mêmes données donnent la même page (empreinte identique).
11. Aucun appel réseau sortant pendant les tests.

## 12. Cas limites
Personne visible malgré l'interdiction ; plaque ou document lisible en arrière-plan ; badge ou planning affiché dans le rayon ; photo prise hors magasin ; photo antérieure à la création du besoin ; magasin hors secteur ; import massif hors ligne interrompu ; photo importée après clôture du mois ; photo déjà publiée puis retirée ; demande de retrait par une enseigne ; image trop petite pour une page ; image au format non géré ; deux photos identiques importées par deux personnes.

## 13. Décisions proposées
| N° | Sujet | Décision proposée | Statut | À confirmer par |
|---|---|---|---|---|
| D98 | Fonction photos terrain | Finalité de l'illustration des rapports, contenu sans personne (D65), import par RS, CVR, agence (D42), validation par l'agence avant tout usage | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU ; Impact et cliente (finalité) |
| D99 | Protection à l'import | Dix mesures du §5 ; la détection signale, l'humain tranche ; original non flouté non conservé après validation | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU ; DPO |
| D100 | Statuts et usage | Sept statuts distincts ; usage « interne » ou « rapports de la cliente » réglé à la validation | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |
| D101 | Règle par enseigne | Paramètre `photos_autorisees`, défaut « à confirmer », import refusé tant que l'autorisation manque | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU ; Impact (enseignes) |
| D102 | Conservation | Durée paramétrable fixée par Impact, purge programmée incluant dérivés et exports archivés, limite écrite pour les fichiers déjà téléchargés | Validée par T. SOEFOU le 23/10/2026 | Impact, DPO |
| D103 | Lot A5b | Photos terrain sur images fictives, après A5 | Validée par T. SOEFOU le 23/10/2026 | T. SOEFOU |

## 14. Questions bloquantes
1. **Impact et cliente :** la finalité du §1 est-elle validée, et qui l'inscrit au registre des traitements ?
2. **Impact :** durée de conservation et point de départ (D65) ?
3. **Impact :** quelles enseignes autorisent la photo en magasin, et sous quelle forme l'autorisation est-elle documentée ?
Questions non bloquantes : galerie visible dans l'application de la cliente ; code Nielsen affiché dans les cartes photo ; équipement des RS (D32) ; format HEIC.

## 15. Risques
| Risque | Gravité | Parade |
|---|---|---|
| Personne identifiable dans une photo envoyée à la cliente | Élevée | Signalement, validation humaine, floutage, original non conservé |
| Conservation sans durée | Élevée | Pas de photo réelle avant décision D102 |
| Enseigne qui refuse la photo | Moyenne | Règle par enseigne, défaut bloquant |
| Détection automatique prise pour une garantie | Moyenne | Libellé « signalement », validation obligatoire |
| Export déjà diffusé impossible à rappeler | Moyenne | Limite écrite, durée d'export alignée |
| Charge de validation pour l'agence | Moyenne | Regroupement « prêtes à valider » et validation en lot |

## 16. Compétences mobilisées (CV et entretiens)
| Travail réalisé | Formulation transférable |
|---|---|
| Cadrage d'une fonction image avec finalité, durée et règles par enseigne | Conception de traitements de données personnelles conformes dès l'origine (protection de la vie privée dès la conception) |
| Pipeline de pré-contrôles avec validation humaine obligatoire | Gouvernance de l'IA et des automatisations : l'outil signale, l'humain décide |
| Suppression des métadonnées, ré-encodage, liens à durée limitée, journal | Sécurisation d'un flux de fichiers, journalisation et traçabilité d'accès |
| Matrice de risques et décisions par décideur | Analyse de risques opérationnels et pilotage de la conformité avec les DPO |
Pour monter en niveau : relier ces points aux référentiels de gestion des risques d'un projet d'IA et de sécurité (analyse d'impact, minimisation des données, durées de conservation).

## 17. Mise à jour de mémoire proposée (non enregistrée)
Étape B cadrée le 23/10/2026 : fiche de fonction photos terrain (finalité d'illustration des rapports, aucune personne, import par RS, CVR, agence, validation par l'agence, sept statuts, protection à l'import en dix mesures, règle d'autorisation par enseigne, conservation paramétrable fixée par Impact avec purge incluant les exports archivés, lot A5b sur images fictives). Décisions D98 à D103 validées par T. SOEFOU le 23/10/2026. Restent ouverts : finalité à valider par Impact et la cliente, durée, enseignes, galerie cliente.
