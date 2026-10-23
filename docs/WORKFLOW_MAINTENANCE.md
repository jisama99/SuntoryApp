# Workflow de maintenance : corrections et mises à jour (D164 à D166)

Version du 23/10/2026. Validé par T. SOEFOU le 23/10/2026 (parcours en 9 étapes). Hébergement OVHcloud, abonnement après validation de la démonstration (D165).

## 1. Trois types de demandes
| Type | Exemple | Chemin | Délai cible |
|---|---|---|---|
| Bug bloquant | Un profil cliente voit un coût agence | Hotfix | Le jour même |
| Bug courant | Libellé faux, mise en page cassée | Lot de correctifs groupés | Hebdomadaire |
| Évolution | Nouvel indicateur, nouveau champ | Fiche, décision, mini-lot | Selon priorité |

## 2. Signalement (D164)
- Bouton « Signaler un problème » dans chaque espace. Champs : type, gravité, description détaillée **obligatoire** (ce qui s'est passé, étapes pour reproduire, résultat attendu), capture facultative.
- Contexte capturé : page, profil, langue, thème, appareil, version, heure. Aucune donnée métier.
- Écran « Demandes » : chaque auteur voit les siennes et leur statut (Reçue, En cours, Corrigée, Livrée) ; le prestataire voit tout et trie.
- E-mail de notification : type, gravité, titre, extrait du détail, lien. Adresse dans la variable `SUPPORT_NOTIFY_EMAIL`, jamais dans le dépôt. En démonstration : file de validation, rien n'est envoyé.

## 3. Parcours en 9 étapes (D166)
| N° | Étape | Qui | Action |
|---|---|---|---|
| 1 | Réception | Prestataire | Qualifier : type, gravité, lien avec une décision |
| 2 | Décision | Prestataire | Évolution : validation avant développement ; bug : fiche avec reproduction |
| 3 | Correction | Claude Code | Nouvelle session, prompt de correctif, branche `fix/<n>` ou `evol/<n>`, test qui échoue d'abord, correctif minimal |
| 4 | Revue | Relecteur | Branche relue, toutes les vérifications, captures |
| 5 | Fusion | Prestataire ou relecteur | Fusion dans `main`, étiquette de version, push |
| 6 | Préproduction | Automatique | Déploiement de la fusion sur la préproduction |
| 7 | Recette | Prestataire | Parcours du bug rejoué sur la préproduction |
| 8 | Production | Prestataire | Mise en ligne validée ; retour arrière possible vers la version précédente |
| 9 | Clôture | Relecteur | Note de version FR et EN, statut « Livrée », registre mis à jour |

## 4. Branches, versions, environnements
- `main` toujours déployable, jamais de commit direct. Branches : `lot/<nom>`, `fix/<n>`, `evol/<n>`. Claude Code : D148.
- Versions sémantiques (majeur : rupture de données ou de droits ; mineur : évolution ; correctif : bug), une étiquette Git par version, `CHANGELOG` FR et EN par profil concerné.
- Environnements : démonstration publique (données fictives), local prestataire (données réelles, bandeau, contrôle C3), préproduction et production sur OVHcloud (après D165).

## 5. Garde-fous
Test d'audience relancé à chaque correctif ; aucun classeur réel donné à Claude Code ; droits des visuels (D163) régularisés avant diffusion ; tout nouveau libellé passe par le glossaire.

## 6. Rythme
Revue hebdomadaire des demandes ; version mineure tous les quinze jours au plus ; revue mensuelle de sécurité et de dépendances.
