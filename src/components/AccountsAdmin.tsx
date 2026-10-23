'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import {
  assignAccountAction, createAccountAction, resetAccountPasswordAction, setAccountActiveAction,
} from '@/app/[locale]/(app)/settings/accounts/actions';
import type { Outcome, SecretOutcome } from '@/app/[locale]/(app)/settings/accounts/actions';
import { scopeKindFor } from '@/domain/accounts';
import type { ProfileId, Locale, ZoneKind } from '@/domain/types';
import { Button } from './Button';
import { useConfirmation } from './Confirmation';
import { Field } from './Field';
import { SelectField } from './SelectField';

export interface ZoneOption {
  value: string;
  text: string;
  kind: ZoneKind;
}

const creatableOptions = (t: (k: string) => string, profiles: readonly ProfileId[]) => profiles.map((p) => ({ value: p, text: t(p) }));

/** Mot de passe temporaire : affiché une seule fois, à la création ou à la réinitialisation, jamais relu ensuite. */
function SecretPanel({ username, password, onClose }: { username: string; password: string; onClose: () => void }) {
  const t = useTranslations('accounts');
  const ta = useTranslations('auth');
  const tc = useTranslations('confirmation');
  return (
    <div role="status" data-testid="temp-password" className="flex flex-col gap-2 rounded-card bg-tint-sand p-5">
      <p className="font-semibold">{t('tempFor', { username })}</p>
      <p>
        {ta('temporaryPassword')} : <code className="rounded-ctl bg-surface px-2 py-1 font-mono font-semibold" data-testid="temp-password-value">{password}</code>
      </p>
      <p className="text-sm text-muted-strong">{t('shownOnce')}</p>
      <div>
        <Button type="button" variant="secondary" onClick={onClose}>{tc('close')}</Button>
      </div>
    </div>
  );
}

export function AccountCreateForm({ profiles, zones }: { profiles: readonly ProfileId[]; zones: ZoneOption[] }) {
  const t = useTranslations('accounts');
  const tl = useTranslations('login');
  const tp = useTranslations('profile');
  const tr = useTranslations('reopen');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState<ProfileId | ''>('');
  const [zoneId, setZoneId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ username: string; password: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const kind = profile ? scopeKindFor(profile) : 'all';
  const ready = Boolean(username.trim() && profile && (kind === 'all' || zoneId));

  const submit = () =>
    startTransition(async () => {
      const r: SecretOutcome = await createAccountAction({ locale, username, profile, zoneId });
      if (r.status === 'ok') {
        setSecret({ username: r.account.username, password: r.temporaryPassword });
        setError(null);
        setUsername('');
        setProfile('');
        setZoneId('');
        announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setSecret(null) });
      } else {
        setError(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  return (
    <section aria-labelledby="account-create-title" className="mb-8 flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card" data-testid="account-create">
      <h2 id="account-create-title" className="text-lg font-semibold">{t('create.title')}</h2>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid gap-4 md:grid-cols-3">
        <Field id="new-username" name="new-username" autoComplete="off" autoCapitalize="none" spellCheck={false} label={tl('username')} value={username} onChange={(e) => { setUsername(e.target.value); setError(null); }} error={error === 'username_taken' ? t('errors.username_taken') : error === 'invalid' ? t('errors.invalid') : undefined} />
        <SelectField id="new-profile" label={t('create.profile')} placeholder={tr('choose')} value={profile} options={creatableOptions((k) => tp(k), profiles)} onChange={(e) => { setProfile(e.target.value as ProfileId | ''); setZoneId(''); }} />
        {kind !== 'all' ? (
          <SelectField id="new-zone" label={t('create.zone')} placeholder={tr('choose')} value={zoneId} options={zones.filter((z) => z.kind === kind)} onChange={(e) => setZoneId(e.target.value)} />
        ) : null}
        <div className="md:col-span-3">
          <Button type="submit" disabled={!ready || pending}>{t('create.submit')}</Button>
        </div>
      </form>
      {error && error !== 'username_taken' && error !== 'invalid' ? <p role="alert" className="font-semibold text-danger">{t(`errors.${error}` as 'errors.forbidden')}</p> : null}
      {secret ? <SecretPanel username={secret.username} password={secret.password} onClose={() => setSecret(null)} /> : null}
    </section>
  );
}

export function AccountRowActions({ accountId, username, active, profile, protectedAccount, self, profiles, zones }: {
  accountId: string;
  username: string;
  active: boolean;
  profile: ProfileId;
  protectedAccount: boolean;
  self: boolean;
  profiles: readonly ProfileId[];
  zones: ZoneOption[];
}) {
  const t = useTranslations('accounts');
  const tp = useTranslations('profile');
  const tr = useTranslations('reopen');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [open, setOpen] = useState(false);
  const [newProfile, setNewProfile] = useState<ProfileId>(profile);
  const [zoneId, setZoneId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const kind = scopeKindFor(newProfile);

  const run = (call: () => Promise<Outcome | SecretOutcome>, after?: (r: SecretOutcome) => void) =>
    startTransition(async () => {
      const r = await call();
      if (r.status === 'ok') {
        setError(null);
        setOpen(false);
        after?.(r as SecretOutcome);
        announce(tc('saved'), { undoToken: r.undoToken, onUndo: () => setSecret(null) });
      } else {
        setError(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  if (protectedAccount) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {self ? null : (
          <Button type="button" variant="ghost" disabled={pending} aria-label={`${active ? t('disable') : t('enable')} ${username}`} onClick={() => run(() => setAccountActiveAction({ locale, accountId, active: !active }))}>
            {active ? t('disable') : t('enable')}
          </Button>
        )}
        <Button type="button" variant="ghost" disabled={pending} aria-label={`${t('reset')} ${username}`} onClick={() => run(() => resetAccountPasswordAction({ locale, accountId }), (r) => r.status === 'ok' && setSecret(r.temporaryPassword))}>
          {t('reset')}
        </Button>
        <Button type="button" variant="ghost" aria-expanded={open} aria-label={`${t('assign')} ${username}`} onClick={() => setOpen(!open)}>
          {t('assign')}
        </Button>
      </div>
      {open ? (
        <form noValidate onSubmit={(e) => { e.preventDefault(); run(() => assignAccountAction({ locale, accountId, profile: newProfile, zoneId })); }} className="flex flex-col gap-2 rounded-ctl bg-alt p-3">
          <SelectField id={`assign-profile-${accountId}`} label={t('create.profile')} placeholder={tr('choose')} value={newProfile} options={creatableOptions((k) => tp(k), profiles)} onChange={(e) => { setNewProfile(e.target.value as ProfileId); setZoneId(''); }} />
          {kind !== 'all' ? (
            <SelectField id={`assign-zone-${accountId}`} label={t('create.zone')} placeholder={tr('choose')} value={zoneId} options={zones.filter((z) => z.kind === kind)} onChange={(e) => setZoneId(e.target.value)} />
          ) : null}
          <Button type="submit" disabled={pending || (kind !== 'all' && !zoneId)}>{t('assign')}</Button>
        </form>
      ) : null}
      {error ? <p role="alert" className="text-sm font-semibold text-danger">{t(`errors.${error}` as 'errors.forbidden')}</p> : null}
      {secret ? <SecretPanel username={username} password={secret} onClose={() => setSecret(null)} /> : null}
    </div>
  );
}
