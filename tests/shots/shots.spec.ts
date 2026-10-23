import { test } from '@playwright/test';
import path from 'node:path';
import { LOCALES, PROFILES, setProfile, watch } from '../e2e/helpers';

const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

for (const profile of PROFILES) {
  for (const locale of LOCALES) {
    for (const w of WIDTHS) {
      test(`capture ${profile} ${locale} ${w.name}`, async ({ page, context }) => {
        await setProfile(context, profile);
        await page.setViewportSize({ width: w.width, height: w.height });
        const watcher = watch(page);
        await page.goto(`/${locale}`);
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: path.join('docs', 'captures', 'A1', `${profile}_${locale}_${w.name}.png`),
          fullPage: true,
        });
        if (watcher.external.length || watcher.consoleErrors.length) {
          throw new Error(`externe: ${watcher.external.join(',')} console: ${watcher.consoleErrors.join(' | ')}`);
        }
      });
    }
  }
}

// Pages complémentaires utiles à la revue visuelle (profil technique).
for (const locale of LOCALES) {
  test(`capture bibliothèque de composants ${locale}`, async ({ page, context }) => {
    await setProfile(context, 'provider_admin');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/admin`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join('docs', 'captures', 'A1', `components_${locale}_1440.png`), fullPage: true });
  });
  test(`capture mode sombre bibliothèque ${locale}`, async ({ page, context }) => {
    await setProfile(context, 'provider_admin');
    await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
    await page.setViewportSize({ width: 1440, height: 900 });
    const watcher = watch(page);
    await page.goto(`/${locale}/admin`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join('docs', 'captures', 'A1', `components_dark_${locale}_1440.png`), fullPage: true });
    if (watcher.external.length || watcher.consoleErrors.length) throw new Error(watcher.consoleErrors.join(' | '));
  });
  test(`capture mode sombre accueil ${locale}`, async ({ page, context }) => {
    await setProfile(context, 'dr_client');
    await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join('docs', 'captures', 'A1', `home_dark_${locale}_390.png`), fullPage: true });
  });
  test(`capture alertes agence ${locale}`, async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/alerts`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join('docs', 'captures', 'A1', `alerts_agency_${locale}_1440.png`), fullPage: true });
  });
}
