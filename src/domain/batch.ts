import type { BatchRow } from '@/data/schemas';
import { missingFields } from './need-check';
import { DISPOSITIFS } from './types';
import type { Dispositif } from './types';
import type { RuleInput } from './week-rules';

/**
 * Saisie en lot (F-20.2). Une ligne du tableau a les mêmes champs que le formulaire unitaire, en texte. Les fonctions
 * de ce module sont pures : conversion vers l'entrée des règles, ligne vide, résumé avant soumission.
 */
export type { BatchRow };

export const EMPTY_BATCH_PERIOD = { start_date: null, end_date: null, start_week: null, end_week: null } as const;

export function emptyBatchRow(sectorId: string): BatchRow {
  return {
    dispositif: '', campaign_code: '', sector_id: sectorId, position_label: '', weekly_hours: '', priority: '',
    periods: [{ ...EMPTY_BATCH_PERIOD }], days: [], hours_slot: '', store_codes: [], client_comment: '',
  };
}

/** Vrai si la ligne ne porte aucune saisie (le secteur imposé à un RS ne compte pas comme une saisie). */
export function isEmptyBatchRow(row: BatchRow, fixedSectorId?: string): boolean {
  const sectorFree = row.sector_id === '' || row.sector_id === fixedSectorId;
  return (
    sectorFree &&
    row.dispositif === '' && row.campaign_code === '' && row.position_label === '' && row.weekly_hours === '' &&
    row.priority === '' && row.hours_slot.trim() === '' && row.client_comment.trim() === '' &&
    row.days.length === 0 && row.store_codes.length === 0 &&
    row.periods.every((p) => !p.start_date && !p.end_date && !p.start_week && !p.end_week) &&
    !row.raw && !(row.paste_issues && row.paste_issues.length > 0)
  );
}

/** Conversion d'une ligne (ou du formulaire unitaire) vers l'entrée des règles, valeurs brutes de collage comprises. */
export function rowToInput(row: Omit<BatchRow, 'paste_issues'>): RuleInput & { sector_id: string } {
  // Une période qui ne porte que des valeurs brutes collées (W14, W15, W13) est conservée : les règles la jugent.
  const periods = row.periods
    .map((p, i) => ({ period_no: (i + 1) as 1 | 2, ...p }))
    .filter((p) => p.start_date || p.end_date || p.start_week || p.end_week || row.raw?.[p.period_no]);
  const input: RuleInput = {
    dispositif: (DISPOSITIFS as readonly string[]).includes(row.dispositif) ? (row.dispositif as Dispositif) : null,
    campaign_code: row.campaign_code || null,
    sector_id: row.sector_id,
    position_label: row.position_label.trim() || null,
    weekly_hours: row.weekly_hours ? Number(row.weekly_hours) : null,
    priority: row.priority === '1' || row.priority === '2' || row.priority === '3' ? (Number(row.priority) as 1 | 2 | 3) : null,
    periods,
    days: row.days,
    hours_slot: row.hours_slot.trim() || null,
    store_codes: row.store_codes,
    client_comment: row.client_comment.trim() || null,
  };
  if (row.raw && (row.raw[1] || row.raw[2])) {
    const raw: NonNullable<RuleInput['raw']> = {};
    if (row.raw[1]) raw[1] = row.raw[1];
    if (row.raw[2]) raw[2] = row.raw[2];
    input.raw = raw;
  }
  return input as RuleInput & { sector_id: string };
}

export interface BatchSummary {
  /** Lignes saisies (les lignes vides sont comptées à part et ignorées à l'enregistrement). */
  filled: number;
  ignored: number;
  complete: number;
  incomplete: Array<{ index: number; missing: string[] }>;
  withPasteIssues: number[];
  /** Somme des heures par semaine des lignes complètes. */
  weeklyHours: number;
  byDispositif: Partial<Record<Dispositif, number>>;
  storeCount: number;
}

/** Résumé affiché avant soumission : contrôle de complétude seulement, les règles complètes s'appliquent côté données. */
export function summariseBatch(rows: readonly BatchRow[], fixedSectorId?: string): BatchSummary {
  const out: BatchSummary = {
    filled: 0, ignored: 0, complete: 0, incomplete: [], withPasteIssues: [], weeklyHours: 0, byDispositif: {}, storeCount: 0,
  };
  rows.forEach((row, index) => {
    if (isEmptyBatchRow(row, fixedSectorId)) {
      out.ignored++;
      return;
    }
    out.filled++;
    if (row.paste_issues && row.paste_issues.length > 0) out.withPasteIssues.push(index);
    const input = rowToInput(row);
    const missing: string[] = missingFields(input);
    if (!row.sector_id) missing.push('sector');
    if (missing.length > 0) {
      out.incomplete.push({ index, missing });
      return;
    }
    out.complete++;
    out.weeklyHours += input.weekly_hours ?? 0;
    out.storeCount += input.store_codes.length;
    if (input.dispositif) out.byDispositif[input.dispositif] = (out.byDispositif[input.dispositif] ?? 0) + 1;
  });
  return out;
}
