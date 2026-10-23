import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Un besoin hors du périmètre du profil ou inexistant donne une page 404, sans fuite d'information. */
export default async function NeedLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!(await repository.getNeed(await getAccessContext(locale as Locale), id))) notFound();
  return children;
}
