'use client';

import { useEffect } from 'react';

/**
 * Avertit avant de quitter la page tant qu'une saisie n'est pas enregistrée (règle commune 14) : fermeture ou
 * rechargement par le navigateur, clic sur un lien interne. `message` est le texte traduit de l'avertissement.
 */
export function useUnsavedWarning(dirty: boolean, message: string): void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!a || e.defaultPrevented || (e as MouseEvent).button !== 0) return;
      const href = a.getAttribute('href') ?? '';
      if (href.startsWith('#') || a.getAttribute('target') === '_blank') return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [dirty, message]);
}
