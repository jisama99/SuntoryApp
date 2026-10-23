import type { DeadlineContext } from '@/data/repository';
import type { Reopening } from '@/data/schemas';
import { listDeadlines } from '@/domain/deadlines';
import type { DeadlineRow } from '@/domain/deadlines';
import { paramsMapOf } from '@/domain/dispositif-params';
import type { Dispositif } from '@/domain/types';
import { addMonths, monthOf } from '@/domain/working-days';
import { gate } from '@/domain/deadlines';

/**
 * Lignes de la bannière d'échéance. `dispositif` : un dispositif choisi (sa règle remplace celle du calendrier global
 * pour le même mois et le même type), `all` (liste des besoins : toutes les règles), ou null (calendrier global seul).
 */
export function bannerRows(ctx: DeadlineContext, dispositif: Dispositif | 'all' | null, sectorId: string | null) {
  const rows = listDeadlines(ctx.today, ctx.settings, paramsMapOf(ctx.params), 4);
  const kept = rows.filter((r) => r.dispositif === null || dispositif === 'all' || r.dispositif === dispositif);
  const own = new Set(kept.filter((r) => r.dispositif !== null).map((r) => `${r.month}:${r.type}`));
  const list: DeadlineRow[] =
    dispositif === 'all' ? kept : kept.filter((r) => r.dispositif !== null || !own.has(`${r.month}:${r.type}`));
  const current = monthOf(ctx.today);
  const chain = sectorId ? new Set(ctx.lineage[sectorId] ?? []) : null;
  const reopenings = ctx.reopenings.filter((r) => r.expires_on >= ctx.today && (!chain || chain.has(r.zone_id)));
  const reopenedMonths = new Set(reopenings.filter((r) => r.scope === 'month').map((r) => r.target));
  const closed = list
    .filter((r) => r.status.state === 'closed' && r.month > current && !reopenedMonths.has(r.month))
    .sort((a, b) => b.deadline.date.localeCompare(a.deadline.date));
  const upcoming = list.filter((r) => r.status.state === 'upcoming').slice(0, 4);
  return { closed, upcoming, reopenings };
}

/**
 * Mois dont la saisie est close pour le dispositif et le secteur choisis (réouvertures déduites) : le calendrier de
 * saisie désactive leurs jours avec la date limite dépassée. Même calcul que la couche données (module deadlines).
 */
export function lockedMonthsFor(ctx: DeadlineContext, dispositif: Dispositif | null, sectorId: string | null, min: string, max: string) {
  const params = paramsMapOf(ctx.params);
  const chain = sectorId ? new Set(ctx.lineage[sectorId] ?? []) : null;
  const reopenings: Reopening[] = ctx.reopenings.filter((r) => !chain || chain.has(r.zone_id));
  const out: Array<{ month: string; deadline: string }> = [];
  // Les mois passés ou en cours sont toujours clos ; les mois à venir le sont si leur échéance est dépassée.
  // Au-delà de six mois, aucune échéance n'est encore atteinte : inutile de calculer tout l'horizon.
  const last = addMonths(monthOf(ctx.today), 6);
  for (let m = monthOf(min); m <= monthOf(max) && m <= last; m = addMonths(m, 1)) {
    const g = gate({ month: m, type: 'needs_entry', dispositif, today: ctx.today, settings: ctx.settings, params, reopenings });
    if (!g.open) out.push({ month: m, deadline: g.deadline.date });
  }
  return out;
}
