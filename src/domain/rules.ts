import type { IsoDate } from './week';

/** Gravités de la présentation V0.4 : Bloquant, Alerte, Information. « off » désactive une règle (paramétrable). */
export const GRAVITIES = ['blocking', 'alert', 'info'] as const;
export type Gravity = (typeof GRAVITIES)[number];
export type ConfiguredGravity = Gravity | 'off';

export const WEEK_RULE_IDS = [
  'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11',
  'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20', 'W21', 'W22',
] as const;
export const DUP_RULE_IDS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'] as const;
/** J1 à J3 : contrôles des jours cochés (docs/COMPLEMENTS_CADRAGE/28 §8). B1 : bornes de dates du dictionnaire. */
export const DAY_RULE_IDS = ['J1', 'J2', 'J3'] as const;
export const BOUND_RULE_IDS = ['B1'] as const;
export const RULE_IDS = [...WEEK_RULE_IDS, ...DUP_RULE_IDS, ...DAY_RULE_IDS, ...BOUND_RULE_IDS] as const;
export type RuleId = (typeof RULE_IDS)[number];

export interface Finding {
  rule: RuleId;
  gravity: Gravity;
  /** Valeurs insérées dans le message traduit (dates et semaines au format stocké ; la langue est appliquée à l'affichage). */
  params: Record<string, string | number>;
  periodNo?: 1 | 2;
  relatedNeedId?: string;
  /** Correction proposée en un clic (W1, W2, W3, W5). */
  fix?: { periodNo: 1 | 2; field: 'start_week' | 'end_week'; value: string };
}
export type RawFinding = Omit<Finding, 'gravity'>;

export interface RuleConfig {
  gravities: Record<RuleId, ConfiguredGravity>;
  /** W11 : horizon maximal de saisie, en semaines [À VALIDER]. */
  horizonWeeks: number;
  /** W16 : jours non ouvrés (1 = lundi … 7 = dimanche) [À VALIDER, règle par campagne]. */
  excludedWeekdays: readonly number[];
  excludeHolidays: boolean;
  /** J3 : jours proposés par le dispositif ; dimanche désactivé par défaut (D132, Q-J1). */
  daysAllowed: readonly number[];
  /** B1 : bornes de dates du dictionnaire (01/01/2026 à 31/12/2028), à paramétrer. */
  dateBounds: { min: IsoDate; max: IsoDate };
}

/**
 * Gravités par défaut : colonne « Gravité » de la V0.4 pour W, position D22 / Q7 pour D. Propositions de l'agence,
 * pas des décisions de la cliente : tout est paramétrable.
 */
export const DEFAULT_RULE_CONFIG: RuleConfig = {
  gravities: {
    W1: 'blocking', W2: 'blocking', W3: 'blocking', W4: 'alert', W5: 'blocking', W6: 'blocking',
    W7: 'alert', W8: 'info', W9: 'blocking', W10: 'alert', W11: 'info', W12: 'blocking',
    W13: 'alert', W14: 'blocking', W15: 'blocking', W16: 'alert', W17: 'info', W18: 'blocking',
    W19: 'alert', W20: 'alert', W21: 'alert', W22: 'alert',
    D1: 'blocking', D2: 'alert', D3: 'alert', D4: 'info', D5: 'alert', D6: 'info', D7: 'blocking',
    J1: 'alert', J2: 'alert', J3: 'blocking',
    B1: 'blocking',
  },
  horizonWeeks: 52,
  excludedWeekdays: [7],
  excludeHolidays: true,
  daysAllowed: [1, 2, 3, 4, 5, 6],
  dateBounds: { min: '2026-01-01', max: '2028-12-31' },
};

/** Applique la gravité configurée et retire les règles désactivées. */
export function applyGravities(raw: RawFinding[], config: RuleConfig): Finding[] {
  const out: Finding[] = [];
  for (const f of raw) {
    const g = config.gravities[f.rule];
    if (g === 'off') continue;
    out.push({ ...f, gravity: g });
  }
  return out;
}
