/**
 * Dashboard Overview Page (/dashboard)
 * /src/app/dashboard/page.tsx
 */

import { supabaseServer } from '@/lib/supabase/server';
import LoginForm from './_parts/LoginForm';
import SocialReachSettingsModal from './_parts/SocialReachSettingsModal';
import StickyNotesCard from './_parts/StickyNotesCard';
import {
  FiCalendar,
  FiUsers,
  FiEye,
  FiPackage,
  FiCheckCircle,
  FiSettings,
  FiAlertTriangle,
  FiDownloadCloud,
} from 'react-icons/fi';

type KpiTone = 'up' | 'down' | 'flat';

type AgendaRow = {
  id: string;
  slot_date: string;
  time_label: string;
  title: string;
  kind: string | null;
  created_at: string;
};

type DesignTopRow = {
  id: string;
  title: string | null;
  category_id: string | null;
  design_files?: { count: number }[];
};

type BundleTopRow = {
  id: string;
  title: string | null;
  category_id: string | null;
  bundle_images?: { count: number }[];
  bundle_files?: { count: number }[];
};

type SiteSettingsRow = {
  instagram_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  instagram_followers: number | null;
  facebook_followers: number | null;
  x_followers: number | null;
  social_updated_at: string | null;
};

type CrmJobRow = {
  id: string;
  name: string | null;
  topic: string | null;
  status: string | null;
};

type NoteSummaryRow = {
  id: string;
  content: string;
  note_date: string; // YYYY-MM-DD
  created_at: string;
};

/** Convert '10:30am' or '10:30 am' → minutes since midnight. Fallback 0 if format is weird. */
function timeLabelToMinutes(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return 0;

  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const period = m[3].toLowerCase();

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return hour * 60 + minute;
}

