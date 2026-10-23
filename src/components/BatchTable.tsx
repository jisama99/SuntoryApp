'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useConfirmation } from './Confirmation';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { FindingDto } from '@/app/[locale]/needs/actions';
import { clearBatchDraftAction, resolveSectorsAction, saveBatchAction, saveBatchDraftAction } from '@/app/[locale]/needs/batch-actions';
import type { BatchLineDto } from '@/app/[locale]/needs/batch-actions';
import type { DeadlineContext } from '@/data/repository';
import type { BatchRow } from '@/data/schemas';
import { emptyBatchRow, isEmptyBatchRow, summariseBatch } from '@/domain/batch';
import { parsePaste } from '@/domain/batch-paste';
import type { PasteContext } from '@/domain/batch-paste';
import { DISPOSITIFS } from '@/domain/types';
import { formatWeek, isoWeekOf } from '@/domain/week';
import type { Dispositif, Locale } from '@/domain/types';
import { Link } from '@/i18n/navigation';
import { lockedMonthsFor } from '@/lib/deadline-view';
import { formatMonth } from '@/lib/format';
import { HOURS } from '@/lib/need-form-value';
import { useUnsavedWarning } from '@/lib/use-unsaved-warning';
import { Button } from './Button';
import { DeadlineBanner } from './DeadlineBanner';
import { Field } from './Field';
import { FindingsPanel } from './FindingsPanel';
import { DateRangePicker } from './pickers/DateRangePicker';
import { WeekdayPicker } from './pickers/WeekdayPicker';
import { SelectField } from './SelectField';
import { StatusTag } from './StatusTag';
import { TextareaField } from './TextareaField';
import { Tile } from './Tile';

export interface BatchTableProps {
  initialRows: BatchRow[];
  /** Secteur imposé (RS) ou null (agence : choix par ligne). */
  fixedSectorId: string | null;
  sectors: Array<{ id: string; text: string }>;
  stores: Array<{ value: string; text: string; sectorId: string | null }>;
  campaigns: Array<{ value: string; dispositif: string; text: string }>;
  dispositifNames: Record<string, Dispositif>;
  today: string;
  min: string;
  max: string;
  closedWeeks: string[];
  daysAllowed: number[];
  daysByDispositif: Record<Dispositif, number[]>;
  deadline: DeadlineContext;
  hadDraft: boolean;
}

const MAX_ROWS = 50;
const FILTERS = ['all', 'saved', 'rejected', 'confirm'] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Saisie en lot (F-20.2) : une carte par ligne, collage depuis un tableur, brouillon automatique, résumé avant
 * soumission. Chaque ligne passe par les mêmes règles que la saisie unitaire, côté données ; les lignes valides seules
 * sont créées et les rejets sont expliqués ligne par ligne.
 */
