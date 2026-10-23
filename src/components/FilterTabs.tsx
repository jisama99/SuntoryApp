import { Link } from '@/i18n/navigation';

/**
 * Onglets de filtre portés par l'adresse de la page (règle commune 14) : chaque choix est un lien, donc le retour
 * arrière, le rechargement, le lien profond et le partage fonctionnent. `current` vient de l'adresse, jamais d'un état local.
 */
export function FilterTabs({ label, basePath, param, items, current, keep = {} }: {
  label: string;
  basePath: string;
  param: string;
  items: Array<{ value: string; text: string }>;
  current: string;
  /** Autres paramètres d'adresse à conserver. */
  keep?: Record<string, string>;
}) {
  const href = (value: string, first: boolean) => {
    const q = new URLSearchParams(keep);
    if (!first) q.set(param, value);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <Link
          key={it.value}
          href={href(it.value, i === 0)}
          aria-current={current === it.value ? 'true' : undefined}
          scroll={false}
          className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${current === it.value ? 'bg-primary text-white' : 'bg-alt text-ink hover:bg-sel'}`}
        >
          {it.text}
        </Link>
      ))}
    </nav>
  );
}
