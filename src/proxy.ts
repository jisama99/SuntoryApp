import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// Next 16 : le fichier « middleware » est renommé « proxy ». Il ne fait que le routage par langue.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
