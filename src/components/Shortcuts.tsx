'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from './Button';
import type { NavItem } from './NavLinks';

/** Touche de la seconde frappe, par entrée de menu. Les mêmes lettres dans les deux langues. */
const GO_KEYS: Record<string, string> = { home: 'h', dashboard: 'd', needs: 'n', alerts: 'a', settings: 's' };
const SEQUENCE_MS = 1500;
const KEY = { help: '?', create: 'c', prefix: 'g', escape: 'Esc' } as const;

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/**
 * Raccourcis clavier documentés (directive 9) : « ? » ouvre la liste, « g » puis une lettre ouvre une page, « c » crée un
 * besoin. Ignorés pendant une saisie et avec une touche de commande, pour ne gêner ni les champs ni le navigateur.
 */
export function Shortcuts({ items, canCreate, createHref }: { items: NavItem[]; canCreate: boolean; createHref: string }) {
  const t = useTranslations('shortcuts');
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const goTo = useRef<number>(Number.NEGATIVE_INFINITY);

  const entries = items.filter((i) => GO_KEYS[i.key]).map((i) => ({ key: GO_KEYS[i.key] as string, label: i.label, href: i.href }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
      if (e.key === KEY.help) {
        e.preventDefault();
        dialog.current?.showModal();
        setOpen(true);
        return;
      }
      if (dialog.current?.open) return;
      if (e.key === KEY.prefix) {
        goTo.current = e.timeStamp;
        return;
      }
      if (e.timeStamp - goTo.current < SEQUENCE_MS) {
        const hit = entries.find((x) => x.key === e.key);
        goTo.current = Number.NEGATIVE_INFINITY;
        if (hit) router.push(hit.href);
        return;
      }
      if (e.key === KEY.create && canCreate) router.push(createHref);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const close = () => dialog.current?.close();
  const kbd = 'rounded-ctl bg-alt px-2 py-1 font-mono text-sm font-semibold';

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="max-lg:hidden"
        aria-keyshortcuts={KEY.help}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        {t('hint')}
      </Button>
      <dialog
      ref={dialog}
      aria-labelledby="shortcuts-title"
      onClose={() => setOpen(false)}
      className="m-auto w-full max-w-lg rounded-card bg-surface p-6 text-ink shadow-card backdrop:bg-ink/30"
    >
      {open ? (
        <div className="flex flex-col gap-4">
          <h2 id="shortcuts-title" className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-muted">{t('intro')}</p>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
            <dt><kbd className={kbd}>{KEY.help}</kbd></dt>
            <dd>{t('help')}</dd>
            {canCreate ? (
              <>
                <dt><kbd className={kbd}>{KEY.create}</kbd></dt>
                <dd>{t('create')}</dd>
              </>
            ) : null}
            {entries.map((e) => (
              <div key={e.key} className="contents">
                <dt><kbd className={kbd}>{KEY.prefix}</kbd> <kbd className={kbd}>{e.key}</kbd></dt>
                <dd>{t('goTo', { page: e.label })}</dd>
              </div>
            ))}
            <dt><kbd className={kbd}>{KEY.escape}</kbd></dt>
            <dd>{t('close')}</dd>
          </dl>
          <div>
            <Button type="button" variant="secondary" onClick={close}>{t('closeButton')}</Button>
          </div>
        </div>
      ) : null}
    </dialog>
    </>
  );
}
