import type { ReactNode } from 'react';

// Le document HTML (lang, body) est rendu par src/app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
