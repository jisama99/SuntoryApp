# SUNTORY REFONTE V3 · Prompt du lot A4b1 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A3 validé. A4a dépend de ce lot.

```text
LOT A4b1 · ENVELOPPE CLIENTE, ALLOCATION AGENCE ET PRÉVISIONNEL PAR BESOIN

OBJECTIF
Poser la chaîne budgétaire (D153) sur données fictives : la cliente saisit l'enveloppe, elle descend à l'agence, l'agence l'alloue, et chaque besoin porte un coût estimé qui compte en prévisionnel.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D157 en particulier : D153 à D157), docs/COMPTE_RENDU_A2A.md et A2B.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé, règles 12 à 15), docs/PROMPTS/03_LOTS_DEV.md (section du lot), docs/PLAN_A1_A7.md, docs/DICTIONNAIRE_DONNEES.md, docs/FIXTURES.md.
3. docs/COMPLEMENTS_CADRAGE/16 (F-50.1, F-50.6, F-50.8, F-50.9), 28 (dispositif et campagne), 29 (imports).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Modèle : enveloppe (cliente, période, version, date), allocation (dispositif, campagne, DR, CVR), tarif fictif étiqueté. Tout passe par le Repository avec AccessContext.
2. Domaine unique de calcul : budget affecté, consommé, prévisionnel, atterrissage (consommé retenu plus prévisionnel restant), disponible. « Budget non renseigné » et « Non chiffré » jamais à 0 ; couverture avec numérateur et dénominateur.
3. Espace cliente : saisie de l'enveloppe, version et date. Espace agence : voit l'enveloppe, ne la modifie pas ; alloue en mode administration ; le total réparti ne peut jamais dépasser l'enveloppe.
4. Prévisionnel par besoin : coût estimé (heures, semaines, taux fictif) imputé à la maille du besoin ; un changement de périmètre déplace l'imputation (mutations datées).
5. Besoin au-delà du disponible : autorisé avec alerte à la cliente et à l'agence, puis arbitrage, jamais bloqué (D156) ; événement au journal.
6. Poste pourvu : le prévisionnel devient consommé (branché sur l'état des postes de A3).
7. Journal : événements avec audience et motif pour toute modification ; coûts masqués par défaut côté cliente selon l'audience.
7 bis. Couche de jetons des graphiques (D213 et D214 proposées, validées le 24/10/2026, docs/propositions/PROPOSITION_JEUX_COULEURS_GRAPHIQUES_V0.1.md et PROPOSITION_STYLES_GRAPHIQUES_V0.1.md) : les jauges, barres et répartitions de l'enveloppe lisent des jetons de graphique (séries 1 à 6, série clé, neutre, rayons, forme des bouts) définis dans un fichier de jetons dédié avec le jeu B et le style Doux par défaut, variantes du mode sombre comprises ; aucune couleur ni forme en dur. Les réglages (Paramètres, sélecteur d'affichage), les jeux A et C et les styles Exécutif et Directionnel sont livrés par A4a, qui complète cette couche. Statuts ok, alerte, danger hors des jeux.
8. Anglais et navigation (règles 14 et 15) ; captures docs/captures/A4b1/.

HORS PÉRIMÈTRE
Réallocation à double validation et rallonges (A4b2), écran de pilotage (A4a), import des budgets réels (A6, D155), moteur financier réel, exports.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D07 : montants réels ; montants fictifs uniquement.
- Accès du DR et du CVR au mode présentation : non décidé.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Tests : total réparti borné par l'enveloppe ; l'agence ne peut pas modifier l'enveloppe cliente ; un besoin au-delà du disponible crée une alerte sans blocage ; prévisionnel devenu consommé au pourvoi ; tout est tracé.
3. Test d'audience : aucun coût ni alerte agence dans un profil cliente, CVR ou DR sans droit.
4. Captures A4b1, C1 à C7, docs/COMPTE_RENDU_A4B1.md, mise à jour proposée du registre.
5. Design et navigation (règles 14 à 16, D151, D159) : chaque écran du lot a son état dans l'URL (retour arrière, rechargement, lien profond testés), ses trois états (squelette, vide, erreur), ses tableaux en cartes sous 640 px, ses transitions sobres, sa confirmation annulable après écriture, ses cibles de 44 px ; aucune valeur de style en dur ; seuils de performance mesurés et reportés (2 s, 100 ms) ; captures 390 px.
6. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A4a. N'enchaîne pas.
```
