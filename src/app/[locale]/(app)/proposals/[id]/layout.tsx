import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Un besoin inconnu ou hors périmètre répond 404 avant tout affichage progressif (règle commune 14, D177). */
export default async function NeedThreadLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!(await repository.getNeedThread(await getAccessContext(locale as Locale), id))) notFound();
  return children;
}
