import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import profilesJson from '@/data/fixtures/profiles.json';
import { createMemoryRepository, resetDemoState } from '@/data/memory-repository';
import { ProfileSchema } from '@/data/schemas';
import { buildAccessContext } from '@/domain/access';
import type { ProfileId } from '@/domain/types';

const profiles = z.array(ProfileSchema).parse(profilesJson);
const repo = createMemoryRepository();
const ctxOf = (id: ProfileId) => buildAccessContext(profiles.find((p) => p.id === id)!, 'fr');
const admin = ctxOf('agency_admin');

beforeEach(() => resetDemoState());

/** Annulation d'une écriture juste après coup (D159) : jeton opaque, une seule écriture à la fois, journal jamais réécrit. */
describe('annulation après écriture', () => {
  const setPreset = (preset: 'large' | 'short') => repo.withUndo(admin, () => repo.setDefaultPreset(admin, preset), (r) => r.status === 'ok');

  it('restaure l\'état d\'avant et laisse au journal l\'écriture annulée puis l\'annulation (EV-39)', async () => {
    const before = (await repo.getDeadlineContext(admin)).settings.default_preset;
    const eventsBefore = (await repo.getEvents(admin)).length;
    const { undoToken } = await setPreset(before === 'large' ? 'short' : 'large');
    expect(undoToken).toBeTruthy();
    expect((await repo.getDeadlineContext(admin)).settings.default_preset).not.toBe(before);
    expect(await repo.undoWrite(admin, undoToken as string)).toEqual({ status: 'ok' });
    expect((await repo.getDeadlineContext(admin)).settings.default_preset).toBe(before);
    const events = await repo.getEvents(admin);
    expect(events.length).toBe(eventsBefore + 2);
    const codes = events.map((e) => e.code);
    expect(codes.filter((c) => c === 'EV-39')).toHaveLength(1);
    expect(codes.filter((c) => c === 'EV-38')).toHaveLength(1);
  });

  it('un jeton ne sert qu\'une fois', async () => {
    const { undoToken } = await setPreset('short');
    expect((await repo.undoWrite(admin, undoToken as string)).status).toBe('ok');
    expect(await repo.undoWrite(admin, undoToken as string)).toEqual({ status: 'refused', reason: 'expired' });
  });

  it('refuse l\'annulation quand une autre écriture a eu lieu depuis', async () => {
    const first = await setPreset('short');
    await setPreset('large');
    expect(await repo.undoWrite(admin, first.undoToken as string)).toEqual({ status: 'refused', reason: 'expired' });
  });

  it('refuse l\'annulation par un autre profil que l\'auteur', async () => {
    const { undoToken } = await setPreset('short');
    expect(await repo.undoWrite(ctxOf('agency_operator'), undoToken as string)).toEqual({ status: 'refused', reason: 'forbidden' });
  });

  it('ne rend aucun jeton quand l\'écriture n\'a rien changé ou a été refusée', async () => {
    const refused = await repo.withUndo(ctxOf('rs'), () => repo.setDefaultPreset(ctxOf('rs'), 'short'), (r) => r.status === 'ok');
    expect(refused.undoToken).toBeNull();
    expect((await repo.undoWrite(admin, 'inconnu')).status).toBe('refused');
  });
});
