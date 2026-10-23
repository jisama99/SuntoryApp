# Agents du projet SUNTORY REFONTE V3 (portée : ce dépôt uniquement)

Copiés le 22/10/2026 depuis `agency-agents-main` (licence MIT, texte dans `LICENSE_agency-agents.txt`). **Non installés dans le profil utilisateur** (`~/.claude/agents`) ; non exécutés. Décision D39 : adoption conditionnée à la vérification de fiabilité faite le 22/10/2026 (voir `docs/COMPLEMENTS_CADRAGE/15_...`).

## Garde-fous appliqués à chaque copie
- Champ `tools` ajouté : **audits et revue en lecture seule** (`Read, Grep, Glob`) ; les quatre agents de développement ont en plus `Edit, Write`. **Aucun agent n'a `Bash` ni accès réseau.**
- Bloc « Cadre projet Suntory » prioritaire : Suntory seul, français, recommandations (jamais de validation), sources en lecture seule, pas de donnée réelle.
- Corps d'origine **inchangé** ; empreinte SHA-256 de l'original dans le commentaire de provenance de chaque fichier.

## Développement
| Fichier | Rôle |
|---|---|
| `engineering-minimal-change-engineer.md` | Diffs minimaux |
| `engineering-code-reviewer.md` | Revue par lot (lecture seule) |
| `testing-test-automation-engineer.md` | Rédaction de tests Playwright |
| `engineering-i18n-engineer.md` | FR / EN, aucune chaîne en dur |
| `engineering-technical-writer.md` | Documentation des lots |

## Audit final des fonctionnalités (lecture seule)
| Fichier | Contrôle |
|---|---|
| `testing-reality-checker.md` | Preuves avant « conforme » (**adapté** : script d'origine absent) |
| `testing-evidence-collector.md` | Captures et reproductions (**adapté**) |
| `testing-accessibility-auditor.md` | WCAG 2.1 AA (commandes `npx` non lancées par l'agent) |
| `security-ai-generated-code-auditor.md` | Secrets, droits, failles du code généré |
| `engineering-privacy-engineer.md` | Minimisation, conservation (ne remplace pas les DPO) |
| `engineering-identity-access-engineer.md` | Fédération OIDC avec l'IdP de l'agence, sessions, rôles |

## Activation
L'écriture dans `.claude/` est refusée à distance : ces fichiers sont donc déposés dans `agents-projet/` et **ne sont pas actifs**. Pour les activer, copier ce dossier vers `.claude/agents/` du dépôt, sur votre poste, après relecture. Tant que ce n'est pas fait, aucun agent n'est installé.

## Retrait
Supprimer ce dossier (un commit). Aucun script d'installation n'a été utilisé ; rien à désinstaller ailleurs.

## Mise à jour
Aucune mise à jour automatique. Pour reprendre une nouvelle version d'un agent : relire l'original, comparer à l'empreinte, recopier avec le même bloc.
