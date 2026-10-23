# SUNTORY REFONTE V3 · Prompt du lot A4a (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A3 validé.

```text
LOT A4a · LECTURE, INDICATEURS, ALERTES ET TABLEAU DE BORD PAR RÔLE

OBJECTIF
Lecture d'un coup d'œil sur données fictives : tableau de bord par rôle, actions à traiter, indicateurs, alertes d'échéance, cockpit cliente, classement des secteurs, filtres. Les graphiques suivent la direction visuelle D123 à D126 (tuiles, formes arrondies).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/22 (charte), 24 (échéances), 25 (choix des graphiques), 23 (détail régions, secteurs, magasins), 28 (§3, comparaison N / N-1).
4. src/components/Tile.tsx et ReportTemplate.tsx (modèle de page rapport).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Choix de la bibliothèque de graphiques en début de lot (point P3) : comparer au moins deux options (licence, poids,
   accessibilité, rendu arrondi, absence de requête externe), décider avec justification dans le compte rendu.
   Sans bibliothèque adaptée : formes dessinées en SVG et CSS, valeurs toujours lisibles en texte.
2. Tableau de bord par rôle : actions à traiter, indicateurs du périmètre, fraîcheur des données. Tuiles par famille
   d'indicateur, tuile d'ancrage pour le résultat principal, rose réservé à l'action.
3. Couleurs de quota paramétrables ; quotas permanent et saisonnier « à définir » en gris (Q6 sans réponse) ;
   barre d'alerte segmentée, clic = filtre. Pas de quota par secteur (quota au niveau DR et CVR).
4. Classement des secteurs (pas des personnes). Filtres DR, CVR (multiple), RS, campagne, période ; vues enregistrées.
4 ter. Lecture analytique par dispositif et par campagne (docs/COMPLEMENTS_CADRAGE/28 §2 ter) : filtre hiérarchique Dispositif puis Campagne appliqué à tous les écrans de lecture et aux exports, vue « Par campagne » avec sous-totaux, réconciliation des totaux, groupe « Sans campagne », « Non applicable » et « Budget non renseigné » jamais à 0.
4 bis. Comparaison semaine N / N-1 (D127, F-10.14, docs/COMPLEMENTS_CADRAGE/28_CADRAGE_AXES_N1_N2_N3_N9_V0.1.md §3) : bascule sur les tuiles et le tableau, variation en valeur et en pourcentage, « Non comparable » si N-1 absente ou non chiffrée, jamais 0, S01 comparée à la dernière semaine ISO de l'année précédente. Étendre la fixture déterministe à deux semaines consécutives sans modifier les valeurs existantes.
5. Chaque indicateur : période, périmètre, unité, définition, date de calcul, détail selon les droits.
6. « Non chiffré » et « Budget non renseigné » jamais à 0 ; couverture avec numérateur et dénominateur ; lignes sans
   géolocalisation dans « Non géolocalisé » et dans les totaux. Montants fictifs étiquetés (D05 à D07 ouverts).
7. Cockpit cliente : alertes et résumés de retard, personnalisé (salutation par prénom, périmètre) ; une alerte
   agence n'apparaît dans aucun profil cliente, CVR, DR, ni dans un e-mail, ni dans un rapport.
8. Écrans lisibles en mode sombre ; alternative tableau pour chaque graphique.
9. Captures : docs/captures/A4a/ par profil concerné.

RÈGLES TRANSVERSES DU LOT (D131, D133)
Filtre de période : DateRangePicker et WeekPicker ; comparaison N / N-1 : choix de la semaine N au WeekPicker. Comparatif de campagnes côte à côte (doc 28 §2 ter) : deux ou trois campagnes choisies, mêmes indicateurs, écart par rapport à la première colonne, « Non comparable » entre unités incompatibles.

HORS PÉRIMÈTRE
Enveloppes et réallocation (A4b), exports PPTX et PDF (A4c1), cartographie, photos, import Excel, moteur financier réel, base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D05 (définition du consommé) : montants fictifs étiquetés, aucun moteur réel.
- Carte : hors lot (plan dans docs/CARTOGRAPHIE.md), tableau des zones à la place.
- P3 (bibliothèque de graphiques) : décidée dans ce lot, validée ensuite par T. SOEFOU.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Test : S01 2027 contre S53 2026, N-1 manquante, N-1 non chiffrée, division par zéro, aucun montant côté RS.
2 ter. Test : somme des campagnes = total du dispositif = total global ; « Sans campagne » inclus ; le filtre s'applique à chaque écran et à l'export.
2 bis. Test : un coût manquant ne devient jamais 0 ; une ligne sans géolocalisation reste dans les totaux.
3. Test d'audience : aucune alerte agence côté cliente, y compris dans les données chargées par la page.
4. Contrastes des nouvelles couleurs testés dans les deux modes ; règles de style toujours vertes.
5. Captures A4a, C1 à C7, docs/COMPTE_RENDU_A4A.md, mise à jour proposée du registre.
6. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A5. N'enchaîne pas.
```
