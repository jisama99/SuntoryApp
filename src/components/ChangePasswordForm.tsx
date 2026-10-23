'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { changePasswordAction } from '@/app/[locale]/(entry)/change-password/actions';
import { useLocale } from 'next-intl';
import type { Locale } from '@/domain/types';
import { Button } from './Button';
import { Field } from './Field';

/** Changement du mot de passe temporaire. Les champs portent les attributs `autocomplete` standard pour le trousseau. */
export function ChangePasswordForm() {
  const t = useTranslations('changePassword');
  const tl = useTranslations('login');
  const ta = useTranslations('auth');
  const locale = useLocale() as Locale;
  const [problem, setProblem] = useState<'weak' | 'same' | 'mismatch' | 'invalid' | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const current = String(data.get('current-password') ?? '');
    const next = String(data.get('new-password') ?? '');
    if (next !== String(data.get('confirm-password') ?? '')) {
      setProblem('mismatch');
      return;
    }
    setPending(true);
    const result = await changePasswordAction({ locale, current, next });
    setPending(false);
    setProblem(result.status === 'ok' ? null : result.reason);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={pending}>
      <Field id="current-password" name="current-password" type="password" autoComplete="current-password" label={ta('temporaryPassword')} required error={problem === 'invalid' ? t('invalid') : undefined} />
      <Field id="new-password" name="new-password" type="password" autoComplete="new-password" label={t('new')} required error={problem === 'weak' ? t('weak') : problem === 'same' ? t('same') : undefined} />
      <Field id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" label={t('confirm')} required error={problem === 'mismatch' ? t('mismatch') : undefined} />
      <Button type="submit" disabled={pending}>{t('submit')}</Button>
      <p className="text-sm text-muted-strong">{tl('demoNote')}</p>
    </form>
  );
}
