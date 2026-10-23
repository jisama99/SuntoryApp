import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PageHeader } from '@/components/PageHeader';
import { DecisionForm } from '@/components/pipeline/DecisionForm';
import { NotesThread } from '@/components/pipeline/NotesThread';
import { ProposalForm } from '@/components/pipeline/ProposalForm';
import { QualifyForm } from '@/components/pipeline/QualifyForm';
import { StepPanel } from '@/components/pipeline/StepPanel';
import type { StepDef } from '@/components/pipeline/StepPanel';
import { WithdrawProposalForm } from '@/components/pipeline/WithdrawProposalForm';
import { StatusTag } from '@/components/StatusTag';
import { ZoneLabel, zoneText } from '@/components/ZoneLabel';
import { repository } from '@/data';
import type { Proposal, ProposalInput } from '@/data/schemas';
import { lineage } from '@/domain/access';
import { storeText } from '@/lib/labels';
import { calendarOf } from '@/domain/deadlines';
import { needSpan } from '@/domain/pipeline';
import type { Locale } from '@/domain/types';
import { formatDate, formatWeekdays } from '@/lib/format';
import { FUNNEL_TONE, OUTCOME_TONE, POSITION_TONE, PROPOSAL_TONE, URGENCY_TONE } from '@/lib/pipeline-tones';
import { getAccessContext } from '@/lib/session';

