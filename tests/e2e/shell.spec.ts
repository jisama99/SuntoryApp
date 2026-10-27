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
    await expect(page.getByRole('link', { name: 'Réglages' }).first()).toHaveAttribute('title', 'Réglages');
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
    await expect(page.getByRole('table', { name: 'Besoins de votre périmètre' })).toBeVisible();
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(height).toBeGreaterThan(1800);
    await page.evaluate(() => window.scrollTo(0, 1500));
    const box = await page.locator('#app-sidebar').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
    expect(Math.abs(box.top)).toBe(0);
    expect(box.bottom).toBeGreaterThanOrEqual(899);
  });

  test('mobile 390 px : barre d\'onglets fixe en bas, colonnes égales, bouton + au centre, volet « Plus »', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'rs');
    await page.goto('/fr/needs');
    await expect(page.locator('#app-sidebar')).toBeHidden();
    await expect(page.getByRole('table', { name: 'Besoins de votre périmètre' })).toBeVisible();
    const bar = page.getByRole('navigation', { name: 'Navigation mobile' });
    await expect(bar).toBeVisible();
    // La barre reste collée au bas de l'écran pendant le défilement.
    await page.evaluate(() => window.scrollTo(0, 1500));
    const box = await bar.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { bottom: Math.round(r.bottom), width: Math.round(r.width) };
    });
    expect(box.bottom).toBe(844);
    expect(box.width).toBe(390);
    // Répartition homogène : les quatre onglets (Accueil, Besoins, Alertes, Plus) ont la même largeur.
    const widths = await bar.locator('a:not([aria-label]), button').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(widths).toHaveLength(4);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    // Aucun contenu masqué par la barre : le bas de la page est atteignable au-dessus d'elle.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const barTop = await bar.evaluate((el) => Math.round(el.getBoundingClientRect().top));
    const last = await page.locator('main > :last-child').evaluate((el) => Math.round(el.getBoundingClientRect().bottom));
    expect(last).toBeLessThanOrEqual(barTop);

    const more = bar.getByRole('button', { name: 'Plus' });
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#mobile-more').getByRole('link')).toHaveCount(2); // Propositions, Terrain
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-more')).toHaveCount(0);
    await expect(more).toBeFocused();
    await more.click();
    await page.locator('#mobile-more').getByRole('link', { name: 'Terrain' }).click();
    await expect(page).toHaveURL(/\/field/);
    await expect(page.locator('#mobile-more')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test('mobile : le bouton + ouvre la saisie complète d\'un besoin, réservé aux profils qui peuvent saisir', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const profile of ['rs', 'cvr_client', 'dr_client', 'direction_client', 'agency_operator', 'agency_admin']) {
      await setProfile(context, profile);
      await page.goto('/fr/alerts');
      await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Nouveau besoin' }).click();
      await expect(page).toHaveURL(/\/needs\/new$/);
      // Toute la chaîne de règles de la saisie : bannière d'échéances, formulaire, enregistrement par la couche données.
      await expect(page.getByTestId('deadline-banner')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Enregistrer le besoin' })).toBeVisible();
    }
    for (const profile of ['provider_admin']) {
      await setProfile(context, profile);
      await page.goto('/fr/needs');
      await expect(page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Nouveau besoin' }), profile).toHaveCount(0);
    }
  });

  test('mobile : le bouton + mène à une saisie qui enregistre un besoin (règles, échéances, brouillon)', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'rs');
    await page.goto('/fr');
    await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Nouveau besoin' }).click();
    await page.selectOption('#f-position', 'Poste 5');
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    // Besoin incomplet : brouillon, constat W9 renvoyé par la couche données.
    await expect(page.getByTestId('saved')).toContainText('Brouillon enregistré');
    await expect(page.getByTestId('findings').locator('[data-rule=W9]')).toBeVisible();
  });
});
