'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { resubmitNeedAction, validateNeedAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { EscalationReason, Locale } from '@/domain/types';
import type { EnvelopeStatus } from '@/domain/validation';

export interface ValidationPanelProps {
  needId: string;
  /** Niveau qui peut agir (CVR ou DR) ; nul pour qui ne peut que lire. */
  level: 'cvr' | 'dr' | null;
  /** Texte de la zone dont le suppléant exerce l'autorité, le cas échéant. */
  actingFor: string | null;
  canResubmit: boolean;
  /** CVR proposables pour un arbitrage entre CVR (texte de liste). */
  siblings: Array<{ id: string; text: string }>;
  envelope: EnvelopeStatus;
}

const REASONS: readonly EscalationReason[] = ['arbitration', 'out_of_perimeter', 'out_of_envelope'];

/**
 * Validation managériale du besoin (F-30.1, F-30.2). Le CVR valide, refuse avec motif ou escalade au DR ; le DR arbitre un besoin
 * escaladé ; le RS ou l'agence soumet de nouveau un besoin refusé. Les droits viennent de la couche de données (`level`), jamais d'ici.
 */
export function ValidationPanel({ needId, level, actingFor, canResubmit, siblings, envelope }: ValidationPanelProps) {
  const t = useTranslations('pipeline.validation');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [outcome, setOutcome] = useState('');
  const [motive, setMotive] = useState('');
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const outcomes = level === 'cvr' ? (['validate', 'refuse', 'escalate'] as const) : (['validate', 'refuse'] as const);
  const needsMotive = outcome === 'refuse' || outcome === 'escalate';

  const submit = () =>
    startTransition(async () => {
      if (!outcome) return setResult('outcome_required');
      if (needsMotive && motive.trim() === '') return setResult('motive_required');
      if (outcome === 'escalate' && !reason) return setResult('invalid_reason');
      if (outcome === 'escalate' && reason === 'arbitration' && !other) return setResult('invalid_other_zone');
      const r = await validateNeedAction({ locale, needId, outcome, motive, ...(outcome === 'escalate' ? { reason, ...(reason === 'arbitration' ? { otherZoneId: other } : {}) } : {}) });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setMotive('');
        setOutcome('');
        setReason('');
        setOther('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  const resubmit = () =>
    startTransition(async () => {
      const r = await resubmitNeedAction({ locale, needId });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  if (!level && !canResubmit) return null;
  return (
    <section aria-labelledby="validation-title" data-testid="validation-panel" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="validation-title" className="text-lg font-semibold">{t(level ? `title.${level}` : 'title.resubmit')}</h2>
      <p className="max-w-prose text-muted">{t('optional')}</p>
      {actingFor ? <StatusTag tone="info">{t('actingFor', { zone: actingFor })}</StatusTag> : null}
      {level ? (
        <>
          <p className="max-w-prose text-muted">{t(`help.${level}`)}</p>
          <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid max-w-xl gap-4">
            <SelectField
              id="validation-outcome"
              label={t('outcome')}
              placeholder={t('choose')}
              value={outcome}
              options={outcomes.map((o) => ({ value: o, text: t(`outcomes.${o}`) }))}
              onChange={(e) => { setOutcome(e.target.value); setResult(null); }}
            />
            {outcome === 'escalate' ? (
              <>
                <SelectField
                  id="validation-reason"
                  label={t('reason')}
                  placeholder={t('choose')}
                  value={reason}
                  options={REASONS.map((r) => ({ value: r, text: t(`reasons.${r}`) }))}
                  onChange={(e) => { setReason(e.target.value); setResult(null); }}
                />
                {reason === 'arbitration' ? (
                  <SelectField
                    id="validation-other"
                    label={t('otherCvr')}
                    placeholder={t('choose')}
                    value={other}
                    options={siblings.map((s) => ({ value: s.id, text: s.text }))}
                    onChange={(e) => { setOther(e.target.value); setResult(null); }}
                  />
                ) : null}
                {reason === 'out_of_envelope' ? <p className="text-sm text-muted" data-testid="envelope-note">{t(`envelope.${envelope}`)}</p> : null}
              </>
            ) : null}
            {needsMotive ? <TextareaField id="validation-motive" label={t('motive')} hint={t('motiveHint')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} /> : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>{t('submit')}</Button>
              <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
            </div>
          </form>
        </>
      ) : (
        <>
          <p className="max-w-prose text-muted">{t('help.resubmit')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={pending} onClick={resubmit}>{t('resubmit')}</Button>
            <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
          </div>
        </>
      )}
    </section>
  );
}
