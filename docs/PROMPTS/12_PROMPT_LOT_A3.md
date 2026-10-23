# SUNTORY REFONTE V3 · Prompt du lot A3 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A2b validé.

```text
LOT A3 · PROPOSITIONS, DÉCISIONS, QUI DOIT AGIR, ENTONNOIR

OBJECTIF
Le circuit besoin, proposition, décision, visible par chaque acteur : statuts séparés, proposition versionnée, décision liée à une version, qui doit agir, urgence, entonnoir de recrutement et délais par situation.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/STATUTS_ET_ETATS.md (neuf statuts, règle de facturation à partir de la prise de poste), docs/COMPLEMENTS_CADRAGE/16 et 26.
4. Décisions D90 à D97 (entonnoir, « Pourvu » = poste démarré, délais par situation, Réattribué, Stoppé avec motif, Zone blanche).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Statuts séparés : besoin, proposition, recrutement, exécution (jamais un statut unique), conformes à STATUTS_ET_ETATS.md.
2. Proposition versionnée ; une décision est liée à une version ; un changement d'élément déterminant invalide
   la décision précédente.
3. Prise de poste et remise du véhicule : deux événements distincts (position D11), table de correspondance des
   anciens statuts provisoire.
4. « Qui doit agir », date limite, niveau d'urgence, retard de proposition ; validation en lot.
5. Entonnoir de recrutement : étapes, délais mesurés par situation (même jour, une heure plus tard, réattribution,
   personne en zone blanche), jamais une moyenne unique. Stoppé exige un motif. Zone blanche exclue du taux d'heures pourvues.
6. Événements émis à chaque transition avec audience (alimentent R-01 en A4c2).
7. Écrans : fil du besoin, proposition, décision, tableau « à traiter » par rôle. Textes FR et EN.
8. Captures : docs/captures/A3/ (besoin vers proposition vers décision, refus puis nouvelle proposition).

RÈGLES TRANSVERSES DU LOT (D133)
Date de prise de poste, remise du véhicule et dates limites de décision : sélecteur de date (règle 12).

HORS PÉRIMÈTRE
Indicateurs et tableau de bord (A4a), enveloppes (A4b), exports, terrain, photos, import Excel, base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- Table de correspondance des anciens statuts : à valider avec la cliente (D11).
- D93 à D97 : valeurs de délai à confirmer ; le modèle les mesure sans seuil figé.
- Scission optionnelle A3a (propositions, décisions) puis A3b (entonnoir) si la session devient trop longue : la signaler plutôt que de bâcler.

NOTES (D162, F-20.10) : fil de notes sur les propositions et décisions, puis réutilisable sur les autres objets ; visibilité choisie à chaque note (Interne agence, Partagée avec la cliente, Partagée avec un destinataire DR, CVR ou RS), interne par défaut, badge de visibilité, confirmation avant partage, retrait avec trace, audience par défaut refusée, événement au journal, absence des exports cliente ; tests d'audience.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Scénarios testés : refus, modification après accord, remplacement, deux propositions sur un besoin ; aucun accord obsolète conservé silencieusement.
3. Jamais un statut unique : besoin, proposition, recrutement et exécution évoluent séparément.
4. Test d'audience sur tous les événements et alertes émis.
5. Captures A3, C1 à C7, docs/COMPTE_RENDU_A3.md, mise à jour proposée du registre.
6. Design et navigation (règles 14 à 16, D151, D159) : chaque écran du lot a son état dans l'URL (retour arrière, rechargement, lien profond testés), ses trois états (squelette, vide, erreur), ses tableaux en cartes sous 640 px, ses transitions sobres, sa confirmation annulable après écriture, ses cibles de 44 px ; aucune valeur de style en dur ; seuils de performance mesurés et reportés (2 s, 100 ms) ; captures 390 px.
7. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A4a. N'enchaîne pas.
```
