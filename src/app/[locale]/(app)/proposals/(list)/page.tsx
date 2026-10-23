import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BatchDecisionForm } from '@/components/BatchDecisionForm';
import { BatchValidationForm } from '@/components/BatchValidationForm';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DataTable, parseSort, sortRows } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { FilterTabs } from '@/components/FilterTabs';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { StatusTag } from '@/components/StatusTag';
import { Tile } from '@/components/Tile';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { PipelineRow } from '@/data/repository';
import { Link } from '@/i18n/navigation';
import type { Actor, Locale, ProfileId } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { FUNNEL_ORDER, FUNNEL_TONE, POSITION_TONE, URGENCY_ORDER, URGENCY_TONE, VALIDATION_TONE } from '@/lib/pipeline-tones';
import { getAccessContext } from '@/lib/session';

/** Rôle d'action du profil : « Qui doit agir » se lit de son point de vue. Le prestataire consulte tout, sans rôle propre. */
const ACTOR_OF: Partial<Record<ProfileId, Actor[]>> = {
  rs: ['rs'], agency_operator: ['agency'], agency_admin: ['agency'], direction_client: ['decider'], dr_client: ['decider', 'dr'], cvr_client: ['decider', 'cvr'],
};

export default async function ProposalsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const one = (k: string) => (Array.isArray(query[k]) ? query[k]?.[0] : query[k]);
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const loc = ctx.locale;
  const t = await getTranslations('pipeline');
  const tm = await getTranslations('menu');
  const tr = await getTranslations('role');
  const tt = await getTranslations('table');
  const tn = await getTranslations('needs');

  const [rows, zones] = await Promise.all([repository.getPipeline(ctx), repository.getScopeZones(ctx)]);
  const sectors = new Map(zones.map((z) => [z.id, z]));
  const mine = ACTOR_OF[ctx.profileId] ?? null;
  const isMine = (r: PipelineRow) => (mine ? mine.includes(r.next.actor) : r.next.actor !== 'none');
  const isValidation = (r: PipelineRow) => r.next.action === 'validate_need' || r.next.action === 'arbitrate_need';
  const FILTERS = ['mine', 'all', 'overdue', 'decision', 'validation'] as const;
  const raw = one('filter') ?? 'mine';
  const filter = (FILTERS as readonly string[]).includes(raw) ? raw : 'mine';
  const shown = rows.filter((r) =>
    filter === 'all' ? true : filter === 'overdue' ? r.next.urgency === 'overdue' : filter === 'decision' ? r.next.action === 'decide' : filter === 'validation' ? isValidation(r) : isMine(r),
  );

  const decidable = repository.canDecide(ctx) ? rows.filter((r) => r.next.action === 'decide' && r.proposal?.status === 'proposed') : [];
  const awaiting = rows.filter((r) => r.next.action === 'decide').length;
  // A3c : le CVR valide en lot ses besoins à valider, le DR arbitre en lot ses besoins escaladés.
  const validatable = repository.canValidate(ctx)
    ? rows.filter((r) => (ctx.profileId === 'cvr_client' && r.next.action === 'validate_need') || (ctx.profileId === 'dr_client' && r.next.action === 'arbitrate_need'))
    : [];

  const dueText = (r: PipelineRow) =>
    r.next.due ? (
      <div className="flex flex-col items-start gap-1">
        <span>{t('due', { date: formatDate(r.next.due, loc) })}</span>
        {r.next.urgency ? <StatusTag tone={URGENCY_TONE[r.next.urgency]}>{t(`urgency.${r.next.urgency}`)}</StatusTag> : null}
        {r.next.urgency === 'overdue' ? <span className="text-sm text-muted">{t('lateDays', { n: r.next.lateDays })}</span> : null}
      </div>
    ) : (
      <span className="text-muted">{t('noDue')}</span>
    );

  const columns: Column<PipelineRow>[] = [
    {
      key: 'need', header: t('cols.need'), sortValue: (r) => r.need.need_code,
      render: (r) => <Link href={`/proposals/${r.need.id}`} className="inline-flex min-h-11 items-center font-mono text-sm font-semibold text-link hover:bg-sel">{r.need.need_code}</Link>,
    },
    { key: 'sector', header: t('cols.sector'), render: (r) => (sectors.get(r.need.sector_id) ? <ZoneLabel zone={sectors.get(r.need.sector_id)!} /> : null) },
    {
      key: 'validation', header: t('cols.validation'), sortValue: (r) => r.validation.state,
      render: (r) => (r.need.need_state === 'submitted' ? <StatusTag tone={VALIDATION_TONE[r.validation.state]}>{t(`validationState.${r.validation.state}`)}</StatusTag> : <span className="text-muted">{t('none')}</span>),
    },
    {
      key: 'funnel', header: t('cols.funnel'), sortValue: (r) => (r.funnel ? FUNNEL_ORDER.indexOf(r.funnel) : 99),
      render: (r) => (r.funnel ? <StatusTag tone={FUNNEL_TONE[r.funnel]}>{t(`funnel.${r.funnel}`)}</StatusTag> : <span className="text-muted">{r.recruitment.intake === 'taken' ? t('outside') : (r.need.need_state === 'draft' ? tn('state.draft') : t(`intake.${r.recruitment.intake}`))}</span>),
    },
    {
      key: 'position', header: t('cols.position'),
      render: (r) => (r.positionStatus ? <StatusTag tone={POSITION_TONE[r.positionStatus]}>{t(`position.${r.positionStatus}`)}</StatusTag> : <span className="text-muted">{t('none')}</span>),
    },
    {
      key: 'proposal', header: t('cols.proposal'),
      render: (r) => (r.proposal ? (
        <div className="flex flex-col items-start gap-1">
          <span>{t('version', { n: r.proposal.version })}</span>
          <StatusTag tone="neutral">{t(`proposalStatus.${r.proposal.status}`)}</StatusTag>
          {r.decision ? <StatusTag tone={r.decision.outcome === 'approved' ? 'ok' : r.decision.outcome === 'refused' ? 'risk' : 'attention'}>{t(`outcome.${r.decision.outcome}`)}</StatusTag> : null}
        </div>
      ) : <span className="text-muted">{t('none')}</span>),
    },
    {
      key: 'next', header: t('cols.next'),
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold">{t(`actor.${r.next.actor}`)}</span>
          <span className="text-muted">{t(`action.${r.next.action}`)}</span>
        </div>
      ),
    },
    {
      key: 'due', header: t('cols.due'), render: dueText,
      sortValue: (r) => (r.next.urgency ? URGENCY_ORDER.indexOf(r.next.urgency) * 1_000_000 + Number(r.next.due?.replaceAll('-', '') ?? 0) : null),
    },
  ];
  const sort = parseSort({ sort: one('sort'), dir: one('dir') }, columns);
  const keepSort: Record<string, string> = sort ? { sort: sort.key, dir: sort.dir } : {};
  const sortHref = (key: string, dir: 'asc' | 'desc') => {
    const q = new URLSearchParams({ ...(filter !== 'mine' ? { filter } : {}), sort: key, dir });
    return `/proposals?${q.toString()}`;
  };
  const filterItems = (mine ? FILTERS : FILTERS.filter((f) => f !== 'mine')).map((f) => ({ value: f, text: t(`filters.${f}`) }));
  const current = !mine && filter === 'mine' ? 'all' : filter;

  return (
    <>
      <Breadcrumb items={[{ label: tm('proposals') }]} />
      <PageHeader title={t('title')} subtitle={tr(ctx.profileId)} />
      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <Tile tone="aqua" attention={rows.filter(isMine).length > 0 && mine !== null} label={t('tiles.toAct')} value={String(rows.filter(isMine).length)}>{t('tiles.toActNote')}</Tile>
        <Tile tone="sand" label={t('tiles.overdue')} value={String(rows.filter((r) => r.next.urgency === 'overdue').length)} />
        <Tile tone="lav" label={t('tiles.awaiting')} value={String(awaiting)}>{t('tiles.awaitingNote')}</Tile>
      </div>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/proposals/funnel" className="inline-flex min-h-11 items-center rounded-full border-2 border-primary bg-surface px-5 text-sm font-semibold text-link hover:bg-sel">
          {t('funnelLink')}
        </Link>
      </div>
      {validatable.length > 0 ? (
        <BatchValidationForm
          items={validatable.map((r) => ({
            needId: r.need.id, needCode: r.need.need_code, sector: sectors.get(r.need.sector_id) ? zoneText(sectors.get(r.need.sector_id)!, loc) : '',
            due: r.next.due ?? null, overdue: r.next.urgency === 'overdue',
          }))}
        />
      ) : null}
      {decidable.length > 0 ? (
        <BatchDecisionForm
          items={decidable.map((r) => ({
            proposalId: r.proposal!.id, needCode: r.need.need_code, version: r.proposal!.version,
            sector: sectors.get(r.need.sector_id) ? zoneText(sectors.get(r.need.sector_id)!, loc) : '',
            due: r.next.due ?? null, overdue: r.next.urgency === 'overdue',
          }))}
        />
      ) : null}
      <div className="mb-4">
        <FilterTabs label={t('filters.label')} basePath="/proposals" param="filter" current={current} keep={keepSort} items={filterItems} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t('emptyTitle')} body={rows.length === 0 ? t('empty') : t('emptyFilter')} />
      ) : (
        <DataTable
          caption={t('caption')}
          columns={columns}
          rows={sortRows(shown, columns, sort)}
          rowKey={(r) => r.need.id}
          rowId={(r) => `need-${r.need.id}`}
          testId="pipeline-table"
          sort={sort}
          sortHref={sortHref}
          sortLabels={{ label: tt('sortLabel'), asc: tt('asc'), desc: tt('desc') }}
        />
      )}
      <p className="mt-6 text-sm text-muted">{t('linkHelp')}</p>
    </>
  );
}
