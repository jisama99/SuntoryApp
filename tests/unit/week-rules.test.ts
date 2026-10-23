import { describe, expect, it } from 'vitest';
import { applyGravities, DEFAULT_RULE_CONFIG, WEEK_RULE_IDS } from '@/domain/rules';
import type { RuleId } from '@/domain/rules';
import { evaluateSingleNeedRules } from '@/domain/week-rules';
import type { RuleInput } from '@/domain/week-rules';
import { env, input, period, rawPeriod } from './needs-util';

/** Règles déclenchées par un besoin, avec les paramètres de l'environnement de test. */
function rules(i: RuleInput, e = env()): RuleId[] {
  return [...new Set(evaluateSingleNeedRules(i, e).map((f) => f.rule))];
}

type Case = { name: string; input: RuleInput; env?: ReturnType<typeof env>; fires: boolean };

const SEASONAL = { dispositif: 'seasonal', window_start: '2026-11-02', window_end: '2027-01-10' };

// Un tableau par règle : au moins un cas qui déclenche et un cas qui ne déclenche pas (V0.4, C.WEEKS).
const TABLE: Record<string, Case[]> = {
  W1: [
    { name: 'semaine 54', input: input({ periods: [rawPeriod(1, { start_week: '2026-S54' })] }), fires: true },
    { name: '2027-S53 (2027 compte 52 semaines)', input: input({ periods: [rawPeriod(1, { start_week: '2027-S53' })] }), fires: true },
    { name: 'semaine 00', input: input({ periods: [rawPeriod(1, { start_week: '2026-S00' })] }), fires: true },
    { name: 'saisie brute 99', input: { ...input({ periods: [rawPeriod(1, {})] }), raw: { 1: { start_week: '99' } } }, fires: true },
    { name: '2026-S53 existe', input: input({ periods: [rawPeriod(1, { start_week: '2026-S53' })] }), fires: false },
  ],
  W2: [
    { name: 'saisie brute « 2 » pour le 04/01/2027 (numéro de tableur)', input: { ...input({ periods: [rawPeriod(1, { start_date: '2027-01-04' })] }), raw: { 1: { start_week: '2' } } }, fires: true },
    { name: 'saisie brute « 1 » pour le 04/01/2027 (numéro ISO)', input: { ...input({ periods: [rawPeriod(1, { start_date: '2027-01-04' })] }), raw: { 1: { start_week: '1' } } }, fires: false },
    { name: 'semaine choisie au calendrier : relève de W5, pas de W2', input: input({ periods: [rawPeriod(1, { start_date: '2027-01-04', start_week: '2027-S02' })] }), fires: false },
  ],
  W3: [
    { name: '2024-S01 pour le 30/12/2024 (année civile au lieu de 2025)', input: input({ periods: [rawPeriod(1, { start_date: '2024-12-30', start_week: '2024-S01' })] }), fires: true },
    { name: '2025-S01 pour le 30/12/2024', input: input({ periods: [rawPeriod(1, { start_date: '2024-12-30', start_week: '2025-S01' })] }), fires: false },
  ],
  W4: [
    { name: '01/01/2027 est en 2026-S53', input: input({ periods: [period(1, '2027-01-01', '2027-01-10')] }), fires: true },
    { name: '30/12/2024 est en 2025-S01', input: input({ periods: [period(1, '2024-12-30', '2025-01-05')] }), fires: true },
    { name: '28/12/2026 reste en 2026', input: input({ periods: [period(1, '2026-12-28', '2027-01-03')] }), fires: false },
  ],
  W5: [
    { name: 'date en S45, semaine S46', input: input({ periods: [rawPeriod(1, { start_date: '2026-11-02', start_week: '2026-S46' })] }), fires: true },
    { name: 'date en S45, semaine S45', input: input({ periods: [rawPeriod(1, { start_date: '2026-11-02', start_week: '2026-S45' })] }), fires: false },
  ],
  W6: [
    { name: 'fin avant début', input: input({ periods: [rawPeriod(1, { start_date: '2026-11-10', end_date: '2026-11-03' })] }), fires: true },
    { name: 'semaine de fin avant semaine de début', input: input({ periods: [rawPeriod(1, { start_week: '2026-S46', end_week: '2026-S45' })] }), fires: true },
    { name: 'début et fin le même jour', input: input({ periods: [rawPeriod(1, { start_date: '2026-11-03', end_date: '2026-11-03' })] }), fires: false },
  ],
  W7: [
    { name: 'trois semaines avec une seule semaine renseignée', input: input({ periods: [rawPeriod(1, { start_date: '2026-11-02', end_date: '2026-11-22', start_week: '2026-S45' })] }), fires: true },
    { name: 'deux semaines renseignées', input: input({ periods: [period(1, '2026-11-02', '2026-11-22')] }), fires: false },
  ],
  W8: [
    { name: 'cinq jours à cheval sur deux semaines', input: input({ periods: [period(1, '2026-11-05', '2026-11-09')] }), fires: true },
    { name: 'dans la même semaine', input: input({ periods: [period(1, '2026-11-02', '2026-11-06')] }), fires: false },
    { name: 'huit jours', input: input({ periods: [period(1, '2026-11-05', '2026-11-12')] }), fires: false },
  ],
  W9: [
    { name: 'aucune période', input: input({ periods: [] }), fires: true },
    { name: 'période vide', input: input({ periods: [rawPeriod(1, {})] }), fires: true },
    { name: 'une semaine seule suffit', input: input({ periods: [rawPeriod(1, { start_week: '2026-S45' })] }), fires: false },
  ],
  W10: [
    { name: 'semaine passée (S42)', input: input({ periods: [period(1, '2026-10-12', '2026-10-18')] }), fires: true },
    { name: 'semaine en cours (S43)', input: input({ periods: [period(1, '2026-10-26', '2026-11-01')] }), fires: false },
  ],
  W11: [
    { name: 'plus de 52 semaines', input: input({ periods: [period(1, '2027-12-06', '2027-12-12')] }), fires: true },
    { name: 'horizon paramétré à 4 semaines', input: input({ periods: [period(1, '2026-12-14', '2026-12-20')] }), env: env({ config: { horizonWeeks: 4 } }), fires: true },
    { name: 'dans dix semaines', input: input({ periods: [period(1, '2027-01-04', '2027-01-10')] }), fires: false },
  ],
  W12: [
    { name: 'semaine clôturée', input: input({ periods: [period(1, '2026-10-05', '2026-10-11')] }), env: env({ closedWeeks: new Set(['2026-S41']) }), fires: true },
    { name: 'période à cheval sur la semaine clôturée', input: input({ periods: [period(1, '2026-10-08', '2026-10-14')] }), env: env({ closedWeeks: new Set(['2026-S41']) }), fires: true },
    { name: 'semaine ouverte', input: input({ periods: [period(1, '2026-10-26', '2026-11-01')] }), env: env({ closedWeeks: new Set(['2026-S41']) }), fires: false },
  ],
  W13: [
    { name: '« S5 »', input: { ...input({ periods: [rawPeriod(1, { start_week: '2026-S05' })] }), raw: { 1: { start_week: 'S5' } } }, fires: true },
    { name: '« 5 »', input: { ...input({ periods: [rawPeriod(1, { start_week: '2026-S05' })] }), raw: { 1: { start_week: '5' } } }, fires: true },
    { name: 'format stocké', input: { ...input({ periods: [rawPeriod(1, { start_week: '2026-S05' })] }), raw: { 1: { start_week: '2026-S05' } } }, fires: false },
  ],
  W14: [
    { name: 'jour et mois ambigus', input: { ...input(), raw: { 1: { start_date: '03/04/2026' } } }, fires: true },
    { name: 'mois en premier', input: { ...input(), raw: { 1: { start_date: '12/25/2026' } } }, fires: true },
    { name: 'jour en premier sans ambiguïté', input: { ...input(), raw: { 1: { start_date: '25/12/2026' } } }, fires: false },
  ],
  W15: [
    { name: 'numéro de série de tableur', input: { ...input(), raw: { 1: { end_date: '123456' } } }, fires: true },
    { name: 'texte', input: { ...input(), raw: { 1: { start_date: 'demain' } } }, fires: true },
    { name: 'date ISO', input: { ...input(), raw: { 1: { start_date: '2026-11-02' } } }, fires: false },
  ],
  W16: [
    { name: 'début un dimanche', input: input({ periods: [period(1, '2026-11-08', '2026-11-14')] }), fires: true },
    { name: 'début un jour férié', input: input({ periods: [period(1, '2026-11-11', '2026-11-15')] }), fires: true },
    { name: 'férié toléré par la configuration', input: input({ periods: [period(1, '2026-11-11', '2026-11-15')] }), env: env({ config: { excludeHolidays: false } }), fires: false },
    { name: 'début un lundi ordinaire', input: input({ periods: [period(1, '2026-11-02', '2026-11-08')] }), fires: false },
  ],
  W17: [
    { name: 'début un mercredi', input: input({ periods: [period(1, '2026-11-04', '2026-11-08')] }), fires: true },
    { name: 'début un lundi', input: input({ periods: [period(1, '2026-11-02', '2026-11-08')] }), fires: false },
  ],
  W18: [
    { name: 'P2 commence avant la fin de P1', input: input({ periods: [period(1, '2026-11-02', '2026-11-15'), period(2, '2026-11-10', '2026-11-20')] }), fires: true },
    { name: 'P2 commence le dernier jour de P1', input: input({ periods: [period(1, '2026-11-02', '2026-11-15'), period(2, '2026-11-15', '2026-11-20')] }), fires: true },
    { name: 'P2 commence le lendemain', input: input({ periods: [period(1, '2026-11-02', '2026-11-15'), period(2, '2026-11-16', '2026-11-20')] }), fires: false },
  ],
  W19: [
    { name: 'P2 avant P1', input: input({ periods: [period(1, '2026-11-16', '2026-11-22'), period(2, '2026-11-02', '2026-11-08')] }), fires: true },
    { name: 'ordre normal', input: input({ periods: [period(1, '2026-11-02', '2026-11-08'), period(2, '2026-11-16', '2026-11-22')] }), fires: false },
  ],
  W20: [
    { name: 'début avant la date de saisie, dans la semaine en cours', input: input({ periods: [period(1, '2026-10-20', '2026-10-30')] }), fires: true },
    { name: 'hors fenêtre de campagne non saisonnière', input: input({ periods: [period(1, '2027-06-28', '2027-07-05')] }), env: env({ campaign: { dispositif: 'hourly_merch', window_start: '2026-09-01', window_end: '2027-06-30' } }), fires: true },
    { name: 'dans la campagne et à venir', input: input({ periods: [period(1, '2026-11-02', '2026-11-08')] }), env: env({ campaign: { dispositif: 'hourly_merch', window_start: '2026-09-01', window_end: '2027-06-30' } }), fires: false },
  ],
  W21: [
    { name: 'saisonnier qui dépasse la fenêtre', input: input({ dispositif: 'seasonal', periods: [period(1, '2026-12-28', '2027-01-17')] }), env: env({ campaign: SEASONAL }), fires: true },
    { name: 'saisonnier dans la fenêtre', input: input({ dispositif: 'seasonal', periods: [period(1, '2026-11-30', '2026-12-13')] }), env: env({ campaign: SEASONAL }), fires: false },
    { name: 'dispositif non saisonnier', input: input({ periods: [period(1, '2026-12-28', '2027-01-17')] }), env: env({ campaign: { ...SEASONAL, dispositif: 'permanent' } }), fires: false },
  ],
  B1: [
    { name: 'avant la borne basse', input: input({ periods: [period(1, '2025-12-29', '2026-01-04')] }), fires: true },
    { name: 'après la borne haute', input: input({ periods: [period(1, '2029-01-01', '2029-01-07')] }), fires: true },
    { name: 'dans les bornes', input: input(), fires: false },
  ],
  J1: [
    { name: 'samedi seul sur une période du lundi au vendredi', input: input({ days: [6], periods: [period(1, '2026-11-02', '2026-11-06')] }), fires: true },
    { name: 'jours présents', input: input(), fires: false },
  ],
  J2: [
    { name: 'mercredi férié sur toute la période', input: input({ days: [3], periods: [period(1, '2026-11-11', '2026-11-11')] }), fires: true },
    { name: 'plusieurs mercredis dont un férié', input: input({ days: [3], periods: [period(1, '2026-11-04', '2026-11-18')] }), fires: false },
  ],
  J3: [
    { name: 'dimanche coché alors qu\'il est désactivé', input: input({ days: [1, 7] }), fires: true },
    { name: 'dimanche autorisé par le dispositif', input: input({ days: [1, 7] }), env: env({ config: { daysAllowed: [1, 2, 3, 4, 5, 6, 7] } }), fires: false },
    { name: 'lundi à samedi', input: input({ days: [1, 6] }), fires: false },
  ],
};

