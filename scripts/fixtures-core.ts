/**
 * Génération déterministe des fixtures fictives du lot A1.
 * Aucune lecture de fichier : tout vient de la graine fixe ci-dessous.
 * Codes selon docs/FIXTURES.md §3 ; chaque entité porte is_demo: true.
 */
import type { Alert, DemoClock, DemoProfile, Zone } from '../src/data/schemas';

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

  return { zones, profiles, alerts, clock };
}
