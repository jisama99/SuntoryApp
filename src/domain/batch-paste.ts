import type { BatchRow } from '@/data/schemas';
import { emptyBatchRow } from './batch';
import { DISPOSITIFS } from './types';
import type { Dispositif } from './types';
import { isStoredWeek, parseDateInput } from './week';

/**
 * Collage depuis un tableur (F-20.2). Chaque ligne collée devient une ligne du tableau. Une valeur qui ne se convertit
 * pas n'est jamais perdue en silence : la cellule reste vide et une explication est attachée à la ligne (`paste_issues`),
 * qui reste non enregistrable tant qu'elle n'est pas corrigée.
 *
 * Colonnes, dans l'ordre : [Secteur,] Dispositif, Campagne, Poste, Priorité, Heures, Début, Fin, Semaine début,
 * Semaine fin, Jours, Créneau, Magasins, Commentaire. La colonne Secteur n'existe que pour un profil à plusieurs secteurs.
 */
export const PASTE_COLUMNS = [
  'dispositif', 'campaign', 'position', 'priority', 'hours', 'start', 'end', 'startWeek', 'endWeek', 'days', 'slot', 'stores', 'comment',
] as const;
export type PasteColumn = (typeof PASTE_COLUMNS)[number];

export type PasteIssueCode =
  | 'unknown_sector' | 'unknown_dispositif' | 'unknown_campaign' | 'unknown_position' | 'unknown_priority'
  | 'unknown_hours' | 'unknown_day' | 'too_long';

export interface PasteContext {
  /** Secteurs reconnus par leur code (profil à plusieurs secteurs). Vide pour un RS. */
  sectors: ReadonlyArray<{ id: string; code: string }>;
  /** Secteur imposé (RS) ou null. */
  fixedSectorId: string | null;
  /** Libellés acceptés pour chaque dispositif (français, anglais, code), en minuscules. */
  dispositifNames: Readonly<Record<string, Dispositif>>;
  campaignCodes: readonly string[];
  hoursAllowed: readonly number[];
}

export interface PasteResult {
  rows: BatchRow[];
  /** Lignes entièrement vides, non reprises. */
  blankLines: number;
  headerSkipped: boolean;
}

const DAY_NAMES: Record<string, number> = {
  lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6, dim: 7,
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7,
};

/** Normalisation des libellés collés : sans accents, en minuscules, sans espaces de bord. */
export const normalizeToken = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Jours collés : LUN;MAR, Mon Tue, 1,3,5. Renvoie les jours reconnus et les jetons inconnus. */
export function parseDays(text: string): { days: number[]; unknown: string[] } {
  const days = new Set<number>();
  const unknown: string[] = [];
  for (const token of text.split(/[;,/\s]+/).filter(Boolean)) {
    const t = normalizeToken(token);
    const n = /^[1-7]$/.test(t) ? Number(t) : DAY_NAMES[t.slice(0, 3)];
    if (n && (t.length === 1 || t.length >= 3)) days.add(n);
    else unknown.push(token);
  }
  return { days: [...days].sort((a, b) => a - b), unknown };
}

export function parsePaste(text: string, ctx: PasteContext): PasteResult {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') lines.pop();
  const useTab = lines.some((l) => l.includes('\t'));
  const split = (l: string) => (useTab ? l.split('\t') : l.split(';')).map((c) => c.trim());
  const hasSector = ctx.fixedSectorId === null;

  let headerSkipped = false;
  const first = lines[0] ? split(lines[0]).map(normalizeToken) : [];
  if (first.some((c) => ['dispositif', 'campagne', 'campaign', 'secteur', 'sector'].includes(c))) {
    lines.shift();
    headerSkipped = true;
  }

  const rows: BatchRow[] = [];
  let blankLines = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      blankLines++;
      continue;
    }
    const cells = split(line);
    let i = 0;
    const next = () => cells[i++] ?? '';
    const row = emptyBatchRow(ctx.fixedSectorId ?? '');
    const issues: NonNullable<BatchRow['paste_issues']> = [];
    const issue = (column: string, raw: string, code: PasteIssueCode) => issues.push({ column, raw: raw.slice(0, 80), kind: code });

    if (hasSector) {
      const raw = next();
      if (raw) {
        const found = ctx.sectors.find((s) => s.code.toLowerCase() === raw.toLowerCase());
        if (found) row.sector_id = found.id;
        else issue('sector', raw, 'unknown_sector');
      }
    }

    const disp = next();
    if (disp) {
      const d = ctx.dispositifNames[normalizeToken(disp)];
      if (d && (DISPOSITIFS as readonly string[]).includes(d)) row.dispositif = d;
      else issue('dispositif', disp, 'unknown_dispositif');
    }

    const camp = next();
    if (camp) {
      const c = ctx.campaignCodes.find((k) => k.toLowerCase() === camp.toLowerCase());
      if (c) row.campaign_code = c;
      else issue('campaign', camp, 'unknown_campaign');
    }

    const pos = next();
    if (pos) {
      const m = /^(?:poste\s*|position\s*)?([1-7])$/i.exec(pos);
      if (m) row.position_label = `Poste ${m[1]}`;
      else issue('position', pos, 'unknown_position');
    }

    const prio = next();
    if (prio) {
      if (/^[123]$/.test(prio)) row.priority = prio;
      else issue('priority', prio, 'unknown_priority');
    }

    const hours = next();
    if (hours) {
      const n = Number(hours.replace(',', '.').replace(/\s*h$/i, ''));
      if (Number.isInteger(n) && ctx.hoursAllowed.includes(n)) row.weekly_hours = String(n);
      else issue('hours', hours, 'unknown_hours');
    }

    const raw1: NonNullable<BatchRow['raw']>[1] = {};
    const period = row.periods[0]!;
    for (const [side, text] of [['start', next()], ['end', next()]] as const) {
      if (!text) continue;
      const parsed = parseDateInput(text);
      if (parsed.kind === 'iso') period[side === 'start' ? 'start_date' : 'end_date'] = parsed.date;
      else raw1[side === 'start' ? 'start_date' : 'end_date'] = text; // W14 ou W15 : le moteur de règles explique le rejet
    }
    for (const [side, text] of [['start', next()], ['end', next()]] as const) {
      if (!text) continue;
      raw1[side === 'start' ? 'start_week' : 'end_week'] = text; // W2, W5, W13 : normalisation et contrôles du moteur
      if (isStoredWeek(text)) period[side === 'start' ? 'start_week' : 'end_week'] = text;
    }
    if (Object.keys(raw1).length > 0) row.raw = { 1: raw1 };

    const daysText = next();
    if (daysText) {
      const { days, unknown } = parseDays(daysText);
      row.days = days;
      for (const u of unknown) issue('days', u, 'unknown_day');
    }

    row.hours_slot = next().slice(0, 40);
    row.store_codes = next().split(/[;,\s]+/).filter(Boolean).map((c) => c.toUpperCase()).slice(0, 60);
    const comment = next();
    row.client_comment = comment.slice(0, 280);
    if (comment.length > 280) issue('comment', comment, 'too_long');

    if (issues.length > 0) row.paste_issues = issues;
    rows.push(row);
  }
  return { rows, blankLines, headerSkipped };
}