describe('règles de semaine, table par table (V0.4 C.WEEKS)', () => {
  for (const [rule, cases] of Object.entries(TABLE)) {
    describe(rule, () => {
      for (const c of cases) {
        it(`${c.fires ? 'déclenche' : 'ne déclenche pas'} : ${c.name}`, () => {
          const got = rules(c.input, c.env ?? env());
          if (c.fires) expect(got).toContain(rule as RuleId);
          else expect(got).not.toContain(rule as RuleId);
        });
      }
    });
  }

  it('chaque règle W1 à W21 a au moins un cas qui déclenche et un cas qui ne déclenche pas (W22 : duplicates.test.ts)', () => {
    const covered = WEEK_RULE_IDS.filter((r) => r !== 'W22');
    for (const r of covered) {
      const cases = TABLE[r] ?? [];
      expect(cases.some((c) => c.fires), `${r} déclenche`).toBe(true);
      expect(cases.some((c) => !c.fires), `${r} ne déclenche pas`).toBe(true);
    }
  });
});

describe('cas de recoupement entre règles', () => {
  it('W3 explique l\'écart d\'année : W5 se tait', () => {
    const got = rules(input({ periods: [rawPeriod(1, { start_date: '2024-12-30', start_week: '2024-S01' })] }));
    expect(got).toContain('W3');
    expect(got).not.toContain('W5');
  });
  it('W2 explique le numéro de tableur : W5 se tait', () => {
    const got = rules({ ...input({ periods: [rawPeriod(1, { start_date: '2027-01-04' })] }), raw: { 1: { start_week: '2027-S02' } } });
    expect(got).toContain('W2');
    expect(got).not.toContain('W5');
  });
  it('une semaine décalée choisie au calendrier donne W5 et sa correction', () => {
    const got = rules(input({ periods: [rawPeriod(1, { start_date: '2027-01-04', start_week: '2027-S02' })] }));
    expect(got).toContain('W5');
    expect(got).not.toContain('W2');
  });
  it('W5 propose en un clic la semaine déduite de la date', () => {
    const f = evaluateSingleNeedRules(input({ periods: [rawPeriod(1, { start_date: '2026-11-02', start_week: '2026-S46' })] }), env());
    expect(f.find((x) => x.rule === 'W5')?.fix).toEqual({ periodNo: 1, field: 'start_week', value: '2026-S45' });
  });
  it('un besoin du 28/12/2026 au 10/01/2027 traverse S53 et S01 sans alerte de numérotation', () => {
    const got = rules(input({ periods: [period(1, '2026-12-28', '2027-01-10')] }));
    for (const r of ['W1', 'W2', 'W3', 'W5', 'W6'] as const) expect(got).not.toContain(r);
  });
});

