import { expect, test } from '@playwright/test';
import path from 'node:path';
import { LOCALES, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A1e');
const SIZES = [{ w: 1440, h: 900 }, { w: 390, h: 844 }] as const;
const THEMES = ['light', 'dark'] as const;

// Vues à la taille de l'écran : entrée, accueil (trois skins), pilotage, Réglages (défaut du skin), en clair et en sombre.
for (const locale of LOCALES) {
  for (const size of SIZES) {
    test(`A1e ${locale} ${size.w} : entrée, accueil, skins, pilotage, réglages`, async ({ page, context }) => {
      test.setTimeout(120_000);
      const w = watch(page);
      await page.setViewportSize({ width: size.w, height: size.h });
      const shot = (name: string, theme: string) => page.screenshot({ path: path.join(OUT, `${name}_${theme}_${locale}_${size.w}.png`) });
      const setTheme = (theme: string) => context.addCookies([{ name: 'demo_theme', value: theme, url: 'http://localhost:3100' }]);
      const skin = async (label: string) => {
        const button = page.getByRole('group', { name: /Skin d'accueil|Home theme/ }).getByRole('button', { name: label });
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => Promise.all([...document.querySelectorAll('picture img')].map((i) => (i as HTMLImageElement).decode().catch(() => undefined))));
        await page.waitForTimeout(400);
      };

      for (const theme of THEMES) {
        await setTheme(theme);
        await context.clearCookies({ name: 'demo_profile_simule' });
        await page.goto(`/${locale}/start`);
        await page.waitForLoadState('networkidle');
        await shot('start', theme);

        await setProfile(context, 'direction_client');
        await page.goto(`/${locale}`);
        await page.waitForLoadState('networkidle');
        await skin(locale === 'fr' ? 'Nature' : 'Nature');
        await shot('home_nature', theme);
        if (theme === 'light') {
          await skin(locale === 'fr' ? 'Produits' : 'Products');
          await shot('home_products', theme);
          await skin(locale === 'fr' ? 'Sobre' : 'Plain');
          await shot('home_plain', theme);
          await skin('Nature');
        }
        await page.goto(`/${locale}/dashboard`);
        await page.waitForLoadState('networkidle');
        await shot('dashboard', theme);
      }

      await setTheme('light');
      await setProfile(context, 'agency_admin');
      await page.goto(`/${locale}/settings`);
      await page.waitForLoadState('networkidle');
      await shot('settings_skin', 'light');
      await setProfile(context, 'direction_client');
      expect(w.external).toEqual([]);
      expect(w.consoleErrors).toEqual([]);
    });
  }
}
