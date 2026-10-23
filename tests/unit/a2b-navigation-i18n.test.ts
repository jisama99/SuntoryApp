import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import { PARAM_KEYS } from '@/data/schemas';
import { DEADLINE_TYPES, DISPOSITIFS, ENTRY_PROFILES, PRESET_IDS } from '@/domain/types';
import { HOLIDAY_KEYS } from '@/domain/holidays';
import { flatten, read, ROOT } from './util';

const F = flatten(fr);
const E = flatten(en);
const both = (key: string) => {
  expect(F[key], `fr ${key}`).toBeTruthy();
  expect(E[key], `en ${key}`).toBeTruthy();
};
const APP = path.join(ROOT, 'src/app/[locale]/(app)');

describe('règle commune 14 (D151) : navigation web, états de route, fil d\'Ariane, URL', () => {
  it('chaque route du lot porte un état de chargement et un état d\'erreur', () => {
    for (const seg of ['needs', 'settings', '[section]']) {
      expect(existsSync(path.join(APP, seg, 'error.tsx')), `error ${seg}`).toBe(true);
      expect(read(path.join(APP, seg, 'error.tsx')).startsWith("'use client'"), `error ${seg} client`).toBe(true);
    }
    for (const seg of ['needs/(list)', 'needs/(write)/new', 'needs/(write)/batch', 'needs/(write)/[id]/edit', 'needs/(write)/[id]/duplicate', 'settings', '[section]']) {
      expect(existsSync(path.join(APP, seg, 'loading.tsx')), `loading ${seg}`).toBe(true);
    }
  });

  it('le contrôle d\'accès est dans un layout au-dessus des états de chargement : une entrée interdite répond 404', () => {
    for (const layout of ['needs/layout.tsx', 'needs/(write)/layout.tsx', 'needs/(write)/[id]/layout.tsx', 'settings/layout.tsx', '[section]/layout.tsx']) {
      expect(read(path.join(APP, layout)), layout).toContain('notFound()');
    }
    // Aucun loading.tsx ne coiffe un segment dont le layout décide de l'accès : ils sont au même niveau ou en dessous.
    expect(existsSync(path.join(APP, 'needs/loading.tsx'))).toBe(false);
    expect(existsSync(path.join(APP, 'needs/(write)/loading.tsx'))).toBe(false);
  });

  it('chaque page du lot affiche le fil d\'Ariane', () => {
    for (const page of ['needs/(list)/page.tsx', 'needs/(write)/new/page.tsx', 'needs/(write)/batch/page.tsx', 'needs/(write)/[id]/edit/page.tsx', 'needs/(write)/[id]/duplicate/page.tsx', 'settings/page.tsx', 'settings/deadlines/page.tsx', 'settings/dispositifs/page.tsx', '[section]/page.tsx']) {
      expect(read(path.join(APP, page)), page).toContain('<Breadcrumb');
    }
  });

  it('les filtres du lot et du calendrier sont des liens portés par l\'adresse', () => {
    for (const page of ['needs/(list)/page.tsx', 'settings/deadlines/page.tsx', 'settings/dispositifs/page.tsx']) {
      const src = read(path.join(APP, page));
      expect(src, page).toContain('searchParams');
      expect(src, page).toContain('FilterTabs');
    }
    expect(read(path.join(ROOT, 'src/components/FilterTabs.tsx'))).toContain('aria-current');
    // Le filtre de résultat du lot passe par l'historique du navigateur : retour arrière et lien profond fonctionnent.
    const batch = read(path.join(ROOT, 'src/components/BatchTable.tsx'));
    expect(batch).toContain('useSearchParams');
    expect(batch).toContain('history.pushState');
  });

  it('aucune perte de saisie sans avertissement : le lot et le formulaire installent l\'avertissement', () => {
    for (const f of ['BatchTable.tsx', 'NeedForm.tsx']) expect(read(path.join(ROOT, 'src/components', f)), f).toContain('useUnsavedWarning');
  });

  it('le lien d\'évitement et le mouvement réduit existent déjà (A1) et restent en place', () => {
    expect(read(path.join(ROOT, 'src/app/[locale]/layout.tsx'))).toContain('href="#main"');
    expect(read(path.join(ROOT, 'src/app/globals.css'))).toContain('prefers-reduced-motion');
  });
});

describe('règle commune 15 (D149) : tout texte du lot passe par le dictionnaire FR et EN', () => {
  it('clés des paramètres, presets, types d\'échéance, rôles, états', () => {
    for (const k of PARAM_KEYS) both(`params.keys.${k}`);
    for (const p of PRESET_IDS) both(`deadline.preset.${p}`);
    for (const t of DEADLINE_TYPES) both(`deadline.type.${t}`);
    for (const r of ENTRY_PROFILES) both(`params.roles.${r}`);
    for (const d of DISPOSITIFS) both(`dispositif.${d}`);
    for (const s of ['toValidate', 'toUpdate', 'partlyBlocking', 'validated']) both(`params.status.${s}`);
    for (const s of ['dispositif', 'preset', 'fixed']) both(`deadline.source.${s}`);
  });

  it('alertes dérivées, explications de collage, motifs de refus de ligne', () => {
    for (const k of ['reminderEntry', 'reminderEntryMissing', 'reminderChange', 'reminderEntryOwn', 'reminderChangeOwn', 'lateSummary', 'closingReport', 'reopenQueue']) both(`alerts.derived.${k}`);
    for (const k of ['unknown_sector', 'unknown_dispositif', 'unknown_campaign', 'unknown_position', 'unknown_priority', 'unknown_hours', 'unknown_day', 'too_long']) both(`batch.issue.${k}`);
    for (const k of ['incomplete', 'paste', 'invalid']) both(`form.refusal.${k}`);
    for (const k of ['forbidden', 'invalid', 'not_closed', 'duplicate', 'not_found']) both(`reopen.refused.${k}`);
    for (const k of ['pending', 'validated', 'discarded']) both(`outbox.status.${k}`);
    for (const k of ['afterDeadline', 'weekend', 'nonWorkingHoliday']) both(`picker.reason.${k}`);
    for (const h of HOLIDAY_KEYS) both(`picker.holiday.${h}`);
  });

  it('chaque clé de valeur de paramètre existe dans les deux langues', () => {
    for (const k of ['undefined', 'minutes', 'notApplicable', 'unpriced', 'amountFictive', 'calendar', 'nextMonth', 'days', 'allRoles', 'weeks', 'global', 'holidays']) both(`params.value.${k}`);
    for (const k of ['last_full_week', 'week_of_last_day']) both(`params.value.window.${k}`);
    for (const k of ['calendar', 'working']) both(`params.value.unit.${k}`);
  });
});
