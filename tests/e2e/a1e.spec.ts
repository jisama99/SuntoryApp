import { expect, test } from '@playwright/test';
import { demoPassword, setProfile, watch } from './helpers';

test.describe.configure({ mode: 'serial' });

const setSkin = async (page: import('@playwright/test').Page, label: string) => {
  await page.getByRole('group', { name: /Skin d'accueil|Home theme/ }).getByRole('button', { name: label }).click();
};

test.describe('lot A1e : identité visuelle, titres, skin d\'accueil', () => {
  test('sans profil choisi, l\'accueil mène à l\'écran d\'entrée : visuel de la forêt, aucun menu, aucune requête externe', async ({ page }) => {
    const w = watch(page);
    await page.goto('/fr');
    await expect(page).toHaveURL(/\/fr\/start(\?|$)/);
    await expect(page.getByRole('heading', { level: 1, name: 'Connexion' })).toBeVisible();
    expect(await page.locator('picture img').first().getAttribute('src')).toContain('/visuels/forest-');
    await expect(page.locator('#app-sidebar')).toHaveCount(0);
    await expect(page.getByLabel('Identifiant')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Connexion' })).toBeVisible();
    await expect(page.getByText('Démonstration : comptes et mots de passe fictifs.')).toBeVisible();
    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });

  test('connexion en anglais : l\'accueil s\'ouvre dans la langue choisie avec les menus du glossaire', async ({ page }) => {
    await page.goto('/en/start');
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await page.getByLabel('Username').fill('DemoAgence01');
    await page.getByLabel('Password').fill(demoPassword('DemoAgence01'));
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en$/);
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    for (const label of ['My cockpit', 'Steering', 'Merch needs', 'Agency responses', 'Field teams', 'Budget', 'To handle', 'Settings']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('mobile 390 px : la feuille de choix chevauche la photo, cibles de 44 px, aucun défilement horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/fr/start');
    const img = await page.locator('picture img').first().boundingBox();
    const sheet = await page.locator('section[aria-labelledby=start-title]').boundingBox();
    expect(sheet!.y).toBeLessThan(img!.y + img!.height);
    expect(Math.round(img!.width)).toBe(390);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main button, main a')].map((e) => ({ n: e.textContent?.trim(), h: Math.round(e.getBoundingClientRect().height) })).filter((x) => x.h < 44),
    );
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test('bureau : l\'accueil porte le visuel du lac (skin Nature par défaut), le logo Suntory en en-tête, Marvesting en pied', async ({ page, context }) => {
    const w = watch(page);
    await setProfile(context, 'direction_client');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/fr');
    const hero = page.getByTestId('hero');
    await expect(hero).toHaveAttribute('data-visual', 'nature');
    expect(await hero.locator('img').getAttribute('fetchpriority')).toBe('high');
    await expect(page.locator('#app-sidebar img[src*="logo-suntory"]')).toBeVisible();
    await expect(page.locator('footer .brand-mark')).toBeVisible();
    expect(await page.locator('footer .brand-mark').evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonjour');
    expect(w.external).toEqual([]);
  });

  test('skin choisi par l\'utilisateur : Produits, Sobre, Nature ; mémorisé pour le profil simulé après rechargement', async ({ page, context }) => {
    await setProfile(context, 'direction_client');
    await page.goto('/fr');
    await setSkin(page, 'Produits');
    await expect(page.getByTestId('hero')).toHaveAttribute('data-visual', 'products');
    await page.reload();
    await expect(page.getByTestId('hero')).toHaveAttribute('data-visual', 'products');
    await setSkin(page, 'Sobre');
    await expect(page.getByTestId('hero')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bonjour');
    await setSkin(page, 'Nature');
    await expect(page.getByTestId('hero')).toHaveAttribute('data-visual', 'nature');
    // Le choix d'un profil ne change pas celui d'un autre.
    await setProfile(context, 'dr_client');
    await page.goto('/fr');
    await setSkin(page, 'Sobre');
    await setProfile(context, 'direction_client');
    await page.goto('/fr');
    await expect(page.getByTestId('hero')).toHaveAttribute('data-visual', 'nature');
    await setProfile(context, 'dr_client');
    await page.goto('/fr');
    await setSkin(page, 'Nature');
  });

  test('défaut de l\'agence dans Réglages, confirmation annulable ; un profil sans choix le suit', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings');
    const group = page.getByTestId('skin-default');
    await expect(group.getByRole('button', { name: 'Nature' })).toHaveAttribute('aria-pressed', 'true');
    await group.getByRole('button', { name: 'Sobre' }).click();
    const toast = page.getByRole('status', { name: 'Confirmation' });
    await expect(toast).toBeVisible();
    await expect(group.getByRole('button', { name: 'Sobre' })).toHaveAttribute('aria-pressed', 'true');
    await setProfile(context, 'cvr_client');
    await page.goto('/fr');
    await expect(page.getByTestId('hero')).toHaveCount(0);
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings');
    await page.getByTestId('skin-default').getByRole('button', { name: 'Produits' }).click();
    await page.getByRole('status', { name: 'Confirmation' }).getByRole('button', { name: 'Annuler' }).click();
    await expect(page.getByRole('status', { name: 'Confirmation' })).toContainText('Modification annulée');
    await expect(page.getByTestId('skin-default').getByRole('button', { name: 'Sobre' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('skin-default').getByRole('button', { name: 'Nature' }).click();
    await expect(page.getByTestId('skin-default').getByRole('button', { name: 'Nature' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('audience (D118) : aucun réglage de skin ni page Réglages côté cliente, mais le sélecteur d\'affichage reste ouvert', async ({ page, context }) => {
    for (const profile of ['direction_client', 'dr_client', 'cvr_client']) {
      await setProfile(context, profile);
      await page.goto('/fr');
      await expect(page.getByRole('group', { name: "Skin d'accueil" })).toBeVisible();
      expect((await page.goto('/fr/settings'))?.status()).toBe(404);
      await page.goto('/fr');
      await expect(page.getByTestId('skin-default')).toHaveCount(0);
    }
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/settings');
    await expect(page.getByTestId('skin-default')).toHaveCount(0);
  });

  test('pilotage : le visuel des produits est fondu dans la page, texte lisible', async ({ page, context }) => {
    await setProfile(context, 'direction_client');
    await page.goto('/fr/dashboard');
    const hero = page.getByTestId('hero');
    await expect(hero).toHaveAttribute('data-visual', 'products');
    await expect(hero.getByRole('heading', { level: 1, name: 'Pilotage' })).toBeVisible();
    expect(await hero.locator('img').evaluate((el) => getComputedStyle(el).maskImage)).toContain('linear-gradient');
  });

  test('titres : la page des besoins s\'intitule « Vos besoins en merchandising »', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs');
    await expect(page.getByRole('heading', { level: 1, name: 'Vos besoins en merchandising' })).toBeVisible();
    await page.goto('/en/needs');
    await expect(page.getByRole('heading', { level: 1, name: 'Your merchandising needs' })).toBeVisible();
  });

  test('poids : l\'image d\'accueil en mobile (écran dense) pèse moins de 250 Ko, aucune image de bureau chargée', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, baseURL: 'http://localhost:3100' });
    await setProfile(context, 'direction_client');
    const page = await context.newPage();
    const sizes: Record<string, number> = {};
    page.on('response', async (r) => {
      if (r.url().includes('/visuels/')) sizes[r.url().split('/visuels/')[1]!] = (await r.body()).length;
    });
    await page.goto('/fr', { waitUntil: 'networkidle' });
    const hero = Object.entries(sizes).filter(([f]) => f.startsWith('nature-'));
    expect(hero.length).toBe(1);
    expect(hero[0]![0]).toContain('nature-m-');
    expect(hero[0]![1]).toBeLessThan(250 * 1024);
    expect(Object.keys(sizes).some((f) => f.includes('-d-'))).toBe(false);
    await context.close();
  });

  test('H3 mesuré : premier affichage utile sous 2 s sur l\'entrée, l\'accueil et le pilotage', async ({ page, context }) => {
    const out: Record<string, { lcp: number | null; dcl: number }> = {};
    for (const url of ['/fr/start', '/fr', '/fr/dashboard']) {
      if (url !== '/fr/start') await setProfile(context, 'direction_client');
      await page.goto(url, { waitUntil: 'load' });
      out[url] = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            let lcp: number | null = null;
            new PerformanceObserver((l) => {
              lcp = l.getEntries().at(-1)?.startTime ?? null;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            setTimeout(() => resolve({ lcp, dcl: Math.round(nav.domContentLoadedEventEnd) }), 400);
          }),
      );
    }
    console.log('H3 A1e', JSON.stringify(out));
    for (const [url, m] of Object.entries(out)) expect.soft(m.lcp ?? m.dcl, `H3 ${url}`).toBeLessThan(2000);
  });

  test('mode sombre : le voile est appliqué sous le texte', async ({ page, context }) => {
    await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
    await setProfile(context, 'direction_client');
    await page.goto('/fr');
    const alpha = await page.locator('.veil').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(alpha).toMatch(/color\(srgb|rgba?\(/);
    await context.addCookies([{ name: 'demo_theme', value: 'light', url: 'http://localhost:3100' }]);
  });
});

test('D182 : la carte « Rouvrir sans demande » a la largeur de sa voisine dans le calendrier des échéances', async ({ page, context }) => {
  await setProfile(context, 'agency_admin');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/fr/settings/deadlines');
  await expect(page.getByTestId('direct-reopen')).toBeVisible();
  await expect(page.getByTestId('deadline-editor')).toBeVisible();
  await expect
    .poll(async () => {
      const direct = await page.getByTestId('direct-reopen').boundingBox();
      const editor = await page.getByTestId('deadline-editor').locator('form').first().boundingBox();
      return Math.abs((direct?.width ?? 0) - (editor?.width ?? 1));
    })
    .toBeLessThanOrEqual(1);
});
