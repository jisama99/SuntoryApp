# Plan des jeux d'essai fictifs · Lot A0

Date : 23/10/2026 · **Plan seulement : rien n'est généré.** Base : `04_JEUX_ESSAI_ET_RECETTE.md` (22/10), complétée par D90 à D103. Toutes les données seront fictives.

## 1. Constats qui changent le plan

| # | Constat | Conséquence |
|---|---|---|
| F-1 | Les codes de DR, CVR et RS cités par la présentation V0.4 (glossaire, rubrique DR/CVR/RS) sont **des codes réels** ; ils ne sont pas recopiés ici | Les fixtures **n'emploient aucun de ces codes**. Codes fictifs à motif distinct (voir §3). 04_JEUX_ESSAI proposait de reprendre les trois codes de DR de la V0.4 : à corriger. |
| F-2 | Le profil de démo « Intervenant terrain » (04) contredit D42 : aucun compte intervenant | Remplacer par « RS saisissant pour le compte d'un intervenant » ; les intervenants n'existent que comme références `INT-nnn` |
| F-3 | Les tests W1–W22 et D1–D7 citent « la présentation V0.2 » ; le contenu à jour est dans la **V0.4** (C.WEEKS, C.DUPS, lus aujourd'hui : W1 à W22, D1 à D7, gravités B/A/I) | Écrire les tests table par table depuis la V0.4 |
| F-4 | Le registre a ajouté événements (D91), entonnoir (D92), retours arrière (D97), photos (D98–D103), échéances (D78–D82) | Volumes complémentaires proposés au §2 (ajouts marqués « ajout A0 ») |
| F-5 | `.gitignore` ne bloque ni `.js`, ni `.json`, ni les images | Contrôles C3 et C5 (§5) |

## 2. Volumes

| Entité | Volume (04) | Ajout A0 | Particularités à provoquer |
|---|---|---|---|
| DR | 3 | | Un DR avec 3 CVR (sélection multiple) |
| CVR | 6 | | |
| RS | 12 | | Un secteur sans besoin |
| Magasins | 40 | | 3 sans rattachement, 2 sans géolocalisation |
| Besoins | 25 | +5 | Cas du tableau 04 §2 ; ajout : un besoin par état d'entonnoir D92 (6) |
| Périodes | non fixé | ~35 | P1 et P2, 2026-S53 et 2027-S01 |
| Propositions | 10 | | Une révisée après accord ; ajout : un refus puis nouvelle proposition (D97) |
| Absences | 6 | | Catégories génériques, aucun motif de santé |
| Utilisateurs de démo | 7 | | Voir §4 |
| Événements métier (journal D91) | — | ~80 | Générés par les parcours, pas saisis à la main ; horloge de démonstration fixe |
| Instantanés hebdomadaires | — | 8 | Pour R-01 et les tendances (A4c2) |
| Photos fictives | — | 12 | A5b : images **générées** (formes et textures), sans marque ni personne ; 4 cas rejetés (visage fictif simulé, floue, doublon, enseigne non autorisée) |
| Enseignes fictives | — | 5 | Dont 1 « photos non autorisées » (D101) |
| Échéances mensuelles | — | 3 | Une passée (saisie bloquée D78), une en cours, une à venir (J-5/J-2) |

Règles : codes en texte ; dates ISO ; semaine avec année ISO (`2026-S53`) ; montants affichés « Démo » ; références `INT-001`, `MAG-DEMO-001` ; chaque entité porte `is_demo: true`.

## 3. Conventions de codes fictifs (proposition)

| Entité | Motif | Exemple |
|---|---|---|
| DR | `DR-` + lettre grecque en toutes lettres | `DR-ALPHA` |
| CVR | `CVR-` + 2 lettres + 2 chiffres | `CVR-QX01` |
| RS | `RS-` + 4 caractères alphanumériques tirés d'un alphabet sans voyelles | `RS-K7M2` |
| Magasin | `MAG-DEMO-` + 3 chiffres | `MAG-DEMO-014` |
| Enseigne | Noms inventés évidents | « Enseigne Test 1 » |
| Intervenant | `INT-` + 3 chiffres | `INT-004` |

Noms propres : aucun. Libellés géographiques : zones inventées (« Zone Nord-Test »). Coordonnées : points placés dans une zone **océanique ou fictive** dans un fond neutre, jamais des coordonnées de magasin réel. Décision à prendre : fond de carte du démonstrateur (D25 ouvert, aucun fond sous licence non confirmée).

## 4. Profils de démo (7, révisés)

| Profil | Voit | Ne voit jamais |
|---|---|---|
| Direction cliente | Synthèse de son périmètre | Coûts internes agence |
| DR cliente | Son DR | Autres DR |
| CVR cliente | Son CVR | Coûts (« Non communiqué » par défaut, D08 ouvert) |
| RS | Son secteur, saisie des besoins (D44) et de la saisie terrain pour le compte de l'intervenant (D42) | Budgets nationaux |
| Agence (opérateur) | Besoins et ressources de la mission | Droits d'administration |
| Agence (administrateur) | Périmètre de la mission, paramètres | Données hors mission |
| Prestataire (administrateur technique) | Paramètres, journaux de démonstration | Rien de plus que l'administrateur, **pas de donnée réelle par construction** |

Test : un appel à la couche de données avec le profil A ne retourne aucune ligne hors périmètre, même si l'écran ne l'affiche pas.

## 5. Génération et preuve qu'aucune valeur réelle n'est entrée

### 5.1 Génération
- Un script TypeScript versionné `scripts/generate-fixtures.ts` (lot A1), **déterministe** : générateur pseudo-aléatoire avec graine fixe écrite dans le script. Même graine, mêmes fichiers (comparaison d'empreinte en test).
- Sortie dans `src/data/fixtures/*.json`. Aucune lecture de classeur, aucune lecture de `REFONTE_V3` par le script.
- Photos fictives : images générées par code (SVG converti, ou PNG synthétique), sans appareil photo ni photo de stock.
- Fichiers Excel du lot A6 : `import_ok`, `import_erreurs`, `import_ancien`, générés par script, avec feuille de métadonnées (contrat, empreinte, date d'observation) ; **déposés hors Git** si le `.gitignore` bloque `*.xlsx` (c'est le cas) : script versionné, fichiers produits à la demande.

### 5.2 Preuve par contrôles (à exécuter, aucun ne l'est aujourd'hui)

| # | Contrôle | Méthode | Qui l'exécute | Limite |
|---|---|---|---|---|
| C1 | Motifs d'identifiants | Test Vitest : tout identifiant respecte les motifs du §3 | Claude Code (lot A1) | Prouve la forme, pas l'absence de valeur réelle |
| C2 | Marqueur `is_demo` | Test : 100 % des entités l'ont à `true` | Claude Code | Idem |
| C3 | **Balayage par empreintes** | Script local `tools/build-denylist` (**hors dépôt**, exécuté par T. SOEFOU) lit les sources réelles, normalise les valeurs (codes, noms de magasin, noms de personne, montants) et écrit des **empreintes SHA-256** dans un fichier **non versionné** (`.denylist.local`). Un test du dépôt hache chaque valeur des fixtures et échoue si une empreinte correspond | T. SOEFOU construit la liste ; Claude Code lance le test sans jamais lire les classeurs | Les valeurs à faible entropie (codes courts) sont devinables à partir d'empreintes : le fichier ne doit **jamais** être versionné ni partagé |
| C4 | Motifs sensibles | Recherche de courriels, numéros de téléphone, IBAN, codes postaux à 5 chiffres, noms de domaine dans tout le dépôt | Claude Code | Faux positifs attendus ; liste d'exceptions justifiée |
| C5 | Fichiers interdits | Échec si un fichier `.xlsx/.xlsm/.xls/.csv/.pdf` ou un fichier portant `data_real`, `ref_reel`, `ref_magasins`, `communes_`, `_pack` est suivi par Git | Claude Code | Dépend de la mise à jour du `.gitignore` (écart E19) |
| C6 | Aucune requête externe | Parcours Playwright qui échouent sur toute requête hors serveur local | Claude Code | Ne couvre que les parcours joués |
| C7 | Historique Git | Avant tout premier commit : balayage de l'index ; après : balayage de l'historique | Claude Code | Un secret commité est à purger, pas à masquer |
| C8 | Relecture humaine d'un échantillon | T. SOEFOU relit 10 % des fixtures tirées au hasard | T. SOEFOU | Subjectif |

Résultat attendu au compte rendu de chaque lot : « C1 à C7 : exécutés ou non exécutés », jamais « conforme » sans exécution.

## 6. Cas de test minimaux à produire (liste, pas de code)
- Besoins : doublon exact D1, chevauchement D2, inclusion D3, contiguïté D4, même magasin deux secteurs D5, même intitulé D6, ligne importée déjà présente D7.
- Semaines : W1 à W22 table par table ; dates repères vérifiées aujourd'hui : 28/12/2026 = lundi, 2026-S53 ; 04/01/2027 = lundi, 2027-S01 ; 2027 compte 52 semaines.
- Statuts : prise de poste et remise du véhicule séparées ; recrutement finalisé sans poste démarré ; refus puis retour à « En recrutement » avec compteur (D97).
- Argent : coût inconnu → « Non chiffré » ; budget absent → « Budget non renseigné » ; jamais 0.
- Terrain : saisie par RS pour le compte d'un intervenant (D42) ; période clôturée refusée.
- Import (A6) : même lot deux fois ; fichier renommé au même contenu ; retour ancien ; formule dans un champ texte ; fichier trop volumineux.
- Photos (A5b) : import sans autorisation d'enseigne refusé (D101) ; métadonnées retirées ; purge à horloge simulée (D102).
- i18n : même parcours FR puis EN ; aucune clé manquante ; codes métier identiques.
