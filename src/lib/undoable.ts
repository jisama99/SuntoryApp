import { repository } from '@/data';
import type { AccessContext } from '@/domain/access';

/**
 * Exécute une écriture annulable (D159). Le résultat porte `undoToken` quand l'écriture a réellement modifié des données :
 * l'écran affiche alors la confirmation avec son bouton d'annulation.
 */
export async function undoable<T extends { status: string }>(
  ctx: AccessContext,
  write: () => Promise<T>,
  changed: (result: T) => boolean = (r) => r.status === 'ok' || r.status === 'saved',
): Promise<T & { undoToken?: string }> {
  const { result, undoToken } = await repository.withUndo(ctx, write, changed);
  return undoToken ? { ...result, undoToken } : result;
}
