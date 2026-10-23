import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
}

export function DataTable<T>({ caption, columns, rows, rowKey }: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-card bg-surface shadow-card">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{caption}</caption>
        <thead>
          <tr className="bg-alt">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-4 py-2 font-semibold ${c.numeric ? 'text-right' : ''}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="even:bg-alt/60">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 ${c.numeric ? 'text-right tabular-nums' : ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
