import { describe, expect, it } from 'vitest';
import { easterSunday, holidayOf } from '@/domain/holidays';
import {
  addDays, daysBetween, formatWeek, isoWeekOf, isValidIsoDate, normalizeWeekInput, parseDateInput, spreadsheetWeekNumber,
  storedWeekOf, weekdayOf, weekEnd, weeksBetween, weeksInIsoYear, weekStart,
} from '@/domain/week';

describe('semaine ISO 8601', () => {
  it.each([
    ['2026-01-01', '2026-S01'],
    ['2026-10-23', '2026-S43'],
    ['2026-12-27', '2026-S52'],
    ['2026-12-28', '2026-S53'],
    ['2027-01-01', '2026-S53'],
    ['2027-01-03', '2026-S53'],
    ['2027-01-04', '2027-S01'],
    ['2027-12-31', '2027-S52'],
    ['2024-12-30', '2025-S01'],
    ['2021-01-03', '2020-S53'],
  ])('%s appartient à %s', (date, week) => {
    expect(storedWeekOf(date)).toBe(week);
  });

  it('2026 compte 53 semaines et 2027 en compte 52', () => {
    expect(weeksInIsoYear(2026)).toBe(53);
    expect(weeksInIsoYear(2027)).toBe(52);
    expect(weeksInIsoYear(2020)).toBe(53);
    expect(weeksInIsoYear(2025)).toBe(52);
  });

  it('le lundi 28/12/2026 ouvre S53 et le lundi 04/01/2027 ouvre S01', () => {
    expect(weekdayOf('2026-12-28')).toBe(1);
    expect(weekdayOf('2027-01-04')).toBe(1);
    expect(weekStart({ year: 2026, week: 53 })).toBe('2026-12-28');
    expect(weekStart({ year: 2027, week: 1 })).toBe('2027-01-04');
    expect(weekEnd({ year: 2026, week: 53 })).toBe('2027-01-03');
  });

  it('aller-retour : le lundi de chaque semaine retrouve sa semaine, sur trois années', () => {
    for (let d = '2025-12-29'; d < '2029-01-01'; d = addDays(d, 7)) {
      expect(weekdayOf(d)).toBe(1);
      const w = isoWeekOf(d);
      expect(weekStart(w)).toBe(d);
    }
  });

  it('enchaîne S52, S53 puis S01 sans trou', () => {
    expect(weeksBetween('2026-12-21', '2027-01-10')).toEqual(['2026-S52', '2026-S53', '2027-S01']);
  });

  it('formate et compte les jours', () => {
    expect(formatWeek({ year: 2027, week: 1 })).toBe('2027-S01');
    expect(daysBetween('2026-12-28', '2027-01-04')).toBe(7);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('refuse les dates impossibles', () => {
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
  });
});

describe('W13 : normalisation des saisies de semaine', () => {
  it.each([
    ['S5', 2026, { year: 2026, week: 5 }],
    ['5', 2026, { year: 2026, week: 5 }],
    ['2026-S05', 2026, { year: 2026, week: 5 }],
    ['W05', 2026, { year: 2026, week: 5 }],
    ['2026-W05', 2027, { year: 2026, week: 5 }],
    ['s53', 2026, { year: 2026, week: 53 }],
  ])('« %s » devient une semaine ISO', (raw, fallback, expected) => {
    expect(normalizeWeekInput(raw, fallback).week).toEqual(expected);
  });
  it('un nombre est accepté', () => {
    expect(normalizeWeekInput(7, 2026).week).toEqual({ year: 2026, week: 7 });
  });
  it('un texte quelconque est rejeté, le format stocké est reconnu canonique', () => {
    expect(normalizeWeekInput('bientôt', 2026).week).toBeNull();
    expect(normalizeWeekInput('2026-S05', 2026).canonical).toBe(true);
    expect(normalizeWeekInput('S5', 2026).canonical).toBe(false);
  });
});

describe('W2 : numéro de semaine par défaut des tableurs', () => {
  it('diffère de la semaine ISO autour du 1er janvier', () => {
    expect(spreadsheetWeekNumber('2027-01-04')).toBe(2);
    expect(isoWeekOf('2027-01-04').week).toBe(1);
    expect(spreadsheetWeekNumber('2026-10-23')).not.toBeNaN();
  });
});

describe('W14 et W15 : dates reçues en texte', () => {
  it.each([
    ['2026-11-02', 'iso'],
    ['25/12/2026', 'iso'],
    ['02.11.2026', 'inverted_or_ambiguous'],
    ['03/04/2026', 'inverted_or_ambiguous'],
    ['12/25/2026', 'inverted_or_ambiguous'],
    ['05/05/2026', 'iso'],
    ['123456', 'unrecognised'],
    ['demain', 'unrecognised'],
    ['31/02/2026', 'unrecognised'],
  ])('« %s » est lu comme %s', (raw, kind) => {
    expect(parseDateInput(raw).kind).toBe(kind);
  });
  it('une date jour en tête est convertie en ISO', () => {
    expect(parseDateInput('25/12/2026')).toEqual({ kind: 'iso', date: '2026-12-25' });
  });
});

describe('jours fériés', () => {
  it('Pâques et dérivés', () => {
    expect(easterSunday(2026)).toBe('2026-04-05');
    expect(easterSunday(2027)).toBe('2027-03-28');
    expect(holidayOf('2026-04-06')).toBe('easter_monday');
    expect(holidayOf('2026-05-14')).toBe('ascension');
    expect(holidayOf('2026-05-25')).toBe('whit_monday');
  });
  it('dates fixes et jours ordinaires', () => {
    expect(holidayOf('2026-11-11')).toBe('armistice');
    expect(holidayOf('2026-12-25')).toBe('christmas');
    expect(holidayOf('2027-01-01')).toBe('new_year');
    expect(holidayOf('2026-11-10')).toBeNull();
  });
});
