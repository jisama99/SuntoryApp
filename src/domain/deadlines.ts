import type { DeadlineSettings, DispositifParams, Reopening } from '@/data/schemas';
import { DEADLINE_TYPES } from './types';
import type { DeadlineType, Dispositif, PresetId } from './types';
import { addDays, weekdayOf } from './week';
import type { IsoDate } from './week';
import { addMonths, monthEnd, monthOf, monthStart, previousWorkingDay, workingDaysBefore, workingDaysBetween } from './working-days';
import type { CalendarRules } from './working-days';

/**
 * Calendrier d'échéances (D78 à D82, docs/COMPLEMENTS_CADRAGE/24 et 28 §2). Modules purs : aucune valeur de preset ni de
 * paramètre n'est écrite ici, tout vient des réglages de l'agence (fixtures au démonstrateur). La date du jour est
 * toujours passée en argument (horloge de démonstration).
 */
export type ParamsMap = Partial<Record<Dispositif, DispositifParams>>;

export type DeadlineSource = 'preset' | 'fixed' | 'dispositif';

export interface ComputedDeadline {
  /** Dernier jour pour déposer. Toujours un jour ouvré (recul à la veille ouvrée). */
  date: IsoDate;
  /** Ouverture de la fenêtre de saisie (paramètre `entry_window`), sinon null. */
  opensOn: IsoDate | null;
  source: DeadlineSource;
  /** Preset appliqué quand la source est un preset. */
  preset: PresetId | null;
}

export const calendarOf = (s: DeadlineSettings): CalendarRules => ({
  nonWorkingWeekdays: s.non_working_weekdays,
  excludeHolidays: s.exclude_holidays,
});

/** Date d'un preset pour un mois cible : N jours calendaires ou ouvrés avant le début du mois, reculée à la veille ouvrée. */
export function presetDate(month: string, type: DeadlineType, preset: PresetId, s: DeadlineSettings): IsoDate {
  const rule = s.presets[preset][type];
  const cal = calendarOf(s);
  const start = monthStart(month);
  return rule.unit === 'working' ? workingDaysBefore(start, rule.days, cal) : previousWorkingDay(addDays(start, -rule.days), cal);
}

/** Échéance du calendrier global : date fixe ou preset choisi pour ce mois, sinon preset par défaut. */
export function globalDeadline(month: string, type: DeadlineType, s: DeadlineSettings): ComputedDeadline {
  const entry = s.entries.find((e) => e.month === month && e.type === type);
  if (entry && entry.preset === null && entry.fixed_date) {
    return { date: entry.fixed_date, opensOn: null, source: 'fixed', preset: null };
  }
  const preset = entry?.preset ?? s.default_preset;
  return { date: presetDate(month, type, preset, s), opensOn: null, source: 'preset', preset };
}

/**
 * Semaines ISO d'un mois, du lundi au dimanche, selon la lecture de « dernière semaine » (Q-N9-1) :
 * `last_full_week` ne garde que les semaines entièrement dans le mois, `week_of_last_day` garde toute semaine qui
 * touche le mois (la dernière est celle du dernier jour).
 */
export function monthWeeks(month: string, reading: 'last_full_week' | 'week_of_last_day'): Array<{ start: IsoDate; end: IsoDate }> {
  const first = monthStart(month);
  const last = monthEnd(month);
  const out: Array<{ start: IsoDate; end: IsoDate }> = [];
  if (reading === 'last_full_week') {
    let monday = addDays(first, (8 - weekdayOf(first)) % 7);
    while (addDays(monday, 6) <= last) {
      out.push({ start: monday, end: addDays(monday, 6) });
      monday = addDays(monday, 7);
    }
    return out;
  }
  let monday = addDays(first, -(weekdayOf(first) - 1));
  while (monday <= last) {
    out.push({ start: monday, end: addDays(monday, 6) });
    monday = addDays(monday, 7);
  }
  return out;
}

/** Avant-dernière semaine d'un mois, ou null si le mois n'en compte pas deux. */
export function penultimateWeek(month: string, reading: 'last_full_week' | 'week_of_last_day') {
  const weeks = monthWeeks(month, reading);
  return weeks.length >= 2 ? (weeks[weeks.length - 2] ?? null) : null;
}

/**
 * Échéance portée par le paramètre du dispositif (priorité sur le calendrier global, D82), ou null.
 * - saisie des besoins de M : `entry_window`, avant-dernière semaine du mois précédent ; la clôture est le dernier jour
 *   ouvré de cette semaine ;
 * - demandes de changement de M : `change_lead_days` avant le début de M, calendaires ou ouvrés, reculés à la veille ouvrée.
 */
