import type { AccessContext } from '@/domain/access';
import type { MenuKey, ProfileId } from '@/domain/types';
import type { Finding } from '@/domain/rules';
import type { RuleInput } from '@/domain/week-rules';
import type {
  Alert, BusinessEvent, Campaign, DemoClock, DemoProfile, Need, Store, WeekClosure, Zone,
} from './schemas';

export interface MenuEntry {
  key: MenuKey;
  href: string;
}

/**
 * Interface de dépôt. Toute lecture de données métier reçoit un contexte d'accès :
 * le filtrage se fait ici, jamais seulement dans l'écran (CLAUDE.md, D107, D108).
 * L'étape B remplacera l'implémentation en mémoire par PostgreSQL sans toucher aux écrans.
 */
export interface Repository {
  getMenu(ctx: AccessContext): Promise<MenuEntry[]>;
  /** Zones du périmètre, ancêtres inclus (pour afficher la chaîne DR > CVR > RS). */
  getScopeZones(ctx: AccessContext): Promise<Zone[]>;
  getZone(ctx: AccessContext, zoneId: string): Promise<Zone | null>;
  getAlerts(ctx: AccessContext): Promise<Alert[]>;
  getClock(ctx: AccessContext): Promise<DemoClock>;

  // ---- Lot A2a : saisie des besoins ----
  /** Besoins des secteurs du périmètre (brouillons compris). */
  getNeeds(ctx: AccessContext): Promise<Need[]>;
  getNeed(ctx: AccessContext, needId: string): Promise<Need | null>;
  /** Les brouillons sont exclus des totaux (W9) ; ils sont comptés à part. */
  getNeedTotals(ctx: AccessContext): Promise<NeedTotals>;
  /** Magasins des secteurs du périmètre ; les magasins sans rattachement sont réservés à l'agence. */
  getStores(ctx: AccessContext): Promise<Store[]>;
  getCampaigns(ctx: AccessContext): Promise<Campaign[]>;
  getWeekClosures(ctx: AccessContext): Promise<WeekClosure[]>;
  /** Journal d'événements filtré par audience et par périmètre (D91, D108). */
  getEvents(ctx: AccessContext): Promise<BusinessEvent[]>;
  /** Vrai si le profil peut saisir (RS sur son secteur, agence pour le compte d'un RS). */
  canWriteNeeds(ctx: AccessContext): boolean;
  saveNeed(ctx: AccessContext, input: RuleInput, options?: SaveOptions): Promise<SaveResult>;
  duplicateNeed(ctx: AccessContext, needId: string, newStart: string, options?: SaveOptions): Promise<SaveResult>;
}

export interface NeedTotals {
  submitted: number;
  drafts: number;
  /** Somme des heures par semaine des besoins soumis ; les brouillons n'y entrent jamais. */
  weekly_hours: number;
}

export interface SaveOptions {
  /** Confirmation explicite des alertes (D2, D3, D5, W10…). */
  confirm?: boolean;
  /** Complète un brouillon existant. */
  needId?: string;
  /** Fusion : étend la période du besoin existant au lieu d'en créer un nouveau. */
  mergeInto?: string;
}

/** Constat tel que renvoyé à l'écran : le besoin lié n'est cité que s'il est dans le périmètre du profil. */
export interface ReturnedFinding extends Finding {
  relatedVisible?: boolean;
}

export type SaveRefusal = 'forbidden' | 'out_of_scope' | 'invalid_store' | 'campaign_mismatch' | 'not_found' | 'not_draft' | 'no_period' | 'blocked';

export type SaveResult =
  | { status: 'saved'; need: Need; decision: 'draft' | 'submit' | 'merge'; findings: ReturnedFinding[]; missing: string[] }
  | { status: 'needs_confirmation'; findings: ReturnedFinding[]; missing: string[] }
  | { status: 'refused'; reason: SaveRefusal; findings: ReturnedFinding[]; missing: string[] };

/**
 * Annuaire des profils de démonstration : simulation de connexion, pas un accès aux données.
 * Disparaît à l'étape B (authentification réelle, D33).
 */
export interface DemoProfileDirectory {
  list(): Promise<DemoProfile[]>;
  get(id: ProfileId): Promise<DemoProfile | null>;
}
