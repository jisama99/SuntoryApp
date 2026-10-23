import { expect, test } from '@playwright/test';
import path from 'node:path';
import { LOCALES, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A2b');

// Règle 16 (D159) : états visibles de la confirmation, du tri, des cartes mobiles, des feuilles et des raccourcis.
for (const locale of LOCALES) {
  test(`A2b règle 16 ${locale} : tri, cartes, confirmation annulable, raccourcis, feuille, squelette, sombre`, async ({ page, context }) => {
    test.setTimeout(120_000);
    const w = watch(page);
    const shot = (name: string, full = false) => page.screenshot({ path: path.join(OUT, `r16_${name}_${locale}.png`), fullPage: full });
    const table = page.getByRole('table', { name: /Besoins de votre périmètre|Needs in your scope/ });

    await setProfile(context, 'agency_operator');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/needs?sort=hours&dir=desc`);
    await expect(table).toBeVisible();
    await table.scrollIntoViewIfNeeded();
    await shot('sort_desktop_1440');
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(300);
    await shot('shortcuts_1440');
    await page.keyboard.press('Escape');

    await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
    await page.goto(`/${locale}/needs?sort=hours&dir=desc`);
    await expect(table).toBeVisible();
    await table.scrollIntoViewIfNeeded();
    await shot('sort_dark_1440');
    await context.addCookies([{ name: 'demo_theme', value: 'light', url: 'http://localhost:3100' }]);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/needs?sort=hours&dir=desc`);
    await expect(table).toBeVisible();
    await page.getByRole('navigation', { name: /Trier le tableau|Sort the table/ }).scrollIntoViewIfNeeded();
    await shot('cards_390');

    await page.goto(`/${locale}/needs/new`);
    await page.locator('button[aria-haspopup="dialog"]').first().click();
    await shot('picker_sheet_390');

    await setProfile(context, 'agency_admin');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/settings/deadlines`);
    const first = page.getByTestId('outbox').locator('li').first();
    await first.getByRole('button').first().click();
    await expect(page.getByRole('status', { name: 'Confirmation' })).toBeVisible();
    await page.waitForTimeout(500);
    await shot('confirmation_1440');
    await page.getByRole('status', { name: 'Confirmation' }).getByRole('button').first().click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/settings/deadlines`);
    await page.getByTestId('outbox').locator('li').first().getByRole('button').first().click();
    await expect(page.getByRole('status', { name: 'Confirmation' })).toBeVisible();
    await page.waitForTimeout(500);
    await shot('confirmation_390');
    await page.getByRole('status', { name: 'Confirmation' }).getByRole('button').first().click();

    await setProfile(context, 'provider_admin');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/admin`);
    await page.getByTestId('skeleton').scrollIntoViewIfNeeded();
    await shot('skeleton_1440');

    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });
}
