import { expect, test } from '@playwright/test';
import path from 'node:path';
import { LOCALES, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A2b');

// Vues à la taille réelle de l'écran (pas de capture pleine page) : l'expérience d'un poste de bureau et d'un mobile.
for (const locale of LOCALES) {
  test(`A2b gabarit ${locale} : bureau déployé, bureau replié, défilement, mobile fermé et ouvert, sombre`, async ({ page, context }) => {
    test.setTimeout(120_000);
    const w = watch(page);
    const shot = (name: string) => page.screenshot({ path: path.join(OUT, `shell_${name}_${locale}.png`) });
    await setProfile(context, 'agency_admin');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/needs`);
    await page.waitForLoadState('networkidle');
    await shot('desktop_expanded_top');
    await page.evaluate(() => window.scrollTo(0, 1400));
    await shot('desktop_expanded_scrolled');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('button', { name: /Réduire le menu|Collapse the menu/ }).click();
    await expect(page.locator('[data-collapsed=true]')).toHaveCount(1);
    await page.waitForTimeout(400);
    await shot('desktop_collapsed_top');
    await page.goto(`/${locale}/settings/dispositifs?dispositif=second_placement`);
    await page.waitForLoadState('networkidle');
    await shot('desktop_collapsed_params');
    await page.getByRole('button', { name: /Déployer le menu|Expand the menu/ }).click();

    await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
    await page.goto(`/${locale}/needs/batch`);
    await page.waitForLoadState('networkidle');
    await shot('desktop_dark_batch');
    await context.addCookies([{ name: 'demo_theme', value: 'light', url: 'http://localhost:3100' }]);

    await setProfile(context, 'rs');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/needs`);
    await page.waitForLoadState('networkidle');
    await shot('mobile_closed_top');
    await page.evaluate(() => window.scrollTo(0, 1500));
    await shot('mobile_closed_scrolled');
    await page.getByRole('button', { name: /^(Menu)$/ }).click();
    await shot('mobile_drawer_open');
    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });
}
