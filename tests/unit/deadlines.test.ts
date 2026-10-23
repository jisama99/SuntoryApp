import { describe, expect, it } from 'vitest';
import {
  deadlineStatus, dispositifDeadline, gate, globalDeadline, listDeadlines, monthWeeks, penultimateWeek, presetDate, resolveDeadline,
} from '@/domain/deadlines';
import {
  addMonths, isWorkingDay, monthEnd, monthOf, previousWorkingDay, workingDaysBefore, workingDaysBetween,
} from '@/domain/working-days';
import type { CalendarRules } from '@/domain/working-days';
import { params, paramsMap, reopening, SECOND, settings } from './a2b-util';

const CAL: CalendarRules = { nonWorkingWeekdays: [6, 7], excludeHolidays: true };

describe('jours ouvrés (échéances, D80 et D82)', () => {
  it('samedi, dimanche et fériés ne sont pas ouvrés', () => {
    expect(isWorkingDay('2026-10-23', CAL)).toBe(true); // vendredi
    expect(isWorkingDay('2026-10-24', CAL)).toBe(false); // samedi
    expect(isWorkingDay('2026-11-01', CAL)).toBe(false); // dimanche et Toussaint
    expect(isWorkingDay('2026-11-11', CAL)).toBe(false); // mercredi, Armistice
    expect(isWorkingDay('2026-11-11', { ...CAL, excludeHolidays: false })).toBe(true);
  });

  it('recule à la veille ouvrée', () => {
    expect(previousWorkingDay('2026-11-21', CAL)).toBe('2026-11-20'); // samedi vers vendredi
    expect(previousWorkingDay('2026-11-11', CAL)).toBe('2026-11-10'); // férié vers mardi
    expect(previousWorkingDay('2026-11-20', CAL)).toBe('2026-11-20');
  });

  it('compte les jours ouvrés avant une date et entre deux dates', () => {
    expect(workingDaysBefore('2026-11-01', 5, CAL)).toBe('2026-10-26');
    expect(workingDaysBetween('2026-10-23', '2026-10-30', CAL)).toBe(5);
    expect(workingDaysBetween('2026-10-23', '2026-10-23', CAL)).toBe(0);
    expect(workingDaysBetween('2026-10-30', '2026-10-23', CAL)).toBe(-5);
  });

  it('mois : ajout, fin de mois, bascule d\'année', () => {
    expect(addMonths('2026-11', 1)).toBe('2026-12');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2027-01', -2)).toBe('2026-11');
    expect(monthEnd('2026-11')).toBe('2026-11-30');
    expect(monthEnd('2028-02')).toBe('2028-02-29');
    expect(monthOf('2026-12-28')).toBe('2026-12');
  });
});

describe('presets (docs/COMPLEMENTS_CADRAGE/24 §3, novembre et décembre 2026)', () => {
  const s = settings();
  const cases: Array<[string, 'large' | 'standard' | 'short', string, string, string]> = [
    // preset, mois, saisie, changements
    ['Large novembre', 'large', '2026-11', '2026-10-16', '2026-10-16'],
    ['Large décembre', 'large', '2026-12', '2026-11-16', '2026-11-16'],
    ['Standard novembre', 'standard', '2026-11', '2026-10-19', '2026-10-26'],
    ['Standard décembre', 'standard', '2026-12', '2026-11-17', '2026-11-24'],
    ['Court novembre', 'short', '2026-11', '2026-10-28', '2026-10-28'],
    ['Court décembre', 'short', '2026-12', '2026-11-26', '2026-11-26'],
  ];
  for (const [name, preset, month, entry, change] of cases) {
    it(name, () => {
      expect(presetDate(month, 'needs_entry', preset, s)).toBe(entry);
      expect(presetDate(month, 'change_request', preset, s)).toBe(change);
    });
  }

  it('date fixe pour un mois : l\'illustration du 30/10 pour les changements de novembre', () => {
    const fixed = settings({
      entries: [{ month: '2026-11', type: 'change_request', preset: null, fixed_date: '2026-10-30', author_profile: 'agency_admin', effective_from: '2026-10-23', is_demo: true }],
    });
    expect(globalDeadline('2026-11', 'change_request', fixed)).toEqual({ date: '2026-10-30', opensOn: null, source: 'fixed', preset: null });
    // La saisie des besoins reste au preset par défaut.
    expect(globalDeadline('2026-11', 'needs_entry', fixed).date).toBe('2026-10-19');
  });

  it('un preset choisi pour un mois remplace le preset par défaut de ce mois seulement', () => {
    const one = settings({
      entries: [{ month: '2026-12', type: 'needs_entry', preset: 'short', fixed_date: null, author_profile: 'agency_admin', effective_from: '2026-10-23', is_demo: true }],
    });
    expect(globalDeadline('2026-12', 'needs_entry', one).date).toBe('2026-11-26');
    expect(globalDeadline('2027-01', 'needs_entry', one).source).toBe('preset');
  });

  it('aucune valeur de preset en dur : changer les réglages change la date', () => {
    const custom = settings({ presets: { ...settings().presets, standard: { needs_entry: { unit: 'working', days: 1 }, change_request: { unit: 'calendar', days: 1 } } } });
    expect(presetDate('2026-12', 'needs_entry', 'standard', custom)).toBe('2026-11-30');
    expect(presetDate('2026-12', 'change_request', 'standard', custom)).toBe('2026-11-30');
  });
});

