'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { decideReopeningAction } from '@/app/[locale]/(app)/settings/actions';
import type { DeadlineContext } from '@/data/repository';
import type { ReopeningRequest } from '@/data/schemas';
import { calendarOf } from '@/domain/deadlines';
import type { Locale } from '@/domain/types';
import { addDays } from '@/domain/week';
import { formatDate, formatIsoWeek, formatMonth } from '@/lib/format';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { DatePicker } from './pickers/DatePicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';

type Zone = { id: string; text: string };

const targetLabel = (scope: string, target: string, locale: Locale, t: (k: string, v: Record<string, string>) => string) =>
  scope === 'month' ? t('targetMonth', { month: formatMonth(target, locale) }) : t('targetWeek', { week: formatIsoWeek(target, locale) });

/** Décision de l'agence sur une demande de réouverture : motif, durée, trace (D82, D87, D147). */
export function RequestDecision({ request, zoneText, context }: { request: ReopeningRequest; zoneText: string; context: DeadlineContext }) {
  const t = useTranslations('reopen');
  const locale = useLocale() as Locale;
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState<string | null>(request.desired_until);
  const [res, setRes] = useState<string | null>(null);
  const tc = useTranslations('confirmation');
  const announce = useConfirmation();
  const [pending, startTransition] = useTransition();
  const decide = (decision: 'grant' | 'decline') =>
    startTransition(async () => {
      const r = await decideReopeningAction({
        locale, requestId: request.id, decision, scope: request.scope, target: request.target, zoneId: request.zone_id, reason, expiresOn: until ?? '',
      });
      setRes(r.status === 'ok' ? 'ok' : r.status === 'refused' ? r.reason : 'invalid');
      if (r.status === 'ok') announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setRes(null) });
    });
  return (
    <li data-testid="reopen-request-card" className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag tone="attention">{t('status.pending')}</StatusTag>
        <span className="font-semibold">{targetLabel(request.scope, request.target, locale, t as never)}</span>
      </div>
      <p>{zoneText}</p>
      <p className="text-muted">{t('motiveOf', { motive: request.motive })}</p>
      <p className="text-sm text-muted">{t('requestedOn', { date: formatDate(request.requested_on, locale), until: formatDate(request.desired_until, locale) })}</p>
      <TextareaField id={`dec-reason-${request.id}`} label={t('reason')} hint={t('reasonHint')} value={reason} maxLength={280} onChange={(e) => { setReason(e.target.value); setRes(null); }} />
      <DatePicker id={`dec-until-${request.id}`} label={t('grantUntil')} value={until} onChange={(d) => { setUntil(d); setRes(null); }} today={context.today} min={context.today} max={addDays(context.today, 90)} nonWorking={calendarOf(context.settings)} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={pending} onClick={() => decide('grant')}>{t('grant')}</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => decide('decline')}>{t('decline')}</Button>
        <div aria-live="polite" data-testid="decision-result">
          {res === 'ok' ? <StatusTag tone="ok">{t('decided')}</StatusTag> : null}
          {res && res !== 'ok' ? <StatusTag tone="risk">{t(`refused.${res}`)}</StatusTag> : null}
        </div>
      </div>
    </li>
  );
}

/** Réouverture décidée directement par l'agence, sans demande préalable. */
export function DirectReopen({ context, zones, closedMonths, closedWeeks }: { context: DeadlineContext; zones: Zone[]; closedMonths: string[]; closedWeeks: string[] }) {
  const t = useTranslations('reopen');
  const locale = useLocale() as Locale;
  const [target, setTarget] = useState('');
  const [zone, setZone] = useState('');
  const [reason, setReason] = useState('');
  const [until, setUntil] = useState<string | null>(null);
  const [res, setRes] = useState<string | null>(null);
  const tc = useTranslations('confirmation');
  const announce = useConfirmation();
  const [pending, startTransition] = useTransition();
  const options = [
    ...closedMonths.map((m) => ({ value: `month:${m}`, text: t('targetMonth', { month: formatMonth(m, locale) }) })),
    ...closedWeeks.map((w) => ({ value: `week:${w}`, text: t('targetWeek', { week: formatIsoWeek(w, locale) }) })),
  ];
  const submit = () =>
    startTransition(async () => {
      const [scope, id] = target.split(':') as ['month' | 'week', string];
      const r = await decideReopeningAction({ locale, requestId: null, decision: 'grant', scope, target: id ?? '', zoneId: zone, reason, expiresOn: until ?? '' });
      setRes(r.status === 'ok' ? 'ok' : r.status === 'refused' ? r.reason : 'invalid');
      if (r.status === 'ok') announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setRes(null) });
    });
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4 rounded-card bg-surface p-5 shadow-card" aria-labelledby="direct-title" data-testid="direct-reopen">
      <h3 id="direct-title" className="text-lg font-semibold">{t('directTitle')}</h3>
      <SelectField id="direct-target" label={t('target')} placeholder={t('choose')} value={target} options={options} onChange={(e) => { setTarget(e.target.value); setRes(null); }} />
      <SelectField id="direct-zone" label={t('zone')} placeholder={t('choose')} value={zone} options={zones.map((z) => ({ value: z.id, text: z.text }))} onChange={(e) => { setZone(e.target.value); setRes(null); }} />
      <TextareaField id="direct-reason" label={t('reason')} hint={t('reasonHint')} value={reason} maxLength={280} onChange={(e) => { setReason(e.target.value); setRes(null); }} />
      <DatePicker id="direct-until" label={t('grantUntil')} value={until} onChange={(d) => { setUntil(d); setRes(null); }} today={context.today} min={context.today} max={addDays(context.today, 90)} nonWorking={calendarOf(context.settings)} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !target || !zone || !reason.trim() || !until}>{t('grant')}</Button>
        <div aria-live="polite" data-testid="direct-result">
          {res === 'ok' ? <StatusTag tone="ok">{t('decided')}</StatusTag> : null}
          {res && res !== 'ok' ? <StatusTag tone="risk">{t(`refused.${res}`)}</StatusTag> : null}
        </div>
      </div>
    </form>
  );
}
