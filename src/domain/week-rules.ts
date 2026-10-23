import { holidayOf, holidaysOfYear } from './holidays';
import type { RawFinding, RuleConfig } from './rules';
import {
  addDays, daysBetween, formatWeek, isoWeekOf, isValidWeek, normalizeWeekInput, parseDateInput, parseIsoDate,
  parseStoredWeek, spreadsheetWeekNumber, storedWeekOf, weekdayOf, weekEnd, weeksBetween, weeksInIsoYear, weekStart,
} from './week';
import type { IsoDate } from './week';
import type { NeedInput } from '@/data/schemas';

/** Valeurs brutes (import, collage) d'une période : sert aux règles W1, W2, W3, W13, W14 et W15. */
export interface RawPeriod {
  start_date?: string;
  end_date?: string;
  start_week?: string;
  end_week?: string;
}

export type RuleInput = NeedInput & { raw?: Partial<Record<1 | 2, RawPeriod>> };

export interface RuleEnv {
  /** Date du jour de l'horloge de démonstration. */
  today: IsoDate;
  closedWeeks: ReadonlySet<string>;
  campaign: { dispositif: string; window_start: IsoDate; window_end: IsoDate } | null;
  config: RuleConfig;
}

/** Période dont les dates sont déduites des semaines quand seule la semaine est connue. */
export interface ResolvedPeriod {
  period_no: 1 | 2;
  start: IsoDate | null;
  end: IsoDate | null;
  start_week: string | null;
  end_week: string | null;
}

export function resolvePeriod(p: NeedInput['periods'][number]): ResolvedPeriod {
  const sw = p.start_week ? parseStoredWeek(p.start_week) : null;
  const ew = p.end_week ? parseStoredWeek(p.end_week) : null;
  const swOk = sw && isValidWeek(sw) ? sw : null;
  const ewOk = ew && isValidWeek(ew) ? ew : null;
  const start = validDate(p.start_date) ?? (swOk ? weekStart(swOk) : null);
  const end = validDate(p.end_date) ?? (ewOk ? weekEnd(ewOk) : swOk && !p.end_date ? weekEnd(swOk) : null);
  return { period_no: p.period_no, start, end, start_week: p.start_week, end_week: p.end_week };
}

function validDate(value: string | null | undefined): IsoDate | null {
  return value && parseIsoDate(value) ? value : null;
}

export interface RuleContext {
  input: RuleInput;
  periods: ResolvedPeriod[];
  env: RuleEnv;
}

type RuleFn = (c: RuleContext) => RawFinding[];

/** Semaine saisie (brute si disponible, sinon stockée) d'un côté d'une période. */
function weekText(c: RuleContext, p: ResolvedPeriod, side: 'start' | 'end'): string | null {
  const raw = c.input.raw?.[p.period_no];
  const rawValue = side === 'start' ? raw?.start_week : raw?.end_week;
  if (rawValue !== undefined && rawValue !== '') return rawValue;
  return side === 'start' ? p.start_week : p.end_week;
}

function referenceDate(p: ResolvedPeriod, side: 'start' | 'end'): IsoDate | null {
  return side === 'start' ? p.start : p.end;
}

function fallbackYear(c: RuleContext, p: ResolvedPeriod): number {
  const d = p.start ?? c.env.today;
  return Number(d.slice(0, 4));
}

const SIDES = ['start', 'end'] as const;

/** W1 : numéro hors plage (0, 54, 99, ou 53 sur une année qui n'en compte que 52). */
export const w1: RuleFn = (c) =>
  c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const text = weekText(c, p, side);
      if (text === null) return [];
      const n = normalizeWeekInput(text, fallbackYear(c, p)).week;
      if (!n || isValidWeek(n)) return [];
      const date = referenceDate(p, side);
      const f: RawFinding = {
        rule: 'W1', periodNo: p.period_no,
        params: { week: formatWeek(n), max: weeksInIsoYear(n.year) },
      };
      if (date) f.fix = { periodNo: p.period_no, field: side === 'start' ? 'start_week' : 'end_week', value: storedWeekOf(date) };
      return [f];
    }),
  );

/**
 * W2 : numéro issu du calcul par défaut d'un tableur, décalé d'une semaine par rapport à l'ISO. Ne s'applique qu'aux
 * saisies brutes (import, collage) : une semaine choisie au calendrier relève de W3 ou de W5.
 */
