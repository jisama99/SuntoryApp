# SUNTORY REFONTE V3 · Prompt du lot A2a (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A1 validé par T. SOEFOU ; contrôles de A1 relancés au vert sur le poste.

```text
LOT A2a · RÈGLES PURES, ÉVÉNEMENTS, SAISIE UNITAIRE ET DUPLICATION

OBJECTIF
Écrire le cœur testable de la saisie des besoins : semaine ISO, cas W1 à W22, règles de doublon D1 à D7, journal d'événements, puis la saisie unitaire et la duplication d'un besoin. Aucune saisie en lot, aucun brouillon automatique, aucune échéance (lot A2b).

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/REGLES_SEMAINE_ET_DOUBLONS_V0.4.md : les 22 cas W1 à W22 et les 7 règles D1 à D7, extraits de
   REFONTE_V3/PROPOSITION CLEINTE VIA AGENCE/Refonte_V3_Plateforme_Pilotage_Live_Presentation_Cliente_V0.4.html
   (variables C.WEEKS et C.DUPS). Source de vérité des tests ; si une ligne te paraît incohérente avec la page
   d'origine, le signaler sans corriger.
4. docs/COMPLEMENTS_CADRAGE/16 (catalogue fonctionnel), 17 (données Excel), 26 (fonctions, événements, rapports),
   docs/PROMPTS/04_JEUX_ESSAI_ET_RECETTE.md (jeux d'essai des règles).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Modèle de données du besoin : proposer le schéma Zod et le type à partir de docs/DICTIONNAIRE_DONNEES.md et
   docs/STATUTS_ET_ETATS.md (neuf statuts validés), sans inventer de champ. Écarts listés dans le compte rendu.
2. Fixtures : étendre scripts/fixtures-core.ts (graine fixe) avec des besoins fictifs répartis sur les zones et sur
   plusieurs semaines, dont 2026-S53 et le passage à 2027-S01. C1 et C2 couvrent les nouveaux codes.
3. Semaine ISO : module pur (date vers semaine, S53, bascule d'année), tests table par table.
4. Cas W1 à W22 : un module pur et un test par cas, issus de la présentation V0.4. Les cas « à arbitrer » sont
   paramétrables et marqués comme tels.
5. Règles de doublon D1 à D7 : gravités selon la position D22 / Q7 (D1 et D7 bloquants, D2, D3, D5 alerte,
   D4 et D6 information), paramétrables. Lien vers le besoin existant ; fusion, ajustement ou confirmation.
6. Journal d'événements (D91) : type, acteur, zone, horodatage de l'horloge de démonstration, audience.
   Aucun événement sans audience.
7. Repository : lecture des besoins filtrée par périmètre, écriture d'un besoin, duplication, tous avec AccessContext.
8. Écrans : saisie unitaire et duplication pour le profil RS (et agence pour le compte d'un RS), liste des besoins du
   périmètre. Besoin incomplet = brouillon exclu des totaux. Messages et libellés en FR et EN.
9. Accessibilité : formulaires au clavier, erreurs associées aux champs, statuts avec forme et texte.
10. Captures : docs/captures/A2a/ (saisie, alerte doublon, correction de semaine, liste).

RÈGLES TRANSVERSES DU LOT (D132, D133)
Créer les composants communs DatePicker, DateRangePicker, WeekPicker et WeekdayPicker (règles 12 et 13) et le module pur des jours fériés. Dates de début et de fin de besoin, décalage de duplication : sélecteur de date. Champ `days` : cases à cocher LUN à DIM (docs/COMPLEMENTS_CADRAGE/28 §8), une ou plusieurs valeurs, au moins une, avertissement si aucun des jours cochés ne tombe dans la période. Test d'architecture contre type="date" et les champs de date en texte. Champ `campaign` renommé `dispositif`, nouvelle `campaign` rattachée à un seul dispositif (H1 validée, D128).

HORS PÉRIMÈTRE
Saisie en lot, collage, brouillon automatique, résumé avant soumission, échéances, blocage après échéance, propositions, indicateurs, import Excel, base de données, authentification réelle, commit, push.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- Gravités W et D : propositions de l'agence (Q7 de la V0.4), à confirmer avec la cliente.
- Q6 à Q8 (quotas, arbitrages) : paramètres par défaut proposés, non décidés.
- D22 / Q7 : position de gravité à confirmer avec la cliente.

CRITÈRES D'ACCEPTATION
1. typecheck, lint, test, test:e2e, build exécutés, sortie exacte reportée.
2. Tests table par table : W1 à W22 et D1 à D7, 2026-S53 et 2027-S01.
3. Un besoin incomplet ne peut pas être soumis ni compté dans un total ; une semaine clôturée refuse la modification.
4. Test inter-profils : un RS ne lit ni n'écrit hors de son périmètre ; chaque événement porte une audience.
5. Captures A2a, C1 à C7 relancés, docs/COMPTE_RENDU_A2A.md, mise à jour proposée du registre.
6. Aucun commit, aucun push.

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A2b. N'enchaîne pas.
```
