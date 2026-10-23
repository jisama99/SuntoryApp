'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { escalateNeedAction, validateNeedAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import { ESCALATION_CASES } from '@/domain/types';
import type { Locale } from '@/domain/types';

/**
 * Validation managériale du besoin (F-30.1, F-30.2). Le CVR valide, refuse avec motif ou escalade au DR ; le DR arbitre ce qui
 * lui est escaladé. Les droits sont revérifiés par la couche de données : l'écran ne fait que proposer les actions du niveau.
 */
export function ValidationPanel({ needId, level, targets }: { needId: string; level: 'cvr' | 'dr'; targets: Array<{ id: string; text: string }> }) {
  const t = useTranslations('pipeline.validate');
  const tc = useTranslations('confirmation');
  const tcase = useTranslations('pipeline.escalationCase');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [outcome, setOutcome] = useState('');
  const [escalationCase, setCase] = useState('');
  const [concerned, setConcerned] = useState('');
  const [motive, setMotive] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const outcomes = level === 'cvr' ? (['validated', 'refused', 'escalated'] as const) : (['validated', 'refused'] as const);

  const submit = () =>
    startTransition(async () => {
      if (!outcome) return setResult('outcome_required');
      if (outcome !== 'validated' && motive.trim() === '') return setResult('motive_required');
      if (outcome === 'escalated' && !escalationCase) return setResult('case_required');
      if (outcome === 'escalated' && escalationCase === 'arbitration' && !concerned) return setResult('invalid_zone');
      const r = outcome === 'escalated'
        ? await escalateNeedAction({ locale, needId, case: escalationCase, motive, concernedZoneId: concerned })
        : await validateNeedAction({ locale, needId, outcome, motive });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setOutcome(''); setCase(''); setConcerned(''); setMotive(''); setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <section aria-labelledby="validate-title" data-testid="validation-form" className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
      <h2 id="validate-title" className="text-lg font-semibold">{level === 'cvr' ? t('titleCvr') : t('titleDr')}</h2>
      <p className="max-w-prose text-muted">{level === 'cvr' ? t('help') : t('helpDr')}</p>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid max-w-xl gap-4">
        <SelectField
          id="review-outcome"
          label={t('outcome')}
          placeholder={t('choose')}
          value={outcome}
          options={outcomes.map((o) => ({ value: o, text: t(`outcomes.${o}`) }))}
          onChange={(e) => { setOutcome(e.target.value); setResult(null); }}
        />
        {outcome === 'escalated' ? (
          <>
            <SelectField
              id="review-case"
              label={t('case')}
              placeholder={t('choose')}
              value={escalationCase}
              options={ESCALATION_CASES.map((c) => ({ value: c, text: tcase(c) }))}
              onChange={(e) => { setCase(e.target.value); setResult(null); }}
            />
            {escalationCase === 'arbitration' ? (
              <SelectField
                id="review-concerned"
                label={t('concerned')}
                hint={t('concernedHint')}
                placeholder={t('choose')}
                value={concerned}
                options={targets.map((z) => ({ value: z.id, text: z.text }))}
                onChange={(e) => { setConcerned(e.target.value); setResult(null); }}
              />
            ) : null}
            {escalationCase === 'out_of_envelope' ? <p className="max-w-prose text-muted">{t('envelopeNote')}</p> : null}
          </>
        ) : null}
        {outcome && outcome !== 'validated' ? (
          <TextareaField id="review-motive" label={t('motive')} hint={t('motiveHint')} value={motive} maxLength={280} onChange={(e) => { setMotive(e.target.value); setResult(null); }} />
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending}>{t('submit')}</Button>
          <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
        </div>
      </form>
    </section>
  );
}
