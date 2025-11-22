/**
 * Dashboard Overview Page (/dashboard)
 * /src/app/dashboard/page.tsx
 */

import { supabaseServer } from '@/lib/supabase/server';
import LoginForm from './_parts/LoginForm';
import {
  FiCalendar,
  FiUsers,
  FiEye,
  FiPackage,
  FiCheckCircle,
  FiSettings,
  FiAlertTriangle,
} from 'react-icons/fi';

type KpiTone = 'up' | 'down' | 'flat';

type AgendaRow = {
  id: string;
  slot_date: string;
  time_label: string;
  title: string;
  kind: string | null;
};

export default async function DashboardHome() {
  // Auth check
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -------------------------
  // LOGIN VIEW
  // -------------------------
  if (!user) {
    return (
      <div className="min-h-[70vh] w-full grid place-items-center">
        <div
          className="
            w-full max-w-md rounded-2xl p-6 shadow-lg border
            bg-white border-black/10 text-neutral-900
            dark:bg-neutral-900 dark:border-white/10 dark:text-white
          "
        >
          <h1 className="text-center text-2xl mb-4">Login</h1>
          <LoginForm />
        </div>
      </div>
    );
  }

  // -------------------------
  // SIGNED IN → OVERVIEW DASHBOARD
  // -------------------------

  // Real data: counts from Supabase
  const [{ count: activeDesignsCount }, { count: mediaAssetsCount }] =
    await Promise.all([
      supabase
        .from('print_designs')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase
        .from('media_assets')
        .select('id', { count: 'exact', head: true }),
    ]);

  const activeDesigns = activeDesignsCount ?? 0;
  const mediaItems = mediaAssetsCount ?? 0;

  // TODAY'S AGENDA (mirrors calendar_agenda_slots)
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: agendaRowsRaw, error: agendaError } = await supabase
    .from('calendar_agenda_slots')
    .select('id, slot_date, time_label, title, kind')
    .eq('user_id', user.id)
    .eq('slot_date', todayKey)
    .order('time_label', { ascending: true });

  if (agendaError) {
    console.error('Error loading today agenda', agendaError);
  }

  const agendaRows = (agendaRowsRaw ?? []) as AgendaRow[];

  const todayAgenda = agendaRows.map((row) => ({
    time: row.time_label,
    label: row.title,
    type: row.kind ?? '',
  }));

  // KPIs (2 real, 2 placeholders until we wire analytics/socials)
  const kpis: { label: string; value: string; delta: string; tone: KpiTone }[] =
    [
      {
        label: 'Active Designs',
        value: String(activeDesigns),
        delta: activeDesigns ? 'Live in catalog' : 'Add your first design',
        tone: activeDesigns ? 'up' : 'flat',
      },
      {
        label: 'Media Library Items',
        value: String(mediaItems),
        delta: mediaItems ? 'Images & videos stored' : 'Upload some media',
        tone: mediaItems ? 'up' : 'flat',
      },
      {
        label: 'Site Sessions',
        value: '—',
        delta: 'Connect analytics',
        tone: 'flat',
      },
      {
        label: 'Social Reach',
        value: '—',
        delta: 'Connect socials',
        tone: 'flat',
      },
    ];

  const pipeline = [
    {
      stage: 'Leads',
      count: 3,
      items: ['FB DM – key holder', 'Instagram – name sign', 'Email – hinge'],
    },
    {
      stage: 'Quoted',
      count: 2,
      items: ['Cosplay chest plate', 'RC chassis'],
    },
    {
      stage: 'In Progress',
      count: 4,
      items: ['Dungeon tiles', 'Miniatures batch', 'Desk organizer'],
    },
    {
      stage: 'Pickup',
      count: 1,
      items: ['Order #RD-1043'],
    },
    {
      stage: 'Completed',
      count: 9,
      items: ['Past 30 days'],
    },
    {
      stage: 'On Hold',
      count: 0,
      items: ['Awaiting feedback'],
    },
  ];

  const topDesigns = [
    { title: 'Modular Dice Tower', views: 132, orders: 7, tag: 'Tabletop' },
    { title: 'Cable Management Clips', views: 98, orders: 12, tag: 'Desk / Office' },
    { title: 'Hex Terrain Tiles', views: 76, orders: 5, tag: 'Wargaming' },
  ];

  const topBundles = [
    { title: 'Desk Starter Kit', views: 64, orders: 6, tag: 'Bundle' },
    { title: 'Dungeon Pack Vol. 1', views: 54, orders: 4, tag: 'Bundle' },
    { title: 'Workshop Wall-Mount Kit', views: 41, orders: 3, tag: 'Bundle' },
  ];

  return (
    <section className="max-w-6xl mx-auto space-y-8 pb-24 pt-4">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-semibold mb-2">Overview</h1>
        <p className="opacity-70 max-w-[60ch] text-sm">
          A snapshot of traffic, jobs, sales, and site health.
        </p>
      </header>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
          >
            <div className="text-xs uppercase opacity-70">{kpi.label}</div>
            <div className="text-2xl font-semibold mt-1">{kpi.value}</div>
            <div
              className={`text-xs mt-1 ${
                kpi.tone === 'up'
                  ? 'text-emerald-300'
                  : kpi.tone === 'down'
                  ? 'text-rose-300'
                  : 'text-slate-300'
              }`}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* AGENDA + NOTES + PIPELINE */}
      {/* On large screens: slightly wider outer columns, narrower middle column */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.8fr_1.35fr] gap-5">
        {/* Agenda – wider */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#432389]/30 flex items-center justify-center">
              <FiCalendar />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Today&apos;s Agenda</h2>
              <p className="text-[0.75rem] opacity-60">
                Quick tasks &amp; print queue.
              </p>
            </div>
          </div>

          <ul className="mt-2 space-y-2 text-sm">
            {todayAgenda.length === 0 ? (
              <li className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs opacity-70">
                No items scheduled for today yet. Add slots from the Calendar
                page.
              </li>
            ) : (
              todayAgenda.map((item) => (
                <li
                  key={`${item.time}-${item.label}`}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
                >
                  <span className="opacity-70 text-[0.75rem] mt-[2px] w-16 flex-shrink-0">
                    {item.time}
                  </span>
                  <div>
                    <div>{item.label}</div>
                    {item.type && (
                      <div className="text-[0.65rem] opacity-50 uppercase tracking-wide">
                        {item.type}
                      </div>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Notes placeholder – narrower middle column */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-500/25 flex items-center justify-center">
              <FiSettings />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Notes</h2>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center text-center text-sm opacity-70 border border-dashed border-white/15 rounded-lg px-4 py-6 bg-black/10">
            Notes coming soon.
          </div>
        </div>

        {/* Pipeline – 6 cards, 3×2 layout, all same size */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <FiUsers />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Job Pipeline</h2>
              <p className="text-[0.75rem] opacity-60">
                Lead → Completed flow overview.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[0.75rem]">
            {pipeline.map((stage) => (
              <div
                key={stage.stage}
                className="rounded-lg border border-white/8 bg-black/25 px-3 py-3 min-h-[96px] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{stage.stage}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem]">
                    {stage.count}
                  </span>
                </div>
                <ul className="opacity-70 mt-1 space-y-0.5">
                  {stage.items.slice(0, 2).map((i) => (
                    <li key={i} className="truncate">
                      • {i}
                    </li>
                  ))}
                  {stage.items.length > 2 && (
                    <li className="italic text-[0.7rem]">
                      + {stage.items.length - 2} more…
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP DESIGNS + BUNDLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Designs */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-sky-500/25 flex items-center justify-center">
              <FiEye />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Top Viewed Designs</h2>
              <p className="text-[0.75rem] opacity-60">Most popular items.</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {topDesigns.map((d) => (
              <div
                key={d.title}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.title}</div>
                  <div className="text-[0.75rem] opacity-60">{d.tag}</div>
                </div>
                <div className="text-right text-[0.75rem] opacity-70">
                  👁 {d.views} <br />
                  🛒 {d.orders}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bundles */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/25 flex items-center justify-center">
              <FiPackage />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Best-Selling Bundles</h2>
              <p className="text-[0.75rem] opacity-60">Your top-performing sets.</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {topBundles.map((b) => (
              <div
                key={b.title}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{b.title}</div>
                  <div className="text-[0.75rem] opacity-60">{b.tag}</div>
                </div>
                <div className="text-right text-[0.75rem] opacity-70">
                  👁 {b.views} <br />
                  🛒 {b.orders}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SITE HEALTH */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Site Status */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/25 flex items-center justify-center">
              <FiCheckCircle />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Site Status</h2>
              <p className="text-[0.75rem] opacity-60">Basic health indicators.</p>
            </div>
          </div>

          <ul className="text-[0.85rem] space-y-1 opacity-80">
            <li>• Online &amp; responding</li>
            <li>• Orders: accepting new jobs</li>
            <li>• Turnaround target: 3–5 days</li>
          </ul>
        </div>

        {/* Branding Summary */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#432389]/35 flex items-center justify-center">
              <FiSettings />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Brand &amp; Hero</h2>
              <p className="text-[0.75rem] opacity-60">Theme details.</p>
            </div>
          </div>

          <ul className="text-[0.85rem] space-y-1 opacity-80">
            <li>• Theme: Rad Dad Dark</li>
            <li>• Hero: Timelapse video</li>
            <li>• Tagline: “Rapid, reliable 3D printing…”</li>
          </ul>
        </div>

        {/* Storage */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/25 flex items-center justify-center">
              <FiAlertTriangle />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Storage &amp; Notices</h2>
              <p className="text-[0.75rem] opacity-60">Tips &amp; limits.</p>
            </div>
          </div>

          <div className="space-y-3 text-[0.85rem] opacity-80">
            <div>
              <div className="flex justify-between">
                <span>Media Storage</span>
                <span>62%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-teal-400 w-[62%]" />
              </div>
            </div>

            <ul className="space-y-1 text-[0.75rem] opacity-60">
              <li>• Consider archiving old timelapses.</li>
              <li>• Add more featured designs to homepage.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}