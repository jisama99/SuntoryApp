import { getTranslations } from 'next-intl/server';
import { StatusTag } from './StatusTag';
import { Tile } from './Tile';

interface Bar {
  id: string;
  value: number;
}

/**
 * Modèle de page rapport (D123) : titre-conclusion, bandeau de chiffres clés, graphique simple, note de lecture.
 * Même grammaire que les rapports PDF et PPT : une page, un message. Valeurs de démonstration, aucune règle métier.
 */
export async function ReportTemplate() {
  const t = await getTranslations('gallery.report');
  const bars: Bar[] = [
    { id: 'a', value: 62 },
    { id: 'b', value: 48 },
    { id: 'c', value: 35 },
    { id: 'd', value: 21 },
  ];
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <article aria-labelledby="g-report-title" className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card print:p-0 print:shadow-none lg:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-muted-strong">{t('kicker')}</p>
        <h3 id="g-report-title" className="text-xl font-semibold tracking-tight text-title">{t('headline')}</h3>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <Tile tone="anchor" size="xl" label={t('global')} value="74 %" className="justify-between lg:row-span-2">
          <p>{t('goalMet')}</p>
          <span className="mt-3 block h-3 rounded-full bg-on-fill/20">
            <span className="block h-3 rounded-full bg-aqua" style={{ width: '74%' }} />
          </span>
        </Tile>
        <Tile tone="aqua" label={t('volume')} value="128">{t('stable')}</Tile>
        <Tile tone="lav" label={t('budget')} value="61 %">{t('onTarget')}</Tile>
        <Tile tone="sand" label={t('zones')} value="12">{t('upToDate')}</Tile>
        <Tile tone="aqua" attention label={t('todo')} value="9">
          <StatusTag tone="important">{t('priority')}</StatusTag>
        </Tile>
      </div>

      <section aria-labelledby="g-report-chart" className="flex flex-col gap-3 rounded-card bg-alt p-5">
        <h4 id="g-report-chart" className="text-base font-semibold">{t('chart')}</h4>
        <ul className="flex flex-col gap-3">
          {bars.map((b, index) => (
            <li key={b.id} className="grid grid-cols-[var(--report-label-col)_1fr_var(--report-value-col)] items-center gap-3">
              <span className="text-sm">{t(`series.${b.id}`)}</span>
              <span className="h-3 rounded-full bg-surface">
                <span
                  className={`block h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-field'}`}
                  style={{ width: `${Math.round((b.value / max) * 100)}%` }}
                />
              </span>
              <span className="tabular text-right text-sm font-semibold">{b.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-strong">{t('note')}</p>
    </article>
  );
}
