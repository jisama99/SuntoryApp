import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pickDay, pickRange, setProfile, watch } from './helpers';

async function fillRequired(page: Page, over: { start: string; end: string; hours?: string }) {
  await page.selectOption('#f-dispositif', 'permanent');
  await page.selectOption('#f-campaign', 'CMP-DEMO-01');
  await page.selectOption('#f-position', 'Poste 6');
  await page.selectOption('#f-priority', '2');
  await page.selectOption('#f-hours', over.hours ?? '14');
  await page.fill('#f-slot', '08:00-12:00');
  await pickRange(page, 'f-range-0', over.start, over.end);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lun à ven' }).click();
}

async function savedCode(page: Page): Promise<string> {
  const saved = page.getByTestId('saved');
  await expect(saved).toBeVisible();
  const code = /BES-DEMO-\d{3}/.exec((await saved.textContent()) ?? '')?.[0];
  if (!code) throw new Error('code de besoin introuvable');
  return code;
}

test.describe('saisie des besoins (A2a)', () => {
  test('RS : liste, saisie complète, besoin compté dans les totaux, aucune requête externe ni erreur de console', async ({ page, context }) => {
    await setProfile(context, 'rs');
    const w = watch(page);
    await page.goto('/fr/needs');
    await expect(page.getByRole('link', { name: 'Nouveau besoin' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Besoins de votre périmètre' })).toBeVisible();
    await page.getByRole('link', { name: 'Nouveau besoin' }).click();
    await fillRequired(page, { start: '2027-03-01', end: '2027-03-07' });
    await page.locator('input[type=checkbox]:not([name$="-day"])').first().check();
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    const code = await savedCode(page);
    await page.goto('/fr/needs');
    await expect(page.getByRole('row', { name: new RegExp(code) })).toBeVisible();
    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });

  test('besoin incomplet : brouillon exclu des totaux, puis complété', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs');
    const before = Number((await page.getByText('Brouillons').locator('xpath=following-sibling::span[1]').textContent())?.trim());
    await page.goto('/fr/needs/new');
    await page.selectOption('#f-position', 'Poste 3');
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    const saved = page.getByTestId('saved');
    await expect(saved).toContainText('Brouillon enregistré');
    await expect(page.getByTestId('findings').locator('[data-rule=W9]')).toBeVisible();
    await page.goto('/fr/needs');
    const after = Number((await page.getByText('Brouillons').locator('xpath=following-sibling::span[1]').textContent())?.trim());
    expect(after).toBe(before + 1);
    await expect(page.getByRole('link', { name: 'Compléter' }).first()).toBeVisible();
  });

  test('doublon exact par duplication : refus D1, puis période contiguë acceptée', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await fillRequired(page, { start: '2027-04-05', end: '2027-04-11' });
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    const code = await savedCode(page);

    await page.goto('/fr/needs');
    await page.getByRole('row', { name: new RegExp(code) }).getByRole('link', { name: 'Dupliquer' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(code.replaceAll('-', '\u2011'));
    await expect(page.getByRole('heading', { level: 1 })).not.toContainText(code);
    await page.locator('#dup-start').click();
    await pickDay(page, page.getByRole('dialog'), '2027-04-05');
    await expect(page.locator('#dup-week')).toHaveText('2027-S14, du 05/04/2027 au 11/04/2027');
    await page.getByRole('button', { name: 'Dupliquer', exact: true }).click();
    const d1 = page.getByTestId('findings').locator('[data-rule=D1]');
    await expect(d1).toBeVisible();
    await expect(d1).toHaveAttribute('data-gravity', 'blocking');
    await expect(d1.getByRole('link', { name: 'Ouvrir le besoin existant' })).toBeVisible();

    await page.locator('#dup-start').click();
    await pickDay(page, page.getByRole('dialog'), '2027-04-12');
    await page.getByRole('button', { name: 'Dupliquer', exact: true }).click();
    await expect(page.getByTestId('saved')).toBeVisible();
  });

  test('semaine incohérente avec la date : W5 bloque, la correction en un clic débloque', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await fillRequired(page, { start: '2027-05-24', end: '2027-05-30', hours: '10' });
    await page.getByRole('button', { name: 'Corriger la semaine' }).first().click();
    await pickDay(page, page.getByRole('dialog'), '2027-06-09');
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    const w5 = page.getByTestId('findings').locator('[data-rule=W5]');
    await expect(w5).toBeVisible();
    await w5.getByRole('button', { name: /Appliquer/ }).click();
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    await expect(page.getByTestId('saved')).toBeVisible();
  });

  test('alerte : confirmation demandée, rien n\'est écrit avant la confirmation', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await fillRequired(page, { start: '2027-03-14', end: '2027-03-20', hours: '8' });
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    await expect(page.getByTestId('findings').locator('[data-rule=W16]')).toBeVisible();
    await expect(page.getByTestId('confirm-actions')).toBeVisible();
    await expect(page.getByTestId('saved')).toHaveCount(0);
    await page.getByRole('button', { name: 'Confirmer et enregistrer' }).click();
    await expect(page.getByTestId('saved')).toBeVisible();
  });

  test('agence : saisie pour le compte d\'un RS sur le secteur choisi', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs/new');
    const options = await page.locator('#f-sector option').allTextContents();
    expect(options.length).toBeGreaterThan(10);
    await page.selectOption('#f-sector', { index: 12 });
    await fillRequired(page, { start: '2027-06-07', end: '2027-06-13', hours: '21' });
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    await savedCode(page);
    await page.goto('/fr/needs');
    await expect(page.getByText('Saisi par l\'agence pour le RS').first()).toBeVisible();
  });

  test('profils en lecture : liste sans bouton de saisie, écran de saisie introuvable', async ({ page, context }) => {
    for (const profile of ['direction_client', 'dr_client', 'cvr_client', 'provider_admin']) {
      await setProfile(context, profile);
      await page.goto('/fr/needs');
      await expect(page.getByRole('link', { name: 'Nouveau besoin' })).toHaveCount(0);
      await expect(page.getByRole('table', { name: 'Besoins de votre périmètre' })).toBeVisible();
      const res = await page.goto('/fr/needs/new');
      expect(res?.status(), profile).toBe(404);
    }
  });

  test('un RS ne voit que les besoins de son secteur', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs');
    const sectors = new Set(await page.locator('tbody tr td:nth-child(2) [data-zone-kind]').evaluateAll((els) => els.map((e) => e.textContent)));
    expect(sectors.size).toBe(1);
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs');
    const all = new Set(await page.locator('tbody tr td:nth-child(2) [data-zone-kind]').evaluateAll((els) => els.map((e) => e.textContent)));
    expect(all.size).toBeGreaterThan(5);
  });
});