export const w2: RuleFn = (c) =>
  c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const rawPeriod = c.input.raw?.[p.period_no];
      const text = side === 'start' ? rawPeriod?.start_week : rawPeriod?.end_week;
      const date = referenceDate(p, side);
      if (text === undefined || text === '' || !date) return [];
      const n = normalizeWeekInput(text, fallbackYear(c, p)).week;
      if (!n) return [];
      const iso = isoWeekOf(date);
      if (n.week === iso.week || n.week !== spreadsheetWeekNumber(date)) return [];
      return [{
        rule: 'W2', periodNo: p.period_no,
        params: { week: formatWeek(n), expected: formatWeek(iso) },
        fix: { periodNo: p.period_no, field: side === 'start' ? 'start_week' : 'end_week', value: formatWeek(iso) },
      }];
    }),
  );

/** W3 : le bon numéro avec l'année civile au lieu de l'année ISO (fin décembre, début janvier). */
export const w3: RuleFn = (c) =>
  c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const text = weekText(c, p, side);
      const date = referenceDate(p, side);
      if (text === null || !date) return [];
      const n = normalizeWeekInput(text, fallbackYear(c, p)).week;
      if (!n) return [];
      const iso = isoWeekOf(date);
      if (n.week !== iso.week || n.year === iso.year) return [];
      return [{
        rule: 'W3', periodNo: p.period_no,
        params: { week: formatWeek(n), expected: formatWeek(iso) },
        fix: { periodNo: p.period_no, field: side === 'start' ? 'start_week' : 'end_week', value: formatWeek(iso) },
      }];
    }),
  );

/** W4 : l'année ISO diffère de l'année civile de la date. */
export const w4: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    const date = p.start ?? p.end;
    if (!date) return [];
    const iso = isoWeekOf(date);
    const calendarYear = Number(date.slice(0, 4));
    if (iso.year === calendarYear) return [];
    return [{ rule: 'W4', periodNo: p.period_no, params: { date, week: formatWeek(iso), year: calendarYear } }];
  });

/** Périodes pour lesquelles W2 ou W3 expliquent déjà un écart de semaine : W5 reste muette. */
function explainedByYearOrSpreadsheet(c: RuleContext): Set<string> {
  const keys = new Set<string>();
  for (const f of [...w2(c), ...w3(c)]) keys.add(`${f.periodNo}:${f.fix?.field}`);
  return keys;
}

/** W5 : la date n'appartient pas à la semaine indiquée. Correction en un clic : la semaine déduite de la date. */
export const w5: RuleFn = (c) => {
  const explained = explainedByYearOrSpreadsheet(c);
  return c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const field = side === 'start' ? 'start_week' : 'end_week';
      const text = weekText(c, p, side);
      const entered = c.input.periods.find((q) => q.period_no === p.period_no);
      const date = validDate(side === 'start' ? entered?.start_date : entered?.end_date);
      if (text === null || !date || explained.has(`${p.period_no}:${field}`)) return [];
      const n = normalizeWeekInput(text, fallbackYear(c, p)).week;
      if (!n || !isValidWeek(n)) return [];
      const expected = isoWeekOf(date);
      if (n.year === expected.year && n.week === expected.week) return [];
      return [{
        rule: 'W5', periodNo: p.period_no,
        params: { week: formatWeek(n), expected: formatWeek(expected), date },
        fix: { periodNo: p.period_no, field, value: formatWeek(expected) },
      }];
    }),
  );
};

/** W6 : fin avant début (dates, ou semaines quand seules les semaines sont connues). */
export const w6: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] =>
    p.start && p.end && p.end < p.start ? [{ rule: 'W6', periodNo: p.period_no, params: { start: p.start, end: p.end } }] : [],
  );

/** W7 : plusieurs semaines couvertes, une seule semaine renseignée. */
export const w7: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start_week || p.end_week || !p.end) return [];
    const sw = parseStoredWeek(p.start_week);
    if (!sw || !isValidWeek(sw)) return [];
    const endWeek = storedWeekOf(p.end);
    return endWeek !== p.start_week ? [{ rule: 'W7', periodNo: p.period_no, params: { week: p.start_week, endWeek } }] : [];
  });

/** W8 : mission de 7 jours au plus à cheval sur deux semaines ; la semaine retenue est celle de la date de début. */
export const w8: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start || !p.end || p.end < p.start) return [];
    if (daysBetween(p.start, p.end) + 1 > 7 || storedWeekOf(p.start) === storedWeekOf(p.end)) return [];
    return [{ rule: 'W8', periodNo: p.period_no, params: { week: storedWeekOf(p.start) } }];
  });

