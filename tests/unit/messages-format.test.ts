import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import { evaluateSingleNeedRules } from '@/domain/week-rules';
import { keepTogether } from '@/lib/format';
import { env, input, period } from './needs-util';

const format = (lang: 'fr' | 'en', text: string, values: Record<string, string | number>) =>
  String(new IntlMessageFormat(text, lang === 'fr' ? 'fr-FR' : 'en-GB').format(values));

describe('W17 : pluriel du nombre de jours', () => {
  const days = (start: string) => {
    const f = evaluateSingleNeedRules(input({ periods: [period(1, start, '2027-01-31')] }), env()).find((x) => x.rule === 'W17');
    return f ? Number(f.params.days) : null;
  };

  it('une période qui commence un dimanche compte 1 jour, un jeudi 4 jours, un mercredi 5 jours', () => {
    expect(days('2026-11-08')).toBe(1);
    expect(days('2026-11-05')).toBe(4);
    expect(days('2026-11-04')).toBe(5);
  });

  it.each([
    ['fr', 1, '1 jour sur 7'],
    ['fr', 3, '3 jours sur 7'],
    ['en', 1, '1 day out of 7'],
    ['en', 3, '3 days out of 7'],
  ] as const)('%s : %i jour(s)', (lang, n, expected) => {
    const text = (lang === 'fr' ? fr : en).rules.W17;
    expect(format(lang, text, { days: n, of: 7, week: '2026-S45' })).toContain(expected);
  });
});

describe('code de besoin dans un titre', () => {
  it('le tiret insécable remplace le tiret : le code ne se coupe plus', () => {
    const out = keepTogether('BES-DEMO-032');
    expect(out).toBe('BES‑DEMO‑032');
    expect(out).not.toContain('-');
    expect(out.replaceAll('‑', '-')).toBe('BES-DEMO-032');
  });
});
