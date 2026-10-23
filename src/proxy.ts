import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { SESSION_COOKIE } from './lib/auth';

// Next 16 : le fichier « middleware » est renommé « proxy ». Il gère le routage par langue et la
// redirection vers l'écran de connexion quand la session est absente (D183, D188).

const intlMiddleware = createMiddleware(routing);

/** Routes d'entrée : accessibles sans session. */
const ENTRY_PATH = /^\/[a-z]{2}\/start(\/.*)?$/;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pages avec préfixe de langue qui ne sont pas l'écran d'entrée → vérifier la session.
  const isLocalized = /^\/[a-z]{2}(\/|$)/.test(pathname);
  if (isLocalized && !ENTRY_PATH.test(pathname)) {
    const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookie) {
      const locale = pathname.split('/')[1] ?? 'fr';
      const loginUrl = new URL(`/${locale}/start`, req.url);
      const next = pathname + req.nextUrl.search;
      // Adresse de retour limitée aux chemins internes (D183).
      if (next && next !== `/${locale}` && next !== `/${locale}/`) {
        loginUrl.searchParams.set('next', next);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
