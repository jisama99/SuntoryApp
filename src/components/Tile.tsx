import type { ReactNode } from 'react';

export type TileTone = 'aqua' | 'lav' | 'sand' | 'anchor';

const TONES: Record<TileTone, { box: string; sub: string }> = {
  aqua: { box: 'bg-tint-aqua text-ink', sub: 'text-muted-strong' },
  lav: { box: 'bg-tint-lav text-ink', sub: 'text-muted-strong' },
  sand: { box: 'bg-tint-sand text-ink', sub: 'text-muted-strong' },
  anchor: { box: 'bg-anchor text-white', sub: 'text-white/85' },
};
const ATTENTION = { box: 'bg-tint-rose text-ink', sub: 'text-muted-strong' };

/**
 * Tuile de chiffre clé (D126). Teinte par famille d'indicateur (aqua, lavande, sable), tuile d'ancrage marine pour le
 * résultat principal. Le rose n'existe que par `attention` : il signale une carte qui demande une action.
 */
export function Tile({ label, value, tone, attention = false, size = 'md', className = '', children }: {
  label: string;
  value: string;
  tone: TileTone;
  attention?: boolean;
  size?: 'md' | 'xl';
  className?: string;
  children?: ReactNode;
}) {
  const c = attention ? ATTENTION : TONES[tone];
  return (
    <div className={`flex flex-col gap-2 rounded-card p-5 shadow-card ${c.box} ${className}`.trim()}>
      <span className={`text-sm ${c.sub}`}>{label}</span>
      <span className={`tabular font-semibold tracking-tight ${size === 'xl' ? 'text-6xl' : 'text-4xl'}`}>{value}</span>
      {children ? <div className={`text-sm font-semibold ${c.sub}`}>{children}</div> : null}
    </div>
  );
}
