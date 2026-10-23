import { z } from 'zod';
import {
  AUDIENCES, DISPOSITIFS, EVENT_CODES, NEED_STATES, POSITION_STATUSES, PROFILE_IDS, SEVERITIES, SIDES, ZONE_KINDS,
} from '@/domain/types';

export const ZoneSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(ZONE_KINDS),
  code: z.string(),
  parent_id: z.string().uuid().nullable(),
  label_fr: z.string().min(1),
  label_en: z.string().min(1),
  responsible_name: z.string().min(1),
  is_demo: z.literal(true),
});
export type Zone = z.infer<typeof ZoneSchema>;

export const ScopeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.enum(ZONE_KINDS), ids: z.array(z.string().uuid()).min(1) }),
]);

export const ProfileSchema = z.object({
  id: z.enum(PROFILE_IDS),
  side: z.enum(SIDES),
  scope: ScopeSchema,
  first_name: z.string().min(1).nullable(),
  is_demo: z.literal(true),
});
export type DemoProfile = z.infer<typeof ProfileSchema>;

// audience : obligatoire, sans valeur par défaut (D108). Une alerte sans audience est invalide.
export const AlertSchema = z.object({
  id: z.string().uuid(),
  audience: z.enum(AUDIENCES),
  severity: z.enum(SEVERITIES),
  message_key: z.string().min(1),
  zone_id: z.string().uuid().nullable(),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_demo: z.literal(true),
});
export type Alert = z.infer<typeof AlertSchema>;

export const DemoClockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  iso_week: z.string().regex(/^\d{4}-S\d{2}$/),
  is_demo: z.literal(true),
});
export type DemoClock = z.infer<typeof DemoClockSchema>;

// ---------------------------------------------------------------------------------------------
// Lot A2a : besoins, magasins, campagnes, clôtures de semaine, journal d'événements.
// ---------------------------------------------------------------------------------------------
const IsoDateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const StoredWeekStr = z.string().regex(/^\d{4}-S\d{2}$/);

export const PeriodSchema = z.object({
  period_no: z.union([z.literal(1), z.literal(2)]),
  start_date: IsoDateStr.nullable(),
  end_date: IsoDateStr.nullable(),
  start_week: StoredWeekStr.nullable(),
  end_week: StoredWeekStr.nullable(),
});
export type Period = z.infer<typeof PeriodSchema>;

export const StoreSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^MAG-DEMO-\d{3}$/),
  label_fr: z.string().min(1),
  label_en: z.string().min(1),
  /** Secteur (zone de type RS) de rattachement ; nul pour un magasin sans rattachement. */
  sector_id: z.string().uuid().nullable(),
  is_demo: z.literal(true),
});
export type Store = z.infer<typeof StoreSchema>;

export const CampaignSchema = z.object({
  code: z.string().regex(/^CMP-DEMO-\d{2}$/),
  dispositif: z.enum(DISPOSITIFS),
  label_fr: z.string().min(1),
  label_en: z.string().min(1),
  window_start: IsoDateStr,
  window_end: IsoDateStr,
  is_demo: z.literal(true),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const WeekClosureSchema = z.object({
  week: StoredWeekStr,
  closed_at: IsoDateStr,
  is_demo: z.literal(true),
});
export type WeekClosure = z.infer<typeof WeekClosureSchema>;

const DaysSchema = z.array(z.number().int().min(1).max(7));

/** Champs saisissables d'un besoin. Tout peut manquer sauf le secteur : un besoin incomplet reste un brouillon (W9). */
export const NeedInputSchema = z.object({
  dispositif: z.enum(DISPOSITIFS).nullable(),
  campaign_code: z.string().nullable(),
  sector_id: z.string().uuid(),
  position_label: z.string().max(60).nullable(),
  weekly_hours: z.number().int().min(1).max(60).nullable(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
  periods: z.array(PeriodSchema).max(2),
  days: DaysSchema,
  hours_slot: z.string().max(40).nullable(),
  store_codes: z.array(z.string().regex(/^MAG-DEMO-\d{3}$/)),
  client_comment: z.string().max(280).nullable(),
});
export type NeedInput = z.infer<typeof NeedInputSchema>;

export const NeedSchema = NeedInputSchema.extend({
  id: z.string().uuid(),
  need_code: z.string().regex(/^BES-DEMO-\d{3}$/),
  need_state: z.enum(NEED_STATES),
  position_status: z.enum(POSITION_STATUSES).nullable(),
  store_count: z.number().int().min(0),
  entered_by_profile: z.enum(PROFILE_IDS),
  /** Saisie pour le compte du responsable du secteur (D42) : auteur et personne concernée tracés séparément. */
  on_behalf: z.boolean(),
  created_at: IsoDateStr,
  modified_at: IsoDateStr,
  record_version: z.number().int().min(1),
  source_record_id: z.string().nullable(),
  is_demo: z.literal(true),
});
export type Need = z.infer<typeof NeedSchema>;

// audience obligatoire, sans valeur par défaut : un événement sans audience est invalide (D91, D108).
export const BusinessEventSchema = z.object({
  id: z.string().uuid(),
  code: z.enum(EVENT_CODES),
  actor_profile: z.enum(PROFILE_IDS),
  zone_id: z.string().uuid(),
  need_id: z.string().uuid().nullable(),
  effect_date: IsoDateStr,
  recorded_at: IsoDateStr,
  seq: z.number().int().min(1),
  audience: z.enum(AUDIENCES),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  is_demo: z.literal(true),
});
export type BusinessEvent = z.infer<typeof BusinessEventSchema>;
