import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import accountsJson from '@/data/fixtures/accounts.json';
import profilesJson from '@/data/fixtures/profiles.json';
import zonesJson from '@/data/fixtures/zones.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import { dummyHash, generatePassword, hashPassword, verifyPassword } from '@/data/password';
import { AccountSchema, ProfileSchema, ZoneSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import { passwordProblem, scopeKindFor, validAssignment } from '@/domain/accounts';
import { PROFILE_IDS } from '@/domain/types';
import type { ProfileId } from '@/domain/types';
import { emptyState, isLocked, LOCK_MS, MAX_FAILURES, recordFailure, WINDOW_MS } from '@/lib/login-throttle';
import { read, ROOT } from './util';

const zones = z.array(ZoneSchema).parse(zonesJson);
const profiles = z.array(ProfileSchema).parse(profilesJson);
const accounts = z.array(AccountSchema).parse(accountsJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId, extra: { accountId?: string; impersonated?: boolean } = {}) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr', extra);
const admin = () => ctxOf('agency_admin', { accountId: accounts.find((a) => a.username === 'DemoAgence01')!.id });
const rsZone = zones.find((z) => z.kind === 'rs')!.id;
const drZone = zones.find((z) => z.kind === 'dr')!.id;

beforeEach(() => resetDemoState());

describe('comptes fictifs (D188, D189)', () => {
  it('six identifiants agence, un direction, un par DR et par CVR, aucun RS, un prestataire', () => {
    const count = (p: ProfileId) => accounts.filter((a) => a.profile === p).length;
    expect(count('agency_admin') + count('agency_operator')).toBe(6);
    expect(count('direction_client')).toBe(1);
    expect(count('dr_client')).toBe(zones.filter((z) => z.kind === 'dr').length);
    expect(count('cvr_client')).toBe(zones.filter((z) => z.kind === 'cvr').length);
    expect(count('rs')).toBe(0);
    expect(count('provider_admin')).toBe(1);
  });

  it('identifiants au format fictif, uniques, distincts de toute donnée réelle', () => {
    const names = accounts.map((a) => a.username);
    expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^Demo[A-Za-z]+\d{2}$/);
  });

  it('chaque DR et chaque CVR reçoit une zone de son niveau, chacune une seule fois', () => {
    for (const kind of ['dr', 'cvr'] as const) {
      const ids = accounts.flatMap((a) => (a.scope.kind === kind ? a.scope.ids : []));
      expect(ids.sort()).toEqual(zones.filter((z) => z.kind === kind).map((z) => z.id).sort());
    }
  });

  it('les mots de passe ne sont que des empreintes dans les fixtures', () => {
    for (const a of accounts) {
      expect(Object.keys(a.password).sort()).toEqual(['hash', 'salt']);
      expect(a.password.hash).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(JSON.stringify(accountsJson)).not.toMatch(/"password":\s*"/);
  });

  it('aucun mot de passe en clair dans les fichiers versionnés (si le fichier local existe)', () => {
    const file = path.join(ROOT, '.demo-passwords.local.json');
    if (!existsSync(file)) return;
    const plain = Object.values(JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>);
    const tracked = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => f && !/\.(webp|png|jpe?g)$/.test(f));
    const hits: string[] = [];
    for (const f of tracked) {
      const text = existsSync(path.join(ROOT, f)) ? readFileSync(path.join(ROOT, f), 'utf8') : '';
      for (const p of plain) if (text.includes(p)) hits.push(f);
    }
    expect(hits).toEqual([]);
  });

  it('le fichier local de mots de passe est ignoré par git', () => {
    expect(read(path.join(ROOT, '.gitignore'))).toContain('.demo-passwords.local.json');
  });
});

describe('hachage', () => {
  it('vérifie le bon mot de passe, refuse les autres, sel distinct par empreinte', () => {
    const p = generatePassword();
    const h = hashPassword(p);
    expect(verifyPassword(p, h)).toBe(true);
    expect(verifyPassword(`${p}x`, h)).toBe(false);
    expect(hashPassword(p).hash).not.toBe(h.hash);
    expect(h.hash).not.toContain(p);
    expect(verifyPassword('placeholder', dummyHash())).toBe(true);
  });
  it('mot de passe temporaire : 14 caractères sans caractère ambigu', () => {
    for (let i = 0; i < 50; i++) expect(generatePassword()).toMatch(/^[a-zA-Z2-9]{14}$/);
    expect(generatePassword()).not.toMatch(/[0O1lI]/);
  });
});

describe('limitation des essais', () => {
  it(`bloque après ${MAX_FAILURES} échecs dans la fenêtre, puis libère`, () => {
    let s = emptyState();
    for (let i = 0; i < MAX_FAILURES - 1; i++) s = recordFailure(s, i * 1000);
    expect(isLocked(s, 10_000)).toBe(false);
    s = recordFailure(s, 5000);
    expect(isLocked(s, 6000)).toBe(true);
    expect(isLocked(s, 5000 + LOCK_MS + 1)).toBe(false);
  });
  it('les échecs hors fenêtre ne comptent pas', () => {
    let s = emptyState();
    for (let i = 0; i < MAX_FAILURES - 1; i++) s = recordFailure(s, i);
    s = recordFailure(s, WINDOW_MS + 1000);
    expect(isLocked(s, WINDOW_MS + 2000)).toBe(false);
  });
});

describe('règles de comptes', () => {
  it('périmètre cohérent avec le profil', () => {
    expect(scopeKindFor('rs')).toBe('rs');
    expect(validAssignment(zones, 'rs', { kind: 'rs', ids: [rsZone] })).toBe(true);
    expect(validAssignment(zones, 'rs', { kind: 'dr', ids: [drZone] })).toBe(false);
    expect(validAssignment(zones, 'rs', { kind: 'all' })).toBe(false);
    expect(validAssignment(zones, 'dr_client', { kind: 'dr', ids: ['00000000-0000-4000-8000-000000000000'] })).toBe(false);
    expect(validAssignment(zones, 'agency_operator', { kind: 'all' })).toBe(true);
    expect(validAssignment(zones, 'agency_operator', { kind: 'rs', ids: [rsZone] })).toBe(false);
  });
  it('politique de mot de passe : 12 caractères, une lettre, un chiffre, différent du temporaire', () => {
    expect(passwordProblem('court1', 'x')).toBe('weak');
    expect(passwordProblem('uniquementdeslettres', 'x')).toBe('weak');
    expect(passwordProblem('123456789012', 'x')).toBe('weak');
    expect(passwordProblem('abcdefghij12', 'abcdefghij12')).toBe('same');
    expect(passwordProblem('abcdefghij12', 'autre')).toBeNull();
  });
});

describe('gestion des comptes : audience (D118, D189)', () => {
  const input = { username: 'DemoRS01', profile: 'rs' as const, scope: { kind: 'rs' as const, ids: [rsZone] } };

  it('seule l\'agence administration, connectée en son nom, gère les comptes', async () => {
    for (const id of PROFILE_IDS.filter((p) => p !== 'agency_admin')) {
      const ctx = ctxOf(id, { accountId: 'x' });
      expect(repo.canManageAccounts(ctx), id).toBe(false);
      expect(await repo.listAccounts(ctx), id).toEqual([]);
      expect(await repo.createAccount(ctx, input), id).toEqual({ status: 'refused', reason: 'forbidden' });
    }
    expect(repo.canManageAccounts(admin())).toBe(true);
    expect((await repo.listAccounts(admin())).length).toBe(accounts.length);
  });

  it('le prestataire qui consulte « comme » l\'agence administration ne gère pas les comptes', async () => {
    const viewing = ctxOf('agency_admin', { accountId: 'presta', impersonated: true });
    expect(repo.canManageAccounts(viewing)).toBe(false);
    expect(await repo.createAccount(viewing, input)).toEqual({ status: 'refused', reason: 'forbidden' });
  });

  it('l\'agence ne crée ni ne modifie de compte du prestataire', async () => {
    expect(await repo.createAccount(admin(), { username: 'DemoPresta02', profile: 'provider_admin', scope: { kind: 'all' } })).toEqual({ status: 'refused', reason: 'invalid' });
    const presta = accounts.find((a) => a.profile === 'provider_admin')!;
    expect(await repo.setAccountActive(admin(), presta.id, false)).toEqual({ status: 'refused', reason: 'protected' });
    expect(await repo.resetAccountPassword(admin(), presta.id)).toEqual({ status: 'refused', reason: 'protected' });
    expect(await repo.assignAccount(admin(), presta.id, { profile: 'rs', scope: { kind: 'rs', ids: [rsZone] } })).toEqual({ status: 'refused', reason: 'protected' });
  });

  it('création : mot de passe temporaire rendu une fois, connexion possible, changement obligatoire', async () => {
    const r = await repo.createAccount(admin(), input);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(r.account.must_change_password).toBe(true);
    expect(JSON.stringify(r.account)).not.toContain(r.temporaryPassword);
    expect((await repo.listAccounts(admin())).some((a) => JSON.stringify(a).includes(r.temporaryPassword))).toBe(false);
    const logged = await repo.authenticate('demors01', r.temporaryPassword);
    expect(logged?.id).toBe(r.account.id);
    expect(await repo.changePassword(r.account.id, 'faux', 'Valide-12345x')).toEqual({ status: 'refused', reason: 'invalid_current' });
    expect(await repo.changePassword(r.account.id, r.temporaryPassword, 'court')).toEqual({ status: 'refused', reason: 'weak' });
    const next = `${generatePassword(10)}a1`;
    expect(await repo.changePassword(r.account.id, r.temporaryPassword, next)).toEqual({ status: 'ok' });
    expect((await repo.getAccount(r.account.id))?.must_change_password).toBe(false);
    expect(await repo.authenticate('DemoRS01', r.temporaryPassword)).toBeNull();
    expect((await repo.authenticate('DemoRS01', next))?.id).toBe(r.account.id);
  });

  it('refus : identifiant pris (sans tenir compte de la casse), format, profil et périmètre incohérents', async () => {
    expect(await repo.createAccount(admin(), { ...input, username: 'demoagence01' })).toEqual({ status: 'refused', reason: 'username_taken' });
    expect(await repo.createAccount(admin(), { ...input, username: '1abc' })).toEqual({ status: 'refused', reason: 'invalid' });
    expect(await repo.createAccount(admin(), { ...input, username: 'avec espace' })).toEqual({ status: 'refused', reason: 'invalid' });
    expect(await repo.createAccount(admin(), { ...input, scope: { kind: 'all' } })).toEqual({ status: 'refused', reason: 'invalid' });
  });

  it('désactivation : le compte ne se connecte plus, jamais son propre compte ; réinitialisation : nouveau temporaire', async () => {
    const created = await repo.createAccount(admin(), input);
    if (created.status !== 'ok') throw new Error('création');
    expect(await repo.setAccountActive(admin(), created.account.id, false)).toEqual({ status: 'ok' });
    expect(await repo.authenticate('DemoRS01', created.temporaryPassword)).toBeNull();
    expect(await repo.setAccountActive(admin(), created.account.id, true)).toEqual({ status: 'ok' });
    const reset = await repo.resetAccountPassword(admin(), created.account.id);
    if (reset.status !== 'ok') throw new Error('réinitialisation');
    expect(reset.temporaryPassword).not.toBe(created.temporaryPassword);
    expect(await repo.authenticate('DemoRS01', created.temporaryPassword)).toBeNull();
    expect((await repo.authenticate('DemoRS01', reset.temporaryPassword))?.must_change_password).toBe(true);
    expect(await repo.setAccountActive(admin(), admin().accountId!, false)).toEqual({ status: 'refused', reason: 'self' });
  });

  it('attribution : profil et périmètre changent, un périmètre incohérent est refusé', async () => {
    const created = await repo.createAccount(admin(), input);
    if (created.status !== 'ok') throw new Error('création');
    expect(await repo.assignAccount(admin(), created.account.id, { profile: 'dr_client', scope: { kind: 'dr', ids: [drZone] } })).toEqual({ status: 'ok' });
    expect((await repo.getAccount(created.account.id))?.profile).toBe('dr_client');
    expect(await repo.assignAccount(admin(), created.account.id, { profile: 'dr_client', scope: { kind: 'rs', ids: [rsZone] } })).toEqual({ status: 'refused', reason: 'invalid' });
  });

  it('journal : création, attribution, désactivation et réinitialisation tracées (audience agence), jamais de mot de passe', async () => {
    const created = await repo.createAccount(admin(), input);
    if (created.status !== 'ok') throw new Error('création');
    await repo.assignAccount(admin(), created.account.id, { profile: 'rs', scope: { kind: 'rs', ids: [rsZone] } });
    await repo.setAccountActive(admin(), created.account.id, false);
    const reset = await repo.resetAccountPassword(admin(), created.account.id);
    if (reset.status !== 'ok') throw new Error('réinitialisation');
    const events = (await repo.getEvents(admin())).filter((e) => ['EV-40', 'EV-41', 'EV-42', 'EV-43'].includes(e.code));
    expect(events.map((e) => e.code).sort()).toEqual(['EV-40', 'EV-41', 'EV-42', 'EV-43']);
    for (const e of events) expect(e.audience).toBe('agency');
    const dump = JSON.stringify(events);
    expect(dump).not.toContain(created.temporaryPassword);
    expect(dump).not.toContain(reset.temporaryPassword);
    expect(dump).not.toMatch(/password|hash|salt/i);
    // Une personne cliente ne lit pas ces événements (audience agence).
    expect((await repo.getEvents(ctxOf('direction_client'))).filter((e) => ['EV-40', 'EV-41', 'EV-42', 'EV-43'].includes(e.code))).toEqual([]);
  });

  it('création annulable : l\'annulation retire le compte', async () => {
    const { result, undoToken } = await repo.withUndo(admin(), () => repo.createAccount(admin(), input), (r) => r.status === 'ok');
    expect(result.status).toBe('ok');
    expect(undoToken).toBeTruthy();
    expect((await repo.undoWrite(admin(), undoToken as string)).status).toBe('ok');
    expect((await repo.listAccounts(admin())).some((a) => a.username === 'DemoRS01')).toBe(false);
  });
});

describe('connexion : réponse unique, durée constante, blocage', () => {
  it('la durée minimale de réponse est une constante d\'au moins 300 ms par défaut', () => {
    expect(read(path.join(ROOT, 'src/lib/auth.ts'))).toMatch(/DEMO_LOGIN_MIN_MS \?\? 400/);
  });

  it('même résultat et même durée pour un identifiant inconnu et pour un mauvais mot de passe', async () => {
    process.env.DEMO_LOGIN_MIN_MS = '250';
    const { attemptLogin, resetAttempts } = await import('@/lib/auth');
    resetAttempts();
    const time = async (u: string, p: string) => {
      const t = performance.now();
      const r = await attemptLogin(u, p);
      return { r, ms: performance.now() - t };
    };
    const unknown = await time('Inconnu01', 'mauvais-Mdp-12345');
    const wrong = await time('DemoAgence01', 'mauvais-Mdp-12345');
    expect(unknown.r).toBeNull();
    expect(wrong.r).toBeNull();
    expect(unknown.ms).toBeGreaterThanOrEqual(240);
    expect(wrong.ms).toBeGreaterThanOrEqual(240);
    expect(Math.abs(unknown.ms - wrong.ms)).toBeLessThan(120);
  });

  it('après cinq échecs le bon mot de passe est refusé aussi, sans changement de réponse', async () => {
    process.env.DEMO_LOGIN_MIN_MS = '0';
    const { attemptLogin, resetAttempts } = await import('@/lib/auth');
    resetAttempts();
    const created = await repo.createAccount(admin(), { username: 'DemoRS02', profile: 'rs', scope: { kind: 'rs', ids: [rsZone] } });
    if (created.status !== 'ok') throw new Error('création');
    for (let i = 0; i < MAX_FAILURES; i++) expect(await attemptLogin('DemoRS02', `faux-${i}-Mdp12345`)).toBeNull();
    expect(await attemptLogin('DemoRS02', created.temporaryPassword)).toBeNull();
    resetAttempts();
    expect((await attemptLogin('DemoRS02', created.temporaryPassword))?.username).toBe('DemoRS02');
  });

  it('jeton de session signé : modifié, tronqué ou vide, il est refusé', async () => {
    const { readSession, signSession } = await import('@/lib/auth');
    const token = signSession('11111111-1111-4111-8111-111111111111');
    expect(readSession(token)).toBe('11111111-1111-4111-8111-111111111111');
    expect(readSession(`${token.slice(0, -2)}00`)).toBeNull();
    expect(readSession(token.replace('1111', '2222'))).toBeNull();
    expect(readSession('seulement')).toBeNull();
    expect(readSession(undefined)).toBeNull();
  });
});

describe('formulaire de connexion : attributs du trousseau et aucun envoi automatique (D188)', () => {
  const src = read(path.join(ROOT, 'src/components/LoginForm.tsx'));
  it('autocomplete standard, name et id stables, balise form, jamais autocomplete="off"', () => {
    expect(src).toContain('<form');
    expect(src).toMatch(/id="username" name="username"[^>]*autoComplete="username"/);
    expect(src).toMatch(/id="password" name="password" type="password" autoComplete="current-password"/);
    expect(src).not.toMatch(/autoComplete="off"/);
  });
  it('l\'envoi ne part que de la soumission : aucun gestionnaire de saisie ni de changement ne le déclenche', () => {
    expect(src).not.toMatch(/onChange|onInput|onBlur|onAnimationStart|useEffect/);
    expect(src.match(/fetch\(/g)?.length).toBe(1);
    expect(src).toContain('onSubmit={submit}');
  });
});

describe('retour à la page demandée : chemins internes seulement (D183)', async () => {
  const { safeReturnTo } = await import('@/lib/return-to');
  it('accepte les pages de l\'application, requête comprise', () => {
    expect(safeReturnTo('/fr/needs')).toBe('/fr/needs');
    expect(safeReturnTo('/en/settings/accounts?filter=active&sort=username&dir=desc')).toBe('/en/settings/accounts?filter=active&sort=username&dir=desc');
    expect(safeReturnTo('/fr')).toBe('/fr');
  });
  it('refuse tout ce qui sort de l\'application ou boucle', () => {
    for (const bad of [['/', '/hors'].join(''), '/\\autre', ['https:', '', 'hors', 'fr'].join('/'), 'javascript:alert(1)', '/fr/../admin', '/fr/%2e%2e/admin', '%2F%2Fhors', '/de/needs', 'fr/needs', '', '/fr/start', '/fr/change-password', '/fr/needs\n', `/fr/${'a'.repeat(600)}`, ['/fr/x:', '', 'hors'].join('/'), undefined, null, 42]) {
      expect(safeReturnTo(bad as never), String(bad)).toBeNull();
    }
  });
});

describe('titres d\'écran du glossaire 4 quinquies (D186)', () => {
  const glossary = read(path.join(ROOT, 'docs/GLOSSAIRE_FR_EN.md'));
  const section = glossary.slice(glossary.indexOf('## 4 quinquies'), glossary.indexOf('## 4 sexies'));
  const fr = JSON.parse(read(path.join(ROOT, 'messages/fr.json'))) as { titles: Record<string, string> };
  const en = JSON.parse(read(path.join(ROOT, 'messages/en.json'))) as { titles: Record<string, string> };
  const rows = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Écran') && !l.startsWith('|---')).map((l) => l.split('|').map((c) => c.trim()));
  it('chaque titre du glossaire est repris tel quel, en français et en anglais, avec les mêmes clés', () => {
    const KEYS: Record<string, string> = {
      'Saisir un besoin': 'newNeed', 'Saisir plusieurs besoins': 'batch', 'Fixer les échéances de saisie': 'deadlineSettings',
      'Dates limites mois par mois': 'deadlinesByMonth', 'Régler les dispositifs': 'schemeSettings', 'Réouvertures à décider': 'reopeningsToDecide',
      'Saisies à relancer': 'entriesToChase', 'Courriels à valider': 'emailsToApprove', 'Ce qui demande votre attention': 'attention',
      'Connexion': 'signIn', 'Gérer les accès': 'manageAccess',
    };
    expect(Object.keys(fr.titles).sort()).toEqual(Object.keys(en.titles).sort());
    for (const [frTitle, key] of Object.entries(KEYS)) {
      const row = rows.find((r) => r[3] === frTitle);
      expect(row, frTitle).toBeTruthy();
      expect(fr.titles[key]).toBe(frTitle);
      expect(en.titles[key]).toBe(row![4]);
    }
  });
});
