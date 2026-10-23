# SUNTORY REFONTE V3 · Prompt du lot A4d (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A3, A4a et A5 validés. Lot de la seconde démonstration (hors noyau du 10/11, D110).

```text
LOT A4d · FICHE SECTEUR UNIQUE ET PLANS D'ACTION SUR DÉPASSEMENT

OBJECTIF
Un écran par secteur qui réunit besoins, propositions, absences, consommation, alertes, historique et actions (F-10.13), puis des plans d'action rattachés aux alertes de dépassement (F-10.15). Décisions D127 et D129 (cadrage dans docs/COMPLEMENTS_CADRAGE/28_CADRAGE_AXES_N1_N2_N3_N9_V0.1.md §4 et §5).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D130 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/28 (cadrage complet), 22 (charte), 23 (détail secteurs), 24 (alertes), 16 (F-10.13 à F-10.15).
4. docs/COMPTE_RENDU_A3.md, A4A, A5 (données et composants déjà posés), src/components/ReportTemplate.tsx et Tile.tsx.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Fiche secteur en lecture seule : un bloc par thème (identité, besoins, propositions, absences, consommation, alertes,
   historique), chacun avec état vide et état d'erreur ; réutilise les indicateurs d'A4a sans recalcul.
2. Accès par `AccessContext` : un secteur hors périmètre renvoie « introuvable » sans fuite d'information ; RS son secteur,
   CVR ses secteurs, DR les siens, agence tout, cliente selon D08 (par défaut refus des montants).
3. Règles : « Non chiffré » jamais à 0 ; zone blanche en ligne séparée ; pas de quota de secteur (D85) ; absences en
   catégories génériques côté cliente ; secteurs classés, jamais les personnes.
3 bis. Filtre Dispositif et Campagne (doc 28 §2 ter) appliqué à chaque bloc de la fiche : un secteur se lit par campagne sans perdre le total.
4. Liens d'entrée : classement des secteurs, alertes, tableau de bord. Modèle ReportTemplate, rendu A4 (D125).
5. Plans d'action (F-10.15) : objet `action_plan` (alerte, secteur, responsable par rôle, description limitée, échéance,
   statut Ouverte / En cours / Faite / Abandonnée avec motif, audience, journal). Méthodes du Repository avec
   AccessContext : créer, modifier, clôturer, lister. Aucune suppression. Avertissement « aucune donnée personnelle
   ou médicale » à la saisie, longueur limitée, pas de pièce jointe.
6. Alerte de retard d'action à J+1 ouvré (audience both), une relance au plus par action et par jour. Aucun envoi réel.
7. Écrans : fiche, bouton « Ajouter une action » sur l'alerte (rose autorisé), « Mes actions à traiter » sur le tableau
   de bord. Textes FR et EN, mode sombre.
8. Captures : docs/captures/A4d/ par profil, FR et EN, clair et sombre, plus rendu A4.

RÈGLES TRANSVERSES DU LOT (D133)
Échéance d'un plan d'action : sélecteur de date, jours non ouvrés désactivés (règle 12).

HORS PÉRIMÈTRE
Édition des besoins depuis la fiche, carte, photos terrain, comparaison entre secteurs, e-mails réels, fil de commentaires,
suivi du coaching, contrôle qualité des visites, vivier, base de données, commit, push.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- Q-N1-1 : visibilité des montants au secteur pour la cliente (D08 ouvert) : refus par défaut.
- Q-N3-1 : qui crée une action sur un dépassement de la cliente : CVR, DR, agence par défaut.
- D05 à D07 : montants fictifs étiquetés.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Test par profil de ce qui est visible et masqué sur la fiche ; secteur hors périmètre = « introuvable » sans fuite.
3. Test d'audience : aucune alerte ni action d'audience agency côté cliente, y compris dans les données chargées par la page.
4. Test : un coût manquant ne devient jamais 0 ; écriture d'action refusée hors périmètre par le Repository ; suppression impossible ;
   relance unique par action et par jour.
5. Règles de style toujours vertes (aucun trait décoratif, aucun tiret dans les textes, rose seulement sur les actions) ; contrastes testés.
6. Captures A4d, C1 à C7, docs/COMPTE_RENDU_A4D.md, mise à jour proposée du registre.
7. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A6. N'enchaîne pas.
```
