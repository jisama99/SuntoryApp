import { useTranslations } from 'next-intl';

export function DemoBanner() {
  const t = useTranslations('banner');
  return (
    <div role="note" className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-navy px-4 py-2 text-sm text-white">
      <strong className="rounded-full bg-pink-pale px-3 py-0.5 text-xs font-bold tracking-wide text-navy">
        {t('demo')}
      </strong>
      <span>{t('note')}</span>
    </div>
  );
}
