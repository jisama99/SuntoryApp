import { expect, test } from '@playwright/test';
import path from 'node:path';
import { LOCALES, demoPassword, loginAs, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A1f');
const SIZES = [{ w: 1440, h: 900 }, { w: 390, h: 844 }] as const;
const THEMES = ['light', 'dark'] as const;

// Aucun mot de passe en clair dans les captures : le champ de mot de passe reste masqué et le mot de passe temporaire
// affiché une seule fois est remplacé par des points avant la prise de vue.
for (const locale of LOCALES) {
  for (const size of SIZES) {
    test(`A1f ${locale} ${size.w} : connexion, erreur, changement de mot de passe, comptes`, async ({ page, context }) => {
      test.setTimeout(120_000);
      const w = watch(page);
      await page.setViewportSize({ width: size.w, height: size.h });
      const fr = locale === 'fr';
      const shot = (name: string, theme: string) => page.screenshot({ path: path.join(OUT, `${name}_${theme}_${locale}_${size.w}.png`) });
      const setTheme = (theme: string) => context.addCookies([{ name: 'demo_theme', value: theme, url: 'http://localhost:3100' }]);
      const username = fr ? 'Identifiant' : 'Username';
      const password = fr ? 'Mot de passe' : 'Password';

      for (const theme of THEMES) {
        await setTheme(theme);
        await context.clearCookies({ name: 'demo_session' });
        await page.goto(`/${locale}/start`);
        await page.waitForLoadState('networkidle');
        await shot('login', theme);
        await page.getByLabel(username).fill('DemoAgence01');
        await page.getByLabel(password).fill(demoPassword('DemoAgence01'));
        await shot('login_filled', theme);
        if (theme === 'light') {
          await page.getByLabel(password).fill('mot-de-passe-faux-12345');
          await page.getByRole('button', { name: fr ? 'Connexion' : 'Sign in' }).click();
          await expect(page.locator('#login-error')).toBeVisible();
          await page.waitForTimeout(300);
          await shot('login_error', theme);
        }
      }

      await setTheme('light');
      await context.clearCookies({ name: 'demo_session' });
      await loginAs(context, 'DemoAgence01');
      await page.goto(`/${locale}/settings`);
      await page.waitForLoadState('networkidle');
      await shot('settings_accounts_card', 'light');
      for (const theme of THEMES) {
        await setTheme(theme);
        await page.goto(`/${locale}/settings/accounts`);
        await page.waitForLoadState('networkidle');
        await shot('accounts', theme);
      }
      await setTheme('light');
      const create = page.getByTestId('account-create');
      await create.locator('#new-username').fill(`DemoRS${size.w === 1440 ? '5' : '6'}${fr ? '1' : '2'}`);
      await create.locator('#new-profile').selectOption('rs');
      await create.locator('#new-zone').selectOption({ index: 1 });
      await create.getByRole('button', { name: fr ? 'Créer' : 'Create', exact: true }).click();
      await expect(page.getByTestId('temp-password')).toBeVisible();
      await page.getByTestId('temp-password-value').evaluate((el) => { el.textContent = '••••••••••••••'; });
      await page.waitForTimeout(400);
      await page.getByTestId('temp-password').scrollIntoViewIfNeeded();
      await shot('account_created', 'light');
      await page.getByRole('status', { name: 'Confirmation' }).getByRole('button', { name: fr ? 'Annuler' : 'Undo' }).click();
      await expect(page.getByTestId('temp-password')).toHaveCount(0);

      // Premier accès : page de changement du mot de passe temporaire (compte créé puis connecté).
      await context.clearCookies({ name: 'demo_session' });
      expect(w.external).toEqual([]);
    });
  }
}

// Page de changement du mot de passe temporaire : compte créé par l'agence puis première connexion.
for (const locale of LOCALES) {
  test(`A1f ${locale} : premier accès, changement du mot de passe temporaire`, async ({ page, context }) => {
    test.setTimeout(120_000);
    const fr = locale === 'fr';
    await loginAs(context, 'DemoAgence01');
    await page.goto(`/${locale}/settings/accounts`);
    const create = page.getByTestId('account-create');
    const name = `DemoCap${fr ? 'Fr' : 'En'}`;
    await create.locator('#new-username').fill(name);
    await create.locator('#new-profile').selectOption('agency_operator');
    await create.getByRole('button', { name: fr ? 'Créer' : 'Create', exact: true }).click();
    await expect(page.getByTestId('temp-password')).toBeVisible();
    const temporary = (await page.getByTestId('temp-password-value').innerText()).trim();
    await context.clearCookies({ name: 'demo_session' });
    for (const size of SIZES) {
      for (const theme of THEMES) {
        await context.addCookies([{ name: 'demo_theme', value: theme, url: 'http://localhost:3100' }]);
        await page.setViewportSize({ width: size.w, height: size.h });
        await context.clearCookies({ name: 'demo_session' });
        await page.goto(`/${locale}/start`);
        await page.getByLabel(fr ? 'Identifiant' : 'Username').fill(name);
        await page.getByLabel(fr ? 'Mot de passe' : 'Password').fill(temporary);
        await page.getByRole('button', { name: fr ? 'Connexion' : 'Sign in' }).click();
        await expect(page).toHaveURL(/change-password$/);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(OUT, `change_password_${theme}_${locale}_${size.w}.png`) });
      }
    }
    await context.addCookies([{ name: 'demo_theme', value: 'light', url: 'http://localhost:3100' }]);
  });
}
