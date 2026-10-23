# SUNTORY REFONTE V3 · Prompt du lot A5 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A3 validé (A4a recommandé).

```text
LOT A5 · TERRAIN MOBILE ET ABSENCES GÉNÉRIQUES

OBJECTIF
Montrer le parcours terrain sans promettre le hors ligne définitif : missions du jour, saisie par RS, CVR ou agence pour le compte de l'intervenant (pas de compte intervenant, D42), validation, signalement d'absence en catégories génériques.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. Décision D42, D14 et D15 (ouvertes), docs/COMPLEMENTS_CADRAGE/16 et 26, docs/STATUTS_ET_ETATS.md.
4. Vocabulaire : les RS pilotent le personnel de merchandising recruté ; ce personnel travaille en magasin, pas les RS.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Parcours mobile 390 px d'abord : missions du jour, saisie au grain mission, site et jour (site, date, heures effectuées,
   anomalie), résumé avant envoi, états « à synchroniser » et « synchronisé » simulés (aucun hors ligne réel).
2. Validation par le RS ou l'agence ; période clôturée refuse la saisie avec message explicite.
3. Absences : catégories génériques, sans motif de santé ni nom côté cliente ; statuts Déclarée, Remplacement en cours,
   Couverte, Non couverte.
4. KPI d'absence : jours d'absence, jours sans couverture, taux de couverture, délai de remplacement, valorisation fictive,
   avec leurs définitions affichées.
5. Cibles tactiles d'au moins 44 px, lisibilité en plein soleil (contraste), mode sombre vérifié.
6. Événements émis avec audience ; aucune donnée personnelle côté cliente.
7. Captures : docs/captures/A5/ en 390 px (parcours complet) et 1440 px (validation).

RÈGLES TRANSVERSES DU LOT (D133)
Dates de début et de fin d'absence, dates de remplacement : DateRangePicker (règle 12).

HORS PÉRIMÈTRE
Photos (A5b), notifications push réelles, hors ligne réel, géolocalisation réelle, comptes intervenants, import Excel, base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D14 et D15 (hors ligne, périmètre mobile) ouvertes : tout est simulé et étiqueté ainsi.
- Q19 : à relire avec D42 ; le compte rendu liste les écarts.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Aucun champ de motif médical dans le modèle, les fixtures ni les écrans (test statique).
3. Une période clôturée refuse la saisie ; test inter-profils sur les absences.
4. Captures A5, C1 à C7, docs/COMPTE_RENDU_A5.md, mise à jour proposée du registre.
5. Design et navigation (règles 14 à 16, D151, D159) : chaque écran du lot a son état dans l'URL (retour arrière, rechargement, lien profond testés), ses trois états (squelette, vide, erreur), ses tableaux en cartes sous 640 px, ses transitions sobres, sa confirmation annulable après écriture, ses cibles de 44 px ; aucune valeur de style en dur ; seuils de performance mesurés et reportés (2 s, 100 ms) ; captures 390 px.
6. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A6. N'enchaîne pas.
```
