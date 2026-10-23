import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AlertList } from '@/components/AlertList';
import { HeroHeader } from '@/components/HeroHeader';
import { StatusTag } from '@/components/StatusTag';
import { Tile } from '@/components/Tile';
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
  const [zones, alerts, clock, menu, homeSkin] = await Promise.all([
    repository.getScopeZones(ctx),
    repository.getAlerts(ctx),
    repository.getClock(ctx),
    repository.getMenu(ctx),
    repository.getHomeSkin(ctx),
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
  const hasRisk = alerts.some((a) => a.severity === 'risk');

  return (
    <>
      <HeroHeader
        visual={homeSkin.skin === 'plain' ? null : homeSkin.skin}
        priority
        title={greeting}
        subtitle={`${t(`role.${ctx.profileId}`)} · ${dateLine}`}
      />
      <div className="mb-10 grid gap-6 sm:grid-cols-3">
        <Tile tone="aqua" label={t('home.tiles.zones')} value={String(zones.length)} />
        <Tile tone="sand" attention={hasRisk} label={t('home.tiles.alerts')} value={String(alerts.length)}>
          {hasRisk ? <StatusTag tone="important">{t('home.tiles.toHandle')}</StatusTag> : null}
        </Tile>
        <Tile tone="lav" label={t('home.tiles.week')} value={formatIsoWeek(clock.iso_week, ctx.locale).split('-')[1] ?? clock.iso_week}>
          {clock.iso_week.split('-')[0]}
        </Tile>
      </div>
      <div className="grid gap-10 xl:grid-cols-2">
        <section aria-labelledby="scope-title" className="flex flex-col gap-3">
          <h2 id="scope-title" className="text-lg font-semibold">{t('home.scope.title')}</h2>
          {ctx.scope.kind === 'all' ? <p className="text-muted">{t('home.scope.all')}</p> : null}
          {shownZones.length === 0 ? (
            <EmptyState title={t('states.empty.title')} body={t('home.scope.empty')} />
          ) : (
            <ul className="flex flex-col gap-2 rounded-card bg-surface p-4 shadow-card">
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
            <Link href="/alerts" className="inline-flex min-h-11 w-fit items-center rounded-full bg-tint-aqua px-5 font-semibold text-link transition-colors hover:bg-sel">
              {t('home.alerts.all')}
            </Link>
          ) : null}
        </section>
      </div>
    </>
  );
}
