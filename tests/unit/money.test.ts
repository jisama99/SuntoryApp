import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoneyInput } from '@/lib/money';

describe('saisie d\'un montant', () => {
  it.each([
    ['125000', 125000], ['125 000,50', 125000.5], ['125000.5', 125000.5], ['1,200.75', 1200.75], ['1.200,75', 1200.75], ['1,200,000', 1200000], ['0', 0], ['0,05', 0.05],
    ['\u00a0120\u00a0000', 120000], ['7,5', 7.5], ['100000', 100000],
  ])('« %s » donne %s', (raw, expected) => expect(parseMoneyInput(raw)).toBe(expected));
  it.each(['', '  ', 'abc', '12,345', '1.200', '12,3456', '-5', '12 €', '1e3', '12,50,60', '1,2,3'])('« %s » n\'est pas un montant (null, jamais 0)', (raw) => {
    expect(parseMoneyInput(raw)).toBeNull();
  });
});

describe('affichage d\'un montant', () => {
  it('suit la langue, en euros', () => {
    expect(formatMoney(123456, 'fr').replace(/[\s  ]/g, ' ')).toBe('1 234,56 €');
    expect(formatMoney(123456, 'en')).toBe('€1,234.56');
    expect(formatMoney(-5000, 'fr')).toContain('-50,00');
    expect(formatMoney(0, 'fr')).toContain('0,00');
  });
});
