# Échéances de saisie des besoins, alertes et cockpit cliente, V0.1 (23/10/2026)

Suntory uniquement. Problème posé par T. SOEFOU : l'agence est submergée de demandes de besoins merchandising qui arrivent au fil de l'eau. Elle doit les modifier et les réajuster, ce qui déborde sur le mois suivant.

## 1. Décisions
| N° | Décision | Statut |
|---|---|---|
| D78 | Après l'échéance, la saisie du mois concerné est bloquée | Validée par T. SOEFOU |
| D79 | Une alerte prévient avant l'arrivée de la date finale | Validée par T. SOEFOU |
| D80 | Deux échéances par mois, paramétrées par l'agence : saisie des besoins et demandes de changement. Illustration demandée : demandes de changement de novembre à recevoir au plus tard cette semaine | Validée sur le principe, dates à confirmer |
| D81 | La cliente reçoit alertes et résumés des retards dans son cockpit, présentés de façon soignée et lisible | Validée par T. SOEFOU |
| D82 | Presets d'échéance, cascade de rappels, report sur le mois suivant et réouverture par l'agence seule | Recommandations suivies par T. SOEFOU le 23/10/2026, à tracer dans le registre |
| D85 | Au secteur : consommé et statut du besoin, sans quota de secteur (le quota reste au niveau DR et CVR). Statuts visibles : Pourvu, Réattribué (un merch déjà sur le secteur prend un nouveau magasin, secteur d'origine affiché), Stoppé (motif obligatoire), Zone blanche (non pourvable, sortie du taux « heures pourvues », ligne « non pourvable » séparée) | Validée |
| D86 | E-mail en complément : rappel du jour J aux retardataires et résumé du lundi à la cliente, sans chiffre, lien vers l'application, un message par personne, aucun rappel individuel à la cliente | Validée |
| D87 | Délai de prise de poste mesuré par situation (recrutement nouveau, réattribution, zone blanche), pas en moyenne ; presets calés sur le recrutement nouveau. Réouverture demandée par les CVR seuls, décidée par l'agence. CVR et DR consultent les rapports de leur périmètre ; l'agence peut partager un rapport publié dans l'application, rapport par rapport | Validée |
| D84 | Expérience personnelle : chaque écran s'adresse à l'utilisateur connecté (salutation par prénom, titres, chiffres, alertes et actions limités à son périmètre et à son rôle). Condition posée par T. SOEFOU pour valider le reste | Validée sous cette condition |

## 2. Règle proposée
Pour chaque mois cible M, l'agence administration enregistre deux dates dans un calendrier d'échéances :
| Échéance | Effet |
|---|---|
| Saisie des besoins de M | Après la date, plus aucun nouveau besoin pour M |
| Demandes de changement de M | Après la date, plus aucune modification, annulation ou ajout sur les besoins de M |
Après l'échéance : la saisie est bloquée pour M. L'écran explique le blocage et propose d'enregistrer la demande pour M+1, marquée « reportée ». Seule l'agence peut rouvrir un mois, avec un motif, une durée et une trace (fonction F-30.9 existante).
Jours fériés exclus des calculs. Si une date tombe un jour non ouvré, elle recule à la veille ouvrée.

## 3. Choix de calcul, avec les dates de novembre et de décembre 2026
Novembre : le 1er est un dimanche, premier jour ouvré lundi 02/11. Décembre : mardi 01/12.
| Preset | Règle | Pour novembre | Pour décembre |
|---|---|---|---|
| Large | 15 jours calendaires avant le début du mois | 16/10, dépassée | 16/11 |
| Standard (recommandé) | 10 jours ouvrés pour la saisie, 5 jours ouvrés pour les changements | Saisie 19/10 dépassée, changements 26/10 | Saisie 17/11, changements 24/11 |
| Court | 3 jours ouvrés avant le début du mois | 28/10 | 26/11 |
| Date fixe | Date choisie à la main pour un mois | Exemple : vendredi 30/10 | À choisir |
Recommandation : preset Standard dès décembre, car la chaîne RS, CVR, DR, agence, cliente demande plusieurs jours de validation avant un recrutement. Pour novembre, la règle arrive trop tard, donc un calendrier exceptionnel à date fixe : changements au plus tard cette semaine, comme demandé. La durée moyenne entre une saisie et une prise de poste n'est pas connue, les presets restent provisoires tant qu'elle n'est pas mesurée.
« Cette semaine » : nous sommes vendredi 23/10. L'illustration retient vendredi 30/10, ce qui laisse 5 jours ouvrés pour alerter. Si l'échéance est aujourd'hui, aucune alerte préalable n'est possible.

## 4. Cascade d'alertes avant l'échéance (comptée en jours ouvrés, réglable)
| Moment | Destinataires | Contenu |
|---|---|---|
| J-5 | RS, CVR, DR | Rappel de la date, liste de leurs besoins non saisis ou en attente |
| J-2 | RS, CVR, DR concernés seulement | Relance sur ce qui manque encore |
| Jour J, 9 h | RS, CVR, DR concernés, agence | Dernier rappel |
| J+1 | Agence, cliente | Bilan : saisis, bloqués, reportés |
| Chaque lundi | Cliente | Résumé de la semaine |
Règles : pas de doublon, regroupement en un message par personne, rappels uniquement pour les retardataires, prise en compte de l'absence du destinataire, journal de livraison. La cliente ne reçoit pas chaque rappel individuel. Elle voit l'échéance qui approche, les retards par région et le bilan.
Canaux : application, plus e-mail limité (D86).

## 5. Cockpit cliente
Maquette personnalisée, voir §5 bis (version précédente impersonnelle remplacée).
| Bloc | Contenu |
|---|---|
| Compte à rebours | Jours ouvrés restants, date limite, règle appliquée après la date |
| Avancement | Part des secteurs ayant saisi, besoins saisis, en attente CVR, en attente DR, demandes de changement |
| Retards par région | Une ligne par région avec état en toutes lettres : En retard, À suivre, À jour |
| Alertes et résumés | Échéance proche, secteurs sans saisie, résumé de la semaine |
Style : cartes arrondies, pastilles, aucune ligne droite, état toujours écrit en plus de la couleur. Retards présentés par région et secteur, sans nom de personne.

## 5 bis. Personnalisation par utilisateur (D84)
Maquettes : `MAQUETTES_COCKPIT/cockpit_cliente_echeances_demo.png` (Bonjour Carine) et `cockpit_cvr_echeances_demo.png` (Bonjour Julien). Prénoms fictifs, données DÉMO.
| Élément | Règle |
|---|---|
| Titre de page | « Bonjour [prénom] », jamais « Cockpit cliente » ou un intitulé de rôle |
| Phrase d'accroche | Une phrase sur ce qui change pour cette personne (échéance, retards de son périmètre) |
| Titres de cartes | À la deuxième personne : « Votre échéance », « Vos secteurs à relancer », « Vos prochaines actions » |
| Périmètre | Chiffres, régions et secteurs filtrés côté serveur sur le périmètre de l'utilisateur |
| Contenu selon le rôle | Cliente : régions et bilan. DR : ses CVR et secteurs. CVR : ses secteurs et ses validations. RS : ses besoins. Agence : file des demandes et charge |
| Actions | Chaque bloc propose l'action utile à ce rôle (valider, relancer, saisir) |
| Repère de nouveauté | « Depuis jeudi » : ce qui a changé depuis la dernière connexion |
| Prénom absent | Repli sur « Bonjour » suivi de la fonction, sans nom inventé |
| Rappels et résumés | Même personnalisation : objet et première ligne adressés par prénom, un message par personne |
| Confidentialité | Le prénom affiché est celui de l'utilisateur connecté. Aucun nom d'un autre utilisateur dans les écrans cliente et les exports (règle « secteurs, pas personnes ») |
Source du prénom : fournisseur d'identité, l'agence (D42 : un intervenant sans compte n'a pas d'écran personnel, il reçoit les messages par son responsable). Lot : A1 pour le profil, A4a pour les écrans.

## 6. Côté agence
Tableau de charge à venir : demandes reçues avant et après échéance, secteurs en retard, file des demandes de changement classée par échéance, demandes reportées sur M+1. Objectif : lisser la charge sans modification dans l'urgence.

## 7. Paramètres, alertes et données
| Élément | Contenu |
|---|---|
| Paramètres (agence administration) | Calendrier des échéances par mois, preset, jours fériés, cascade, heure d'envoi, fréquence du résumé cliente, règle de report |
| Alertes à ajouter au catalogue | F-60.16 échéance proche, F-60.17 saisie clôturée, F-60.18 résumé des retards pour la cliente, F-60.19 demande bloquée ou reportée |
| Données | Table ECHEANCES (mois cible, type, date limite, preset, auteur, date d'effet), statut « reportée » sur le besoin, journal des réouvertures |
| Lots | Blocage de saisie : A2. Alertes et cockpit : A4a. Cascade de rappels : A4a, automatisations F-90 |

## 8. Points tranchés le 23/10 et reste ouvert
Tranchés : illustration au 30/10, preset Standard dès décembre, e-mail limité (D86), réouverture par les CVR seuls (D87), consultation des rapports par CVR et DR (D87).
Vocabulaire : les RS pilotent les effectifs merch recrutés, ce sont ces effectifs merch qui interviennent en magasin. Les RS ne vont pas en magasin.
Reste ouvert : mesure des délais par situation à lancer sur un trimestre (D87).

## 9. Mise à jour de mémoire proposée (non enregistrée)
Expérience personnalisée par utilisateur (D84). Logo Marvesting orange retiré des exports (D83).
Après l'échéance la saisie est bloquée, alerte préalable obligatoire, deux échéances par mois paramétrées par l'agence, cockpit cliente avec alertes et résumés des retards (D78 à D82).