/** Sort agenda rows chronologically, then by created_at as a tie-breaker. */
function sortAgendaRows(rows: AgendaRow[]): AgendaRow[] {
  return [...rows].sort((a, b) => {
    const diff =
      timeLabelToMinutes(a.time_label) - timeLabelToMinutes(b.time_label);
    if (diff !== 0) return diff;
    return a.created_at.localeCompare(b.created_at);
  });
}

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

  // Date helpers for agenda + analytics using Halifax local date (not UTC)
  const getHalifaxDateKey = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString('en-CA', {
      timeZone: 'America/Halifax',
    }); // YYYY-MM-DD
  };

  const todayKey = getHalifaxDateKey(0);
  const yesterdayKey = getHalifaxDateKey(-1);
  const weekStartKey = getHalifaxDateKey(-6); // inclusive 7-day window

  // Real data: counts from Supabase
  const [
    { count: activeDesignsCount },
    { count: activeBundlesCount },
    { count: mediaAssetsCount },
    { count: todaySessionsCount },
    { count: weekSessionsCount },
  ] = await Promise.all([
    supabase
      .from('print_designs')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('bundles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('media_assets').select('id', { count: 'exact', head: true }),
    supabase
      .from('analytics_sessions')
      .select('session_id', { count: 'exact', head: true })
      .eq('day', todayKey),
    supabase
      .from('analytics_sessions')
      .select('session_id', { count: 'exact', head: true })
      .gte('day', weekStartKey),
  ]);

  const activeDesigns = activeDesignsCount ?? 0;
  const activeBundles = activeBundlesCount ?? 0;
  const mediaItems = mediaAssetsCount ?? 0;
  const todaySessions = todaySessionsCount ?? 0;
  const weekSessions = weekSessionsCount ?? 0;

  // Site settings (social links + followers)
  const { data: siteSettingsRaw } = await supabase
    .from('site_settings')
    .select(
      'instagram_url,facebook_url,x_url,instagram_followers,facebook_followers,x_followers,social_updated_at',
    )
    .limit(1)
    .maybeSingle();

  const siteSettings = siteSettingsRaw as SiteSettingsRow | null;

  const socialFollowerTotal =
    (siteSettings?.instagram_followers ?? 0) +
    (siteSettings?.facebook_followers ?? 0) +
    (siteSettings?.x_followers ?? 0);

  const hasAnyFollowers = socialFollowerTotal > 0;
  const hasAnySocialUrl =
    !!siteSettings?.instagram_url ||
    !!siteSettings?.facebook_url ||
    !!siteSettings?.x_url;

  const socialValue = hasAnyFollowers ? String(socialFollowerTotal) : '—';

  const socialDelta = hasAnyFollowers
    ? 'Total IG + FB + X followers'
    : hasAnySocialUrl
    ? 'No follower data yet'
    : 'Connect socials';

  const socialTone: KpiTone = hasAnyFollowers ? 'up' : 'flat';

  // TODAY'S AGENDA (mirrors calendar_agenda_slots)
  const { data: agendaRowsRaw, error: agendaError } = await supabase
    .from('calendar_agenda_slots')
    .select('id, slot_date, time_label, title, kind, created_at')
    .eq('user_id', user.id)
    .eq('slot_date', todayKey)
    .order('time_label', { ascending: true });

  if (agendaError) {
    console.error('Error loading today agenda', agendaError);
  }

  const agendaRows = sortAgendaRows((agendaRowsRaw ?? []) as AgendaRow[]);

  const todayAgenda = agendaRows.map((row) => ({
    time: row.time_label,
    label: row.title,
    type: row.kind ?? '',
  }));

  // -------------------------
  // STICKY NOTES SUMMARY (TODAY / YESTERDAY) – SHARED NOTES
  // -------------------------
  const { data: notesRaw, error: notesError } = await supabase
    .from('dashboard_notes')
    .select('id, content, note_date, created_at')
    .in('note_date', [todayKey, yesterdayKey]) // 🔹 no user_id filter → shared notes
    .order('note_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (notesError) {
    console.error('Error loading dashboard notes summary', notesError);
  }

  const noteRows = (notesRaw ?? []) as NoteSummaryRow[];

  const todayNotes = noteRows.filter((n) => n.note_date === todayKey);
  const yesterdayNotes = noteRows.filter((n) => n.note_date === yesterdayKey);

  // KPIs (4 real now: designs, bundles, media, sessions + social)
  const kpis: { label: string; value: string; delta: string; tone: KpiTone }[] =
    [
      {
        label: 'Active Designs',
        value: String(activeDesigns),
        delta: activeDesigns ? 'Live in catalog' : 'Add your first design',
        tone: activeDesigns ? 'up' : 'flat',
      },
      {
        label: 'Active Bundles',
        value: String(activeBundles),
        delta: activeBundles
          ? 'Bundle sets in catalog'
          : 'Create your first bundle',
        tone: activeBundles ? 'up' : 'flat',
      },
      {
        label: 'Media Library Items',
        value: String(mediaItems),
        delta: mediaItems ? 'Images & videos stored' : 'Upload some media',
        tone: mediaItems ? 'up' : 'flat',
      },
      {
        label: 'Site Sessions',
        value: String(todaySessions),
        delta: weekSessions
          ? `Last 7 days: ${weekSessions}`
          : 'No analytics data yet',
        tone: weekSessions ? 'up' : 'flat',
      },
      {
        label: 'Social Reach',
        value: socialValue,
        delta: socialDelta,
        tone: socialTone,
      },
    ];

  // -------------------------
  // TOP DESIGNS / BUNDLES / DOWNLOADS
  // -------------------------

  const [
    { data: designRows, error: designError },
    { data: bundleRows, error: bundleError },
    { data: designCategories },
    { data: bundleCategories },
  ] = await Promise.all([
    supabase
      .from('print_designs')
      .select('id,title,category_id,design_files(count)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(10),
    supabase
      .from('bundles')
      .select('id,title,category_id,bundle_images(count),bundle_files(count)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(10),
    supabase.from('design_categories').select('slug,label'),
    supabase.from('bundle_categories').select('id,label'),
  ]);

  if (designError) {
    console.error('Error loading top designs', designError);
  }
  if (bundleError) {
    console.error('Error loading top bundles', bundleError);
  }

  const designCatMap = new Map<string, string>(
    (designCategories ?? []).map((c: any) => [
      c.slug as string,
      c.label as string,
    ]),
  );

  const bundleCatMap = new Map<string, string>(
    (bundleCategories ?? []).map((c: any) => [c.id as string, c.label as string]),
  );

  const designSource = (designRows ?? []) as DesignTopRow[];
  const bundleSource = (bundleRows ?? []) as BundleTopRow[];

  const topDesigns = designSource.slice(0, 3).map((row) => ({
    title: row.title ?? 'Untitled design',
    tag:
      (row.category_id && designCatMap.get(row.category_id)) ||
      row.category_id ||
      'Uncategorized',
    // TEMP: use file count as a stand-in for “views” until we add real analytics
    views: row.design_files?.[0]?.count ?? 0,
    orders: row.design_files?.[0]?.count ?? 0,
  }));

  const mostDownloaded = [...designSource]
    .sort(
      (a, b) =>
        (b.design_files?.[0]?.count ?? 0) -
        (a.design_files?.[0]?.count ?? 0),
    )
    .slice(0, 3)
    .map((row) => ({
      title: row.title ?? 'Untitled design',
      tag:
        (row.category_id && designCatMap.get(row.category_id)) ||
        row.category_id ||
        'Uncategorized',
      downloads: row.design_files?.[0]?.count ?? 0,
    }));

  const topBundles = bundleSource.slice(0, 3).map((row) => ({
    title: row.title ?? 'Untitled bundle',
    tag:
      (row.category_id && bundleCatMap.get(row.category_id)) ||
      row.category_id ||
      'Uncategorized',
    // using image/file counts as rough “view/order” signals for now
    views: row.bundle_images?.[0]?.count ?? 0,
    orders: row.bundle_files?.[0]?.count ?? 0,
  }));

  // -------------------------
  // PIPELINE (CRM JOBS)
  // -------------------------

  const { data: crmJobsRaw, error: crmError } = await supabase
    .from('crm_jobs')
    .select('id,name,topic,status')
    .order('created_at', { ascending: false });

  if (crmError) {
    console.error('Error loading CRM jobs', crmError);
  }

  const crmJobs = (crmJobsRaw ?? []) as CrmJobRow[];

  const topPipelineStages = ['pending', 'working', 'completed'].map((key) => {
    const label =
      key === 'pending'
        ? 'Pending'
        : key === 'working'
        ? 'Working'
        : 'Completed';

    const jobsForStage = crmJobs.filter(
      (job) => (job.status ?? '').toLowerCase() === key,
    );

    return {
      id: key,
      label,
      count: jobsForStage.length,
      // keep at most 3 per stage; Completed will therefore be the 3 most recent
      items: jobsForStage.slice(0, 3).map((job) => {
        const main = job.topic || job.name || 'Job';
        return main.length > 40 ? `${main.slice(0, 37)}…` : main;
      }),
      connected: true as const,
    };
  });

  // Updated: remove Leads + Paused, keep Overdue stub
  const pipelineStages = [
    ...topPipelineStages,
    {
      id: 'overdue',
      label: 'Overdue',
      count: 0,
      items: [] as string[],
      connected: false as const,
    },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-sm"
          >
            {/* label + optional gear for Social Reach */}
            <div className="text-xs uppercase opacity-70 flex items-center justify-between">
              <span>{kpi.label}</span>
              {kpi.label === 'Social Reach' && (
                <SocialReachSettingsModal siteSettings={siteSettings} />
              )}
            </div>

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
        {/* Agenda – wider, fixed height with scrollable list */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3 h-[300px]">
          <div className="flex items-center gap-2 flex-shrink-0">
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

          <div className="mt-2 flex-1 min-h-0">
            <ul className="space-y-2 text-sm h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
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
        </div>

        {/* Notes – sticky-note card now wired to Supabase summary */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3 h-[300px]">
          <StickyNotesCard
            todayNotes={todayNotes}
            yesterdayNotes={yesterdayNotes}
          />
        </div>

        {/* Pipeline – Pending & Working full-height, Completed/Overdue stacked */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3 h-[300px]">
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

          <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 grid-rows-2 gap-2 text-[0.75rem]">
            {pipelineStages.map((stage) => (
              <div
                key={stage.id}
                className={`rounded-lg border border-white/8 bg-black/25 px-3 py-3 flex flex-col ${
                  stage.id === 'pending' || stage.id === 'working'
                    ? 'row-span-2'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium truncate">{stage.label}</span>
                  {stage.connected && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.7rem]">
                      {stage.count}
                    </span>
                  )}
                </div>

                {stage.connected ? (
                  stage.count === 0 ? (
                    <p className="text-[0.7rem] italic opacity-60 mt-1">
                      No jobs yet.
                    </p>
                  ) : (
                    <ul className="opacity-70 mt-1 space-y-0.5">
                      {stage.items.map((i, idx) => (
                        <li key={`${stage.id}-${idx}`} className="truncate">
                          • {i}
                        </li>
                      ))}
                    </ul>
                  )
                ) : (
                  // non-connected (Overdue): title only for now
                  <div className="flex-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP DESIGNS + BUNDLES + DOWNLOADS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
                  📎 {d.orders}
                </div>
              </div>
            ))}
            {topDesigns.length === 0 && (
              <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs opacity-70">
                No designs found yet.
              </div>
            )}
          </div>
        </div>

        {/* Bundles */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/25 flex items-center justify-center">
              <FiPackage />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Top Viewed Bundles</h2>
              <p className="text-[0.75rem] opacity-60">
                Your top-performing sets.
              </p>
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
                  📎 {b.orders}
                </div>
              </div>
            ))}
            {topBundles.length === 0 && (
              <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs opacity-70">
                No bundles found yet.
              </div>
            )}
          </div>
        </div>

        {/* Most Downloaded */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-teal-500/25 flex items-center justify-center">
              <FiDownloadCloud />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Most Downloaded</h2>
              <p className="text-[0.75rem] opacity-60">
                Designs with the most STL files.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {mostDownloaded.map((d) => (
              <div
                key={d.title}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.title}</div>
                  <div className="text-[0.75rem] opacity-60">{d.tag}</div>
                </div>
                <div className="text-right text-[0.75rem] opacity-70">
                  ⬇️ {d.downloads}
                </div>
              </div>
            ))}
            {mostDownloaded.length === 0 && (
              <div className="rounded-lg border border-white/5 bg-black/20 px-3 py-2 text-xs opacity-70">
                No downloadable designs yet.
              </div>
            )}
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
              <p className="text-[0.75rem] opacity-60">
                Basic health indicators.
              </p>
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