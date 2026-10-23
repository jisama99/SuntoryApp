# SUNTORY REFONTE V3 · Complément de cadrage n°1 : design du site et de l'application mobile

Version de travail du 22/10/2026 · Statut : **proposition du prestataire, rien n'est validé** · Client : Suntory uniquement (aucune donnée ni décision Norton).

> **Mise à jour du 22/10/2026** : les décisions de T. SOEFOU (charte mixte, intervenants non utilisateurs, IdP = agence, tri des agents) sont dans `14_DECISIONS_22-10_CHARTE_ACCES_AGENTS.md` et **prévalent** en cas de contradiction avec ce document.

> **Complément du 22/10/2026 (suite)** : voir aussi `15_DECISIONS_22-10_LOGOS_RS_BUDGETS_AGENTS.md` (logos, RS utilisateurs, chaîne managériale, budgets, agents adoptés).
Ce document complète `02_Dossier_de_cadrage` et `01_REGISTRE_DECISIONS.md` sans les remplacer. Il ne contient ni code ni écran réalisé.

## 1. Existant vérifié

| Source lue | Constat | Fiabilité |
|---|---|---|
| `DESIGN SYSTEM/design_system_suntory.md` | Cyan `#5BC2DC`, bleu profond `#00829B`, aqua `#E7F5F9`, texte `#1A1A1A`, Inter, rayons 4/8/16 px, ombres douces, icônes filaires 1,5 à 2 px | Lu en entier ; extrait du site institutionnel, **non confirmé par la charte officielle** |
| `MAQUETTES_V4/core.css` (lu par extraction des variables) | Jetons : `--p #00829B`, `--p2 #5BC2DC`, `--pk #E52365` (rose Marvesting), `--navy #08071E`, sémantiques ok / alerte / erreur avec fonds doux ; police système Apple, chiffres tabulaires ; points de rupture 760, 900, 1100, 1200 px ; `prefers-reduced-motion` ; impression | Lu partiellement (variables, requêtes média, règles de police) |
| `00_AUDIT_V312_ET_AJUSTEMENTS.md` | Garde-fous d'interface déjà décidés pour les modules : filtres à libellé intégré, retour « France entière » + fil d'Ariane + Échap, zoom sans perte, bascule FR / EN, bascule Agence / Cliente sans message d'aperçu, anonymisation des intervenants en vue cliente, noms à côté des codes DR / CVR | Lu en entier jusqu'à la section 8 |
| `design_system_marvesting.md` | Charte Marvesting / Impact (rose `#E52365`, navy) pour **présentations** | Lu en partie (début) |
| `marvesting_trame_system_design.md` | Trame « **Marvesting X Norton** » : **c'est un document Norton**. Il n'est pas une source pour Suntory | Début lu ; à écarter (règle « ne jamais mélanger les clients ») |
| `maquette_premium_V4.html`, `maquette_AC_fusion_V4.html`, `maquettes_directions_V4.html` | Présents ; structure repérée (barre latérale, tiroir, navigation secondaire). **Aucune capture visuelle ouverte dans cette session** | Non évaluées visuellement |

### Vérification de contraste (calculée aujourd'hui, formule WCAG 2.x)
| Paire | Ratio | Verdict texte normal (AA = 4,5) |
|---|---|---|
| `#00829B` sur blanc / blanc sur `#00829B` | 4,50 | Limite : passe sans marge |
| `#00829B` sur `#E7F5F9` (aqua) | 4,03 | **Échec** : ne pas poser de texte bleu sur fond aqua |
| `#5BC2DC` sur blanc / blanc sur `#5BC2DC` | 2,06 | **Échec** : cyan réservé aux graphiques, aplats, décor (jamais du texte, ni un bouton à texte blanc) |
| `#E52365` (rose) sur blanc | 4,41 | **Échec de peu** pour du texte courant |
| `#595959` sur blanc | 7,0 | Passe |
| Sémantiques V4 (ok, alerte, erreur sur leur fond doux) | 4,67 / 5,31 / 5,52 | Passent |

Conséquence : la phrase du design system « `#5BC2DC` ou `#00829B` pour assurer le ratio WCAG » est exacte pour `#00829B` seulement.

## 2. Manques

