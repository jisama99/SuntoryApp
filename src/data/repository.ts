import type { AccessContext } from '@/domain/access';
import type { DelayMonth, DerivedAlert, OutboxItem } from '@/domain/deadline-views';
import type { DelayStat, FunnelSummary, Milestone, NextStep, PipelineParams, ProposalIssue } from '@/domain/pipeline';
import type { DelegationRefusal, EnvelopeStatus, ValidationRefusal } from '@/domain/validation';
import type {
  DecisionOutcome, DeadlineType, DelegationStatus, Dispositif, EscalationReason, ExecutionStatus, FunnelState, HomeSkin, MenuKey, NoteObjectKind,
  NoteVisibility, PositionStatus, PresetId, ProfileId, RecruitmentStep, ReopenScope, Scope, Severity, Situation, StartLagKind, ValidationLevel,
  ValidationOutcome, ValidationState,
} from '@/domain/types';
import type { Finding } from '@/domain/rules';
import type { RuleInput } from '@/domain/week-rules';
import type {
  Alert, BatchRow, BusinessEvent, Campaign, DeadlineSettings, Decision, Delegation, DemoClock, DemoProfile, DispositifParams, Need, Note,
  ParamChange, ParamKey, Proposal, ProposalInput, PublicAccount, Recruitment, Reopening, ReopeningRequest, Store, ValidationEntry, WeekClosure, Zone,
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
  /** Skin d'accueil effectif : le choix du profil, sinon le défaut fixé par l'agence (D161). */
  getHomeSkin(ctx: AccessContext): Promise<{ skin: HomeSkin; source: 'user' | 'agency' }>;
  /** Défaut de l'agence. Lecture et écriture réservées à l'agence administration (D118, D161). */
  getHomeSkinDefault(ctx: AccessContext): Promise<HomeSkin | null>;
  setHomeSkinDefault(ctx: AccessContext, skin: HomeSkin): Promise<MutationResult<'forbidden' | 'invalid'>>;
  /** Choix du profil simulé : une préférence d'affichage, ouverte à tous les profils, qui ne touche que le sien. */
  setUserHomeSkin(ctx: AccessContext, skin: HomeSkin): Promise<MutationResult<'invalid'>>;
  // ---- Lot A1f : comptes de connexion (D188, D189) ----
  /** Vérifie un identifiant et un mot de passe. Un seul résultat négatif, sans détail : inconnu, désactivé ou faux. */
  authenticate(username: string, password: string): Promise<PublicAccount | null>;
  getAccount(accountId: string): Promise<PublicAccount | null>;
  /** Changement par la personne elle-même (premier accès avec le mot de passe temporaire). */
  changePassword(accountId: string, current: string, next: string): Promise<MutationResult<'invalid_current' | 'weak' | 'same' | 'not_found'>>;
  /** Gestion des comptes : agence administration seule, jamais en visualisation d'un autre profil (D189). */
  canManageAccounts(ctx: AccessContext): boolean;
  listAccounts(ctx: AccessContext): Promise<PublicAccount[]>;
  createAccount(ctx: AccessContext, input: AccountInput): Promise<AccountSecretResult<'forbidden' | 'invalid' | 'username_taken'>>;
  setAccountActive(ctx: AccessContext, accountId: string, active: boolean): Promise<MutationResult<'forbidden' | 'not_found' | 'protected' | 'self'>>;
  assignAccount(ctx: AccessContext, accountId: string, input: Omit<AccountInput, 'username'>): Promise<MutationResult<'forbidden' | 'not_found' | 'protected' | 'invalid'>>;
  resetAccountPassword(ctx: AccessContext, accountId: string): Promise<AccountSecretResult<'forbidden' | 'not_found' | 'protected'>>;
  // ---- Lot A3 : propositions, décisions, qui doit agir, entonnoir de recrutement, notes ----
  /** Un enregistrement par besoin du périmètre : statuts séparés, proposition courante, décision valide, qui doit agir. */
  getPipeline(ctx: AccessContext): Promise<PipelineRow[]>;
  /** Fil d'un besoin : versions de proposition, décisions, événements, notes visibles. Nul hors périmètre. */
  getNeedThread(ctx: AccessContext, needId: string): Promise<NeedThread | null>;
  getFunnelReport(ctx: AccessContext): Promise<FunnelReport>;
  /** Alertes dérivées de propositions et de décisions, filtrées par audience (D108, défaut refus). */
  getPipelineAlerts(ctx: AccessContext): Promise<PipelineAlert[]>;
  canQualify(ctx: AccessContext): boolean;
  canPropose(ctx: AccessContext): boolean;
  canDecide(ctx: AccessContext): boolean;
  canRecord(ctx: AccessContext, step: RecruitmentStep): boolean;
  qualifyNeed(ctx: AccessContext, needId: string, input: QualifyInput): Promise<MutationResult<'forbidden' | 'not_found' | 'invalid' | 'not_submitted' | 'already' | 'motive_required' | 'confirm_required'>>;
  saveProposal(ctx: AccessContext, needId: string, input: ProposalInput, options?: { send?: boolean }): Promise<ProposalResult>;
  /** Retire une proposition envoyée (motif obligatoire) ou jette un brouillon. Une décision qui s'y rattache est invalidée. */
  withdrawProposal(ctx: AccessContext, proposalId: string, motive: string): Promise<MutationResult<'forbidden' | 'not_found' | 'motive_required' | 'not_withdrawable'>>;
  decideProposal(ctx: AccessContext, proposalId: string, input: DecisionInput): Promise<MutationResult<DecisionRefusal>>;
  /** Validation en lot avec motif commun : chaque proposition est contrôlée seule, un refus n'arrête pas les autres. */
  decideBatch(ctx: AccessContext, proposalIds: string[], input: DecisionInput): Promise<BatchDecisionResult>;
  recordStep(ctx: AccessContext, needId: string, step: RecruitmentStep, input?: StepInput): Promise<MutationResult<StepRefusal>>;
  /** Notes d'un objet (proposition ou décision) lisibles par le profil. */
  getNotes(ctx: AccessContext, objectKind: NoteObjectKind, objectId: string): Promise<Note[]>;
  canWriteNotes(ctx: AccessContext): boolean;
  addNote(ctx: AccessContext, input: NoteInput): Promise<MutationResult<'forbidden' | 'not_found' | 'invalid' | 'confirm_required' | 'invalid_recipient'>>;
  /** Le retrait garde la trace, la note ne redevient jamais interne. */
  withdrawNote(ctx: AccessContext, noteId: string): Promise<MutationResult<'forbidden' | 'not_found' | 'already'>>;
  // ---- Lot A3c : validation managériale, escalade, délégations (F-30.1 à F-30.3) ----
  /** Le CVR valide dans son périmètre ou refuse avec motif ; il escalade au DR (arbitrage, hors périmètre, hors enveloppe). Le DR arbitre un besoin escaladé. */
  validateNeed(ctx: AccessContext, needId: string, input: ValidationInput): Promise<MutationResult<ValidationFailure>>;
  /** Validation en lot avec motif commun (F-30.6) : chaque besoin est contrôlé seul, un refus n'arrête pas les autres. L'escalade se fait besoin par besoin. */
  validateBatch(ctx: AccessContext, needIds: string[], input: ValidationInput): Promise<BatchValidationResult>;
  /** Le RS ou l'agence soumet de nouveau un besoin refusé : un nouveau tour de validation s'ouvre, l'historique reste. */
  resubmitNeed(ctx: AccessContext, needId: string): Promise<MutationResult<'forbidden' | 'not_found' | 'not_refused'>>;
  /** Délégations lisibles : toutes pour l'agence, celles du profil (délégant ou suppléant) pour la cliente. */
  getDelegations(ctx: AccessContext): Promise<DelegationView[]>;
  /** Paramétrage des suppléants : agence administration seule (F-30.3). */
  canManageDelegations(ctx: AccessContext): boolean;
  createDelegation(ctx: AccessContext, input: DelegationInput): Promise<MutationResult<DelegationRefusal | 'forbidden'>>;
  revokeDelegation(ctx: AccessContext, delegationId: string): Promise<MutationResult<'forbidden' | 'not_found' | 'not_revocable'>>;
  getBatchDraft(ctx: AccessContext): Promise<BatchDraft | null>;
  saveBatchDraft(ctx: AccessContext, rows: BatchRow[]): Promise<MutationResult<'forbidden'>>;
  clearBatchDraft(ctx: AccessContext): Promise<void>;
}

