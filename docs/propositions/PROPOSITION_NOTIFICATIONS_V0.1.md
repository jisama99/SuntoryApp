# Proposition : notifications push et préférences d'alerte (V0.1, 23/10/2026)

Statut : proposition du prestataire, non inscrite au registre. Exigence exprimée par T. SOEFOU le 23/10/2026 : prévoir des notifications push pour les alertes, à configurer dans les paramètres.

## 1. Arbitrage
| Question | Arbitrage |
|---|---|
| Où loger le travail | Lot dédié **A4g**, après A4f. A4a porte déjà tableau de bord, comparaison N / N-1, graphiques et alertes : y ajouter un module transverse le surchargerait. |
| Démonstrateur | Modèle, réglages, centre de notifications et file « push à valider » simulée. Aucun envoi réel. |
| Push réel | Lot A9, après abonnement OVHcloud (HTTPS, service worker, clés VAPID). Sur iPhone, installation PWA obligatoire. |
| Risque calendrier 10/11 | A4g est le premier lot à reporter en seconde démonstration si le noyau est en retard. |

## 2. Entrées de registre proposées (numéros à confirmer après le dernier du registre)
| N° proposé | Sujet | Décision proposée |
|---|---|---|
| D205 | Notifications et canaux | Trois canaux (application, push, e-mail). Préférence par utilisateur, type d'alerte et canal ; fréquence immédiate ou résumé quotidien ; heures calmes. L'utilisateur règle dans « Mes notifications » (près du sélecteur d'affichage), l'agence fixe défauts par profil et alertes obligatoires dans Paramètres. |
| D206 | Push simulé puis réel | En étape A, push et e-mail sont simulés (file à valider, aucun envoi, essai de deux cycles comme D94). Web Push réel en A9 après abonnement OVHcloud ; installation PWA requise sur iPhone. |
| D207 | Contenu et audience | Texte sans chiffre, lien vers l'application. Audience filtrée avant création de la notification ; une préférence ne peut pas élargir l'audience. Alertes d'échéance obligatoires (hypothèse à valider). |
| D208 | Lot A4g | Lot dédié après A4f ; premier candidat au report en seconde démonstration. |

## 3. Lignes à ajouter (à faire par la session de revue ou le prestataire, pas par un lot)
- `09_INDEX_LOTS.md`, noyau : `| 5 ter | A4g | 32_PROMPT_LOT_A4G.md | A4f | Liste des alertes obligatoires, heures calmes | Réglages, centre, file simulée, test d'audience |`
- `29_MESSAGES_DE_LANCEMENT.md` : insérer A4g après A4f (« Après fusion de A4f »), et A6 passe en « Après fusion de A4g ».
- `PLAN_A1_A7.md` : ligne A4g ; périmètre A9 : ajouter Web Push réel, service worker, PWA, test iOS et Android.
- `25_PROMPT_LOT_A8.md` : rien à changer (adresse de notification des signalements, D164, reste distincte).

## 4. Message de lancement A4g (après fusion de A4f)
```text
LANCEMENT · LOT A4g · SUNTORY REFONTE V3

Dépôt : 08_PLATEFORME_SUNTORY_V3, étape A, données fictives uniquement.

AVANT TOUT
1. git fetch origin, puis pars de origin/main à jour (ta branche de session doit contenir origin/main). Vérifie que docs/DECISIONS.md contient D191 et que docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md contient les règles 14, 15 et 16. Sinon, arrête-toi et dis-le.
2. Lis dans l'ordre : docs/PROMPTS/02_PROMPT_MAITRE_DEV.md, docs/PROMPTS/07_REGLES_COMMUNES_LOTS_APRES_A1.md, puis docs/PROMPTS/32_PROMPT_LOT_A4G.md, et ce qu'il demande de lire.
3. Exécute uniquement ce lot. N'enchaîne pas.

RÈGLES
Aucun commit sur main, aucun push de main, aucune pull request (D148) : commit et push de ta branche de session seulement, en fin de lot, après le compte rendu. Supabase et Vercel interdits. Aucune requête externe (règle 10). Aucun envoi réel de push ni d'e-mail. Aucun fichier de données réelles lu. Une hypothèse n'est pas une décision : propose les mises à jour du registre sans les inscrire, avec des numéros après le dernier du registre. Les contrôles (typecheck, lint, tests, build, e2e) sont exécutés et leur sortie reportée ; un test non lancé n'est pas déclaré passé. Dis honnêtement ce que tu n'as pas relu. Règle 17 (D192) : sous-agents au modèle le plus économique suffisant, jamais pour décider.

Récapitule en dix lignes maximum.
```
