'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div
      className="
        inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm
        border border-black/10 bg-white/70 text-black
        dark:border-white/10 dark:bg-neutral-900/70 dark:text-white
      "
    >
      <FaSun size={13} className="opacity-70" />
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="
          relative w-10 h-5 rounded-full transition-colors
          bg-black/10 dark:bg-white/10
          focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50
        "
      >
        <span
          className={`
            absolute top-[2px] left-[2px] h-4 w-4 rounded-full transition-transform
            bg-black dark:bg-white shadow
            ${isDark ? 'translate-x-5' : ''}
          `}
        />
      </button>
      <FaMoon size={13} className="opacity-70" />
    </div>
  );
}