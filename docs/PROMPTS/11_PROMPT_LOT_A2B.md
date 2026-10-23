# SUNTORY REFONTE V3 · Prompt du lot A2b (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A2a validé.

```text
LOT A2b · SAISIE EN LOT, BROUILLON, RÉSUMÉ, ÉCHÉANCES ET BLOCAGE

OBJECTIF
Compléter la saisie : tableau multi-lignes et collage, brouillon automatique, résumé avant soumission, calendrier d'échéances paramétré par l'agence, alertes avant échéance, blocage après échéance et réouverture par l'agence (D78 à D82).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/24_ECHEANCES_DE_SAISIE_ET_ALERTES_V0.1.md (lecture complète), 16, 26 et 28 (§2, paramètres par dispositif).
4. docs/COMPTE_RENDU_A2A.md (règles et événements déjà posés).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Calendrier d'échéances : deux échéances par mois (saisie des besoins, demandes de changement), paramétrées par
   l'agence (D80). Preset Standard proposé (D82), non figé. Novembre : changements au plus tard la semaine indiquée par D80.
2. Blocage après échéance (D78) : côté données (Repository refuse l'écriture), pas seulement côté écran. Message explicite.
2 bis. Paramètres par dispositif (D128, docs/COMPLEMENTS_CADRAGE/28_CADRAGE_AXES_N1_N2_N3_N9_V0.1.md §2) : table de paramètres modifiable par l'agence seule (durée minimale, forfait kilométrique fictif étiqueté, fenêtre de saisie, délai de modification, rôles de saisie), règles P1 à P6 branchées sur le moteur de règles d'A2a, un dispositif par campagne, priorité du paramètre de dispositif sur le preset global, écran « Paramètres des dispositifs » avec historique. Aucune valeur en dur ; les valeurs du Workshop sont des valeurs de départ à valider.
3. Alertes (D79, D82) : J-5, J-2 et jour J, avec audience ; la cliente reçoit les alertes et résumés de retard dans
   son cockpit (D81) ; les alertes agence n'apparaissent jamais côté cliente.
4. Report des demandes tardives sur M+1 ; réouverture par l'agence seule ; seul le CVR demande une réouverture.
5. Saisie en lot : tableau multi-lignes, collage depuis un tableur, validation ligne par ligne avec les règles de A2a,
   rejets expliqués, aucune ligne perdue silencieusement.
6. Brouillon automatique (reprise après fermeture) et résumé avant soumission.
7. Écrans : lot, calendrier (agence), bannières d'échéance, résumé des retards. Textes FR et EN.
8. Captures : docs/captures/A2b/ (lot, blocage après échéance, alerte J-2, réouverture).

RÈGLES TRANSVERSES DU LOT (D132, D133)
Calendrier d'échéances, durée de réouverture et dates du tableau de saisie en lot : sélecteur de date (règle 12), jours désactivés avec raison. Colonne `days` du lot : WeekdayPicker en cellule, et collage de jours (LUN;MAR) accepté puis affiché en cases cochées. Paramètres par dispositif `days_allowed`, `horizon_weeks` et `non_working_days` (D145) : les règles W11 et W16 d'A2a lisent ces paramètres. Réouverture d'une semaine clôturée : agence seule, motif, durée, trace, sur demande du CVR (D82, D87, D147). Les gravités et interprétations d'A2a sont celles de D140 à D144.

HORS PÉRIMÈTRE
Propositions et décisions, indicateurs de pilotage, courriels réels (aucun envoi), import Excel, base de données, commit, push.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- Q-N9-1 à Q-N9-5 (doc 28 §7) : semaine « avant-dernière », jours calendaires ou ouvrés, rôle « CS », forfait kilométrique, nom du champ ; hypothèses H1 et H2 appliquées, étiquetées dans l'écran.
- D80 : date exacte de novembre à confirmer par T. SOEFOU ; paramètre fictif étiqueté.
- D82 est « proposée » : Standard, cascade et report sont des valeurs par défaut modifiables.
- Les courriels (rappel jour J, résumé du lundi) sont modélisés dans une file validée, sans envoi.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Test : P1 à P6, une fois chacune, et priorité dispositif / preset avec recul à la veille ouvrée.
2 bis. Test : après échéance, l'écriture est refusée par le Repository ; la réouverture par l'agence la rétablit ; un CVR ne peut pas rouvrir lui-même.
3. Test d'audience : aucune alerte agence dans un profil cliente, CVR, DR ou RS.
4. Saisie en lot : un lot partiellement invalide ne crée que les lignes valides et liste les rejets.
5. Captures A2b, C1 à C7, docs/COMPTE_RENDU_A2B.md, mise à jour proposée du registre.
6. Aucun commit, aucun push.

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A3. N'enchaîne pas.
```
