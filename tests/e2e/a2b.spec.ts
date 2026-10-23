import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { pickDay, setProfile, watch } from './helpers';

// Les parcours modifient l'état en mémoire du serveur (réouverture, paramètres, calendrier) : exécution en série et dans l'ordre.
test.describe.configure({ mode: 'serial' });

const ROW = (over: { start: string; end: string; days?: string; slot?: string }) =>
  ['Permanent', 'CMP-DEMO-01', 'Poste 4', '2', '14', over.start, over.end, '', '', over.days ?? 'LUN;MAR', over.slot ?? '08:00-12:00', '', ''].join('\t');

async function paste(page: Page, text: string) {
  await page.fill('#batch-paste', text);
  await page.getByRole('button', { name: /Convertir en lignes|Convert to lines/ }).click();
}

test.describe('échéances, blocage et saisie en lot (A2b)', () => {
  test('RS : après échéance, les jours du mois clos sont désactivés avec la raison écrite', async ({ page, context }) => {
    await setProfile(context, 'rs');
    const w = watch(page);
    await page.goto('/fr/needs/new');
    await expect(page.getByTestId('deadline-banner')).toContainText('close depuis le 19/10/2026');
    await page.locator('#f-range-0').click();
    const dialog = page.getByRole('dialog');
    await page.getByRole('button', { name: 'Mois suivant' }).click();
    const nov = dialog.locator('[data-date="2026-11-09"]');
    await nov.focus();
    await expect(nov).toHaveAttribute('aria-disabled', 'true');
    await expect(dialog.getByTestId('calendar-reason')).toContainText('Saisie de novembre 2026 close depuis le 19/10/2026');
    await page.getByRole('button', { name: 'Mois suivant' }).click();
    await expect(dialog.locator('[data-date="2026-12-07"]')).not.toHaveAttribute('aria-disabled', 'true');
    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });

  test('lot : collage, résumé, lignes valides créées, rejets expliqués, report sur le mois suivant', async ({ page, context }) => {
    await setProfile(context, 'rs');
    const w = watch(page);
    await page.goto('/fr/needs/batch');
    const lines = [
      ROW({ start: '2027-07-05', end: '2027-07-11' }), // valide
      '', // ligne vide au milieu du collage
      ROW({ start: '2026-11-09', end: '2026-11-15' }), // mois clos (E1)
      ROW({ start: '2027-07-12', end: '2027-07-18', days: 'LUN;XYZ' }), // jour inconnu collé
    ].join('\n');
    await paste(page, lines);
    await expect(page.getByTestId('paste-info')).toContainText('3 lignes ajoutées');
    await expect(page.getByTestId('paste-info')).toContainText('vide');
    await expect(page.getByTestId('paste-issues')).toContainText('Le jour « XYZ » est inconnu');

    await page.getByRole('button', { name: 'Voir le résumé' }).click();
    const summary = page.getByTestId('batch-summary');
    await expect(summary).toContainText('Lignes saisies');
    await page.getByRole('button', { name: /Soumettre 3 lignes complètes/ }).click();

    const result = page.getByTestId('batch-result');
    await expect(result).toBeVisible();
    await expect(page.locator('[data-testid=batch-row][data-status=saved]')).toHaveCount(1);
    await expect(page.locator('[data-testid=batch-row][data-status=rejected]')).toHaveCount(2);
    const blocked = page.locator('[data-testid=batch-row][data-status=rejected]').filter({ hasText: 'novembre 2026' });
    await expect(blocked.locator('[data-rule=E1]')).toBeVisible();
    await expect(blocked.locator('[data-rule=E1]')).toContainText('close depuis le 19/10/2026');

    // Filtre de résultat dans l'adresse : retour arrière et lien profond.
    await page.getByRole('button', { name: 'Rejetées' }).click();
    await expect(page).toHaveURL(/filter=rejected/);
    await expect(page.getByTestId('batch-row')).toHaveCount(2);
    await page.goBack();
    await expect(page).not.toHaveURL(/filter=/);
    await expect(page.getByTestId('batch-row')).toHaveCount(3);

    // Report de la ligne bloquée sur décembre 2026 : créée, marquée reportée.
    await blocked.getByRole('button', { name: /Reporter sur décembre 2026/ }).click();
    await expect(page.locator('[data-testid=batch-row][data-status=saved]')).toHaveCount(2);
    await page.goto('/fr/needs?filter=deferred');
    await expect(page.getByRole('row').filter({ hasText: 'Reportée de novembre 2026 vers décembre 2026' })).toHaveCount(1);
    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });

  test('brouillon automatique : reprise après rechargement', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/batch');
    await page.locator('#b0-slot').fill('09:00-13:00');
    await expect(page.getByTestId('draft-state')).toContainText('Brouillon enregistré');
    await page.reload();
    await expect(page.locator('#b0-slot')).toHaveValue('09:00-13:00');
    await expect(page.getByTestId('draft-state')).toContainText('Brouillon enregistré');
  });

  test('avertissement avant de quitter une saisie non enregistrée', async ({ page, context }) => {
    await setProfile(context, 'rs');
    await page.goto('/fr/needs/batch');
    const messages: string[] = [];
    page.on('dialog', async (d) => {
      messages.push(d.message());
      await d.dismiss();
    });
    await page.locator('#b1-slot').fill('10:00-12:00');
    await page.getByRole('navigation', { name: "Fil d'Ariane" }).getByRole('link', { name: 'Besoins' }).click();
    await expect.poll(() => messages.length).toBeGreaterThan(0);
    expect(messages[0]).toContain('pas encore enregistrées');
    await expect(page).toHaveURL(/\/needs\/batch/);
  });

  test('alertes : J-5 pour les changements de novembre, aucune alerte agence côté cliente, file de réouvertures côté agence', async ({ page, context }) => {
    for (const profile of ['direction_client', 'dr_client', 'cvr_client', 'rs']) {
      await setProfile(context, profile);
      await page.goto('/fr/alerts');
      const list = page.getByTestId('deadline-alerts');
      await expect(list).toContainText('J-5');
      await expect(list.locator('[data-audience=agency]')).toHaveCount(0);
      await expect(page.getByText('Agence uniquement')).toHaveCount(0);
    }
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('deadline-alerts').locator('[data-audience=agency]')).not.toHaveCount(0);
    await expect(page.getByTestId('deadline-alerts')).toContainText('demande de réouverture');
  });

  test('anglais : saisie en lot, blocage et textes traduits', async ({ page, context }) => {
    await setProfile(context, 'rs');
    const w = watch(page);
    await page.goto('/en/needs/batch');
    // Brouillon repris des parcours précédents : on repart d'un lot vide.
    await page.getByRole('button', { name: 'Clear the batch' }).click();
    await expect(page.getByTestId('batch-row')).toHaveCount(3);
    await paste(page, ROW({ start: '2026-11-16', end: '2026-11-22', days: 'MON;TUE' }));
    await page.getByRole('button', { name: 'See the summary' }).click();
    await page.getByRole('button', { name: /Submit 1 complete line/ }).click();
    const row = page.locator('[data-testid=batch-row][data-status=rejected]');
    await expect(row.locator('[data-rule=E1]')).toContainText('November 2026');
    await expect(row.getByRole('button', { name: /Defer to December 2026/ })).toBeVisible();
    await page.goto('/en/needs');
    await expect(page.getByTestId('delay-summary')).toContainText('Entries to chase');
    expect(w.external).toEqual([]);
    expect(w.consoleErrors).toEqual([]);
  });

  test('CVR : demande de réouverture, seule l\'agence administration décide, puis le RS peut de nouveau saisir', async ({ page, context }) => {
    await setProfile(context, 'cvr_client');
    await page.goto('/fr/needs');
    await expect(page.getByTestId('reopen-request')).toBeVisible();
    // Demande identique à celle déjà en attente : refusée.
    await page.selectOption('#reopen-target', 'month:2026-11');
    await page.fill('#reopen-motive', 'Besoin tardif');
    await page.locator('#reopen-until').click();
    await pickDay(page, page.getByRole('dialog'), '2026-11-06');
    await page.getByRole('button', { name: 'Envoyer la demande' }).click();
    await expect(page.getByTestId('reopen-result')).toContainText('déjà en attente');
    // Aucune action de décision côté CVR.
    await expect(page.getByRole('button', { name: 'Rouvrir', exact: true })).toHaveCount(0);
    expect((await page.goto('/fr/settings/deadlines'))?.status()).toBe(404);

    await setProfile(context, 'agency_operator');
    expect((await page.goto('/fr/settings/deadlines'))?.status()).toBe(404);

    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/deadlines');
    const card = page.getByTestId('reopen-request-card').first();
    await expect(card).toContainText('Saisie de novembre 2026');
    await card.locator('textarea').fill('Besoin tardif accepté');
    await card.getByRole('button', { name: 'Rouvrir', exact: true }).click();
    // La demande quitte la file et la trace se met à jour.
    await expect(page.getByTestId('reopen-trace')).toContainText('Besoin tardif accepté');
    await page.reload();
    await expect(page.getByTestId('reopen-trace')).toContainText('Besoin tardif accepté');
    await expect(page.getByTestId('reopen-trace')).toContainText('06/11/2026');

    await setProfile(context, 'rs');
    await page.goto('/fr/needs/new');
    await expect(page.getByTestId('deadline-reopened')).toContainText('06/11/2026');
    await page.locator('#f-range-0').click();
    await page.getByRole('button', { name: 'Mois suivant' }).click();
    await expect(page.locator('[data-date="2026-11-09"]')).not.toHaveAttribute('aria-disabled', 'true');
  });

  test('agence administration : paramètre de dispositif modifié, historique tracé, profil prestataire en lecture', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/dispositifs?dispositif=second_placement');
    const row = page.locator('tr[data-param=min_minutes]');
    await expect(row).toContainText('45 minutes');
    await row.getByRole('button', { name: /Modifier/ }).click();
    await page.fill('#param-second_placement-min_minutes-n', '30');
    await row.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(row).toContainText('30 minutes');
    await page.goto('/fr/settings/dispositifs?history=second_placement');
    const hist = page.getByTestId('params-history');
    await expect(hist).toContainText('45 minutes');
    await expect(hist).toContainText('30 minutes');
    await expect(hist).toContainText('Agence (administrateur)');

    await setProfile(context, 'provider_admin');
    await page.goto('/fr/settings/dispositifs?dispositif=second_placement');
    await expect(page.getByRole('button', { name: /Modifier/ })).toHaveCount(0);
    await expect(page.getByText('modification est réservée à l\'agence administration')).toBeVisible();
  });

  test('agence administration : date fixe dans le calendrier (jours non ouvrés désactivés), alerte J-2 ensuite', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/deadlines');
    await page.selectOption('#entry-month', '2026-11');
    await page.selectOption('#entry-type', 'change_request');
    await page.selectOption('#entry-mode', 'fixed');
    await page.locator('#entry-fixed').click();
    const dialog = page.getByRole('dialog');
    const sat = dialog.locator('[data-date="2026-10-24"]');
    await sat.focus();
    await expect(sat).toHaveAttribute('aria-disabled', 'true');
    await expect(dialog.getByTestId('calendar-reason')).toContainText('Jour non ouvré');
    await pickDay(page, dialog, '2026-10-27');
    await page.getByRole('button', { name: "Enregistrer l'échéance" }).click();
    await expect(page.getByTestId('entry-result')).toContainText('Enregistré');
    await page.reload();
    await expect(page.getByTestId('deadline-table')).toContainText('27/10/2026');

    await setProfile(context, 'rs');
    await page.goto('/fr/alerts');
    await expect(page.getByTestId('deadline-alerts')).toContainText('J-2');
  });
});

