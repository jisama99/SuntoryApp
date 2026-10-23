import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { FilterTabs } from '@/components/FilterTabs';
import { PageHeader } from '@/components/PageHeader';
import { ParamEditor } from '@/components/ParamEditor';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { repository } from '@/data';
import { PARAM_KEYS } from '@/data/schemas';
import type { ParamChange, ParamKey } from '@/data/schemas';
import { dispositifDeadline, monthWeeks } from '@/domain/deadlines';
import { DISPOSITIFS } from '@/domain/types';
import type { Dispositif, Locale } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { formatParamValue, PARAM_STATUS } from '@/lib/param-format';
import type { Translate } from '@/lib/param-format';
import { campaignText } from '@/lib/labels';
import { getAccessContext } from '@/lib/session';

const SCOPES = ['all', ...DISPOSITIFS] as const;

/** Paramètres des dispositifs (F-30.10) : tableau, valeur de départ visible, historique des modifications (doc 28 §2.5). */
export default async function DispositifsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const one = (k: string) => (Array.isArray(query[k]) ? query[k]?.[0] : query[k]) ?? '';
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const menu = await repository.getMenu(ctx);
  if (!menu.some((e) => e.key === 'settings')) notFound();
  const t = await getTranslations();
  const tp = (await getTranslations('params')) as unknown as Translate;
  const loc = ctx.locale;
  const [list, history, campaigns, assignments, deadline] = await Promise.all([
    repository.getDispositifParams(ctx), repository.getParamHistory(ctx), repository.getCampaigns(ctx),
    repository.getCampaignDispositifs(ctx), repository.getDeadlineContext(ctx),
  ]);
  const canEdit = repository.canManageSettings(ctx);
  const scope = (SCOPES as readonly string[]).includes(one('dispositif')) ? one('dispositif') : 'all';
  const hist = (SCOPES as readonly string[]).includes(one('history')) ? one('history') : 'all';
  const shown = hist === 'all' ? history : history.filter((h: ParamChange) => h.dispositif === hist);
  const valueOf = (d: Dispositif, k: ParamKey) => list.find((p) => p.dispositif === d)?.[k];
  const keepScope: Record<string, string> = scope !== 'all' ? { dispositif: scope } : {};
  const keepHist: Record<string, string> = hist !== 'all' ? { history: hist } : {};
  const second = list.find((p) => p.dispositif === 'second_placement');
  const h2 = (reading: 'last_full_week' | 'week_of_last_day') => {
    if (!second) return null;
    const lead = dispositifDeadline('2026-12', 'change_request', second, deadline.settings);
    const w = monthWeeks('2026-11', reading);
    const pen = w.length >= 2 ? w[w.length - 2] : undefined;
    return { lead: lead?.date ?? null, week: pen ?? null };
  };
  const readA = h2('last_full_week');
  const readB = h2('week_of_last_day');
  const statusTone = (s: string) => (s === 'validated' ? 'ok' : s === 'partlyBlocking' ? 'risk' : 'attention');

  return (
    <>
      <Breadcrumb items={[{ label: t('menu.settings'), href: '/settings' }, { label: t('titles.schemeSettings') }]} />
      <PageHeader title={t('titles.schemeSettings')} subtitle={t(`role.${ctx.profileId}`)} />
      <p className="mb-4 max-w-prose text-muted">{t('settings.dispositifs.intro')}</p>
      {canEdit ? null : <p className="mb-4 text-muted">{t('settings.readOnly')}</p>}

      <div className="mb-4">
        <FilterTabs
          label={t('params.scopeLabel')}
          basePath="/settings/dispositifs"
          param="dispositif"
          current={scope}
          keep={keepHist}
          items={SCOPES.map((s) => ({ value: s, text: s === 'all' ? t('params.allDispositifs') : t(`dispositif.${s}`) }))}
        />
      </div>

      <div className="mb-8">
        {scope === 'all' ? (
          <DataTable<ParamKey>
            testId="params-compare"
            caption={t('params.compareCaption')}
            rows={[...PARAM_KEYS]}
            rowKey={(k) => k}
            columns={[
              { key: 'param', header: t('params.cols.param'), rowHeader: true, render: (k) => t(`params.keys.${k}`) },
              ...DISPOSITIFS.map((d): Column<ParamKey> => ({ key: d, header: t(`dispositif.${d}`), render: (k) => formatParamValue(k, valueOf(d, k), tp, loc) })),
            ]}
          />
        ) : (
          <DataTable<ParamKey>
            testId="params-detail"
            caption={t('params.detailCaption', { name: t(`dispositif.${scope as Dispositif}`) })}
            rows={[...PARAM_KEYS]}
            rowKey={(k) => k}
            rowData={(k) => ({ 'data-param': k })}
            columns={[
              { key: 'param', header: t('params.cols.param'), rowHeader: true, render: (k) => t(`params.keys.${k}`) },
              { key: 'value', header: t('params.cols.value'), render: (k) => formatParamValue(k, valueOf(scope as Dispositif, k), tp, loc) },
              { key: 'status', header: t('params.cols.status'), render: (k) => <StatusTag tone={statusTone(PARAM_STATUS[k])}>{t(`params.status.${PARAM_STATUS[k]}`)}</StatusTag> },
              ...(canEdit
                ? [{ key: 'actions', header: t('params.cols.actions'), render: (k: ParamKey) => <ParamEditor dispositif={scope as Dispositif} paramKey={k} value={valueOf(scope as Dispositif, k)} /> }]
                : []),
            ]}
          />
        )}
      </div>

      <section aria-labelledby="h2-title" className="mb-8 flex flex-col gap-3 rounded-card bg-tint-lav p-5 shadow-card" data-testid="h2-example">
        <h2 id="h2-title" className="text-lg font-semibold">{t('params.h2.title')}</h2>
        <StatusTag tone="attention">{t('params.h2.label')}</StatusTag>
        <p>{t('params.h2.lead', { date: readA?.lead ? formatDate(readA.lead, loc) : t('params.value.undefined') })}</p>
        <p>{t('params.h2.readingA', { from: readA?.week ? formatDate(readA.week.start, loc) : '', to: readA?.week ? formatDate(readA.week.end, loc) : '' })}</p>
        <p>{t('params.h2.readingB', { from: readB?.week ? formatDate(readB.week.start, loc) : '', to: readB?.week ? formatDate(readB.week.end, loc) : '' })}</p>
      </section>

      <section aria-labelledby="hist-title" className="mb-8 flex flex-col gap-3">
        <h2 id="hist-title" className="text-lg font-semibold">{t('params.history.title')}</h2>
        <FilterTabs
          label={t('params.history.filter')}
          basePath="/settings/dispositifs"
          param="history"
          current={hist}
          keep={keepScope}
          items={SCOPES.map((s) => ({ value: s, text: s === 'all' ? t('params.allDispositifs') : t(`dispositif.${s}`) }))}
        />
        {shown.length === 0 ? (
          <EmptyState title={t('states.empty.title')} body={t('params.history.empty')} />
        ) : (
          <DataTable<ParamChange>
            testId="params-history"
            caption={t('params.history.caption')}
            rows={shown}
            rowKey={(h) => h.id}
            columns={[
              { key: 'date', header: t('params.history.cols.date'), render: (h) => formatDate(h.changed_on, loc) },
              { key: 'actor', header: t('params.history.cols.actor'), render: (h) => t(`profile.${h.actor_profile}`) },
              { key: 'dispositif', header: t('params.history.cols.dispositif'), render: (h) => t(`dispositif.${h.dispositif}`) },
              { key: 'param', header: t('params.history.cols.param'), render: (h) => t(`params.keys.${h.key}`) },
              { key: 'old', header: t('params.history.cols.old'), render: (h) => formatParamValue(h.key, h.old_value, tp, loc) },
              { key: 'new', header: t('params.history.cols.new'), render: (h) => <span className="font-semibold">{formatParamValue(h.key, h.new_value, tp, loc)}</span> },
            ]}
          />
        )}
      </section>

      <section aria-labelledby="camp-title" className="mb-8 flex flex-col gap-3">
        <h2 id="camp-title" className="text-lg font-semibold">{t('params.campaigns.title')}</h2>
        <p className="max-w-prose text-muted">{t('params.campaigns.help')}</p>
        <ul className="flex flex-col gap-2">
          {campaigns.map((c) => {
            const { code: campaignCode } = c;
            return (
            <li key={campaignCode} className="flex flex-wrap items-center gap-2 rounded-ctl bg-surface px-4 py-2 shadow-card">
              <span>{campaignText(c, loc)}</span>
              {(assignments[campaignCode] ?? []).map((d) => <StatusTag key={d} tone="info">{t(`dispositif.${d}`)}</StatusTag>)}
            </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
