import { PageHeader } from './PageHeader';
import { Visual } from './Visual';
import type { VisualId } from './Visual';

/**
 * En-tête de page avec visuel fondu dans la page (D160). Le texte repose sur un voile dont l'opacité est contrôlée par
 * jeton et testée sur les images réelles. Sans visuel (skin Sobre), c'est l'en-tête ordinaire.
 */
export function HeroHeader({ visual, title, subtitle, priority = false }: { visual: VisualId | null; title: string; subtitle?: string; priority?: boolean }) {
  if (!visual) return <PageHeader title={title} subtitle={subtitle} />;
  return (
    <header data-testid="hero" data-visual={visual} className="relative isolate mb-8 flex min-h-(--hero-min-h-mobile) items-end overflow-hidden rounded-card bg-alt sm:min-h-(--hero-min-h)">
      <Visual id={visual} priority={priority} className="fade-bottom absolute inset-0 -z-10 size-full object-cover" />
      <div className="veil m-4 max-w-xl rounded-card p-5">
        <h1 className="text-xl font-extrabold tracking-tight text-title">{title}</h1>
        {subtitle ? <p className="mt-3 text-muted-strong">{subtitle}</p> : null}
      </div>
    </header>
  );
}
