'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { setHomeSkinDefaultAction } from '@/app/[locale]/(app)/settings/actions';
import { HOME_SKINS } from '@/domain/types';
import type { HomeSkin, Locale } from '@/domain/types';
import { useConfirmation } from './Confirmation';

/** Défaut du skin d'accueil, fixé par l'agence (D161). Confirmation annulable comme toute écriture (règle 16). */
export function HomeSkinDefault({ current }: { current: HomeSkin }) {
  const t = useTranslations('skin');
  const tc = useTranslations('confirmation');
  const locale = useLocale() as Locale;
  const announce = useConfirmation();
  const [pending, startTransition] = useTransition();
  const choose = (skin: HomeSkin) =>
    startTransition(async () => {
      const r = await setHomeSkinDefaultAction({ locale, skin });
      if (r.status === 'ok' && skin !== current) announce(tc('saved'), { undoToken: r.undoToken });
    });
  return (
    <section aria-labelledby="skin-default-title" data-testid="skin-default" className="mb-8 flex flex-col gap-3">
      <h2 id="skin-default-title" className="text-lg font-semibold">{t('label')}</h2>
      <div role="group" aria-labelledby="skin-default-title" className="inline-flex w-fit flex-wrap gap-2">
        {HOME_SKINS.map((skin) => (
          <button
            key={skin}
            type="button"
            disabled={pending}
            aria-pressed={skin === current}
            onClick={() => choose(skin)}
            className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors ${skin === current ? 'bg-primary text-on-fill' : 'bg-alt text-ink hover:bg-sel'}`}
          >
            {t(skin)}
          </button>
        ))}
      </div>
    </section>
  );
}
