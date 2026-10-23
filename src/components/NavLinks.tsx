'use client';

import { Link, usePathname } from '@/i18n/navigation';
import type { MenuKey } from '@/domain/types';
import { Icon } from './Icon';
import { MENU_ICONS } from './icons';

export interface NavItem {
  key: MenuKey;
  href: string;
  label: string;
}

/** Menu latéral : pastille d'icône de taille fixe, entrée active en teinte douce avec pastille pleine. */
export function NavLinks({ items, label, collapsed = false, onNavigate }: {
  items: NavItem[];
  label: string;
  /** Rail d'icônes : les libellés restent lus par les lecteurs d'écran et en info-bulle. */
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                onClick={onNavigate}
                className={`group flex min-h-12 items-center gap-3 rounded-ctl px-2 text-ink transition-colors hover:bg-alt ${
                  collapsed ? 'justify-center' : ''
                } ${active ? 'bg-sel font-semibold' : 'font-medium'}`}
              >
                <span
                  data-nav-tile
                  className={`grid size-9 shrink-0 place-items-center rounded-ctl transition-colors ${
                    active ? 'bg-primary text-on-fill' : 'bg-alt text-muted group-hover:bg-surface group-hover:text-ink'
                  }`}
                >
                  <Icon icon={MENU_ICONS[item.key]} size="md" />
                </span>
                <span className={collapsed ? 'sr-only' : ''}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
