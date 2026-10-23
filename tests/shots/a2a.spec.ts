import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import path from 'node:path';
import { LOCALES, pickDay, pickRange, setProfile, watch } from '../e2e/helpers';

const OUT = path.join('docs', 'captures', 'A2a');
const WIDTHS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];
// Une paire de dates par combinaison langue x largeur : aucune collision entre captures (les besoins créés restent en mémoire).
const STARTS = [
  ['2027-03-08', '2027-03-14', '2027-09-05'],
  ['2027-04-12', '2027-04-18', '2027-09-19'],
  ['2027-06-07', '2027-06-13', '2027-10-03'],
  ['2027-06-21', '2027-06-27', '2027-10-10'],
] as const;

async function fill(page: Page, start: string, end: string) {
  await page.selectOption('#f-dispositif', 'permanent');
  await page.selectOption('#f-campaign', 'CMP-DEMO-01');
  await page.selectOption('#f-position', 'Poste 6');
  await page.selectOption('#f-priority', '2');
  await page.selectOption('#f-hours', '14');
  await page.fill('#f-slot', '08:00-12:00');
  await pickRange(page, 'f-range-0', start, end);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: /Lun à ven|Mon to Fri/ }).click();
  await page.locator('input[type=checkbox]:not([name$="-day"])').first().check();
}

const plusDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 10);
const save = (page: Page) => page.getByRole('button', { name: /Enregistrer le besoin|Save the need/ });

let combo = 0;
for (const locale of LOCALES) {
  for (const w of WIDTHS) {
    const idx = combo++;
    const [start, end, sunday] = STARTS[idx]!;
    const shot = (page: Page, name: string) =>
      page.screenshot({ path: path.join(OUT, `${name}_${locale}_${w.name}.png`), fullPage: true });

    test(`A2a ${locale} ${w.name} : liste, saisie, correction de semaine, doublon, alerte, brouillon`, async ({ page, context }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: w.width, height: w.height });
      const watcher = watch(page);

      // Liste : RS, agence, lecture seule.
      for (const profile of ['rs', 'agency_operator', 'direction_client']) {
        await setProfile(context, profile);
        await page.goto(`/${locale}/needs`);
        await page.waitForLoadState('networkidle');
        await shot(page, `list_${profile}`);
      }

      // Saisie vide puis calendrier ouvert (semaine clôturée, jour férié, numéros de semaine).
      await setProfile(context, 'rs');
      await page.goto(`/${locale}/needs/new`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'form_empty_rs');
      await page.locator('#f-range-0').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator('[data-date="2026-10-07"]').focus();
      await shot(page, 'calendar_closed_week_rs');
      await page.keyboard.press('Escape');

      // Semaine incohérente avec la date (W5), correction en un clic, enregistrement.
      await fill(page, start, end);
      await shot(page, 'form_weeks_derived_rs');
      await page.getByRole('button', { name: /Corriger la semaine|Correct the week/ }).first().click();
      await pickDay(page, page.getByRole('dialog'), plusDays(start, 8));
      await save(page).click();
      await expect(page.getByTestId('findings').locator('[data-rule=W5]')).toBeVisible();
      await shot(page, 'form_week_incoherent_rs');
      await page.getByTestId('findings').locator('[data-rule=W5]').getByRole('button').click();
      await save(page).click();
      await expect(page.getByTestId('saved')).toBeVisible();
      const code = /BES-DEMO-\d{3}/.exec((await page.getByTestId('saved').textContent()) ?? '')?.[0] ?? '';
      await shot(page, 'form_saved_rs');

      // Doublon exact par duplication (D1 bloquant, renvoi vers le besoin existant).
      await page.goto(`/${locale}/needs`);
      await page.getByRole('row', { name: new RegExp(code) }).getByRole('link', { name: /Dupliquer|Duplicate/ }).click();
      await page.locator('#dup-start').click();
      await pickDay(page, page.getByRole('dialog'), start);
      await page.getByRole('button', { name: /^(Dupliquer|Duplicate)$/ }).click();
      await expect(page.getByTestId('findings').locator('[data-rule=D1]')).toBeVisible();
      await shot(page, 'duplicate_d1_rs');

      // Alerte demandant une confirmation (début un dimanche, W16).
      await page.goto(`/${locale}/needs/new`);
      await fill(page, sunday, plusDays(sunday, 6));
      await save(page).click();
      await expect(page.getByTestId('confirm-actions')).toBeVisible();
      await shot(page, 'form_alert_confirm_rs');

      // Brouillon : poste seul.
      await page.goto(`/${locale}/needs/new`);
      await page.selectOption('#f-position', 'Poste 3');
      await save(page).click();
      await expect(page.getByTestId('saved')).toBeVisible();
      await shot(page, 'form_draft_saved_rs');

      // Agence : liste après saisies.
      await setProfile(context, 'agency_operator');
      await page.goto(`/${locale}/needs/new`);
      await page.waitForLoadState('networkidle');
      await shot(page, 'form_empty_agency');

      expect(watcher.external).toEqual([]);
      expect(watcher.consoleErrors).toEqual([]);
    });
  }
}

for (const locale of LOCALES) {
  test(`A2a ${locale} : mode sombre, semaine ISO 2026-S53 et jours`, async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setProfile(context, 'rs');
    await context.addCookies([{ name: 'demo_theme', value: 'dark', url: 'http://localhost:3100' }]);
    const watcher = watch(page);
    await page.goto(`/${locale}/needs/new`);
    await pickRange(page, 'f-range-0', '2026-12-28', '2027-01-10');
    await page.getByRole('button', { name: /Corriger la semaine|Correct the week/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: path.join(OUT, `calendar_week_dark_${locale}_1440.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await page.screenshot({ path: path.join(OUT, `form_dark_${locale}_1440.png`), fullPage: true });
    await page.goto(`/${locale}/needs`);
    await page.screenshot({ path: path.join(OUT, `list_dark_${locale}_1440.png`), fullPage: true });
    expect(watcher.external).toEqual([]);
    expect(watcher.consoleErrors).toEqual([]);
  });
}
