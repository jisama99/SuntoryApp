/**
 * Tests e2e — Lot A1f : authentification (D188) et gestion des comptes (D189).
 * Profil de démo : AgAdmin01 (agency_admin), mot de passe Demo_Agence_2026.
 * Tests de non-auto-submit (D188) : la soumission ne part qu'au clic explicite.
 */
import { test, expect } from '@playwright/test';
import { setSession, watch } from './helpers';

const BASE = 'http://localhost:3100';
const LOCALE = 'fr';
const START = `${BASE}/${LOCALE}/start`;

// ---------------------------------------------------------------------------
// Écran de connexion
// ---------------------------------------------------------------------------

test('redirect vers /start si pas de session', async ({ page }) => {
  const { external } = watch(page);
  await page.goto(`${BASE}/${LOCALE}`);
  await expect(page).toHaveURL(/\/start/);
  expect(external, 'aucune requête externe').toHaveLength(0);
});

test('redirect préserve le chemin (?next=)', async ({ page }) => {
  await page.goto(`${BASE}/${LOCALE}/needs`);
  const url = new URL(page.url());
  expect(url.searchParams.get('next')).toContain('/needs');
});

test('aucune soumission avant clic explicite (D188)', async ({ page }) => {
  const { external } = watch(page);
  const requests: string[] = [];
  page.on('request', (r) => { if (r.url().includes('loginAction') || r.method() === 'POST') requests.push(r.url()); });

  await page.goto(START);
  // Remplir les champs programmatiquement (simule l'autofill)
  await page.fill('[name="username"]', 'AgAdmin01');
  await page.fill('[name="password"]', 'Demo_Agence_2026');
  // Attendre 300 ms : aucune soumission automatique
  await page.waitForTimeout(300);
  expect(requests, 'aucune soumission automatique après remplissage').toHaveLength(0);
  expect(external, 'aucune requête externe').toHaveLength(0);
});

test('connexion réussie redirige vers accueil', async ({ page }) => {
  await page.goto(START);
  await page.fill('[name="username"]', 'AgAdmin01');
  await page.fill('[name="password"]', 'Demo_Agence_2026');
  await page.getByRole('button', { name: /Se connecter|Sign in/ }).click();
  await expect(page).not.toHaveURL(/\/start/);
});

test('mauvais mot de passe affiche erreur', async ({ page }) => {
  await page.goto(START);
  await page.fill('[name="username"]', 'AgAdmin01');
  await page.fill('[name="password"]', 'mauvais');
  await page.getByRole('button', { name: /Se connecter|Sign in/ }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('connexion mobile (390 px) — bouton visible et cliquable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(START);
  await page.fill('[name="username"]', 'AgAdmin01');
  await page.fill('[name="password"]', 'Demo_Agence_2026');
  const btn = page.getByRole('button', { name: /Se connecter|Sign in/ });
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page).not.toHaveURL(/\/start/);
});

// ---------------------------------------------------------------------------
// Session et déconnexion
// ---------------------------------------------------------------------------

test('déconnexion redirige vers /start', async ({ context, page }) => {
  await setSession(context, 'AgAdmin01');
  await page.goto(`${BASE}/${LOCALE}`);
  // Ouvrir le menu utilisateur
  const badge = page.locator('details').first();
  await badge.click();
  await page.getByRole('button', { name: /Se déconnecter|Sign out/ }).click();
  await expect(page).toHaveURL(/\/start/);
});

// ---------------------------------------------------------------------------
// Gestion des comptes
// ---------------------------------------------------------------------------

test('agency_admin voit la page admin/accounts', async ({ context, page }) => {
  await setSession(context, 'AgAdmin01');
  await page.goto(`${BASE}/${LOCALE}/admin/accounts`);
  await expect(page.getByRole('heading', { name: /Gestion des comptes|Account management/ })).toBeVisible();
});

test('la liste des comptes est visible (agency_admin)', async ({ context, page }) => {
  await setSession(context, 'AgAdmin01');
  await page.goto(`${BASE}/${LOCALE}/admin/accounts`);
  // Au moins un compte AgAdmin01 dans le tableau
  await expect(page.getByText('AgAdmin01')).toBeVisible();
});
