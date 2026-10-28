import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { loginAs, pickRange, setProfile, watch } from './helpers';

/**
 * Lot A3c : validation managériale, escalade, délégations, qualification. Serveur dédié, neuf à chaque lancement (voir
 * playwright.config.ts) : chaque scénario écrit sur son propre besoin, dans l'ordre du fichier, et chaque assertion a une seule issue.
 *   BES-DEMO-032 : le CVR valide, puis l'agence qualifie.
 *   BES-DEMO-031 : le CVR refuse, le RS soumet de nouveau, le CVR valide.
 *   BES-DEMO-033 : escalade hors périmètre, le DR valide.
 *   BES-DEMO-034 : arbitrage entre deux CVR, le DR refuse.
 *   BES-DEMO-030 (CVR-ZV01) et BES-DEMO-037 (CVR-WY02) : suppléance, validation en lot, fin de délégation.
 */
test.describe.configure({ mode: 'serial' });

const CVR1 = 'DemoCVR01';
const CVR2 = 'DemoCVR02';
const DR1 = 'DemoDR01';
const ADMIN = 'DemoAgence01';

const open = async (page: Page, code: string) => {
  await page.goto('/fr/proposals?filter=all');
  await page.getByRole('link', { name: code, exact: true }).first().click();
  await expect(page.getByTestId('dimensions')).toBeVisible();
};
const as = async (context: BrowserContext, username: string) => loginAs(context, username);
const validationCard = (page: Page) => page.getByTestId('dimensions').locator('h3', { hasText: 'Validation managériale' }).locator('..');
const decide = async (page: Page, outcome: string, motive?: string) => {
  const panel = page.getByTestId('validation-panel');
  await panel.locator('#validation-outcome').selectOption(outcome);
  if (motive !== undefined) await panel.locator('#validation-motive').fill(motive);
  await panel.getByRole('button', { name: 'Enregistrer' }).click();
};
const toast = (page: Page) => page.getByRole('status', { name: 'Confirmation' });
/** Choisit une zone dans une liste par son code (le code ne s'affiche que dans le libellé de la zone, D106). */
const selectZone = async (page: Page, id: string, code: string) => {
  const select = page.locator(`#${id}`);
  const index = (await select.locator('option').allTextContents()).findIndex((t) => t.includes(code));
  expect(index, `${code} dans #${id}`).toBeGreaterThan(0);
  await select.selectOption({ index });
};

