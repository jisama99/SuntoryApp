import type { Zone } from '@/data/schemas';
import type { ProfileId, Scope, ZoneKind } from './types';

/**
 * Règles des comptes (D188, D189), pures et testées. L'agence crée et attribue ; elle ne crée jamais de compte du
 * prestataire. Le périmètre doit correspondre au profil : zones DR pour une DR, CVR pour un CVR, RS pour un RS, tout pour
 * les autres.
 */
export const CREATABLE_PROFILES: readonly ProfileId[] = ['direction_client', 'dr_client', 'cvr_client', 'rs', 'agency_operator', 'agency_admin'];

export const scopeKindFor = (profile: ProfileId): ZoneKind | 'all' =>
  profile === 'dr_client' ? 'dr' : profile === 'cvr_client' ? 'cvr' : profile === 'rs' ? 'rs' : 'all';

export function validAssignment(zones: readonly Zone[], profile: ProfileId, scope: Scope): boolean {
  const kind = scopeKindFor(profile);
  if (kind === 'all') return scope.kind === 'all';
  if (scope.kind !== kind) return false;
  const byId = new Map(zones.map((z) => [z.id, z]));
  return scope.ids.length > 0 && scope.ids.every((id) => byId.get(id)?.kind === kind);
}

export const MIN_PASSWORD_LENGTH = 12;

export type PasswordProblem = 'weak' | 'same';

/** Politique minimale du démonstrateur : 12 caractères, au moins une lettre et un chiffre, différent du mot de passe actuel. */
export function passwordProblem(next: string, current: string): PasswordProblem | null {
  if (next.length < MIN_PASSWORD_LENGTH || next.length > 128 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return 'weak';
  return next === current ? 'same' : null;
}