describe('gravités paramétrables', () => {
  it('gravités par défaut de la V0.4', () => {
    const g = DEFAULT_RULE_CONFIG.gravities;
    expect(['W1', 'W5', 'W6', 'W9', 'W12', 'W14', 'W15', 'W18'].every((r) => g[r as RuleId] === 'blocking')).toBe(true);
    expect(['W4', 'W7', 'W10', 'W13', 'W16', 'W19', 'W20', 'W21', 'W22'].every((r) => g[r as RuleId] === 'alert')).toBe(true);
    expect(['W8', 'W11', 'W17'].every((r) => g[r as RuleId] === 'info')).toBe(true);
  });
  it('une règle peut être rétrogradée ou désactivée sans toucher au code', () => {
    const raw = evaluateSingleNeedRules(input({ periods: [period(1, '2026-11-08', '2026-11-14')] }), env());
    expect(applyGravities(raw, DEFAULT_RULE_CONFIG).find((f) => f.rule === 'W16')?.gravity).toBe('alert');
    const info = { ...DEFAULT_RULE_CONFIG, gravities: { ...DEFAULT_RULE_CONFIG.gravities, W16: 'info' as const } };
    expect(applyGravities(raw, info).find((f) => f.rule === 'W16')?.gravity).toBe('info');
    const off = { ...DEFAULT_RULE_CONFIG, gravities: { ...DEFAULT_RULE_CONFIG.gravities, W16: 'off' as const } };
    expect(applyGravities(raw, off).some((f) => f.rule === 'W16')).toBe(false);
  });
});
