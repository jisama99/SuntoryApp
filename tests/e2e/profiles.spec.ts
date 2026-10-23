import { expect, test } from '@playwright/test';
import { EXPECTED_MENU, LOCALES, PROFILES, setProfile, watch } from './helpers';

const HREF: Record<string, string> = {
  home: '', dashboard: '/dashboard', needs: '/needs', proposals: '/proposals', field: '/field',
  budget: '/budget', alerts: '/alerts', settings: '/settings', admin: '/admin',
};

for (const profile of PROFILES) {
  for (const locale of LOCALES) {
    test(`${profile} ${locale} : menu, bandeau, aucune requête externe, console vide`, async ({ page, context }) => {
      await setProfile(context, profile);
      const w = watch(page);
      await page.goto(`/${locale}`);

      await expect(page.getByRole('note').filter({ hasText: locale === 'fr' ? 'DONNÉES FICTIVES' : 'DEMO DATA' })).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const expectedHrefs = EXPECTED_MENU[profile]!.map((k) => `/${locale}${HREF[k]}`);
      const nav = page.locator('aside nav a');
      const hrefs = await nav.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href')));
      expect(hrefs).toEqual(expectedHrefs);

      expect(w.external).toEqual([]);
      expect(w.consoleErrors).toEqual([]);
    });
  }
}

test('une entrée absente du menu du profil donne une page 404', async ({ page, context }) => {
  await setProfile(context, 'rs');
  const res = await page.goto('/fr/budget');
  expect(res?.status()).toBe(404);
  await setProfile(context, 'cvr_client');
  const res2 = await page.goto('/fr/admin');
  expect(res2?.status()).toBe(404);
});

test('les profils cliente ne voient aucune étiquette « Agence uniquement » sur la page Alertes', async ({ page, context }) => {
  for (const profile of ['direction_client', 'dr_client', 'cvr_client', 'rs']) {
    await setProfile(context, profile);
    await page.goto('/fr/alerts');
    await expect(page.getByText('Agence uniquement')).toHaveCount(0);
    await expect(page.getByText('Le chiffrage d\'un besoin est incomplet.')).toHaveCount(0);
  }
});

test('le profil agence voit les alertes réservées à l\'agence', async ({ page, context }) => {
  await setProfile(context, 'agency_operator');
  await page.goto('/fr/alerts');
  await expect(page.getByText('Agence uniquement').first()).toBeVisible();
});

test('changement de profil par le sélecteur et de langue', async ({ page, context }) => {
  await setProfile(context, 'direction_client');
  await page.goto('/fr');
  await page.getByText('Profil simulé :').click();
  await page.getByRole('button', { name: 'RS', exact: true }).click();
  await expect(page.locator('aside nav a')).toHaveCount(5);
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('le focus clavier est visible', async ({ page, context }) => {
  await setProfile(context, 'direction_client');
  await page.goto('/fr');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle };
  });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
});

test('navigation complète au clavier jusqu\'à une entrée de menu', async ({ page, context }) => {
  await setProfile(context, 'direction_client');
  await page.goto('/fr');
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['A', 'BUTTON', 'SUMMARY']).toContain(focused);
});

test('mode sombre : choix mémorisé, appliqué côté serveur, fond sombre et contraste conservé', async ({ page, context }) => {
  await setProfile(context, 'direction_client');
  await page.goto('/fr');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
  await page.getByRole('button', { name: 'Sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('button', { name: 'Sombre' })).toHaveAttribute('aria-pressed', 'true');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(14, 19, 22)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Clair' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(light).toBe('rgb(244, 248, 250)');
});

test('mode Système : suit la préférence du navigateur', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark', baseURL: 'http://localhost:3100' });
  await setProfile(ctx, 'direction_client');
  const page = await ctx.newPage();
  await page.goto('/fr');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(14, 19, 22)');
  await ctx.close();
});
