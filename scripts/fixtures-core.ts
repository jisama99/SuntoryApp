/**
 * Génération déterministe des fixtures fictives du lot A1.
 * Aucune lecture de fichier : tout vient de la graine fixe ci-dessous.
 * Codes selon docs/FIXTURES.md §3 ; chaque entité porte is_demo: true.
 */
import type {
  Alert, BusinessEvent, Campaign, DemoClock, DemoProfile, Need, Period, Store, WeekClosure, Zone,
} from '../src/data/schemas';
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

  const clock: DemoClock = { date: '2026-10-23', iso_week: '2026-S43', is_demo: true };

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

  return { zones, profiles, alerts, clock, campaigns, stores, weekClosures, needs, events };
}
