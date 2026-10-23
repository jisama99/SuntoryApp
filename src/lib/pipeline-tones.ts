import type { Tone } from '@/components/StatusTag';
import type { DecisionOutcome, FunnelState, PositionStatus, ProposalStatus, Urgency } from '@/domain/types';

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
