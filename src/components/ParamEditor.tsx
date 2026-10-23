'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { updateParamAction } from '@/app/[locale]/(app)/settings/actions';
import type { ParamKey } from '@/data/schemas';
import { ENTRY_PROFILES } from '@/domain/types';
import type { Dispositif, Locale } from '@/domain/types';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { Field } from './Field';
import { WeekdayPicker } from './pickers/WeekdayPicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';

type Draft = Record<string, unknown>;

/**
 * Éditeur d'un paramètre de dispositif (F-30.10) : agence administration seule. La couche données valide la valeur ;
 * ce formulaire ne fait que proposer la bonne forme de saisie pour chaque paramètre.
 */
export function ParamEditor({ dispositif, paramKey, value }: { dispositif: Dispositif; paramKey: ParamKey; value: unknown }) {
  const t = useTranslations('params');
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const tc = useTranslations('confirmation');
  const announce = useConfirmation();
  const [pending, startTransition] = useTransition();
  const [d, setD] = useState<Draft>(() => initialDraft(paramKey, value));
  const set = (patch: Draft) => { setD((cur) => ({ ...cur, ...patch })); setResult(null); };
  const id = `param-${dispositif}-${paramKey}`;

  const save = () =>
    startTransition(async () => {
      const r = await updateParamAction({ locale, dispositif, key: paramKey, value: toValue(paramKey, d) });
      setResult(r.status === 'ok' ? 'ok' : r.status === 'refused' ? r.reason : 'invalid');
      if (r.status === 'ok') {
        setOpen(false);
        announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setResult(null) });
      }
    });

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(true)} aria-label={`${t('edit')} ${t(`keys.${paramKey}`)}`}>{t('edit')}</Button>
        {result === 'ok' ? <StatusTag tone="ok">{t('saved')}</StatusTag> : null}
      </div>
    );
  }

  const roles = (d.roles as string[]) ?? [];
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); save(); }} className="flex flex-col gap-3 rounded-ctl bg-alt p-3" aria-label={t(`keys.${paramKey}`)}>
      {paramKey === 'min_minutes' || paramKey === 'horizon_weeks' || paramKey === 'change_lead_days' ? (
        <Field id={`${id}-n`} type="number" min={1} label={t('editor.number')} hint={t('editor.emptyIsDefault')} value={String(d.n ?? '')} onChange={(e) => set({ n: e.target.value })} />
      ) : null}
      {paramKey === 'km_flat_rate' ? (
        <>
          <SelectField
            id={`${id}-mode`}
            label={t('editor.kmMode')}
            placeholder={t('editor.choose')}
            value={String(d.mode)}
            options={[{ value: 'na', text: t('value.notApplicable') }, { value: 'todo', text: t('value.unpriced') }, { value: 'value', text: t('editor.kmValue') }]}
            onChange={(e) => set({ mode: e.target.value })}
          />
          {d.mode === 'value' ? (
            <Field id={`${id}-amount`} type="number" min={0} step="0.01" label={t('editor.amount')} hint={t('editor.fictive')} value={String(d.amount ?? '')} onChange={(e) => set({ amount: e.target.value })} />
          ) : null}
        </>
      ) : null}
      {paramKey === 'entry_window' ? (
        <SelectField
          id={`${id}-reading`}
          label={t('editor.reading')}
          placeholder={t('editor.choose')}
          value={String(d.reading)}
          options={[
            { value: 'none', text: t('value.calendar') },
            { value: 'last_full_week', text: t('value.window.last_full_week') },
            { value: 'week_of_last_day', text: t('value.window.week_of_last_day') },
          ]}
          onChange={(e) => set({ reading: e.target.value })}
        />
      ) : null}
      {paramKey === 'change_effect' ? (
        <SelectField
          id={`${id}-effect`}
          label={t('editor.effect')}
          placeholder={t('editor.choose')}
          value={String(d.effect)}
          options={[{ value: 'none', text: t('value.calendar') }, { value: 'next_month', text: t('value.nextMonth') }]}
          onChange={(e) => set({ effect: e.target.value })}
        />
      ) : null}
      {paramKey === 'change_lead_unit' ? (
        <SelectField
          id={`${id}-unit`}
          label={t('editor.unit')}
          placeholder={t('editor.choose')}
          value={String(d.unit)}
          options={[{ value: 'calendar', text: t('value.unit.calendar') }, { value: 'working', text: t('value.unit.working') }]}
          onChange={(e) => set({ unit: e.target.value })}
        />
      ) : null}
      {paramKey === 'entry_roles' ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="text-sm font-semibold">{t('editor.roles')}</legend>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-primary" checked={d.allRoles === true} onChange={(e) => set({ allRoles: e.target.checked })} />
            <span>{t('value.allRoles')}</span>
          </label>
          {d.allRoles === true ? null : ENTRY_PROFILES.map((r) => (
            <label key={r} className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5 accent-primary" checked={roles.includes(r)} onChange={(e) => set({ roles: e.target.checked ? [...roles, r] : roles.filter((x) => x !== r) })} />
              <span>{t(`roles.${r}`)}</span>
            </label>
          ))}
          <p className="text-sm text-muted">{t('editor.csUndefined')}</p>
        </fieldset>
      ) : null}
      {paramKey === 'non_working_days' || paramKey === 'days_allowed' ? (
        <>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="size-5 accent-primary" checked={d.global === true} onChange={(e) => set({ global: e.target.checked })} />
            <span>{t('editor.useGlobal')}</span>
          </label>
          {d.global === true ? null : (
            <WeekdayPicker id={`${id}-days`} label={t(`keys.${paramKey}`)} value={(d.days as number[]) ?? []} allowed={[1, 2, 3, 4, 5, 6, 7]} onChange={(days) => set({ days })} />
          )}
          {paramKey === 'non_working_days' && d.global !== true ? (
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="size-5 accent-primary" checked={d.holidays === true} onChange={(e) => set({ holidays: e.target.checked })} />
              <span>{t('value.holidays')}</span>
            </label>
          ) : null}
        </>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{t('save')}</Button>
        <Button type="button" variant="ghost" onClick={() => { setOpen(false); setD(initialDraft(paramKey, value)); setResult(null); }}>{t('cancel')}</Button>
        <div aria-live="polite" data-testid="param-result">
          {result && result !== 'ok' ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}
        </div>
      </div>
    </form>
  );
}

