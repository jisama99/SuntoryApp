'use client';

import { useState, useTransition } from 'react';
import { createAccountAction, deactivateAccountAction, resetPasswordAction } from '@/app/actions';
import type { AccountActionResult } from '@/app/actions';
import type { Account } from '@/data/schemas';
import type { ProfileId } from '@/domain/types';

export interface AccountsLabels {
  create: string;
  username: string;
  profile: string;
  firstName: string;
  scope: string;
  scopeAll: string;
  status: string;
  statusActive: string;
  statusInactive: string;
  statusTemp: string;
  deactivate: string;
  resetPassword: string;
  tempPasswordShown: string;
  confirmDeactivate: string;
  confirmReset: string;
  cancel: string;
  confirm: string;
  empty: string;
  errorInvalid: string;
  errorDuplicate: string;
  errorForbidden: string;
  errorNotFound: string;
  loading: string;
}

interface Props {
  accounts: (Omit<Account, 'password_hash'> & { password_hash: string })[];
  locale: string;
  labels: AccountsLabels;
  profileOptions: { value: ProfileId; label: string }[];
}

type Dialog =
  | { kind: 'deactivate'; username: string }
  | { kind: 'reset'; username: string }
  | { kind: 'create' }
  | null;

function statusLabel(status: Account['status'], l: AccountsLabels): string {
  if (status === 'active') return l.statusActive;
  if (status === 'inactive') return l.statusInactive;
  return l.statusTemp;
}

function errorKey(r: AccountActionResult & { status: 'error' }, l: AccountsLabels): string {
  if (r.messageKey === 'admin.accounts.error.duplicate') return l.errorDuplicate;
  if (r.messageKey === 'admin.accounts.error.forbidden') return l.errorForbidden;
  if (r.messageKey === 'admin.accounts.error.not_found') return l.errorNotFound;
  return l.errorInvalid;
}

export function AccountsClient({ accounts, locale, labels: l, profileOptions }: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeDialog() { setDialog(null); setError(null); setTempPassword(null); }

  function handleDeactivate(username: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('locale', locale);
      fd.set('username', username);
      const r = await deactivateAccountAction(fd);
      if (r.status === 'error') { setError(errorKey(r, l)); return; }
      closeDialog();
    });
  }

  function handleReset(username: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('locale', locale);
      fd.set('username', username);
      const r = await resetPasswordAction(fd);
      if (r.status === 'error') { setError(errorKey(r, l)); return; }
      setTempPassword(r.temp_password ?? null);
    });
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    data.set('locale', locale);
    startTransition(async () => {
      const r = await createAccountAction(data);
      if (r.status === 'error') { setError(errorKey(r, l)); return; }
      closeDialog();
    });
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setError(null); setTempPassword(null); setDialog({ kind: 'create' }); }}
        >
          {l.create}
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted">{l.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-alt text-left text-xs font-semibold text-muted">
              <tr>
                <th className="px-3 py-2">{l.username}</th>
                <th className="px-3 py-2">{l.profile}</th>
                <th className="px-3 py-2 hidden sm:table-cell">{l.firstName}</th>
                <th className="px-3 py-2 hidden md:table-cell">{l.status}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.username} className="bg-surface hover:bg-alt/50">
                  <td className="px-3 py-2 font-mono text-xs">{acc.username}</td>
                  <td className="px-3 py-2">{acc.profile_id}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">{acc.first_name ?? ''}</td>
                  <td className="px-3 py-2 hidden md:table-cell">
                    <span className={acc.status === 'active' ? 'text-ok' : acc.status === 'inactive' ? 'text-muted' : 'text-attention'}>
                      {statusLabel(acc.status, l)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      {acc.status !== 'inactive' && (
                        <button
                          type="button"
                          className="text-xs text-risk"
                          onClick={() => { setError(null); setTempPassword(null); setDialog({ kind: 'deactivate', username: acc.username }); }}
                        >
                          {l.deactivate}
                        </button>
                      )}
                      {acc.status !== 'inactive' && (
                        <button
                          type="button"
                          className="text-xs text-muted-strong"
                          onClick={() => { setError(null); setTempPassword(null); setDialog({ kind: 'reset', username: acc.username }); }}
                        >
                          {l.resetPassword}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogue de confirmation */}
      {dialog && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-card bg-surface p-6 shadow-card">
            {error && (
              <p role="alert" className="mb-3 rounded-ctl bg-risk/10 px-3 py-2 text-sm text-risk">{error}</p>
            )}

            {dialog.kind === 'deactivate' && !tempPassword && (
              <>
                <p className="mb-4 text-sm">{l.confirmDeactivate.replace('{username}', dialog.username)}</p>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-secondary" onClick={closeDialog} disabled={isPending}>{l.cancel}</button>
                  <button type="button" className="btn-primary bg-risk hover:bg-risk/90" onClick={() => handleDeactivate(dialog.username)} disabled={isPending}>
                    {isPending ? l.loading : l.confirm}
                  </button>
                </div>
              </>
            )}

            {dialog.kind === 'reset' && !tempPassword && (
              <>
                <p className="mb-4 text-sm">{l.confirmReset.replace('{username}', dialog.username)}</p>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-secondary" onClick={closeDialog} disabled={isPending}>{l.cancel}</button>
                  <button type="button" className="btn-primary" onClick={() => handleReset(dialog.username)} disabled={isPending}>
                    {isPending ? l.loading : l.confirm}
                  </button>
                </div>
              </>
            )}

            {tempPassword && (
              <>
                <p className="mb-2 text-sm">{l.tempPasswordShown}</p>
                <p className="mb-4 rounded-ctl bg-alt px-3 py-2 font-mono text-sm font-bold select-all">{tempPassword}</p>
                <div className="flex justify-end">
                  <button type="button" className="btn-primary" onClick={closeDialog}>{l.cancel}</button>
                </div>
              </>
            )}

            {dialog.kind === 'create' && !tempPassword && (
              <form onSubmit={handleCreate} className="flex flex-col gap-4" noValidate>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{l.username}</span>
                  <input type="text" name="username" required autoComplete="off" className="field" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{l.profile}</span>
                  <select name="profile_id" required className="field">
                    {profileOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{l.firstName}</span>
                  <input type="text" name="first_name" autoComplete="off" className="field" />
                </label>
                <input type="hidden" name="scope_kind" value="all" />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="btn-secondary" onClick={closeDialog} disabled={isPending}>{l.cancel}</button>
                  <button type="submit" className="btn-primary" disabled={isPending}>
                    {isPending ? l.loading : l.confirm}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
