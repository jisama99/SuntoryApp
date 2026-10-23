# Glossaire métier FR / EN (D149)

Version du 23/10/2026. **Validé par T. SOEFOU le 23/10/2026** (recommandations retenues, sigles précisés). Toute évolution passe par une décision. Source de départ : `messages/fr.json` et `messages/en.json` (310 clés) complétées des termes à venir (budget, rapports, carte). Un terme validé ici est le seul autorisé dans l'interface, les exports, les e-mails et les alertes. Aucun tiret décoratif ni tiret d'incise dans les textes (D125).

## 1. Termes déjà dans l'application
| FR | EN proposé | Remarque |
|---|---|---|
| Besoin | Need | |
| Dispositif | **Scheme** | Validé. « Scheme » est déjà dans l'application ; « Campaign » reste réservé à campagne. |
| Permanent / Saisonnier / Merch horaire / Second placement | Permanent / Seasonal / Hourly merchandising / Second placement | Actuels |
| Campagne | Campaign | |
| Secteur | Sector | |
| Poste | Position | |
| Priorité | Priority | |
| Heures par semaine | Hours per week | |
| Période | Period | |
| Semaine (S43) | Week (W43) | Format S devient W en EN |
| Brouillon / Soumis / Validé | Draft / Submitted / Approved | |
| À traiter | To handle | |
| En retard | Late | |
| Prioritaire | Priority | Même mot que « Priorité », à lever dans les étiquettes |
| Alerte (Information, Attention, Risque) | Alert (Information, Attention, Risk) | |
| Agence / Cliente | Agency / Client | |
| Administrateur / Opérateur | Administrator / Operator | |
| Tableau de bord | Dashboard | |
| Propositions | Proposals | |
| Terrain | Field | |
| Paramètres / Administration | Settings / Administration | |
| Données fictives | Demo data | Actuel : « DEMO DATA » |
| Fusionner / Dupliquer | Merge / Duplicate | |
| Jour férié | Public holiday | Actuel : « Holiday » à vérifier |

## 2. Sigles de territoire
| FR | EN proposé | Remarque |
|---|---|---|
| DR (Directeur Régional) | DR (Regional Director) | Sigle conservé, développé au premier emploi |
| CVR (Chef des Ventes Régional) | CVR (Regional Sales Manager) | Idem |
| RS (Responsable Secteur) | RS (Sector Manager) | Idem |
| Zone | Zone | Un code de zone ne s'affiche que via ZoneLabel (D106) |
| Territoire | Territory | |

## 3. Budget (à venir, D153 à D158)
| FR | EN proposé | Remarque |
|---|---|---|
| Budget | Budget | |
| Enveloppe | Budget envelope | |
| Affecté | Allocated | |
| Consommé | Spent | « Actual » possible si le contexte est comptable |
| Prévisionnel | Forecast | |
| Atterrissage | Projected total | Validé (consommé retenu plus prévisionnel restant) |
| Disponible | Remaining | |
| Rallonge | Budget top-up | |
| Demande de rallonge | Top-up request | |
| Réallocation | Reallocation | |
| Budget retenu | Selected budget | |
| Budget non renseigné / Non chiffré | Budget not provided / Not costed | Jamais 0 |
| Mode présentation / administration | Presentation mode / Administration mode | |

## 4. Rapports et pilotage
| FR | EN proposé | Remarque |
|---|---|---|
| COPIL | Steering committee | Sigle COPIL à ne pas garder en EN |
| Rapport | Report | |
| Couverture | Coverage | Toujours avec numérateur et dénominateur |
| Objectif atteint | Target met | |
| Dans la cible | On target | |
| Recrutement | Recruitment | |
| Affectation | Assignment | |
| Plan d'action | Action plan | |
| Fiche secteur | Sector profile | |
| Écart | Variance | |
| Semaine N / N-1 | Week N / N-1 | |

## 4 bis. Navigation, identité et notes (D160 à D162)
| FR | EN | Remarque |
|---|---|---|
| Pilotage merchandising | Merchandising steering | Titre de l'application |
| Mon cockpit | My cockpit | Accueil |
| Pilotage | Steering | Tableau de bord |
| Besoins merch | Merch needs | |
| Réponses de l'agence | Agency responses | |
| Équipes terrain | Field teams | |
| À traiter | To handle | Alertes |
| Réglages | Settings | |
| Gestion de la mission | Mission management | |
| Vos besoins en merchandising | Your merchandising needs | |
| Skin d'accueil : Produits, Nature, Sobre | Home theme: Products, Nature, Plain | |
| Note interne | Internal note | Agency only |
| Partagée avec la cliente | Shared with the client | |
| Partagée avec | Shared with | Destinataire DR, CVR ou RS |
| Notes | Notes | |

## 4 quater. Interactions communes (D181, proposées par A2b, validées le 23/10/2026)
| FR | EN | Remarque |
|---|---|---|
| Annuler | Undo | Annulation après écriture |
| Modification annulée | Change undone | Confirmation après annulation |
| Enregistré | Saved | |
| Fermer | Close | |
| Trier le tableau | Sort table | |
| Raccourcis clavier | Keyboard shortcuts | |

## 4 ter. Signalement (D164)
| FR | EN | Remarque |
|---|---|---|
| Signaler un problème | Report a problem | |
| Demandes | Requests | Écran de suivi |
| Bug / Plantage | Bug / Crash | |
| Fonctionnalité demandée | Feature request | |
| Parcours à refaire | Flow to rework | |
| Texte ou traduction | Text or translation | |
| Gravité : Bloquant, Gênant, Mineur | Severity: Blocking, Disruptive, Minor | |
| Reçue, En cours, Corrigée, Livrée | Received, In progress, Fixed, Delivered | Statuts |
| Étapes pour reproduire | Steps to reproduce | |
| Résultat attendu | Expected result | |

## 5. Formats (D119)
- Dates : FR 23/10/2026, EN 23 Oct 2026 ou format régional défini dans `format.ts`.
- Nombres : FR 1 234,5 (espace fine insécable, virgule), EN 1,234.5.
- Devise : FR 1 234 €, EN €1,234.
- Semaines : FR 2026-S43, EN 2026-W43.

## 6. Décisions prises le 23/10/2026
1. Dispositif : Scheme.
2. Atterrissage : Projected total.
3. Sigles : DR Directeur Régional, CVR Chef des Ventes Régional, RS Responsable Secteur.
4. Reste du tableau : validé.
