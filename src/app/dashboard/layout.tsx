/**
 * /src/app/dashboard/layout.tsx
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabase/server';
import {
  FiHome,
  FiPrinter,
  FiPackage,
  FiImage,
  FiUsers,
  FiSettings,
  FiCalendar,
  FiEdit3,
} from 'react-icons/fi';
import ThemeToggle from '../components/ThemeToggle';
import UtilityDock from './UtilityDock';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      {/* dashboard-only scroll overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overflow: hidden !important;
              scrollbar-gutter: auto !important;
            }
          `,
        }}
      />

      <div
        className="
          flex
          min-h-screen
          max-h-screen
          overflow-hidden
          transition-colors duration-300
        "
        style={{
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-foreground)',
        }}
      >
        {/* SIDEBAR */}
        <aside
          className="
            w-[64px] shrink-0
            flex flex-col items-center py-4 gap-3
            border-r border-white/10
            bg-neutral-900 text-white
          "
          style={{
            backgroundColor: '#111',
            color: '#fff',
            borderRightColor: 'rgba(255,255,255,0.1)',
          }}
        >
          {/* Overview */}
          <Link
            href="/dashboard"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Overview"
          >
            <FiHome className="text-2xl" />
          </Link>

          {/* Calendar */}
          <Link
            href="/dashboard/calendar"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Calendar"
          >
            <FiCalendar className="text-2xl" />
          </Link>

          {/* CRM */}
          <Link
            href="/dashboard/crm"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="CRM"
          >
            <FiUsers className="text-2xl" />
          </Link>

          {/* NOTES tab (manager) */}
          <Link
            href="/dashboard/notes"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Notes Manager"
          >
            <FiEdit3 className="text-2xl" />
          </Link>

          {/* Media */}
          <Link
            href="/dashboard/media"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Media Library"
          >
            <FiImage className="text-2xl" />
          </Link>

          {/* Designs */}
          <Link
            href="/dashboard/designs"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Print Designs"
          >
            <FiPrinter className="text-2xl" />
          </Link>

          {/* Bundles */}
          <Link
            href="/dashboard/bundles"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Bundles & Packages"
          >
            <FiPackage className="text-2xl" />
          </Link>

          {/* Site Settings */}
          <Link
            href="/dashboard/settings"
            className="w-12 h-12 grid place-items-center rounded-xl hover:bg-white/5 text-white"
            title="Site Settings"
          >
            <FiSettings className="text-2xl" />
          </Link>

          <div className="mt-auto" />
        </aside>

        {/* RIGHT PANE */}
        <div
          className="
            flex flex-col flex-1 min-w-0
            bg-[var(--color-background)]
            text-[var(--color-foreground)]
            transition-colors duration-300
          "
        >
          {/* HEADER */}
          <header
            className="
              h-14 shrink-0
              flex items-center justify-between
              gap-2 sm:gap-3
              px-3 sm:px-4
              border-b
              backdrop-blur
              transition-colors duration-300
            "
            style={{
              backgroundColor:
                'color-mix(in oklch, var(--color-background) 92%, var(--color-foreground) 8%)',
              color: 'var(--color-foreground)',
              borderBottom:
                '1px solid color-mix(in oklch, var(--color-foreground) 12%, transparent)',
            }}
          >
            {/* LEFT: utility buttons + logo */}
            <div className="flex items-center gap-4">
              <UtilityDock />

              <Link href="/dashboard" className="flex items-center">
                <Image
                  src="/assets/rad-dad-prints02.png"
                  alt="Rad Dad Prints"
                  width={220}
                  height={48}
                  className="h-15 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* RIGHT: user + theme + logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  <span className="hidden sm:block text-sm opacity-70 whitespace-nowrap">
                    {user.email}
                  </span>

                  <ThemeToggle />

                  <form action="/api/auth/logout" method="post">
                    <button
                      className="
                        rounded-xl px-4 py-2 text-sm
                        transition-colors duration-200
                      "
                      style={{
                        border:
                          '1px solid color-mix(in oklch, var(--color-foreground) 20%, transparent)',
                        backgroundColor:
                          'color-mix(in oklch, var(--color-background) 90%, var(--color-foreground) 10%)',
                      }}
                    >
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <ThemeToggle />
                  <span className="text-sm opacity-70">Not signed in</span>
                </>
              )}
            </div>
          </header>

          {/* SCROLL AREA */}
          <main
            className="
              flex-1
              min-h-0
              overflow-y-auto
              p-4 md:p-8
            "
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}