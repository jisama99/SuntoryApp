import { expect, test } from '@playwright/test';
import { setProfile } from './helpers';

// Projet « isolated » (voir playwright.config.ts) : serveur à part, un seul fichier, donc aucune écriture concurrente.
// L'annulation (D159) n'est possible que si rien n'a été écrit depuis : ici l'issue est unique et déterministe.
test.describe.configure({ mode: 'serial' });

test.describe('lot A3 : validation en lot avec motif commun, annulable (serveur isolé)', () => {
  test('lot refusé sans sélection ni motif, puis validé, puis annulé : les propositions redeviennent à décider', async ({ page, context }) => {
    await setProfile(context, 'dr_client');
    await page.goto('/fr/proposals');
    const batch = page.getByTestId('batch-decision');
    await expect(batch).toBeVisible();
    const pending = await batch.locator('input[type="checkbox"]').count();
    await batch.getByRole('button', { name: 'Refuser la sélection' }).click();
    await expect(page.getByTestId('batch-result')).toContainText('Cochez');
    await batch.locator('input[type="checkbox"]').nth(0).check();
    await batch.getByRole('button', { name: 'Refuser la sélection' }).click();
    await expect(page.getByTestId('batch-result')).toContainText('motif commun');
    await batch.locator('textarea').fill('Lot de démonstration.');
    await batch.getByRole('button', { name: 'Valider la sélection' }).click();
    await expect(page.getByTestId('batch-result')).toContainText('décidée');
    const toast = page.getByRole('status', { name: 'Confirmation' });
    await expect(toast).toBeVisible();
    await expect(page.getByTestId('batch-decision').locator('input[type="checkbox"]')).toHaveCount(pending - 1);
    await toast.getByRole('button', { name: 'Annuler' }).click();
    await expect(toast).toContainText('Modification annulée');
    await expect(toast).not.toContainText('impossible');
    await page.reload();
    await expect(page.getByTestId('batch-decision').locator('input[type="checkbox"]')).toHaveCount(pending);
  });

  test('une décision unique est annulable, la proposition redevient à décider', async ({ page, context }) => {
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/proposals?filter=all');
    await page.getByRole('link', { name: 'BES-DEMO-002', exact: true }).first().click();
    await page.selectOption('select[id^="decide-outcome"]', 'approved');
    await page.getByRole('button', { name: 'Enregistrer la décision' }).click();
    await expect(page.locator('[data-decision-status="valid"]')).toContainText('Validée');
    const toast = page.getByRole('status', { name: 'Confirmation' });
    await toast.getByRole('button', { name: 'Annuler' }).click();
    await expect(toast).toContainText('Modification annulée');
    await page.reload();
    await expect(page.getByTestId('decision-form')).toBeVisible();
  });
});
