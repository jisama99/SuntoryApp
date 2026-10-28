import type { AllocationLine, EnvelopeVersion, Need, Rate, Zone } from '@/data/schemas';
import { funnelState } from './pipeline';
import type { Facts } from './pipeline';
import { cvrZoneOf, drZoneOf } from './validation';
import type { EnvelopeStatus } from './validation';
import { resolvePeriod } from './week-rules';
import type { BudgetStatus, CostMissingReason, Dispositif } from './types';
import { addDays, daysBetween, weekdayOf } from './week';
import type { IsoDate } from './week';

/**
 * Chaîne budgétaire (D153, D156, lot A4b1) : règles pures, sans dépendance à l'interface ni aux données.
 * Tous les montants se calculent en centimes entiers (aucune erreur d'arrondi à la somme). Un coût inconnu n'est jamais 0 :
 * il vaut `null` (« Non chiffré »), et une enveloppe ou une allocation absente vaut « Budget non renseigné ».
 */

// ---------------------------------------------------------------------------------------------
// Montants.
// ---------------------------------------------------------------------------------------------
export const toCents = (eur: number): number => Math.round(eur * 100);
export const fromCents = (cents: number): number => cents / 100;
/** Vrai pour un montant positif ou nul avec au plus deux décimales. */
export const isMoney = (eur: unknown): eur is number =>
  typeof eur === 'number' && Number.isFinite(eur) && eur >= 0 && eur <= 1_000_000_000 && Math.abs(eur * 100 - Math.round(eur * 100)) < 1e-6;

// ---------------------------------------------------------------------------------------------
// Coût estimé d'un besoin : heures par semaine x semaines ISO touchées x tarif horaire daté.
// ---------------------------------------------------------------------------------------------
export interface NeedCost {
  /** Coût estimé en centimes ; `null` = « Non chiffré ». */
  cents: number | null;
  /** Nombre de semaines ISO touchées, périodes cumulées (0 si aucune période datée). */
  weeks: number;
  hours: number | null;
  rateCents: number | null;
  missing: CostMissingReason | null;
}

const mondayOf = (d: IsoDate): IsoDate => addDays(d, -(weekdayOf(d) - 1));

/** Semaines ISO touchées par les périodes datées du besoin (une période de P1 et une de P2 s'additionnent). */
export function weeksOf(periods: Need['periods']): number {
  let weeks = 0;
  for (const p of periods.map(resolvePeriod)) {
    if (p.start && p.end && p.end >= p.start) weeks += daysBetween(mondayOf(p.start), mondayOf(p.end)) / 7 + 1;
  }
  return weeks;
}

/** Tarif en vigueur à la date : le plus récent dont la date d'effet n'est pas dépassée. Aucun tarif applicable = `null`, jamais un tarif de repli. */
export function rateAt(rates: readonly Rate[], dispositif: Dispositif, date: IsoDate): Rate | null {
  return rates.filter((r) => r.dispositif === dispositif && r.valid_from <= date).sort((a, b) => b.valid_from.localeCompare(a.valid_from))[0] ?? null;
}

export function estimateNeedCost(need: Pick<Need, 'dispositif' | 'weekly_hours' | 'periods'>, rates: readonly Rate[]): NeedCost {
  const weeks = weeksOf(need.periods);
  const base = { weeks, hours: need.weekly_hours, rateCents: null as number | null };
  const none = (missing: CostMissingReason): NeedCost => ({ ...base, cents: null, missing });
  if (!need.dispositif) return none('dispositif');
  if (!need.weekly_hours) return none('hours');
  const start = need.periods.map(resolvePeriod).map((p) => p.start).filter((d): d is IsoDate => d !== null).sort()[0];
  if (weeks === 0 || !start) return none('period');
  const rate = rateAt(rates, need.dispositif, start);
  if (!rate) return none('rate');
  const rateCents = toCents(rate.hourly_rate_eur_ht);
  return { ...base, rateCents, cents: need.weekly_hours * weeks * rateCents, missing: null };
}

