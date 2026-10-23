import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import { HOLIDAY_KEYS } from '@/domain/holidays';
import { DISPOSITIFS } from '@/domain/types';
import { MISSING_FIELDS } from '@/domain/need-check';
import { GRAVITIES, RULE_IDS } from '@/domain/rules';
import { flatten, read, rel, ROOT, walk } from './util';

const SRC = walk(path.join(ROOT, 'src'), (f) => /\.(ts|tsx)$/.test(f));
const TSX = SRC.filter((f) => f.endsWith('.tsx'));
const PICKERS = `src${path.sep}components${path.sep}pickers${path.sep}`;
const outsidePickers = (files: string[]) => files.filter((f) => !rel(f).startsWith(PICKERS));

describe('dates (D133, règle commune 12) : aucune date tapée à la main', () => {
  it('aucun champ natif de date, de semaine ou de mois dans le code', () => {
    const bad = TSX.filter((f) => /type=["'](date|datetime-local|month|week)["']/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it('hors des sélecteurs, aucun champ de saisie dont l\'identifiant ou le nom évoque une date, une semaine ou une période', () => {
    const offenders: string[] = [];
    for (const f of outsidePickers(TSX)) {
      const sf = ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const visit = (node: ts.Node) => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const tag = node.tagName.getText();
          if (['input', 'Field', 'textarea', 'TextareaField'].includes(tag)) {
            for (const a of node.attributes.properties) {
              if (!ts.isJsxAttribute(a) || !['id', 'name', 'label'].includes(a.name.getText())) continue;
              const txt = a.initializer ? a.initializer.getText() : '';
              if (/date|week|semaine|period|start|end/i.test(txt)) offenders.push(`${rel(f)}: <${tag} ${a.name.getText()}=${txt}>`);
            }
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
    }
    expect(offenders).toEqual([]);
  });

  it('le jour courant vient de l\'horloge de démonstration, jamais de l\'horloge du poste', () => {
    const bad = SRC.filter((f) => /new Date\(\)|Date\.now\(\)/.test(read(f))).map(rel);
    expect(bad).toEqual([]);
  });

  it('les écrans de saisie utilisent les sélecteurs communs', () => {
    const form = read(path.join(ROOT, 'src/components/NeedForm.tsx'));
    for (const c of ['DateRangePicker', 'DerivedWeek', 'WeekdayPicker']) expect(form).toContain(`<${c}`);
    // D146 : les semaines ne sont plus des champs demandés, le sélecteur de semaine n'ouvre que par « corriger la semaine ».
    expect(form).not.toContain('<WeekPicker');
    expect(read(path.join(ROOT, 'src/components/pickers/DerivedWeek.tsx'))).toContain('<WeekPicker');
    expect(read(path.join(ROOT, 'src/components/DuplicateForm.tsx'))).toContain('<DatePicker');
  });

  it('le calendrier affiche le numéro de semaine ISO, désactive les jours avec une raison écrite et gère le clavier', () => {
    const cal = read(path.join(ROOT, 'src/components/pickers/Calendar.tsx'));
    for (const k of ['ArrowLeft', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) expect(cal).toContain(k);
    expect(cal).toContain('isoWeekOf');
    expect(cal).toContain('disabledReason');
    expect(cal).toContain('size-11');
  });
});

describe('messages des règles et des écrans de saisie, dans les deux langues', () => {
  const F = flatten(fr);
  const E = flatten(en);
  const both = (key: string) => {
    expect(F[key], `fr ${key}`).toBeTruthy();
    expect(E[key], `en ${key}`).toBeTruthy();
  };
  it('un message pour chaque règle W, D, J et B', () => {
    for (const r of RULE_IDS) both(`rules.${r}`);
  });
  it('gravités, dispositifs, champs manquants, jours fériés, motifs de refus', () => {
    for (const g of GRAVITIES) both(`gravity.${g}`);
    for (const d of DISPOSITIFS) both(`dispositif.${d}`);
    for (const m of MISSING_FIELDS) both(`form.missing.${m}`);
    for (const h of HOLIDAY_KEYS) both(`picker.holiday.${h}`);
    for (const r of ['forbidden', 'out_of_scope', 'invalid_store', 'campaign_mismatch', 'not_found', 'not_draft', 'no_period', 'blocked']) {
      both(`form.refusal.${r}`);
    }
    for (const s of ['draft', 'submit', 'merge']) {
      both(`form.saved.${s}.title`);
      both(`form.saved.${s}.body`);
    }
  });
});
