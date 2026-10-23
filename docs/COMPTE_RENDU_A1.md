# Compte rendu du lot A1 : socle, navigation par profil, i18n, accessibilité

Date : 23/10/2026. Aucun commit ni push. Données exclusivement fictives (`is_demo = true`).

## 1. Réalisé
| Bloc | Résultat |
|---|---|
| Socle | Next 16.4.2 (App Router, `src/proxy.ts`), React 19.3.1, TS 6.0.3 strict, Tailwind 4.3.3, Zod 4.6.7, next-intl 4.14.9, Vitest 5.0.5, Playwright 1.64.1, ESLint 10.13.0 |
| Charte mixte | Jetons `@theme` (Suntory dominant, rose Marvesting réservé à l'important et à la sélection, jamais à l'erreur) |
| Navigation par profil | 7 profils simulés, menu fourni par `repository.getMenu`, entrée hors menu = 404 |
| i18n | FR par défaut, EN, préfixe de langue toujours présent, clés FR/EN strictement identiques |
| Accessibilité | Lien d'évitement, focus 3 px visible, navigation clavier complète, mouvement réduit, contrastes testés |
| Aperçu | Bandeau de données fictives, bibliothèque de composants (page admin), 32 captures FR et EN dans `docs/captures/A1/` |
| Données | `Repository` (toutes les méthodes prennent `AccessContext`), implémentation en mémoire sur JSON validé Zod, 21 zones (3 DR, 6 CVR, 12 RS), 7 profils, 11 alertes |
| Alertes | `audience` obligatoire (agency, client, both), refus par défaut, filtrage dans la couche données |
| ZoneLabel | Seul chemin d'affichage d'un code de zone, verrouillé par test statique |

## 2. Non réalisé (hors périmètre A1, conforme au prompt)
- Aucune règle métier, aucun écran fonctionnel, aucune carte, aucune authentification réelle, aucun connecteur.
- Les écrans de sections (hors accueil, alertes, galerie admin) sont des gabarits « à venir ».

