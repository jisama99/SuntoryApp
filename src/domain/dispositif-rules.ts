import type { RawFinding } from './rules';
import { gate } from './deadlines';
import { slotMinutes } from './dispositif-params';
import { addMonths, monthOf } from './working-days';
import { resolvePeriod } from './week-rules';
import type { RuleContext, RuleEnv, RuleInput } from './week-rules';

type RuleFn = (c: RuleContext) => RawFinding[];

const paramsOf = (c: RuleContext) => (c.input.dispositif ? c.env.a2b?.params[c.input.dispositif] : undefined);

/** P1 : durée d'une intervention inférieure à la durée minimale du dispositif (`min_minutes`). La durée est celle du créneau horaire saisi. */
export const p1: RuleFn = (c) => {
  const p = paramsOf(c);
  if (!c.env.a2b || !p || p.min_minutes === null) return [];
  const actual = slotMinutes(c.input.hours_slot);
  return actual !== null && actual < p.min_minutes ? [{ rule: 'P1', params: { min: p.min_minutes, actual } }] : [];
};

/** P2 : campagne rattachée à plus d'un dispositif (bloquante au paramétrage, et à la saisie si la donnée est corrompue). */
export const p2: RuleFn = (c) => {
  const code = c.input.campaign_code;
  const list = code ? c.env.a2b?.campaignDispositifs[code] : undefined;
  return code && list && list.length > 1 ? [{ rule: 'P2', params: { campaign: code } }] : [];
};

/** Mois cible d'un besoin : mois du premier jour de la première période, ou imposé par le contexte (fusion). */
export function targetMonthOf(periods: RuleContext['periods'], forced?: string): string | null {
  if (forced) return forced;
  const starts = periods.map((p) => p.start).filter((d): d is string => d !== null).sort();
  return starts[0] ? monthOf(starts[0]) : null;
}

/**
 * Échéance dépassée (D78). Une seule règle se déclenche, selon qui porte l'échéance :
 * - saisie des besoins : P3 si la fenêtre du dispositif la porte, E1 si c'est le calendrier global ;
 * - demande de changement : P4 si le délai du dispositif la porte, E2 si c'est le calendrier global.
 * Le report sur le mois suivant (`defer`) n'est proposé que si ce mois est lui-même encore ouvert.
 */
export const deadlineRule: RuleFn = (c) => {
  const a = c.env.a2b;
  if (!a) return [];
  const origin = targetMonthOf(c.periods, a.targetMonth);
  if (!origin) return [];
  const month = a.deferredFrom ? addMonths(origin, 1) : origin;
  const type = a.writeKind === 'entry' ? 'needs_entry' : 'change_request';
  const base = { dispositif: c.input.dispositif, today: c.env.today, settings: a.settings, params: a.params, reopenings: a.reopenings };
  const g = gate({ ...base, month, type });
  if (g.open) return [];
  const own = g.deadline.source === 'dispositif';
  const rule = a.writeKind === 'entry' ? (own ? 'P3' : 'E1') : own ? 'P4' : 'E2';
  const next = addMonths(month, 1);
  const effect = paramsOf(c)?.change_effect === 'next_month' ? 'next_month' : 'other';
  const canDefer = !a.deferredFrom && gate({ ...base, month: next, type }).open;
  const f: RawFinding = { rule, params: { month, deadline: g.deadline.date, next, effect, canDefer: canDefer ? 'yes' : 'no' } };
  if (canDefer) f.defer = { toMonth: next };
  return [f];
};

/** P5 : forfait kilométrique applicable mais non renseigné. Non bloquante : la ligne reste « Non chiffré », jamais 0. */
export const p5: RuleFn = (c) => {
  const p = paramsOf(c);
  return c.env.a2b && p && p.km_flat_rate.applicable && p.km_flat_rate.amount_eur_ht === null ? [{ rule: 'P5', params: {} }] : [];
};

/** P6 : saisie par un rôle absent de `entry_roles` (côté Repository, pas seulement à l'écran). */
export const p6: RuleFn = (c) => {
  const a = c.env.a2b;
  const p = paramsOf(c);
  if (!a || !p || p.entry_roles === null) return [];
  return (p.entry_roles as readonly string[]).includes(a.actor) ? [] : [{ rule: 'P6', params: {} }];
};

export const DISPOSITIF_RULES: RuleFn[] = [p1, p2, deadlineRule, p5, p6];

export function evaluateDispositifRules(input: RuleInput, env: RuleEnv): RawFinding[] {
  if (!env.a2b) return [];
  const ctx: RuleContext = { input, periods: input.periods.map(resolvePeriod), env };
  return DISPOSITIF_RULES.flatMap((rule) => rule(ctx));
}
