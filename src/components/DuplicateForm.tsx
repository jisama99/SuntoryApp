'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { duplicateNeedAction } from '@/app/[locale]/needs/actions';
import type { SaveState } from '@/app/[locale]/needs/actions';
import type { Locale } from '@/domain/types';
import { Link } from '@/i18n/navigation';
import { Button } from './Button';
import { FindingsPanel } from './FindingsPanel';
import { DatePicker } from './pickers/DatePicker';
import { StatusTag } from './StatusTag';

/** Duplication d'un besoin avec décalage de dates (F-20.3) : on choisit le nouveau premier jour, la durée est conservée. */
export function DuplicateForm({ needId, sourceStart, today, min, max, closedWeeks }: {
  needId: string;
  sourceStart: string | null;
  today: string;
  min: string;
  max: string;
  closedWeeks: string[];
}) {
  const t = useTranslations('duplicate');
  const tf = useTranslations('form');
  const locale = useLocale() as Locale;
  const [start, setStart] = useState<string | null>(null);
  const [result, setResult] = useState<SaveState | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (confirm: boolean) => {
    if (!start) return;
    startTransition(async () => {
      setResult(await duplicateNeedAction({ locale, needId, newStart: start, confirm }));
    });
  };

  return (
    <div className="flex max-w-xl flex-col gap-5">
      <p className="text-muted">{sourceStart ? t('hint') : t('noPeriod')}</p>
      {sourceStart ? (
        <>
          <DatePicker
            id="dup-start"
            label={t('newStart')}
            value={start}
            onChange={(d) => {
              setStart(d);
              setResult(null);
            }}
            today={today}
            min={min}
            max={max}
            closedWeeks={closedWeeks}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={!start || pending} onClick={() => run(false)}>{t('submit')}</Button>
            <Link href="/needs" className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-link hover:bg-sel">
              {tf('back')}
            </Link>
          </div>
        </>
      ) : null}
      <div aria-live="polite" data-testid="form-result" className="flex flex-col gap-4">
        {result?.status === 'invalid' ? <StatusTag tone="risk">{tf('invalid')}</StatusTag> : null}
        {result?.status === 'saved' ? (
          <div className="flex flex-col gap-3 rounded-card bg-ok-soft p-5" data-testid="saved">
            <StatusTag tone="ok">{tf('saved.submit.title')}</StatusTag>
            <p>{t('done', { code: result.needCode })}</p>
            <Link href="/needs" className="inline-flex min-h-11 w-fit items-center rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              {tf('goList')}
            </Link>
          </div>
        ) : null}
        {result?.status === 'refused' ? <StatusTag tone="risk">{tf(`refusal.${result.reason}`)}</StatusTag> : null}
        {result && result.status !== 'invalid' && result.findings.length > 0 ? <FindingsPanel findings={result.findings} /> : null}
        {result?.status === 'needs_confirmation' ? (
          <div className="flex flex-wrap items-center gap-3" data-testid="confirm-actions">
            <p className="w-full text-muted">{tf('confirmNote')}</p>
            <Button type="button" disabled={pending} onClick={() => run(true)}>{tf('confirm')}</Button>
            <Button type="button" variant="ghost" onClick={() => setResult(null)}>{tf('adjust')}</Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
