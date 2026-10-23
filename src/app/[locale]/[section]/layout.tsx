import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import { MENU_KEYS } from '@/domain/types';
import type { Locale, MenuKey } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Une entrée absente du menu du profil donne une page 404 avant tout affichage progressif (D118, règle commune 14). */
export default async function SectionLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string; section: string }> }) {
  const { locale, section } = await params;
  setRequestLocale(locale);
  const menu = await repository.getMenu(await getAccessContext(locale as Locale));
  if (section === 'home' || !(MENU_KEYS as readonly string[]).includes(section) || !menu.some((e) => e.key === (section as MenuKey))) notFound();
  return children;
}
