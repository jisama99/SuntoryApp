/**
 * Génération déterministe des fixtures fictives du lot A1.
 * Aucune lecture de fichier : tout vient de la graine fixe ci-dessous.
 * Codes selon docs/FIXTURES.md §3 ; chaque entité porte is_demo: true.
 */
import type {
  Alert, BusinessEvent, Campaign, DeadlineSettings, Decision, DemoClock, DemoProfile, DispositifParams, Need, Note, Period, Proposal,
  Delegation, Recruitment, RecruitmentExit, Reopening, ReopeningRequest, Store, Validation, WeekClosure, Zone,
} from '../src/data/schemas';
import { blankRecruitment, computeDeviations, needSpan } from '../src/domain/pipeline';
import type { CostStatus, DecisionOutcome, EventCode, InvalidationReason, Situation } from '../src/domain/types';
import { addDays, storedWeekOf } from '../src/domain/week';

export const SEED = 20261023;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildFixtures() {
  const rand = mulberry32(SEED);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T;
  const uuid = (): string => {
    const hex = (n: number) =>
      Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join('');
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[Math.floor(rand() * 4)]}${hex(3)}-${hex(12)}`;
  };

  const people = [
    'Amel', 'Bastien', 'Clémence', 'Darius', 'Élise', 'Farid', 'Gaëlle', 'Hugo', 'Inès', 'Jonas',
    'Kenza', 'Léo', 'Maëlle', 'Noé', 'Olivia', 'Paul', 'Quitterie', 'Rania', 'Sacha', 'Théo', 'Yasmine',
  ];
  // Prénoms réservés aux profils sans zone (direction, agence) : jamais ceux d'un responsable de zone.
  const extraNames = { direction: 'Ulysse', operator: 'Valentin', admin: 'Zoé' };
  let personIdx = 0;
  const nextPerson = () => `${people[personIdx++]} Démo`;

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const rsAlphabet = 'BCDFGHJKLMNPQRSTVWXZ0123456789';
  const used = new Set<string>();
  const unique = (make: () => string) => {
    let c = make();
    while (used.has(c)) c = make();
    used.add(c);
    return c;
  };

  const drDefs = [
    { code: 'DR-ALPHA', fr: 'Zone Nord-Test', en: 'North Test Zone', base: 'Nord-Test', baseEn: 'North Test', cvr: 3 },
    { code: 'DR-BETA', fr: 'Zone Centre-Test', en: 'Central Test Zone', base: 'Centre-Test', baseEn: 'Central Test', cvr: 2 },
    { code: 'DR-GAMMA', fr: 'Zone Sud-Test', en: 'South Test Zone', base: 'Sud-Test', baseEn: 'South Test', cvr: 1 },
  ];
  const rsPerCvr = [2, 2, 1, 3, 2, 2];

  const zones: Zone[] = [];
  let cvrIdx = 0;
  drDefs.forEach((d) => {
    const drId = uuid();
    zones.push({
      id: drId, kind: 'dr', code: d.code, parent_id: null,
      label_fr: d.fr, label_en: d.en, responsible_name: nextPerson(), is_demo: true,
    });
    for (let c = 1; c <= d.cvr; c++) {
      const cvrId = uuid();
      const code = unique(
        () => `CVR-${pick(letters.split(''))}${pick(letters.split(''))}${String(cvrIdx + 1).padStart(2, '0')}`,
      );
      zones.push({
        id: cvrId, kind: 'cvr', code, parent_id: drId,
        label_fr: `${d.base} ${c}`, label_en: `${d.baseEn} ${c}`,
        responsible_name: nextPerson(), is_demo: true,
      });
      const nRs = rsPerCvr[cvrIdx] ?? 1;
      for (let r = 1; r <= nRs; r++) {
        const rsCode = unique(
          () => `RS-${Array.from({ length: 4 }, () => pick(rsAlphabet.split(''))).join('')}`,
        );
        zones.push({
          id: uuid(), kind: 'rs', code: rsCode, parent_id: cvrId,
          label_fr: `Secteur ${d.base} ${c}.${r}`, label_en: `Sector ${d.baseEn} ${c}.${r}`,
          responsible_name: nextPerson(), is_demo: true,
        });
      }
      cvrIdx++;
    }
  });

  const firstOf = (kind: Zone['kind'], n = 0) => zones.filter((z) => z.kind === kind)[n] as Zone;
  const alpha = firstOf('dr', 0);
  const cvr1 = firstOf('cvr', 0);
  const rs1 = firstOf('rs', 0);

  // Le prénom d'un profil rattaché à une zone est celui du responsable fictif de cette zone (cohérence de la salutation).
  const firstName = (z: Zone) => z.responsible_name.split(' ')[0] as string;
  const profiles: DemoProfile[] = [
    { id: 'direction_client', side: 'client', scope: { kind: 'all' }, first_name: extraNames.direction, is_demo: true },
    { id: 'dr_client', side: 'client', scope: { kind: 'dr', ids: [alpha.id] }, first_name: firstName(alpha), is_demo: true },
    { id: 'cvr_client', side: 'client', scope: { kind: 'cvr', ids: [cvr1.id] }, first_name: firstName(cvr1), is_demo: true },
    { id: 'rs', side: 'client', scope: { kind: 'rs', ids: [rs1.id] }, first_name: firstName(rs1), is_demo: true },
    { id: 'agency_operator', side: 'agency', scope: { kind: 'all' }, first_name: extraNames.operator, is_demo: true },
    { id: 'agency_admin', side: 'agency', scope: { kind: 'all' }, first_name: extraNames.admin, is_demo: true },
    { id: 'provider_admin', side: 'provider', scope: { kind: 'all' }, first_name: null, is_demo: true },
  ];

  // Alertes d'exemple de toutes audiences. Texte dans messages/*.json (clé message_key).
  const gammaCvr = firstOf('cvr', 5);
  const alertDefs: Array<[Alert['audience'], Alert['severity'], string, Zone | null, string]> = [
    ['agency', 'attention', 'late_proposal_internal', cvr1, '2026-10-21'],
    ['agency', 'risk', 'incomplete_costing', alpha, '2026-10-20'],
    ['agency', 'attention', 'import_quality', null, '2026-10-22'],
    ['agency', 'info', 'technical_sync', null, '2026-10-22'],
    ['agency', 'risk', 'cost_threshold', gammaCvr, '2026-10-19'],
    ['both', 'attention', 'deadline_d5', null, '2026-10-23'],
    ['both', 'risk', 'deadline_d2', rs1, '2026-10-23'],
    ['both', 'info', 'week_53_check', null, '2026-10-18'],
    ['both', 'attention', 'need_to_confirm', rs1, '2026-10-22'],
    ['client', 'attention', 'proposal_awaiting_decision', cvr1, '2026-10-21'],
    ['client', 'info', 'client_decision_pending', alpha, '2026-10-20'],
  ];
  const alerts: Alert[] = alertDefs.map(([audience, severity, key, zone, created]) => ({
    id: uuid(), audience, severity, message_key: key, zone_id: zone ? zone.id : null,
    created_at: created, is_demo: true,
  }));

  const clock: DemoClock = { date: '2026-10-23', iso_week: '2026-S43', time: '10:30', is_demo: true };

  // ---- Lot A2a : générés après les données de A1, donc sans en modifier aucune valeur. ----
  const pad3 = (n: number) => String(n).padStart(3, '0');
  const rsZones = zones.filter((z) => z.kind === 'rs');

  const campaigns: Campaign[] = [
    { code: 'CMP-DEMO-01', dispositif: 'permanent', label_fr: 'Campagne Test Permanent', label_en: 'Permanent Test Campaign', window_start: '2026-01-01', window_end: '2027-12-31', is_demo: true },
    { code: 'CMP-DEMO-02', dispositif: 'seasonal', label_fr: 'Campagne Test Saisonnier', label_en: 'Seasonal Test Campaign', window_start: '2026-11-02', window_end: '2027-01-10', is_demo: true },
    { code: 'CMP-DEMO-03', dispositif: 'hourly_merch', label_fr: 'Campagne Test Merch horaire', label_en: 'Hourly Merchandising Test Campaign', window_start: '2026-09-01', window_end: '2027-06-30', is_demo: true },
    { code: 'CMP-DEMO-04', dispositif: 'second_placement', label_fr: 'Campagne Test Second placement', label_en: 'Second Placement Test Campaign', window_start: '2026-10-01', window_end: '2027-03-31', is_demo: true },
  ];
  const campaignOf = (d: Need['dispositif']) => campaigns.find((c) => c.dispositif === d)?.code ?? null;

  // 40 magasins : 37 rattachés à onze secteurs (le douzième n'a ni magasin ni besoin), 3 sans rattachement.
  const stores: Store[] = Array.from({ length: 40 }, (_, i) => ({
    id: uuid(),
    code: `MAG-DEMO-${pad3(i + 1)}`,
    label_fr: `Magasin Test ${pad3(i + 1)}`,
    label_en: `Test Store ${pad3(i + 1)}`,
    sector_id: i < 37 ? (rsZones[i % 11] as Zone).id : null,
    is_demo: true as const,
  }));

  const weekClosures: WeekClosure[] = [
    { week: '2026-S41', closed_at: '2026-10-12', is_demo: true },
    { week: '2026-S42', closed_at: '2026-10-19', is_demo: true },
  ];

  const period = (no: 1 | 2, start: string, end: string): Period => ({
    period_no: no, start_date: start, end_date: end, start_week: storedWeekOf(start), end_week: storedWeekOf(end),
  });
  const dispositifs = ['permanent', 'seasonal', 'hourly_merch', 'second_placement'] as const;
  const hoursList = [7, 10, 14, 20, 21, 28, 35] as const;
  const slots = ['08:00-12:00', '13:00-17:00', '09:00-17:00'] as const;
  const dayPatterns = [[1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6], [2, 4], [1, 3, 5]];
  const needs: Need[] = [];
  const addNeed = (sectorIdx: number, over: Partial<Need> & Pick<Need, 'periods'>) => {
    const idx = needs.length;
    const sector = rsZones[sectorIdx] as Zone;
    const own = stores.filter((st) => st.sector_id === sector.id);
    const picked = own.slice(0, 1 + Math.floor(rand() * Math.min(3, own.length))).map((st) => st.code);
    const onBehalf = idx % 4 === 3;
    const created = `2026-10-${String(5 + (idx % 18)).padStart(2, '0')}`;
    const disp = dispositifs[idx % 4] as Need['dispositif'];
    needs.push({
      id: uuid(),
      need_code: `BES-DEMO-${pad3(idx + 1)}`,
      dispositif: disp,
      campaign_code: campaignOf(disp),
      sector_id: sector.id,
      position_label: `Poste ${1 + (idx % 7)}`,
      weekly_hours: pick(hoursList),
      priority: ((idx % 3) + 1) as 1 | 2 | 3,
      days: pick(dayPatterns),
      hours_slot: pick(slots),
      store_codes: picked,
      store_count: picked.length,
      client_comment: null,
      need_state: 'submitted',
      position_status: null,
      entered_by_profile: onBehalf ? 'agency_operator' : 'rs',
      on_behalf: onBehalf,
      created_at: created,
      modified_at: created,
      record_version: 1,
      source_record_id: null,
      is_demo: true,
      ...over,
    });
  };
  // Besoins courants : secteurs 0 à 8, trois ou deux besoins espacés de six semaines (aucun doublon).
  const counts = [3, 3, 3, 3, 3, 2, 2, 2, 2];
  counts.forEach((n, s) => {
    for (let k = 0; k < n; k++) {
      const start = addDays('2026-10-26', (k * 6 + (s % 3)) * 7);
      const len = 1 + ((s + k) % 4);
      addNeed(s, { periods: [period(1, start, addDays(start, (len - 1) * 7 + 5))] });
    }
  });
  // Cas repères : 2026-S53 (28/12/2026) puis 2027-S01 (04/01/2027), contigus ; brouillon sans période (W9) ;
  // deux périodes P1 et P2 ; un besoin saisonnier ; un brouillon sans heures.
  addNeed(9, { dispositif: 'permanent', campaign_code: campaignOf('permanent'), periods: [period(1, '2026-12-28', '2027-01-03')], weekly_hours: 20, hours_slot: '09:00-17:00', days: [1, 2, 3, 4, 5] });
  addNeed(9, { dispositif: 'permanent', campaign_code: campaignOf('permanent'), periods: [period(1, '2027-01-04', '2027-01-10')], weekly_hours: 20, hours_slot: '09:00-17:00', days: [1, 2, 3, 4, 5] });
  addNeed(10, { need_state: 'draft', dispositif: null, campaign_code: null, periods: [], weekly_hours: null, priority: null, days: [], hours_slot: null, position_label: null, store_codes: [], store_count: 0 });
  addNeed(10, { dispositif: 'permanent', campaign_code: campaignOf('permanent'), periods: [period(1, '2026-11-02', '2026-11-15'), period(2, '2026-11-23', '2026-11-29')] });
  addNeed(10, { dispositif: 'seasonal', campaign_code: campaignOf('seasonal'), periods: [period(1, '2026-11-30', '2026-12-13')] });
  addNeed(8, { need_state: 'draft', weekly_hours: null, priority: null, periods: [period(1, '2027-02-01', '2027-02-07')] });

  // Journal d'événements (D91) : EV-01 à la création, EV-02 à la soumission. Audience obligatoire.
  const events: BusinessEvent[] = [];
  for (const n of needs) {
    const base = { actor_profile: n.entered_by_profile, zone_id: n.sector_id, need_id: n.id, effect_date: n.created_at, recorded_at: n.created_at, audience: 'both' as const, data: { need_code: n.need_code, on_behalf: n.on_behalf }, is_demo: true as const };
    events.push({ id: uuid(), code: 'EV-01', seq: 0, ...base });
    if (n.need_state === 'submitted') events.push({ id: uuid(), code: 'EV-02', seq: 0, ...base });
  }
  events.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  events.forEach((e, i) => { e.seq = i + 1; });

  // ---- Lot A2b : générés en dernier, donc sans modifier aucune valeur des lots précédents. ----
  // Presets : valeurs de départ de docs/COMPLEMENTS_CADRAGE/24 §3, non figées (D82). Novembre : changements au plus tard
  // le 30/10/2026, date fictive de l'illustration de D80 à confirmer par T. SOEFOU.
  const deadlineSettings: DeadlineSettings = {
    default_preset: 'standard',
    presets: {
      large: { needs_entry: { unit: 'calendar', days: 15 }, change_request: { unit: 'calendar', days: 15 } },
      standard: { needs_entry: { unit: 'working', days: 10 }, change_request: { unit: 'working', days: 5 } },
      short: { needs_entry: { unit: 'working', days: 3 }, change_request: { unit: 'working', days: 3 } },
    },
    cascade: [5, 2, 0],
    non_working_weekdays: [6, 7],
    exclude_holidays: true,
    entries: [
      { month: '2026-11', type: 'change_request', preset: null, fixed_date: '2026-10-30', author_profile: 'agency_admin', effective_from: '2026-10-23', is_demo: true },
    ],
    is_demo: true,
  };

  // Paramètres par dispositif : valeurs de départ du Workshop pour le second placement (doc 28 §2.2), à valider.
  // Le forfait kilométrique est une valeur FICTIVE étiquetée ; les autres dispositifs n'ont pas de forfait applicable.
  const baseParams = (dispositif: Campaign['dispositif']): DispositifParams => ({
    dispositif, min_minutes: null, km_flat_rate: { applicable: false, amount_eur_ht: null }, entry_window: null,
    change_effect: null, change_lead_days: null, change_lead_unit: 'calendar', entry_roles: null, horizon_weeks: null,
    non_working_days: null, days_allowed: null, campaign_single_dispositif: true, is_demo: true,
  });
  const dispositifParams: DispositifParams[] = [
    baseParams('permanent'),
    baseParams('seasonal'),
    baseParams('hourly_merch'),
    {
      ...baseParams('second_placement'),
      min_minutes: 45,
      km_flat_rate: { applicable: true, amount_eur_ht: 10 },
      entry_window: { reading: 'last_full_week' },
      change_effect: 'next_month',
      change_lead_days: 10,
      horizon_weeks: 52,
      non_working_days: { weekdays: [7], holidays: true },
      days_allowed: [1, 2, 3, 4, 5, 6],
    },
  ];

  // Une demande de réouverture déposée par le CVR de démonstration, en attente de décision de l'agence (D87).
  const reopeningRequests: ReopeningRequest[] = [
    {
      id: uuid(), scope: 'month', target: '2026-11', zone_id: cvr1.id,
      motive: 'Besoin tardif de la cliente sur un secteur du CVR (donnée fictive).',
      desired_until: '2026-11-06', requested_on: '2026-10-22', status: 'pending', is_demo: true,
    },
  ];
  const reopenings: Reopening[] = [];


  // ---- Lot A3 : généré après tout le reste, donc sans modifier aucune valeur des lots précédents. ----
  // Un besoin par cas repère du circuit (voir docs/COMPTE_RENDU_A3.md). Les dates sont des décalages en jours depuis la
  // création du besoin ; le générateur échoue si une date d'événement dépasse la date de démonstration (hors prise de poste planifiée).
  type PSpec = {
    sent: number | null; decision?: { at: number; outcome: DecisionOutcome; motive?: string; invalid?: { at: number; reason: InvalidationReason } };
    withdrawn?: { at: number; motive: string }; cost?: CostStatus; gap?: boolean;
  };
  type Spec = {
    taken?: number; clarify?: { at: number; motive: string }; reject?: { at: number; motive: string }; search?: number; props?: PSpec[];
    hired?: number; training?: number; start?: number | string; vehicle?: number | string; situation?: Situation; from?: number; white?: number;
    stopped?: { at: number; reason: string }; exitOn?: number; refusals?: number;
  };
  const specs: Record<number, Spec> = {
    0: { taken: 1, search: 1, props: [{ sent: 3, decision: { at: 5, outcome: 'approved' } }], hired: 7, training: 8, start: 9, vehicle: 8 },
    1: { taken: 1, search: 2, props: [{ sent: 14 }] },
    2: { taken: 1, search: 1, situation: 'reassigned', from: 11, props: [{ sent: 3, decision: { at: 4, outcome: 'approved' } }], hired: 6, start: 8, vehicle: 7 },
    3: { taken: 1, search: 1, props: [{ sent: 3, decision: { at: 6, outcome: 'approved' } }] },
    4: { taken: 1, search: 1, props: [{ sent: 10, gap: true }] },
    5: { taken: 1, search: 1, props: [{ sent: 2 }] },
    6: { taken: 1, search: 1, props: [{ sent: null, cost: 'partial' }] },
    7: { taken: 1, search: 2 },
    8: { taken: 1, search: 1, refusals: 1, props: [{ sent: 2, decision: { at: 4, outcome: 'refused', motive: 'Profil non adapté au créneau demandé.' } }] },
    9: { taken: 1 },
    11: { clarify: { at: 1, motive: 'Préciser les magasins concernés.' } },
    13: { reject: { at: 1, motive: 'Besoin hors périmètre de la mission.' } },
    14: { taken: 1, search: 1, stopped: { at: 3, reason: 'Fermeture du magasin.' } },
    15: { taken: 1, search: 1, situation: 'white_zone', white: 1 },
    16: { taken: 0, search: 0, props: [{ sent: 0, withdrawn: { at: 2, motive: 'Désistement de la candidate.' }, decision: { at: 0, outcome: 'approved', invalid: { at: 2, reason: 'withdrawn' } } }], hired: 1, exitOn: 2 },
    17: { taken: 0, search: 0, props: [{ sent: 0, decision: { at: 0, outcome: 'approved', invalid: { at: 1, reason: 'new_version' } } }, { sent: 1 }] },
    18: { taken: 1, search: 1, props: [{ sent: 3, decision: { at: 4, outcome: 'approved' } }], hired: 6, start: 8 },
    19: { taken: 1, search: 1, props: [{ sent: 4, decision: { at: 6, outcome: 'approved' } }], hired: 9, start: 10 },
    20: { taken: 1, search: 1, props: [{ sent: 5, decision: { at: 7, outcome: 'approved' } }], hired: 9 },
    21: { taken: 1, search: 1, props: [{ sent: 2, decision: { at: 3, outcome: 'approved' } }], hired: 5, start: 7 },
    22: { taken: 1, search: 1, props: [{ sent: 3, decision: { at: 4, outcome: 'approved' } }], hired: 7, start: 9, vehicle: 8 },
    23: { taken: 1, search: 1, props: [{ sent: 3, decision: { at: 5, outcome: 'approved' } }], hired: 8, start: '2026-11-02', vehicle: 12 },
    24: { taken: 1, search: 2 },
    26: { taken: 1, search: 1, props: [{ sent: 9 }] },
    27: { taken: 1, search: 1, props: [{ sent: 4, decision: { at: 6, outcome: 'approved' } }] },
  };
  const TODAY = clock.date;
  const recruitments: Recruitment[] = [];
  const proposals: Proposal[] = [];
  const decisions: Decision[] = [];
  const notes: Note[] = [];
  const a3Events: BusinessEvent[] = [];
  const ev = (code: EventCode, n: Need, date: string, data: BusinessEvent['data'] = {}, audience: BusinessEvent['audience'] = 'both', actor: BusinessEvent['actor_profile'] = 'agency_operator', recorded = date) => {
    if (recorded > TODAY) throw new Error(`Date d'événement après la date de démonstration : ${n.need_code} ${code} ${recorded}`);
    a3Events.push({ id: uuid(), code, seq: 0, actor_profile: actor, zone_id: n.sector_id, need_id: n.id, effect_date: date, recorded_at: recorded, audience, data: { need_code: n.need_code, ...data }, is_demo: true });
  };
  const pad = (n: number) => String(n).padStart(3, '0');

  // ---- Lot A3c : validation managériale et délégations. Identifiants tirés d'une seconde graine : aucun identifiant des lots
  // précédents ne change. Les besoins existants avant A3c sont réputés validés par leur CVR le jour de leur soumission (D209) ;
  // les besoins ajoutés plus bas couvrent chaque état du circuit. ----
  const rand2 = mulberry32(SEED ^ 0x3c3c);
  const uuid2 = (): string => {
    const hex = (n: number) => Array.from({ length: n }, () => Math.floor(rand2() * 16).toString(16)).join('');
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[Math.floor(rand2() * 4)]}${hex(3)}-${hex(12)}`;
  };
  const validations: Validation[] = [];
  const delegations: Delegation[] = [];
  const ev2 = (code: EventCode, n: Need | null, zoneId: string, date: string, data: BusinessEvent['data'], audience: BusinessEvent['audience'], actor: BusinessEvent['actor_profile']) => {
    if (date > TODAY) throw new Error(`Date d'événement après la date de démonstration : ${code} ${date}`);
    a3Events.push({ id: uuid2(), code, seq: 0, actor_profile: actor, zone_id: zoneId, need_id: n?.id ?? null, effect_date: date, recorded_at: date, audience, data: n ? { need_code: n.need_code, ...data } : data, is_demo: true });
  };
  type VStep = { outcome: Validation['outcome']; level?: Validation['level']; on: string; actor: Validation['actor_profile']; motive?: string; escalationCase?: Validation['escalation_case']; concerned?: Zone };
  const addValidation = (n: Need, steps: VStep[]) => {
    let round = 1;
    for (const s of steps) {
      if (s.outcome === 'resubmitted') round += 1;
      validations.push({
        id: uuid2(), need_id: n.id, sector_id: n.sector_id, seq: validations.length + 1, round, outcome: s.outcome, level: s.level ?? 'cvr',
        escalation_case: s.escalationCase ?? null, concerned_zone_id: s.concerned?.id ?? null, motive: s.motive ?? null, actor_profile: s.actor,
        via_delegation_id: null, decided_on: s.on, decided_time: '09:00', is_demo: true,
      });
      const level = s.level ?? 'cvr';
      if (s.outcome === 'validated') ev2(level === 'dr' ? 'EV-07' : 'EV-06', n, n.sector_id, s.on, level === 'dr' ? { action: 'arbitrated', outcome: 'validated' } : { level }, 'both', s.actor);
      if (s.outcome === 'refused') ev2('EV-08', n, n.sector_id, s.on, { level }, 'both', s.actor);
      if (s.outcome === 'escalated') ev2('EV-07', n, n.sector_id, s.on, { action: 'escalated', case: s.escalationCase as string }, 'both', s.actor);
      if (s.outcome === 'resubmitted') ev2('EV-46', n, n.sector_id, s.on, {}, 'both', s.actor);
    }
  };
  for (const n of needs.filter((x) => x.need_state === 'submitted')) addValidation(n, [{ outcome: 'validated', on: n.created_at, actor: 'cvr_client' }]);
  const zoneBy = (code: string) => zones.find((z) => z.code === code) as Zone;
  const addDelegation = (d: Omit<Delegation, 'id' | 'is_demo' | 'stopped_on' | 'stopped_by'> & Partial<Pick<Delegation, 'stopped_on' | 'stopped_by'>>) => {
    delegations.push({ id: uuid2(), stopped_on: null, stopped_by: null, ...d, is_demo: true });
    ev2('EV-47', null, d.absent_zone_id, d.created_on, { action: 'created', starts_on: d.starts_on, ends_on: d.ends_on }, 'agency', d.created_by);
    if (d.stopped_on) ev2('EV-47', null, d.absent_zone_id, d.stopped_on, { action: d.stopped_on < d.starts_on ? 'cancelled' : 'stopped', starts_on: d.starts_on, ends_on: d.ends_on }, 'agency', d.created_by);
  };
  addDelegation({ absent_zone_id: zoneBy('CVR-GP03').id, substitute_zone_id: zoneBy('CVR-WY02').id, starts_on: '2026-10-05', ends_on: '2026-10-09', motive: 'Congés planifiés (donnée fictive).', created_by: 'agency_admin', created_on: '2026-10-02' });
  addDelegation({ absent_zone_id: zoneBy('CVR-NM04').id, substitute_zone_id: zoneBy('CVR-MS05').id, starts_on: '2026-10-12', ends_on: '2026-10-30', motive: 'Absence prolongée (donnée fictive).', created_by: 'agency_admin', created_on: '2026-10-09', stopped_on: '2026-10-16', stopped_by: 'agency_admin' });
  addDelegation({ absent_zone_id: zoneBy('DR-ALPHA').id, substitute_zone_id: zoneBy('DR-BETA').id, starts_on: '2026-11-02', ends_on: '2026-11-13', motive: 'Déplacement planifié (donnée fictive).', created_by: 'agency_admin', created_on: '2026-10-22' });

  for (const [key, spec] of Object.entries(specs)) {
    const idx = Number(key);
    const n = needs[idx] as Need;
    const at = (k: number) => addDays(n.created_at, k);
    const dateOf = (v: number | string) => (typeof v === 'string' ? v : at(v));
    const r: Recruitment = { ...blankRecruitment(n.id), refusal_count: spec.refusals ?? 0, withdrawal_count: spec.exitOn !== undefined ? 1 : 0 };
    if (spec.clarify) {
      r.intake = 'clarification'; r.intake_motive = spec.clarify.motive;
      ev('EV-09', n, at(spec.clarify.at), { outcome: 'clarify' });
    }
    if (spec.reject) {
      r.intake = 'rejected'; r.intake_motive = spec.reject.motive;
      ev('EV-09', n, at(spec.reject.at), { outcome: 'reject' });
    }
    if (spec.taken !== undefined) {
      r.intake = 'taken'; r.qualified_on = at(spec.taken);
      ev('EV-09', n, at(spec.taken), { outcome: 'take' });
    }
    if (spec.search !== undefined) { r.search_started_on = at(spec.search); ev('EV-13', n, at(spec.search)); }
    if (spec.situation) r.situation = spec.situation;
    if (spec.from !== undefined) { r.reassigned_from_sector_id = (rsZones[spec.from] as Zone).id; ev('EV-18', n, at(spec.taken ?? 0)); }
    if (spec.white !== undefined) { r.white_zone_since = at(spec.white); ev('EV-20', n, at(spec.white), { action: 'declared' }); }
    if (spec.stopped) { r.stopped = { reason: spec.stopped.reason, on: at(spec.stopped.at) }; ev('EV-19', n, at(spec.stopped.at)); }
    const span = needSpan(n);
    (spec.props ?? []).forEach((ps, i) => {
      const version = i + 1;
      const last = i === (spec.props ?? []).length - 1;
      const id = uuid();
      const base = {
        candidate_ref: `INT-${pad(100 + idx * 3 + version)}`, weekly_hours: n.weekly_hours as number, days: [...n.days], hours_slot: n.hours_slot,
        start_date: span?.start as string, end_date: span?.end as string, store_codes: [...n.store_codes],
      };
      const p: Proposal = {
        id, need_id: n.id, version, ...base, deviation_note: null, cost_status: ps.cost ?? 'complete', deviations: computeDeviations(n, base),
        status: ps.sent === null ? 'in_progress' : ps.withdrawn ? 'withdrawn' : last ? 'proposed' : 'superseded', author_profile: 'agency_operator',
        created_on: at(ps.sent ?? spec.search ?? 1), sent_on: ps.sent === null ? null : at(ps.sent), due_on: null,
        withdrawn_on: ps.withdrawn ? at(ps.withdrawn.at) : null, withdrawn_motive: ps.withdrawn?.motive ?? null, is_demo: true,
      };
      proposals.push(p);
      if (ps.sent !== null) ev('EV-10', n, at(ps.sent), { version, deviations: p.deviations.length });
      if (ps.decision) {
        const d: Decision = {
          id: uuid(), proposal_id: id, need_id: n.id, version, outcome: ps.decision.outcome, motive: ps.decision.motive ?? null,
          status: ps.decision.invalid ? 'invalidated' : 'valid', decided_by: 'cvr_client', decided_on: at(ps.decision.at),
          invalidated_on: ps.decision.invalid ? at(ps.decision.invalid.at) : null, invalidated_reason: ps.decision.invalid?.reason ?? null,
          invalidated_by_proposal_id: ps.decision.invalid?.reason === 'new_version' ? null : null, is_demo: true,
        };
        decisions.push(d);
        ev('EV-11', n, at(ps.decision.at), { version, outcome: ps.decision.outcome }, 'both', 'cvr_client');
        if (ps.decision.invalid) ev('EV-12', n, at(ps.decision.invalid.at), { version, reason: ps.decision.invalid.reason });
      }
      if (ps.withdrawn) ev('EV-45', n, at(ps.withdrawn.at), { version, cause: 'withdrawal' });
    });
    // Remplacement : la décision de la version 1 est invalidée par l'envoi de la version 2.
    const reps = proposals.filter((p) => p.need_id === n.id);
    for (const d of decisions.filter((x) => x.need_id === n.id && x.invalidated_reason === 'new_version')) {
      d.invalidated_by_proposal_id = (reps.find((p) => p.version === d.version + 1) as Proposal).id;
    }
    if (spec.hired !== undefined) { r.hired_on = at(spec.hired); ev('EV-14', n, at(spec.hired), { date: at(spec.hired) }); }
    if (spec.training !== undefined) { r.training_on = at(spec.training); ev('EV-15', n, at(spec.training), { date: at(spec.training) }); }
    if (spec.start !== undefined) {
      r.start_work_date = dateOf(spec.start);
      ev('EV-16', n, r.start_work_date, { date: r.start_work_date }, 'both', 'agency_operator', typeof spec.start === 'string' ? at(spec.hired ?? 0) : r.start_work_date);
    }
    if (spec.vehicle !== undefined) { r.vehicle_handover_date = dateOf(spec.vehicle); ev('EV-17', n, r.vehicle_handover_date, { date: r.vehicle_handover_date }); }
    if (spec.exitOn !== undefined) {
      r.exits = [{ kind: 'withdrawal', on: at(spec.exitOn), hired_on: r.hired_on, start_work_date: null } satisfies RecruitmentExit];
      r.hired_on = null; r.search_started_on = at(spec.exitOn);
      ev('EV-21', n, at(spec.exitOn), { kind: 'withdrawal' });
    }
    recruitments.push(r);
  }
  // Date cible des propositions : cinq jours ouvrés après la soumission (valeur de départ, D93), calculée comme le dépôt de données.
  const dueFor = (created: string): string => {
    let d = created;
    let left = 5;
    while (left > 0) {
      d = addDays(d, 1);
      const wd = new Date(`${d}T00:00:00Z`).getUTCDay();
      if (wd !== 0 && wd !== 6) left -= 1;
    }
    return d;
  };
  for (const p of proposals) p.due_on = dueFor((needs.find((x) => x.id === p.need_id) as Need).created_at);

  // Notes (D162) : une interne, une partagée avec la cliente, une adressée au CVR de démonstration, une partagée puis retirée.
  const proposalOf = (idx: number): Proposal => proposals.find((p) => p.need_id === (needs[idx] as Need).id && p.status !== 'superseded') as Proposal;
  const addNote = (idx: number, over: Partial<Note> & Pick<Note, 'text' | 'visibility'>) => {
    const p = proposalOf(idx);
    const n = needs[idx] as Need;
    notes.push({
      id: uuid(), object_kind: 'proposal', object_id: p.id, need_id: n.id, sector_id: n.sector_id, recipient_zone_id: null,
      author_profile: 'agency_operator', created_on: '2026-10-21', seq: notes.length + 1, withdrawn_on: null, withdrawn_by: null, is_demo: true, ...over,
    });
  };
  addNote(4, { text: 'Rappeler la candidate avant la décision (note de démonstration).', visibility: 'agency_internal' });
  addNote(5, { text: 'Les disponibilités de la candidate ont été confirmées (note de démonstration).', visibility: 'shared_client' });
  addNote(1, { text: 'Merci de décider avant lundi si possible (note de démonstration).', visibility: 'shared_recipient', recipient_zone_id: cvr1.id });
  addNote(0, { text: 'Note partagée puis retirée (démonstration).', visibility: 'shared_client', withdrawn_on: '2026-10-22', withdrawn_by: 'agency_operator' });
  for (const nt of notes) {
    const n = needs.find((x) => x.id === nt.need_id) as Need;
    a3Events.push({
      id: uuid(), code: 'EV-44', seq: 0, actor_profile: nt.author_profile, zone_id: nt.sector_id, need_id: nt.need_id, effect_date: nt.created_on, recorded_at: nt.created_on,
      audience: nt.visibility === 'shared_client' ? 'both' : 'agency', data: { need_code: n.need_code, action: 'added', visibility: nt.visibility, object: 'proposal' }, is_demo: true,
    });
  }

  // ---- Lot A3c : besoins ajoutés pour couvrir chaque état de la validation managériale (après tous les tirages des lots précédents). ----
  const period3c = (start: string) => period(1, start, addDays(start, 6));
  const newNeed = (sectorIdx: number, created: string, start: string, steps: VStep[]) => {
    addNeed(sectorIdx, { created_at: created, modified_at: created, periods: [period3c(start)], weekly_hours: 14, days: [1, 2, 3], hours_slot: '08:00-12:00' });
    const n = needs[needs.length - 1] as Need;
    const actor = n.entered_by_profile;
    ev2('EV-01', n, n.sector_id, created, { on_behalf: n.on_behalf }, 'both', actor);
    ev2('EV-02', n, n.sector_id, created, { on_behalf: n.on_behalf }, 'both', actor);
    addValidation(n, steps);
  };
  const wy02 = zoneBy('CVR-WY02');
  newNeed(0, '2026-10-14', '2027-03-01', []); // à valider, en retard
  newNeed(1, '2026-10-22', '2027-03-08', []); // à valider, dans les temps
  newNeed(1, '2026-10-12', '2027-03-15', [{ outcome: 'refused', on: '2026-10-14', actor: 'cvr_client', motive: 'Période non conforme au calendrier du secteur (motif fictif).' }]);
  newNeed(0, '2026-10-19', '2027-03-22', [{ outcome: 'escalated', on: '2026-10-20', actor: 'cvr_client', escalationCase: 'arbitration', concerned: wy02, motive: 'Magasins partagés avec le secteur voisin (motif fictif).' }]);
  newNeed(1, '2026-10-21', '2027-03-29', [
    { outcome: 'escalated', on: '2026-10-21', actor: 'cvr_client', escalationCase: 'out_of_perimeter', motive: 'Demande hors du périmètre habituel du CVR (motif fictif).' },
    { outcome: 'validated', level: 'dr', on: '2026-10-22', actor: 'dr_client', motive: 'Arbitrage favorable (motif fictif).' },
  ]);
  newNeed(2, '2026-10-21', '2027-04-05', []); // à valider, autre CVR
  newNeed(0, '2026-10-19', '2027-04-12', [
    { outcome: 'refused', on: '2026-10-20', actor: 'cvr_client', motive: 'Créneau à revoir (motif fictif).' },
    { outcome: 'resubmitted', on: '2026-10-21', actor: 'rs' },
    { outcome: 'validated', on: '2026-10-22', actor: 'cvr_client' },
  ]);

  // Les événements de A3 prolongent le journal sans réécrire les numéros existants.
  let seq = events.reduce((m, e) => Math.max(m, e.seq), 0);
  a3Events.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  for (const e of a3Events) events.push({ ...e, seq: ++seq });

  return {
    zones, profiles, alerts, clock, campaigns, stores, weekClosures, needs, events,
    deadlineSettings, dispositifParams, reopeningRequests, reopenings,
    recruitments, proposals, decisions, notes, validations, delegations,
  };
}
