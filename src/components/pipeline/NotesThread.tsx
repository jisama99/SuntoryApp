'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { addNoteAction, withdrawNoteAction } from '@/app/[locale]/(app)/proposals/actions';
import { Button } from '@/components/Button';
import { useConfirmation } from '@/components/Confirmation';
import { SelectField } from '@/components/SelectField';
import { StatusTag } from '@/components/StatusTag';
import type { Tone } from '@/components/StatusTag';
import { TextareaField } from '@/components/TextareaField';
import type { Note } from '@/data/schemas';
import { NOTE_VISIBILITIES } from '@/domain/types';
import type { Locale, NoteObjectKind, NoteVisibility } from '@/domain/types';
import { formatDate } from '@/lib/format';

const VISIBILITY_TONE: Record<NoteVisibility, Tone> = { agency_internal: 'neutral', shared_client: 'attention', shared_recipient: 'info' };

/**
 * Fil de notes d'une proposition ou d'une décision (D162). Interne agence par défaut ; le badge de visibilité est toujours
 * affiché ; partager exige une confirmation ; une note partagée se retire avec trace, sans jamais redevenir interne.
 */
export function NotesThread({ objectKind, objectId, notes, canWrite, recipients }: {
  objectKind: NoteObjectKind;
  objectId: string;
  notes: Note[];
  canWrite: boolean;
  /** Destinataires possibles : la zone du secteur et ses ancêtres. */
  recipients: Array<{ id: string; text: string }>;
}) {
  const t = useTranslations('pipeline.notes');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<NoteVisibility>('agency_internal');
  const [recipient, setRecipient] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sharing = visibility !== 'agency_internal';
  const id = `${objectKind}-${objectId}`;

  const add = () =>
    startTransition(async () => {
      const r = await addNoteAction({ locale, objectKind, objectId, text, visibility, recipientZoneId: recipient, confirmShare: confirmed });
      if (r.status === 'ok') {
        announce(tc('saved'), { undoToken: r.undoToken });
        setText('');
        setConfirmed(false);
        setVisibility('agency_internal');
        setRecipient('');
        setResult(null);
      } else {
        setResult(r.status === 'refused' ? r.reason : 'invalid');
      }
    });

  const withdraw = (noteId: string) =>
    startTransition(async () => {
      const r = await withdrawNoteAction({ locale, noteId });
      if (r.status === 'ok') announce(tc('saved'), { undoToken: r.undoToken });
      else setResult(r.status === 'refused' ? r.reason : 'invalid');
    });

  return (
    <div className="flex flex-col gap-3" data-testid={`notes-${id}`}>
      <h4 className="font-semibold">{t('title')}</h4>
      {notes.length === 0 ? <p className="text-muted">{t('empty')}</p> : null}
      <ul className="flex flex-col gap-2">
        {notes.map((n) => (
          <li key={n.id} data-note-visibility={n.visibility} className="flex flex-col gap-2 rounded-ctl bg-alt px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag tone={VISIBILITY_TONE[n.visibility]}>{t(`visibility.${n.visibility}`)}</StatusTag>
              {n.withdrawn_on ? <StatusTag tone="neutral">{t('withdrawnOn', { date: formatDate(n.withdrawn_on, locale) })}</StatusTag> : null}
              <span className="text-sm text-muted">{t('by', { date: formatDate(n.created_on, locale) })}</span>
            </div>
            <p className={n.withdrawn_on ? 'text-muted' : ''}>{n.text}</p>
            {canWrite && !n.withdrawn_on && n.visibility !== 'agency_internal' ? (
              <Button type="button" variant="ghost" className="w-fit" disabled={pending} onClick={() => withdraw(n.id)}>{t('withdraw')}</Button>
            ) : null}
          </li>
        ))}
      </ul>
      {canWrite ? (
        <form noValidate onSubmit={(e) => { e.preventDefault(); add(); }} className="grid max-w-xl gap-3 rounded-ctl bg-alt p-4">
          <TextareaField id={`note-text-${id}`} label={t('text')} value={text} maxLength={500} onChange={(e) => { setText(e.target.value); setResult(null); }} />
          <SelectField
            id={`note-visibility-${id}`}
            label={t('visibilityLabel')}
            placeholder={t('choose')}
            value={visibility}
            options={NOTE_VISIBILITIES.map((v) => ({ value: v, text: t(`visibility.${v}`) }))}
            onChange={(e) => { setVisibility((e.target.value || 'agency_internal') as NoteVisibility); setConfirmed(false); setResult(null); }}
          />
          {visibility === 'shared_recipient' ? (
            <SelectField id={`note-recipient-${id}`} label={t('recipient')} placeholder={t('choose')} value={recipient} options={recipients.map((r) => ({ value: r.id, text: r.text }))} onChange={(e) => { setRecipient(e.target.value); setResult(null); }} />
          ) : null}
          {sharing ? (
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="checkbox" className="size-5" checked={confirmed} onChange={(e) => { setConfirmed(e.target.checked); setResult(null); }} />
              <span className="font-semibold">{t('confirmShare')}</span>
            </label>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="secondary" disabled={pending || text.trim() === ''}>{t('add')}</Button>
            <div aria-live="polite">{result ? <StatusTag tone="risk">{t(`refused.${result}`)}</StatusTag> : null}</div>
          </div>
        </form>
      ) : null}
    </div>
  );
}
