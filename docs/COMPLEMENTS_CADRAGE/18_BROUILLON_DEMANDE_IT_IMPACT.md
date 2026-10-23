# Brouillon : demande à l'IT d'Impact (écriture dans le fichier Excel branché)

**Statut : brouillon non envoyé. À relire par T. SOEFOU. Signature : profil FREELANCE (coordonnées à compléter par T. SOEFOU).**
Objet : SUNTORY REFONTE V3, hébergement et accès au classeur de suivi permanent/saisonnier (étape B)

Bonjour,

Dans le cadre de la plateforme analytique Suntory que je conçois pour Impact, l'étape de démonstration utilise des données fictives. Avant toute étape sur données réelles, je souhaite savoir si un accès contrôlé au classeur de suivi peut être mis en place dans votre environnement. Aucune donnée réelle n'est demandée à ce stade.

## Ce que j'aimerais pouvoir faire (étape B, après accord écrit)
Lire et écrire, dans les **tableaux nommés** d'un classeur déposé dans une bibliothèque dédiée, uniquement les colonnes de saisie (jamais les colonnes calculées), avec journal et détection de conflit.

## Questions
1. Votre environnement est-il Microsoft 365 avec SharePoint Online ? Une bibliothèque dédiée à Suntory peut-elle être créée, avec historique des versions ?
2. Une application peut-elle être enregistrée dans votre annuaire avec un accès limité à ce seul site (type « Sites.Selected »), sans compte utilisateur ? Sinon, un compte de service dédié, ou un flux Power Automate dont vous êtes propriétaire, est-il envisageable ?
3. Quelles sont vos exigences de sécurité : authentification, durée de vie des secrets, journalisation, liste des personnes habilitées ?
4. Qui, chez vous (DPO, sécurité), doit approuver cette configuration, et sous quelle forme (écrit) ? La cliente doit-elle aussi donner son accord ?
5. Souhaitez-vous plutôt que l'échange reste un **fichier déposé** dans votre bibliothèque, sans accès direct de la plateforme ?

## Périmètre et garde-fous proposés
- Données minimales : pas de coordonnées personnelles, pas de motif médical, colonnes sensibles exclues par défaut.
- Aucune écriture sans validation humaine ; refus d'écraser une version plus récente.
- Essai préalable sur une **copie fictive**.
- Hébergement de la plateforme dans l'Union européenne ; tout sous-traitant ultérieur déclaré à Impact avant usage.

Je reste disponible pour un échange de 30 minutes.

Cordialement,
[Nom · profil FREELANCE · coordonnées à compléter]
