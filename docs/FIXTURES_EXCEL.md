# FIXTURES_EXCEL · lot A0b (V0.1 du 23/10/2026)

Jeux **fictifs** pour tester l'import / export Excel de l'étape A. Aucune valeur réelle ; codes de `FIXTURES.md` (DR-ALPHA, CVR-QX01, RS-K7M2, MAG-DEMO-014, INT-004). Les fichiers .xlsx seront **générés par script** en A2a (rien n'est produit ici).

## 1. Jeux prévus
| Fichier | Contenu | Attendu |
|---|---|---|
| `import_ok.xlsx` | 20 lignes BESOINS valides (3 campagnes, 7 codes zone fictifs, dates dans les bornes) | 20 importées, 0 alerte |
| `import_ancien.xlsx` | même contenu, en-têtes en variantes (accents, casse, espaces) | 20 importées ; en-têtes normalisés |
| `import_erreurs.xlsx` | 7 cas ci-dessous | voir §2 |
| `export_attendu.xlsx` | export de référence depuis l'état `import_ok` | comparaison octet-à-octet des valeurs (pas des styles) |
Chaque classeur contient un onglet MÉTADONNÉES : `schema_version`, `generated_by`, `fictif = oui`, date.

## 2. Cas d'erreur (`import_erreurs`)
| # | Cas | Résultat attendu |
|---|---|---|
| 1 | `need_code` en double | **blocage** de l'import |
| 2 | en-tête en double | **blocage** |
| 3 | campagne inconnue | **blocage** |
| 4 | cellule en erreur (`#REF!`) dans un montant | **refus du fichier entier**, rien modifié (R8) |
| 5 | texte non numérique dans un montant | erreur comptée, bloquante |
| 6 | valeur hors liste (priorité « PRIO 9 ») | **alerte non bloquante** |
| 7 | date en texte non reconnu | date absente + alerte |
Cas complémentaires : date hors bornes, `weekly_hours` hors liste, ligne avec `candidate_phone` renseigné dans un fichier destiné à la cliente (doit être **exclu** de l'export).

## 3. Contrôles de recette
- Aucun nom ni téléphone réel, vérifié par le contrôle C3 (`.denylist.local`, non versionné).
- Rejouer deux fois le même import ne duplique rien (idempotence).
- L'export « cliente » ne contient aucune colonne d'audience `agency`.
