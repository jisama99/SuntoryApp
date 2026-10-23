import { Link } from '@/i18n/navigation';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
  /** En-tête de ligne (première colonne d'une matrice). */
  rowHeader?: boolean;
  /** Valeur de tri. Sans elle, la colonne n'est pas triable. */
  sortValue?: (row: T) => string | number | null;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

/** Tri lu dans l'URL (règle 14) : une colonne inconnue ou non triable est ignorée. */
export function parseSort<T>(raw: { sort?: string; dir?: string }, columns: Column<T>[]): SortState | null {
  const col = columns.find((c) => c.key === raw.sort && c.sortValue);
  return col ? { key: col.key, dir: raw.dir === 'desc' ? 'desc' : 'asc' } : null;
}

export function sortRows<T>(rows: T[], columns: Column<T>[], sort: SortState | null): T[] {
  const col = sort ? columns.find((c) => c.key === sort.key) : undefined;
  if (!sort || !col?.sortValue) return rows;
  const value = col.sortValue;
  const sign = sort.dir === 'desc' ? -1 : 1;
  // Les valeurs absentes passent en dernier, quel que soit le sens.
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return sign * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'fr', { numeric: true }));
  });
}

export interface SortLabels {
  /** Nom de la liste des critères de tri sur mobile. */
  label: string;
  asc: string;
  desc: string;
}

/**
 * Tableau accessible. Au-dessus de 640 px : tableau, en-tête fixe pendant le défilement. En dessous : cartes empilées,
 * une ligne de libellé par valeur, et une liste de critères de tri puisque l'en-tête disparaît.
 */
export function DataTable<T>({ caption, columns, rows, rowKey, rowId, rowData, testId, sort, sortHref, sortLabels }: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Ancre de ligne (liens vers un besoin existant). */
  rowId?: (row: T) => string;
  /** Attributs data-* de la ligne (repères pour les tests et le suivi). */
  rowData?: (row: T) => Record<`data-${string}`, string>;
  testId?: string;
  sort?: SortState | null;
  /** Adresse de la page triée (les autres paramètres de l'URL sont conservés par l'appelant). */
  sortHref?: (key: string, dir: 'asc' | 'desc') => string;
  sortLabels?: SortLabels;
}) {
  const sortable = columns.filter((c) => c.sortValue);
  const canSort = Boolean(sortHref && sortLabels && sortable.length > 0);
  const nextDir = (key: string): 'asc' | 'desc' => (sort?.key === key && sort.dir === 'asc' ? 'desc' : 'asc');
  const ariaSort = (key: string) => (sort?.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined);
  const dirText = (key: string) => (sort?.key === key ? (sort.dir === 'asc' ? sortLabels?.asc : sortLabels?.desc) : null);

  return (
    <div className="flex flex-col gap-3">
      {canSort ? (
        <nav aria-label={sortLabels?.label} className="sm:hidden">
          <ul className="flex flex-wrap gap-2">
            {sortable.map((c) => (
              <li key={c.key}>
                <Link
                  href={sortHref?.(c.key, nextDir(c.key)) ?? '#'}
                  scroll={false}
                  aria-current={sort?.key === c.key ? 'true' : undefined}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-full px-4 text-sm font-semibold hover:bg-sel ${sort?.key === c.key ? 'bg-sel text-ink' : 'bg-alt text-link'}`}
                >
                  {c.header}
                  {sort?.key === c.key ? <Icon icon={sort.dir === 'asc' ? UI_ICONS.sortAsc : UI_ICONS.sortDesc} size="sm" /> : null}
                  {dirText(c.key) ? <span className="sr-only">{dirText(c.key)}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <div className="max-h-(--table-max-h) overflow-auto max-sm:max-h-none max-sm:overflow-visible rounded-card bg-surface shadow-card max-sm:bg-transparent max-sm:shadow-none">
        <table data-testid={testId} className="block w-full border-collapse text-left text-sm sm:table">
          <caption className="block px-4 py-3 text-left text-sm font-semibold text-muted sm:table-caption">{caption}</caption>
          <thead className="max-sm:sr-only">
            <tr className="bg-alt">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={ariaSort(c.key)}
                  className={`sticky top-0 z-10 bg-alt px-4 py-2 font-semibold ${c.numeric ? 'text-right' : ''}`}
                >
                  {canSort && c.sortValue ? (
                    <Link
                      href={sortHref?.(c.key, nextDir(c.key)) ?? '#'}
                      scroll={false}
                      className="inline-flex min-h-11 items-center gap-1 hover:text-link"
                    >
                      {c.header}
                      <Icon icon={sort?.key === c.key ? (sort.dir === 'asc' ? UI_ICONS.sortAsc : UI_ICONS.sortDesc) : UI_ICONS.sortNone} size="sm" className={sort?.key === c.key ? '' : 'text-muted'} />
                      {dirText(c.key) ? <span className="sr-only">{dirText(c.key)}</span> : null}
                    </Link>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="max-sm:block">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                id={rowId?.(row)}
                {...rowData?.(row)}
                className="even:bg-alt/60 target:bg-sel max-sm:mb-3 max-sm:block max-sm:rounded-card max-sm:bg-surface max-sm:p-3 max-sm:shadow-card max-sm:even:bg-surface"
              >
                {columns.map((c) => {
                  const cell = `px-4 py-3 max-sm:flex max-sm:items-start max-sm:justify-between max-sm:gap-4 max-sm:px-1 max-sm:py-2 max-sm:before:font-semibold max-sm:before:text-muted max-sm:before:content-[attr(data-label)] ${c.numeric ? 'text-right tabular-nums max-sm:text-left' : ''}`;
                  return c.rowHeader ? (
                    <th key={c.key} scope="row" data-label={c.header} className={`${cell} text-left font-semibold`}>{c.render(row)}</th>
                  ) : (
                    <td key={c.key} data-label={c.header} className={cell}>{c.render(row)}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
