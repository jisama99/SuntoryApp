'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../Icon';
import { UI_ICONS } from '../icons';

/**
 * Champ commun des sélecteurs de date, de période et de semaine (D133) : bouton en lecture seule qui ouvre un
 * calendrier. Aucune saisie au clavier de la date : la valeur vient toujours du calendrier.
 */
export function PickerField({ id, label, labelHidden = false, valueText, placeholder, hint, error, open, onOpenChange, panelLabel, children }: {
  id: string;
  label: string;
  /** Libellé masqué visuellement (tableau de saisie en lot), toujours lu par les lecteurs d'écran. */
  labelHidden?: boolean;
  valueText: string | null;
  placeholder: string;
  hint?: string;
  error?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelLabel: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const hintId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  const described = [hint ? `${hintId}-hint` : null, error ? `${hintId}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div ref={root} className="relative flex flex-col gap-1">
      <label htmlFor={id} className={labelHidden ? 'sr-only' : 'text-sm font-semibold'}>
        {label}
      </label>
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={described}
        onClick={() => onOpenChange(!open)}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-ctl border bg-surface px-3 text-left ${
          error ? 'border-2 border-danger' : 'border-field'
        } ${valueText ? 'text-ink' : 'text-muted'}`}
      >
        <span className="tabular">{valueText ?? placeholder}</span>
        <Icon icon={UI_ICONS.calendar} size="md" className="text-muted" />
      </button>
      {hint ? (
        <p id={`${hintId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${hintId}-error`} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      {open ? (
        <div role="dialog" aria-label={panelLabel} className="absolute left-0 top-full z-30 mt-2 max-w-[calc(100vw-2rem)] rounded-card bg-surface p-3 shadow-card">
          {children}
        </div>
      ) : null}
    </div>
  );
}