/** W9 : ni date ni semaine. Le besoin reste un brouillon « à compléter », exclu des totaux. */
export const w9: RuleFn = (c) => {
  const some = c.input.periods.some((p) => p.start_date || p.end_date || p.start_week || p.end_week);
  return some ? [] : [{ rule: 'W9', params: {} }];
};

/** W10 : besoin créé pour une semaine déjà écoulée. */
export const w10: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start) return [];
    const week = storedWeekOf(p.start);
    const current = storedWeekOf(c.env.today);
    return week < current ? [{ rule: 'W10', periodNo: p.period_no, params: { week, current } }] : [];
  });

/** W11 : début au-delà de l'horizon maximal [À VALIDER]. */
export const w11: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start) return [];
    const limit = addDays(c.env.today, c.env.config.horizonWeeks * 7);
    return p.start > limit ? [{ rule: 'W11', periodNo: p.period_no, params: { weeks: c.env.config.horizonWeeks } }] : [];
  });

/** W12 : une semaine couverte est clôturée ; réouverture par l'agence seule (A2b). */
export const w12: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start || !p.end || p.end < p.start) return [];
    const hit = weeksBetween(p.start, p.end).find((w) => c.env.closedWeeks.has(w));
    return hit ? [{ rule: 'W12', periodNo: p.period_no, params: { week: hit } }] : [];
  });

/** W13 : saisie « S5 », « 5 », « W05 », nombre… Normalisée vers AAAA-Snn. */
export const w13: RuleFn = (c) =>
  c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const raw = c.input.raw?.[p.period_no];
      const text = side === 'start' ? raw?.start_week : raw?.end_week;
      if (text === undefined || text === '') return [];
      const n = normalizeWeekInput(text, fallbackYear(c, p));
      if (!n.week || n.canonical) return [];
      return [{ rule: 'W13', periodNo: p.period_no, params: { raw: text, week: formatWeek(n.week) } }];
    }),
  );

/** W14 : jour et mois permutés, ambigu quand le jour est inférieur ou égal à 12. */
export const w14: RuleFn = (c) =>
  c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const raw = c.input.raw?.[p.period_no];
      const text = side === 'start' ? raw?.start_date : raw?.end_date;
      if (!text) return [];
      return parseDateInput(text).kind === 'inverted_or_ambiguous' ? [{ rule: 'W14', periodNo: p.period_no, params: { raw: text } }] : [];
    }),
  );

/** W15 : numéro de série de tableur ou texte non reconnu. */
export const w15: RuleFn = (c) =>
  c.periods.flatMap((p) =>
    SIDES.flatMap((side): RawFinding[] => {
      const raw = c.input.raw?.[p.period_no];
      const text = side === 'start' ? raw?.start_date : raw?.end_date;
      if (!text) return [];
      return parseDateInput(text).kind === 'unrecognised' ? [{ rule: 'W15', periodNo: p.period_no, params: { raw: text } }] : [];
    }),
  );

/** W16 : début un jour non ouvré (dimanche ou férié selon la configuration). */
export const w16: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start) return [];
    const holiday = c.env.config.excludeHolidays ? holidayOf(p.start) : null;
    const weekday = weekdayOf(p.start);
    if (holiday) return [{ rule: 'W16', periodNo: p.period_no, params: { date: p.start, holiday } }];
    if (c.env.config.excludedWeekdays.includes(weekday)) return [{ rule: 'W16', periodNo: p.period_no, params: { date: p.start, weekday } }];
    return [];
  });

/** W17 : début en milieu de semaine, semaine partielle avec prorata. */
export const w17: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start) return [];
    const wd = weekdayOf(p.start);
    if (wd === 1) return [];
    return [{ rule: 'W17', periodNo: p.period_no, params: { week: storedWeekOf(p.start), days: 8 - wd, of: 7 } }];
  });

/** W18 : la période 2 commence avant la fin de la période 1 (et pas avant son début : voir W19). */
export const w18: RuleFn = (c) => {
  const p1 = c.periods.find((p) => p.period_no === 1);
  const p2 = c.periods.find((p) => p.period_no === 2);
  if (!p1?.start || !p1.end || !p2?.start) return [];
  return p2.start >= p1.start && p2.start <= p1.end ? [{ rule: 'W18', periodNo: 2, params: { end: p1.end, start: p2.start } }] : [];
};

