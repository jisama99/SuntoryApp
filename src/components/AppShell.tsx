'use client';

import { usePathname } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SIDEBAR_COOKIE } from '@/lib/sidebar-cookie';
import { Icon } from './Icon';
import { UI_ICONS } from './icons';
import { NavLinks } from './NavLinks';
import type { NavItem } from './NavLinks';

export interface AppShellLabels {
  brand: string;
  nav: string;
  open: string;
  close: string;
  collapse: string;
  expand: string;
}

/**
 * Gabarit de l'application. Bureau : menu latéral collant sur toute la hauteur de l'écran, repliable en rail d'icônes
 * (préférence mémorisée dans un cookie, lue côté serveur). Mobile : barre fixe en haut et tiroir de menu qui se ferme
 * au choix d'une entrée, à Échap ou au changement de page. Le contenu garde toute la largeur disponible.
 */
export function AppShell({ items, labels, collapsedInitial, toolbar, children }: {
  items: NavItem[];
  labels: AppShellLabels;
  collapsedInitial: boolean;
  toolbar: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(collapsedInitial);
  // Le tiroir est ouvert pour une page précise : un changement de page le referme sans effet de bord.
  const pathname = usePathname();
  const [drawerAt, setDrawerAt] = useState<string | null>(null);
  const drawer = drawerAt === pathname;
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerAt(null);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const setSidebar = (next: boolean) => {
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? 'collapsed' : 'open'}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div
      data-collapsed={collapsed}
      className={`min-h-[calc(100vh-40px)] lg:grid ${collapsed ? 'lg:grid-cols-[88px_1fr]' : 'lg:grid-cols-[252px_1fr]'} motion-safe:transition-[grid-template-columns]`}
    >
      <aside id="app-sidebar" className="hidden bg-surface p-4 print:hidden lg:sticky lg:top-0 lg:block lg:h-screen lg:self-start lg:overflow-y-auto">
        <div className={`mb-4 flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {collapsed ? null : <p className="px-3 text-lg font-extrabold tracking-tight text-title">{labels.brand}</p>}
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
        <div id="app-sidebar-nav">
          <NavLinks items={items} label={labels.nav} collapsed={collapsed} />
        </div>
      </aside>
      <div className="min-w-0">
        <div className="sticky top-0 z-40 bg-surface print:hidden lg:hidden">
          <div className="flex min-h-14 items-center gap-2 px-2">
            <button
              ref={toggle}
              type="button"
              aria-expanded={drawer}
              aria-controls="mobile-nav"
              onClick={() => setDrawerAt(drawer ? null : pathname)}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 font-semibold hover:bg-alt"
            >
              <Icon icon={drawer ? UI_ICONS.close : UI_ICONS.menu} size="md" />
              {drawer ? labels.close : labels.open}
            </button>
            <p className="ml-auto min-w-0 truncate px-2 text-sm font-extrabold tracking-tight text-title">{labels.brand}</p>
          </div>
          {drawer ? (
            <div id="mobile-nav" className="absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto bg-surface p-3 shadow-card">
              <NavLinks items={items} label={labels.nav} onNavigate={() => setDrawerAt(null)} />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 px-4 pt-4 print:hidden lg:px-8">{toolbar}</div>
        <main id="main" tabIndex={-1} className="px-4 py-6 print:px-0 print:pt-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
