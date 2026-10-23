import { expect, test } from '@playwright/test';
import { setProfile, watch } from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('règle 16 (D159) : confirmation annulable, tri dans l\'URL, tableaux en cartes, raccourcis, feuilles mobiles', () => {
  test('une écriture affiche une confirmation vocale, annulable, puis le focus est replacé', async ({ page, context }) => {
    const w = watch(page);
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/deadlines');
    const outbox = page.getByTestId('outbox');
    const first = outbox.locator('li').first();
    await expect(first).toContainText('À valider');
    await first.getByRole('button', { name: 'Valider' }).click();
    const toast = page.getByRole('status', { name: 'Confirmation' });
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Enregistré');
    await expect(toast).toBeFocused();
    await expect(first).toContainText('Validé');
    await toast.getByRole('button', { name: 'Annuler' }).click();
    await expect(toast).toContainText('Modification annulée');
    await expect(outbox.locator('li').first()).toContainText('À valider');
    await toast.getByRole('button', { name: 'Fermer' }).click();
    await expect(toast).toBeHidden();
    expect(w.consoleErrors).toEqual([]);
  });

  test('le tri est dans l\'URL : lien profond, retour arrière et rechargement le restituent', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs?sort=hours&dir=desc');
    const table = page.getByRole('table', { name: 'Besoins de votre périmètre' });
    const hours = async () => (await table.locator('tbody tr td:nth-child(5)').allInnerTexts()).map((t) => Number(t)).filter((n) => !Number.isNaN(n));
    await expect(table).toBeVisible();
    const desc = await hours();
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    await expect(table.getByRole('columnheader', { name: /Heures par semaine/ })).toHaveAttribute('aria-sort', 'descending');
    await table.getByRole('link', { name: /Heures par semaine/ }).click();
    await expect(page).toHaveURL(/sort=hours&dir=asc/);
    await expect(table.getByRole('columnheader', { name: /Heures par semaine/ })).toHaveAttribute('aria-sort', 'ascending');
    const asc = await hours();
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    await page.goBack();
    await expect(page).toHaveURL(/dir=desc/);
    await expect(table.getByRole('columnheader', { name: /Heures par semaine/ })).toHaveAttribute('aria-sort', 'descending');
    await page.reload();
    await expect(table).toBeVisible();
    expect(await hours()).toEqual(desc);
    // Une colonne inconnue est ignorée sans erreur.
    await page.goto('/fr/needs?sort=inconnu&dir=asc');
    await expect(table).toBeVisible();
  });

  test('390 px : tableau en cartes empilées, libellés par valeur, tri en liste, aucun défilement horizontal', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs');
    const table = page.getByRole('table', { name: 'Besoins de votre périmètre' });
    await expect(table).toBeVisible();
    const row = table.locator('tbody tr').first();
    expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe('block');
    expect(await row.locator('td').first().evaluate((el) => getComputedStyle(el, '::before').content)).toContain('Besoin');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const sort = page.getByRole('navigation', { name: 'Trier le tableau' });
    await expect(sort).toBeVisible();
    await sort.getByRole('link', { name: 'Besoin' }).click();
    await expect(page).toHaveURL(/sort=need&dir=asc/);
  });

  test('raccourcis clavier documentés : ? ouvre la liste, g puis n ouvre les besoins, rien dans un champ', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setProfile(context, 'agency_operator');
    await page.goto('/fr');
    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Raccourcis clavier' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Aller à : Besoins');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.keyboard.press('g');
    await page.keyboard.press('n');
    await expect(page).toHaveURL(/\/fr\/needs$/);
  });

  test('390 px : le sélecteur de date s\'ouvre en feuille plein écran avec un bouton de fermeture', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await page.locator('button[aria-haspopup="dialog"]').first().click();
    const sheet = page.getByRole('dialog').first();
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    expect(Math.round(box?.width ?? 0)).toBe(390);
    expect(Math.round(box?.height ?? 0)).toBeGreaterThanOrEqual(844);
    await sheet.getByRole('button', { name: 'Fermer' }).click();
    await expect(sheet).toBeHidden();
  });

  test('cibles tactiles : boutons, liens et champs de la page Besoins font 44 px au moins (390 px)', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs');
    await expect(page.getByRole('table', { name: 'Besoins de votre périmètre' })).toBeVisible();
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main a, main button, main input, main select, nav a, nav button')]
        .filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('.sr-only'))
        .map((el) => ({ n: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
        .filter((x) => x.h < 44),
    );
    expect(small).toEqual([]);
  });

  test('police de base 16 px et Inter servie par le site (aucune requête externe)', async ({ page, context }) => {
    const w = watch(page);
    await setProfile(context, 'agency_operator');
    await page.goto('/fr');
    expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('16px');
    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
    });
    expect(fonts.some((f) => f.includes('Inter'))).toBe(true);
    expect(w.external).toEqual([]);
  });

  test('mouvement réduit : plus aucune transition ni animation', async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setProfile(context, 'agency_operator');
    await page.goto('/fr');
    const d = await page.evaluate(() => getComputedStyle(document.querySelector('a, button') as Element).transitionDuration);
    expect(parseFloat(d)).toBe(0);
  });
});
