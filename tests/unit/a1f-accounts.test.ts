/**
 * Tests unitaires -- Lot A1f : AccountRepository (D189).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { accountRepository } from '@/data';
import { hashPassword } from '@/lib/auth';
import { resetDemoState } from '@/data/memory-repository';

const CTX_AGENCY_ADMIN = {
  profileId: 'agency_admin' as const,
  side: 'agency' as const,
  scope: { kind: 'all' as const },
  locale: 'fr' as const,
  vocabulary: 'agency' as const,
  firstName: null,
};

const CTX_DIR_CLIENT = {
  profileId: 'direction_client' as const,
  side: 'client' as const,
  scope: { kind: 'all' as const },
  locale: 'fr' as const,
  vocabulary: 'client' as const,
  firstName: null,
};

beforeEach(() => { resetDemoState(); });

describe('authenticate', () => {
  it('AgAdmin01 avec Demo_Agence_2026 -> compte agency_admin', async () => {
    const acc = await accountRepository.authenticate('AgAdmin01', 'Demo_Agence_2026');
    expect(acc).not.toBeNull();
    expect(acc?.profile_id).toBe('agency_admin');
  });

  it('mauvais mot de passe -> null', async () => {
    const acc = await accountRepository.authenticate('AgAdmin01', 'mauvais');
    expect(acc).toBeNull();
  });

  it('compte inconnu -> null', async () => {
    const acc = await accountRepository.authenticate('InconNu99', 'Demo_Agence_2026');
    expect(acc).toBeNull();
  });
});

describe('listAccounts', () => {
  it('agency_admin voit tous les comptes', async () => {
    const list = await accountRepository.listAccounts(CTX_AGENCY_ADMIN);
    expect(list.length).toBeGreaterThan(0);
  });

  it('direction_client ne voit aucun compte', async () => {
    const list = await accountRepository.listAccounts(CTX_DIR_CLIENT);
    expect(list).toHaveLength(0);
  });

  it('le hash est masque (***)', async () => {
    const list = await accountRepository.listAccounts(CTX_AGENCY_ADMIN);
    for (const acc of list) expect(acc.password_hash).toBe('***');
  });
});

describe('createAccount', () => {
  it('cree un compte avec statut temp_password', async () => {
    const r = await accountRepository.createAccount(CTX_AGENCY_ADMIN, {
      username: 'NouvelAgent01',
      profile_id: 'rs',
      scope: { kind: 'all' },
      first_name: 'Alice',
    });
    expect(r.status).toBe('ok');
    const acc = await accountRepository.getAccountByUsername('NouvelAgent01');
    expect(acc?.status).toBe('temp_password');
  });

  it('doublon : refus avec reason duplicate', async () => {
    await accountRepository.createAccount(CTX_AGENCY_ADMIN, {
      username: 'NouvelAgent02',
      profile_id: 'rs',
      scope: { kind: 'all' },
      first_name: null,
    });
    const r = await accountRepository.createAccount(CTX_AGENCY_ADMIN, {
      username: 'NouvelAgent02',
      profile_id: 'rs',
      scope: { kind: 'all' },
      first_name: null,
    });
    expect(r.status).toBe('refused');
    if (r.status === 'refused') expect(r.reason).toBe('duplicate');
  });

  it('agency_admin ne peut pas creer un provider_admin', async () => {
    const r = await accountRepository.createAccount(CTX_AGENCY_ADMIN, {
      username: 'Prest99',
      profile_id: 'provider_admin',
      scope: { kind: 'all' },
      first_name: null,
    });
    expect(r.status).toBe('refused');
    if (r.status === 'refused') expect(r.reason).toBe('forbidden');
  });
});

describe('deactivateAccount', () => {
  it('desactive un compte existant', async () => {
    const r = await accountRepository.deactivateAccount(CTX_AGENCY_ADMIN, 'AgAdmin01');
    expect(r.status).toBe('ok');
    const acc = await accountRepository.getAccountByUsername('AgAdmin01');
    expect(acc?.status).toBe('inactive');
  });

  it('compte inactif -> authenticate retourne null', async () => {
    await accountRepository.deactivateAccount(CTX_AGENCY_ADMIN, 'AgAdmin01');
    const acc = await accountRepository.authenticate('AgAdmin01', 'Demo_Agence_2026');
    expect(acc).toBeNull();
  });
});

describe('resetAccountPassword', () => {
  it('renvoie un mot de passe temporaire non vide', async () => {
    const r = await accountRepository.resetAccountPassword(CTX_AGENCY_ADMIN, 'AgAdmin01');
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.temp_password).toBeTruthy();
      expect(r.temp_password!.length).toBeGreaterThan(6);
    }
  });

  it("le mot de passe temporaire fonctionne a l'authentification", async () => {
    const r = await accountRepository.resetAccountPassword(CTX_AGENCY_ADMIN, 'AgAdmin01');
    if (r.status === 'ok' && r.temp_password) {
      const acc = await accountRepository.authenticate('AgAdmin01', r.temp_password);
      expect(acc).not.toBeNull();
    }
  });
});

describe('changePassword', () => {
  it('change le mot de passe et passe le statut a active', async () => {
    await accountRepository.resetAccountPassword(CTX_AGENCY_ADMIN, 'AgAdmin01');
    const r = await accountRepository.changePassword('AgAdmin01', hashPassword('NouveauMDP2026'));
    expect(r.status).toBe('ok');
    const acc = await accountRepository.getAccountByUsername('AgAdmin01');
    expect(acc?.status).toBe('active');
    const auth = await accountRepository.authenticate('AgAdmin01', 'NouveauMDP2026');
    expect(auth).not.toBeNull();
  });
});