export default async function NeedThreadPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const loc = ctx.locale;
  // Ponctuation propre à la langue : espace avant les deux-points en français seulement.
  const colon = loc === 'en' ? ':' : ' :';
  const thread = await repository.getNeedThread(ctx, id);
  if (!thread) notFound();
  const { row, proposals, decisions, events, notes } = thread;
  const t = await getTranslations('pipeline');
  const tm = await getTranslations('menu');
  const tn = await getTranslations('needs');
  const td = await getTranslations('dispositif');
  const [zones, deadline] = await Promise.all([repository.getScopeZones(ctx), repository.getDeadlineContext(ctx)]);
  const sector = zones.find((z) => z.id === row.need.sector_id);
  const need = row.need;
  const rec = row.recruitment;
  const agency = ctx.side !== 'client';
  const taken = rec.intake === 'taken';
  const closed = rec.intake === 'rejected' || rec.stopped !== null;
  const today = deadline.today;
  const nonWorking = calendarOf(deadline.settings);
  const sent = proposals.find((p) => p.status === 'proposed') ?? null;
  const draft = proposals.find((p) => p.status === 'in_progress') ?? null;
  const decisionOf = (p: Proposal) => decisions.find((d) => d.proposal_id === p.id && d.status === 'valid') ?? null;
  const span = needSpan(need);
  const brief = { weekly_hours: need.weekly_hours, days: need.days, hours_slot: need.hours_slot, periods: need.periods, store_codes: need.store_codes };
  const base: Proposal | null = draft ?? sent ?? proposals[0] ?? null;
  const initial: ProposalInput = {
    candidate_ref: base && base.id !== draft?.id ? '' : base?.candidate_ref ?? '', weekly_hours: base?.weekly_hours ?? need.weekly_hours ?? 1,
    days: base?.days ?? need.days, hours_slot: base ? base.hours_slot : need.hours_slot, start_date: base?.start_date ?? span?.start ?? today,
    end_date: base?.end_date ?? span?.end ?? today, store_codes: base?.store_codes ?? need.store_codes, deviation_note: base?.deviation_note ?? null,
    cost_status: base?.cost_status ?? 'not_priced',
  };
  const allowedDays = deadline.params.find((p) => p.dispositif === need.dispositif)?.days_allowed ?? [1, 2, 3, 4, 5, 6];
  const chain = lineage(zones, need.sector_id);
  const recipients = chain.map((z) => ({ id: z.id, text: zoneText(z, loc) }));
  const rsSectors = zones.filter((z) => z.kind === 'rs' && z.id !== need.sector_id).map((z) => ({ id: z.id, text: zoneText(z, loc) }));
  const canNotes = repository.canWriteNotes(ctx);
  const notesOf = (kind: 'proposal' | 'decision', objectId: string) => notes.filter((n) => n.object_kind === kind && n.object_id === objectId);

  const blockedFor = (step: Parameters<typeof repository.canRecord>[1]): StepDef['blocked'] | undefined =>
    !repository.canRecord(ctx, step) ? 'forbidden' : !taken ? 'not_taken' : closed ? 'closed' : undefined;
  const accord = row.decision?.outcome === 'approved' ? row.decision : null;
  const step = (s: StepDef['step'], field: StepDef['field'], current: string | null, extra: Partial<StepDef> = {}): StepDef => {
    const blocked = blockedFor(s) ?? extra.blocked;
    return { step: s, field, current, enabled: !blocked, ...(blocked ? { blocked } : {}), ...(extra.min ? { min: extra.min } : {}) };
  };
  const steps: StepDef[] = [
    step('start_search', 'date', rec.search_started_on, rec.search_started_on ? { blocked: 'already' } : {}),
    step('hired', 'date', rec.hired_on, rec.hired_on ? { blocked: 'already' } : !accord ? { blocked: 'no_accord' } : { min: accord.decided_on }),
    step('training', 'date', rec.training_on, rec.hired_on ? { min: rec.hired_on } : { blocked: 'not_hired' }),
    step('start_work', 'date_future', rec.start_work_date, rec.hired_on ? { min: rec.hired_on } : { blocked: 'not_hired' }),
    step('vehicle_handover', 'date_future', rec.vehicle_handover_date, rec.hired_on ? { min: rec.hired_on } : { blocked: 'not_hired' }),
    step('reassign', 'sector', null, rec.situation === 'reassigned' ? { blocked: 'already' } : {}),
    rec.situation === 'white_zone' ? step('lift_white_zone', 'none', rec.white_zone_since) : step('white_zone', 'none', null),
    step('stop', 'motive', rec.stopped?.on ?? null),
    step('withdrawal', 'date_motive', null, !rec.search_started_on && !rec.hired_on && !sent ? { blocked: 'not_taken' } : {}),
  ];
  const canSteps = taken && steps.some((s) => repository.canRecord(ctx, s.step));

  const dimension = (title: string, body: React.ReactNode) => (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-card">
      <h3 className="text-sm font-semibold text-muted">{title}</h3>
      <div className="flex flex-col items-start gap-2">{body}</div>
    </div>
  );

  return (
    <>
      <Breadcrumb items={[{ label: tm('proposals'), href: '/proposals' }, { label: need.need_code }]} />
      <PageHeader title={t('detail.title', { code: need.need_code })} subtitle={need.dispositif ? td(need.dispositif) : undefined} />
      <div className="mb-6">{sector ? <ZoneLabel zone={sector} /> : null}</div>

      <section aria-labelledby="dims-title" data-testid="dimensions" className="mb-8 flex flex-col gap-4">
        <h2 id="dims-title" className="text-lg font-semibold">{t('detail.statuses')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dimension(t('dimension.need'), (
            <>
              <StatusTag tone={need.need_state === 'draft' ? 'attention' : 'info'}>{tn(`state.${need.need_state}`)}</StatusTag>
              {need.need_state === 'submitted' ? <StatusTag tone={rec.intake === 'taken' ? 'ok' : rec.intake === 'rejected' ? 'neutral' : 'attention'}>{t(`intake.${rec.intake}`)}</StatusTag> : null}
              {rec.stopped ? <StatusTag tone="neutral">{t('stopped')}</StatusTag> : null}
              <span className="text-sm text-muted">{t('detail.hours', { n: need.weekly_hours ?? 0 })}</span>
            </>
          ))}
          {dimension(t('dimension.proposal'), (
            <>
              {row.proposal ? <StatusTag tone={PROPOSAL_TONE[row.proposal.status]}>{t(`proposalStatus.${row.proposal.status}`)}</StatusTag> : <span className="text-muted">{t('none')}</span>}
              {row.proposal ? <span className="text-sm text-muted">{t('version', { n: row.proposal.version })}</span> : null}
              {row.decision ? <StatusTag tone={OUTCOME_TONE[row.decision.outcome]}>{t(`outcome.${row.decision.outcome}`)}</StatusTag> : null}
            </>
          ))}
          {dimension(t('dimension.recruitment'), (
            <>
              {row.funnel ? <StatusTag tone={FUNNEL_TONE[row.funnel]}>{t(`funnel.${row.funnel}`)}</StatusTag> : <span className="text-muted">{t('outside')}</span>}
              {rec.situation !== 'new' ? <StatusTag tone="info">{t(`situation.${rec.situation}`)}</StatusTag> : null}
              {rec.reassigned_from_sector_id && zones.find((z) => z.id === rec.reassigned_from_sector_id) ? (
                <span className="text-sm text-muted">{t('detail.reassignedFrom')} <ZoneLabel zone={zones.find((z) => z.id === rec.reassigned_from_sector_id)!} /></span>
              ) : null}
              <span className="text-sm text-muted">{t('detail.counters', { refusals: rec.refusal_count, withdrawals: rec.withdrawal_count })}</span>
            </>
          ))}
          {dimension(t('dimension.execution'), (
            <>
              {row.positionStatus ? <StatusTag tone={POSITION_TONE[row.positionStatus]}>{t(`position.${row.positionStatus}`)}</StatusTag> : <span className="text-muted">{t('none')}</span>}
              <span className="text-sm">{t('detail.startWork')}{colon} {rec.start_work_date ? formatDate(rec.start_work_date, loc) : t('notRecorded')}</span>
              <span className="text-sm">{t('detail.vehicle')}{colon} {rec.vehicle_handover_date ? formatDate(rec.vehicle_handover_date, loc) : t('notRecorded')}</span>
              {agency && row.billableFrom ? <span className="text-sm text-muted">{t('detail.billableFrom', { date: formatDate(row.billableFrom, loc) })}</span> : null}
            </>
          ))}
        </div>
      </section>

      <section aria-labelledby="next-title" data-testid="next-step" className="mb-8 flex flex-col gap-3 rounded-card bg-tint-aqua p-5 text-ink shadow-card">
        <h2 id="next-title" className="text-lg font-semibold">{t('detail.next')}</h2>
        <p className="text-lg font-semibold">{t(`actor.${row.next.actor}`)}{colon} {t(`action.${row.next.action}`)}</p>
        <div className="flex flex-wrap items-center gap-3">
          {row.next.due ? <span>{t('due', { date: formatDate(row.next.due, loc) })}</span> : null}
          {row.next.urgency ? <StatusTag tone={URGENCY_TONE[row.next.urgency]}>{t(`urgency.${row.next.urgency}`)}</StatusTag> : null}
          {row.next.urgency === 'overdue' ? <span>{t('lateDays', { n: row.next.lateDays })}</span> : null}
        </div>
        {row.needChanged ? <StatusTag tone="important">{t('detail.needChanged')}</StatusTag> : null}
        {rec.intake_motive ? <p className="text-muted-strong">{t(`detail.motive.${rec.intake}`, { motive: rec.intake_motive })}</p> : null}
        {rec.stopped ? <p className="text-muted-strong">{t('detail.stoppedMotive', { motive: rec.stopped.reason })}</p> : null}
      </section>

      <div className="flex flex-col gap-8">
        {repository.canQualify(ctx) && need.need_state === 'submitted' && (rec.intake === 'to_qualify' || rec.intake === 'clarification') ? <QualifyForm needId={need.id} /> : null}

        <section aria-labelledby="versions-title" className="flex flex-col gap-4">
          <h2 id="versions-title" className="text-lg font-semibold">{t('detail.versions')}</h2>
          {proposals.length === 0 ? <p className="text-muted">{t('detail.noProposal')}</p> : null}
          <ul className="flex flex-col gap-4">
            {proposals.map((p) => {
              const own = decisions.filter((d) => d.proposal_id === p.id);
              const validDecision = decisionOf(p);
              return (
                <li key={p.id} data-proposal-version={p.version} data-proposal-status={p.status} className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{t('version', { n: p.version })}</h3>
                    <StatusTag tone={PROPOSAL_TONE[p.status]}>{t(`proposalStatus.${p.status}`)}</StatusTag>
                    <span className="font-mono text-sm">{p.candidate_ref}</span>
                    {p.sent_on ? <span className="text-sm text-muted">{t('detail.sentOn', { date: formatDate(p.sent_on, loc) })}</span> : null}
                    {agency && p.cost_status ? <StatusTag tone={p.cost_status === 'complete' ? 'ok' : 'attention'}>{t(`proposal.costStatus.${p.cost_status}`)}</StatusTag> : null}
                  </div>
                  <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    <div><dt className="inline font-semibold">{t('proposal.hours')}{colon} </dt><dd className="inline">{p.weekly_hours}</dd></div>
                    <div><dt className="inline font-semibold">{t('proposal.days')}{colon} </dt><dd className="inline">{formatWeekdays(p.days, loc)}</dd></div>
                    <div><dt className="inline font-semibold">{t('proposal.slot')}{colon} </dt><dd className="inline">{p.hours_slot ?? t('none')}</dd></div>
                    <div><dt className="inline font-semibold">{t('proposal.period')}{colon} </dt><dd className="inline">{t('detail.range', { start: formatDate(p.start_date, loc), end: formatDate(p.end_date, loc) })}</dd></div>
                    <div><dt className="inline font-semibold">{t('proposal.stores')}{colon} </dt><dd className="inline">{p.store_codes.length}</dd></div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{t('proposal.deviations')}</span>
                    {p.deviations.length === 0 ? <StatusTag tone="ok">{t('proposal.noDeviation')}</StatusTag> : p.deviations.map((d) => <StatusTag key={d} tone="attention">{t(`proposal.deviation.${d}`)}</StatusTag>)}
                  </div>
                  {p.deviation_note ? <p>{p.deviation_note}</p> : null}
                  {p.withdrawn_on ? <p className="text-muted">{t('detail.withdrawnOn', { date: formatDate(p.withdrawn_on, loc) })}{p.withdrawn_motive ? `${colon} ${p.withdrawn_motive}` : ''}</p> : null}
                  {own.map((d) => (
                    <div key={d.id} data-decision-status={d.status} className="flex flex-col gap-2 rounded-ctl bg-alt px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag tone={OUTCOME_TONE[d.outcome]}>{t(`outcome.${d.outcome}`)}</StatusTag>
                        <StatusTag tone={d.status === 'valid' ? 'ok' : 'neutral'}>{t(`decisionStatus.${d.status}`)}</StatusTag>
                        <span className="text-sm text-muted">{t('detail.decidedOn', { date: formatDate(d.decided_on, loc) })}</span>
                      </div>
                      {d.motive ? <p>{d.motive}</p> : null}
                      {d.status === 'invalidated' && d.invalidated_reason ? (
                        <p className="text-sm font-semibold">{t(`invalidation.${d.invalidated_reason}`, { date: d.invalidated_on ? formatDate(d.invalidated_on, loc) : '' })}</p>
                      ) : null}
                      <NotesThread objectKind="decision" objectId={d.id} notes={notesOf('decision', d.id)} canWrite={canNotes} recipients={recipients} />
                    </div>
                  ))}
                  <NotesThread objectKind="proposal" objectId={p.id} notes={notesOf('proposal', p.id)} canWrite={canNotes} recipients={recipients} />
                  {repository.canDecide(ctx) && p.status === 'proposed' && !validDecision && !closed ? <DecisionForm proposalId={p.id} version={p.version} /> : null}
                  {repository.canPropose(ctx) && p.status === 'proposed' ? <WithdrawProposalForm proposalId={p.id} hasDecision={Boolean(validDecision)} /> : null}
                  {repository.canPropose(ctx) && p.status === 'in_progress' ? <WithdrawProposalForm proposalId={p.id} hasDecision={false} /> : null}
                </li>
              );
            })}
          </ul>
        </section>

        {repository.canPropose(ctx) && taken && !closed && need.need_state === 'submitted' ? (
          <ProposalForm
            needId={need.id}
            need={brief}
            initial={initial}
            stores={thread.stores.map((s) => {
              const { code: value } = s;
              return { value, text: storeText(s, loc) };
            })}
            allowedDays={allowedDays}
            today={today}
            nonWorking={nonWorking}
            nextVersion={draft ? draft.version : proposals.reduce((m, p) => Math.max(m, p.version), 0) + 1}
            hasValidDecision={Boolean(sent && decisionOf(sent))}
          />
        ) : null}

        {canSteps || (agency && taken) ? <StepPanel needId={need.id} steps={steps} sectors={rsSectors} today={today} nonWorking={nonWorking} /> : null}

        <section aria-labelledby="journal-title" data-testid="journal" className="flex flex-col gap-3">
          <h2 id="journal-title" className="text-lg font-semibold">{t('detail.journal')}</h2>
          <ul className="flex flex-col gap-2">
            {events.map(({ id: eventId, code: eventCode, effect_date, actor_profile, audience }) => (
              <li key={eventId} data-event-code={eventCode} data-audience={audience} className="flex flex-wrap items-center gap-3 rounded-ctl bg-alt px-4 py-2">
                <span className="text-sm text-muted">{formatDate(effect_date, loc)}</span>
                <span className="font-semibold">{t.has(`event.${eventCode}`) ? t(`event.${eventCode}`) : eventCode}</span>
                <span className="text-sm text-muted">{t(`actorProfile.${actor_profile}`)}</span>
                {agency ? <StatusTag tone="neutral">{t(`audience.${audience}`)}</StatusTag> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