function initialDraft(key: ParamKey, v: unknown): Draft {
  switch (key) {
    case 'min_minutes': case 'horizon_weeks': case 'change_lead_days':
      return { n: v === null ? '' : String(v) };
    case 'km_flat_rate': {
      const k = v as { applicable: boolean; amount_eur_ht: number | null };
      return { mode: !k.applicable ? 'na' : k.amount_eur_ht === null ? 'todo' : 'value', amount: k.amount_eur_ht === null ? '' : String(k.amount_eur_ht) };
    }
    case 'entry_window':
      return { reading: v === null ? 'none' : (v as { reading: string }).reading };
    case 'change_effect':
      return { effect: v === null ? 'none' : 'next_month' };
    case 'change_lead_unit':
      return { unit: String(v) };
    case 'entry_roles':
      return { allRoles: v === null, roles: v === null ? [] : (v as string[]) };
    case 'non_working_days': {
      const n = v as { weekdays: number[]; holidays: boolean } | null;
      return { global: n === null, days: n?.weekdays ?? [7], holidays: n?.holidays ?? true };
    }
    case 'days_allowed':
      return { global: v === null, days: (v as number[] | null) ?? [1, 2, 3, 4, 5, 6] };
  }
}

function toValue(key: ParamKey, d: Draft): unknown {
  const num = () => (String(d.n ?? '').trim() === '' ? null : Number(d.n));
  switch (key) {
    case 'min_minutes': case 'horizon_weeks': case 'change_lead_days':
      return num();
    case 'km_flat_rate':
      return d.mode === 'na' ? { applicable: false, amount_eur_ht: null } : d.mode === 'todo' ? { applicable: true, amount_eur_ht: null } : { applicable: true, amount_eur_ht: Number(d.amount) };
    case 'entry_window':
      return d.reading === 'none' ? null : { reading: d.reading };
    case 'change_effect':
      return d.effect === 'none' ? null : 'next_month';
    case 'change_lead_unit':
      return d.unit;
    case 'entry_roles':
      return d.allRoles === true ? null : d.roles;
    case 'non_working_days':
      return d.global === true ? null : { weekdays: d.days, holidays: d.holidays === true };
    case 'days_allowed':
      return d.global === true ? null : d.days;
  }
}