describe('semaines d\'un mois et lecture de « avant-dernière semaine » (Q-N9-1)', () => {
  it('novembre 2026 : S47 (16 au 22/11) si la dernière semaine est la dernière entièrement dans le mois', () => {
    const weeks = monthWeeks('2026-11', 'last_full_week');
    expect(weeks.at(-1)).toEqual({ start: '2026-11-23', end: '2026-11-29' });
    expect(penultimateWeek('2026-11', 'last_full_week')).toEqual({ start: '2026-11-16', end: '2026-11-22' });
  });
  it('novembre 2026 : S48 (23 au 29/11) si la dernière semaine est celle du dernier jour (S49)', () => {
    const weeks = monthWeeks('2026-11', 'week_of_last_day');
    expect(weeks.at(-1)).toEqual({ start: '2026-11-30', end: '2026-12-06' });
    expect(penultimateWeek('2026-11', 'week_of_last_day')).toEqual({ start: '2026-11-23', end: '2026-11-29' });
  });
  it('octobre 2026 : S42 selon la lecture A', () => {
    expect(penultimateWeek('2026-10', 'last_full_week')).toEqual({ start: '2026-10-12', end: '2026-10-18' });
  });
});

describe('priorité du paramètre de dispositif sur le calendrier global (D82, doc 28 §2.3)', () => {
  const s = settings();
  const second = params('second_placement', SECOND);
  const map = paramsMap(params('permanent'), second);

  it('exemple H2 : décembre 2026, 10 jours calendaires, le 21/11 (samedi) recule au vendredi 20/11', () => {
    const d = dispositifDeadline('2026-12', 'change_request', second, s)!;
    expect(d.date).toBe('2026-11-20');
    expect(d.source).toBe('dispositif');
  });

  it('un dispositif sans règle retombe sur le calendrier global', () => {
    expect(resolveDeadline('2026-12', 'change_request', 'permanent', map, s)).toEqual(globalDeadline('2026-12', 'change_request', s));
    expect(resolveDeadline('2026-12', 'change_request', null, map, s).source).toBe('preset');
  });

  it('le paramètre du dispositif l\'emporte sur le preset, y compris sur une date fixe du mois', () => {
    const fixed = settings({
      entries: [{ month: '2026-12', type: 'change_request', preset: null, fixed_date: '2026-11-25', author_profile: 'agency_admin', effective_from: '2026-10-23', is_demo: true }],
    });
    expect(resolveDeadline('2026-12', 'change_request', null, map, fixed).date).toBe('2026-11-25');
    expect(resolveDeadline('2026-12', 'change_request', 'second_placement', map, fixed).date).toBe('2026-11-20');
  });

  it('jours ouvrés plutôt que calendaires (Q-N9-2) : le paramètre pilote le calcul', () => {
    const working = params('second_placement', { ...SECOND, change_lead_unit: 'working' });
    // 10 jours ouvrés avant le 01/12/2026 : 17/11
    expect(dispositifDeadline('2026-12', 'change_request', working, s)!.date).toBe('2026-11-17');
  });

  it('fenêtre de saisie : avant-dernière semaine de novembre, clôture le dernier jour ouvré de la semaine', () => {
    const d = dispositifDeadline('2026-12', 'needs_entry', second, s)!;
    expect(d).toEqual({ date: '2026-11-20', opensOn: '2026-11-16', source: 'dispositif', preset: null });
    const b = dispositifDeadline('2026-12', 'needs_entry', params('second_placement', { entry_window: { reading: 'week_of_last_day' } }), s)!;
    expect(b).toEqual({ date: '2026-11-27', opensOn: '2026-11-23', source: 'dispositif', preset: null });
  });

  it('les jours fériés comptent dans le recul à la veille ouvrée', () => {
    // 11 jours calendaires avant le 01/12 : 20/11, aucun recul ; avec 20 jours : 11/11 férié, recule au 10/11
    const p = params('second_placement', { change_lead_days: 20 });
    expect(dispositifDeadline('2026-12', 'change_request', p, s)!.date).toBe('2026-11-10');
  });
});

