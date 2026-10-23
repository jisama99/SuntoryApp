import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
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
      <Breadcrumb items={[{ label: t('menu.settings'), href: '/settings' }, { label: t('settings.dispositifs.title') }]} />
      <PageHeader title={t('settings.dispositifs.title')} subtitle={t(`role.${ctx.profileId}`)} />
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

      {scope === 'all' ? (
        <div className="mb-8 overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full border-collapse text-left text-sm" data-testid="params-compare">
            <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{t('params.compareCaption')}</caption>
            <thead>
              <tr className="bg-alt">
                <th scope="col" className="px-4 py-2 font-semibold">{t('params.cols.param')}</th>
                {DISPOSITIFS.map((d) => <th key={d} scope="col" className="px-4 py-2 font-semibold">{t(`dispositif.${d}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {PARAM_KEYS.map((k) => (
                <tr key={k} className="even:bg-alt/60">
                  <th scope="row" className="px-4 py-3 font-semibold">{t(`params.keys.${k}`)}</th>
                  {DISPOSITIFS.map((d) => <td key={d} className="px-4 py-3">{formatParamValue(k, valueOf(d, k), tp, loc)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mb-8 overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full border-collapse text-left text-sm" data-testid="params-detail">
            <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{t('params.detailCaption', { name: t(`dispositif.${scope as Dispositif}`) })}</caption>
            <thead>
              <tr className="bg-alt">
                <th scope="col" className="px-4 py-2 font-semibold">{t('params.cols.param')}</th>
                <th scope="col" className="px-4 py-2 font-semibold">{t('params.cols.value')}</th>
                <th scope="col" className="px-4 py-2 font-semibold">{t('params.cols.status')}</th>
                {canEdit ? <th scope="col" className="px-4 py-2 font-semibold">{t('params.cols.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {PARAM_KEYS.map((k) => (
                <tr key={k} className="even:bg-alt/60" data-param={k}>
                  <th scope="row" className="px-4 py-3 align-top font-semibold">{t(`params.keys.${k}`)}</th>
                  <td className="px-4 py-3 align-top">{formatParamValue(k, valueOf(scope as Dispositif, k), tp, loc)}</td>
                  <td className="px-4 py-3 align-top"><StatusTag tone={statusTone(PARAM_STATUS[k])}>{t(`params.status.${PARAM_STATUS[k]}`)}</StatusTag></td>
                  {canEdit ? <td className="px-4 py-3 align-top"><ParamEditor dispositif={scope as Dispositif} paramKey={k} value={valueOf(scope as Dispositif, k)} /></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
          <div className="overflow-x-auto rounded-card bg-surface shadow-card">
            <table className="w-full border-collapse text-left text-sm" data-testid="params-history">
              <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{t('params.history.caption')}</caption>
              <thead>
                <tr className="bg-alt">
                  {(['date', 'actor', 'dispositif', 'param', 'old', 'new'] as const).map((c) => <th key={c} scope="col" className="px-4 py-2 font-semibold">{t(`params.history.cols.${c}`)}</th>)}
                </tr>
              </thead>
              <tbody>
                {shown.map((h) => (
                  <tr key={h.id} className="even:bg-alt/60">
                    <td className="px-4 py-3">{formatDate(h.changed_on, loc)}</td>
                    <td className="px-4 py-3">{t(`profile.${h.actor_profile}`)}</td>
                    <td className="px-4 py-3">{t(`dispositif.${h.dispositif}`)}</td>
                    <td className="px-4 py-3">{t(`params.keys.${h.key}`)}</td>
                    <td className="px-4 py-3">{formatParamValue(h.key, h.old_value, tp, loc)}</td>
                    <td className="px-4 py-3 font-semibold">{formatParamValue(h.key, h.new_value, tp, loc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
