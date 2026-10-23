import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildFixtures } from '../../scripts/fixtures-core';
import { DeadlineSettingsSchema, DispositifParamsSchema, ReopeningRequestSchema, ReopeningSchema } from '@/data/schemas';
import { listDeadlines } from '@/domain/deadlines';
import { paramsMapOf } from '@/domain/dispositif-params';
import { DISPOSITIFS } from '@/domain/types';
import { lockedMonthsFor } from '@/lib/deadline-view';
import { ROOT } from './util';
import { reopening, settings } from './a2b-util';

const f = buildFixtures();
const committed = (name: string) => JSON.parse(readFileSync(path.join(ROOT, 'src/data/fixtures', name), 'utf8'));

describe('fixtures A2b : forme, marqueur, déterminisme', () => {
  it('chaque entité respecte son schéma Zod et porte is_demo à true (C2)', () => {
    DeadlineSettingsSchema.parse(f.deadlineSettings);
    z.array(DispositifParamsSchema).parse(f.dispositifParams);
    z.array(ReopeningRequestSchema).parse(f.reopeningRequests);
    z.array(ReopeningSchema).parse(f.reopenings);
    for (const e of [f.deadlineSettings, ...f.deadlineSettings.entries, ...f.dispositifParams, ...f.reopeningRequests]) expect(e.is_demo).toBe(true);
  });

  it('fichiers versionnés identiques à la génération, données A1 et A2a inchangées', () => {
    expect(committed('deadline-settings.json')).toEqual(f.deadlineSettings);
    expect(committed('dispositif-params.json')).toEqual(f.dispositifParams);
    expect(committed('reopening-requests.json')).toEqual(f.reopeningRequests);
    expect(committed('reopenings.json')).toEqual(f.reopenings);
    expect(JSON.stringify(buildFixtures())).toBe(JSON.stringify(f));
    expect(committed('needs.json')).toEqual(f.needs);
    expect(committed('events.json')).toEqual(f.events);
    expect(f.zones.find((z) => z.code === 'DR-ALPHA')?.id).toBe('1cf08936-8d48-4257-9eba-3ab84fe0ed99');
  });

  it('un jeu de paramètres par dispositif, forfait kilométrique applicable au second placement seulement et jamais à zéro', () => {
    expect(f.dispositifParams.map((p) => p.dispositif).sort()).toEqual([...DISPOSITIFS].sort());
    const second = f.dispositifParams.find((p) => p.dispositif === 'second_placement')!;
    expect(second.km_flat_rate.applicable).toBe(true);
    expect(second.min_minutes).toBe(45);
    for (const p of f.dispositifParams.filter((x) => x.dispositif !== 'second_placement')) {
      expect(p.km_flat_rate).toEqual({ applicable: false, amount_eur_ht: null });
    }
    for (const p of f.dispositifParams) expect(p.km_flat_rate.amount_eur_ht).not.toBe(0);
  });

  it('trois états d\'échéance au 23/10/2026 : une passée, une proche (J-5), une à venir (FIXTURES.md §2)', () => {
    const rows = listDeadlines(f.clock.date, f.deadlineSettings, paramsMapOf(f.dispositifParams)).filter((r) => r.dispositif === null);
    const by = (m: string, t: string) => rows.find((r) => r.month === m && r.type === t)!;
    expect(by('2026-11', 'needs_entry').status.state).toBe('closed'); // 19/10 : saisie bloquée (D78)
    expect(by('2026-11', 'change_request')).toMatchObject({ deadline: { date: '2026-10-30', source: 'fixed' }, status: { threshold: 5 } });
    expect(by('2026-12', 'needs_entry')).toMatchObject({ deadline: { date: '2026-11-17' }, status: { state: 'upcoming', threshold: null } });
  });

  it('la demande de réouverture fictive vise novembre et la zone du CVR de démonstration', () => {
    const cvr = f.profiles.find((p) => p.id === 'cvr_client')!;
    const req = f.reopeningRequests[0]!;
    expect(req).toMatchObject({ scope: 'month', target: '2026-11', status: 'pending' });
    expect(cvr.scope.kind === 'cvr' && cvr.scope.ids[0]).toBe(req.zone_id);
  });
});

describe('mois clos dans le calendrier de saisie (D78) : même calcul que la couche données', () => {
  const ctx = (reopenings = [] as ReturnType<typeof reopening>[]) => ({
    today: '2026-10-23', settings: settings(), params: f.dispositifParams, reopenings,
    lineage: { 'sector-1': ['sector-1', '11111111-1111-4111-8111-111111111111'] },
  });
  it('novembre est verrouillé avec la date limite, décembre est ouvert', () => {
    const locked = lockedMonthsFor(ctx(), 'permanent', 'sector-1', '2026-01-01', '2028-12-31');
    expect(locked.find((m) => m.month === '2026-11')).toEqual({ month: '2026-11', deadline: '2026-10-19' });
    expect(locked.some((m) => m.month === '2026-12')).toBe(false);
  });
  it('une réouverture de la zone du secteur lève le verrou, pas celle d\'une autre zone', () => {
    const own = lockedMonthsFor(ctx([reopening()]), 'permanent', 'sector-1', '2026-01-01', '2028-12-31');
    expect(own.some((m) => m.month === '2026-11')).toBe(false);
    const other = lockedMonthsFor(ctx([reopening({ zone_id: '22222222-2222-4222-8222-222222222222' })]), 'permanent', 'sector-1', '2026-01-01', '2028-12-31');
    expect(other.some((m) => m.month === '2026-11')).toBe(true);
  });
  it('le second placement suit sa propre fenêtre : décembre ouvert jusqu\'au 20/11', () => {
    const locked = lockedMonthsFor(ctx(), 'second_placement', 'sector-1', '2026-01-01', '2028-12-31');
    expect(locked.find((m) => m.month === '2026-11')?.deadline).toBe('2026-10-16');
    expect(locked.some((m) => m.month === '2026-12')).toBe(false);
  });
});
