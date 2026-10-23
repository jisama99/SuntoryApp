import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DeadlineEditor } from '@/components/DeadlineEditor';
import { FilterTabs } from '@/components/FilterTabs';
import { OutboxButtons } from '@/components/OutboxButtons';
import { PageHeader } from '@/components/PageHeader';
import { DirectReopen, RequestDecision } from '@/components/ReopeningPanel';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import type { Tone } from '@/components/StatusTag';
import { zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import { listDeadlines, resolveDeadline, deadlineStatus } from '@/domain/deadlines';
import type { DeadlineRow } from '@/domain/deadlines';
import { paramsMapOf } from '@/domain/dispositif-params';
import { DEADLINE_TYPES, DISPOSITIFS } from '@/domain/types';
import type { Dispositif, Locale } from '@/domain/types';
import { addMonths, monthOf } from '@/domain/working-days';
import { bannerRows } from '@/lib/deadline-view';
import { formatDate, formatIsoWeek, formatMonth } from '@/lib/format';
import { getAccessContext } from '@/lib/session';

const SCOPES = ['all', 'global', ...DISPOSITIFS] as const;
const SPANS = ['3', '5', '8'] as const;

/** Calendrier d'échéances (D80) : règle appliquée par mois, état, éditeur, demandes de réouverture, file de courriels. */
export default async function DeadlinesPage({ params, searchParams }: {
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
  const loc = ctx.locale;
  const [deadline, requests, reopenings, outbox, zones] = await Promise.all([
    repository.getDeadlineContext(ctx), repository.getReopeningRequests(ctx), repository.getReopenings(ctx),
    repository.getOutbox(ctx), repository.getScopeZones(ctx),
  ]);
  const canEdit = repository.canManageSettings(ctx);
  const scope = (SCOPES as readonly string[]).includes(one('dispositif')) ? one('dispositif') : 'all';
  const span = (SPANS as readonly string[]).includes(one('months')) ? one('months') : '5';
  const keepSpan: Record<string, string> = span !== '5' ? { months: span } : {};
  const keepScope: Record<string, string> = scope !== 'all' ? { dispositif: scope } : {};
  const params_ = paramsMapOf(deadline.params);

  // Lignes affichées : calendrier global et règles propres (vue « Tous »), calendrier global seul, ou règle effective d'un dispositif.
  let rows: DeadlineRow[];
  if (scope === 'all') rows = listDeadlines(deadline.today, deadline.settings, params_, Number(span));
  else if (scope === 'global') rows = listDeadlines(deadline.today, deadline.settings, {}, Number(span));
  else {
    rows = [];
    for (let i = 0; i < Number(span); i++) {
      const month = addMonths(monthOf(deadline.today), i);
      for (const type of DEADLINE_TYPES) {
        const d = resolveDeadline(month, type, scope as Dispositif, params_, deadline.settings);
        rows.push({ month, type, dispositif: scope as Dispositif, deadline: d, status: deadlineStatus(d, deadline.today, deadline.settings) });
      }
    }
    rows.sort((a, b) => a.deadline.date.localeCompare(b.deadline.date));
  }
  const stageTone = (r: DeadlineRow): Tone => (r.status.state === 'closed' ? 'risk' : r.status.threshold === null ? 'ok' : r.status.threshold === 0 ? 'risk' : r.status.threshold <= 2 ? 'attention' : 'info');
  const stageText = (r: DeadlineRow) =>
    r.status.state === 'closed' ? t('deadline.state.closed') : r.status.threshold === null ? t('deadline.state.open') : r.status.threshold === 0 ? t('deadline.stage.zero') : t('deadline.stage.n', { n: r.status.threshold });
  const sourceText = (r: DeadlineRow) => (r.deadline.source === 'preset' ? `${t('deadline.source.preset')} · ${t(`deadline.preset.${r.deadline.preset ?? deadline.settings.default_preset}`)}` : t(`deadline.source.${r.deadline.source}`));

  const closedMonths = [...new Set(bannerRows(deadline, null, null).closed.map((r) => r.month))];
  const closedWeeks = (await repository.getWeekClosures(ctx)).map((w) => w.week).filter((w) => !deadline.reopenings.some((r) => r.scope === 'week' && r.target === w && r.expires_on >= deadline.today));
  const pending = requests.filter((r) => r.status === 'pending');
  const byId = new Map(zones.map((z) => [z.id, z]));
  const zoneOptions = zones.map((z) => ({ id: z.id, text: zoneText(z, loc) }));
  const targetText = (scope_: string, target: string) => (scope_ === 'month' ? t('reopen.targetMonth', { month: formatMonth(target, loc) }) : t('reopen.targetWeek', { week: formatIsoWeek(target, loc) }));

  return (
    <>
      <Breadcrumb items={[{ label: t('menu.settings'), href: '/settings' }, { label: t('settings.deadlines.title') }]} />
      <PageHeader title={t('settings.deadlines.title')} subtitle={t(`role.${ctx.profileId}`)} />
      <p className="mb-4 max-w-prose text-muted">{t('settings.deadlines.intro')}</p>
      <p className="mb-4 max-w-prose text-muted-strong">{t('settings.deadlines.novemberNote')}</p>
      {canEdit ? null : <p className="mb-4 text-muted">{t('settings.readOnly')}</p>}

      <section aria-labelledby="cal-title" className="mb-8 flex flex-col gap-4">
        <h2 id="cal-title" className="text-lg font-semibold">{t('deadline.calendar.title')}</h2>
        <FilterTabs label={t('deadline.calendar.scope')} basePath="/settings/deadlines" param="dispositif" current={scope} keep={keepSpan}
          items={SCOPES.map((s) => ({ value: s, text: s === 'all' ? t('params.allDispositifs') : s === 'global' ? t('deadline.calendar.global') : t(`dispositif.${s}`) }))} />
        <FilterTabs label={t('deadline.calendar.span')} basePath="/settings/deadlines" param="months" current={span} keep={keepScope}
          items={SPANS.map((s) => ({ value: s, text: t('deadline.calendar.months', { n: Number(s) }) }))} />
        <div className="overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full border-collapse text-left text-sm" data-testid="deadline-table">
            <caption className="px-4 py-3 text-left text-sm font-semibold text-muted">{t('deadline.calendar.caption')}</caption>
            <thead>
              <tr className="bg-alt">
                {(['month', 'type', 'rule', 'date', 'window', 'state'] as const).map((c) => <th key={c} scope="col" className="px-4 py-2 font-semibold">{t(`deadline.calendar.cols.${c}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.month}-${r.type}-${r.dispositif}`} className="even:bg-alt/60" data-rule-source={r.deadline.source}>
                  <th scope="row" className="px-4 py-3 font-semibold">{formatMonth(r.month, loc)}</th>
                  <td className="px-4 py-3">{t(`deadline.type.${r.type}`)}{r.dispositif ? ` · ${t(`dispositif.${r.dispositif}`)}` : ''}</td>
                  <td className="px-4 py-3">{sourceText(r)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatDate(r.deadline.date, loc)}</td>
                  <td className="px-4 py-3">{r.deadline.opensOn ? t('deadline.banner.window', { from: formatDate(r.deadline.opensOn, loc), to: formatDate(r.deadline.date, loc) }) : t('deadline.calendar.noWindow')}</td>
                  <td className="px-4 py-3"><StatusTag tone={stageTone(r)}>{stageText(r)}</StatusTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {canEdit ? (
        <section aria-labelledby="edit-title" className="mb-8 flex flex-col gap-4">
          <h2 id="edit-title" className="text-lg font-semibold">{t('deadline.editor.title')}</h2>
          <DeadlineEditor context={deadline} />
        </section>
      ) : null}

      <section aria-labelledby="req-title" className="mb-8 flex flex-col gap-4">
        <h2 id="req-title" className="text-lg font-semibold">{t('reopen.requestsTitle')}</h2>
        {pending.length === 0 ? (
          <EmptyState title={t('states.empty.title')} body={t('reopen.noPending')} />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {pending.map((r) =>
              canEdit ? (
                <RequestDecision key={r.id} request={r} context={deadline} zoneText={byId.get(r.zone_id) ? zoneText(byId.get(r.zone_id)!, loc) : ''} />
              ) : (
                <li key={r.id} className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card">
                  <StatusTag tone="attention">{t('reopen.status.pending')}</StatusTag>
                  <span className="font-semibold">{targetText(r.scope, r.target)}</span>
                  <p className="text-muted">{t('reopen.motiveOf', { motive: r.motive })}</p>
                </li>
              ),
            )}
          </ul>
        )}
        {canEdit ? <DirectReopen context={deadline} zones={zoneOptions} closedMonths={closedMonths} closedWeeks={closedWeeks} /> : null}
      </section>

      <section aria-labelledby="trace-title" className="mb-8 flex flex-col gap-3">
        <h2 id="trace-title" className="text-lg font-semibold">{t('reopen.traceTitle')}</h2>
        {reopenings.length === 0 ? (
          <EmptyState title={t('states.empty.title')} body={t('reopen.noTrace')} />
        ) : (
          <ul className="flex flex-col gap-2" data-testid="reopen-trace">
            {reopenings.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 rounded-ctl bg-surface px-4 py-3 shadow-card">
                <span className="font-semibold">{targetText(r.scope, r.target)}</span>
                <span>{byId.get(r.zone_id) ? zoneText(byId.get(r.zone_id)!, loc) : ''}</span>
                <span className="text-muted">{t('reopen.traceLine', { reason: r.reason, until: formatDate(r.expires_on, loc), on: formatDate(r.decided_on, loc), by: t(`profile.${r.decided_by}`) })}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="outbox-title" className="mb-8 flex flex-col gap-3">
        <h2 id="outbox-title" className="text-lg font-semibold">{t('outbox.title')}</h2>
        <p className="max-w-prose text-muted">{t('outbox.help')}</p>
        <ul className="flex flex-col gap-2" data-testid="outbox">
          {outbox.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 rounded-ctl bg-surface px-4 py-3 shadow-card">
              <StatusTag tone={o.status === 'validated' ? 'ok' : o.status === 'discarded' ? 'neutral' : 'attention'}>{t(`outbox.status.${o.status}`)}</StatusTag>
              <span>
                {o.kind === 'monday_summary'
                  ? t('outbox.mondaySummary', { date: formatDate(o.planned_on, loc) })
                  : t('outbox.reminder', { date: formatDate(o.planned_on, loc), month: formatMonth(o.month ?? '', loc), n: o.sector_count })}
              </span>
              {o.recipient_zone_id && byId.get(o.recipient_zone_id) ? <span className="text-muted">{zoneText(byId.get(o.recipient_zone_id)!, loc)}</span> : null}
              {o.recipient_profile ? <span className="text-muted">{t(`profile.${o.recipient_profile}`)}</span> : null}
              {canEdit && o.status === 'pending' ? <span className="ml-auto"><OutboxButtons id={o.id} /></span> : null}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
