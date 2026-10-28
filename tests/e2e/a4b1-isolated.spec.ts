import { expect, test } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { loginAs, pickRange, watch } from './helpers';

/**
 * Lot A4b1 : enveloppe cliente, allocation de l'agence, prévisionnel par besoin. Serveur dédié, neuf à chaque lancement
 * (playwright.config.ts). Les tests s'enchaînent dans l'ordre du fichier : chacun part de l'état laissé par le précédent.
 */
test.describe.configure({ mode: 'serial' });

const as = (context: BrowserContext, username: string) => loginAs(context, username);
const tabs = (page: Page) => page.getByTestId('budget-tabs');

/** Valeur d'une option de liste repérée par un fragment de son texte (les listes de CVR portent le libellé, le responsable et le code). */
async function optionValue(page: Page, select: string, fragment: string): Promise<string> {
  const value = await page.locator(`${select} option`, { hasText: fragment }).first().getAttribute('value');
  if (!value) throw new Error(`option introuvable : ${fragment}`);
  return value;
}

test.describe('lot A4b1 : la chaîne budgétaire', () => {
  test('la direction cliente lit l\'enveloppe et la répartition, aucun coût, aucune section d\'agence', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoDirection01');
    await page.goto('/fr/budget');
    await expect(page.getByRole('heading', { level: 1, name: 'Budget' })).toBeVisible();
    await expect(page.getByTestId('budget-note')).toContainText('fictifs');
    const tiles = page.getByTestId('budget-tiles');
    await expect(tiles).toContainText('Enveloppe de la cliente');
    await expect(tiles).toContainText('100 000,00');
    await expect(tiles).toContainText('Réparti par l\'agence');
    await expect(tiles).toContainText('38 600,00');
    await expect(tiles).not.toContainText('Consommé');
    await expect(tiles).not.toContainText('Prévisionnel');
    await expect(tiles).not.toContainText('Disponible');
    await expect(page.getByTestId('budget-lines')).toBeVisible();
    await expect(page.getByTestId('budget-lines').getByRole('columnheader', { name: /Consommé/ })).toHaveCount(0);
    await expect(tabs(page).getByRole('link')).toHaveText(['Situation', 'Enveloppe', 'Journal']);
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
    for (const url of ['/fr/budget/needs', '/fr/budget/allocation']) expect((await page.goto(url))?.status(), url).toBe(404);
  });

  test('l\'agence lit les quatre mesures, la couverture et le prévisionnel par besoin', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoAgence01');
    await page.goto('/fr/budget');
    const tiles = page.getByTestId('budget-tiles');
    for (const label of ['Consommé', 'Prévisionnel', 'Atterrissage', 'Disponible', 'Couverture du chiffrage']) await expect(tiles).toContainText(label);
    await expect(tiles).toContainText('32 / 32');
    await expect(tabs(page).getByRole('link')).toHaveText(['Situation', 'Enveloppe', 'Répartition', 'Prévisionnel par besoin', 'Journal']);
    await page.goto('/fr/budget/needs');
    const table = page.getByTestId('budget-needs');
    await expect(table.locator('tbody tr')).toHaveCount(32);
    const beyond = table.locator('tr[data-need-code="BES-DEMO-011"]');
    await expect(beyond).toContainText('Au-delà du disponible');
    await expect(table.locator('tr[data-need-code="BES-DEMO-028"]')).toContainText('Budget non renseigné');
    await expect(table.locator('tr[data-need-code="BES-DEMO-001"]')).toHaveAttribute('data-kind', 'consumed');
    await expect(page.getByTestId('budget-rates')).toContainText('23,40');
    // Alertes de l'agence : un dépassement (aux deux côtés) et une maille sans budget, propre à l'agence.
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('budget-alerts').locator('[data-alert-id="budget:needsBeyond"]')).toHaveAttribute('data-audience', 'both');
    await expect(page.getByTestId('budget-alerts').locator('[data-alert-id="budget:noBudget"]')).toHaveAttribute('data-audience', 'agency');
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('l\'agence ne modifie pas l\'enveloppe ; la direction cliente en saisit une nouvelle version, contrôlée', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoAgence01');
    await page.goto('/fr/budget/envelope');
    await expect(page.getByTestId('envelope-readonly')).toBeVisible();
    await expect(page.getByTestId('envelope-form')).toHaveCount(0);
    await expect(page.getByTestId('envelope-versions').locator('tbody tr')).toHaveCount(1);

    await as(context, 'DemoDirection01');
    await page.goto('/fr/budget/envelope');
    const form = page.getByTestId('envelope-form');
    await expect(form).toBeVisible();
    // Sans motif : refusé dès la deuxième version.
    await form.getByLabel('Montant (euros hors taxes)').fill('120 000');
    await form.getByRole('button', { name: 'Enregistrer la version' }).click();
    await expect(page.getByTestId('envelope-result')).toContainText('Un motif est obligatoire');
    // Sous le total déjà réparti : refusé.
    await form.getByLabel('Montant (euros hors taxes)').fill('30 000');
    await form.getByLabel('Motif de la nouvelle version').fill('Réduction demandée.');
    await form.getByRole('button', { name: 'Enregistrer la version' }).click();
    await expect(page.getByTestId('envelope-result')).toContainText('inférieur au total déjà réparti');
    // Montant illisible : jamais pris pour zéro.
    await form.getByLabel('Montant (euros hors taxes)').fill('abc');
    await form.getByRole('button', { name: 'Enregistrer la version' }).click();
    await expect(page.getByTestId('envelope-result')).toContainText('Renseignez le montant');
    // Valide.
    await form.getByLabel('Montant (euros hors taxes)').fill('120 000');
    await form.getByRole('button', { name: 'Enregistrer la version' }).click();
    const toast = page.getByRole('status', { name: 'Confirmation' });
    await expect(toast).toContainText('Enregistré');
    await expect(page.getByTestId('envelope-versions').locator('tbody tr')).toHaveCount(2);
    await expect(page.getByTestId('envelope-versions').locator('tr[data-version="2"]')).toContainText('120 000,00');
    await expect(page.getByTestId('envelope-versions').locator('tr[data-version="2"]')).toContainText('Version courante');
    await expect(page.getByTestId('envelope-versions').locator('tr[data-version="1"]')).toContainText('100 000,00');
    // Annulable : la version 1 redevient la version courante.
    await toast.getByRole('button', { name: 'Annuler' }).click();
    await expect(toast).toContainText('Modification annulée');
    await expect(page.getByTestId('envelope-versions').locator('tbody tr')).toHaveCount(1);
    // On l'enregistre de nouveau, définitivement pour la suite.
    await form.getByLabel('Montant (euros hors taxes)').fill('120 000');
    await form.getByLabel('Motif de la nouvelle version').fill('Rallonge validée en comité.');
    await form.getByRole('button', { name: 'Enregistrer la version' }).click();
    await expect(page.getByTestId('envelope-versions').locator('tbody tr')).toHaveCount(2);
    expect(w.consoleErrors).toEqual([]);
  });

  test('l\'agence en mode administration répartit sans jamais dépasser l\'enveloppe ; la direction cliente ne répartit pas', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoAgence01');
    await page.goto('/fr/budget/allocation');
    const form = page.getByTestId('allocation-form');
    await expect(form).toBeVisible();
    await expect(page.getByTestId('allocation-remaining')).toContainText('81 400,00');
    const uh = await optionValue(page, '#allocation-cvr', 'CVR-UH06');
    await form.getByLabel('Campagne').selectOption('CMP-DEMO-02');
    await form.getByLabel('CVR').selectOption(uh);
    // Trop grand : refusé, rien n'est écrit.
    await form.getByLabel('Montant réparti (euros hors taxes)').fill('999 999');
    await form.getByRole('button', { name: 'Enregistrer la ligne' }).click();
    await expect(page.getByTestId('allocation-result')).toContainText('dépasserait l\'enveloppe');
    await expect(page.getByTestId('allocation-lines').locator('tbody tr')).toHaveCount(18);
    // Valide : la ligne apparaît, le reste à répartir baisse.
    await form.getByLabel('Montant réparti (euros hors taxes)').fill('4 000');
    await form.getByRole('button', { name: 'Enregistrer la ligne' }).click();
    await expect(page.getByRole('status', { name: 'Confirmation' })).toContainText('Enregistré');
    await expect(page.getByTestId('allocation-lines').locator('tbody tr')).toHaveCount(19);
    await expect(page.getByTestId('allocation-remaining')).toContainText('77 400,00');
    // Modifier une ligne exige un motif.
    await form.getByLabel('Campagne').selectOption('CMP-DEMO-02');
    await form.getByLabel('CVR').selectOption(uh);
    await expect(page.getByTestId('allocation-existing')).toContainText('4 000,00');
    await form.getByLabel('Montant réparti (euros hors taxes)').fill('4 500');
    await form.getByRole('button', { name: 'Enregistrer la ligne' }).click();
    await expect(page.getByTestId('allocation-result')).toContainText('Un motif est obligatoire');
    await form.getByLabel('Motif').fill('Besoin supplémentaire sur ce CVR.');
    await form.getByRole('button', { name: 'Enregistrer la ligne' }).click();
    await expect(page.getByTestId('allocation-remaining')).toContainText('76 900,00');

    await as(context, 'DemoDirection01');
    await page.goto('/fr/budget');
    await expect(page.getByTestId('budget-lines').locator('tbody tr')).toHaveCount(19);
    expect(w.consoleErrors).toEqual([]);
    expect((await page.goto('/fr/budget/allocation'))?.status()).toBe(404);
  });

  test('le prestataire consulte comme l\'agence mais ne répartit pas', async ({ page, context }) => {
    await as(context, 'DemoPresta01');
    await page.goto('/fr/budget/allocation');
    await expect(page.getByTestId('allocation-readonly')).toBeVisible();
    await expect(page.getByTestId('allocation-form')).toHaveCount(0);
    await page.goto('/fr/budget/envelope');
    await expect(page.getByTestId('envelope-readonly')).toBeVisible();
  });

  test('un besoin au-delà du disponible est enregistré sans blocage : alerte aux deux côtés, trace au journal', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoAgence01');
    await page.goto('/fr/alerts');
    const agencyAlerts = page.getByTestId('budget-alerts');
    await expect(agencyAlerts).toContainText('1 besoin dépasse le disponible');
    // La maille sans allocation a reçu sa ligne plus haut : l'alerte « budget non renseigné » a disparu.
    await expect(agencyAlerts).not.toContainText('Budget non renseigné');

    // Saisie d'un besoin permanent de 8 semaines sur un CVR dont l'allocation est serrée (1 500 euros, déjà 819 comptés).
    await page.goto('/fr/needs/new');
    const sector = await optionValue(page, '#f-sector', 'Nord-Test 3');
    await page.selectOption('#f-sector', sector);
    await page.selectOption('#f-dispositif', 'permanent');
    await page.selectOption('#f-campaign', 'CMP-DEMO-01');
    await page.selectOption('#f-position', 'Poste 6');
    await page.selectOption('#f-priority', '2');
    await page.selectOption('#f-hours', '14');
    await page.fill('#f-slot', '08:00-12:00');
    await pickRange(page, 'f-range-0', '2027-03-08', '2027-04-30');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Lun à ven' }).click();
    await page.locator('input[type=checkbox]:not([name$="-day"])').first().check();
    await page.getByRole('button', { name: 'Enregistrer le besoin' }).click();
    const saved = page.getByTestId('saved');
    const confirm = page.getByTestId('confirm-actions');
    await expect(saved.or(confirm)).toBeVisible();
    if (await confirm.isVisible()) await confirm.getByRole('button').first().click();
    await expect(saved).toBeVisible();
    const code = /BES-DEMO-\d{3}/.exec((await saved.textContent()) ?? '')?.[0];
    expect(code).toBeTruthy();

    await page.goto('/fr/budget/needs?filter=beyond');
    const table = page.getByTestId('budget-needs');
    await expect(table.locator('tbody tr')).toHaveCount(2);
    await expect(table.locator(`tr[data-need-code="${code}"]`)).toContainText('Au-delà du disponible');
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('budget-alerts')).toContainText('2 besoins dépassent le disponible');
    await page.goto('/fr/budget/journal');
    const journal = page.getByTestId('budget-journal');
    await expect(journal.locator('[data-event-code="EV-28"]')).toHaveCount(2);
    await expect(journal.locator('[data-event-code="EV-28"]').first()).toContainText(code!.replaceAll('-', '‑'));
    await expect(journal.locator('[data-event-code="EV-51"]').first()).toContainText('Besoin supplémentaire sur ce CVR.');
    await expect(journal.locator('[data-event-code="EV-50"]').first()).toContainText('Rallonge validée en comité.');

    // La direction cliente est alertée, sans montant ni alerte d'agence ; son journal exclut l'enveloppe.
    await as(context, 'DemoDirection01');
    await page.goto('/fr/alerts');
    const clientAlerts = page.getByTestId('budget-alerts');
    await expect(clientAlerts).toContainText('2 besoins dépassent le disponible');
    await expect(clientAlerts.locator('[data-audience="agency"]')).toHaveCount(0);
    await expect(clientAlerts).not.toContainText('€');
    await page.goto('/fr/budget/journal');
    await expect(page.getByTestId('budget-journal').locator('[data-event-code="EV-28"]')).toHaveCount(2);
    await expect(page.getByTestId('budget-journal').locator('[data-event-code="EV-50"]')).toHaveCount(0);
    await expect(page.getByTestId('budget-journal').locator('[data-event-code="EV-52"]')).toHaveCount(0);
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('le DR ne lit que les allocations de ses CVR ; le CVR et le RS n\'ont pas d\'entrée Budget', async ({ page, context }) => {
    await as(context, 'DemoDR01');
    await page.goto('/fr/budget');
    await expect(page.getByTestId('budget-tiles')).toContainText('Réparti sur votre périmètre');
    await expect(page.getByTestId('budget-tiles')).not.toContainText('Enveloppe de la cliente');
    await expect(tabs(page).getByRole('link')).toHaveText(['Situation', 'Journal']);
    const rows = page.getByTestId('budget-lines').locator('tbody tr');
    expect(await rows.count()).toBeGreaterThan(0);
    expect(await page.getByTestId('budget-lines').getByText('Centre-Test').count()).toBe(0);
    expect(await page.getByTestId('budget-lines').getByText('Sud-Test').count()).toBe(0);
    expect((await page.goto('/fr/budget/envelope'))?.status()).toBe(404);
    for (const username of ['DemoCVR01']) {
      await as(context, username);
      expect((await page.goto('/fr/budget'))?.status(), username).toBe(404);
    }
  });

  test('le RS n\'a pas d\'entrée Budget (visualisation comme le prestataire le voit)', async ({ page, context }) => {
    await as(context, 'DemoPresta01');
    await context.addCookies([{ name: 'demo_view_as', value: 'sim.rs', url: 'http://localhost:3104' }]);
    expect((await page.goto('/fr/budget'))?.status()).toBe(404);
  });

  test('URL : regroupement et tri se retrouvent par lien profond, retour arrière et rechargement', async ({ page, context }) => {
    await as(context, 'DemoAgence01');
    await page.goto('/fr/budget');
    await expect(page.getByTestId('budget-groups')).toHaveAttribute('data-axis', 'dispositif');
    await page.getByRole('navigation', { name: 'Regrouper par' }).getByRole('link', { name: 'CVR' }).click();
    await expect(page).toHaveURL(/by=cvr/);
    await expect(page.getByTestId('budget-groups')).toHaveAttribute('data-axis', 'cvr');
    await page.getByTestId('budget-lines').getByRole('link', { name: /Réparti/ }).first().click();
    await expect(page).toHaveURL(/sort=allocated&dir=asc/);
    await page.goBack();
    await expect(page).toHaveURL(/by=cvr$/);
    await page.reload();
    await expect(page.getByTestId('budget-groups')).toHaveAttribute('data-axis', 'cvr');
    await page.goto('/fr/budget?by=inconnu&sort=nope');
    await expect(page.getByTestId('budget-groups')).toHaveAttribute('data-axis', 'dispositif');
    await page.goto('/fr/budget/needs?filter=unpriced');
    await expect(page.getByText('Aucun besoin ne correspond à ce filtre.')).toBeVisible();
    await page.goto('/fr/budget/needs?filter=beyond&sort=cost&dir=desc');
    await expect(page.getByTestId('budget-needs').getByRole('columnheader', { name: /Coût estimé/ })).toHaveAttribute('aria-sort', 'descending');
    await page.reload();
    await expect(page.getByTestId('budget-needs').getByRole('columnheader', { name: /Coût estimé/ })).toHaveAttribute('aria-sort', 'descending');
  });

  test('anglais : mêmes écrans, montants et dates à l\'anglaise', async ({ page, context }) => {
    const w = watch(page);
    await as(context, 'DemoAgence01');
    await page.goto('/en/budget');
    await expect(page.getByRole('heading', { level: 1, name: 'Budget' })).toBeVisible();
    await expect(page.getByTestId('budget-tiles')).toContainText('€120,000.00');
    await expect(page.getByTestId('budget-tiles')).toContainText('Landing');
    await expect(page.getByTestId('budget-tiles')).toContainText('Pricing coverage');
    await page.goto('/en/budget/needs');
    await expect(page.getByTestId('budget-needs').getByRole('columnheader', { name: /Estimated cost/ })).toBeVisible();
    await page.goto('/en/budget/journal');
    await expect(page.getByTestId('budget-journal')).toContainText('Client envelope entered');
    await page.goto('/en/alerts');
    await expect(page.getByTestId('budget-alerts')).toContainText('go beyond what is available');
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('390 px : aucun défilement horizontal, tableaux en cartes, cibles de 44 px', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await as(context, 'DemoAgence01');
    for (const url of ['/fr/budget', '/fr/budget/envelope', '/fr/budget/allocation', '/fr/budget/needs', '/fr/budget/journal']) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), url).toBeLessThanOrEqual(0);
    }
    await page.goto('/fr/budget/needs');
    const row = page.getByTestId('budget-needs').locator('tbody tr').first();
    expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe('block');
    for (const url of ['/fr/budget/allocation', '/fr/budget/envelope']) {
      await page.goto(url);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main a, main button, main input, main select, main textarea')]
          .filter((el) => el.getClientRects().length > 0 && !el.closest('.sr-only') && !(el instanceof HTMLInputElement && el.closest('label')))
          .map((el) => ({ n: (el.textContent || el.tagName).trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
          .filter((x) => x.h < 44),
      );
      expect(small, url).toEqual([]);
    }
  });

  test('performance H3 : budget sous 2 s, saisie réactive sous 100 ms', async ({ page, context }) => {
    await as(context, 'DemoAgence01');
    const t0 = Date.now();
    await page.goto('/fr/budget');
    await expect(page.getByTestId('budget-tiles')).toBeVisible();
    const first = Date.now() - t0;
    await page.goto('/fr/budget/allocation');
    const input = page.locator('#allocation-amount');
    await expect(input).toBeVisible();
    const t1 = await input.evaluate(async (el) => {
      const field = el as HTMLInputElement;
      field.focus();
      const start = performance.now();
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(field, '1 234,5');
      field.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      return performance.now() - start;
    });
    await expect(input).toHaveValue('1 234,5');
    const t2 = Date.now();
    await page.getByTestId('budget-tabs').getByRole('link', { name: 'Journal' }).click();
    await expect(page.getByTestId('budget-journal')).toBeVisible();
    const tab = Date.now() - t2;
    console.log(`A4b1 perf : budget ${first} ms, saisie ${t1.toFixed(1)} ms, changement d'onglet ${tab} ms`);
    expect(first).toBeLessThan(2000);
    expect(t1).toBeLessThan(100);
    expect(tab).toBeLessThan(2000);
  });
});
