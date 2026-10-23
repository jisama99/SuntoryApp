import { randomBytes } from 'node:crypto';
import { expect, test } from '@playwright/test';
import type { Page, Request } from '@playwright/test';
import { demoPassword, loginAs, setProfile, watch } from './helpers';

test.describe.configure({ mode: 'serial' });

const fillLogin = async (page: Page, username: string, password: string) => {
  await page.getByLabel('Identifiant').fill(username);
  await page.getByLabel('Mot de passe').fill(password);
};
const loginCalls = (page: Page) => {
  const calls: Request[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('/api/login') && r.method() === 'POST') calls.push(r);
  });
  return calls;
};

test.describe('lot A1f : connexion par identifiant et comptes (D188, D189)', () => {
  test('sans session, toute page de l\'application renvoie vers la connexion', async ({ page }) => {
    for (const route of ['/fr', '/fr/needs', '/fr/settings', '/fr/settings/accounts', '/en/alerts']) {
      await page.goto(route);
      await expect(page, route).toHaveURL(/\/(fr|en)\/start$/);
    }
    await page.goto('/fr/start');
    await expect(page.getByRole('heading', { level: 1, name: 'Pilotage merchandising' })).toBeVisible();
    // Le choix de profil simulé a disparu de l'écran d'entrée.
    await expect(page.getByRole('button', { name: 'Agence (administrateur)' })).toHaveCount(0);
  });

  test('formulaire : balise form, attributs standard du trousseau, name et id stables, jamais autocomplete="off"', async ({ page }) => {
    await page.goto('/fr/start');
    const user = page.locator('form input#username');
    const pass = page.locator('form input#password');
    await expect(user).toHaveAttribute('name', 'username');
    await expect(user).toHaveAttribute('autocomplete', 'username');
    await expect(pass).toHaveAttribute('name', 'password');
    await expect(pass).toHaveAttribute('autocomplete', 'current-password');
    await expect(pass).toHaveAttribute('type', 'password');
    await expect(page.locator('[autocomplete="off"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Connexion' })).toHaveAttribute('type', 'submit');
  });

  for (const size of [{ w: 1440, h: 900, label: 'bureau' }, { w: 390, h: 844, label: '390 px' }]) {
    test(`remplissage sans connexion immédiate, puis connexion au clic seulement (${size.label})`, async ({ page }) => {
      await page.setViewportSize({ width: size.w, height: size.h });
      const calls = loginCalls(page);
      const w = watch(page);
      await page.goto('/fr/start');
      const password = demoPassword('DemoDirection01');
      // (a) remplissage par programme, puis simulation d'un remplissage automatique du navigateur : événements d'entrée et de changement.
      await fillLogin(page, 'DemoDirection01', password);
      await page.evaluate(() => {
        for (const id of ['username', 'password']) {
          const el = document.getElementById(id) as HTMLInputElement;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.dispatchEvent(new Event('blur'));
          el.dispatchEvent(new AnimationEvent('animationstart', { animationName: 'onautofillstart', bubbles: true }));
        }
      });
      await page.waitForTimeout(1200);
      await expect(page).toHaveURL(/\/fr\/start$/);
      // (d) aucun appel de connexion avant le clic.
      expect(calls).toHaveLength(0);
      // (b) le clic connecte.
      await page.getByRole('button', { name: 'Connexion' }).click();
      await expect(page).toHaveURL(/\/fr$/);
      expect(calls).toHaveLength(1);
      expect(w.external).toEqual([]);
      expect(w.consoleErrors.filter((e) => !e.includes('401'))).toEqual([]);
    });
  }

  test('Entrée tapée par l\'utilisateur envoie la connexion, comme le clic', async ({ page }) => {
    const calls = loginCalls(page);
    await page.goto('/fr/start');
    await fillLogin(page, 'DemoDR01', demoPassword('DemoDR01'));
    expect(calls).toHaveLength(0);
    await page.getByLabel('Mot de passe').press('Enter');
    await expect(page).toHaveURL(/\/fr$/);
    expect(calls).toHaveLength(1);
  });

  test('échec : message unique pour un mauvais mot de passe et un identifiant inconnu, aucun mot de passe dans l\'adresse, le stockage ni la réponse', async ({ page, context }) => {
    const w = watch(page);
    const bodies: string[] = [];
    page.on('response', async (r) => {
      if (r.url().endsWith('/api/login')) bodies.push(`${r.status()} ${await r.text()}`);
    });
    await page.goto('/fr/start');
    const secret = `Faux-${randomBytes(6).toString('hex')}9`;
    await fillLogin(page, 'DemoAgence05', secret);
    await page.getByRole('button', { name: 'Connexion' }).click();
    await expect(page.locator('#login-error')).toHaveText('Identifiant ou mot de passe incorrect');
    const first = await page.locator('#login-error').innerText();
    await fillLogin(page, 'PersonneInconnue', secret);
    await page.getByRole('button', { name: 'Connexion' }).click();
    await expect(page.locator('#login-error')).toHaveText(first);
    expect(new Set(bodies).size).toBe(1);
    expect(bodies[0]).toBe('401 {"ok":false}');
    expect(page.url()).not.toContain(secret);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain(secret);
    expect(JSON.stringify(await context.cookies())).not.toContain(secret);
    expect(w.external).toEqual([]);
    expect(JSON.stringify(w.consoleErrors)).not.toContain(secret);
  });

  test('limitation des essais : après cinq échecs, même le bon mot de passe est refusé avec le même message', async ({ page }) => {
    await page.goto('/fr/start');
    for (let i = 0; i < 5; i++) {
      await fillLogin(page, 'DemoCVR06', `faux-${i}-${randomBytes(4).toString('hex')}9`);
      await page.getByRole('button', { name: 'Connexion' }).click();
      await expect(page.locator('#login-error')).toHaveText('Identifiant ou mot de passe incorrect');
    }
    await fillLogin(page, 'DemoCVR06', demoPassword('DemoCVR06'));
    await page.getByRole('button', { name: 'Connexion' }).click();
    await expect(page.locator('#login-error')).toHaveText('Identifiant ou mot de passe incorrect');
    await expect(page).toHaveURL(/\/start$/);
  });

  test('cookie de session : httpOnly, signé ; un cookie falsifié est ignoré ; déconnexion', async ({ page, context }) => {
    await loginAs(context, 'DemoAgence02');
    const session = (await context.cookies()).find((c) => c.name === 'demo_session');
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe('Lax');
    await page.goto('/fr');
    await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible();
    await context.addCookies([{ name: 'demo_session', value: `${session!.value.slice(0, -3)}abc`, url: 'http://localhost:3100' }]);
    await page.goto('/fr/needs');
    await expect(page).toHaveURL(/\/start$/);
    await loginAs(context, 'DemoAgence02');
    await page.goto('/fr');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/fr\/start$/);
    expect((await context.cookies()).some((c) => c.name === 'demo_session' && c.value)).toBe(false);
    await page.goto('/fr/needs');
    await expect(page).toHaveURL(/\/start$/);
  });

  test('comptes réels : périmètre du compte, menus du profil, accès aux Réglages refusé hors agence (D118)', async ({ page, context }) => {
    const cases: Array<[string, boolean]> = [['DemoDirection01', false], ['DemoDR02', false], ['DemoCVR03', false], ['DemoAgence03', false], ['DemoPresta01', false], ['DemoAgence01', true]];
    for (const [username, canManage] of cases) {
      await context.clearCookies();
      await loginAs(context, username);
      await page.goto('/fr');
      await expect(page.locator('#app-sidebar')).toBeVisible();
      const accounts = await page.goto('/fr/settings/accounts');
      expect(accounts?.status() === 200, `${username} comptes`).toBe(canManage);
    }
    await context.clearCookies();
    await loginAs(context, 'DemoDR02');
    expect((await page.goto('/fr/settings'))?.status()).toBe(404);
    await page.goto('/fr');
    // Le périmètre vient du compte : une seule zone DR dans la liste d'accueil.
    await expect(page.getByRole('region', { name: 'Votre périmètre' }).or(page.locator('section[aria-labelledby=scope-title]')).locator('li').first()).toBeVisible();
    await expect(page.getByRole('group', { name: 'Affichage' })).toBeVisible();
  });

  test('visualisation « comme » : réservée au compte du prestataire', async ({ page, context }) => {
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr');
    await expect(page.getByText('Profil simulé')).toHaveCount(0);
    await context.addCookies([{ name: 'demo_view_as', value: 'sim.provider_admin', url: 'http://localhost:3100' }]);
    await context.addCookies([{ name: 'demo_view_as', value: 'sim.rs', url: 'http://localhost:3100' }]);
    await page.goto('/fr');
    // Un compte de l'agence ne devient pas RS en posant le cookie : il garde son menu (Réglages visibles).
    await expect(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Réglages' })).toBeVisible();
    await context.clearCookies();
    await loginAs(context, 'DemoPresta01');
    await page.goto('/fr');
    await expect(page.getByText('Profil simulé')).toBeVisible();
  });

  test('le prestataire qui consulte comme l\'agence administration ne voit pas la gestion des comptes', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings');
    await expect(page.getByRole('heading', { level: 1, name: 'Réglages' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Comptes' })).toHaveCount(0);
    expect((await page.goto('/fr/settings/accounts'))?.status()).toBe(404);
  });

  test('gestion des comptes : création, mot de passe temporaire affiché une fois, premier accès, désactivation, réinitialisation, annulation', async ({ page, context }) => {
    const w = watch(page);
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr/settings');
    await page.getByRole('link', { name: 'Ouvrir' }).last().click();
    await expect(page).toHaveURL(/\/settings\/accounts$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Comptes' })).toBeVisible();
    const table = page.getByTestId('accounts-table');
    await expect(table.locator('tbody tr')).toHaveCount(17);

    // Création d'un compte RS (aucun n'est préconfiguré).
    const create = page.getByTestId('account-create');
    await create.getByLabel('Identifiant').fill('DemoRS07');
    await create.getByLabel('Profil').selectOption('rs');
    await create.getByLabel('Zone').selectOption({ index: 1 });
    await create.getByRole('button', { name: 'Créer', exact: true }).click();
    const secret = page.getByTestId('temp-password');
    await expect(secret).toBeVisible();
    const temporary = (await page.getByTestId('temp-password-value').innerText()).trim();
    expect(temporary).toMatch(/^[a-zA-Z2-9]{14}$/);
    await expect(table.locator('tbody tr')).toHaveCount(18);
    await expect(table.locator('tr[data-username=DemoRS07]')).toContainText('Mot de passe temporaire');
    // Jamais relu : après rechargement, plus aucun mot de passe à l'écran ni dans la page.
    await page.reload();
    await expect(page.getByTestId('temp-password')).toHaveCount(0);
    expect(await page.content()).not.toContain(temporary);

    // Premier accès : le mot de passe temporaire doit être changé.
    await context.clearCookies();
    await page.goto('/fr/start');
    await fillLogin(page, 'DemoRS07', temporary);
    await page.getByRole('button', { name: 'Connexion' }).click();
    await expect(page).toHaveURL(/\/change-password$/);
    expect((await page.goto('/fr/needs'))?.url()).toMatch(/change-password$/);
    const next = `${randomBytes(8).toString('hex')}Aa`;
    await page.getByLabel('Mot de passe temporaire').fill(temporary);
    await page.locator('#new-password').fill('court1');
    await page.getByLabel('Confirmer le mot de passe').fill('court1');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Au moins 12 caractères, avec une lettre et un chiffre.')).toBeVisible();
    await page.locator('#new-password').fill(next);
    await page.getByLabel('Confirmer le mot de passe').fill(`${next}x`);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Les deux mots de passe ne correspondent pas.')).toBeVisible();
    await page.getByLabel('Confirmer le mot de passe').fill(next);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page).toHaveURL(/\/fr$/);
    // Le compte RS voit son périmètre, un seul secteur, et pas de gestion des comptes.
    expect((await page.goto('/fr/settings/accounts'))?.status()).toBe(404);
    await page.goto('/fr');
    await page.getByRole('button', { name: 'Se déconnecter' }).click();

    // L'agence désactive : la connexion est refusée ; elle réactive puis réinitialise.
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr/settings/accounts');
    const row = page.locator('tr[data-username=DemoRS07]');
    await row.getByRole('button', { name: 'Désactiver DemoRS07' }).click();
    await expect(row).toContainText('Désactivé');
    await context.clearCookies();
    await page.goto('/fr/start');
    await fillLogin(page, 'DemoRS07', next);
    await page.getByRole('button', { name: 'Connexion' }).click();
    await expect(page.locator('#login-error')).toHaveText('Identifiant ou mot de passe incorrect');
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr/settings/accounts');
    await row.getByRole('button', { name: 'Réactiver DemoRS07' }).click();
    await expect(row).toContainText('Actif');
    await row.getByRole('button', { name: 'Réinitialiser le mot de passe DemoRS07' }).click();
    const reset = (await row.getByTestId('temp-password-value').innerText()).trim();
    expect(reset).not.toBe(temporary);
    await expect(row).toContainText('Mot de passe temporaire');

    // Confirmation annulable : annuler la réinitialisation rend l'ancien mot de passe valide.
    await page.getByRole('status', { name: 'Confirmation' }).getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('status', { name: 'Confirmation' })).toContainText('Modification annulée');
    await expect(row.getByTestId('temp-password')).toHaveCount(0);
    // Même chose pour la création : annuler la création retire le compte.
    await create.getByLabel('Identifiant').fill('DemoRS08');
    await create.getByLabel('Profil').selectOption('agency_operator');
    await create.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.locator('tr[data-username=DemoRS08]')).toBeVisible();
    await page.getByRole('status', { name: 'Confirmation' }).getByRole('button', { name: 'Annuler' }).click();
    await expect(page.locator('tr[data-username=DemoRS08]')).toHaveCount(0);
    expect(w.external).toEqual([]);
  });

  test('l\'agence ne peut ni modifier ni désactiver le compte du prestataire, ni son propre compte', async ({ page, context }) => {
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr/settings/accounts');
    const presta = page.locator('tr[data-username=DemoPresta01]');
    await expect(presta).toBeVisible();
    await expect(presta.getByRole('button')).toHaveCount(0);
    const self = page.locator('tr[data-username=DemoAgence01]');
    await expect(self.getByRole('button', { name: /Désactiver/ })).toHaveCount(0);
  });

  test('règle 14 : filtre et tri dans l\'URL, lien profond, retour arrière et rechargement', async ({ page, context }) => {
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr/settings/accounts?filter=active&sort=username&dir=desc');
    const names = async () => (await page.getByTestId('accounts-table').locator('tbody tr').evaluateAll((rows) => rows.map((r) => (r as HTMLElement).dataset.username ?? '')));
    const desc = await names();
    expect(desc).toEqual([...desc].sort((a, b) => b.toLowerCase().localeCompare(a.toLowerCase())));
    await page.getByRole('link', { name: /Identifiant/ }).first().click();
    await expect(page).toHaveURL(/sort=username&dir=asc/);
    await page.goBack();
    await expect(page).toHaveURL(/dir=desc/);
    await page.reload();
    expect(await names()).toEqual(desc);
    await page.getByRole('navigation', { name: 'Statut des comptes' }).getByRole('link', { name: 'Désactivés' }).click();
    await expect(page).toHaveURL(/filter=disabled/);
  });

  test('mobile 390 px : connexion et comptes sans défilement horizontal, cibles de 44 px', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/fr/start');
    const small = async () =>
      page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main button, main a, main input, main select')].filter((e) => e.getClientRects().length > 0).map((e) => ({ n: e.id || e.textContent?.trim(), h: Math.round(e.getBoundingClientRect().height) })).filter((x) => x.h < 44));
    expect(await small()).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await loginAs(context, 'DemoAgence01');
    await page.goto('/fr/settings/accounts');
    await expect(page.getByTestId('accounts-table')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(await small()).toEqual([]);
  });

  test('H3 mesuré : premier affichage utile sous 2 s sur la connexion et la gestion des comptes', async ({ page, context }) => {
    const out: Record<string, number> = {};
    const measure = (url: string) =>
      page.goto(url, { waitUntil: 'load' }).then(() =>
        page.evaluate(() => new Promise<number>((resolve) => {
          let lcp = 0;
          new PerformanceObserver((l) => { lcp = l.getEntries().at(-1)?.startTime ?? lcp; }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => resolve(Math.round(lcp)), 400);
        })),
      );
    out['/fr/start'] = await measure('/fr/start');
    await loginAs(context, 'DemoAgence01');
    out['/fr/settings/accounts'] = await measure('/fr/settings/accounts');
    console.log('H3 A1f', JSON.stringify(out));
    for (const [url, ms] of Object.entries(out)) expect.soft(ms, `H3 ${url}`).toBeLessThan(2000);
  });

  test('anglais : libellés de la connexion et de la gestion des comptes', async ({ page, context }) => {
    await page.goto('/en/start');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await page.getByLabel('Username').fill('PersonneInconnue');
    await page.getByLabel('Password').fill(`x-${randomBytes(4).toString('hex')}9`);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('#login-error')).toHaveText('Username or password incorrect');
    await loginAs(context, 'DemoAgence01');
    await page.goto('/en/settings/accounts');
    await expect(page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});