test.describe('semaines déduites des dates (D146) et liste', () => {
  test('les semaines ne sont plus des champs : elles se déduisent des dates, avec un lien pour les corriger', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await expect(page.locator('button#f-sw-0')).toHaveCount(0);
    await expect(page.locator('#f-sw-0')).toHaveText('Les semaines se déduisent des dates.');
    await expect(page.getByRole('button', { name: 'Corriger la semaine' })).toHaveCount(0);
    await pickRange(page, 'f-range-0', '2027-08-30', '2027-09-05');
    await expect(page.locator('#f-sw-0')).toHaveText('2027-S35, du 30/08/2027 au 05/09/2027');
    await expect(page.locator('#f-ew-0')).toHaveText('2027-S35, du 30/08/2027 au 05/09/2027');
    await page.getByRole('button', { name: 'Corriger la semaine' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await pickDay(page, page.getByRole('dialog'), '2027-09-08');
    await expect(page.locator('#f-sw-0')).toHaveText('2027-S36, du 06/09/2027 au 12/09/2027');
    await expect(page.locator('#f-ew-0')).toHaveText('2027-S35, du 30/08/2027 au 05/09/2027');
  });

  test('liste : une seule semaine quand le début et la fin sont dans la même semaine', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs');
    const first = page.getByRole('row', { name: /BES-DEMO-001/ });
    await expect(first).toContainText('(2026-S44)');
    await expect(first).not.toContainText('2026-S44 à 2026-S44');
    const texts = await page.locator('tbody td:nth-child(4)').allTextContents();
    for (const t of texts) expect(t).not.toMatch(/(\d{4}-S\d{2}) à \1/);
    const multi = page.getByRole('row', { name: /BES-DEMO-002/ });
    await expect(multi).toContainText('2026-S50 à 2026-S51');
  });
});

test.describe('calendrier (D133)', () => {
  test('clavier : flèches, échappement, semaine ISO affichée, semaine clôturée désactivée avec sa raison', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await page.locator('#f-range-0').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('rowheader').first()).toBeVisible();
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute('data-date'));
    expect(await focused()).toBe('2026-10-23');
    await page.keyboard.press('ArrowRight');
    expect(await focused()).toBe('2026-10-24');
    await page.keyboard.press('ArrowDown');
    expect(await focused()).toBe('2026-10-31');
    await page.keyboard.press('Home');
    expect(await focused()).toBe('2026-10-26');
    await page.keyboard.press('PageDown');
    expect(await focused()).toBe('2026-11-26');
    await page.keyboard.press('PageUp');
    // 7 octobre 2026 : semaine 2026-S41 clôturée
    const closed = dialog.locator('[data-date="2026-10-07"]');
    await closed.focus();
    await expect(closed).toHaveAttribute('aria-disabled', 'true');
    await expect(dialog.getByTestId('calendar-reason')).toContainText('clôturée');
    // Noël : férié signalé (novembre est clos depuis A2b, D78 : le calendrier y désactive les jours avec une autre raison)
    const holiday = dialog.locator('[data-date="2026-12-25"]');
    await page.getByRole('button', { name: 'Mois suivant' }).click();
    await page.getByRole('button', { name: 'Mois suivant' }).click();
    await holiday.focus();
    await expect(dialog.getByTestId('calendar-reason')).toContainText('Noël');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#f-range-0')).toBeFocused();
  });

  test('un jour d\'une semaine clôturée ne se sélectionne pas', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await page.locator('#f-range-0').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('[data-date="2026-10-07"]').click({ force: true });
    await expect(page.locator('#f-range-0')).not.toContainText('07/10/2026');
    await expect(dialog).toBeVisible();
  });

  test('anglais : dates au format jj/mm/aaaa et semaines W', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/en/needs/new');
    await pickRange(page, 'f-range-0', '2026-12-28', '2027-01-10');
    await expect(page.locator('#f-sw-0')).toHaveText('2026-W53, from 28/12/2026 to 03/01/2027');
    await expect(page.locator('#f-ew-0')).toHaveText('2027-W01, from 04/01/2027 to 10/01/2027');
  });

  test('dimanche désactivé dans les jours proposés', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    const sunday = page.getByRole('checkbox', { name: 'dimanche' });
    await expect(sunday).toBeDisabled();
    await page.getByRole('button', { name: 'Tous' }).click();
    await expect(sunday).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'samedi' })).toBeChecked();
  });
});
