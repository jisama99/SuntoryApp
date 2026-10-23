# SUNTORY REFONTE V3 · Prompt du lot A6 (prêt à coller)

Version du 23/10/2026. À coller dans Claude Code dans l'ordre : `02_PROMPT_MAITRE_DEV.md`, `07_REGLES_COMMUNES_LOTS_APRES_A1.md`, puis ce prompt, dans le dépôt `08_PLATEFORME_SUNTORY_V3`, avec `REFONTE_V3` en lecture seule. Prérequis : A2 validé (A2a et A2b).

```text
LOT A6 · IMPORT EXCEL EN QUARANTAINE ET PROFILS D'IMPORT CONFIGURABLES (FICHIERS FICTIFS)

OBJECTIF
Démontrer le pont temporaire (position D04 / Q20) : import de fichiers fictifs, aperçu avant validation, rapport, idempotence, refus d'écraser en cas de conflit de version.

À LIRE AVANT TOUTE ACTION (dans cet ordre)
1. CLAUDE.md, docs/DECISIONS.md (registre complet, D105 à D126 en particulier), docs/COMPTE_RENDU_A1.md.
2. docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md (déjà collé), docs/PROMPTS/03_LOTS_DEV.md (section du lot),
   docs/PLAN_A1_A7.md, docs/GLOSSAIRE.md, docs/FIXTURES.md, docs/DICTIONNAIRE_DONNEES.md, docs/STATUTS_ET_ETATS.md.
3. docs/COMPLEMENTS_CADRAGE/29_CADRAGE_IMPORTS_CONFIGURABLES_V0.1.md (lecture complète, D134), docs/FIXTURES_EXCEL.md, docs/STRUCTURE_FICHIER_BRANCHE.md, docs/MAPPING_SOURCES.md, docs/COMPLEMENTS_CADRAGE/17 et 19.
4. docs/PROMPTS/04_JEUX_ESSAI_ET_RECETTE.md (trois gabarits d'import).

ÉTAPES (chacune : critère de réussite énoncé avant, vérification après)
1. Choix de la bibliothèque de lecture Excel (point P4) : licence, lecture sans macro ni lien externe, absence de requête
   réseau ; décision justifiée au compte rendu. Les fichiers d'essai sont générés (jamais de classeur réel).
2. Lecture : contrat commun du fichier (empreinte, version du contrat, provenance fichier, onglet, ligne).
2 bis. Profils d'import configurables (D134, doc 29) : signature de structure, détection de l'onglet, de la ligne d'en-tête et du bandeau de groupes, colonne désignée par groupe + libellé normalisé + rang, correspondances avec chaîne de transformation, sensibilité S0 à S3 par colonne (S2 exclue par défaut), tables de valeurs, jointures interne, vers référentiel et entre fichiers avec taux de rapprochement, proposition automatique de correspondances avec score expliqué et validation humaine, détection de dérive de structure. Traitement local et déterministe.
2 ter. Table opération vers dispositif (D136) : écran d'administration de l'agence, opération inconnue = ligne bloquée et proposée au rattachement, jamais rattachée automatiquement. Profils d'import gérés par l'agence en mode administration seule (D137).
2 quater. Statuts (D138) : une source de référence par dimension, le statut de mission LOGA est en lecture seule avec date d'extraction, toute divergence avec la plateforme produit une alerte d'écart d'audience agence sans correction automatique. File « à rapprocher » (D139) : codes magasin textuels, suggestion par ville et adresse, confirmation par l'agence seule, rapprochement mémorisé, ligne non rapprochée comptée sous « Magasin non rapproché ».
2 quinquies. Générateur de variantes fictives (colonnes réordonnées, renommées, supprimées, ajoutées, bandeau absent, en-tête décalée, doublons d'en-tête, colonnes vides) et mesure de reconnaissance reportée au compte rendu, sans seuil inventé.
3. Aperçu : créations, modifications, inchangés, rejets, conflits ; validation humaine ; rapport téléchargeable.
4. Idempotence : un lot réimporté ne crée aucun doublon ; fichier renommé au même contenu reconnu ; retour ancien refusé.
5. Conflit de version : refus d'écraser, présentation des deux versions.
6. Sécurité : formule dans un champ texte neutralisée, fichier trop volumineux refusé, aucune macro exécutée.
7. Un import agence ne modifie jamais une décision cliente ; un retour cliente ne modifie jamais un coût agence.
8. Événements émis avec audience ; écrans FR et EN ; captures : docs/captures/A6/.

HORS PÉRIMÈTRE
Import de fichiers réels, branchement à un classeur de production, écriture vers SharePoint, export Excel complet (A4c1 pour les exports), base de données.

BLOCAGES CONNUS (ne pas les combler : signaler et travailler sur l'hypothèse indiquée)
- D51 (mécanisme du fichier branché) et D24 (sources absentes, onglet 4C vide) : fichiers fictifs seulement.
- Hébergement du fichier connecté (D02 / D19) ouvert : aucune hypothèse d'hébergeur.

CRITÈRES D'ACCEPTATION
1. Commandes de contrôle exécutées, sortie reportée.
2 ter. Tests : un import ne modifie jamais une décision cliente, une proposition ni un poste ; divergence de statut = alerte agence seule ; pseudo-code jamais rapproché sans confirmation ; ligne non rapprochée présente dans les totaux.
2 bis. Tests : reconnaissance sur variantes, en-têtes en double distingués, colonne S2 jamais persistée côté cliente, jointure non rapprochée mise en attente, dérive de structure signalée à l'agence seule, détection par contenu et non par nom de fichier.
2. Tests : idempotence, fichier renommé au même contenu, retour ancien, formule dans un champ texte, fichier trop volumineux.
3. Aucune requête réseau pendant l'import (test Playwright).
4. Captures A6, C1 à C7, docs/COMPTE_RENDU_A6.md, mise à jour proposée du registre.
5. Aucun commit sur main, aucun push de main, aucune pull request. En fin de lot, après le compte rendu, commit et push de la branche de session uniquement (D148).

FIN DE LOT
Récapitule en dix lignes maximum : ce qui est prêt, ce qui bloque, ce que tu attends de moi avant A7. N'enchaîne pas.
```
