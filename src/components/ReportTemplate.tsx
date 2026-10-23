import { getTranslations } from 'next-intl/server';
import { StatusTag } from './StatusTag';

interface Kpi {
  id: string;
  value: string;
  tone: 'ok' | 'attention' | 'neutral';
}

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
  const kpis: Kpi[] = [
    { id: '1', value: '128', tone: 'neutral' },
    { id: '2', value: '74 %', tone: 'ok' },
    { id: '3', value: '9', tone: 'attention' },
  ];
  const bars: Bar[] = [
    { id: 'a', value: 62 },
    { id: 'b', value: 48 },
    { id: 'c', value: 35 },
    { id: 'd', value: 21 },
  ];
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <article aria-labelledby="g-report-title" className="flex flex-col gap-6 rounded-card border border-line bg-surface p-6 shadow-card print:border-0 print:p-0 print:shadow-none lg:p-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-muted">{t('kicker')}</p>
        <h3 id="g-report-title" className="text-2xl font-semibold tracking-tight text-title">{t('headline')}</h3>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <li key={k.id} className="flex flex-col gap-2 rounded-ctl bg-alt p-4">
            <span className="text-sm text-muted">{t(`kpi${k.id}`)}</span>
            <span className="tabular text-4xl font-semibold tracking-tight text-title">{k.value}</span>
            <span>
              <StatusTag tone={k.tone}>{t(`kpi${k.id}Tag`)}</StatusTag>
            </span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="g-report-chart" className="flex flex-col gap-3">
        <h4 id="g-report-chart" className="text-base font-semibold">{t('chart')}</h4>
        <ul className="flex flex-col gap-3">
          {bars.map((b, index) => (
            <li key={b.id} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
              <span className="text-sm">{t(`series.${b.id}`)}</span>
              <span className="h-3 rounded-full bg-alt">
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

      <p className="text-sm text-muted">{t('note')}</p>
    </article>
  );
}
