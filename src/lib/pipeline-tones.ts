import type { Tone } from '@/components/StatusTag';
import type { DecisionOutcome, ExecutionStatus, FunnelState, PositionStatus, ProposalStatus, Urgency, ValidationState } from '@/domain/types';

/** Teintes des étiquettes du circuit. Le rose (important) est réservé à ce qui attend une action ; vert, ambre et rouge aux statuts. */
export const FUNNEL_TONE: Record<FunnelState, Tone> = {
  to_recruit: 'neutral', recruiting: 'info', proposed: 'attention', approved: 'ok', hired: 'ok', started: 'ok',
};
export const POSITION_TONE: Record<PositionStatus, Tone> = {
  to_recruit: 'neutral', recruiting: 'info', proposed: 'attention', approved: 'ok', filled: 'ok', withdrawal: 'risk', termination: 'risk',
  cancelled: 'neutral', refused: 'risk',
};
export const URGENCY_TONE: Record<Urgency, Tone> = { overdue: 'risk', urgent: 'attention', soon: 'info', normal: 'neutral' };
export const PROPOSAL_TONE: Record<ProposalStatus, Tone> = { in_progress: 'neutral', proposed: 'attention', withdrawn: 'neutral', superseded: 'neutral' };
export const OUTCOME_TONE: Record<DecisionOutcome, Tone> = { approved: 'ok', refused: 'risk', revision: 'attention' };

/** Ordre de tri : entonnoir dans l'ordre du cycle, urgence du plus pressant au plus calme. */
export const FUNNEL_ORDER = ['to_recruit', 'recruiting', 'proposed', 'approved', 'hired', 'started'] as const;
export const URGENCY_ORDER = ['overdue', 'urgent', 'soon', 'normal'] as const;

export const EXECUTION_TONE: Record<ExecutionStatus, Tone> = { not_started: 'neutral', start_planned: 'info', in_post: 'ok', ended: 'neutral' };

/** Validation managériale (A3c) : l'attente et l'escalade sont des états qui demandent une action ; le refus est un statut. */
export const VALIDATION_TONE: Record<ValidationState, Tone> = { to_validate: 'attention', validated: 'ok', refused: 'risk', escalated: 'attention' };
