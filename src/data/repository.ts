import type { AccessContext } from '@/domain/access';
import type { DelayMonth, DerivedAlert, OutboxItem } from '@/domain/deadline-views';
import type { DeadlineType, Dispositif, MenuKey, PresetId, ProfileId, ReopenScope } from '@/domain/types';
import type { Finding } from '@/domain/rules';
import type { RuleInput } from '@/domain/week-rules';
import type {
  Alert, BatchRow, BusinessEvent, Campaign, DeadlineSettings, DemoClock, DemoProfile, DispositifParams, Need, ParamChange,
  ParamKey, Reopening, ReopeningRequest, Store, WeekClosure, Zone,
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

  // ---- Lot A2b : échéances, blocage, paramètres par dispositif, réouvertures, saisie en lot ----
  /** Données de calcul des échéances pour l'écran (calendrier, paramètres, réouvertures du périmètre). Le forfait kilométrique est masqué côté cliente (D08 ouvert). */
  getDeadlineContext(ctx: AccessContext): Promise<DeadlineContext>;
  /** Résumé des retards du périmètre, par région et par secteur (D81). */
  getDelaySummary(ctx: AccessContext): Promise<DelayMonth[]>;
  /** Alertes d'échéance dérivées (D79, D82), filtrées par audience et par périmètre. */
  getDeadlineAlerts(ctx: AccessContext): Promise<DerivedAlert[]>;
  /** Vrai pour l'agence administration : calendrier, paramètres de dispositif et décisions de réouverture. */
  canManageSettings(ctx: AccessContext): boolean;
  /** Paramètres complets, valeur de forfait comprise : réservés aux profils qui ont l'entrée Paramètres. */
  getDispositifParams(ctx: AccessContext): Promise<DispositifParams[]>;
  getParamHistory(ctx: AccessContext): Promise<ParamChange[]>;
  updateDispositifParam(ctx: AccessContext, dispositif: Dispositif, key: ParamKey, value: unknown): Promise<MutationResult<'forbidden' | 'invalid' | 'unchanged'>>;
  /** Rattachement d'une campagne à un dispositif : refusé par P2 si elle relève déjà d'un autre dispositif. */
  assignCampaignDispositif(ctx: AccessContext, campaignCode: string, dispositif: Dispositif): Promise<MutationResult<'forbidden' | 'not_found' | 'p2'>>;
  getCampaignDispositifs(ctx: AccessContext): Promise<Record<string, Dispositif[]>>;
  updateDeadlineEntry(ctx: AccessContext, input: DeadlineEntryInput): Promise<MutationResult<'forbidden' | 'invalid'>>;
  setDefaultPreset(ctx: AccessContext, preset: PresetId): Promise<MutationResult<'forbidden' | 'invalid'>>;
  getReopenings(ctx: AccessContext): Promise<Reopening[]>;
  getReopeningRequests(ctx: AccessContext): Promise<ReopeningRequest[]>;
  /** Seul le CVR demande une réouverture (D87). */
  requestReopening(ctx: AccessContext, input: ReopeningRequestInput): Promise<MutationResult<'forbidden' | 'invalid' | 'not_closed' | 'duplicate'>>;
  /** L'agence administration seule décide : motif, durée, trace (D82, D147). */
  decideReopening(ctx: AccessContext, input: ReopeningDecisionInput): Promise<MutationResult<'forbidden' | 'invalid' | 'not_found'>>;
  /** File des courriels préparés pour validation, sans envoi (D86, D94). Réservée à l'agence et au prestataire. */
  getOutbox(ctx: AccessContext): Promise<OutboxEntry[]>;
  decideOutbox(ctx: AccessContext, id: string, decision: 'validated' | 'discarded'): Promise<MutationResult<'forbidden' | 'not_found'>>;
  /** Secteurs du périmètre désignés par leur code collé d'un tableur : le code ne quitte jamais la couche données autrement. */
  resolveSectorCodes(ctx: AccessContext, codes: string[]): Promise<Array<{ id: string; code: string }>>;
  saveNeedsBatch(ctx: AccessContext, rows: BatchRow[], options?: BatchOptions): Promise<BatchResult>;
  /**
   * Exécute une écriture et garde de quoi l'annuler (D159). Le jeton n'est rendu que si `changed` juge l'écriture
   * effective. L'annulation n'est possible que tant qu'aucune autre écriture n'a eu lieu depuis.
   */
  withUndo<T>(ctx: AccessContext, write: () => Promise<T>, changed: (result: T) => boolean): Promise<{ result: T; undoToken: string | null }>;
  undoWrite(ctx: AccessContext, token: string): Promise<MutationResult<'expired' | 'forbidden'>>;
  getBatchDraft(ctx: AccessContext): Promise<BatchDraft | null>;
  saveBatchDraft(ctx: AccessContext, rows: BatchRow[]): Promise<MutationResult<'forbidden'>>;
  clearBatchDraft(ctx: AccessContext): Promise<void>;
}

