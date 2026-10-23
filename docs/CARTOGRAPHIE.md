# Cartographie : approche et sources (lot A1)

Statut : cadrage uniquement. Aucun code de carte, aucun fichier de découpe lu ni versionné dans ce lot.

## 1. Principe
- La carte affiche des **zones fictives** (DR, CVR, RS) en démonstration publique, et la **découpe réelle** seulement en local sur le poste du prestataire (D109, conditions D109 bis).
- Toute zone s'affiche via `ZoneLabel` (libellé · responsable · code, D106). La carte n'est jamais un second chemin d'affichage des codes.

## 2. Sources publiques envisagées
| Besoin | Source | Statut | À vérifier |
|---|---|---|---|
| Référentiel des communes | COG INSEE (code officiel géographique) | Public | Millésime à figer, licence ouverte |
| Rattachement commune vers zone | Table d'appartenance fournie par la cliente (découpe) | Hors dépôt | Accord Impact et cliente |
| Contours des communes ou départements | Jeu de contours ouvert, embarqué localement | À choisir | Licence et attribution (D25) |
| Fond de carte | Aucun fond distant : contours embarqués seulement | Décision proposée | Pas de tuiles tierces, donc aucune requête externe |

## 3. Importeur générique de la découpe locale (D109 bis)
- Variable d'environnement : `SUNTORY_GEO_PATH` (**nom à confirmer**), chemin local vers le fichier de découpe.
- Lecture seule, schéma validé par Zod, rejet explicite si colonnes inattendues (colonnes attendues : voir `MAPPING_SOURCES.md`).
- Jamais versionné : le motif du fichier doit figurer dans `.gitignore` et dans le test C5.
- Aucune valeur de la découpe dans les journaux, captures, prompts, fixtures ou messages d'erreur.
- Bandeau distinct « DONNÉES RÉELLES LOCALES » (différent du bandeau fictif), à cadrer en lot suivant.
- Démonstration à la cliente sur le poste du prestataire uniquement.

## 4. Découpage en lots proposé
1. Contours embarqués et licence levée (D25), composant carte en lecture seule sur fixtures fictives.
2. Importeur générique de découpe locale, tests sur un fichier synthétique.
3. Bandeau données réelles locales et garde-fous (refus de démarrage si la variable pointe dans le dépôt).
4. Interactions (survol, sélection de zone, filtres), accessibilité (alternative tableau obligatoire).

## 5. Points ouverts
- Accord d'usage de la découpe (Impact, cliente).
- Licence des contours (D25 / Q22).
- Nom définitif de la variable d'environnement.
- Alternative accessible : tableau des zones équivalent à la carte (exigence WCAG/RGAA à fixer avec Impact, D116).

## 6. Mise à jour du 23/10/2026 (D152)
- Accords agence et cliente déclarés obtenus : usage de la découpe et D25 (cartographie) levés.
- Source locale : dossier « FICHIERS POUR DEPARTEMENTS », hors dépôt (COG 2025, codes postaux, découpe, listing magasins, table d'appartenance). Il ne contient pas de contours géométriques : un jeu ouvert est à embarquer en A4e.
- Reste ouvert : nom de la variable d'environnement, jeu de contours retenu, trace écrite de l'accord.
