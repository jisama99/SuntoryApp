# SUNTORY REFONTE V3 · Prompt du lot A4c1 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A4a et A4b validés.

```text
LOT A4c1 · MOTEUR DE REPORTING ET COPIL (PPTX ET PDF) SUR DONNÉES FICTIVES

OBJECTIF
Moteur de reporting paramétrable : catalogue de diapositives, graphiques sélectionnables ou proposés automatiquement, pages de détail, COPIL mensuel et trimestriel, exports PPTX et PDF paysage, annexe Excel des valeurs.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/20, 22 (les deux versions), 23, 25, 26 et le dossier PROTOTYPE_COPIL ; skills pptx et pdf disponibles pour la mise en forme.
4. Décisions D61, D62, D69 à D71, D75, D83, D95.

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Session 1 : moteur et gabarit COPIL SANS logos ni photo de couverture réels (droits D25, D75 non levés), trame
   minimale à environ 70 % de la trame Marvesting (D70).
2. Catalogue de pages et de graphiques ; choix du type (secteurs, anneaux, barres...) ou proposition automatique selon
   les données ; formes arrondies par défaut ; graphique natif modifiable en option par page ; valeurs toujours en annexe Excel.
3. Mêmes libellés de zone (ZoneLabel) et mêmes règles d'audience que l'interface ; coûts exclus sauf décision de l'agence.
4. Réglages de mise en page, titres, photo de couverture, pages : réservés aux profils agence ; CVR et DR voient les
   rapports de leur zone ; l'agence peut publier des rapports dans l'application.
5. Rapports sur données fictives avec bandeau fictif ; logo orange Marvesting retiré des exports (logo Suntory seul, à intégrer
   en session 2 quand D25 est levé).
6. Aperçu des pages dans l'application ; captures : docs/captures/A4c1/.

HORS PÉRIMÈTRE
Envoi automatique de rapports, boucles d'automatisation (A4c2), cartographie, logos réels tant que D25 est ouvert, base de données, commit, push.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D61 et D69 : gabarit COPIL réel non fourni ; trame minimale en attendant.
- D25 et D75 : droits des logos et de la photo de couverture.
- D83 : à relire avant la session 2.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2. Les PPTX et PDF générés s'ouvrent et sont rendus en images pour contrôle visuel de chaque page.
3. Test d'audience : aucun contenu agence dans un export cliente ; coûts absents par défaut.
4. Captures A4c1, C1 à C7, docs/COMPTE_RENDU_A4C1.md, mise à jour proposée du registre.
5. Aucun commit, aucun push.

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A4c2. N'enchaîne pas.
```
