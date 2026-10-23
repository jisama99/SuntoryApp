import { routing } from '@/i18n/routing';

/**
 * Retour à la page demandée après connexion (D183). Seuls les chemins internes de l'application sont acceptés : un
 * chemin qui commence par une langue connue, sans double barre, sans barre inverse, sans schéma, sans remontée de
 * dossier et sans caractère de contrôle. Tout autre cas donne null, donc l'accueil.
 */
export function safeReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (/[\u0000-\u001f\u007f\\]/.test(decoded) || /[\u0000-\u001f\u007f\\]/.test(value)) return null;
  if (!value.startsWith('/') || value.startsWith('//') || decoded.startsWith('//')) return null;
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(value) || value.includes('://') || decoded.includes('://')) return null;
  const path = value.split(/[?#]/)[0] ?? '';
  const decodedPath = decoded.split(/[?#]/)[0] ?? '';
  if (path.split('/').some((s) => s === '..' || s === '.') || decodedPath.split('/').some((s) => s === '..' || s === '.')) return null;
  const [, first] = path.split('/');
  if (!routing.locales.includes(first as (typeof routing.locales)[number])) return null;
  // Les pages d'entrée ne sont pas des destinations : on évite la boucle.
  if (/^\/[a-z]{2}\/(start|change-password)(\/|$)/.test(path)) return null;
  return value;
}
