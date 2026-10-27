'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { MenuKey } from '@/domain/types';
import { SIDEBAR_COOKIE } from '@/lib/sidebar-cookie';
import { BrandLogo, BrandMark } from './BrandLogo';
import { Icon } from './Icon';
import { MENU_ICONS, UI_ICONS } from './icons';
import { NavLinks } from './NavLinks';
import type { NavItem } from './NavLinks';

export interface AppShellLabels {
  brand: string;
  nav: string;
  mobile: string;
  more: string;
  moreTitle: string;
  create: string;
  collapse: string;
  expand: string;
}

/** Entrées toujours visibles dans la barre mobile, dans cet ordre ; les autres passent par « Plus ». */
const MOBILE_PRIMARY: readonly MenuKey[] = ['home', 'needs', 'alerts'];

/**
 * Gabarit de l'application. Bureau : menu latéral collant sur toute la hauteur de l'écran, repliable en rail d'icônes
 * (préférence mémorisée dans un cookie, lue côté serveur). Mobile : barre d'onglets fixe en bas, colonnes de largeur
 * égale, bouton « + » central (saisie complète d'un besoin, réservé aux profils qui peuvent saisir) et volet « Plus »
 * pour les autres sections. Le volet se ferme au choix d'une entrée, à Échap ou au changement de page.
 */
export function AppShell({ items, labels, collapsedInitial, canCreate, toolbar, children }: {
  items: NavItem[];
  labels: AppShellLabels;
  collapsedInitial: boolean;
  canCreate: boolean;
  toolbar: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(collapsedInitial);
  // Le volet est ouvert pour une page précise : un changement de page le referme sans effet de bord.
  const pathname = usePathname();
  const [sheetAt, setSheetAt] = useState<string | null>(null);
  const sheet = sheetAt === pathname;
  const moreButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetAt(null);
        moreButton.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheet]);

  const setSidebar = (next: boolean) => {
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000; samesite=lax`;
  };

  const primary = MOBILE_PRIMARY.map((k) => items.find((i) => i.key === k)).filter((i): i is NavItem => Boolean(i));
  const rest = items.filter((i) => !primary.includes(i));
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
  const tab = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-ctl px-1 text-xs ${active ? 'font-semibold text-link' : 'font-medium text-muted'}`}
      >
        <span className={`grid h-7 w-12 place-items-center rounded-full ${active ? 'bg-sel' : ''}`}>
          <Icon icon={MENU_ICONS[item.key]} size="md" />
        </span>
        <span className="line-clamp-2 max-w-full text-center leading-tight">{item.label}</span>
      </Link>
    );
  };
  // Bouton « + » au centre de la barre : les onglets se répartissent de part et d'autre, à largeur égale.
  const left = canCreate ? primary.slice(0, Math.ceil(primary.length / 2)) : primary;
  const right = canCreate ? primary.slice(Math.ceil(primary.length / 2)) : [];

  return (
    <div
      data-collapsed={collapsed}
      className={`min-h-screen lg:grid ${collapsed ? 'lg:grid-cols-[var(--sidebar-width-collapsed)_1fr]' : 'lg:grid-cols-[var(--sidebar-width)_1fr]'} motion-safe:transition-[grid-template-columns]`}
    >
      {/* La colonne porte le fond sur toute la hauteur de la page ; le contenu du menu reste collé à l'écran (sticky) pendant le défilement. */}
      <aside className="hidden bg-surface print:hidden lg:block">
      <div id="app-sidebar" className="flex flex-col px-4 pb-6 pt-8 lg:sticky lg:top-0 lg:h-[calc(100dvh-var(--banner-height))] lg:overflow-y-auto">
        <div className={`mb-10 flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? null : (
            <div className="flex flex-col gap-3 px-3">
              <BrandLogo brand="suntory" className="h-8" />
              <p className="text-lg font-extrabold tracking-tight text-title">{labels.brand}</p>
            </div>
          )}
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            aria-label={collapsed ? labels.expand : labels.collapse}
            title={collapsed ? labels.expand : labels.collapse}
            onClick={() => setSidebar(!collapsed)}
            className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-alt hover:text-ink"
          >
            <Icon icon={collapsed ? UI_ICONS.panelOpen : UI_ICONS.panelClose} size="md" />
          </button>
        </div>
        <div id="app-sidebar-nav" className="min-h-0 flex-1">
          {/* Réglages et administration en bas du volet ; les entrées de travail restent en haut. */}
          <NavLinks items={items} label={labels.nav} collapsed={collapsed} pinned={['settings', 'admin']} />
        </div>
      </div>
      </aside>
      <div className="min-w-0">
        <header className="bg-surface print:hidden lg:hidden">
          <div className="flex min-h-16 items-center gap-3 px-5">
            <BrandLogo brand="suntory" className="h-6" />
            <p className="text-base font-extrabold tracking-tight text-title">{labels.brand}</p>
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-end gap-3 px-5 pt-6 print:hidden lg:px-10">{toolbar}</div>
        <main id="main" tabIndex={-1} className="px-5 pb-28 pt-8 print:px-0 print:pt-8 lg:px-10 lg:pb-10">
          {children}
          <footer className="mt-16 flex justify-center print:hidden">
            <BrandMark />
          </footer>
        </main>
      </div>

      <nav aria-label={labels.mobile} className="fixed inset-x-0 bottom-0 z-40 bg-surface pb-[env(safe-area-inset-bottom)] shadow-bar print:hidden lg:hidden">
        {sheet ? (
          <>
            <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => setSheetAt(null)} className="fixed inset-0 -z-10 cursor-default bg-ink/30" />
            <div id="mobile-more" role="dialog" aria-label={labels.moreTitle} className="absolute inset-x-2 bottom-full mb-2 max-h-(--sheet-max-h) overflow-y-auto rounded-card bg-surface p-3 shadow-card">
              <p className="px-2 pb-1 text-sm font-semibold text-muted">{labels.moreTitle}</p>
              <NavLinks items={rest} label={labels.moreTitle} onNavigate={() => setSheetAt(null)} />
            </div>
          </>
        ) : null}
        <div className="mx-auto flex max-w-xl items-end gap-1 px-2 pb-1 pt-1">
          {left.map(tab)}
          {canCreate ? (
            <Link
              href="/needs/new"
              aria-label={labels.create}
              title={labels.create}
              className="mx-1 -mt-5 grid size-14 shrink-0 place-items-center self-start rounded-full bg-primary text-on-fill shadow-card hover:bg-primary-hover"
            >
              <Icon icon={UI_ICONS.plus} size="lg" />
            </Link>
          ) : null}
          {right.map(tab)}
          {rest.length > 0 ? (
            <button
              ref={moreButton}
              type="button"
              aria-expanded={sheet}
              aria-controls="mobile-more"
              onClick={() => setSheetAt(sheet ? null : pathname)}
              className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-ctl px-1 text-xs ${sheet ? 'font-semibold text-link' : 'font-medium text-muted'}`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full ${sheet ? 'bg-sel' : ''}`}>
                <Icon icon={UI_ICONS.more} size="md" />
              </span>
              <span className="max-w-full truncate">{labels.more}</span>
            </button>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
