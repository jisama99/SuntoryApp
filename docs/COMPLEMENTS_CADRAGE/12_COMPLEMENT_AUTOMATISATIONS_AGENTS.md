# SUNTORY REFONTE V3 · Complément de cadrage n°3 : automatisations et agents installables

Version de travail du 22/10/2026 · Statut : **proposition du prestataire, aucun agent n'est installé, rien n'est validé**. Client : Suntory uniquement (les agents sont des outils de méthode, pas des données client).

> **Mise à jour du 22/10/2026** : les décisions de T. SOEFOU (charte mixte, intervenants non utilisateurs, IdP = agence, tri des agents) sont dans `14_DECISIONS_22-10_CHARTE_ACCES_AGENTS.md` et **prévalent** en cas de contradiction avec ce document.

> **Complément du 22/10/2026 (suite)** : voir aussi `15_DECISIONS_22-10_LOGOS_RS_BUDGETS_AGENTS.md` (logos, RS utilisateurs, chaîne managériale, budgets, agents adoptés).
Analyse faite en **lecture seule** sur `REFONTE_V3/agency-agents-main` et `REFONTE_V3/andrej-karpathy-skills-main`. Aucune commande d'installation ni de conversion n'a été lancée.

## 1. Existant vérifié : ce que contiennent réellement les deux dossiers

### 1.1 `agency-agents-main`
| Élément | Constat (lu) |
|---|---|
| Nature | Collection d'**agents sous forme de fichiers Markdown** (prompts de rôle) : environ 324 fichiers `.md` répartis en divisions (engineering 65, specialized 59, marketing 37, game-development 21, strategy 16, gis 13, security 12, design 10, testing 9, sales 9, project-management 7, finance 5, healthcare 3, etc.). Le décompte inclut aussi des documents annexes ; il n'a pas été séparé |
| Format d'un agent | En-tête YAML (`name`, `description`, `color`, `emoji`, `vibe`) puis consignes. **Aucun champ de restriction d'outils relevé dans les en-têtes lus** : un agent installé hérite des permissions de la session qui l'invoque |
| Langue | Consignes en anglais. Certains agents sont en rapport avec la France (ex. fichier sur le conseil en France) : **non lus**, rien n'est inféré |
| Scripts | `scripts/install.sh`, `convert.sh`, `lib.sh`, tests `test-*.sh`, contrôles (`check-*.sh`, `lint-agents.sh`), `build-hermes-plugin.py` |
| Cibles d'installation | `tools.json` liste 17 outils (claude-code, codex, gemini-cli, copilot, cursor, opencode, etc.). Pour Claude Code, `install.sh` **copie les agents dans `~/.claude/agents/`** (dossier utilisateur, portée globale à toutes les missions) ; options `--tool`, `--dry-run`, `--no-interactive`, variable `CLAUDE_CONFIG_DIR` |
| Suppression | `install.sh` contient des `rm -rf` limités à des dossiers de destination (gardes de chemin relevées) ; **aucune option de désinstallation relevée** : le retrait serait manuel (supprimer les fichiers copiés) |
| Réseau | Recherche de motifs `curl`, `wget`, `http` dans `install.sh`, `convert.sh`, `lib.sh`, `build-hermes-plugin.py` : **aucune commande réseau relevée**. Lecture non intégrale des scripts : à confirmer par relecture complète avant exécution |
| Licence | MIT (fichier `LICENSE`, « AgentLand Contributors »). Les dépendances des scripts (shell, Python) n'ont pas été auditées |
| Autres | README mentionne une application de bureau « Agency Agents » : **non analysée, non recommandée** à ce stade. `integrations/mcp-memory/setup.sh` : simple texte d'aide, installe **rien** ; demande un serveur de mémoire MCP à choisir par l'utilisateur. `SECURITY.md` présent |
| Non lu | Environ 310 fichiers d'agents, `lib.sh`, `convert.sh` en entier, `runbooks`, `strategy`, `examples`, tests |