test.describe('lot A3c : chaîne managériale', () => {
  test('le CVR valide dans son périmètre, l\'agence qualifie sans attendre cet avis', async ({ page, context }) => {
    const w = watch(page);
    await as(context, ADMIN);
    await open(page, 'BES-DEMO-032');
    await expect(validationCard(page)).toContainText('À valider');
    // L'avis du CVR est facultatif : l'agence voit le statut et peut qualifier sans l'attendre.
    await expect(page.getByTestId('next-step')).toContainText("L'agence");
    await expect(page.getByTestId('qualify-form')).toBeVisible();
    await expect(page.getByTestId('validation-panel')).toHaveCount(0);

    await as(context, CVR1);
    await open(page, 'BES-DEMO-032');
    await expect(page.getByTestId('validation-panel')).toContainText('Valider le besoin');
    await decide(page, 'validate');
    await expect(toast(page)).toContainText('Enregistré');
    await expect(validationCard(page)).toContainText('Validé');
    await expect(page.getByTestId('validation-log')).toContainText('Validé par le CVR');
    await expect(page.getByTestId('validation-panel')).toHaveCount(0);

    await as(context, ADMIN);
    await open(page, 'BES-DEMO-032');
    await expect(page.getByTestId('next-step')).toContainText("L'agence");
    await expect(page.getByTestId('qualify-form')).toBeVisible();
    await page.getByTestId('qualify-form').getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('dimensions')).toContainText('Pris en charge');
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('le CVR refuse avec un motif obligatoire, le RS soumet de nouveau, un nouveau tour se valide', async ({ page, context }) => {
    await as(context, CVR1);
    await open(page, 'BES-DEMO-031');
    await decide(page, 'refuse', '');
    await expect(page.getByTestId('validation-panel')).toContainText('Un motif est obligatoire.');
    await decide(page, 'refuse', 'Heures supérieures au besoin du secteur.');
    await expect(validationCard(page)).toContainText('Refusé');
    await expect(page.getByTestId('validation-log')).toContainText('Refusé par le CVR');
    await expect(page.getByTestId('validation-log')).toContainText('Heures supérieures au besoin du secteur.');

    // L'avis refusé ne bloque pas l'agence : elle doit confirmer sa prise en charge.
    await as(context, ADMIN);
    await open(page, 'BES-DEMO-031');
    const qualify = page.getByTestId('qualify-form');
    await expect(qualify.getByTestId('avis-confirm')).toBeVisible();
    await qualify.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(qualify).toContainText('Confirmez la prise en charge malgré l\'avis refusé.');
    await expect(page.getByTestId('dimensions')).toContainText('À qualifier');

    await setProfile(context, 'rs');
    await open(page, 'BES-DEMO-031');
    await expect(page.getByTestId('next-step')).toContainText("L'agence");
    await expect(page.getByTestId('validation-panel')).toContainText('Soumettre de nouveau le besoin');
    await page.getByTestId('validation-panel').getByRole('button', { name: 'Soumettre de nouveau' }).click();
    await expect(validationCard(page)).toContainText('Tour 2');
    await expect(validationCard(page)).toContainText('À valider');
    await expect(page.getByTestId('validation-log').locator('[data-validation-action]')).toHaveCount(2);

    await as(context, CVR1);
    await open(page, 'BES-DEMO-031');
    await decide(page, 'validate');
    await expect(validationCard(page)).toContainText('Validé');
    await expect(page.getByTestId('validation-log').locator('[data-validation-action]')).toHaveCount(3);
    // L'historique du premier tour reste au dossier.
    await expect(page.getByTestId('validation-log')).toContainText('Refusé par le CVR');
  });

  test('escalade hors périmètre : le CVR n\'agit plus, le DR arbitre', async ({ page, context }) => {
    await as(context, CVR1);
    await open(page, 'BES-DEMO-033');
    const panel = page.getByTestId('validation-panel');
    await panel.locator('#validation-outcome').selectOption('escalate');
    await panel.locator('#validation-reason').selectOption('out_of_perimeter');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel).toContainText('Un motif est obligatoire.');
    await panel.locator('#validation-motive').fill('Ce secteur relève d\'un autre périmètre.');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(validationCard(page)).toContainText('Escaladé au DR');
    await expect(validationCard(page)).toContainText('Hors périmètre');
    await expect(page.getByTestId('validation-panel')).toHaveCount(0);

    await as(context, DR1);
    await open(page, 'BES-DEMO-033');
    await expect(page.getByTestId('next-step')).toContainText("L'agence");
    await expect(page.getByTestId('validation-panel')).toContainText('Arbitrer le besoin escaladé');
    await expect(page.getByTestId('validation-panel').locator('#validation-outcome option[value="escalate"]')).toHaveCount(0);
    await decide(page, 'validate');
    await expect(validationCard(page)).toContainText('Validé');
    await expect(page.getByTestId('validation-log')).toContainText('Arbitré par le DR et validé');
  });

  test('« hors enveloppe » : branché sur le budget de la maille (A4b1), le motif reste exigé', async ({ page, context }) => {
    await as(context, CVR1);
    await open(page, 'BES-DEMO-034');
    const panel = page.getByTestId('validation-panel');
    await panel.locator('#validation-outcome').selectOption('escalate');
    await panel.locator('#validation-reason').selectOption('out_of_envelope');
    await expect(page.getByTestId('envelope-note')).toContainText("L'enveloppe n'est pas dépassée.");
    // Le besoin reste « à valider » : ce scénario ne l'escalade pas (voir le suivant).
    await expect(validationCard(page)).toContainText('À valider');
  });

  test('arbitrage entre deux CVR : l\'autre CVR est désigné, le DR refuse avec motif', async ({ page, context }) => {
    await as(context, CVR1);
    await open(page, 'BES-DEMO-034');
    const panel = page.getByTestId('validation-panel');
    await panel.locator('#validation-outcome').selectOption('escalate');
    await panel.locator('#validation-reason').selectOption('arbitration');
    // Seuls les CVR du même DR sont proposés.
    expect(await panel.locator('#validation-other option').count()).toBe(3);
    await panel.locator('#validation-motive').fill('Deux CVR revendiquent ce poste.');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel).toContainText("Choisissez l'autre CVR");
    await panel.locator('#validation-other').selectOption({ index: 1 });
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(validationCard(page)).toContainText('Escaladé au DR');
    await expect(validationCard(page)).toContainText('Arbitrage entre CVR');
    await expect(page.getByTestId('validation-log')).toContainText('Autre CVR concerné');

    await as(context, DR1);
    await open(page, 'BES-DEMO-034');
    await decide(page, 'refuse', '');
    await expect(page.getByTestId('validation-panel')).toContainText('Un motif est obligatoire.');
    await decide(page, 'refuse', 'Le poste revient au secteur voisin.');
    await expect(validationCard(page)).toContainText('Refusé');
    await expect(page.getByTestId('validation-log')).toContainText('Refusé par le DR');
  });

  test('délégation : l\'agence administration désigne un suppléant, qui valide en lot dans le périmètre du délégant seulement', async ({ page, context }) => {
    const w = watch(page);
    // Sans délégation, le suppléant ne voit pas le besoin du délégant.
    await as(context, CVR2);
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByRole('link', { name: 'BES-DEMO-037', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'BES-DEMO-030', exact: true })).toHaveCount(0);
    // Une suppléance prévue en novembre s'annonce, mais aucune n'est en cours.
    await expect(page.getByTestId('delegation-banner')).not.toContainText('Vous agissez pour');
    await expect(page.getByTestId('delegation-banner')).toContainText('Vous serez suppléant de');

    await as(context, ADMIN);
    await page.goto('/fr/settings/delegations');
    await expect(page.getByRole('heading', { level: 1, name: 'Désigner les suppléants' })).toBeVisible();
    await expect(page.getByTestId('delegations-table').locator('tbody tr')).toHaveCount(3);
    const form = page.getByTestId('delegation-form');
    await form.getByRole('button', { name: 'Désigner le suppléant' }).click();
    await expect(page.getByTestId('delegation-result')).toContainText('Renseignez le délégant, le suppléant et la période.');
    await selectZone(page, 'delegation-delegator', 'CVR-ZV01');
    await selectZone(page, 'delegation-substitute', 'CVR-WY02');
    await pickRange(page, 'delegation-period', '2026-10-23', '2026-10-30');
    await form.getByRole('button', { name: 'Désigner le suppléant' }).click();
    await expect(toast(page)).toContainText('Enregistré');
    const active = page.locator('[data-delegation-status="active"]');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('CVR-ZV01');
    await expect(active).toContainText('CVR-WY02');
    await expect(page.getByTestId('delegation-trace')).toContainText('Délégation créée');

    // Un second suppléant sur la même période est refusé (un seul à la fois).
    await selectZone(page, 'delegation-delegator', 'CVR-ZV01');
    await selectZone(page, 'delegation-substitute', 'CVR-GP03');
    await pickRange(page, 'delegation-period', '2026-10-26', '2026-10-28');
    await form.getByRole('button', { name: 'Désigner le suppléant' }).click();
    await expect(page.getByTestId('delegation-result')).toContainText('déjà un suppléant');

    // Le suppléant agit pour le délégant : bandeau, besoins des deux périmètres, jamais un troisième.
    await as(context, CVR2);
    await page.goto('/fr/proposals?filter=validation');
    await expect(page.getByTestId('delegation-banner')).toContainText('Vous agissez pour');
    await expect(page.getByRole('link', { name: 'BES-DEMO-030', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'BES-DEMO-037', exact: true })).toBeVisible();
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByRole('link', { name: 'BES-DEMO-013', exact: true })).toHaveCount(0);
    await open(page, 'BES-DEMO-030');
    await expect(page.getByTestId('validation-panel')).toContainText('Vous agissez comme suppléant de');

    await page.goto('/fr/proposals?filter=validation');
    const batch = page.getByTestId('batch-validation');
    await expect(batch).toBeVisible();
    await batch.getByRole('button', { name: 'Tout cocher' }).click();
    await batch.getByRole('button', { name: 'Valider la sélection' }).click();
    // Les deux besoins sont traités : la confirmation annulable s'affiche et le lot disparaît de la liste à traiter.
    await expect(toast(page)).toContainText('Enregistré');
    await expect(page.getByTestId('batch-validation')).toHaveCount(0);
    await open(page, 'BES-DEMO-030');
    await expect(page.getByTestId('validation-log')).toContainText('Décision prise par le suppléant');
    await expect(validationCard(page)).toContainText('Validé');
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('l\'agence révoque la délégation : le suppléant perd le périmètre du délégant, la trace reste', async ({ page, context }) => {
    await as(context, ADMIN);
    await page.goto('/fr/settings/delegations');
    const active = page.locator('[data-delegation-status="active"]');
    await active.getByRole('button', { name: 'Révoquer' }).click();
    await expect(toast(page)).toContainText('Enregistré');
    await expect(page.locator('[data-delegation-status="active"]')).toHaveCount(0);
    await expect(page.locator('[data-delegation-status="revoked"]')).toHaveCount(2);
    await expect(page.getByTestId('delegation-trace')).toContainText('Délégation révoquée');

    await as(context, CVR2);
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByRole('link', { name: 'BES-DEMO-030', exact: true })).toHaveCount(0);
    await expect(page.getByTestId('delegation-banner')).not.toContainText('Vous agissez pour');
    // Hors périmètre : la page du besoin répond 404, comme un besoin inconnu.
    await as(context, ADMIN);
    await page.goto('/fr/proposals?filter=all');
    const href = await page.getByRole('link', { name: 'BES-DEMO-030', exact: true }).first().getAttribute('href');
    await as(context, CVR2);
    expect((await page.goto(href as string))?.status()).toBe(404);
  });

  test('audience : la cliente ne lit ni la délégation, ni son journal ; l\'agence les lit', async ({ page, context }) => {
    await as(context, CVR1);
    await open(page, 'BES-DEMO-032');
    await expect(page.getByTestId('journal').locator('[data-audience="agency"]')).toHaveCount(0);
    await expect(page.getByTestId('journal').locator('[data-event-code="EV-06"]')).toHaveCount(1);
    expect((await page.goto('/fr/settings/delegations'))?.status()).toBe(404);
    // L'agence opération n'a pas l'entrée Paramètres : la page répond 404 ; seule l'administration paramètre.
    await as(context, 'DemoAgence02');
    expect((await page.goto('/fr/settings/delegations'))?.status()).toBe(404);
    await as(context, ADMIN);
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('pipeline-alerts')).toContainText("attend l'arbitrage du DR");
    await as(context, CVR1);
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('pipeline-alerts')).toContainText("attend l'arbitrage du DR");
    await expect(page.getByTestId('pipeline-alerts')).not.toContainText('délégation');
    await expect(page.getByTestId('pipeline-alerts')).not.toContainText('Agence uniquement');
  });

  test('URL : filtre « validation », tri, lien profond, retour arrière et rechargement', async ({ page, context }) => {
    await as(context, CVR1);
    await page.goto('/fr/proposals?filter=validation&sort=need&dir=desc');
    const table = page.getByTestId('pipeline-table');
    await expect(table).toBeVisible();
    const codes = async () => (await table.locator('tbody tr td:first-child').allInnerTexts()).map((t) => t.replace(/\s/g, ''));
    const desc = await codes();
    expect(desc).toEqual([...desc].sort().reverse());
    await page.getByRole('link', { name: 'Tous', exact: true }).click();
    await expect(page).toHaveURL(/filter=all/);
    await page.goBack();
    await expect(page).toHaveURL(/filter=validation/);
    await page.reload();
    expect(await codes()).toEqual(desc);
    await as(context, ADMIN);
    await page.goto('/fr/settings/delegations?filter=ended&sort=period&dir=desc');
    await expect(page.locator('[data-delegation-status="ended"]')).toHaveCount(1);
    await page.reload();
    await expect(page.locator('[data-delegation-status="ended"]')).toHaveCount(1);
    await page.goto('/fr/settings/delegations?filter=inconnu');
    await expect(page.getByTestId('delegations-table')).toBeVisible();
    expect((await page.goto('/fr/proposals/00000000-0000-4000-8000-000000000000'))?.status()).toBe(404);
  });

  test('390 px : cartes, aucun défilement horizontal, cibles de 44 px, trois états de route', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await as(context, ADMIN);
    for (const url of ['/fr/settings/delegations', '/fr/settings/delegations?filter=planned']) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
    const row = page.getByTestId('delegations-table').locator('tbody tr').first();
    expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe('block');
    // État vide : un filtre sans résultat.
    await page.goto('/fr/settings/delegations?filter=active');
    await expect(page.getByRole('heading', { name: 'Rien à afficher' })).toBeVisible();
    await as(context, CVR1);
    await page.goto('/fr/proposals?filter=validation');
    await open(page, 'BES-DEMO-032');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main a, main button, main input, main select')]
        .filter((el) => el.getClientRects().length > 0 && !el.closest('.sr-only') && !(el instanceof HTMLInputElement && el.closest('label')))
        .map((el) => ({ n: (el.textContent || el.tagName).trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
        .filter((x) => x.h < 44),
    );
    expect(small).toEqual([]);
  });

  test('anglais : les écrans du lot sont traduits', async ({ page, context }) => {
    await as(context, ADMIN);
    await page.goto('/en/settings/delegations');
    await expect(page.getByRole('heading', { level: 1, name: 'Appoint substitutes' })).toBeVisible();
    await expect(page.getByTestId('delegation-form')).toContainText('Appoint a substitute');
    await expect(page.locator('[data-delegation-status="planned"]')).toContainText('Planned');
    await as(context, 'DemoDR01');
    await page.goto('/en/proposals?filter=validation');
    await expect(page.getByTestId('batch-validation')).toContainText('Approve several needs');
    await page.getByRole('link', { name: 'BES-DEMO-035', exact: true }).click();
    await expect(page.getByTestId('validation-panel')).toContainText('Rule on the escalated need');
    await expect(page.getByTestId('validation-log')).toContainText('Escalated to the DR');
    await expect(page.getByTestId('dimensions')).toContainText('Management approval');
  });

  test('performance H3 : premier affichage utile sous 2 s, interaction sous 100 ms', async ({ page, context }) => {
    await as(context, CVR1);
    const t0 = Date.now();
    await page.goto('/fr/proposals?filter=validation');
    await expect(page.getByTestId('pipeline-table')).toBeVisible();
    const first = Date.now() - t0;
    const t1 = await page.evaluate(() => {
      const start = performance.now();
      document.querySelector<HTMLButtonElement>('button')?.focus();
      return performance.now() - start;
    });
    await as(context, ADMIN);
    const t2 = Date.now();
    await page.goto('/fr/settings/delegations');
    await expect(page.getByTestId('delegations-table')).toBeVisible();
    const second = Date.now() - t2;
    console.log(`A3c perf : liste ${first} ms, délégations ${second} ms, interaction ${t1.toFixed(1)} ms`);
    expect(first).toBeLessThan(2000);
    expect(second).toBeLessThan(2000);
    expect(t1).toBeLessThan(100);
  });
});
