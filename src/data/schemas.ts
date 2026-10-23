import { z } from 'zod';
import { AUDIENCES, PROFILE_IDS, SEVERITIES, SIDES, ZONE_KINDS } from '@/domain/types';

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
