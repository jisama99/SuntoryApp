import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { repository } from '@/data';
import type { Locale } from '@/domain/types';
import { getAccessContext } from '@/lib/session';

/** Gestion des comptes (D189) : contrôle au-dessus de l'état de chargement pour que l'accès refusé réponde 404. */
export default async function AccountsLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (!repository.canManageAccounts(await getAccessContext(locale as Locale))) notFound();
  return children;
}