export function BatchTable(props: BatchTableProps) {
  const t = useTranslations('batch');
  const tf = useTranslations('form');
  const td = useTranslations('dispositif');
  const tw = useTranslations('deadline');
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const filterParam = params.get('filter');
  const filter: Filter = (FILTERS as readonly string[]).includes(filterParam ?? '') ? (filterParam as Filter) : 'all';

  const blank = () => emptyBatchRow(props.fixedSectorId ?? '');
  const [rows, setRows] = useState<BatchRow[]>(props.initialRows.length > 0 ? props.initialRows : [blank(), blank(), blank()]);
  const [lines, setLines] = useState<Record<number, BatchLineDto>>({});
  const [saved, setSaved] = useState<number[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteInfo, setPasteInfo] = useState<{ added: number; blank: number; header: boolean } | null>(null);
  const [invalid, setInvalid] = useState(false);
  const tc = useTranslations('confirmation');
  const announce = useConfirmation();
  const [pending, startTransition] = useTransition();
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved'>(props.hadDraft ? 'saved' : 'idle');
  const first = useRef(true);

  // Brouillon automatique : enregistré côté données peu après la dernière modification (reprise après fermeture).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setDraftState('saving');
    const timer = setTimeout(async () => {
      const r = await saveBatchDraftAction({ locale, rows });
      setDraftState(r.status === 'ok' ? 'saved' : 'idle');
    }, 700);
    return () => clearTimeout(timer);
  }, [rows, locale]);
  useUnsavedWarning(draftState === 'saving', tw('unsaved'));

  const summary = useMemo(() => summariseBatch(rows, props.fixedSectorId ?? undefined), [rows, props.fixedSectorId]);
  const setRow = (i: number, patch: Partial<BatchRow>) => {
    setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setLines((cur) => {
      if (!cur[i]) return cur;
      const { [i]: _drop, ...rest } = cur;
      void _drop;
      return rest;
    });
    setSummaryOpen(false);
  };
  const dropIssue = (row: BatchRow, column: string) => {
    const left = (row.paste_issues ?? []).filter((x) => x.column !== column);
    return left.length > 0 ? { paste_issues: left } : { paste_issues: undefined };
  };

  const convertPaste = async () => {
    // Profil à plusieurs secteurs : la première colonne désigne le secteur par son code, résolu côté données.
    const sectors = props.fixedSectorId
      ? []
      : await resolveSectorsAction({ locale, codes: pasteText.split(/\r?\n/).map((l) => (l.split(l.includes('\t') ? '\t' : ';')[0] ?? '').trim()) });
    const pasteContext: PasteContext = {
      sectors,
      fixedSectorId: props.fixedSectorId,
      dispositifNames: props.dispositifNames,
      campaignCodes: props.campaigns.map((c) => c.value),
      hoursAllowed: HOURS,
    };
    const r = parsePaste(pasteText, pasteContext);
    if (r.rows.length === 0) {
      setPasteInfo({ added: 0, blank: r.blankLines, header: r.headerSkipped });
      return;
    }
    const keep = rows.filter((row, i) => !isEmptyBatchRow(row, props.fixedSectorId ?? undefined) || saved.includes(i));
    setRows([...keep, ...r.rows].slice(0, MAX_ROWS));
    setSaved([]);
    setLines({});
    setPasteInfo({ added: r.rows.length, blank: r.blankLines, header: r.headerSkipped });
    setPasteText('');
    setSummaryOpen(false);
  };

  const setFilter = (f: Filter) => {
    const url = new URL(window.location.href);
    if (f === 'all') url.searchParams.delete('filter');
    else url.searchParams.set('filter', f);
    window.history.pushState(null, '', url);
  };

  const run = (o: { confirm?: number[]; defer?: number[]; only?: number[] } = {}) =>
    startTransition(async () => {
      const payload = rows.map((r, i) => (saved.includes(i) || (o.only && !o.only.includes(i)) ? blank() : r));
      const result = await saveBatchAction({ locale, rows: payload, confirm: o.confirm, defer: o.defer });
      if (result.status === 'invalid') {
        setInvalid(true);
        return;
      }
      setInvalid(false);
      const nextLines: Record<number, BatchLineDto> = { ...lines };
      const nextSaved = [...saved];
      for (const l of result.lines) {
        if (l.status === 'ignored' && (saved.includes(l.index) || (o.only && !o.only.includes(l.index)))) continue;
        nextLines[l.index] = l;
        if (l.status === 'saved') nextSaved.push(l.index);
      }
      setLines(nextLines);
      setSaved(nextSaved);
      if (result.saved > 0) {
        const added = result.lines.filter((l) => l.status === 'saved').map((l) => l.index);
        announce(tc('saved'), {
          undoToken: result.undoToken,
          onUndo: () => {
            setSaved((cur) => cur.filter((i) => !added.includes(i)));
            setLines((cur) => Object.fromEntries(Object.entries(cur).filter(([k]) => !added.includes(Number(k)))));
          },
        });
      }
      setSummaryOpen(false);
      if (result.saved > 0 && result.rejected === 0 && result.needsConfirmation === 0) {
        await clearBatchDraftAction({ locale });
        setDraftState('idle');
      }
    });

  const statusOf = (i: number): 'saved' | 'rejected' | 'confirm' | 'none' => {
    const l = lines[i];
    if (!l || l.status === 'ignored') return 'none';
    return l.status === 'saved' ? 'saved' : l.status === 'rejected' ? 'rejected' : 'confirm';
  };
  const counts = {
    saved: Object.values(lines).filter((l) => l.status === 'saved').length,
    rejected: Object.values(lines).filter((l) => l.status === 'rejected').length,
    confirm: Object.values(lines).filter((l) => l.status === 'needs_confirmation').length,
  };
  const hasResult = counts.saved + counts.rejected + counts.confirm > 0;
  const visible = (i: number) => filter === 'all' || statusOf(i) === filter;
  const toConfirm = Object.values(lines).filter((l) => l.status === 'needs_confirmation').map((l) => l.index);

  const applyFix = (i: number, fix: NonNullable<FindingDto['fix']>) => {
    const row = rows[i];
    if (!row) return;
    setRow(i, { periods: row.periods.map((p, j) => (j === fix.periodNo - 1 ? { ...p, [fix.field]: fix.value } : p)) });
  };

  const draftText = draftState === 'saving' ? t('draft.saving') : draftState === 'saved' ? t('draft.saved') : t('draft.none');

  return (
    <div className="flex flex-col gap-6" data-testid="batch">
      <p className="max-w-prose text-muted">{t('intro')}</p>
      <DeadlineBanner context={props.deadline} dispositif="all" sectorId={props.fixedSectorId} />

      <section aria-labelledby="batch-paste-title" className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card">
        <h2 id="batch-paste-title" className="text-lg font-semibold">{t('paste.title')}</h2>
        <p className="text-muted">{t('paste.help')}</p>
        <p className="font-mono text-sm text-muted-strong">{props.fixedSectorId ? '' : `${t('paste.sectorColumn')}, `}{t('paste.columns')}</p>
        <TextareaField id="batch-paste" label={t('paste.label')} value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" disabled={pasteText.trim() === ''} onClick={() => void convertPaste()}>{t('paste.convert')}</Button>
          {pasteInfo ? (
            <p role="status" data-testid="paste-info" className="text-muted">
              {pasteInfo.added === 0 ? t('paste.nothing') : t('paste.done', { n: pasteInfo.added })}
              {pasteInfo.blank > 0 ? ` ${t('paste.blank', { n: pasteInfo.blank })}` : ''}
              {pasteInfo.header ? ` ${t('paste.header')}` : ''}
            </p>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('rows.title', { n: rows.length })}</h2>
        <p role="status" data-testid="draft-state" className="text-sm text-muted">{draftText}</p>
      </div>

      {hasResult ? (
        <section aria-labelledby="batch-result-title" data-testid="batch-result" className="flex flex-col gap-4">
          <h2 id="batch-result-title" className="text-lg font-semibold">{t('result.title')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Tile tone="aqua" label={t('result.saved')} value={String(counts.saved)} />
            <Tile tone="sand" attention={counts.rejected > 0} label={t('result.rejected')} value={String(counts.rejected)} />
            <Tile tone="lav" label={t('result.confirm')} value={String(counts.confirm)} />
          </div>
          <div role="group" aria-label={t('result.filters')} className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold ${filter === f ? 'bg-primary text-on-fill' : 'bg-alt text-ink hover:bg-sel'}`}
              >
                {t(`result.filter.${f}`)}
              </button>
            ))}
          </div>
          {toConfirm.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="w-full text-muted">{tf('confirmNote')}</p>
              <Button type="button" disabled={pending} onClick={() => run({ confirm: toConfirm, only: toConfirm })}>{t('result.confirmAll', { n: toConfirm.length })}</Button>
            </div>
          ) : null}
        </section>
      ) : null}
      {invalid ? <StatusTag tone="risk">{tf('invalid')}</StatusTag> : null}

      <ol className="flex flex-col gap-4">
        {rows.map((row, i) => {
          if (!visible(i)) return null;
          const line = lines[i];
          const disp = (DISPOSITIFS as readonly string[]).includes(row.dispositif) ? (row.dispositif as Dispositif) : null;
          const sectorId = row.sector_id || props.fixedSectorId;
          const lockedMonths = lockedMonthsFor(props.deadline, disp, sectorId, props.min, props.max);
          const bounds = { today: props.today, min: props.min, max: props.max, closedWeeks: props.closedWeeks, lockedMonths };
          const campaigns = props.campaigns.filter((c) => !row.dispositif || c.dispositif === row.dispositif);
          const stores = props.stores.filter((s) => s.sectorId === sectorId || s.sectorId === null);
          const missing = new Set(line && line.status !== 'saved' ? line.missing : []);
          const err = (k: string) => (missing.has(k) ? tf('required') : undefined);
          const savedLine = line?.status === 'saved' ? line : null;
          const period = row.periods[0]!;
          const deferTo = line?.findings.find((f) => f.defer)?.defer?.toMonth;
          return (
            <li key={i} id={`batch-row-${i}`} data-testid="batch-row" data-status={statusOf(i)} className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{t('rows.line', { n: i + 1 })}</h3>
                {savedLine ? <StatusTag tone="ok">{t('rows.savedTag', { code: savedLine.needCode ?? '' })}</StatusTag> : null}
                {line?.status === 'rejected' ? <StatusTag tone="risk">{t('rows.rejectedTag')}</StatusTag> : null}
                {line?.status === 'needs_confirmation' ? <StatusTag tone="attention">{t('rows.confirmTag')}</StatusTag> : null}
                {savedLine ? null : (
                  <span className="ml-auto flex flex-wrap gap-1">
                    <Button type="button" variant="ghost" onClick={() => setRows((cur) => [...cur.slice(0, i + 1), structuredClone(row), ...cur.slice(i + 1)].slice(0, MAX_ROWS))}>{t('rows.copy')}</Button>
                    <Button type="button" variant="ghost" onClick={() => { setRows((cur) => (cur.length > 1 ? cur.filter((_, j) => j !== i) : [blank()])); setLines({}); setSaved([]); }}>{t('rows.remove')}</Button>
                  </span>
                )}
              </div>

              {savedLine ? null : (
                <>
                  {row.paste_issues && row.paste_issues.length > 0 ? (
                    <ul data-testid="paste-issues" className="flex flex-col gap-1 rounded-ctl bg-warn-soft p-3 text-warn">
                      {row.paste_issues.map((x, k) => (
                        <li key={k}>{t(`issue.${x.kind}`, { raw: x.raw })}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {props.fixedSectorId ? null : (
                      <SelectField
                        id={`b${i}-sector`}
                        label={tf('fields.sector')}
                        placeholder={tf('choose')}
                        value={row.sector_id}
                        options={props.sectors.map((s) => ({ value: s.id, text: s.text }))}
                        onChange={(e) => setRow(i, { sector_id: e.target.value, store_codes: [], ...dropIssue(row, 'sector') })}
                      />
                    )}
                    <SelectField
                      id={`b${i}-dispositif`}
                      label={tf('fields.dispositif')}
                      placeholder={tf('choose')}
                      value={row.dispositif}
                      options={DISPOSITIFS.map((d) => ({ value: d, text: td(d) }))}
                      error={err('dispositif')}
                      onChange={(e) => setRow(i, { dispositif: e.target.value, campaign_code: '', ...dropIssue(row, 'dispositif') })}
                    />
                    <SelectField
                      id={`b${i}-campaign`}
                      label={tf('fields.campaign')}
                      placeholder={tf('choose')}
                      value={row.campaign_code}
                      options={campaigns.map((c) => ({ value: c.value, text: c.text }))}
                      error={err('campaign_code')}
                      onChange={(e) => setRow(i, { campaign_code: e.target.value, ...dropIssue(row, 'campaign') })}
                    />
                    <SelectField
                      id={`b${i}-position`}
                      label={tf('fields.position')}
                      placeholder={tf('choose')}
                      value={row.position_label}
                      options={Array.from({ length: 7 }, (_, k) => ({ value: `Poste ${k + 1}`, text: `${tf('fields.positionPrefix')} ${k + 1}` }))}
                      error={err('position_label')}
                      onChange={(e) => setRow(i, { position_label: e.target.value, ...dropIssue(row, 'position') })}
                    />
                    <SelectField
                      id={`b${i}-priority`}
                      label={tf('fields.priority')}
                      placeholder={tf('choose')}
                      value={row.priority}
                      options={[1, 2, 3].map((p) => ({ value: String(p), text: tf('fields.priorityN', { n: p }) }))}
                      error={err('priority')}
                      onChange={(e) => setRow(i, { priority: e.target.value, ...dropIssue(row, 'priority') })}
                    />
                    <SelectField
                      id={`b${i}-hours`}
                      label={tf('fields.weeklyHours')}
                      placeholder={tf('choose')}
                      value={row.weekly_hours}
                      options={HOURS.map((h) => ({ value: String(h), text: tf('fields.hoursN', { n: h }) }))}
                      error={err('weekly_hours')}
                      onChange={(e) => setRow(i, { weekly_hours: e.target.value, ...dropIssue(row, 'hours') })}
                    />
                    <div className="sm:col-span-2">
                      <DateRangePicker
                        id={`b${i}-range`}
                        label={tf('fields.dates')}
                        start={period.start_date}
                        end={period.end_date}
                        error={err('period')}
                        onChange={(s, e) =>
                          setRow(i, {
                            periods: [{
                              start_date: s, end_date: e,
                              start_week: formatWeek(isoWeekOf(s)), end_week: e ? formatWeek(isoWeekOf(e)) : null,
                            }],
                            raw: undefined,
                          })
                        }
                        {...bounds}
                      />
                    </div>
                    <Field
                      id={`b${i}-slot`}
                      label={tf('fields.hoursSlot')}
                      hint={tf('hints.hoursSlot')}
                      error={err('hours_slot')}
                      value={row.hours_slot}
                      maxLength={40}
                      onChange={(e) => setRow(i, { hours_slot: e.target.value })}
                    />
                  </div>
                  <WeekdayPicker
                    id={`b${i}-days`}
                    label={tf('fields.days')}
                    value={row.days}
                    onChange={(d) => setRow(i, { days: d, ...dropIssue(row, 'days') })}
                    allowed={disp ? props.daysByDispositif[disp] : props.daysAllowed}
                    error={err('days')}
                  />
                  <details className="rounded-ctl bg-alt p-3">
                    <summary className="min-h-11 cursor-pointer font-semibold">{t('rows.stores', { n: row.store_codes.length })}</summary>
                    <fieldset className="mt-2 flex flex-col gap-1">
                      <legend className="sr-only">{tf('fields.stores')}</legend>
                      {stores.length === 0 ? <p className="text-muted">{tf('noStores')}</p> : null}
                      {stores.map((s) => (
                        <label key={s.value} className="flex min-h-11 items-center gap-3">
                          <input
                            type="checkbox"
                            className="size-5 accent-primary"
                            checked={row.store_codes.includes(s.value)}
                            onChange={(e) => setRow(i, { store_codes: e.target.checked ? [...row.store_codes, s.value] : row.store_codes.filter((c) => c !== s.value) })}
                          />
                          <span>{s.text}</span>
                        </label>
                      ))}
                    </fieldset>
                  </details>
                </>
              )}

              {line && line.status !== 'saved' ? (
                <div className="flex flex-col gap-3" data-testid="row-result">
                  {line.reason && line.reason !== 'blocked' ? <p className="font-semibold text-danger">{tf(`refusal.${line.reason}`)}</p> : null}
                  {line.missing.length > 0 ? <p className="text-muted">{tf('stillMissing', { fields: line.missing.map((m) => tf(`missing.${m}`)).join(', ') })}</p> : null}
                  {line.findings.length > 0 ? <FindingsPanel findings={line.findings} onFix={(fix) => applyFix(i, fix)} /> : null}
                  {deferTo ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="w-full text-muted">{tf('deferNote')}</p>
                      <Button type="button" disabled={pending} onClick={() => run({ defer: [i], confirm: [i], only: [i] })}>{tf('defer', { month: formatMonth(deferTo, locale) })}</Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" disabled={rows.length >= MAX_ROWS} onClick={() => setRows((cur) => [...cur, blank()])}>{t('rows.add')}</Button>
        <Button type="button" variant="ghost" onClick={() => setRows((cur) => [...cur, blank(), blank(), blank(), blank(), blank()].slice(0, MAX_ROWS))} disabled={rows.length >= MAX_ROWS}>{t('rows.addFive')}</Button>
        <Button type="button" variant="ghost" onClick={() => { setRows([blank(), blank(), blank()]); setLines({}); setSaved([]); void clearBatchDraftAction({ locale }); setDraftState('idle'); }}>{t('rows.clear')}</Button>
      </div>

      <section aria-labelledby="batch-summary-title" className="flex flex-col gap-4 rounded-card bg-tint-aqua p-5 shadow-card" data-testid="batch-summary">
        <h2 id="batch-summary-title" className="text-lg font-semibold">{t('summary.title')}</h2>
        {!summaryOpen ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-muted-strong">{t('summary.hint')}</p>
            <Button type="button" disabled={summary.filled === 0 || pending} onClick={() => setSummaryOpen(true)}>{t('summary.open')}</Button>
          </div>
        ) : (
          <>
            <dl className="grid gap-3 sm:grid-cols-4">
              <div><dt className="text-sm text-muted-strong">{t('summary.filled')}</dt><dd className="text-xl font-semibold tabular">{summary.filled}</dd></div>
              <div><dt className="text-sm text-muted-strong">{t('summary.complete')}</dt><dd className="text-xl font-semibold tabular">{summary.complete}</dd></div>
              <div><dt className="text-sm text-muted-strong">{t('summary.hours')}</dt><dd className="text-xl font-semibold tabular">{summary.weeklyHours}</dd></div>
              <div><dt className="text-sm text-muted-strong">{t('summary.ignored')}</dt><dd className="text-xl font-semibold tabular">{summary.ignored}</dd></div>
            </dl>
            {Object.keys(summary.byDispositif).length > 0 ? (
              <p>{(Object.entries(summary.byDispositif) as Array<[Dispositif, number]>).map(([d, n]) => t('summary.byDispositif', { name: td(d), n })).join(' · ')}</p>
            ) : null}
            {summary.incomplete.length > 0 ? (
              <div data-testid="summary-incomplete">
                <p className="font-semibold">{t('summary.incomplete', { n: summary.incomplete.length })}</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {summary.incomplete.map((x) => (
                    <li key={x.index}>
                      <a href={`#batch-row-${x.index}`} className="font-semibold text-link">{t('rows.line', { n: x.index + 1 })}</a>
                      {' : '}
                      {x.missing.map((m) => (m === 'sector' ? tf('fields.sector') : tf(`missing.${m}`))).join(', ')}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-muted-strong">{t('summary.incompleteNote')}</p>
              </div>
            ) : null}
            {summary.withPasteIssues.length > 0 ? <p className="font-semibold text-warn">{t('summary.pasteIssues', { n: summary.withPasteIssues.length })}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" disabled={pending || summary.complete === 0} onClick={() => run()}>{pending ? tf('saving') : t('summary.submit', { n: summary.complete })}</Button>
              <Button type="button" variant="ghost" onClick={() => setSummaryOpen(false)}>{t('summary.edit')}</Button>
            </div>
          </>
        )}
      </section>

      <Link href="/needs" className="inline-flex min-h-11 w-fit items-center rounded-full px-5 text-sm font-semibold text-link hover:bg-sel">{tf('back')}</Link>
    </div>
  );
}
