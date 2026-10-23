import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';

export type Tone = 'neutral' | 'info' | 'ok' | 'attention' | 'risk' | 'important';

const TONES: Record<Tone, { icon: keyof typeof UI_ICONS; cls: string }> = {
  neutral: { icon: 'neutral', cls: 'bg-alt text-ink' },
  info: { icon: 'info', cls: 'bg-sel text-ink' },
  ok: { icon: 'ok', cls: 'bg-ok-soft text-ok' },
  attention: { icon: 'attention', cls: 'bg-warn-soft text-warn' },
  risk: { icon: 'risk', cls: 'bg-danger-soft text-danger' },
  // Le rose signifie « important / à traiter », jamais « erreur » (charte mixte, doc 14).
  important: { icon: 'important', cls: 'bg-pink-pale text-navy' },
};

/** Étiquette de statut : icône de forme distincte + texte, jamais la couleur seule. */
export function StatusTag({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { icon, cls } = TONES[tone];
  const Glyph = UI_ICONS[icon];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>
      <Icon icon={Glyph} size="sm" />
      {children}
    </span>
  );
}
