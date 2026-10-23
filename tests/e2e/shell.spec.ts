import { expect, test } from '@playwright/test';
import { setProfile } from './helpers';

test.describe('gabarit : menu latéral repliable et collant, tiroir mobile', () => {
  test('bureau : le menu se replie en rail d\'icônes, la préférence survit au rechargement (cookie lu côté serveur)', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/needs');
    const toggle = page.getByRole('button', { name: 'Réduire le menu' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const wide = await page.locator('#app-sidebar').evaluate((el) => el.getBoundingClientRect().width);
    expect(wide).toBeGreaterThan(240);
    await toggle.click();
    const rail = page.getByRole('button', { name: 'Déployer le menu' });
    await expect(rail).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => page.locator('#app-sidebar').evaluate((el) => el.getBoundingClientRect().width)).toBeLessThan(120);
    // Les libellés restent accessibles (lecteur d'écran, info-bulle) alors que le texte est masqué.
    await expect(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Besoins' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Paramètres' }).first()).toHaveAttribute('title', 'Paramètres');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Déployer le menu' })).toBeVisible();
    await expect(page.locator('[data-collapsed=true]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Déployer le menu' }).click();
    await expect(page.getByRole('button', { name: 'Réduire le menu' })).toBeVisible();
  });

  test('bureau : le menu reste en place pendant le défilement d\'une page longue, sans vide dessous', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs');
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(height).toBeGreaterThan(1800);
    await page.evaluate(() => window.scrollTo(0, 1500));
    const box = await page.locator('#app-sidebar').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
    expect(box.top).toBe(0);
    expect(box.bottom).toBeGreaterThanOrEqual(899);
  });

  test('mobile 390 px : barre fixe en haut, tiroir qui se ferme à Échap et au choix d\'une entrée', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'rs');
    await page.goto('/fr/needs');
    await expect(page.locator('#app-sidebar')).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, 1200));
    const bar = await page.getByRole('button', { name: 'Menu' }).evaluate((el) => Math.round(el.getBoundingClientRect().top));
    expect(bar).toBeGreaterThanOrEqual(0);
    expect(bar).toBeLessThan(60);
    const open = page.getByRole('button', { name: 'Menu' });
    await open.click();
    await expect(page.getByRole('button', { name: 'Fermer le menu' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-nav').getByRole('link')).toHaveCount(5);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: 'Alertes' }).click();
    await expect(page).toHaveURL(/\/alerts/);
    await expect(page.locator('#mobile-nav')).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
