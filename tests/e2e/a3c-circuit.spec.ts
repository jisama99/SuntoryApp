import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pickRange, setProfile, watch } from './helpers';

// Projet « circuit » (voir playwright.config.ts) : serveur à part, un seul fichier, exécution en série. Chaque scénario a une seule
// issue possible : le jeu de démonstration est identique à chaque lancement du serveur et l'horloge de démonstration est fixe.
test.describe.configure({ mode: 'serial' });

const open = async (page: Page, code: string, filter = 'all') => {
  await page.goto(`/fr/proposals?filter=${filter}`);
  await page.getByRole('link', { name: code, exact: true }).first().click();
  await expect(page.getByTestId('dimensions')).toBeVisible();
};
const card = (page: Page, title: string) => page.getByTestId('dimensions').locator('h3', { hasText: title }).locator('..');
const save = (page: Page) => page.getByTestId('validation-form').getByRole('button', { name: 'Enregistrer' }).click();

test.describe('lot A3c : validation CVR, escalade DR, délégations, qualification agence', () => {
  test('le CVR voit ses besoins à valider avec urgence et retard, et chaque profil ouvre la page sans erreur', async ({ page, context }) => {
    const w = watch(page);
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/proposals?filter=validation');
    const table = page.getByTestId('pipeline-table');
    await expect(table).toContainText('BES-DEMO-030');
    await expect(table).toContainText('BES-DEMO-031');
    await expect(table.locator('tr', { hasText: 'BES-DEMO-030' })).toContainText('En retard');
    await expect(table.locator('tr', { hasText: 'BES-DEMO-030' })).toContainText('Le CVR');
    await expect(page.getByTestId('batch-validation')).toBeVisible();
    for (const profile of ['direction_client', 'dr_client', 'cvr_client', 'rs', 'agency_operator', 'agency_admin', 'provider_admin']) {
      await setProfile(context, profile);
      await page.goto('/fr/proposals?filter=all');
      await expect(page.getByTestId('pipeline-table')).toBeVisible();
    }
    expect(w.consoleErrors).toEqual([]);
    expect(w.external).toEqual([]);
  });

  test('le CVR valide : état « Validé » et l\'agence peut ensuite qualifier', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-030');
    await expect(card(page, 'Validation')).toContainText('À valider par le CVR');
    await expect(page.getByTestId('qualify-form')).toHaveCount(0); // pas de qualification avant la validation
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-030');
    await page.selectOption('#review-outcome', 'validated');
    await save(page);
    await expect(page.getByRole('status', { name: 'Confirmation' })).toBeVisible();
    await expect(card(page, 'Validation')).toContainText('Validé');
    await expect(page.getByTestId('journal')).toContainText('Besoin validé');
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-030');
    await expect(page.getByTestId('qualify-form')).toBeVisible();
  });

  test('le CVR refuse : motif obligatoire, puis le besoin est renvoyé et validé au second tour', async ({ page, context }) => {
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-031');
    await page.selectOption('#review-outcome', 'refused');
    await save(page);
    await expect(page.getByTestId('validation-form')).toContainText('Un motif est obligatoire.');
    await page.fill('#review-motive', 'Période à revoir avec le secteur (motif de démonstration).');
    await save(page);
    await expect(card(page, 'Validation')).toContainText('Refusé');
    await expect(page.getByTestId('validation-history')).toContainText('Période à revoir avec le secteur');
    await expect(page.getByTestId('validation-form')).toHaveCount(0);
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-031');
    await expect(page.getByTestId('qualify-form')).toHaveCount(0);
    await page.getByTestId('resubmit-form').getByRole('button', { name: 'Renvoyer à la validation' }).click();
    await expect(card(page, 'Validation')).toContainText('À valider par le CVR');
    await expect(card(page, 'Validation')).toContainText('Tour 2');
    await expect(page.getByTestId('validation-history').locator('li')).toHaveCount(2); // refus puis renvoi : rien n'est effacé
  });

  test('le CVR escalade pour arbitrage entre CVR, puis le DR arbitre', async ({ page, context }) => {
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-031');
    await page.selectOption('#review-outcome', 'escalated');
    await page.selectOption('#review-case', 'out_of_envelope');
    await expect(page.getByTestId('validation-form')).toContainText('pas encore branchée');
    await page.selectOption('#review-case', 'arbitration');
    await expect(page.locator('#review-concerned option')).toHaveCount(3); // choix + 2 CVR voisins du même DR
    await page.fill('#review-motive', 'Magasins partagés avec le secteur voisin (motif de démonstration).');
    await save(page);
    await expect(page.getByTestId('validation-form')).toContainText('Choisissez un CVR voisin');
    await page.selectOption('#review-concerned', { index: 1 });
    await save(page);
    await expect(card(page, 'Validation')).toContainText('Escaladé au DR');
    await expect(page.getByTestId('validation-form')).toHaveCount(0); // le CVR a transmis
    await setProfile(context, 'dr_client');
    await open(page, 'BES-DEMO-031', 'validation');
    await expect(page.getByTestId('validation-form')).toContainText('Arbitrer le besoin escaladé');
    await page.selectOption('#review-outcome', 'validated');
    await save(page);
    await expect(card(page, 'Validation')).toContainText('Validé');
    await expect(page.getByTestId('validation-history')).toContainText('Arbitrage entre CVR');
  });

  test('le DR refuse un besoin escaladé avec motif ; la validation en lot arbitre plusieurs besoins', async ({ page, context }) => {
    await setProfile(context, 'dr_client');
    await page.goto('/fr/proposals?filter=validation');
    const batch = page.getByTestId('batch-validation');
    await expect(batch).toContainText('BES-DEMO-033');
    await batch.getByRole('button', { name: 'Refuser la sélection' }).click();
    await expect(page.getByTestId('batch-validation-result')).toContainText('Cochez');
    await batch.locator('label', { hasText: 'BES-DEMO-033' }).locator('input').check();
    await batch.getByRole('button', { name: 'Refuser la sélection' }).click();
    await expect(page.getByTestId('batch-validation-result')).toContainText('motif commun');
    await batch.locator('textarea').fill('Arbitrage défavorable (motif de démonstration).');
    await batch.getByRole('button', { name: 'Refuser la sélection' }).click();
    await expect(page.getByRole('status', { name: 'Confirmation' })).toBeVisible();
    await expect(page.getByTestId('batch-validation')).toHaveCount(0); // plus aucun besoin escaladé à arbitrer
    await open(page, 'BES-DEMO-033');
    await expect(card(page, 'Validation')).toContainText('Refusé');
  });

  test('délégation : l\'agence administration crée, le suppléant agit sur la zone de l\'absent seulement, puis l\'arrêt retire l\'accès', async ({ page, context }) => {
    // Avant la délégation : le CVR de démonstration ne voit pas le besoin d'un autre CVR.
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByTestId('pipeline-table')).not.toContainText('BES-DEMO-035');
    expect((await page.goto('/fr/settings/delegations'))?.status()).toBe(404); // écran réservé à l'agence
    await setProfile(context, 'agency_operator');
    expect((await page.goto('/fr/settings/delegations'))?.status()).toBe(404); // l'opération n'a pas Paramètres (D118)

    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/delegations');
    await expect(page.getByTestId('delegations-table')).toBeVisible();
    const absent = await page.locator('#delegation-absent option', { hasText: 'CVR-WY02' }).getAttribute('value');
    await page.selectOption('#delegation-absent', absent as string);
    const sub = await page.locator('#delegation-substitute option', { hasText: 'CVR-ZV01' }).getAttribute('value');
    await page.selectOption('#delegation-substitute', sub as string);
    await page.getByTestId('delegation-form').getByRole('button', { name: 'Créer la délégation' }).click();
    await expect(page.getByTestId('delegation-result')).toContainText('Choisissez les deux zones et la période');
    await pickRange(page, 'delegation-period', '2026-10-23', '2026-10-30');
    await page.getByTestId('delegation-form').getByRole('button', { name: 'Créer la délégation' }).click();
    await expect(page.getByTestId('delegation-result')).toContainText('Délégation créée');
    const row = page.getByTestId('delegations-table').locator('tr', { hasText: 'CVR-WY02' }).filter({ hasText: 'En cours' });
    await expect(row).toHaveCount(1);
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('pipeline-alerts')).toContainText('1 délégation est en cours');
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('pipeline-alerts')).not.toContainText('délégation'); // alerte d'agence, jamais côté cliente

    // Pendant la délégation : le suppléant voit et valide le besoin de la zone de l'absent.
    await setProfile(context, 'cvr_client');
    await open(page, 'BES-DEMO-035');
    await expect(page.getByTestId('acting-for')).toContainText('suppléance');
    await page.selectOption('#review-outcome', 'validated');
    await save(page);
    await expect(card(page, 'Validation')).toContainText('Validé');
    await expect(page.getByTestId('validation-history')).toContainText('En suppléance');
    // Jamais au-delà du délégant : un besoin d'un troisième CVR (CVR-GP03) reste hors de portée.
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByTestId('pipeline-table')).toContainText('BES-DEMO-035');
    await expect(page.getByTestId('pipeline-table')).not.toContainText('BES-DEMO-014');

    // Fin de délégation : l'accès disparaît le jour même, la trace reste.
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/delegations');
    await page.getByTestId('delegations-table').locator('tr', { hasText: 'CVR-WY02' }).filter({ hasText: 'En cours' }).getByRole('button', { name: 'Arrêter' }).click();
    await expect(page.getByTestId('delegations-table').locator('tr', { hasText: 'CVR-WY02' }).filter({ hasText: 'Arrêtée le' })).toHaveCount(1);
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/proposals?filter=all');
    await expect(page.getByTestId('pipeline-table')).not.toContainText('BES-DEMO-035');
    await setProfile(context, 'agency_operator');
    await open(page, 'BES-DEMO-035');
    await expect(page.getByTestId('validation-history')).toContainText('En suppléance'); // la trace reste au dossier
  });

  test('audience : la cliente ne lit aucun événement d\'agence ni la liste des délégations', async ({ page, context }) => {
    for (const profile of ['direction_client', 'dr_client', 'cvr_client', 'rs']) {
      await setProfile(context, profile);
      await page.goto('/fr/proposals?filter=all');
      const link = page.getByTestId('pipeline-table').getByRole('link').first();
      await link.click();
      await expect(page.getByTestId('journal').locator('[data-audience="agency"]')).toHaveCount(0);
    }
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('pipeline-alerts')).not.toContainText('délégation');
    await expect(page.getByTestId('pipeline-alerts')).toContainText('besoins refusés attendent leur correction et leur renvoi');
  });

  test('URL, retour arrière, rechargement, lien profond ; trois états ; cartes à 390 px et cibles de 44 px', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/delegations?filter=ended');
    await expect(page.getByTestId('delegations-table')).toContainText('Terminée');
    await page.getByRole('link', { name: 'En cours', exact: true }).first().click();
    await expect(page).toHaveURL(/filter=active/);
    await page.goBack();
    await expect(page).toHaveURL(/filter=ended/);
    await page.reload();
    await expect(page.getByTestId('delegations-table')).toContainText('Terminée');
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/proposals?filter=validation');
    await page.reload();
    await expect(page).toHaveURL(/filter=validation/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/fr/proposals?filter=all');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await open(page, 'BES-DEMO-032');
    const small = await page.locator('main button, main a, main select, main input:not([type="checkbox"]), main textarea').evaluateAll((els) =>
      els.filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 43.5; }).map((e) => e.outerHTML.slice(0, 80)));
    expect(small).toEqual([]);
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/delegations');
    const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow2).toBeLessThanOrEqual(0);
    await page.goto('/fr/settings/delegations?filter=ended');
    await expect(page.getByTestId('delegations-table')).toBeVisible();
  });

  test('anglais : libellés de la chaîne de validation', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/en/proposals?filter=all');
    await expect(page.getByTestId('pipeline-table')).toContainText('Refused');
    await expect(page.getByTestId('pipeline-table')).toContainText('Validated');
    await page.getByRole('link', { name: 'BES-DEMO-032', exact: true }).first().click();
    await expect(page.getByTestId('resubmit-form')).toContainText('Resubmit the need for validation');
    await expect(page.getByTestId('validation-history')).toContainText('Refused');
    await setProfile(context, 'agency_admin');
    await page.goto('/en/settings/delegations');
    await expect(page.getByRole('heading', { level: 1, name: 'Manage delegations' })).toBeVisible();
    await expect(page.getByTestId('delegation-form')).toContainText('New delegation');
  });
});
