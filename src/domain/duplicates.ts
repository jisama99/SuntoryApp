import type { Need } from '@/data/schemas';
import type { RawFinding } from './rules';
import { resolvePeriod } from './week-rules';
import type { ResolvedPeriod } from './week-rules';
import { addDays, weeksBetween } from './week';
import type { IsoDate } from './week';

/** Besoin candidat : le besoin saisi, avec ses périodes résolues. */
export interface DupCandidate {
  id: string | null;
  need_code: string | null;
  source_record_id: string | null;
  sector_id: string;
  dispositif: string | null;
  position_label: string | null;
  weekly_hours: number | null;
  hours_slot: string | null;
  store_codes: string[];
  periods: ResolvedPeriod[];
}

interface Span {
  start: IsoDate;
  end: IsoDate;
}

const spans = (periods: ResolvedPeriod[]): Span[] =>
  periods.flatMap((p) => (p.start && p.end && p.end >= p.start ? [{ start: p.start, end: p.end }] : []));

const overlaps = (a: Span, b: Span) => a.start <= b.end && b.start <= a.end;
const same = (a: Span, b: Span) => a.start === b.start && a.end === b.end;
const inside = (a: Span, b: Span) => a.start >= b.start && a.end <= b.end;
const contiguous = (a: Span, b: Span) => addDays(a.end, 1) === b.start || addDays(b.end, 1) === a.start;

const norm = (s: string | null) => (s ?? '').trim().toLowerCase();

/** Doublon exact : mêmes dates, mêmes heures par semaine, même créneau horaire. */
function sameHours(c: DupCandidate, e: Need): boolean {
  return c.weekly_hours === e.weekly_hours && norm(c.hours_slot) === norm(e.hours_slot);
}

/**
 * D1 à D7 et W22 : compare le candidat aux besoins existants (périmètre complet : une règle ne se contourne pas en
 * changeant de profil). « Même type » = même dispositif ; « même intitulé » = même libellé de poste [hypothèses A2a,
 * le dictionnaire ne porte ni champ « type » ni champ « intitulé »].
 * Un seul constat par règle et par besoin existant ; W22 s'efface devant D1, D2 et D3.
 */
export function findDuplicates(candidate: DupCandidate, existing: Need[]): RawFinding[] {
  const out: RawFinding[] = [];
  const candSpans = spans(candidate.periods);

  for (const e of existing) {
    if (candidate.id !== null && e.id === candidate.id) continue;
    const found = new Set<string>();
    const add = (f: RawFinding) => {
      if (found.has(f.rule)) return;
      found.add(f.rule);
      out.push({ ...f, relatedNeedId: e.id });
    };

    if (
      (candidate.source_record_id !== null && e.source_record_id === candidate.source_record_id) ||
      (candidate.need_code !== null && e.need_code === candidate.need_code)
    ) {
      add({ rule: 'D7', params: { code: e.need_code } });
    }

    const sameSector = e.sector_id === candidate.sector_id;
    const sameType = candidate.dispositif !== null && e.dispositif === candidate.dispositif;
    const eSpans = spans(e.periods.map(resolvePeriod));

    for (const a of candSpans) {
      for (const b of eSpans) {
        if (sameSector && sameType) {
          if (same(a, b) && sameHours(candidate, e)) add({ rule: 'D1', params: { code: e.need_code } });
          else if (overlaps(a, b) && (inside(a, b) || inside(b, a))) add({ rule: 'D3', params: { code: e.need_code } });
          else if (overlaps(a, b)) add({ rule: 'D2', params: { code: e.need_code } });
          else if (contiguous(a, b)) add({ rule: 'D4', params: { code: e.need_code } });
        }
        if (!sameSector && overlaps(a, b)) {
          const shared = candidate.store_codes.find((s) => e.store_codes.includes(s));
          if (shared) add({ rule: 'D5', params: { store: shared, code: e.need_code } });
        }
        if (
          sameSector && candidate.position_label !== null && norm(candidate.position_label) === norm(e.position_label) &&
          !overlaps(a, b) && !contiguous(a, b)
        ) {
          add({ rule: 'D6', params: { code: e.need_code } });
        }
      }
    }

    if (sameSector && sameType && !found.has('D1') && !found.has('D2') && !found.has('D3')) {
      const candWeeks = new Set(candSpans.flatMap((s) => weeksBetween(s.start, s.end)));
      const shared = eSpans.flatMap((s) => weeksBetween(s.start, s.end)).find((w) => candWeeks.has(w));
      if (shared) add({ rule: 'W22', params: { week: shared, code: e.need_code } });
    }
  }
  return out;
}
