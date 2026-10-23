# Crédits des visuels (D163)

Version du 23/10/2026 (mise à jour lot A1e). Origine déclarée par T. SOEFOU : recherche Google, mot-clé Suntory. Droits non établis ; risque porté par le prestataire (D113, D152).

| Fichier fourni (dossier LOGOS) | Dimensions reçues | Usage | Versions dans `public/visuels/` |
|---|---|---|---|
| Nature, lac et chais (visuel C) | 2000 x 911 | Accueil, skin Nature | `nature-d-640/1280/1920.webp`, `nature-m-640/1215.webp` |
| Visuel produits (visuel A) | 2000 x 761 | Pilotage, skin Produits | `products-d-640/1280/1920.webp`, `products-m-640/1015.webp` |
| Forêt et cours d'eau (visuel B) | 1900 x 611 | Écran d'entrée | `forest-d-640/1280/1900.webp`, `forest-m-640/815.webp` |
| Logo Suntory Beverage & Food France | 1217 x 260 | En-tête | `logo-suntory-480/960.webp` |
| Logo Marvesting Group | 440 x 100 | Pied de page | `logo-marvesting-440.webp` |
| Bandeau sombre (extrait vidéo) | Non reçu | Non retenu (D160) | Aucune |

Conditions : démonstration seulement, dépôt privé, autorisation écrite d'Impact ou de la cliente ou remplacement avant diffusion ou mise en production.

## Traitement
- Les fichiers fournis restent en lecture seule, hors dépôt. Seules des versions WebP recadrées et allégées (qualité 72, logos 90 avec transparence) sont écrites dans `public/visuels/`, par `scripts/optimize-visuals.mjs` (`VISUELS_SOURCE=<dossier> node scripts/optimize-visuals.mjs`). Aucun original n'est copié tel quel.
- Aucun agrandissement : une largeur demandée au-delà de la source est ramenée à la largeur native. Les dimensions reçues sont plus petites que celles annoncées en première version de ce document (lac 5184 x 2362, forêt 2732 x 1280) : ce sont les fichiers reçus qui font foi.
- Recadrage mobile distinct (4:3, centré sur le sujet) : lac et chais, trois premiers produits et amorce du quatrième, cascade de la forêt.
- Aucune requête externe : tout est servi depuis `/visuels/`. Un test échoue sur toute image hors `public/visuels/` et sur toute adresse d'image externe dans le code.
