import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { loginAs, pickRange, setProfile, watch } from './helpers';

/**
 * Lot A3d : rôles de saisie des besoins. Serveur dédié, neuf à chaque lancement (playwright.config.ts). Chaque profil saisit un besoin
 * sur une période qui lui est propre ; chaque assertion a une seule issue.
 */
test.describe.configure({ mode: 'serial' });

const as = (context: BrowserContext, username: string) => loginAs(context, username);

async function fillRequired(page: Page, start: string, end: string) {
  await page.selectOption('#f-dispositif', 'permanent');
  await page.selectOption('#f-campaign', 'CMP-DEMO-01');
  await page.selectOption('#f-position', 'Poste 6');
  await page.selectOption('#f-priority', '2');
  await page.selectOption('#f-hours', '14');
  await page.fill('#f-slot', '08:00-12:00');
  await pickRange(page, 'f-range-0', start, end);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Lun à ven' }).click();
}

/** Ouvre la saisie, choisit un secteur (par son rang) quand la liste en propose plusieurs, remplit et enregistre. Rend le code du besoin. */
async function enter(page: Page, start: string, end: string, sectorIndex?: number): Promise<string> {
  await page.goto('/fr/needs/new');
  if (sectorIndex !== undefined) await page.selectOption('#f-sector', { index: sectorIndex });
  await fillRequired(page, start, end);
  await page.locator('input[type=checkbox]:not([name$="-day"])').first().check();
  await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
  const saved = page.getByTestId('saved');
  // Une alerte non bloquante (règle de période) demande une confirmation : la saisie ne s'écrit qu'après elle (A2a).
  const confirm = page.getByTestId('confirm-actions');
  await expect(saved.or(confirm)).toBeVisible();
  if (await confirm.isVisible()) await confirm.getByRole('button').first().click();
  await expect(saved).toBeVisible();
  const code = /BES-DEMO-\d{3}/.exec((await saved.textContent()) ?? '')?.[0];
  if (!code) throw new Error('code de besoin introuvable');
  return code;
}

const dossier = async (page: Page, code: string, locale = 'fr') => {
  await page.goto(`/${locale}/proposals?filter=all`);
  await page.getByRole('link', { name: code, exact: true }).first().click();
  await expect(page.getByTestId('dimensions')).toBeVisible();
};
const validationCard = (page: Page) => page.getByTestId('dimensions').locator('h3').filter({ hasText: /Validation managériale|Management approval/ }).locator('..');

const codes = { cvr: '', dr: '', direction: '', agency: '', rs: '' };

