# SUNTORY REFONTE V3 · Prompt du lot A5b (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A5 validé.

```text
LOT A5b · PHOTOS TERRAIN SUR IMAGES FICTIVES

OBJECTIF
Fonction photos sur images générées : import simulé, pré-contrôles réels sur fixtures, validation par l'agence, galerie, retrait, purge à horloge simulée. La page photos du COPIL lit ces fixtures.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/27_FICHE_DE_FONCTION_PHOTOS_TERRAIN_V0.1.md (lecture complète), décisions D98 à D103.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Images fictives générées par script déterministe (rayons, actions de merchandising, aucune personne).
2. Import par RS, CVR ou agence ; pré-contrôles (format, taille, personnes détectables simulées, protection à l'import).
3. Validation par l'agence avant toute utilisation ; autorisation par enseigne (D101).
4. Galerie par périmètre ; retrait ; purge selon une durée de conservation fixée par Impact (D102), paramètre fictif, horloge simulée.
5. Événements avec audience ; aucune donnée EXIF ni identifiant réel conservé.
6. Captures : docs/captures/A5b/.

HORS PÉRIMÈTRE
Photos réelles, stockage externe, reconnaissance d'image réelle, base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D101 (enseignes autorisées) et D102 (durée de conservation) : à fixer par Impact.
- Droits d'image : aucune photo réelle dans le dépôt.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Test : une photo non validée n'apparaît dans aucun profil cliente ni export ; la purge supprime fichier et métadonnées.
3. Aucun fichier image réel (C5) ; captures A5b, C1 à C7, docs/COMPTE_RENDU_A5B.md.
4. Design et navigation (règles 14 à 16, D151, D159) : chaque écran du lot a son état dans l'URL (retour arrière, rechargement, lien profond testés), ses trois états (squelette, vide, erreur), ses tableaux en cartes sous 640 px, ses transitions sobres, sa confirmation annulable après écriture, ses cibles de 44 px ; aucune valeur de style en dur ; seuils de performance mesurés et reportés (2 s, 100 ms) ; captures 390 px.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant la seconde démonstration. N'enchaîne pas.
```
