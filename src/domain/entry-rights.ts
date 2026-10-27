import type { ProfileId, ValidationLevel } from './types';

/**
 * Droits de saisie des besoins (lot A3d, règle par défaut validée le 27/10/2026, D234). Module pur : la couche de données applique
 * ces droits, l'écran les reflète sans les décider.
 * - Le RS, le CVR, le DR et la direction cliente saisissent sur leur périmètre (le contrôle du secteur reste celui du périmètre).
 * - L'agence saisit pour le compte d'un RS : option conservée, tracée, réservée à l'agence.
 * - Le prestataire consulte seulement.
 */
export interface EntryRight {
  enters: boolean;
  /** Saisie « pour le compte d'un RS » : l'agence seule. Aucun autre profil ne saisit pour le compte d'un autre. */
  onBehalf: boolean;
  /** Niveau de l'avis managérial réputé donné à la saisie ; nul pour un RS ou l'agence (avis facultatif « à valider »). */
  opinionAtEntry: Extract<ValidationLevel, 'cvr' | 'dr'> | null;
}

export const ENTRY_RIGHTS: Record<ProfileId, EntryRight> = {
  rs: { enters: true, onBehalf: false, opinionAtEntry: null },
  cvr_client: { enters: true, onBehalf: false, opinionAtEntry: 'cvr' },
  dr_client: { enters: true, onBehalf: false, opinionAtEntry: 'dr' },
  direction_client: { enters: true, onBehalf: false, opinionAtEntry: 'dr' },
  agency_operator: { enters: true, onBehalf: true, opinionAtEntry: null },
  agency_admin: { enters: true, onBehalf: true, opinionAtEntry: null },
  provider_admin: { enters: false, onBehalf: false, opinionAtEntry: null },
};

export const canEnterNeeds = (profile: ProfileId): boolean => ENTRY_RIGHTS[profile].enters;
export const isOnBehalf = (profile: ProfileId): boolean => ENTRY_RIGHTS[profile].onBehalf;
export const opinionAtEntry = (profile: ProfileId): EntryRight['opinionAtEntry'] => ENTRY_RIGHTS[profile].opinionAtEntry;
