# Règles de mouvement et de mobile natif (proposition, validée le 27/10/2026 par T. SOEFOU)

Statut : **mise à jour proposée**, non inscrite au registre. Numéro de décision à attribuer par la revue (la série D230 à D233 est prise ; ne pas réutiliser D212 à D214).
Origine : reformulation pour ce projet de principes publics (dépôts `emilkowalski/skills`, licence MIT déclarée, et `anthropics/skills`). Aucun texte ni code copié ; aucune dépendance ajoutée. Les valeurs chiffrées reprennent les jetons déjà décidés (D159).

## 1. Mouvement (règle M)
| # | Règle | Contrôle |
|---|---|---|
| M1 | Tout mouvement a une raison : continuité spatiale, état, retour d'action ou changement brutal à adoucir. Sinon, pas de mouvement. | Revue |
| M2 | Aucune animation sur les actions clavier ni sur les actions très fréquentes (saisie rapide, tri, bascule de filtre répétée). | Revue |
| M3 | Durées d'interface : 150 à 250 ms (jetons D159), jamais plus de 300 ms sans justification écrite. Seule la boucle des squelettes est plus lente. | Test (jetons) |
| M4 | Courbe d'entrée et de sortie : `--ease-standard`. Jamais `ease-in` seul sur l'interface. | Test |
| M5 | Jamais de départ à `scale(0)` ; départ à 0,9 à 0,97 avec opacité. Fenêtres modales centrées ; menus et infobulles partent de leur déclencheur. | Test + revue |
| M6 | Jamais `transition: all` / `transition-all` : lister les propriétés. | Test |
| M7 | Animer `transform` et `opacity` ; une animation de mise en page (largeur, hauteur, marges) est un défaut signalé. | Revue |
| M8 | Mouvement interruptible : une animation déclenchée plusieurs fois repart de l'état courant (transition, pas keyframe relancée). | Revue |
| M9 | `prefers-reduced-motion` : le mouvement disparaît, l'information (couleur, opacité, texte) reste. | Test |
| M10 | Les effets de survol ne s'appliquent qu'au pointeur fin (`hover: hover`). Tailwind 4 le fait pour `hover:` ; ne pas l'écrire à la main en CSS brut sans cette condition. | Test |

Aucune animation ne remplace un état vide, de chargement, d'erreur ou de conflit (règle d'écran de CLAUDE.md).

## 2. Mobile natif (règle N), complète la règle 16
| # | Règle | Contrôle |
|---|---|---|
| N1 | Hauteur d'une coque d'application en `dvh` ; `svh` pour un bandeau d'accueil ; pas de `100vh`. | Test (écart connu : voir §4) |
| N2 | `viewport-fit=cover` et marges `env(safe-area-inset-*)` sur les barres fixes en haut et en bas. | Test à venir |
| N3 | Ne jamais bloquer le zoom. Champs de saisie à 16 px minimum de police. | Test |
| N4 | `touch-action: manipulation` sur les éléments tactiles ; état `:active` visible sur tout élément cliquable. | Revue |
| N5 | `overscroll-behavior: contain` sur les zones défilantes internes (panneaux, tiroirs, carte) ; pas de gestion JavaScript du rebond. | Revue |
| N6 | `user-select: none` seulement sur des commandes, jamais sur `body`. | Test |
| N7 | `theme-color` distinct pour clair et sombre. | Test à venir |
| N8 | Un défilement horizontal ou vertical imbriqué déclare son axe (`touch-action: pan-x`/`pan-y`) ou utilise l'accrochage natif. | Revue |
| N9 | Pas de détection par agent utilisateur ou par largeur d'écran pour décider du tactile : capacités (`pointer`, `hover`) uniquement. | Test |
| N10 | « Vérifié » exige un appareil réel (Safari iOS, Android, clavier ouvert, paysage). Sinon : « non vérifié sur appareil ». | Compte rendu |

## 3. Données « pire cas » (règle P, proposée, à valider avant exécution)
Jeu fictif rejoué par Playwright et par les captures, sans bouton dans l'application : noms de zone et de personne très longs, listes vides ou à un élément (« 1 membres » interdit : accord singulier/pluriel FR et EN), très gros volumes, textes anglais plus longs, valeurs absentes affichées « Donnée indisponible » (jamais 0). Contrôles à 320 px, zoom 200 %, mode sombre. Rapport avant correction.

## 4. Écarts connus au 27/10/2026 (mesurés par recherche dans `src`, non corrigés)
- `src/components/AppShell.tsx` : `min-h-screen` (N1).
- N2 et N7 : ni `viewport-fit`, ni marges `safe-area`, ni `theme-color` dans l'application.
- `touch-action`, `overscroll-behavior` : absents (N4, N5).
- Ces écarts touchent le comportement, pas le design (couleurs, typographie, composants, mise en page inchangés). Correction proposée dans un lot dédié « réglages tactiles », soumis à la règle de l'aperçu D104 (capture avant/après, FR et EN, 390 px et bureau, mode sombre).