export type MutationResult<E extends string = string> = { status: 'ok' } | { status: 'refused'; reason: E };

/** Contexte sérialisable : l'écran recalcule échéances et bannières avec les mêmes modules purs que la couche données. */
export interface DeadlineContext {
  today: string;
  settings: DeadlineSettings;
  params: DispositifParams[];
  reopenings: Reopening[];
  /** Pour chaque secteur du périmètre : le secteur et ses ancêtres (pour appliquer une réouverture limitée à une zone). */
  lineage: Record<string, string[]>;
}

export interface DeadlineEntryInput {
  month: string;
  type: DeadlineType;
  /** `default` retire la ligne du mois et rend la main au preset par défaut. */
  mode: 'default' | 'preset' | 'fixed';
  preset?: PresetId;
  fixedDate?: string;
}

export interface ReopeningRequestInput {
  scope: ReopenScope;
  target: string;
  motive: string;
  desiredUntil: string;
}

export interface ReopeningDecisionInput {
  /** Demande traitée, ou null pour une réouverture décidée directement par l'agence. */
  requestId: string | null;
  decision: 'grant' | 'decline';
  scope: ReopenScope;
  target: string;
  zoneId: string;
  reason: string;
  expiresOn: string;
}

export type OutboxEntry = OutboxItem & { status: 'pending' | 'validated' | 'discarded' };

export interface BatchOptions {
  /** Index des lignes dont les alertes sont confirmées. */
  confirm?: number[];
  /** Index des lignes reportées sur le mois suivant après une échéance. */
  defer?: number[];
}

export interface BatchLineResult {
  index: number;
  status: 'saved' | 'rejected' | 'needs_confirmation' | 'ignored';
  needId?: string;
  needCode?: string;
  decision?: 'draft' | 'submit' | 'merge';
  reason?: SaveRefusal;
  findings: ReturnedFinding[];
  missing: string[];
  issues?: NonNullable<BatchRow['paste_issues']>;
}

export interface BatchResult {
  lines: BatchLineResult[];
  saved: number;
  rejected: number;
  needsConfirmation: number;
  ignored: number;
}

export interface BatchDraft {
  updated_on: string;
  rows: BatchRow[];
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
  /** Report sur le mois suivant d'une demande tardive (D82) : l'échéance se juge sur le mois suivant. */
  deferToNextMonth?: boolean;
  /** Saisie en lot : un besoin incomplet est refusé au lieu d'être enregistré en brouillon. */
  requireComplete?: boolean;
}

/** Constat tel que renvoyé à l'écran : le besoin lié n'est cité que s'il est dans le périmètre du profil. */
export interface ReturnedFinding extends Finding {
  relatedVisible?: boolean;
}

export type SaveRefusal =
  | 'forbidden' | 'out_of_scope' | 'invalid_store' | 'campaign_mismatch' | 'not_found' | 'not_draft' | 'no_period' | 'blocked'
  | 'incomplete' | 'paste' | 'invalid';

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