Agents dont j'ai lu au moins l'en-tête (8) : Identity & Access Engineer (débuts), Minimal Change Engineer (débuts), UX Architect, Accessibility Auditor, Privacy Engineer, Secrets & Credential Hygiene Engineer (en-têtes), Code Reviewer et DevOps Automator (recherche ciblée seulement).

### 1.2 `andrej-karpathy-skills-main`
| Élément | Constat (lu) |
|---|---|
| Nature | **Quatre principes de comportement** pour un assistant de code, en texte : (1) réfléchir avant de coder (hypothèses explicites, signaler les ambiguïtés), (2) simplicité d'abord, (3) modifications chirurgicales, (4) exécution guidée par des critères vérifiables |
| Fichiers | `CLAUDE.md` (65 lignes), `skills/karpathy-guidelines/SKILL.md` (contenu identique en substance), `.claude-plugin/plugin.json` et `marketplace.json`, `.cursor/rules`, `CURSOR.md`, `EXAMPLES.md` (522 lignes, non relu), `README.md`, `README.zh.md` |
| Code exécutable | **Aucun script relevé** ; pas de dépendance |
| Licence | « MIT » **déclarée dans `plugin.json`** ; aucun fichier `LICENSE` présent dans le dossier : la licence est donc déclarée, pas documentée par un texte à conserver |
| Intérêt réel | Les principes recoupent ce que `CLAUDE.md` du projet impose déjà (hypothèse ≠ décision, pas de modification silencieuse, pas de sur-ingénierie). Apport net : le principe « critères de succès vérifiables avant d'agir » et le cadre « modifications strictement tracées à la demande » |
| Auteur du dépôt | Manifeste : « forrestchang » ; le nom Karpathy figure comme source d'inspiration (« derived from observations ») : **ce n'est pas un dépôt de M. Karpathy lui-même** d'après le manifeste |

## 2. Adaptation : réutilisable, à adapter, inutile, risqué

| Élément | Verdict | Motif |
|---|---|---|
| Principes karpathy (texte) | **Réutilisable** après reformulation en français | Courts, sans code, compatibles avec la méthode actuelle ; à attribuer (MIT déclarée) |
| Plugin / skill karpathy installé tel quel | **Inutile à ce stade** | Redondant avec `CLAUDE.md` ; ajoute une dépendance sans gain démontré |
| `.cursor/rules`, `CURSOR.md`, `README.zh.md` | Inutile | Autres outils / autre langue |
| `agency-agents` : installation complète (324 fichiers) | **Risqué : à ne pas faire** | Portée globale `~/.claude/agents` : s'applique à **toutes** les missions, dont Norton ; risque de mélange de clients (règle 1) ; surcharge de contexte ; aucun contrôle d'outils ; 90 % du contenu hors sujet (jeux, GIS, publicité…) |
| Agents ciblés, **copiés dans le dépôt du projet** après relecture intégrale | **À adapter** | Portée limitée au dépôt Suntory ; relecture et versionnement ; suppression simple |
| `convert.sh`, `install.sh`, application de bureau | Inutiles et risqués | Écrivent dans le profil utilisateur ; copier à la main est plus simple et plus sûr |
| `integrations/mcp-memory` | Inutile | Coquille vide ; la mémoire de mission existe déjà (project / mémoire) |
| `strategy`, `examples`, `runbooks` | Sans intérêt démontré | Non lus ; orientés démarrage d'entreprise / orchestration multi-agents |

Candidats d'agents à relire en entier **avant** toute adoption (aucun n'est adopté) :
| Agent | Intérêt pour Suntory | Phase |
|---|---|---|
| Minimal Change Engineer | Discipline de diff minimal, cohérente avec l'état « surgical changes » | A (dev) |
| Code Reviewer | Revue avant fusion | A |
| Accessibility Auditor | Contrôle WCAG et lecteur d'écran du démonstrateur (comble le manque du complément n°1) | A |
| UX Architect | Aide à structurer les jetons et composants | A (ponctuel) |
| Identity & Access Engineer, Secrets & Credential Engineer | Revue du modèle d'accès et de la gestion des secrets avant le lot B1 | B |
| Privacy Engineer | Relecture de la cartographie des données et de la conservation ; **ne remplace ni DPO ni juriste** | B |
Aucun de ces agents ne peut valider une décision métier, juridique ou contractuelle.

