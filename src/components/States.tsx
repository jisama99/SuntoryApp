import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';

function Frame({ icon, title, body, role, children }: {
  icon: keyof typeof UI_ICONS;
  title: string;
  body: string;
  role?: 'status' | 'alert';
  children?: ReactNode;
}) {
  const Glyph = UI_ICONS[icon];
  return (
    <div
      role={role}
      className="flex flex-col items-center gap-3 rounded-card bg-tint-aqua px-6 py-10 text-center"
    >
      <Icon icon={Glyph} size="xl" className="text-muted" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-prose text-muted">{body}</p>
      {children ? <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}

export const EmptyState = (p: { title: string; body: string }) => <Frame icon="empty" {...p} />;
/** Squelette de page (D159) : des blocs de la forme du contenu, sans roue qui tourne. Le titre reste lu par les lecteurs d'écran. */
export function LoadingState({ title, body }: { title: string; body: string }) {
  const bar = 'rounded-ctl bg-muted/15 motion-safe:animate-skeleton';
  return (
    <div role="status" aria-busy="true" data-testid="skeleton" className="flex flex-col gap-6">
      <p className="sr-only">{`${title}. ${body}`}</p>
      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className={`h-8 w-1/3 ${bar}`} />
        <div className={`h-4 w-2/3 ${bar}`} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={`h-10 ${bar}`} />
        ))}
      </div>
    </div>
  );
}
export const ErrorState = (p: { title: string; body: string; children?: ReactNode }) => (
  <Frame icon="risk" role="alert" {...p} />
);
export const ConflictState = (p: { title: string; body: string; children?: ReactNode }) => (
  <Frame icon="conflict" role="alert" {...p} />
);
