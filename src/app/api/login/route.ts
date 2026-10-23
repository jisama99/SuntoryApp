import { NextResponse } from 'next/server';
import { attemptLogin, SESSION_COOKIE, SESSION_MAX_AGE_S, signSession } from '@/lib/auth';

/**
 * Connexion (D188). Le corps est du JSON : un formulaire d'un autre site ne peut pas l'envoyer. Réponse d'échec unique,
 * sans détail ; aucun mot de passe n'est écrit nulle part, ni dans l'adresse.
 */
export async function POST(request: Request) {
  const fail = () => NextResponse.json({ ok: false }, { status: 401 });
  if (!request.headers.get('content-type')?.includes('application/json')) return fail();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail();
  }
  const { username, password } = (body ?? {}) as Record<string, unknown>;
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 64 || password.length > 256) return fail();
  const account = await attemptLogin(username, password);
  if (!account) return fail();
  const response = NextResponse.json({ ok: true, mustChangePassword: account.must_change_password });
  response.cookies.set(SESSION_COOKIE, signSession(account.id), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE_S });
  return response;
}
