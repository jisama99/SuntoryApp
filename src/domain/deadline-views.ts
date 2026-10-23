import type { Need, Zone } from '@/data/schemas';
import { resolvePeriod } from './week-rules';
import { deadlineStatus, globalDeadline } from './deadlines';
import type { DeadlineRow, DeadlineStatus, ComputedDeadline } from './deadlines';
import type { DeadlineSettings } from '@/data/schemas';
import type { Audience, ProfileId, Severity } from './types';
import { addDays, weekdayOf } from './week';
import type { IsoDate } from './week';
import { addMonths, monthOf } from './working-days';

/**
 * Vues dérivées des échéances : résumé des retards (D81), alertes J-5, J-2 et jour J (D79, D82), file de courriels
 * (D86, D94). Modules purs : tout est recalculé depuis le calendrier, les besoins et l'horloge de démonstration.
 * Rien n'est envoyé ; aucun nom de personne n'entre dans le résumé des retards de la cliente.
 */
export type SectorStatus = 'up_to_date' | 'to_follow' | 'late';
export type StatusCounts = Record<SectorStatus, number>;

const emptyCounts = (): StatusCounts => ({ up_to_date: 0, to_follow: 0, late: 0 });

/** Mois cible d'un besoin : mois du premier jour de sa première période. */
export function needMonth(n: Pick<Need, 'periods'>): string | null {
  const starts = n.periods.map((p) => resolvePeriod(p).start).filter((d): d is string => d !== null).sort();
  return starts[0] ? monthOf(starts[0]) : null;
}

export interface DelayMonth {
  month: string;
  deadline: ComputedDeadline;
  status: DeadlineStatus;
  counts: StatusCounts;
  total: number;
  regions: Array<{ zone: Zone; counts: StatusCounts; total: number }>;
  sectors: Array<{ zone: Zone; status: SectorStatus; submitted: number; drafts: number }>;
}

/**
 * Résumé des retards de saisie par région et par secteur pour les `months` mois suivant le mois courant.
 * À jour : au moins un besoin soumis pour le mois. Sinon, en retard si la saisie du mois est close, à suivre sinon.
 */
export function delaySummary(i: {
  today: IsoDate;
  settings: DeadlineSettings;
  zones: readonly Zone[];
  needs: readonly Need[];
  months?: number;
}): DelayMonth[] {
  const sectors = i.zones.filter((z) => z.kind === 'rs');
  const byId = new Map(i.zones.map((z) => [z.id, z]));
  const regionOf = (z: Zone): Zone | null => {
    let cur: Zone | undefined = z;
    while (cur && cur.kind !== 'dr') cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
    return cur ?? null;
  };
  const out: DelayMonth[] = [];
  for (let k = 1; k <= (i.months ?? 2); k++) {
    const month = addMonths(monthOf(i.today), k);
    const deadline = globalDeadline(month, 'needs_entry', i.settings);
    const status = deadlineStatus(deadline, i.today, i.settings);
    const rows = sectors.map((zone) => {
      const mine = i.needs.filter((n) => n.sector_id === zone.id && needMonth(n) === month);
      const submitted = mine.filter((n) => n.need_state === 'submitted').length;
      const sectorStatus: SectorStatus = submitted > 0 ? 'up_to_date' : status.state === 'closed' ? 'late' : 'to_follow';
      return { zone, status: sectorStatus, submitted, drafts: mine.length - submitted };
    });
    const counts = emptyCounts();
    const regions = new Map<string, { zone: Zone; counts: StatusCounts; total: number }>();
    for (const r of rows) {
      counts[r.status]++;
      const dr = regionOf(r.zone);
      if (!dr) continue;
      const entry = regions.get(dr.id) ?? { zone: dr, counts: emptyCounts(), total: 0 };
      entry.counts[r.status]++;
      entry.total++;
      regions.set(dr.id, entry);
    }
    out.push({ month, deadline, status, counts, total: rows.length, regions: [...regions.values()], sectors: rows });
  }
  return out;
}

export interface DerivedAlert {
  id: string;
  audience: Audience;
  severity: Severity;
  /** Clé sous `alerts.derived`. */
  message_key: 'reminderEntry' | 'reminderEntryMissing' | 'reminderChange' | 'reminderEntryOwn' | 'reminderChangeOwn' | 'lateSummary' | 'closingReport' | 'reopenQueue';
  params: Record<string, string | number>;
  created_at: IsoDate;
}

export interface AlertInput {
  today: IsoDate;
  rows: readonly DeadlineRow[];
  /** Retards du périmètre du lecteur, par mois cible. */
  delays: readonly DelayMonth[];
  /** Demandes reportées sur le mois suivant, par mois d'origine (périmètre du lecteur). */
  deferredByMonth: Readonly<Record<string, number>>;
  pendingRequests: number;
}

/**
 * Alertes dérivées. Les rappels J-5, J-2 et jour J sont d'audience `client` (visibles aussi de l'agence) ; J-2 et jour J
 * ne concernent que les périmètres qui ont encore du retard. Le bilan chiffré de clôture et la file de réouvertures sont
 * d'audience `agency` : le filtrage par audience se fait dans la couche de données, jamais à l'écran.
 */