1. Aucune charte **Suntory × plateforme** décidée : trois sources se recouvrent (design system Suntory, jetons V4 avec rose Marvesting, charte Marvesting / Impact).
2. Accessibilité des modules V4 faible en apparence (peu d'attributs ARIA relevés dans `maquette_premium_V4.html`), jamais auditée au lecteur d'écran.
3. Aucun parcours mobile concevable à partir de V4 : les modules sont des fichiers hors ligne pour poste de bureau (points de rupture présents, pas de conception tactile).
4. Aucun état d'interface systématique (chargement, vide, erreur, refus, brouillon, synchronisation, conflit).
5. Police : Inter (design system) contre police système Apple (V4). Un chargement depuis un service tiers (polices distantes) est à éviter : appel réseau sortant et question RGPD.
6. Logos : D25 / Q22 ouvert (droits Suntory, Marvesting). Décision déjà prise : aucun logo ni nom d'agence ou de prestataire dans les écrans.

## 3. Direction UX/UI recommandée

**Principe** : une plateforme de *lecture puis décision*, pas un tableau de bord décoratif. Chaque écran répond à une question métier, et chaque chiffre est explicable.

| Axe | Recommandation | Motif |
|---|---|---|
| Identité | **Suntory dominant** : fond blanc / `#F4F8FA`, `#00829B` pour actions et liens, cyan en accents et graphiques, Inter. Pas de rose dans les vues cliente. Le rose Marvesting n'est pas repris (contraste 4,41, et identité agence à ne pas afficher) | Cohérence cliente, contraste, décision « pas de signature dans les écrans » |
| Mode agence | Même charte ; le mode se signale par un libellé de rôle et des fonctions en plus, pas par une autre couleur | Évite deux produits |
| Sémantique | Vert / ambre / rouge **toujours doublés d'une icône et d'un texte** ; gris = « à définir » ou « non communiqué » ; jamais de zéro pour une valeur inconnue (« Non chiffré ») | Daltonisme, règle « pas de faux zéro » |
| Typographie | Inter auto-hébergée, chiffres tabulaires, échelle 14 px de base en dense, 16 px minimum en saisie mobile | Lisibilité, aucun appel réseau tiers |
| Densité | Bureau : dense et filtrable ; mobile : une tâche par écran | Besoins distincts |
| Explication | Chaque indicateur : info-bulle « définition · formule · source · date de mise à jour · statut des données (fictif / réel / partiel) » | Confiance, règle « hypothèse ≠ décision » |
| Langue | FR / EN, zéro libellé en dur, dates ISO, semaine « 2026-S53 », séparateurs selon la langue | D27 |
| Mouvement | Courtes transitions, respect de « réduire les animations » | Acquis V4 |

## 4. Version ordinateur : expérience de lecture analytique

### Arborescence proposée (niveau 1 / niveau 2)
| Zone | Contenu | Rôles concernés |
|---|---|---|
| Accueil / Actions à traiter | Ce qui attend *mon* action, classé par urgence et par échéance | Tous |
| Synthèse | Quota → consommé → prévisionnel → restant, atterrissage, points d'attention | Cliente, agence |
| Besoins | Saisie en lot, liste, doublons et alertes, brouillons « à compléter » | RS, CVR, DR, agence |
| Propositions et décisions | Proposition agence, décision cliente, historique, comparaison avant / après | Cliente, agence |
| Activité terrain | Prévu vs réalisé, classement des secteurs, carte, prise de poste, remise du véhicule | Cliente, agence, DR, CVR |
| Territoires | Hiérarchie DR › CVR › RS › magasins, carte, « non géolocalisé » | DR, CVR, agence |
| Budget (réservé) | Budget, consommé, ajustements ; « Budget non renseigné » tant que D05 à D08 sont ouverts | Selon D08 |
| Qualité des données | 7 familles V4, quarantaine d'import, journal | Agence |
| Imports et exports | Pont Excel, contrôle avant envoi, journal | Agence |
| Paramètres | Référentiel, périmètres, quotas, langue | Agence, administrateurs |
| Administration | Utilisateurs, rôles, périmètres, journal d'audit | Administrateurs |

### Composants analytiques (à fournir dans une bibliothèque unique)
Barre de filtres (puces à libellé intégré), fil d'Ariane géographique, carte avec retour « France entière », tableau (en-têtes fixes, tri, pagination, export), graphiques à lecture textuelle alternative, jauge de quota avec cas « à définir » en gris, carte de chaleur, panneau détail latéral, info-bulle d'indicateur, bandeau de statut des données, comparateur avant / après, étiquette de statut, état vide actionnable.

## 5. Version mobile : parcours terrain courts

| # | Parcours prioritaire | Acteur | Étapes | Hors réseau |
|---|---|---|---|---|
| M-1 | Voir ma journée | Intervenant, RS | Liste des missions / sites du jour → détail | Lecture du dernier état synchronisé, daté |
| M-2 | Saisir l'activité du jour (par mission / site et par jour, D14 / Q18) | Intervenant | Choisir la mission → heures / quantités → vérifier → enregistrer | Brouillon local, « À synchroniser » |
| M-3 | Prise de poste puis remise du véhicule (deux événements, D11) | Intervenant | Deux actions distinctes, date et heure préremplies, modifiables et tracées | Idem |
| M-4 | Signaler une absence | Intervenant, RS | Catégorie générique → période → envoyer | Idem |
| M-5 | Saisir ou consulter un besoin | RS, demandeur | Magasin → période → quantité → brouillon ou envoi | Brouillon seul ; l'envoi attend le réseau |
| M-6 | Suivre ce qui attend ma validation | CVR, DR | Liste courte → ouvrir → valider ou refuser avec motif | Lecture seule hors réseau |

Règles mobiles : cibles tactiles de 44 px minimum ; un champ clavier adapté par type (numérique, date) ; pas de tableau large (cartes empilées) ; boutons d'action en bas d'écran ; **état de connexion toujours visible** (« En ligne · synchronisé 14:32 » / « Hors ligne · 3 à synchroniser » / « Conflit à résoudre ») ; jamais de perte silencieuse ; une action destructive demande confirmation et propose « Annuler ».

## 6. Écrans par rôle (sans exposer l'interdit)

| Rôle | Voit | Ne voit jamais | Écrans principaux |
|---|---|---|---|
| Direction cliente | Synthèse de son périmètre | Coûts internes agence, données personnelles inutiles | Accueil, Synthèse, Propositions |
| DR cliente | Son DR | Autres DR | + Territoires, Activité |
| CVR cliente | Son CVR | Coûts sauf habilitation (D08 : « Non communiqué » par défaut) | + Besoins, validation |
| RS / demandeur | Son secteur | Budgets nationaux | Besoins, Activité du secteur, mobile M-5 |
| Intervenant terrain | Ses missions | Budgets, autres intervenants | Mobile M-1 à M-4 |
| Agence opérateur | Besoins et ressources de la mission | Droits d'administration | Tout sauf Administration |
| Agence administrateur | Périmètre de la mission, paramètres | Données de l'organisation cliente hors mission | + Administration |
| Support plateforme (prestataire) | Journal technique, **sans** données métier par défaut | Contenu métier sauf accès tracé et justifié | Administration technique |

Principe de sécurité : le filtrage se fait **dans la couche de données**, jamais par masquage d'interface (test attendu : un appel avec le profil A ne renvoie aucune ligne hors périmètre). Un lien profond vers une donnée interdite affiche « Accès refusé », sans révéler l'existence de la donnée.

## 7. États d'interface (catalogue commun)

| État | Contenu obligatoire | Action proposée |
|---|---|---|
| Chargement | Squelette de la forme finale, pas de roue seule ; durée > 3 s : texte explicatif | Annuler / patienter |
| Aucune donnée | Cause (« aucun besoin sur ce périmètre » ≠ « filtre trop restrictif ») | Réinitialiser les filtres / créer |
| Erreur | Ce qui a échoué, si la saisie est conservée, code court pour le support | Réessayer |
| Accès refusé | Message neutre, rôle requis non détaillé à l'excès | Demander l'accès (si prévu) |
| Brouillon | Étiquette « Brouillon », exclu des totaux | Compléter / supprimer |
| Enregistrement | Confirmation datée, jamais seulement une couleur | Annuler si possible |
| Synchronisation | « À synchroniser » → « En cours » → « Synchronisé » + horodatage | Forcer / voir le détail |
| Conflit | Version locale contre version serveur, champ par champ, auteur et date | Garder la mienne / la leur / fusionner ; **aucun écrasement automatique** |
| Période clôturée | Message explicite, réouverture par l'agence seule (W12) | Contacter l'agence |
| Donnée fictive | Marqueur permanent « Démo » sur tout chiffre du démonstrateur | — |

## 8. Maquettes filaires (textuelles, à transformer en maquettes dans un lot dédié)

**Bureau · Synthèse**
```
┌ Suntory · [FR|EN] ───────────── Rôle : CVR · Périmètre : C01A ─ [Profil]┐
│ Accueil │ Synthèse │ Besoins │ Propositions │ Activité │ Territoires …   │
├─────────────────────────────────────────────────────────────────────────┤
│ Filtres : [Période ▾] [DR ▾] [CVR ▾] [Statut ▾]     [Réinitialiser]     │
│ Données : DÉMO · mises à jour 22/10/2026 14:32                          │
├──────────────┬──────────────┬──────────────┬────────────────────────────┤
│ Quota        │ Consommé     │ Restant      │ À traiter (4)              │
│ à définir ▒▒ │ Non chiffré  │ —            │ ⚠ 2 doublons · 1 brouillon │
├──────────────┴──────────────┴──────────────┴────────────────────────────┤
│ Carte (gauche)  │  Détail du secteur sélectionné (droite) + tableau     │
└─────────────────────────────────────────────────────────────────────────┘
```
**Mobile · Saisie du jour (M-2)**
```
┌──────────────────────────┐
│ ● Hors ligne · 3 à sync. │
│ ← Mission 2026-S43       │
│ Site : INT-001 / M-012   │
│ Date  [22/10/2026]       │
│ Heures [  7,5 ]  ⌨ num.  │
│ Commentaire (facultatif) │
│                          │
│ [ Enregistrer brouillon ]│
│ [  Envoyer (réseau)     ]│
└──────────────────────────┘
```
**Mobile · Conflit**
```
┌──────────────────────────┐
│ ⚠ Conflit sur « Heures » │
│ Mienne  : 7,5  (14:10)   │
│ Serveur : 8,0  (14:25)   │
│ [Garder la mienne]       │
│ [Garder le serveur]      │
│ [Voir le détail]         │
└──────────────────────────┘
```

## 9. PWA ou application native : comparaison sans présupposé

| Critère | Application web installable (PWA) | Application native / hybride | Ce qui tranche |
|---|---|---|---|
| Un seul code avec le site | Oui | Non (ou hybride avec limites) | Budget et maintenance |
| Distribution | Lien + « ajouter à l'écran d'accueil » | Magasins d'applications ou gestion de flotte | Parc et politique IT des intervenants (D14) |
| Hors ligne | Possible (cache, stockage local) ; limites de volume et d'éviction selon le navigateur — **à tester sur les appareils réels** | Plus robuste et contrôlable | Besoin réel en zone blanche |
| Notifications | Dépendent de l'OS et du navigateur ; comportement iOS **à vérifier sur la documentation officielle avant tout engagement** | Natives | Utilité réelle (relances) |
| Caméra, scan, géolocalisation | Disponibles sous conditions | Complets | Besoin de photo / scan non établi |
| Mises à jour | Immédiates | Passage par les magasins ou la flotte | Fréquence de changement |
| Sécurité de l'appareil | Limitée au navigateur | Coffre de l'OS, verrouillage applicatif | Sensibilité des données terrain (peu de données sensibles prévues) |
| Coût et délai | Plus bas | Plus élevé (comptes développeur, revues, tests par OS) — chiffres **non vérifiés** | Chiffrage lot B |
| Accessibilité | Bonne si standards respectés | Bonne, double effort | Tests lecteur d'écran |

**Recommandation motivée** : concevoir dès l'étape A une **interface web responsive, saisie hors ligne simulée, sans verrou technologique** (installable si possible). Ne pas décider PWA contre native avant d'avoir répondu à quatre questions : (1) quels appareils (personnels ou fournis, iOS / Android) ; (2) zones sans réseau fréquentes ou non ; (3) photo / scan / notifications nécessaires ou non ; (4) une gestion de flotte existe-t-elle ? Si la réponse est « appareils personnels, hors ligne ponctuel, pas de photo », la PWA suffit probablement ; sinon une couche native sera envisagée en lot B. **Choix non pris.**

## 10. Dépendances
- D14 / Q4 (terrain, hors ligne) ; D08 (visibilité des coûts) ; D25 / Q22 (logos, fonds de carte) ; D11 (statuts) ; D27 (FR / EN) ; accès à la charte officielle Suntory (non fournie).

## 11. Décisions attendues
| N° | Décision | Décideur |
|---|---|---|
| D30 | Retenir la direction « Suntory dominant, pas de rose, Inter auto-hébergée » | Cliente (via Impact) pour la charte, T. SOEFOU pour le principe |
| D31 | Fournir la charte officielle et préciser la présence de logos | Cliente |
| D32 | Questions terrain (appareils, zones blanches, photo / scan, flotte) pour trancher PWA ou native | Métier, IT, Impact |
