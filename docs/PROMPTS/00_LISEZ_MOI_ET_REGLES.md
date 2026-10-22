# 00 · Lisez-moi : développement de la plateforme avec Claude Code

Version de travail du 22/10/2026. Signature des livrables externes : FREELANCE (D28).

## Mode d'emploi (nouvelle session)
1. Créer un dépôt vide pour la plateforme. Y copier `CLAUDE.md` à la racine et `01_REGISTRE_DECISIONS.md` en `docs/DECISIONS.md`.
2. Donner accès à `REFONTE_V3` en lecture seule (sources, design, orientation).
3. Coller `02_PROMPT_MAITRE_DEV.md`, puis le prompt du lot dans `03_LOTS_DEV.md`.
4. Un lot = une session. Valider le compte rendu avant le lot suivant.
5. Ne jamais lancer un lot B sans « feu vert B » écrit dans `docs/DECISIONS.md`.

## Contenu du dossier
| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Règles permanentes, pile proposée, vocabulaire, méthode |
| `01_REGISTRE_DECISIONS.md` | Positions arrêtées, points à valider, ouverts, mise à jour de mémoire proposée |
| `02_PROMPT_MAITRE_DEV.md` | Prompt à coller à chaque session |
| `03_LOTS_DEV.md` | Lots A0 à A7 (démonstrateur) et B0 à B9 (MVP, interdits pour l'instant) |
| `04_JEUX_ESSAI_ET_RECETTE.md` | Données fictives, cas de test, parcours de recette, script de démonstration |

## Lien avec l'existant
- Les lots reprennent la convention de `PROMPTS_AJUSTEMENTS_V4` (un lot par session, validation entre lots, compte rendu).
- Les modules V4 (M1, M2, M3, SECURITE) servent de référence de règles et de design ; ils ne sont pas modifiés.
- Les anciens comptes rendus de tests ne sont pas des tests exécutés aujourd'hui ; le lot A0 le rappelle et ne les réutilise que comme référence.

## Points de vigilance avant le premier lot
- **Signature** : FREELANCE pour les livrables externes. Aucun logo, nom ni coordonnée dans les écrans du démonstrateur.
- **Hébergement** : refacturé à l'agence Impact sur une ligne dédiée du devis (chaîne Suntory → Impact → prestataire → hébergeur) ; aucune donnée réelle en ligne avant le choix complet de l'hébergeur et le contrat article 28.
- **Langues** : le démonstrateur est bilingue FR / EN dès le lot A1 ; la charge supplémentaire est à chiffrer.
- **Date** : le 10/11/2026 vaut hypothèse de date cible du démonstrateur, pas du MVP.
