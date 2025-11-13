// src/app/components/ThemeProviderClient.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export default function ThemeProviderClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"    // puts "class=dark" on <html>
      defaultTheme="dark"  // or "light", your call
      enableSystem={false} // we control it manually
    >
      {children}
    </ThemeProvider>
  );
}