import { getTranslations } from 'next-intl/server';
import { Icon } from './Icon';
import { Button } from './Button';
import { DataTable } from './DataTable';
import { Field } from './Field';
import { MENU_ICONS } from './icons';
import { ReportTemplate } from './ReportTemplate';
import { StatusTag } from './StatusTag';
import { ConflictState, EmptyState, ErrorState, LoadingState } from './States';

interface Row {
  id: string;
  name: string;
  tone: 'ok' | 'attention';
  tagLabel: string;
  value: string;
}

/** Page de contrôle visuel des composants communs (lot A1). Aucune donnée métier. */
export async function Gallery() {
  const t = await getTranslations('gallery');
  const s = await getTranslations('states');
  const m = await getTranslations('menu');
  const rows: Row[] = [
    { id: 'a', name: t('rowA'), tone: 'ok', tagLabel: t('tagOk'), value: '12' },
    { id: 'b', name: t('rowB'), tone: 'attention', tagLabel: t('tagAttention'), value: '8' },
  ];
  return (
    <div className="flex flex-col gap-10">
      <p className="text-muted print:hidden">{t('intro')}</p>

      <section aria-labelledby="g-buttons" className="print:hidden flex flex-col gap-3">
        <h2 id="g-buttons" className="text-lg font-semibold">{t('buttons')}</h2>
        <div className="flex flex-wrap gap-3">
          <Button>{t('primary')}</Button>
          <Button variant="secondary">{t('secondary')}</Button>
          <Button variant="ghost">{t('ghost')}</Button>
          <Button disabled>{t('disabled')}</Button>
        </div>
      </section>

      <section aria-labelledby="g-fields" className="print:hidden grid max-w-xl gap-4">
        <h2 id="g-fields" className="text-lg font-semibold">{t('fields')}</h2>
        <Field id="g-field-1" label={t('fieldLabel')} hint={t('fieldHint')} />
        <Field id="g-field-2" label={t('fieldErrorLabel')} error={t('fieldError')} defaultValue="x" />
      </section>

      <section aria-labelledby="g-tags" className="print:hidden flex flex-col gap-3">
        <h2 id="g-tags" className="text-lg font-semibold">{t('tags')}</h2>
        <div className="flex flex-wrap gap-3">
          <StatusTag tone="neutral">{t('tagNeutral')}</StatusTag>
          <StatusTag tone="info">{t('tagInfo')}</StatusTag>
          <StatusTag tone="ok">{t('tagOk')}</StatusTag>
          <StatusTag tone="attention">{t('tagAttention')}</StatusTag>
          <StatusTag tone="risk">{t('tagRisk')}</StatusTag>
          <StatusTag tone="important">{t('tagImportant')}</StatusTag>
        </div>
      </section>

      <section aria-labelledby="g-table" className="print:hidden flex flex-col gap-3">
        <h2 id="g-table" className="text-lg font-semibold">{t('table')}</h2>
        <DataTable<Row>
          caption={t('tableCaption')}
          rowKey={(r) => r.id}
          rows={rows}
          columns={[
            { key: 'name', header: t('colName'), render: (r) => r.name },
            { key: 'status', header: t('colStatus'), render: (r) => <StatusTag tone={r.tone}>{r.tagLabel}</StatusTag> },
            { key: 'value', header: t('colValue'), render: (r) => r.value, numeric: true },
          ]}
        />
      </section>

      <section aria-labelledby="g-states" className="print:hidden grid gap-4 md:grid-cols-2">
        <h2 id="g-states" className="text-lg font-semibold md:col-span-2">{t('states')}</h2>
        <EmptyState title={s('empty.title')} body={s('empty.body')} />
        <LoadingState title={s('loading.title')} body={s('loading.body')} />
        <ErrorState title={s('error.title')} body={s('error.body')} />
        <ConflictState title={s('conflict.title')} body={s('conflict.body')} />
      </section>

      <section aria-labelledby="g-report" className="flex flex-col gap-3">
        <h2 id="g-report" className="text-lg font-semibold print:hidden">{t('reportTitle')}</h2>
        <ReportTemplate />
      </section>

      <section aria-labelledby="g-icons" className="print:hidden flex flex-col gap-3">
        <h2 id="g-icons" className="text-lg font-semibold">{t('icons')}</h2>
        <ul className="flex flex-wrap gap-4">
          {Object.entries(MENU_ICONS).map(([key, Glyph]) => (
            <li key={key} className="flex items-center gap-2 rounded-ctl bg-alt px-3 py-2">
              <Icon icon={Glyph} size="md" />
              <span>{m(key)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
