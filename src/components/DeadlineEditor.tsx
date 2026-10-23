'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { setDefaultPresetAction, updateDeadlineAction } from '@/app/[locale]/settings/actions';
import type { DeadlineContext } from '@/data/repository';
import { calendarOf } from '@/domain/deadlines';
import { DEADLINE_TYPES, PRESET_IDS } from '@/domain/types';
import type { Locale, PresetId } from '@/domain/types';
import { addDays } from '@/domain/week';
import { addMonths, monthOf, monthStart } from '@/domain/working-days';
import { formatMonth } from '@/lib/format';
import { Button } from './Button';
import { DatePicker } from './pickers/DatePicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';

/**
 * Calendrier d'échéances (D80) : preset par défaut, puis preset ou date fixe pour un mois et un type. Agence
 * administration seule. La date fixe se choisit dans le calendrier : les jours non ouvrés et les fériés sont désactivés
 * avec leur raison, et la date doit précéder le début du mois cible.
 */
export function DeadlineEditor({ context }: { context: DeadlineContext }) {
  const t = useTranslations('deadline');
  const locale = useLocale() as Locale;
  const [preset, setPreset] = useState<string>(context.settings.default_preset);
  const [month, setMonth] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [entryPreset, setEntryPreset] = useState('');
  const [fixed, setFixed] = useState<string | null>(null);
  const [res, setRes] = useState<{ where: 'preset' | 'entry'; value: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const months = Array.from({ length: 6 }, (_, i) => addMonths(monthOf(context.today), i + 1));
  const calendar = calendarOf(context.settings);
  const sync = (v: string) => (v === 'ok' ? 'ok' : v);

  const savePreset = () =>
    startTransition(async () => {
      const r = await setDefaultPresetAction({ locale, preset });
      setRes({ where: 'preset', value: r.status === 'ok' ? 'ok' : sync(r.status === 'refused' ? r.reason : 'invalid') });
    });
  const saveEntry = () =>
    startTransition(async () => {
      const r = await updateDeadlineAction({
        locale,
        entry: {
          month, type: type as (typeof DEADLINE_TYPES)[number], mode: mode as 'default' | 'preset' | 'fixed',
          preset: entryPreset ? (entryPreset as PresetId) : undefined, fixedDate: fixed ?? undefined,
        },
      });
      setRes({ where: 'entry', value: r.status === 'ok' ? 'ok' : sync(r.status === 'refused' ? r.reason : 'invalid') });
    });

  const monthLimit = month ? addDays(monthStart(month), -1) : addDays(context.today, 90);
  const ready = Boolean(month && type && mode && (mode !== 'preset' || entryPreset) && (mode !== 'fixed' || fixed));

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-testid="deadline-editor">
      <form noValidate onSubmit={(e) => { e.preventDefault(); savePreset(); }} className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card" aria-labelledby="preset-title">
        <h3 id="preset-title" className="text-lg font-semibold">{t('editor.presetTitle')}</h3>
        <p className="text-muted">{t('editor.presetHelp')}</p>
        <SelectField
          id="default-preset"
          label={t('editor.defaultPreset')}
          placeholder={t('editor.choose')}
          value={preset}
          options={PRESET_IDS.map((p) => ({ value: p, text: t(`preset.${p}`) }))}
          onChange={(e) => { setPreset(e.target.value); setRes(null); }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || preset === context.settings.default_preset}>{t('editor.savePreset')}</Button>
          <div aria-live="polite">
            {res?.where === 'preset' ? (res.value === 'ok' ? <StatusTag tone="ok">{t('editor.saved')}</StatusTag> : <StatusTag tone="risk">{t(`editor.refused.${res.value}`)}</StatusTag>) : null}
          </div>
        </div>
      </form>

      <form noValidate onSubmit={(e) => { e.preventDefault(); saveEntry(); }} className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card" aria-labelledby="entry-title">
        <h3 id="entry-title" className="text-lg font-semibold">{t('editor.entryTitle')}</h3>
        <p className="text-muted">{t('editor.entryHelp')}</p>
        <SelectField id="entry-month" label={t('editor.month')} placeholder={t('editor.choose')} value={month} options={months.map((m) => ({ value: m, text: formatMonth(m, locale) }))} onChange={(e) => { setMonth(e.target.value); setFixed(null); setRes(null); }} />
        <SelectField id="entry-type" label={t('editor.type')} placeholder={t('editor.choose')} value={type} options={DEADLINE_TYPES.map((x) => ({ value: x, text: t(`type.${x}`) }))} onChange={(e) => { setType(e.target.value); setRes(null); }} />
        <SelectField
          id="entry-mode"
          label={t('editor.mode')}
          placeholder={t('editor.choose')}
          value={mode}
          options={[{ value: 'default', text: t('editor.modeDefault') }, { value: 'preset', text: t('editor.modePreset') }, { value: 'fixed', text: t('editor.modeFixed') }]}
          onChange={(e) => { setMode(e.target.value); setRes(null); }}
        />
        {mode === 'preset' ? (
          <SelectField id="entry-preset" label={t('editor.presetOfMonth')} placeholder={t('editor.choose')} value={entryPreset} options={PRESET_IDS.map((p) => ({ value: p, text: t(`preset.${p}`) }))} onChange={(e) => { setEntryPreset(e.target.value); setRes(null); }} />
        ) : null}
        {mode === 'fixed' ? (
          <DatePicker
            id="entry-fixed"
            label={t('editor.fixedDate')}
            hint={t('editor.fixedHint')}
            value={fixed}
            onChange={(d) => { setFixed(d); setRes(null); }}
            today={context.today}
            min={context.today}
            max={monthLimit}
            nonWorking={calendar}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !ready}>{t('editor.saveEntry')}</Button>
          <div aria-live="polite" data-testid="entry-result">
            {res?.where === 'entry' ? (res.value === 'ok' ? <StatusTag tone="ok">{t('editor.saved')}</StatusTag> : <StatusTag tone="risk">{t(`editor.refused.${res.value}`)}</StatusTag>) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