test.describe('navigation web du lot (règle commune 14, D151)', () => {
  test('lien profond, retour arrière et rechargement sur la liste des besoins', async ({ page, context }) => {
    await setProfile(context, 'agency_operator');
    await page.goto('/fr/needs?filter=draft&month=2026-12');
    const tab = (name: string) => page.getByRole('link', { name, exact: true });
    await expect(tab('Brouillons')).toHaveAttribute('aria-current', 'true');
    await expect(tab('décembre 2026')).toHaveAttribute('aria-current', 'true');
    await tab('Soumis').click();
    await expect(page).toHaveURL(/filter=submitted/);
    await expect(tab('Soumis')).toHaveAttribute('aria-current', 'true');
    await page.goBack();
    await expect(page).toHaveURL(/filter=draft/);
    await expect(tab('Brouillons')).toHaveAttribute('aria-current', 'true');
    await page.reload();
    await expect(tab('Brouillons')).toHaveAttribute('aria-current', 'true');
    await expect(tab('décembre 2026')).toHaveAttribute('aria-current', 'true');
    // Valeur inconnue dans l'adresse : repli sur la valeur par défaut, aucune erreur.
    await page.goto('/fr/needs?filter=zzz&month=1999-01');
    await expect(tab('Tous')).toHaveAttribute('aria-current', 'true');
  });

  test('lien profond et retour arrière sur les paramètres et le calendrier', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    await page.goto('/fr/settings/dispositifs?dispositif=second_placement');
    await expect(page.getByTestId('params-detail')).toBeVisible();
    await page.getByRole('link', { name: 'Tous', exact: true }).first().click();
    await expect(page.getByTestId('params-compare')).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId('params-detail')).toBeVisible();
    await page.goto('/fr/settings/deadlines?dispositif=second_placement&months=3');
    await expect(page.getByRole('link', { name: '3 mois' })).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('deadline-table').locator('tbody tr')).toHaveCount(6);
    await page.reload();
    await expect(page.getByTestId('deadline-table').locator('tbody tr')).toHaveCount(6);
    await page.getByRole('link', { name: '8 mois' }).click();
    await expect(page.getByTestId('deadline-table').locator('tbody tr')).toHaveCount(16);
    await page.goBack();
    await expect(page.getByTestId('deadline-table').locator('tbody tr')).toHaveCount(6);
  });

  test('fil d\'Ariane, lien d\'évitement et clavier sur les écrans du lot', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    for (const url of ['/fr/needs', '/fr/needs/batch', '/fr/settings', '/fr/settings/deadlines', '/fr/settings/dispositifs']) {
      await page.goto(url);
      const crumbs = page.getByRole('navigation', { name: "Fil d'Ariane" });
      await expect(crumbs).toBeVisible();
      await expect(crumbs.locator('[aria-current=page]')).toHaveCount(1);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Aller au contenu principal' })).toBeFocused();
    }
  });

  test('mobile 390 px : aucun débordement horizontal sur les écrans du lot', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await setProfile(context, 'agency_admin');
    for (const url of ['/fr/needs', '/fr/needs/batch', '/fr/settings/deadlines', '/fr/settings/dispositifs', '/fr/alerts']) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, url).toBeLessThanOrEqual(0);
    }
  });

  test('seuils de performance H3 mesurés : premier affichage utile (hypothèse, non décidée)', async ({ page, context }) => {
    await setProfile(context, 'agency_admin');
    const out: Record<string, { ttfb: number; domContentLoaded: number; load: number; lcp: number | null }> = {};
    for (const url of ['/fr/needs', '/fr/needs/batch', '/fr/settings/deadlines', '/fr/settings/dispositifs', '/fr/alerts']) {
      await page.goto(url, { waitUntil: 'load' });
      out[url] = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            let lcp: number | null = null;
            new PerformanceObserver((l) => {
              const e = l.getEntries().at(-1);
              if (e) lcp = e.startTime;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            setTimeout(() => resolve({ ttfb: Math.round(nav.responseStart), domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), lcp: lcp === null ? null : Math.round(lcp) }), 300);
          }),
      );
    }
    writeFileSync('test-results/h3-a2b.json', JSON.stringify(out, null, 2));
    for (const [url, m] of Object.entries(out)) expect.soft(m.lcp ?? m.domContentLoaded, `H3 ${url}`).toBeLessThan(2000);
  });
});
