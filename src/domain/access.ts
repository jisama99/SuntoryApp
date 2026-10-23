import type { Alert, DemoProfile, Zone } from '@/data/schemas';
import type { Locale, ProfileId, Scope, Side } from './types';

/** Contexte d'accès unique (D107, proposée) : profil, périmètre, vocabulaire, langue. */
export interface AccessContext {
  profileId: ProfileId;
  side: Side;
  scope: Scope;
  locale: Locale;
  vocabulary: 'client' | 'agency';
  /** Prénom pour la salutation ; null = repli sans nom inventé (D84). */
  firstName: string | null;
}

export function buildAccessContext(profile: DemoProfile, locale: Locale): AccessContext {
  return {
    profileId: profile.id,
    side: profile.side,
    scope: profile.scope as Scope,
    locale,
    vocabulary: profile.side === 'client' ? 'client' : 'agency',
    firstName: profile.first_name,
  };
}

/** Identifiants de la zone et de ses ancêtres. */
export function lineage(zones: Zone[], zoneId: string): Zone[] {
  const byId = new Map(zones.map((z) => [z.id, z]));
  const out: Zone[] = [];
  let cur = byId.get(zoneId);
  while (cur) {
    out.push(cur);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return out;
}

/** Vrai si la zone est dans le périmètre (elle-même ou descendante d'une zone du périmètre). */
export function zoneInScope(zones: Zone[], zoneId: string, scope: Scope): boolean {
  if (scope.kind === 'all') return true;
  return lineage(zones, zoneId).some((z) => z.kind === scope.kind && scope.ids.includes(z.id));
}

/** Défaut refus (D108) : toute valeur inconnue est refusée. */
export function audienceAllows(side: Side, audience: unknown): boolean {
  if (audience === 'both') return true;
  if (side === 'client') return audience === 'client';
  if (side === 'agency' || side === 'provider') return audience === 'agency' || audience === 'client';
  return false;
}

export function alertVisible(zones: Zone[], ctx: AccessContext, alert: Alert): boolean {
  if (!audienceAllows(ctx.side, alert.audience)) return false;
  if (alert.zone_id === null) return true;
  return zoneInScope(zones, alert.zone_id, ctx.scope);
}
