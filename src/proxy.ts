import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intl = createMiddleware(routing);

/** Pages ouvertes sans session : la connexion et le changement du mot de passe temporaire. */
const OPEN = /^\/(fr|en)\/(start|change-password)\/?$/;

/**
 * Next 16 : le fichier « middleware » est renommé « proxy ». Routage par langue ; sans cookie de session, toute page de
 * l'application renvoie à la connexion en gardant l'adresse demandée (D183). La validité de la session est vérifiée côté
 * serveur par chaque page : ici on ne regarde que la présence du cookie.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const localized = /^\/(fr|en)(\/|$)/.exec(pathname);
  if (localized && !OPEN.test(pathname) && !request.cookies.get('demo_session')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${localized[1]}/start`;
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }
  return intl(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