export function dispositifDeadline(month: string, type: DeadlineType, p: DispositifParams | undefined, s: DeadlineSettings): ComputedDeadline | null {
  if (!p) return null;
  const cal = calendarOf(s);
  if (type === 'needs_entry') {
    if (!p.entry_window) return null;
    const week = penultimateWeek(addMonths(month, -1), p.entry_window.reading);
    if (!week) return null;
    return { date: previousWorkingDay(week.end, cal), opensOn: week.start, source: 'dispositif', preset: null };
  }
  if (p.change_lead_days === null) return null;
  const start = monthStart(month);
  const date = p.change_lead_unit === 'working'
    ? workingDaysBefore(start, p.change_lead_days, cal)
    : previousWorkingDay(addDays(start, -p.change_lead_days), cal);
  return { date, opensOn: null, source: 'dispositif', preset: null };
}

export function resolveDeadline(month: string, type: DeadlineType, dispositif: Dispositif | null, params: ParamsMap, s: DeadlineSettings): ComputedDeadline {
  const own = dispositif ? dispositifDeadline(month, type, params[dispositif], s) : null;
  return own ?? globalDeadline(month, type, s);
}

export interface DeadlineStatus {
  state: 'upcoming' | 'closed';
  /** Jours ouvrés restants, 0 le jour même, négatif ou nul une fois l'échéance passée (jours ouvrés écoulés). */
  left: number;
  /** Seuil de cascade atteint (5, 2, 0…), ou null si aucun rappel n'est encore dû. */
  threshold: number | null;
  /** Faux avant l'ouverture de la fenêtre de saisie du dispositif (la saisie anticipée reste permise). */
  windowOpen: boolean;
}

export function deadlineStatus(d: ComputedDeadline, today: IsoDate, s: DeadlineSettings): DeadlineStatus {
  const left = workingDaysBetween(today, d.date, calendarOf(s)) || 0; // évite -0 un week-end qui suit l'échéance
  const windowOpen = d.opensOn === null || today >= d.opensOn;
  // Close dès le lendemain de la date limite, même si ce lendemain n'est pas un jour ouvré.
  if (today > d.date) return { state: 'closed', left, threshold: null, windowOpen };
  const eligible = s.cascade.filter((t) => t >= left);
  return { state: 'upcoming', left, threshold: eligible.length > 0 ? Math.min(...eligible) : null, windowOpen };
}

export interface GateInput {
  month: string;
  type: DeadlineType;
  dispositif: Dispositif | null;
  today: IsoDate;
  settings: DeadlineSettings;
  params: ParamsMap;
  /** Réouvertures déjà restreintes au secteur concerné. */
  reopenings: readonly Reopening[];
}

export type GateResult =
  | { open: true; reopened: boolean; deadline: ComputedDeadline }
  | { open: false; deadline: ComputedDeadline };

/** Réouverture active d'un mois (ou d'une semaine) : décidée par l'agence, valable jusqu'à sa date de fin incluse. */
export function activeReopening(reopenings: readonly Reopening[], scope: 'month' | 'week', target: string, today: IsoDate): Reopening | null {
  return reopenings.find((r) => r.scope === scope && r.target === target && r.expires_on >= today) ?? null;
}

/**
 * Blocage après échéance (D78). Le mois reste ouvert jusqu'à la date limite incluse, ou tant qu'une réouverture de
 * l'agence est active. L'ouverture de la fenêtre d'un dispositif ne bloque pas : la saisie anticipée est permise.
 */
export function gate(i: GateInput): GateResult {
  const deadline = resolveDeadline(i.month, i.type, i.dispositif, i.params, i.settings);
  if (i.today <= deadline.date) return { open: true, reopened: false, deadline };
  if (activeReopening(i.reopenings, 'month', i.month, i.today)) return { open: true, reopened: true, deadline };
  return { open: false, deadline };
}

export interface DeadlineRow {
  month: string;
  type: DeadlineType;
  /** null = calendrier global ; sinon règle propre au dispositif. */
  dispositif: Dispositif | null;
  deadline: ComputedDeadline;
  status: DeadlineStatus;
}

/**
 * Échéances des `months` prochains mois cibles (à partir du mois de la date du jour) : le calendrier global, puis une
 * ligne par dispositif qui porte sa propre règle. Triées par date limite.
 */
export function listDeadlines(today: IsoDate, s: DeadlineSettings, params: ParamsMap, months = 5): DeadlineRow[] {
  const rows: DeadlineRow[] = [];
  const first = monthOf(today);
  for (let i = 0; i < months; i++) {
    const month = addMonths(first, i);
    for (const type of DEADLINE_TYPES) {
      const global = globalDeadline(month, type, s);
      rows.push({ month, type, dispositif: null, deadline: global, status: deadlineStatus(global, today, s) });
      for (const [dispositif, p] of Object.entries(params) as Array<[Dispositif, DispositifParams]>) {
        const own = dispositifDeadline(month, type, p, s);
        if (own) rows.push({ month, type, dispositif, deadline: own, status: deadlineStatus(own, today, s) });
      }
    }
  }
  return rows.sort((a, b) => a.deadline.date.localeCompare(b.deadline.date) || a.type.localeCompare(b.type) || a.month.localeCompare(b.month));
}

/** Libellé de cascade : « J-5 », « J-2 », « jour J » (le seuil 0). */
export const stageLabel = (threshold: number): { zero: boolean; n: number } => ({ zero: threshold === 0, n: threshold });