export interface AccountInput {
  username: string;
  profile: ProfileId;
  scope: Scope;
}
/** Résultat qui porte un mot de passe temporaire : il n'est rendu qu'une fois, jamais relu, jamais journalisé. */
export type AccountSecretResult<E extends string> =
  | { status: 'ok'; account: PublicAccount; temporaryPassword: string }
  | { status: 'refused'; reason: E };

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

// ---------------------------------------------------------------------------------------------
// Lot A3
// ---------------------------------------------------------------------------------------------
export interface PipelineRow {
  /** Besoin, avec le statut de poste calculé (jamais saisi). */
  need: Need;
  recruitment: Recruitment;
  funnel: FunnelState | null;
  positionStatus: PositionStatus | null;
  /** Statut d'exécution (prise de poste), distinct du statut de poste calculé. */
  execution: ExecutionStatus | null;
  /** Proposition courante : la cliente ne voit que les propositions envoyées, jamais un brouillon. */
  proposal: Proposal | null;
  /** Décision valide sur la proposition courante. */
  decision: Decision | null;
  proposalCount: number;
  next: NextStep;
  submittedOn: string;
  /** Facturable à partir de cette date (prise de poste). Réservé à l'agence. */
  billableFrom: string | null;
  /** Le besoin a changé depuis la proposition envoyée : la décision éventuelle est invalidée. */
  needChanged: boolean;
  /** Validation managériale (A3c) : dimension distincte de la qualification par l'agence. */
  validation: ValidationView;
}

