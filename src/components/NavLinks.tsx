'use client';

import { Link, usePathname } from '@/i18n/navigation';
import type { MenuKey } from '@/domain/types';
import { MENU_ICONS } from './icons';

export interface NavItem {
  key: MenuKey;
  href: string;
  label: string;
}

export function NavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = MENU_ICONS[item.key];
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-11 items-center gap-3 rounded-ctl px-3 text-ink transition-colors hover:bg-alt ${
                  active ? 'bg-sel font-semibold' : 'font-medium'
                }`}
              >
                {active ? <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-pink" /> : null}
                <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
