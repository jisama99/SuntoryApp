import { describe, expect, it } from 'vitest';
import { canEnterNeeds, ENTRY_RIGHTS, isOnBehalf, opinionAtEntry } from '@/domain/entry-rights';
import { ENTRY_PROFILES, PROFILE_IDS } from '@/domain/types';

describe('matrice des droits de saisie (A3d, D234)', () => {
  it('chaque profil a une ligne, et ENTRY_PROFILES est exactement la liste de ceux qui saisissent', () => {
    expect(Object.keys(ENTRY_RIGHTS).sort()).toEqual([...PROFILE_IDS].sort());
    expect(PROFILE_IDS.filter(canEnterNeeds).sort()).toEqual([...ENTRY_PROFILES].sort());
  });
  it.each([
    ['rs', true, false, null], ['cvr_client', true, false, 'cvr'], ['dr_client', true, false, 'dr'], ['direction_client', true, false, 'dr'],
    ['agency_operator', true, true, null], ['agency_admin', true, true, null], ['provider_admin', false, false, null],
  ] as const)('%s : saisit %s, pour le compte %s, avis à la saisie %s', (id, enters, onBehalf, opinion) => {
    expect(canEnterNeeds(id)).toBe(enters);
    expect(isOnBehalf(id)).toBe(onBehalf);
    expect(opinionAtEntry(id)).toBe(opinion);
  });
  it('seule l\'agence saisit pour le compte d\'un RS ; le prestataire n\'a aucun droit de saisie', () => {
    expect(PROFILE_IDS.filter(isOnBehalf).sort()).toEqual(['agency_admin', 'agency_operator']);
  });
});