/** Zones citées par le dossier de validation, résolues par la couche de données (jamais déduites de l'écran). */
export interface ValidationView {
  state: ValidationState;
  round: number;
  since: string | null;
  escalation: Recruitment['escalation'];
  log: ValidationEntry[];
  /** Action ouverte à ce profil sur ce besoin, avec l'autorité qui s'exerce (zone du CVR ou du DR, et zone du suppléant le cas échéant). */
  canAct: { level: Extract<ValidationLevel, 'cvr' | 'dr'>; zoneId: string; byZoneId: string | null } | null;
  canResubmit: boolean;
  /** CVR du besoin, DR du besoin et autres zones citées (suppléant, autre CVR d'un arbitrage). */
  zones: Record<string, Zone>;
  /** CVR sous le même DR, proposables pour un arbitrage : seulement pour qui peut escalader. */
  siblingCvrs: Zone[];
  /** Point d'entrée « hors enveloppe » (D43 ouverte) : non évalué tant que la règle d'A4b1 n'est pas branchée. */
  envelope: EnvelopeStatus;
}

export interface ValidationInput {
  outcome: ValidationOutcome;
  motive?: string;
  reason?: EscalationReason;
  /** Autre CVR en cause dans un arbitrage entre CVR. */
  otherZoneId?: string;
}
export type ValidationFailure = 'forbidden' | 'not_found' | 'not_pending' | ValidationRefusal;

export interface BatchValidationResult {
  items: Array<{ needId: string; status: 'ok' | 'refused'; reason?: ValidationFailure }>;
  decided: number;
  refused: number;
}

export interface DelegationInput {
  delegatorZoneId: string;
  substituteZoneId: string;
  startDate: string;
  endDate: string;
}
/** Délégation avec son état à la date de démonstration et les deux zones résolues. */
export type DelegationView = Delegation & { status: DelegationStatus; delegator: Zone; substitute: Zone };

export interface NeedThread {
  row: PipelineRow;
  proposals: Proposal[];
  decisions: Decision[];
  events: BusinessEvent[];
  /** Magasins que l'agence peut proposer pour ce secteur. */
  stores: Store[];
  notes: Note[];
}

export interface FunnelReport {
  summary: FunnelSummary;
  delays: Record<Situation, Record<Milestone, DelayStat>>;
  /** Écart entre l'acceptation et le poste démarré, par situation (D210). */
  startLags: Record<Situation, Record<StartLagKind, DelayStat>>;
  params: PipelineParams;
  /** Zones blanches : âge de vacance en jours depuis la déclaration, sans délai de recrutement. */
  vacancies: Array<{ needId: string; days: number }>;
}

export interface PipelineAlert {
  id: string;
  audience: Alert['audience'];
  severity: Severity;
  /** Clé sous `alerts.pipeline`. */
  message_key: 'proposalLate' | 'qualifyLate' | 'costingIncomplete' | 'decisionsPending' | 'decisionsLate' | 'clarificationPending' | 'startLate' | 'accordLost'
    | 'validationPending' | 'validationLate' | 'escalationPending' | 'resubmitPending' | 'delegationEnding';
  params: Record<string, string | number>;
  created_at: string;
}

export interface QualifyInput {
  outcome: 'take' | 'clarify' | 'reject';
  motive?: string;
  /** Confirmation exigée pour prendre en charge un besoin dont l'avis managérial est refusé (l'avis ne bloque pas, il se confirme). */
  confirmRefusedAvis?: boolean;
}

export type ProposalResult =
  | { status: 'saved'; proposal: Proposal; sent: boolean; invalidated: number }
  | { status: 'refused'; reason: 'forbidden' | 'not_found' | 'invalid' | 'invalid_store' | 'not_ready' | 'issues' | 'no_draft'; issues?: ProposalIssue[] };

export interface DecisionInput {
  outcome: DecisionOutcome;
  motive?: string;
}
export type DecisionRefusal = 'forbidden' | 'not_found' | 'invalid' | 'motive_required' | 'not_decidable' | 'already_decided';

export interface BatchDecisionResult {
  items: Array<{ proposalId: string; status: 'ok' | 'refused'; reason?: DecisionRefusal }>;
  decided: number;
  refused: number;
}

export interface StepInput {
  /** Date de l'étape (aaaa-mm-jj). Par défaut : la date du jour de démonstration. */
  date?: string;
  motive?: string;
  /** Heure de prise de poste (HH:MM, Paris), en option (D231). */
  time?: string;
  /** Secteur d'origine d'une réattribution. */
  fromSectorId?: string;
}
export type StepRefusal =
  | 'forbidden' | 'not_found' | 'invalid' | 'not_taken' | 'closed' | 'no_accord' | 'not_hired' | 'motive_required' | 'already'
  | 'invalid_sector' | 'nothing_to_withdraw';

export interface NoteInput {
  objectKind: NoteObjectKind;
  objectId: string;
  text: string;
  visibility: NoteVisibility;
  recipientZoneId?: string;
  /** Confirmation explicite exigée avant tout partage (D162). */
  confirmShare?: boolean;
}