describe('statut d\'une échéance et cascade (D79, D82)', () => {
  const s = settings();
  const d = { date: '2026-10-30', opensOn: null, source: 'preset' as const, preset: 'standard' as const };
  it('J-5, J-2 et jour J, comptés en jours ouvrés', () => {
    expect(deadlineStatus(d, '2026-10-23', s)).toMatchObject({ state: 'upcoming', left: 5, threshold: 5 });
    expect(deadlineStatus(d, '2026-10-26', s)).toMatchObject({ left: 4, threshold: 5 });
    expect(deadlineStatus(d, '2026-10-27', s)).toMatchObject({ left: 3, threshold: 5 });
    expect(deadlineStatus(d, '2026-10-28', s)).toMatchObject({ left: 2, threshold: 2 });
    expect(deadlineStatus(d, '2026-10-29', s)).toMatchObject({ left: 1, threshold: 2 });
    expect(deadlineStatus(d, '2026-10-30', s)).toMatchObject({ left: 0, threshold: 0 });
  });
  it('aucun rappel avant le premier seuil, échéance close ensuite', () => {
    expect(deadlineStatus(d, '2026-10-22', s)).toMatchObject({ state: 'upcoming', left: 6, threshold: null });
    expect(deadlineStatus(d, '2026-10-31', s)).toMatchObject({ state: 'closed', threshold: null });
  });
  it('la cascade est réglable', () => {
    const custom = settings({ cascade: [10, 1] });
    expect(deadlineStatus(d, '2026-10-23', custom).threshold).toBe(10);
    expect(deadlineStatus(d, '2026-10-29', custom).threshold).toBe(1);
  });
  it('la fenêtre d\'un dispositif est signalée comme non ouverte avant son début, sans bloquer', () => {
    const w = { date: '2026-11-20', opensOn: '2026-11-16', source: 'dispositif' as const, preset: null };
    expect(deadlineStatus(w, '2026-10-23', s).windowOpen).toBe(false);
    expect(deadlineStatus(w, '2026-11-16', s).windowOpen).toBe(true);
  });
});

describe('blocage après échéance et réouverture (D78, D82)', () => {
  const s = settings();
  const base = { dispositif: 'permanent' as const, settings: s, params: paramsMap(params('permanent')), reopenings: [] };
  it('ouvert jusqu\'à la date limite incluse, fermé le lendemain', () => {
    expect(gate({ ...base, month: '2026-12', type: 'needs_entry', today: '2026-11-17' }).open).toBe(true);
    expect(gate({ ...base, month: '2026-12', type: 'needs_entry', today: '2026-11-18' }).open).toBe(false);
  });
  it('novembre est clos pour la saisie au 23/10/2026 (échéance 19/10)', () => {
    const g = gate({ ...base, month: '2026-11', type: 'needs_entry', today: '2026-10-23' });
    expect(g.open).toBe(false);
    expect(g.deadline.date).toBe('2026-10-19');
  });
  it('une réouverture active rétablit l\'écriture, puis expire à sa date de fin', () => {
    const r = [reopening({ expires_on: '2026-11-06' })];
    expect(gate({ ...base, reopenings: r, month: '2026-11', type: 'needs_entry', today: '2026-10-23' })).toMatchObject({ open: true, reopened: true });
    expect(gate({ ...base, reopenings: r, month: '2026-11', type: 'needs_entry', today: '2026-11-06' }).open).toBe(true);
    expect(gate({ ...base, reopenings: r, month: '2026-11', type: 'needs_entry', today: '2026-11-07' }).open).toBe(false);
  });
  it('une réouverture d\'un autre mois ne rouvre pas celui-ci', () => {
    const r = [reopening({ target: '2026-10' })];
    expect(gate({ ...base, reopenings: r, month: '2026-11', type: 'needs_entry', today: '2026-10-23' }).open).toBe(false);
  });
});

describe('liste des échéances', () => {
  it('cinq mois cibles, global puis dispositif, triées par date', () => {
    const rows = listDeadlines('2026-10-23', settings(), paramsMap(params('permanent'), params('second_placement', SECOND)), 5);
    const dates = rows.map((r) => r.deadline.date);
    expect([...dates].sort()).toEqual(dates);
    expect(rows.some((r) => r.dispositif === 'second_placement' && r.type === 'change_request')).toBe(true);
    expect(rows.filter((r) => r.dispositif === null)).toHaveLength(10);
    expect(rows.every((r) => r.dispositif !== 'permanent')).toBe(true);
  });
});
