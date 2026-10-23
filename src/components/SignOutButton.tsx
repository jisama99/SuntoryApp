import { getTranslations } from 'next-intl/server';
import { signOut } from '@/app/actions';
import { Button } from './Button';

/** Déconnexion (D188) : supprime la session et revient à la connexion. */
export async function SignOutButton({ locale }: { locale: string }) {
  const t = await getTranslations('auth');
  return (
    <form action={signOut}>
      <input type="hidden" name="locale" value={locale} />
      <Button type="submit" variant="ghost">{t('signOut')}</Button>
    </form>
  );
}
