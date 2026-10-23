import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';

function Frame({ icon, title, body, role, children, spin }: {
  icon: keyof typeof UI_ICONS;
  title: string;
  body: string;
  role?: 'status' | 'alert';
  children?: ReactNode;
  spin?: boolean;
}) {
  const Glyph = UI_ICONS[icon];
  return (
    <div
      role={role}
      aria-busy={spin ? true : undefined}
      className="flex flex-col items-center gap-3 rounded-card bg-tint-aqua px-6 py-10 text-center"
    >
      <Icon icon={Glyph} size="xl" className={`text-muted ${spin ? 'motion-safe:animate-spin' : ''}`} />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-prose text-muted">{body}</p>
      {children ? <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div> : null}
    </div>
  );
}

export const EmptyState = (p: { title: string; body: string }) => <Frame icon="empty" {...p} />;
export const LoadingState = (p: { title: string; body: string }) => <Frame icon="loading" role="status" spin {...p} />;
export const ErrorState = (p: { title: string; body: string; children?: ReactNode }) => (
  <Frame icon="risk" role="alert" {...p} />
);
export const ConflictState = (p: { title: string; body: string; children?: ReactNode }) => (
  <Frame icon="conflict" role="alert" {...p} />
);
