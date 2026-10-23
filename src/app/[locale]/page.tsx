import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertList } from '@/components/AlertList';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/States';
import { ZoneLabel } from '@/components/ZoneLabel';
import { repository } from '@/data';
import { formatDate, formatIsoWeek } from '@/lib/format';
import { Link } from '@/i18n/navigation';
import { getAccessContext } from '@/lib/session';
import type { Locale } from '@/domain/types';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await getAccessContext(locale as Locale);
  const t = await getTranslations();
  const [zones, alerts, clock, menu] = await Promise.all([
    repository.getScopeZones(ctx),
    repository.getAlerts(ctx),
    repository.getClock(ctx),
    repository.getMenu(ctx),
  ]);

  const greeting = ctx.firstName ? t('greeting.named', { name: ctx.firstName }) : t('greeting.anonymous');
  const dateLine = t('home.date', {
    date: formatDate(clock.date, ctx.locale),
    week: formatIsoWeek(clock.iso_week, ctx.locale),
  });
  // Périmètre complet : niveau DR seulement. Sinon : la chaîne DR > CVR > RS du périmètre (ancêtres inclus).
  const shownZones = ctx.scope.kind === 'all' ? zones.filter((z) => z.kind === 'dr') : zones;
  const indent = { dr: 'pl-0', cvr: 'pl-6', rs: 'pl-12' } as const;
  const recent = alerts.slice(0, 3);
  const showAudience = ctx.side !== 'client';

  return (
    <>
      <PageHeader title={greeting} subtitle={`${t(`role.${ctx.profileId}`)} · ${dateLine}`} />
      <div className="grid gap-8 xl:grid-cols-2">
        <section aria-labelledby="scope-title" className="flex flex-col gap-3">
          <h2 id="scope-title" className="text-lg font-semibold">{t('home.scope.title')}</h2>
          {ctx.scope.kind === 'all' ? <p className="text-muted">{t('home.scope.all')}</p> : null}
          {shownZones.length === 0 ? (
            <EmptyState title={t('states.empty.title')} body={t('home.scope.empty')} />
          ) : (
            <ul className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-card">
              {shownZones.map((z) => (
                <li key={z.id} className={indent[z.kind]}>
                  <ZoneLabel zone={z} />
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="alerts-title" className="flex flex-col gap-3">
          <h2 id="alerts-title" className="text-lg font-semibold">{t('home.alerts.title')}</h2>
          {recent.length === 0 ? (
            <EmptyState title={t('states.empty.title')} body={t('home.alerts.empty')} />
          ) : (
            <AlertList alerts={recent} zones={zones} showAudience={showAudience} />
          )}
          {menu.some((e) => e.key === 'alerts') ? (
            <Link href="/alerts" className="font-semibold text-link underline underline-offset-4">
              {t('home.alerts.all')}
            </Link>
          ) : null}
        </section>
      </div>
    </>
  );
}
