import { cookies } from 'next/headers';
import { SIDEBAR_COOKIE } from './sidebar-cookie';

/** Préférence d'affichage du menu latéral (réduit ou déployé), lue côté serveur pour éviter tout saut à l'affichage. */
export async function getSidebarCollapsed(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(SIDEBAR_COOKIE)?.value === 'collapsed';
}