// ---------------------------------------------------------------------------------------------
// Imputation : un besoin compte dans la maille (campagne, CVR). Elle est dérivée du besoin, jamais stockée : un changement de
// campagne ou de secteur déplace donc l'imputation de lui-même ; le journal garde la date du déplacement (EV-52).
// ---------------------------------------------------------------------------------------------
export interface BudgetNeed {
  id: string;
  code: string;
  submittedOn: IsoDate;
  sectorId: string;
  cvrId: string | null;
  drId: string | null;
  campaign: string | null;
  dispositif: Dispositif | null;
  cost: NeedCost;
  /** Poste démarré (« En poste ») : le prévisionnel devient consommé. */
  started: boolean;
}

export interface MeshLine {
  campaign: string;
  cvrId: string;
  cents: number;
}

export const meshKey = (campaign: string, cvrId: string): string => `${campaign}|${cvrId}`;
export const meshOf = (n: Pick<BudgetNeed, 'campaign' | 'cvrId'>): string | null => (n.campaign && n.cvrId ? meshKey(n.campaign, n.cvrId) : null);

/**
 * Situation de chaque besoin face au budget de sa maille. Les besoins d'une maille sont pris dans l'ordre de leur soumission
 * (puis de leur code) et cumulés : le premier qui fait dépasser le montant alloué est « au-delà », ceux qui suivent aussi.
 * Aucune ligne d'allocation = « Budget non renseigné » (jamais « dans le budget »). Coût inconnu = « Non chiffré ».
 */
export function classifyNeeds(needs: readonly BudgetNeed[], lines: readonly MeshLine[]): Map<string, BudgetStatus> {
  const allocated = new Map(lines.map((l) => [meshKey(l.campaign, l.cvrId), l.cents]));
  const out = new Map<string, BudgetStatus>();
  const running = new Map<string, number>();
  const ordered = [...needs].sort((a, b) => a.submittedOn.localeCompare(b.submittedOn) || a.code.localeCompare(b.code));
  for (const n of ordered) {
    if (n.cost.cents === null) {
      out.set(n.id, 'unpriced');
      continue;
    }
    const key = meshOf(n);
    const limit = key ? allocated.get(key) : undefined;
    if (key === null || limit === undefined) {
      out.set(n.id, 'no_budget');
      continue;
    }
    const total = (running.get(key) ?? 0) + n.cost.cents;
    running.set(key, total);
    out.set(n.id, total > limit ? 'beyond' : 'within');
  }
  return out;
}

/** Point d'entrée « hors enveloppe » du lot A3c (D43 ouverte) : « non évalué » tant que le coût ou l'allocation manque. */
export function envelopeStatusOf(status: BudgetStatus | undefined): EnvelopeStatus {
  return status === 'beyond' ? 'exceeded' : status === 'within' ? 'within' : 'not_evaluated';
}

// ---------------------------------------------------------------------------------------------
// Quatre mesures et couverture (F-50.6).
// ---------------------------------------------------------------------------------------------
export interface Figures {
  /** Budget affecté : somme des lignes d'allocation retenues ; `null` = « Budget non renseigné ». */
  allocated: number | null;
  /** Consommé : coûts estimés des postes démarrés ; `null` = tous non chiffrés. */
  consumed: number | null;
  /** Prévisionnel : coûts estimés des besoins comptés qui ne sont pas encore démarrés. */
  forecast: number | null;
  /** Atterrissage : consommé retenu plus prévisionnel restant. */
  landing: number | null;
  /** Disponible : affecté moins atterrissage ; `null` si l'un des deux est inconnu. Négatif = dépassement. */
  available: number | null;
  /** Couverture de calcul : besoins chiffrés sur besoins comptés. */
  priced: number;
  total: number;
  /** Besoins au-delà du disponible de leur maille. */
  beyond: number;
}