## 3. Trois familles d'usage à ne pas confondre

| Famille | Définition | Exemples | Risque principal | Règle |
|---|---|---|---|---|
| 1 · Aide au développement | Assistant qui lit / écrit le code du dépôt, sur le poste du prestataire | Revue, tests, documentation, rédaction de composants | Sur-modification, fuite de données via les entrées, dépendances | Portée projet, relecture humaine de chaque diff, aucune donnée réelle |
| 2 · Automatisations déterministes | Scripts et tâches planifiées à **règles explicites**, sans modèle de langage | Contrôle de structure Excel, détection de doublons, calcul des anomalies, relances par gabarit, sauvegardes, tests | Règle erronée, absence de supervision | Testées, versionnées, résultats reproductibles |
| 3 · Agents dans les opérations métier | Modèle de langage qui lit des données d'exploitation et propose / agit | Synthèse commentée, résumé des commentaires libres, classification | Données personnelles envoyées à un tiers, erreurs plausibles, action non voulue | **Interdit au démonstrateur** ; au MVP, lecture seule, sortie = brouillon validé par un humain, après AIPD et sous-traitant déclaré |

## 4. Cas d'usage évalués

| Cas | Besoin | Famille recommandée | Agent utile ? | Justification |
|---|---|---|---|---|
| Contrôle des fichiers Excel (structure, colonnes, formules, dates, version du contrat) | Fiabilité du pont Excel | **2** (règles du dossier `03_contrats Excel`) | Non | Règles déjà définies (W, D) ; un script est reproductible et testable |
| Détection d'anomalies (doublons, chevauchements, W12, W18, W21, magasins sans RS) | Qualité des données | **2** | Non | Règles explicites ; le modèle de langage n'apporte que des faux positifs |
| Tests (unitaires, parcours, accessibilité, FR / EN) | Recette | **2** (Vitest, Playwright, vérifications d'accessibilité automatisées) + 1 pour rédiger | Oui, pour *écrire* les tests | Exécution déterministe, rédaction assistée |
| Documentation | Dossiers, glossaire | **1** | Oui | Relecture humaine |
| Relances (besoins sans décision, absence non traitée, import en retard) | Délais | **2** : tâche planifiée + gabarit FR / EN + file « à envoyer » | Non | Message prévisible ; **l'agence valide l'envoi** au début |
| Supervision (erreurs, disponibilité, sauvegardes, échecs de synchronisation) | Exploitation | **2** (alertes) | Non | Seuils clairs |
| Préparation de synthèses (COPIL, points d'attention) | Gain de temps | **2** pour les chiffres, **3** (option) pour la rédaction | Option, plus tard | Chiffres calculés par code ; texte généré seulement sur **données agrégées**, brouillon relu, source et date indiquées |
| Résumé des commentaires libres (89 besoins sur 108 en contiennent) | Lecture rapide | 3 | **Déconseillé** | Risque d'informations de santé ou d'absence (Q8) ; AIPD préalable |
| Classification automatique de besoins / affectations | Productivité | — | **Non** | Décision métier : jamais autonome |

**Règle de simplicité** : tant qu'un agent ne démontre pas, sur des données fictives, un gain mesuré par rapport à un script ou une règle, on ne l'adopte pas.

## 5. Conditions d'installation (si un agent était adopté plus tard)

| Point | Famille 1 (développement) | Famille 2 (automatisation) | Famille 3 (métier) |
|---|---|---|---|
| Lieu | Poste du prestataire, dépôt du projet | Serveur de la plateforme (hébergeur retenu, D02 / D19) ou CI | Serveur dans l'UE, isolé |
| Installation | Fichiers copiés dans le dépôt (`.claude/agents/` du projet), **pas dans le dossier utilisateur** | Planificateur de tâches du serveur | Service dédié |
| Permissions | Lecture / écriture du dépôt ; **aucun accès** à `REFONTE_V3` réel hors lecture ciblée ; interdiction d'accès aux classeurs réels | Compte de service à droits minimaux (une base, une file, un dossier) | Lecture seule d'une vue agrégée |
| Secrets | Aucun dans le dépôt ; gestionnaire de secrets de l'hébergeur ou variables d'environnement | Idem, rotation et révocation | Clés propres, plafonds de dépense |
| Réseau | Sortant limité aux registres de paquets | Sortant limité à l'envoi de messages (hôte unique) | Liste blanche vers le fournisseur de modèle déclaré |
| Données accessibles | Fictives uniquement (étape A) | Données de la plateforme selon rôle de service | Agrégées et pseudonymisées |
| Maintenance | Versions épinglées, relecture des changements à chaque mise à jour | Tests de non-régression, journal | Évaluations périodiques, revue des sorties |
| Désinstallation | Supprimer les fichiers copiés (commit) | Désactiver la tâche, révoquer le compte | Révoquer les clés, purger les journaux |
| Contractuel | — | — | Fournisseur de modèle = **sous-traitant ultérieur** à autoriser par la cliente (D02 / D19) |

## 6. Garde-fous

| Garde-fou | Règle proposée |
|---|---|
| Validation humaine | Aucune notification externe, publication, décision, affectation ni suppression sans validation nominative. Au démarrage : tout est en « brouillon à valider » |
| Limites d'action | Droits en lecture par défaut ; l'écriture se limite à une file « propositions » ; pas d'accès aux comptes ni aux secrets ; volume maximal de messages par jour |
| Journalisation | Chaque exécution : qui / quoi a déclenché, entrées (référence, pas contenu), sortie, décision humaine, durée, version de la règle ou du modèle |
| Arrêt d'urgence | Un commutateur unique « suspendre toutes les automatisations » accessible à deux administrateurs ; jetons de service révocables séparément |
| Reprise après échec | Opérations idempotentes (rejouables sans doublon) ; file d'attente avec reprise ; alerte à l'échec ; compte rendu de ce qui a été fait / non fait |
| Traçabilité des règles | Chaque règle automatique renvoie à la ligne du registre qui la justifie |
| Revue | Revue trimestrielle des automatisations actives et de leurs sorties ; suppression de celles sans usage |
| Séparation des clients | Aucun agent installé de façon globale ; aucun contexte Norton accessible dans le dépôt Suntory |

## 7. Recommandation motivée

1. **Ne rien installer maintenant.** Les deux dossiers sont analysés ; aucun n'apporte un gain démontré pour l'étape A.
2. **Karpathy** : intégrer les quatre principes, reformulés et attribués, dans `CLAUDE.md` du dépôt (texte seulement, pas de plugin). Décision à prendre.
3. **agency-agents** : ne pas utiliser `install.sh`. À la rigueur, copier dans le dépôt Suntory trois ou quatre agents après relecture complète (Minimal Change, Code Reviewer, Accessibility Auditor), en portée projet, avec une période d'essai sur données fictives et un bilan.
4. **Automatisations déterministes d'abord** : contrôle Excel, anomalies, relances à valider, supervision. Elles constituent l'essentiel de la valeur.
5. **Agents métier (famille 3)** : report à après le démonstrateur, conditionné à D08, D18 (conservation, AIPD) et à l'autorisation du sous-traitant ultérieur.

## 8. Dépendances
D02 / D19 (hébergeur, sous-traitants) ; D18 (conservation, AIPD) ; D08 (visibilité) ; D21 (dépôt manuel ou SharePoint, source des fichiers) ; Q8 (commentaires libres) ; validation des règles W / D par la cliente.

## 9. Décisions attendues
| N° | Décision | Décideur |
|---|---|---|
| D38 | Intégrer les principes karpathy dans le `CLAUDE.md` du dépôt (texte, sans plugin) | T. SOEFOU |
| D39 | Autoriser (ou non) un essai de 3 à 4 agents copiés dans le dépôt, après relecture intégrale | T. SOEFOU |
| D40 | Famille 3 (agents métier) : confirmer le report après le démonstrateur et les conditions d'entrée | Impact, cliente, DPO |
| D41 | Premières automatisations à cadrer : contrôle Excel, anomalies, relances à valider, supervision | Impact, cliente |
