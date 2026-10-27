# Charge et disponibilité (note de cadrage, mise à jour proposée)

Statut : hypothèses H1, H3, seuils du §4 et facteur 5 **validés par T. SOEFOU le 27/10/2026** ; inscription au registre : **mise à jour proposée**, non inscrite. Numéro de décision à attribuer par la revue (après le dernier du registre dans `main` ; ne pas réutiliser D212 à D214 ni D230 à D233).
Rédigée le 27/10/2026 à la demande de T. SOEFOU. Périmètre : saisie des besoins par les RS sur le seul périmètre « merchandising horaire ».

**Aucune donnée réelle dans cette note.** Seules des fourchettes arrondies, sans nom, secteur, magasin, date ni code, sont reprises. Les valeurs exactes issues des fichiers sources restent hors du dépôt (règles non négociables de CLAUDE.md).

## 1. Hypothèses (à confirmer, non décidées)
| # | Hypothèse | Statut |
|---|---|---|
| H1 | Les demandes d'origine « saisie locale » correspondent à des saisies humaines ; celles d'origine « système » à des créations en masse. | Validée le 27/10/2026 |
| H2 | Les RS ne saisissent que des besoins du périmètre merchandising horaire. | Donnée par T. SOEFOU le 27/10/2026 |
| H3 | Le volume futur sera du même ordre que l'historique observé, multiplié par un facteur de sécurité de 5 pour le test. | Validée le 27/10/2026 |
| H4 | La consultation (tableaux de bord DR, CVR, direction) n'a pas été mesurée : aucune donnée de lecture disponible. | Inconnue, à mesurer |

## 2. Ordres de grandeur (fourchettes arrondies)
| Mesure | Ordre de grandeur | Lecture |
|---|---|---|
| Utilisateurs de saisie | environ 80 RS (70 à 100), quelques dizaines de managers | Simultanéité réelle bien inférieure |
| Saisies humaines, médiane par jour actif | moins de 10 | Charge ordinaire négligeable |
| Saisies humaines, mois de pointe | de l'ordre de 25 par jour en moyenne | Faible |
| Saisies humaines, pic par jour | quelques centaines | Pic de saisie groupée, pas de saisie à la main |
| Saisies humaines, pic par minute | quelques dizaines | Moins de 1 requête par seconde |
| Créations système, pic par minute | quelques centaines à un millier | Cas de charge dimensionnant : le lot |

Conclusion de cadrage : le trafic ordinaire est faible. Le cas dimensionnant est **le lot** (import, saisie groupée, validation groupée) et **le pic d'échéance** (beaucoup de saisies le même jour).

## 3. Recommandations d'architecture (étape B, interdite sans feu vert B)
1. Une instance applicative et une base PostgreSQL gérée suffisent à ce volume. Ni grappe, ni file de messages, ni cache distribué.
2. Import, saisie groupée et validation groupée : une transaction, un traitement par paquets, un résultat ligne par ligne.
3. Doublons et conflits garantis dans la base (contrainte d'unicité, contrôle de version), en plus du code TypeScript. L'écran « conflit » existe déjà.
4. Listes paginées côté serveur ; index sur secteur, semaine et statut. Agrégats précalculés ou cache court pour les tableaux de bord.
5. Limiteur de connexion déplacé de la mémoire vers la base (aujourd'hui en mémoire, un seul processus).
6. Écritures idempotentes (une double soumission ne crée pas de doublon) ; brouillon conservé en cas de coupure réseau mobile.
7. Sauvegardes quotidiennes avec test de restauration ; journaux sans donnée réelle ; point de santé de l'application.

## 4. Seuils (validés par T. SOEFOU le 27/10/2026)
| Critère | Seuil |
|---|---|
| Temps de réponse à 95 % (hors lot) | inférieur à 500 ms |
| Lot de 1 500 lignes | traité en moins de 10 s, sans bloquer les autres utilisateurs |
| Doublons créés sous concurrence | 0 |
| Écritures perdues ou silencieusement écrasées | 0 |
| Erreurs serveur sur le scénario nominal | 0 |
| Erreur de lot | résultat ligne par ligne, aucune ligne partielle incohérente |

## 5. Simulation à la revue finale (demande de T. SOEFOU du 27/10/2026)
À exécuter lors du test final de la revue (`31_PROMPT_REVUE_ET_FUSION.md`), **sur données fictives uniquement**, serveur local, aucun appel réseau sortant :
| Scénario | Paramètres |
|---|---|
| S1 saisie nominale | 80 RS fictifs connectés, saisies réparties |
| S2 pic d'échéance | 80 RS saisissent dans une même fenêtre de 10 minutes, à 5 fois le pic de saisie observé (H3) |
| S3 lot en parallèle | import fictif de 1 500 lignes pendant S2 |
| S4 concurrence | deux saisies identiques simultanées (doublon) ; deux modifications simultanées du même besoin (conflit) |
| S5 réseau dégradé | double soumission et coupure en cours de saisie : pas de doublon, brouillon conservé |

Rendre dans le compte rendu de revue : scénarios réellement exécutés, seuils mesurés face aux seuils du §4, limites.

**Limites à déclarer** : à l'étape A, le démonstrateur tourne sur fixtures JSON dans un seul processus, sans base. La simulation mesure donc la logique (doublons, conflits, lot, droits) et la tenue de l'interface, pas la capacité de PostgreSQL. La capacité réelle se mesure au test de charge de l'étape B, avec les mêmes scénarios. Un test non lancé est déclaré non lancé.

## 6. Questions ouvertes
- H4 : obtenir une mesure de la consultation (nombre d'utilisateurs de lecture, fréquence).
- Hébergement (D02/D19, A9) : les seuils de disponibilité (taux, reprise) dépendent de l'hébergeur retenu ; aucune valeur inventée ici.
