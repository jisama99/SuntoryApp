import type { DeadlineSettings, Reopening } from '@/data/schemas';
import type { ParamsMap } from './deadlines';
import type { Dispositif, ProfileId } from './types';

/**
 * Contexte propre au lot A2b pour le moteur de règles d'A2a : calendrier d'échéances, paramètres par dispositif,
 * réouvertures, rôle de l'acteur. Absent, le moteur se comporte exactement comme en A2a (aucun constat P ni E).
 */
export interface A2bEnv {
  actor: ProfileId;
  /** `entry` : nouveau besoin ou compléter un brouillon. `change` : modification d'un besoin soumis (fusion). */
  writeKind: 'entry' | 'change';
  settings: DeadlineSettings;
  params: ParamsMap;
  /** Réouvertures déjà restreintes au secteur du besoin. */
  reopenings: readonly Reopening[];
  /** Dispositifs rattachés à chaque campagne (P2 : une seule valeur attendue). */
  campaignDispositifs: Readonly<Record<string, readonly Dispositif[]>>;
  /** Mois cible imposé (fusion : mois du besoin modifié). Sinon : mois du premier jour de la première période. */
  targetMonth?: string;
  /** Mois d'origine d'une demande reportée : les règles d'échéance se jugent alors sur le mois suivant. */
  deferredFrom?: string;
}
