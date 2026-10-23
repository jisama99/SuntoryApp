'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { requestReopeningAction } from '@/app/[locale]/needs/actions';
import type { ReopeningRequest } from '@/data/schemas';
import { calendarOf } from '@/domain/deadlines';
import type { DeadlineContext } from '@/data/repository';
import type { Locale } from '@/domain/types';
import { addDays } from '@/domain/week';
import { formatDate, formatIsoWeek, formatMonth } from '@/lib/format';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { DatePicker } from './pickers/DatePicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';

/**
 * Demande de réouverture (D87) : le CVR seul la dépose, l'agence administration seule la décide. La cible est un mois
 * dont la saisie est close ou une semaine clôturée ; le motif et la durée souhaitée sont obligatoires.
 */
export function ReopenRequestForm({ context, closedMonths, closedWeeks, requests }: {
  context: DeadlineContext;
  closedMonths: string[];
  closedWeeks: string[];
  requests: ReopeningRequest[];
}) {
  const t = useTranslations('reopen');
  const locale = useLocale() as Locale;
  const [target, setTarget] = useState('');
  const [motive, setMotive] = useState('');
  const [until, setUntil] = useState<string | null>(null);
  const [result, setResult] = useState<'ok' | 'invalid' | string | null>(null);
  const tc = useTranslations('confirmation');
  const announce = useConfirmation();
  const [pending, startTransition] = useTransition();
  const options = [
    ...closedMonths.map((m) => ({ value: `month:${m}`, text: t('targetMonth', { month: formatMonth(m, locale) }) })),
    ...closedWeeks.map((w) => ({ value: `week:${w}`, text: t('targetWeek', { week: formatIsoWeek(w, locale) }) })),
  ];
  const targetText = (r: ReopeningRequest) => (r.scope === 'month' ? t('targetMonth', { month: formatMonth(r.target, locale) }) : t('targetWeek', { week: formatIsoWeek(r.target, locale) }));

  const submit = () =>
    startTransition(async () => {
      const [scope, id] = target.split(':') as ['month' | 'week', string];
      if (!scope || !id || !until || motive.trim() === '') {
        setResult('invalid');
        return;
      }
      const r = await requestReopeningAction({ locale, scope, target: id, motive, desiredUntil: until });
      setResult(r.status === 'ok' ? 'ok' : r.status === 'refused' ? r.reason : 'invalid');
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setResult(null) });
        setMotive('');
        setUntil(null);
        setTarget('');
      }
    });

  return (
    <section aria-labelledby="reopen-title" data-testid="reopen-request" className="mb-8 flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="reopen-title" className="text-lg font-semibold">{t('title')}</h2>
      <p className="max-w-prose text-muted">{t('help')}</p>
      {options.length === 0 ? (
        <p className="text-muted">{t('nothingClosed')}</p>
      ) : (
        <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid max-w-xl gap-4">
          <SelectField id="reopen-target" label={t('target')} placeholder={t('choose')} value={target} options={options} onChange={(e) => { setTarget(e.target.value); setResult(null); }} />
          <TextareaField id="reopen-motive" label={t('motive')} hint={t('motiveHint')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
          <DatePicker
            id="reopen-until"
            label={t('until')}
            value={until}
            onChange={(d) => { setUntil(d); setResult(null); }}
            today={context.today}
            min={context.today}
            max={addDays(context.today, 90)}
            nonWorking={calendarOf(context.settings)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>{t('submit')}</Button>
            <div aria-live="polite" data-testid="reopen-result">
              {result === 'ok' ? <StatusTag tone="ok">{t('sent')}</StatusTag> : null}
              {result && result !== 'ok' ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}
            </div>
          </div>
        </form>
      )}
      {requests.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold">{t('mine')}</h3>
          <ul className="flex flex-col gap-2" data-testid="reopen-list">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-ctl bg-alt px-4 py-2">
                <StatusTag tone={r.status === 'granted' ? 'ok' : r.status === 'declined' ? 'neutral' : 'attention'}>{t(`status.${r.status}`)}</StatusTag>
                <span>{targetText(r)}</span>
                <span className="text-sm text-muted">{t('desired', { date: formatDate(r.desired_until, locale) })}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
