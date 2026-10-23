import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Paramètres : entrée du menu des profils agence administration et prestataire seulement (D118). */
export default async function SettingsLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const menu = await repository.getMenu(await getAccessContext(locale as Locale));
  if (!menu.some((e) => e.key === 'settings')) notFound();
  return children;
}
