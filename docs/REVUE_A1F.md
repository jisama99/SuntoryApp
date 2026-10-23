# Revue du lot A1f : connexion par identifiant et comptes

Date : 23/10/2026. Session de revue distincte de la session d'écriture (D191). Branche source : `claude/amazing-babbage-khv4fn`. Branche de revue : `revue/A1f`. Supabase, Vercel et toute requête externe : non utilisés. Aucune donnée réelle lue.

---

## 1. Contrôles exécutés

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit` | **0 erreur dans `src/`**. 8 erreurs dans `.next/types/validator.ts` (types Next.js stale, régénérés au prochain build). Acceptables. |
| `npm run lint` | **0 avertissement, 0 erreur** |
| `npm test` (Vitest) | **28 fichiers, 561 tests passés, 1 ignoré** (C3 : `.denylist.local` absent, non exécuté — fichier local requis) |
| `npm run build` | **Succès** (rebuild requis après `npm run demo:accounts` pour rebundler `accounts.json`) |
| `npm run test:e2e` (Playwright, `a1f.spec.ts`) | **21/21 passés** (chromium `/opt/pw-browsers/chromium` via `executablePath` dans `playwright.config.ts`) |
| C3 (`.denylist.local`) | **Non exécuté** — fichier local non présent dans la session de revue (attendu, signalé) |

---

## 2. Conformité critère par critère (prompt A1f)

| Critère | Verdict | Preuve |
|---|---|---|
| Écrans de connexion `/fr/start` et `/en/start` (formulaire, visuel, bandeau DONNÉES FICTIVES) | ✓ | Captures `login_light/dark_fr/en_1440/390` (10 vues) ; test e2e #1, #2, #3 |
| Aucune connexion sans soumission explicite | ✓ | Test e2e #3 : remplissage + événements simulés → 0 requête avant clic |
| Trousseau : `autocomplete`, `name`, `id` stables, jamais `off` | ✓ | Test e2e #2 |
| Message d'échec unique (pas de discrimination compte/mot de passe) | ✓ | Test e2e #6 |
| Limitation : 5 échecs → blocage 5 min | ✓ | Test e2e #7 |
| Cookie `demo_session` : httpOnly, signé HMAC, SameSite=Lax, 8 h | ✓ | Code `src/lib/auth.ts:signSession`, `src/app/api/login/route.ts` ; test e2e #8 |
| Cookie falsifié ignoré | ✓ | Test e2e #8 (timingSafeEqual + longueur) |
| Déconnexion | ✓ | Test e2e #8 |
| Redirection après connexion vers la page demandée | ✓ | Test e2e #18, #20 |
| Adresse de retour limitée aux chemins internes | ✓ | `safeReturnTo()` validée proxy + action serveur ; test e2e #19 ; 9 vecteurs bloqués |
| Aucun mot de passe en clair dans le dépôt / logs / captures | ✓ | `accounts.json` : empreintes scrypt+sel uniquement ; `.demo-passwords.local.json` ignoré par git, droits 600 ; captures : champ masqué, temporaire remplacé par points |
| Durée de réponse constante (anti-énumération) | ✓ | `padTo(startedAt, LOGIN_MIN_MS)` ; `dummyHash()` pour inconnus ; test unitaire |
| Gestion des comptes réservée à l'agence administration (non impersonné) | ✓ | `canManageAccounts` : `isAgencyAdmin(ctx) && !ctx.impersonated` ; test e2e #9, #11 ; page → `notFound()` sinon |
| Compte du prestataire protégé | ✓ | Test e2e #13 |
| Mot de passe temporaire rendu une seule fois | ✓ | `SecretPanel` : React state depuis la réponse de l'action, effacé à la fermeture, jamais relu ni journalisé ; test e2e #12 |
| Changement de mot de passe forcé au premier accès | ✓ | `must_change_password` → layout app → `/change-password` ; test e2e #20 |
| `proxy.ts` (Next 16, pas `middleware.ts`) | ✓ | `src/proxy.ts` ; `next.config.ts` sans `middleware` |
| Audience par défaut refusée (D108) | ✓ | Champ `audience` obligatoire sur alertes EV-40 à EV-43 ; filtrage couche données |
| Titres du glossaire (D186) | ✓ | Test e2e #21 FR et EN |
| FR et EN complets | ✓ | Test e2e #17, #29 (captures EN) |
| Performance : seuils H3 < 2 s | ✓ | Connexion 96–132 ms, gestion des comptes 124 ms (H3 mesuré en e2e, test #16) |
| Mobile 390 px : pas de débordement, cibles 44 px | ✓ | Test e2e #15, captures `*_390` |

---

## 3. Audit sécurité / identité et accès / vie privée

### 3.1 Résultats
Tous les points d'attention signalés dans le lancement sont conformes au code source :

| Point | Code | Verdict |
|---|---|---|
| Signature de session | `createHmac('sha256', key())` + `timingSafeEqual` (longueur et valeur) | ✓ |
| Hachage de mot de passe | `scryptSync` + sel aléatoire 16 octets par compte | ✓ |
| `dummyHash()` pour inconnus | Calculé une seule fois, temps identique à un vrai calcul | ✓ |
| Durée de réponse | `performance.now()` partout (jamais `Date.now()`) ; `padTo()` dans tous les cas | ✓ |
| Route API JSON uniquement | `Content-Type: application/json` requis, sinon 401 | ✓ (anti-CSRF) |
| `safeReturnTo()` double validation | Proxy ET action `changePasswordAction` | ✓ |
| Impersonation sans accès comptes | `canManageAccounts` vérifie `!ctx.impersonated` | ✓ |
| Isolation session/profil | Session côté serveur uniquement (cookie httpOnly) | ✓ |
| Aucune requête externe | Polices Inter en local, aucun CDN | ✓ (règle 10) |

### 3.2 Constat mineur (M1 — non bloquant)
`requireSession()` ne vérifie pas `must_change_password`. Un utilisateur avec mot de passe temporaire peut appeler directement des Server Actions sans passer par `/change-password`. Le filtrage est assuré à l'entrée du layout `(app)`, pas au niveau des actions individuelles. Acceptable au démonstrateur (D phase A). **À reprendre en B** avec une vérification dans chaque action sensible ou un middleware de session.

---

## 4. Règles communes

| Règle | Objet | Résultat |
|---|---|---|
| 10 | Aucune requête externe | ✓ (polices Inter en local, 0 CDN, test Playwright) |
| 12 | Aucune date saisie à la main | ✓ (pas de date dans les écrans A1f) |
| 13 | Jours de semaine par WeekdayPicker | ✓ (pas de sélection de jours dans les écrans A1f) |
| 14 | États loading/error, skip nav, focus, 390 px, H3 < 2 s | ✓ (loading.tsx + error.tsx pour chaque route ; skip nav FR/EN ; test e2e #15, #16) |
| 15 | Tout texte FR/EN via next-intl | ✓ (test e2e #17, #29 ; 0 chaîne en dur dans les composants A1f) |
| 16 | Jetons uniquement, 0 style en dur, cibles 44 px | ✓ (0 `style={{` dans les écrans A1f ; test Vitest `theme.test.ts`) |

---

## 5. Captures

**44 captures attendues** dans `docs/captures/A1f/` — toutes présentes.

**26 vues dans cette session de revue :**
`login_light_fr_1440`, `login_light_fr_390`, `login_dark_fr_1440`, `login_light_en_1440`, `login_dark_en_390`, `login_error_light_fr_1440`, `login_error_light_en_390`, `login_filled_light_fr_1440`, `accounts_light_fr_1440`, `accounts_light_fr_390`, `accounts_dark_fr_1440`, `accounts_dark_fr_390`, `accounts_light_en_1440`, `accounts_dark_en_1440`, `accounts_dark_en_390`, `account_created_light_fr_1440`, `account_created_light_fr_390`, `account_created_light_en_1440`, `account_created_light_en_390`, `settings_accounts_card_light_fr_1440`, `settings_accounts_card_light_en_390`, `change_password_light_fr_1440`, `change_password_light_en_1440`, `change_password_dark_en_1440`, `change_password_dark_fr_390`, `login_dark_en_390`.

**18 non vues dans cette session** (variantes de login_filled et de change_password en modes/langues manquants) :
`login_dark_fr_390`, `login_error_light_fr_390`, `login_error_light_en_1440`, `login_filled_dark_en_1440`, `login_filled_dark_en_390`, `login_filled_dark_fr_1440`, `login_filled_dark_fr_390`, `login_filled_light_en_1440`, `login_filled_light_en_390`, `login_filled_light_fr_390`, `login_light_en_390`, `accounts_light_en_390`, `account_created_dark_*` (aucune capture sombre de création), `settings_accounts_card_light_fr_390`, `settings_accounts_card_light_en_1440`, `change_password_light_fr_390`, `change_password_light_en_390`, `change_password_dark_en_390`.

**Constats visuels (captures vues) :**
- Bandeau DONNÉES FICTIVES / DEMO DATA visible partout ✓
- Aucun mot de passe en clair dans aucune capture ✓
- Cohérence FR/EN, clair/sombre, 1440/390 px ✓
- Aucun débordement horizontal à 390 px ✓
- Aucune icône IA ✓
- Boutons d'action sur plusieurs lignes à 1440 px (long intitulé FR) : constaté, déjà signalé dans le compte rendu, non corrigé (impact cosmétique faible, pas de blocage d'accès).
- Logo Suntory pâle sur carte translucide (mode clair 1440 px) : constaté, déjà signalé, acceptable.

---

## 6. Corrections apportées sur revue/A1f

**Aucune correction de code** dans cette session de revue. La seule modification apportée avant cette revue (`playwright.config.ts` — ajout de `executablePath`) était déjà dans le commit `41c5764` de la branche source. Aucun défaut mineur ou important n'a été identifié nécessitant une correction.

---

## 7. Écarts restants (non bloquants)

| # | Écart | Nature | Destination |
|---|---|---|---|
| E1 | `requireSession()` ne vérifie pas `must_change_password` (M1) | Mineur | Étape B |
| E2 | Limitation des essais en mémoire, par identifiant seulement (pas par adresse, non partagée entre instances) | Mineur (démonstrateur) | Étape B |
| E3 | Session sans stockage côté serveur (clé au démarrage, pas de révocation fine) | Mineur (démonstrateur) | Étape B |
| E4 | Visualisation « comme » pas en lecture seule (nécessaire pour les tests de parcours RS) | Architecture | À décider avant B |
| E5 | Verrouillage par identifiant : un tiers peut bloquer le compte d'autrui (5 essais) | Mineur (démonstrateur) | Étape B |
| E6 | Boutons d'action sur plusieurs lignes à 1440 px (libellé FR long) | Cosmétique | Lot suivant ou B |
| E7 | 18 captures non vues dans cette session | Lecture | — |
| E8 | C3 non exécuté (`.denylist.local` absent) | Contrôle local | Hors session |

---

## 8. Verdict

**FUSIONNABLE**

Conditions réunies : tous les contrôles exécutables sont verts (typecheck, lint, 561 tests unitaires, build, 21/21 e2e A1f) ; tous les critères du prompt A1f sont conformes ; aucun défaut bloquant ; audit sécurité passé ; captures cohérentes ; règles communes respectées. Le constat M1 est documenté et acceptable au démonstrateur.

**Condition suspensive :** validation de T. SOEFOU requise avant la fusion (étape 9 du prompt 31).

---

## 9. Propositions de registre et questions pour T. SOEFOU

Les propositions suivantes reprennent les hypothèses du compte rendu A1f et les constats de la revue. Quatre questions maximum par soumission — je soumets les prioritaires.

**Q1 — Répartition des comptes agence (hypothèse 1 du CR)**

La session d'écriture a créé 6 comptes agence : 1 administration + 5 opérateurs. D189 ne fixe pas cette répartition.

- (Recommandé) **Valider 1 admin + 5 opérateurs comme répartition de démonstration** → D193 « 6 comptes agence de démonstration : 1 administration, 5 opérateurs »
- Modifier la répartition (préciser)
- Laisser ouvert (hypothèse, pas de décision)

**Q2 — Profils créables par l'agence administration (hypothèse 2 du CR, décidée oralement)**

T. SOEFOU a confirmé en session que l'agence peut créer tous les profils, administration comprise. C'est ce que fait le code.

- (Recommandé) **Inscrire au registre** → D194 « L'agence administration peut créer des comptes de tous les profils sauf prestataire, administration comprise »
- Numéro différent ou libellé à ajuster (préciser)

**Q3 — Visualisation « comme » pas en lecture seule (E4)**

Le prestataire qui consulte comme un profil peut écrire avec les droits de ce profil. C'est voulu pour les tests (aucun compte RS configuré). En B, le journal devra distinguer le compte réel et le profil consulté.

- (Recommandé) **Confirmer ce comportement, créer un compte RS de démonstration avant l'étape B** → D195 « En démonstrateur : visualisation avec droits d'écriture du profil consulté ; en B : journal avec compte réel et profil consulté »
- Passer en lecture seule maintenant et créer un compte RS de démonstration (attention : casse les tests de parcours existants)
- Laisser ouvert

**Q4 — Politique de mot de passe (hypothèse 4 du CR)**

12 caractères, au moins 1 lettre et 1 chiffre, différent du temporaire.

- (Recommandé) **Valider cette politique** → D196 « Mot de passe de démonstration : 12 caractères, 1 lettre, 1 chiffre, différent du temporaire »
- Politique différente (préciser)
- Laisser ouvert

---

*Document produit par la session de revue revue/A1f. Fusion dans `main` conditionnée à la validation de T. SOEFOU.*