test.describe('lot A3d : qui saisit, pour qui, comment c\'est tracé', () => {
  test('le CVR saisit sur ses secteurs seulement : avis donné à la saisie, le besoin remonte à l\'agence', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoCVR01');
    await page.goto('/fr/needs');
    await expect(page.getByRole('link', { name: 'Nouveau besoin' })).toBeVisible();
    await page.goto('/fr/needs/new');
    // Deux secteurs dans son périmètre, plus le choix vide : jamais un secteur d'un autre CVR.
    expect(await page.locator('#f-sector option').count()).toBe(3);
    codes.cvr = await enter(page, '2027-03-08', '2027-03-14', 1);
    await dossier(page, codes.cvr);
    await expect(page.getByTestId('entered-by')).toContainText('Saisi par le CVR');
    await expect(page.getByTestId('entered-by')).toHaveAttribute('data-on-behalf', 'false');
    await expect(validationCard(page)).toContainText('Validé');
    await expect(page.getByTestId('validation-log')).toContainText('Avis du CVR donné à la saisie');
    await expect(page.getByTestId('validation-panel')).toHaveCount(0);
    await expect(page.getByTestId('next-step')).toContainText("L'agence");
    await page.goto('/fr/needs');
    await expect(page.getByRole('row', { name: new RegExp(codes.cvr) })).toContainText('Saisi par le CVR');
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('le DR saisit sur son périmètre, la direction sur tous les secteurs', async ({ page, context }) => {
    await as(context, 'DemoDR01');
    await page.goto('/fr/needs/new');
    expect(await page.locator('#f-sector option').count()).toBe(1 + 5);
    codes.dr = await enter(page, '2027-03-22', '2027-03-28', 3);
    await dossier(page, codes.dr);
    await expect(page.getByTestId('entered-by')).toContainText('Saisi par le DR');
    await expect(page.getByTestId('validation-log')).toContainText('Avis du DR donné à la saisie');

    await as(context, 'DemoDirection01');
    await page.goto('/fr/needs/new');
    expect(await page.locator('#f-sector option').count()).toBe(1 + 12);
    codes.direction = await enter(page, '2027-04-05', '2027-04-11', 7);
    await dossier(page, codes.direction);
    await expect(page.getByTestId('entered-by')).toContainText('Saisi par la direction cliente');
    await expect(validationCard(page)).toContainText('Validé');
  });

  test('l\'agence saisit pour le compte d\'un RS : indicateur dans la liste et le dossier, événement distinct', async ({ page, context }) => {
    await as(context, 'DemoAgence01');
    codes.agency = await enter(page, '2027-04-19', '2027-04-25', 4);
    await page.goto('/fr/needs');
    await expect(page.getByRole('row', { name: new RegExp(codes.agency) })).toContainText("Saisi par l'agence pour le RS");
    await dossier(page, codes.agency);
    await expect(page.getByTestId('entered-by')).toContainText("Saisi par l'agence pour le compte du RS de ce secteur");
    await expect(page.getByTestId('entered-by')).toHaveAttribute('data-on-behalf', 'true');
    // L'avis reste facultatif : « à valider », jamais bloquant.
    await expect(validationCard(page)).toContainText('À valider');
    await expect(page.getByTestId('journal').locator('[data-event-code="EV-48"]')).toHaveCount(1);
    await expect(page.getByTestId('journal').locator('[data-event-code="EV-49"]')).toHaveCount(0);
  });

  test('le RS saisit sur son secteur : avis « à valider », facultatif', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    // Un seul secteur : affiché, sans choix.
    await expect(page.locator('#f-sector')).toHaveCount(0);
    codes.rs = await enter(page, '2027-05-03', '2027-05-09');
    await dossier(page, codes.rs);
    await expect(page.getByTestId('entered-by')).toContainText('Saisi par le RS');
    await expect(validationCard(page)).toContainText('À valider');
    await expect(page.getByTestId('next-step')).toContainText("L'agence");
  });

  test('audience : la cliente lit la saisie et l\'avis, jamais un événement réservé à l\'agence ; le prestataire consulte seulement', async ({ page, context }) => {
    await as(context, 'DemoCVR01');
    await dossier(page, codes.cvr);
    await expect(page.getByTestId('journal').locator('[data-event-code="EV-49"]')).toHaveCount(1);
    await expect(page.getByTestId('journal').locator('[data-audience="agency"]')).toHaveCount(0);
    await setProfile(context, 'provider_admin');
    await page.goto('/fr/needs');
    await expect(page.getByRole('link', { name: 'Nouveau besoin' })).toHaveCount(0);
    expect((await page.goto('/fr/needs/new'))?.status()).toBe(404);
  });

  test('hors périmètre : le CVR ne voit ni ne saisit le secteur d\'un autre CVR', async ({ page, context }) => {
    await as(context, 'DemoCVR02');
    await page.goto('/fr/needs/new');
    expect(await page.locator('#f-sector option').count()).toBe(3);
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByRole('link', { name: codes.cvr, exact: true })).toHaveCount(0);
  });

  test('anglais : saisie, indicateurs et avis traduits', async ({ page, context }) => {
    await as(context, 'DemoCVR01');
    await page.goto('/en/needs/new');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await dossier(page, codes.cvr, 'en');
    await expect(page.getByTestId('entered-by')).toContainText('Entered by the CVR');
    await expect(page.getByTestId('validation-log')).toContainText('CVR opinion given at entry');
    await as(context, 'DemoAgence01');
    await dossier(page, codes.agency, 'en');
    await expect(page.getByTestId('entered-by')).toContainText('Entered by the agency on behalf of the RS of this sector');
    await page.goto('/en/needs');
    await expect(page.getByRole('row', { name: new RegExp(codes.agency) })).toContainText('agency');
  });

  test('390 px : saisie sans défilement horizontal, cibles de 44 px', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await as(context, 'DemoCVR01');
    for (const url of ['/fr/needs/new', '/fr/needs']) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
    await page.goto('/fr/needs/new');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main a, main button, main input, main select')]
        .filter((el) => el.getClientRects().length > 0 && !el.closest('.sr-only') && !(el instanceof HTMLInputElement && el.closest('label')))
        .map((el) => ({ n: (el.textContent || el.tagName).trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
        .filter((x) => x.h < 44),
    );
    expect(small).toEqual([]);
  });

  test('URL : la liste des besoins et le dossier se retrouvent par lien profond et rechargement', async ({ page, context }) => {
    await as(context, 'DemoCVR01');
    await dossier(page, codes.cvr);
    const url = page.url();
    await page.reload();
    await expect(page.getByTestId('entered-by')).toContainText('Saisi par le CVR');
    await page.goto('/fr/needs');
    await page.goto(url);
    await page.goBack();
    await expect(page).toHaveURL(/\/fr\/needs$/);
    expect((await page.goto('/fr/proposals/00000000-0000-4000-8000-000000000000'))?.status()).toBe(404);
  });

  test('performance H3 : saisie sous 2 s, interaction sous 100 ms', async ({ page, context }) => {
    await as(context, 'DemoCVR01');
    const t0 = Date.now();
    await page.goto('/fr/needs/new');
    await expect(page.locator('#f-sector')).toBeVisible();
    const first = Date.now() - t0;
    const t1 = await page.evaluate(() => {
      const start = performance.now();
      document.querySelector<HTMLButtonElement>('button')?.focus();
      return performance.now() - start;
    });
    console.log(`A3d perf : saisie ${first} ms, interaction ${t1.toFixed(1)} ms`);
    expect(first).toBeLessThan(2000);
    expect(t1).toBeLessThan(100);
  });
});
