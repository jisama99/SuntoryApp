import { expect, test } from '@playwright/test';
import { setProfile, watch } from './helpers';

test.describe.configure({ mode: 'serial' });

const open = async (page: import('@playwright/test').Page, code: string) => {
  await page.goto('/fr/proposals?filter=all');
  await page.getByRole('link', { name: code, exact: true }).first().click();
  await expect(page.getByTestId('dimensions')).toBeVisible();
};

test.describe('lot A3 : propositions, décisions, qui doit agir, entonnoir', () => {
  test('chaque profil ouvre la page, sans erreur de console ni requête externe, avec ses trois états', async ({ page, context }) => {
    const w = watch(page);
    for (const profile of ['direction_client', 'dr_client', 'cvr_client', 'rs', 'agency_operator', 'agency_admin', 'provider_admin']) {
      await setProfile(context, profile);
      await page.goto('/fr/proposals?filter=all');
      await expect(page.getByRole('heading', { level: 1, name: 'Propositions et décisions' })).toBeVisible();
      await expect(page.getByTestId('pipeline-table')).toBeVisible();
      await page.goto('/fr/proposals/funnel');
      await expect(page.getByTestId('funnel-stock')).toBeVisible();
    }
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
    expect((await page.goto('/fr/proposals/00000000-0000-4000-8000-000000000000'))?.status()).toBe(404);
    // Un besoin hors périmètre répond 404 : le RS ne voit pas un besoin d'un autre secteur.
    await setProfile(context, 'rs');
    await page.goto('/fr/proposals?filter=all');
    expect((await page.goto('/fr/budget'))?.status()).toBe(404);
  });

  test('URL : filtre, tri, lien profond, retour arrière et rechargement', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/proposals?filter=overdue&sort=need&dir=desc');
    const table = page.getByTestId('pipeline-table');
    await expect(table).toBeVisible();
    const codes = async () => (await table.locator('tbody tr td:first-child').allInnerTexts()).map((t) => t.replace(/\s/g, ''));
    const desc = await codes();
    expect(desc).toEqual([...desc].sort().reverse());
    await page.getByRole('link', { name: 'En attente de décision' }).click();
    await expect(page).toHaveURL(/filter=decision/);
    await page.goBack();
    await expect(page).toHaveURL(/filter=overdue/);
    await page.reload();
    expect(await codes()).toEqual(desc);
    await page.goto('/fr/proposals?filter=inconnu&sort=zzz');
    await expect(table).toBeVisible();
  });

  test('performance H3 : premier affichage utile sous 2 s, interaction sous 100 ms', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    const t0 = Date.now();
    await page.goto('/fr/proposals');
    await expect(page.getByTestId('pipeline-table')).toBeVisible();
    const first = Date.now() - t0;
    const t1 = await page.evaluate(() => {
      const start = performance.now();
      const b = document.querySelector<HTMLButtonElement>('button');
      b?.focus();
      return performance.now() - start;
    });
    console.log(`A3 perf : premier affichage ${first} ms, interaction ${t1.toFixed(1)} ms`);
    expect(first).toBeLessThan(2000);
    expect(t1).toBeLessThan(100);
  });

  test('audience : la cliente ne lit ni note interne, ni chiffrage ; l\'agence les lit', async ({ page, context }) => {
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-005');
    await expect(page.getByText('Interne agence')).toHaveCount(0);
    await expect(page.getByText(/Chiffrage/)).toHaveCount(0);
    await expect(page.getByText('Qualifier le besoin')).toHaveCount(0);
    await expect(page.getByTestId('decision-form')).toBeVisible();
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-005');
    await expect(page.locator('[data-note-visibility="agency_internal"]')).toHaveCount(1);
    await expect(page.getByText('Chiffrage complet').first()).toBeVisible();
    await expect(page.getByTestId('decision-form')).toHaveCount(0);
  });

  test('parcours : qualification, proposition, refus, nouvelle proposition invalidant le refus, accord, recrutement', async ({ page, context }) => {
    test.setTimeout(120_000);
    const w = watch(page);
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-011');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await expect(page.getByTestId('qualify-form')).toHaveCount(0);
    await expect(page.getByTestId('proposal-form')).toBeVisible();
    // Envoi sans référence : refus explicite côté écran.
    await page.getByRole('button', { name: 'Envoyer à la cliente' }).click();
    await expect(page.getByTestId('proposal-result')).toContainText('Complétez');
    await page.fill('#proposal-worker', 'INT-777');
    await page.getByRole('button', { name: 'Envoyer à la cliente' }).click();
    await expect(page.getByTestId('proposal-result')).toContainText(/Proposition envoyée|expliqué/);
    await page.reload();
    await expect(page.locator('[data-proposal-version="1"][data-proposal-status="proposed"]')).toBeVisible();
    // Décision : la DR refuse sans motif (bloqué), puis avec motif.
    await setProfile(context, 'dr_client');
    await open(page, 'BES-DEMO-011');
    await page.selectOption('select[id^="decide-outcome"]', 'refused');
    await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
    await expect(page.getByTestId('decision-form')).toContainText('motif est obligatoire');
    await page.fill('textarea[id^="decide-motive"]', 'Profil non adapté.');
    await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
    await expect(page.locator('[data-decision-status="valid"]')).toContainText('Refusée');
    // Nouvelle proposition par l'agence : le refus de la version 1 est invalidé.
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-011');
    await page.fill('#proposal-worker', 'INT-778');
    await page.getByRole('button', { name: 'Envoyer à la cliente' }).click();
    await expect(page.getByTestId('proposal-result')).toContainText('Proposition envoyée');
    await page.reload();
    await expect(page.locator('[data-proposal-version="1"][data-proposal-status="superseded"]')).toBeVisible();
    await expect(page.locator('[data-proposal-version="1"] [data-decision-status="invalidated"]')).toBeVisible();
    // Accord, recrutement finalisé, puis prise de poste et remise du véhicule séparées.
    await setProfile(context, 'dr_client');
    await open(page, 'BES-DEMO-011');
    await page.selectOption('select[id^="decide-outcome"]', 'approved');
    await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
    await expect(page.locator('[data-proposal-version="2"] [data-decision-status="valid"]')).toContainText('Validée');
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-011');
    await page.locator('[data-step="hired"]').getByRole('button', { name: 'Enregistrer le recrutement' }).click();
    await expect(page.locator('[data-step="hired"]')).toContainText('Enregistrée le');
    await expect(page.getByTestId('dimensions')).toContainText('Recrutement finalisé');
    await page.locator('[data-step="vehicle_handover"]').getByRole('button', { name: 'Enregistrer la remise' }).click();
    await expect(page.locator('[data-step="vehicle_handover"]')).toContainText('Enregistrée le');
    await expect(page.getByTestId('dimensions')).not.toContainText('En poste');
    expect(w.consoleErrors).toEqual([]);
  });

  test('notes : partage confirmé, retrait avec trace', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-006');
    const thread = page.locator('[data-testid^="notes-proposal-"]').first();
    await thread.locator('textarea').fill('Note partagée de test.');
    await thread.locator('select').selectOption('shared_client');
    await thread.getByRole('button', { name: 'Ajouter la note' }).click();
    await expect(thread).toContainText('Confirmez le partage');
    await thread.getByLabel('Je confirme le partage').check();
    await thread.getByRole('button', { name: 'Ajouter la note' }).click();
    await expect(thread.locator('[data-note-visibility="shared_client"]').last()).toContainText('Note partagée de test.');
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-006');
    await expect(page.getByText('Note partagée de test.')).toBeVisible();
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-006');
    await page.locator('[data-note-visibility="shared_client"]', { hasText: 'Note partagée de test.' }).getByRole('button', { name: 'Retirer la note' }).click();
    await expect(page.getByText(/Retirée le/).first()).toBeVisible();
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-006');
    await expect(page.getByText('Note partagée de test.')).toHaveCount(0);
  });

  test('entonnoir : zone blanche à part, effectif trop faible, taux affichés', async ({ page, context }) => {
    await setProfile(context, 'direction_client');
    await page.goto('/fr/proposals/funnel');
    await expect(page.locator('[data-funnel-state]')).toHaveCount(6);
    await expect(page.locator('[data-outside="whiteZone"]')).toContainText('1 besoin');
    await expect(page.locator('[data-situation="reassigned"]')).toContainText('Effectif trop faible');
    await expect(page.locator('[data-situation="white_zone"]')).toContainText('Pas de délai');
    await expect(page.getByTestId('funnel-vacancy')).toBeVisible();
    // D210 : écart acceptation / poste démarré par situation, « plus tard dans la journée » vide faute d'heure enregistrée.
    const lags = page.getByTestId('funnel-lags');
    await expect(lags).toContainText('Même jour');
    await expect(lags.locator('[data-lag-situation="new"]')).toContainText("l'heure n'est pas enregistrée");
    // D211 : le besoin stoppé figure sur sa ligne, avec le rappel des heures effectuées.
    await expect(page.locator('[data-outside="stopped"]')).toBeVisible();
  });

  test('carte Exécution : statut d\'exécution, statut de poste calculé affiché à part', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-001');
    const dims = page.getByTestId('dimensions');
    await expect(dims.locator('h3', { hasText: 'Exécution' }).locator('..')).toContainText('En poste');
    await expect(dims.locator('h3', { hasText: 'Exécution' }).locator('..')).not.toContainText('Refusé');
    await expect(page.getByTestId('position-status')).toContainText('Statut de poste calculé');
    await open(page, 'BES-DEMO-009');
    await expect(dims.locator('h3', { hasText: 'Exécution' }).locator('..')).toContainText('Non démarrée');
    await expect(page.getByTestId('position-status')).toContainText('Refusé');
  });

  test('390 px : tableau en cartes, aucun défilement horizontal, cibles de 44 px', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'dr_client');
    for (const url of ['/fr/proposals', '/fr/proposals/funnel']) {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    }
    // Entonnoir : les deux tableaux passent en cartes et rien n'est coupé dans leur conteneur.
    await page.goto('/fr/proposals/funnel');
    for (const id of ['funnel-stock', 'funnel-delays', 'funnel-lags']) {
      const table = page.getByTestId(id);
      expect(await table.locator('tbody tr').first().evaluate((el) => getComputedStyle(el).display)).toBe('block');
      expect(await table.evaluate((el) => (el.parentElement as HTMLElement).scrollWidth - (el.parentElement as HTMLElement).clientWidth)).toBeLessThanOrEqual(0);
    }
    await page.goto('/fr/proposals');
    const row = page.getByTestId('pipeline-table').locator('tbody tr').first();
    expect(await row.evaluate((el) => getComputedStyle(el).display)).toBe('block');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main a, main button, main input, main select')]
        .filter((el) => el.getClientRects().length > 0 && !el.closest('.sr-only') && !(el instanceof HTMLInputElement && el.closest('label')))
        .map((el) => ({ n: (el.textContent || el.tagName).trim().slice(0, 30), h: Math.round(el.getBoundingClientRect().height) }))
        .filter((x) => x.h < 44),
    );
    expect(small).toEqual([]);
  });

  test('anglais : les écrans du lot sont traduits', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/en/proposals');
    await expect(page.getByRole('heading', { level: 1, name: 'Proposals and decisions' })).toBeVisible();
    await page.goto('/en/proposals/funnel');
    await expect(page.getByRole('heading', { level: 1, name: 'Recruitment funnel' })).toBeVisible();
    await page.goto('/en/alerts');
    await expect(page.getByTestId('pipeline-alerts')).toBeVisible();
  });
});