/** Somme des coûts chiffrés ; 0 seulement si aucun besoin (vrai zéro), `null` si des besoins existent mais aucun n'est chiffré. */
function sumOrNull(items: readonly BudgetNeed[]): number | null {
  if (items.length === 0) return 0;
  const priced = items.filter((n) => n.cost.cents !== null);
  return priced.length === 0 ? null : priced.reduce((s, n) => s + (n.cost.cents as number), 0);
}

export function figuresOf(allocated: number | null, needs: readonly BudgetNeed[], statuses: ReadonlyMap<string, BudgetStatus>): Figures {
  const consumed = sumOrNull(needs.filter((n) => n.started));
  const forecast = sumOrNull(needs.filter((n) => !n.started));
  const landing = sumOrNull(needs);
  return {
    allocated,
    consumed,
    forecast,
    landing,
    available: allocated === null || landing === null ? null : allocated - landing,
    priced: needs.filter((n) => n.cost.cents !== null).length,
    total: needs.length,
    beyond: needs.filter((n) => statuses.get(n.id) === 'beyond').length,
  };
}

export const allocatedSum = (lines: readonly MeshLine[]): number | null => (lines.length === 0 ? null : lines.reduce((s, l) => s + l.cents, 0));

// ---------------------------------------------------------------------------------------------
// Contrôles d'écriture.
// ---------------------------------------------------------------------------------------------
export type EnvelopeRefusal = 'invalid' | 'invalid_period' | 'motive_required' | 'below_allocated';

export interface EnvelopeRequest {
  amountEur: unknown;
  periodStart: string;
  periodEnd: string;
  motive?: string | null;
}

/**
 * Contrôle d'une nouvelle version d'enveloppe. Le motif est exigé dès la deuxième version. Une version inférieure au total déjà
 * alloué par l'agence est refusée : le total réparti ne dépasse jamais l'enveloppe, et seule l'agence modifie ses allocations.
 */
export function envelopeIssue(req: EnvelopeRequest, current: Pick<EnvelopeVersion, 'version'> | null, allocatedCents: number, validDate: (d: string) => boolean): EnvelopeRefusal | null {
  if (!isMoney(req.amountEur) || req.amountEur <= 0) return 'invalid';
  if (!validDate(req.periodStart) || !validDate(req.periodEnd) || req.periodEnd < req.periodStart) return 'invalid_period';
  const motive = (req.motive ?? '').trim();
  if (motive.length > 280) return 'invalid';
  if (current && !motive) return 'motive_required';
  if (toCents(req.amountEur) < allocatedCents) return 'below_allocated';
  return null;
}

export type AllocationRefusal = 'invalid' | 'no_envelope' | 'exceeds_envelope' | 'motive_required' | 'unknown_campaign' | 'unknown_cvr' | 'unchanged';

export interface AllocationRequest {
  campaign: string;
  cvrId: string;
  amountEur: unknown;
  motive?: string | null;
}

/**
 * Contrôle d'une allocation. Le total réparti, ligne modifiée comprise, ne dépasse jamais l'enveloppe courante ; sans enveloppe
 * (« Budget non renseigné »), rien ne se répartit. Toute modification d'une ligne existante porte un motif.
 */
export function allocationIssue(
  req: AllocationRequest, envelopeCents: number | null, lines: readonly MeshLine[],
  known: { campaign: (code: string) => boolean; cvr: (id: string) => boolean },
): AllocationRefusal | null {
  if (!isMoney(req.amountEur)) return 'invalid';
  if (!known.campaign(req.campaign)) return 'unknown_campaign';
  if (!known.cvr(req.cvrId)) return 'unknown_cvr';
  const motive = (req.motive ?? '').trim();
  if (motive.length > 280) return 'invalid';
  if (envelopeCents === null) return 'no_envelope';
  const existing = lines.find((l) => l.campaign === req.campaign && l.cvrId === req.cvrId);
  if (existing && !motive) return 'motive_required';
  const amount = toCents(req.amountEur);
  if (existing && existing.cents === amount) return 'unchanged';
  const others = lines.filter((l) => l !== existing).reduce((s, l) => s + l.cents, 0);
  return others + amount > envelopeCents ? 'exceeds_envelope' : null;
}