/** W19 : période 2 antérieure à la période 1. */
export const w19: RuleFn = (c) => {
  const p1 = c.periods.find((p) => p.period_no === 1);
  const p2 = c.periods.find((p) => p.period_no === 2);
  if (!p1?.start || !p2?.start) return [];
  return p2.start < p1.start ? [{ rule: 'W19', periodNo: 2, params: { start: p2.start, other: p1.start } }] : [];
};

/**
 * W20 : mission avant la date du besoin (début antérieur à la date de saisie, dans une semaine qui n'est pas écoulée
 * sinon W10 s'applique) ou hors fenêtre de la campagne (dispositif saisonnier exclu : voir W21).
 */
export const w20: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    if (!p.start) return [];
    const out: RawFinding[] = [];
    if (p.start < c.env.today && storedWeekOf(p.start) >= storedWeekOf(c.env.today)) {
      out.push({ rule: 'W20', periodNo: p.period_no, params: { start: p.start, today: c.env.today } });
    }
    const camp = c.env.campaign;
    if (camp && camp.dispositif !== 'seasonal' && p.end && (p.start < camp.window_start || p.end > camp.window_end)) {
      out.push({ rule: 'W20', periodNo: p.period_no, params: { start: camp.window_start, end: camp.window_end } });
    }
    return out.slice(0, 1);
  });

/** W21 : besoin saisonnier hors de la fenêtre de la campagne. */
export const w21: RuleFn = (c) =>
  c.periods.flatMap((p): RawFinding[] => {
    const camp = c.env.campaign;
    if (!camp || camp.dispositif !== 'seasonal' || !p.start || !p.end) return [];
    return p.start < camp.window_start || p.end > camp.window_end
      ? [{ rule: 'W21', periodNo: p.period_no, params: { start: camp.window_start, end: camp.window_end } }]
      : [];
  });

/** B1 : dates hors des bornes du dictionnaire. */
export const b1: RuleFn = (c) => {
  const { min, max } = c.env.config.dateBounds;
  return c.periods.flatMap((p): RawFinding[] =>
    [p.start, p.end].some((d) => d !== null && (d < min || d > max))
      ? [{ rule: 'B1', periodNo: p.period_no, params: { min, max } }]
      : [],
  );
};

function occurrences(start: IsoDate, end: IsoDate, weekday: number): IsoDate[] {
  const out: IsoDate[] = [];
  const first = addDays(start, (weekday - weekdayOf(start) + 7) % 7);
  for (let d = first; d <= end; d = addDays(d, 7)) out.push(d);
  return out;
}

/** J1 : aucun des jours cochés ne tombe dans la période (avertissement non bloquant). */
export const j1: RuleFn = (c) =>
  c.input.days.length === 0
    ? []
    : c.periods.flatMap((p): RawFinding[] => {
        if (!p.start || !p.end || p.end < p.start) return [];
        const any = c.input.days.some((d) => occurrences(p.start as string, p.end as string, d).length > 0);
        return any ? [] : [{ rule: 'J1', periodNo: p.period_no, params: { start: p.start, end: p.end } }];
      });

/** J2 : un jour coché est férié sur toute la période. */
export const j2: RuleFn = (c) =>
  c.periods.flatMap((p) => {
    if (!p.start || !p.end || p.end < p.start) return [];
    const start = p.start;
    const end = p.end;
    return c.input.days.flatMap((d): RawFinding[] => {
      const occ = occurrences(start, end, d);
      if (occ.length === 0) return [];
      const allHoliday = occ.every((x) => holidaysOfYear(Number(x.slice(0, 4))).has(x));
      return allHoliday ? [{ rule: 'J2', periodNo: p.period_no, params: { weekday: d } }] : [];
    });
  });

/** J3 : un jour coché n'est pas proposé par le dispositif (dimanche désactivé par défaut). */
export const j3: RuleFn = (c) => {
  const bad = c.input.days.filter((d) => !c.env.config.daysAllowed.includes(d));
  return bad.map((d) => ({ rule: 'J3' as const, params: { weekday: d } }));
};

/** Règles évaluables sur le besoin seul (W22 et D1 à D7 comparent à d'autres besoins : voir duplicates.ts). */
export const SINGLE_NEED_RULES: RuleFn[] = [
  w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15, w16, w17, w18, w19, w20, w21, b1, j1, j2, j3,
];

export function evaluateSingleNeedRules(input: RuleInput, env: RuleEnv): RawFinding[] {
  const ctx: RuleContext = { input, periods: input.periods.map(resolvePeriod), env };
  return SINGLE_NEED_RULES.flatMap((rule) => rule(ctx));
}
