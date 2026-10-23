'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from './Button';
import { Field } from './Field';

/**
 * Formulaire de connexion (D188). Une vraie balise `form` avec les attributs `autocomplete` standard, pour que le navigateur
 * propose d'enregistrer et de remplir le mot de passe. **Rien n'est envoyé avant la soumission explicite** (clic sur
 * « Connexion » ou Entrée tapée) : ni la saisie, ni le remplissage automatique, ni un changement de champ ne déclenchent
 * d'appel. Le message d'échec est unique.
 */
export function LoginForm() {
  const t = useTranslations('login');
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: String(data.get('username') ?? ''), password: String(data.get('password') ?? '') }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; mustChangePassword?: boolean } | null;
      if (response.ok && body?.ok) {
        router.replace(body.mustChangePassword ? '/change-password' : '/');
        return;
      }
      setFailed(true);
    } catch {
      setFailed(true);
    }
    setPending(false);
  };

  return (
    <form method="post" action="/api/login" onSubmit={submit} className="flex flex-col gap-4" aria-busy={pending}>
      <Field id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} label={t('username')} required />
      <Field id="password" name="password" type="password" autoComplete="current-password" label={t('password')} required />
      {failed ? (
        <p id="login-error" role="alert" className="rounded-ctl bg-danger-soft px-4 py-3 font-semibold text-danger">{t('error')}</p>
      ) : null}
      <Button type="submit" disabled={pending}>{t('submit')}</Button>
      <p className="text-sm text-muted-strong">{t('demoNote')}</p>
    </form>
  );
}
