import { cookies } from 'next/headers';

export const THEME_COOKIE = 'demo_theme';
export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export function parseTheme(raw: string | undefined): Theme {
  return (THEMES as readonly string[]).includes(raw ?? '') ? (raw as Theme) : 'system';
}

export async function getTheme(): Promise<Theme> {
  const jar = await cookies();
  return parseTheme(jar.get(THEME_COOKIE)?.value);
}