export function buildDeadlineAlerts(i: AlertInput): DerivedAlert[] {
  const out: DerivedAlert[] = [];
  for (const r of i.rows) {
    const id = `${r.month}:${r.type}:${r.dispositif ?? 'all'}`;
    const delay = i.delays.find((d) => d.month === r.month);
    const missing = delay ? delay.counts.to_follow + delay.counts.late : 0;
    const t = r.status.threshold;
    if (r.status.state === 'upcoming' && t !== null) {
      const common = { stage: t, month: r.month, deadline: r.deadline.date, left: r.status.left };
      const severity: Severity = t === 0 ? 'risk' : t <= 2 ? 'attention' : 'info';
      if (r.dispositif) {
        out.push({
          id: `reminder:${id}`, audience: 'client', severity, created_at: i.today,
          message_key: r.type === 'needs_entry' ? 'reminderEntryOwn' : 'reminderChangeOwn',
          params: { ...common, dispositif: r.dispositif },
        });
      } else if (r.type === 'needs_entry') {
        // J-2 et jour J : seulement si le périmètre du lecteur a encore du retard.
        if (t <= 2 && missing === 0) continue;
        out.push({
          id: `reminder:${id}`, audience: 'client', severity, created_at: i.today,
          message_key: missing > 0 ? 'reminderEntryMissing' : 'reminderEntry',
          params: missing > 0 ? { ...common, missing } : common,
        });
      } else {
        out.push({ id: `reminder:${id}`, audience: 'client', severity, message_key: 'reminderChange', created_at: i.today, params: common });
      }
    } else if (r.status.state === 'closed' && r.status.left >= -1 && !r.dispositif && r.type === 'needs_entry' && delay) {
      // Lendemain de la clôture : résumé des retards pour la cliente, bilan chiffré pour l'agence.
      out.push({
        id: `late:${id}`, audience: 'client', severity: delay.counts.late > 0 ? 'attention' : 'info', message_key: 'lateSummary', created_at: i.today,
        params: { month: r.month, late: delay.counts.late, total: delay.total },
      });
      out.push({
        id: `report:${id}`, audience: 'agency', severity: 'info', message_key: 'closingReport', created_at: i.today,
        params: { month: r.month, done: delay.counts.up_to_date, late: delay.counts.late, deferred: i.deferredByMonth[r.month] ?? 0 },
      });
    }
  }
  if (i.pendingRequests > 0) {
    out.push({
      id: 'queue:reopen', audience: 'agency', severity: 'attention', message_key: 'reopenQueue', created_at: i.today,
      params: { n: i.pendingRequests },
    });
  }
  return out;
}

export interface OutboxItem {
  id: string;
  kind: 'reminder_day_j' | 'monday_summary';
  /** Date d'envoi prévue (aucun envoi au démonstrateur). */
  planned_on: IsoDate;
  month: string | null;
  /** Zone dont le responsable est destinataire, ou null pour la cliente. */
  recipient_zone_id: string | null;
  recipient_profile: ProfileId | null;
  /** Secteurs concernés (rappel). Aucun chiffre dans le résumé du lundi (D86). */
  sector_count: number;
}

/** Prochain lundi strictement après la date. */
export const nextMonday = (d: IsoDate): IsoDate => addDays(d, 8 - weekdayOf(d));

/**
 * File des courriels préparés, un message par personne (D86) : rappel du jour J aux responsables qui ont encore du
 * retard, résumé du lundi à la cliente. Modélisée pour validation par l'agence ; rien n'est envoyé.
 */
export function buildOutbox(i: {
  today: IsoDate;
  rows: readonly DeadlineRow[];
  delays: readonly DelayMonth[];
  zones: readonly Zone[];
}): OutboxItem[] {
  const byId = new Map(i.zones.map((z) => [z.id, z]));
  const items: OutboxItem[] = [];
  for (const r of i.rows) {
    if (r.dispositif || r.type !== 'needs_entry' || r.status.state !== 'upcoming' || r.status.threshold === null) continue;
    const delay = i.delays.find((d) => d.month === r.month);
    if (!delay) continue;
    const perZone = new Map<string, number>();
    for (const s of delay.sectors) {
      if (s.status === 'up_to_date') continue;
      let cur: Zone | undefined = s.zone;
      while (cur) {
        perZone.set(cur.id, (perZone.get(cur.id) ?? 0) + 1);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
    }
    for (const [zoneId, count] of perZone) {
      items.push({
        id: `reminder:${r.month}:${zoneId}`, kind: 'reminder_day_j', planned_on: r.deadline.date, month: r.month,
        recipient_zone_id: zoneId, recipient_profile: null, sector_count: count,
      });
    }
  }
  items.push({
    id: `monday:${nextMonday(i.today)}`, kind: 'monday_summary', planned_on: nextMonday(i.today), month: null,
    recipient_zone_id: null, recipient_profile: 'direction_client', sector_count: 0,
  });
  return items.sort((a, b) => a.planned_on.localeCompare(b.planned_on) || a.id.localeCompare(b.id));
}