## 3. Contrôles
| Contrôle | Résultat |
|---|---|
| `npx tsc --noEmit` | OK, 0 erreur |
| `npx eslint .` | OK, 0 erreur, 0 avertissement (après correction d'un avertissement de test) |
| `npm test` (Vitest) | 8 fichiers, 86 tests passés, 1 ignoré |
| `npm run build` | OK, routes `/[locale]` et `/[locale]/[section]` dynamiques |
| `npm run test:e2e` | 20 tests passés sur 20 (dont un test d'absence de requête externe) |
| `npm run preview:shots` | 32 captures générées (profils, galerie de composants, alertes) |
| C1 codes fictifs | Passé (motifs de FIXTURES §3) |
| C2 `is_demo` | Passé (100 %) |
| C3 liste de refus locale | **Non exécuté** : `.denylist.local` absent. Test prêt, s'active dès que le fichier existe |
| C4 données personnelles | Passé (e-mails, téléphones FR, IBAN, codes postaux, domaines) sur src, messages, scripts, tests, configs. `docs/` exclu : il cite des exemples de motifs |
| C5 fichiers interdits | Passé sur l'index Git du dépôt et sur l'arborescence |
| Audience des alertes | Passé : rejet d'une audience manquante ou inconnue, défaut refus, aucune alerte « agency » renvoyée aux profils cliente |
| C7 historique Git | Passé sur `git log --all --name-only` (2 commits) |

Sorties détaillées : voir `npm test` et `npm run test:e2e` à relancer sur le poste.

## 4. Écarts et choix à connaître
- **Exécution dans une VM Linux (aarch64)**, pas sur le Mac de T. SOEFOU : `node_modules` n'est pas dans le dépôt, il faut lancer `npm install` puis `npx playwright install chromium` en local.
- Playwright : bibliothèque système `libXdamage` absente de la VM (sans accès root), contournée par extraction locale d'un paquet. Sans effet sur le Mac.
- ESLint 10 et TypeScript 6.0.3 compatibles avec Next 16.4.2 (config plate d'`eslint-config-next`). Essai de TypeScript 7 **non fait**.
- Télémétrie Next désactivée (variable `NEXT_TELEMETRY_DISABLED=1` et `next telemetry disable`).
- Icônes : Lucide (23 icônes), centralisées dans `icons.ts`, liste interdite testée (étincelles, baguette, robot, cerveau, bulle). Licences Lucide (ISC) et Inter (OFL, `@fontsource-variable/inter`) à lister dans le dossier de livraison.
- Police : Inter (fichier local, aucune requête vers un CDN). Écart possible avec Roboto si la charte l'impose : à trancher.
- Noms de fixtures de type « Prénom Démo » : à comparer avec FIXTURES §3 (« aucun nom propre »). Les prénoms de l'équipe fictive (Ulysse, Amel, Bastien, Clémence, Valentin, Zoé) sont génériques mais restent des prénoms.
- Horloge de démonstration figée au 23/10/2026 (semaine 2026-S43, calculée à la main).

## 5. Mise à jour proposée du registre (non enregistrée)
| Réf. | Objet | Proposition | Décideur |
|---|---|---|---|
| D118 | Menu par profil | Table de menus de `src/domain/menu.ts` (pas de Paramètres ni Administration côté cliente, pas de Budget pour le CVR, Administration réservée au prestataire) | T. SOEFOU |
| D119 | Format des dates en anglais | jj/mm/aaaa (en-GB) et semaine « W » : hypothèse à confirmer | T. SOEFOU, cliente |
| D120 | Cookie de simulation | `demo_profile_simule`, valeur `sim.<profil>`, réservé à la démonstration, à supprimer avant toute authentification réelle | T. SOEFOU |
| D121 | Police | Inter locale en attendant l'avis sur Roboto | T. SOEFOU, Impact |
| D122 | Noms de fixtures | Prénoms génériques acceptés ou remplacés par des libellés neutres (« Responsable 01 ») | T. SOEFOU |

## 6. Questions pour T. SOEFOU
1. Valider ou ajuster D118 à D122.
2. Créer `.denylist.local` (hachages SHA-256 des termes réels) pour activer C3.
3. Lancer `npm install`, `npx playwright install chromium`, puis `npm test` et `npm run test:e2e` sur le Mac pour confirmer l'équivalence avec la VM.
4. Référentiels d'accessibilité (WCAG/RGAA) et niveau ASVS à fixer avec Impact (D116).
5. Valider D107 et D108, restées « proposées ».

## 7. A1 bis : direction visuelle et mode sombre (D123, D124)
- Jetons ajustés : ombres diffuses, bordures discrètes, pile système Apple avec Inter en repli, jetons `link`, `title`, `focus`, `field` (bordure de champ 3:1).
- Mode sombre complet (Système, Clair, Sombre), cookie `demo_theme`, sans flash, sélecteur à trois boutons à côté de la langue.
- Modèle de page rapport dans la bibliothèque : titre-conclusion, trois chiffres clés, barres avec valeur écrite, note de lecture.
- Tests : contrastes vérifiés dans les deux modes (124 tests Vitest dont 1 ignoré), 22 tests e2e (dont thème Système et choix explicite), 36 captures (dont 4 en sombre).
- D125 : icônes harmonisées (gabarit `Icon`, pastille de menu 36 px, trait 1,75 en taille 20 px) et page A4 du modèle de rapport (captures `rapport_A4_fr.png`, `rapport_A4_en.png`, PDF intermédiaire non versionné). Tests : 127 Vitest (1 ignoré), 23 e2e, 38 captures.
- D126 : tuiles colorées (gabarit `Tile`, options A et C), tuiles de l'accueil (zones, alertes, semaine), suppression des traits décoratifs, test de règles de style. Tests : 162 Vitest (1 ignoré), 23 e2e, 38 captures.
- Écart : D118 à D122 restent proposées (voir §5). La police Inter devient un repli (D121 à ajuster).

## 8. Suite
Pas de chaînage automatique. Avant A0b/A2 : réponses ci-dessus, en priorité 1, 3 et 5.