/** Total réparti d'un ensemble de lignes déjà enregistrées (schéma) en centimes. */
export const linesOf = (rows: readonly Pick<AllocationLine, 'campaign_code' | 'cvr_id' | 'amount_eur_ht'>[]): MeshLine[] =>
  rows.map((r) => ({ campaign: r.campaign_code, cvrId: r.cvr_id, cents: toCents(r.amount_eur_ht) }));

// ---------------------------------------------------------------------------------------------
// Déplacements d'imputation (mutations datées).
// ---------------------------------------------------------------------------------------------
export interface ImputationSnapshot {
  campaign: string | null;
  cvrId: string | null;
  cents: number | null;
}
export type ImputationMove = { needId: string; kind: 'moved' | 'recosted'; from: ImputationSnapshot; to: ImputationSnapshot };

/**
 * Compare l'imputation connue (instantané précédent) à l'imputation actuelle. `moved` : la campagne ou le CVR a changé ;
 * `recosted` : même maille, coût estimé différent. Un besoin nouvellement compté (absent de l'instantané) n'est pas un déplacement.
 */
export function imputationMoves(previous: Readonly<Record<string, ImputationSnapshot>>, current: readonly BudgetNeed[]): ImputationMove[] {
  const out: ImputationMove[] = [];
  for (const n of current) {
    const before = previous[n.id];
    if (!before) continue;
    const to: ImputationSnapshot = { campaign: n.campaign, cvrId: n.cvrId, cents: n.cost.cents };
    if (before.campaign !== to.campaign || before.cvrId !== to.cvrId) out.push({ needId: n.id, kind: 'moved', from: before, to });
    else if (before.cents !== to.cents) out.push({ needId: n.id, kind: 'recosted', from: before, to });
  }
  return out;
}

export const snapshotOfNeeds = (needs: readonly BudgetNeed[]): Record<string, ImputationSnapshot> =>
  Object.fromEntries(needs.map((n) => [n.id, { campaign: n.campaign, cvrId: n.cvrId, cents: n.cost.cents }]));

// ---------------------------------------------------------------------------------------------
// Besoins comptés au budget : un seul calcul pour la couche de données et pour la génération des fixtures.
// ---------------------------------------------------------------------------------------------
export interface BudgetNeedSource {
  needs: readonly Need[];
  zones: readonly Zone[];
  rates: readonly Rate[];
  today: IsoDate;
  /** Date de première soumission du besoin. */
  submittedOn: (need: Need) => IsoDate;
  /** Faits de recrutement vus de l'agence (vue interne complète). */
  factsOf: (needId: string) => Facts;
}

/**
 * Besoins comptés : soumis, ni écartés par l'agence, ni stoppés, ni refusés par la chaîne managériale (un besoin refusé revient au RS
 * et ne pèse plus sur le budget tant qu'il n'est pas soumis de nouveau). Les brouillons n'y entrent jamais (comme W9).
 * Un poste démarré est consommé ; tout autre besoin compté est prévisionnel.
 */
export function budgetNeedsOf(src: BudgetNeedSource): BudgetNeed[] {
  const out: BudgetNeed[] = [];
  for (const n of src.needs) {
    if (n.need_state !== 'submitted') continue;
    const facts = src.factsOf(n.id);
    const rec = facts.recruitment;
    if (rec.intake === 'rejected' || rec.stopped || rec.validation === 'refused') continue;
    const sector = src.zones.find((z) => z.id === n.sector_id);
    if (!sector) continue;
    out.push({
      id: n.id, code: n.need_code, submittedOn: src.submittedOn(n), sectorId: n.sector_id,
      cvrId: cvrZoneOf(src.zones as Zone[], n.sector_id)?.id ?? null, drId: drZoneOf(src.zones as Zone[], n.sector_id)?.id ?? null,
      campaign: n.campaign_code, dispositif: n.dispositif, cost: estimateNeedCost(n, src.rates), started: funnelState(facts, src.today) === 'started',
    });
  }
  return out;
}
