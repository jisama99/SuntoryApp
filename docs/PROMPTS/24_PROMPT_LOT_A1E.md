# Lot A1e : identité visuelle, titres, skin d'accueil (D160, D161, D163)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`. Dépend de A2b. Placé avant A3.

LECTURES : CLAUDE.md, docs/DECISIONS.md (D113, D118, D123 à D126, D149 à D152, D159 à D163, D182), docs/GLOSSAIRE_FR_EN.md (section 4 bis), docs/COMPLEMENTS_CADRAGE/30_DIRECTIVES_UX_UI_V0.1.md, le dossier LOGOS (lecture seule, fichiers fournis par T. SOEFOU).

ÉTAPES
1. Titres : titre de l'application et menus selon D160 et le glossaire ; reformuler les titres d'écran existants en termes d'action ; mêmes clés fr.json et en.json ; test i18n.
2. Visuels : copier dans `public/visuels/` des versions optimisées (WebP 640, 1280, 1920 px, recadrage mobile distinct) du lac (accueil), des produits (pilotage), de la forêt (connexion), sans toucher aux originaux ; aucune requête externe ; chargement prioritaire de l'image d'accueil ; texte lisible (contraste testé) grâce à un voile ; mode sombre avec voile renforcé.
3. Écran de choix de profil (page d'entrée) avec le visuel de connexion, sans zoom excessif, version mobile en feuille qui chevauche la photo.
4. Accueil et pilotage : visuels fondus dans la page (dégradé vers le fond), logo Suntory en en-tête, Marvesting discret en pied ; barre de menu du bas sur mobile, cibles de 44 px.
5. Skin d'accueil (D161) : Produits, Nature, Sobre ; défaut fixé par l'agence dans Paramètres ; choix utilisateur par le sélecteur d'affichage ; sauvegarde dans le profil simulé ; test d'audience (aucun accès à Paramètres côté cliente, D118).
6. Crédits : docs/CREDITS_VISUELS.md avec l'origine déclarée (recherche Google, mot-clé Suntory), droits non établis, usage démonstration (D163).
7. Textes affichés (D182) : retirer des écrans toute référence interne (numéros D…, « Lecture A » ou « B », nom du prestataire, « Hypothèse Hn ») ; aligner la carte « Rouvrir sans demande » sur la largeur de sa voisine dans le calendrier des échéances ; remplacer l'icône provisoire `src/app/icon.svg` par une icône issue du logo.
8. Captures docs/captures/A1e/ (FR et EN, 1440 et 390 px, clair et sombre).

CRITÈRES
1. Commandes de contrôle exécutées, sortie reportée.
2. Poids des images mesuré (accueil sous 250 Ko en mobile), premier affichage utile sous 2 s (D151) reporté.
3. Aucun fichier d'origine copié hors public/visuels ; aucune requête externe.
4. Tests : i18n, style, contraste du texte sur visuel, audience du skin.
5. docs/COMPTE_RENDU_A1E.md, mise à jour proposée du registre.
6. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

Récapitule en dix lignes maximum. N'enchaîne pas.
