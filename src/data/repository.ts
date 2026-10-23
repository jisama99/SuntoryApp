import type { AccessContext } from '@/domain/access';
import type { MenuKey, ProfileId } from '@/domain/types';
import type { Alert, DemoClock, DemoProfile, Zone } from './schemas';

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
}

/**
 * Annuaire des profils de démonstration : simulation de connexion, pas un accès aux données.
 * Disparaît à l'étape B (authentification réelle, D33).
 */
export interface DemoProfileDirectory {
  list(): Promise<DemoProfile[]>;
  get(id: ProfileId): Promise<DemoProfile | null>;
}
