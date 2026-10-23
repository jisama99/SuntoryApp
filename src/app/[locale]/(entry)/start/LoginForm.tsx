'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { loginAction, changePasswordAction } from '@/app/actions';
import type { LoginResult } from '@/app/actions';

export interface LoginFormLabels {
  username: string;
  password: string;
  submit: string;
  loading: string;
  error: string;
  locked: string;
  tempPasswordTitle: string;
  tempPasswordHint: string;
  newPassword: string;
  confirmPassword: string;
  savePassword: string;
  changeError: string;
}

interface Props {
  labels: LoginFormLabels;
  locale: string;
  /** Chemin vers lequel rediriger après connexion (D183). */
  next?: string;
  /** Identifiant pré-rempli (vient de la session temp_password). */
  tempUsername?: string;
}

export function LoginForm({ labels, locale, next, tempUsername }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'login' | 'change_password'>('login');
  const [pendingUsername, setPendingUsername] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const changeFormRef = useRef<HTMLFormElement>(null);
  const [changeError, setChangeError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Ne jamais soumettre automatiquement : la soumission ne part qu'ici (D188).
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      setError(null);
      const result: LoginResult = await loginAction(data);
      if (result.status === 'ok') {
        const dest = validateNext(next, locale);
        router.replace(dest);
        return;
      }
      if (result.messageKey === 'auth.temp_password') {
        setPendingUsername(String(data.get('username') ?? ''));
        setPhase('change_password');
        return;
      }
      setError(result.messageKey === 'auth.locked' ? labels.locked : labels.error);
    });
  }

  function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    data.set('username_cookie', pendingUsername);
    startTransition(async () => {
      setChangeError(null);
      const result = await changePasswordAction(data);
      if (result.status === 'ok') {
        const dest = validateNext(next, locale);
        router.replace(dest);
        return;
      }
      setChangeError(labels.changeError);
    });
  }

  if (phase === 'change_password') {
    return (
      <form ref={changeFormRef} onSubmit={handleChangePassword} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-muted-strong">{labels.tempPasswordHint}</p>
        {changeError && (
          <p role="alert" className="rounded-ctl bg-risk/10 px-3 py-2 text-sm text-risk">{changeError}</p>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{labels.newPassword}</span>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{labels.confirmPassword}</span>
          <input
            type="password"
            name="confirm"
            autoComplete="new-password"
            required
            className="field"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending ? labels.loading : labels.savePassword}
        </button>
      </form>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p role="alert" className="rounded-ctl bg-risk/10 px-3 py-2 text-sm text-risk">{error}</p>
      )}
      <input type="hidden" name="locale" value={locale} />
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{labels.username}</span>
        <input
          type="text"
          name="username"
          id="login-username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          required
          className="field"
          defaultValue={tempUsername}
          aria-label={labels.username}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">{labels.password}</span>
        <input
          type="password"
          name="password"
          id="login-password"
          autoComplete="current-password"
          required
          className="field"
          aria-label={labels.password}
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary"
        aria-busy={isPending}
      >
        {isPending ? labels.loading : labels.submit}
      </button>
    </form>
  );
}

function validateNext(next: string | undefined, locale: string): string {
  if (!next) return `/${locale}`;
  // Chemin interne uniquement : doit commencer par / et ne pas contenir de protocole (D183).
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes(':')) return next;
  return `/${locale}`;
}
