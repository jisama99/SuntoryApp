'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { undoWriteAction } from '@/app/[locale]/undo-action';
import type { Locale } from '@/domain/types';
import { Button } from './Button';

interface Shown {
  message: string;
  undoToken: string | null;
  onUndo?: () => void;
  tone: 'ok' | 'info' | 'error';
}
type Announce = (message: string, options?: { undoToken?: string | null; onUndo?: () => void }) => void;

const ConfirmationContext = createContext<Announce>(() => {});

/** Annonce la confirmation d'une écriture et propose de l'annuler (D159). */
export const useConfirmation = (): Announce => useContext(ConfirmationContext);

const VISIBLE_MS = 12_000;

/**
 * Confirmation visible après toute écriture : région vocale, bouton d'annulation, focus déplacé sur le message puis
 * replacé sur l'élément précédent (ou la zone principale) à la fermeture. Ne disparaît pas tant qu'elle a le focus.
 */
export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [shown, setShown] = useState<Shown | null>(null);
  const [pending, setPending] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const restoreFocus = useCallback(() => {
    const target = previous.current && document.contains(previous.current) ? previous.current : document.getElementById('main');
    target?.focus();
    previous.current = null;
  }, []);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setShown(null);
    restoreFocus();
  }, [restoreFocus]);

  const arm = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Le message reste tant qu'il a le focus : on repousse la fermeture d'un tour.
      if (box.current?.contains(document.activeElement)) {
        timer.current = setTimeout(() => setShown(null), VISIBLE_MS);
        return;
      }
      setShown(null);
    }, VISIBLE_MS);
  }, []);

  const announce = useCallback<Announce>((message, options = {}) => {
    if (!previous.current && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) previous.current = document.activeElement;
    setShown({ message, undoToken: options.undoToken ?? null, onUndo: options.onUndo, tone: 'ok' });
    arm();
  }, [arm]);

  useEffect(() => {
    if (shown) box.current?.focus();
  }, [shown]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const undo = async () => {
    if (!shown?.undoToken) return;
    setPending(true);
    const r = await undoWriteAction({ locale, token: shown.undoToken });
    setPending(false);
    if (r.status === 'ok') {
      shown.onUndo?.();
      router.refresh();
      setShown({ message: t('undone'), undoToken: null, tone: 'info' });
    } else {
      setShown({ message: t('expired'), undoToken: null, tone: 'error' });
    }
    arm();
  };

  return (
    <ConfirmationContext.Provider value={announce}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 lg:bottom-6"
      >
        {shown ? (
          <div
            ref={box}
            role="status"
            tabIndex={-1}
            aria-label={t('region')}
            className="pointer-events-auto flex max-w-xl flex-wrap items-center gap-3 rounded-card bg-marine px-5 py-3 text-on-fill shadow-card motion-safe:animate-fade-in"
          >
            <span className="font-semibold">{shown.message}</span>
            {shown.undoToken ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={undo}>{t('undo')}</Button>
            ) : null}
            <Button type="button" variant="ghost" className="text-on-fill" onClick={close}>{t('close')}</Button>
          </div>
        ) : null}
      </div>
    </ConfirmationContext.Provider>
  );
}
