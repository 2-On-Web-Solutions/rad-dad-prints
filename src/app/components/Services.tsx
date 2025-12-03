'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

type ServiceRow = {
  id: string;
  name: string | null;
  details: string | null;
  starting_price: string | null;
  sort_order: number | null;
  is_active?: boolean | null;
};

type DisplayService = {
  id: string;
  name: string;
  description: string;
  price: string;
};

type ServicePageMeta = {
  tagline: string | null;
  note_build_volumes: string | null;
  note_tolerances: string | null;
  note_file_formats: string | null;
  note_ready: string | null;
  note_disclaimer: string | null;
};

const DEFAULT_META: ServicePageMeta = {
  tagline:
    'Rapid, reliable 3D printing for prototypes, parts, miniatures, and small-batch production.',
  note_build_volumes:
    'FDM up to ~300×300×300 mm. Resin up to ~130×80×160 mm (larger available via split/assembly).',
  note_tolerances:
    'Typical ±0.2–0.4 mm (material-dependent). Tight fits and press-fits available with testing.',
  note_file_formats:
    'STL, 3MF, STEP/IGES (for CAD). We can repair or convert files if needed.',
  note_ready:
    'Ready to print? Use the Contact button (top right) to upload your files and get a quote.',
  note_disclaimer:
    'Prices are estimates and vary by size, material, complexity, and finish.',
};

const DEFAULT_SERVICES: DisplayService[] = [
  {
    id: 'fdm-printing',
    name: 'FDM Printing (PLA / PETG / ABS)',
    description:
      'Strong & affordable parts. Multiple colors, 0.12–0.28 mm layer heights, quality check, basic cleanup.',
    price: 'From $15',
  },
  {
    id: 'resin-printing',
    name: 'Resin Printing (SLA/DLP)',
    description:
      'High-detail minis & functional small parts. UV cure, supports removed, fine layer heights (0.025–0.05 mm).',
    price: 'From $25',
  },
  {
    id: 'design-file-prep',
    name: 'Design & File Prep (CAD/Repair)',
    description:
      'We repair STLs, add tolerances, convert sketches to printable models, or design parts from scratch.',
    price: 'From $40/hr',
  },
  {
    id: 'post-processing',
    name: 'Post-Processing & Finishing',
    description:
      'Support removal, sanding, gap-fill/prime, vapor-smooth (ABS), color coating, decals, or clear coat.',
    price: 'From $10',
  },
  {
    id: 'functional-prototypes',
    name: 'Functional Prototypes',
    description:
      'Fit/assembly prototypes, threaded inserts, multi-part assemblies, material guidance for strength & heat.',
    price: 'From $35',
  },
  {
    id: 'small-batch',
    name: 'Small-Batch Production',
    description:
      'Repeatable quality for 10–500 pcs. Batch pricing, QC sampling, labeled bagging, and optional kitting.',
    price: 'Custom',
  },
  {
    id: 'large-format',
    name: 'Large-Format Prints',
    description:
      'Oversized parts split & keyed for assembly. Alignment pins, epoxy bond, seam finishing available.',
    price: 'From $45',
  },
  {
    id: 'rush',
    name: 'Rush / Same-Day Options',
    description:
      'Priority queue with late-night/weekend runs (when available). Price depends on size & material.',
    price: 'From +25%',
  },
  {
    id: 'scan',
    name: '3D Scanning (basic)',
    description:
      'Simple object capture for reference or rough reproduction. Mesh cleanup and printable export.',
    price: 'From $35',
  },
  {
    id: 'consulting',
    name: 'Material Consulting',
    description:
      'PLA, PETG, ABS, ASA, TPU (flex), and resin types. We recommend the best material for strength, heat, or detail.',
    price: 'Free with order',
  },
];

export default function Services() {
  const supabase = supabaseBrowser;

  const [services, setServices] = useState<DisplayService[]>(DEFAULT_SERVICES);
  const [meta, setMeta] = useState<ServicePageMeta | null>(null);

  useEffect(() => {
    async function load() {
      // fetch services + meta in parallel
      const [servicesRes, metaRes] = await Promise.all([
        supabase
          .from('services')
          .select(
            'id, name, details, starting_price, sort_order, is_active',
          )
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('service_page_meta')
          .select(
            'tagline, note_build_volumes, note_tolerances, note_file_formats, note_ready, note_disclaimer',
          )
          .eq('id', 'default')
          .maybeSingle(),
      ]);

      if (!servicesRes.error && servicesRes.data && servicesRes.data.length) {
        const rows = servicesRes.data as ServiceRow[];
        setServices(
          rows.map((row) => ({
            id: row.id,
            name: row.name ?? '',
            description: row.details ?? '',
            price: row.starting_price ?? '',
          })),
        );
      }

      if (!metaRes.error && metaRes.data) {
        setMeta(metaRes.data as ServicePageMeta);
      }
    }

    load();
  }, [supabase]);

  const effectiveMeta: ServicePageMeta = {
    ...DEFAULT_META,
    ...(meta ?? {}),
  };

  return (
    <section
      id="services"
      className="py-16 sm:py-20 px-4 sm:px-8 lg:px-16 max-w-[1200px] mx-auto"
    >
      <h2 className="text-[2rem] sm:text-5xl text-center text-[var(--color-foreground)] mb-3 sm:mb-4">
        Services
      </h2>
      <p className="mx-auto max-w-[46ch] text-center text-base sm:text-lg opacity-70 mb-8 sm:mb-10 text-[var(--color-foreground)]">
        {effectiveMeta.tagline ?? DEFAULT_META.tagline}
      </p>

      <div className="overflow-x-auto">
        {/* wider, still centered on mobile */}
        <div className="max-w-[500px] md:max-w-none mx-auto">
          <table
            className="
              w-full table-fixed border-collapse
              border border-[var(--color-foreground)]/10
              rounded-lg overflow-hidden
              text-xs sm:text-sm
            "
          >
            <colgroup>
              <col className="w-[32%] sm:w-[27%]" />
              <col className="w-[46%] sm:w-[57%]" />
              <col className="w-[22%] sm:w-[16%]" />
            </colgroup>

            <thead>
              <tr className="bg-[var(--color-foreground)]/5 text-left text-[var(--color-foreground)]">
                <th className="p-2 sm:p-4 font-semibold">Service</th>
                <th className="p-2 sm:p-4 font-semibold">What’s Included</th>
                <th className="p-2 sm:p-4 font-semibold text-right">
                  <span className="sm:hidden">Price</span>
                  <span className="hidden sm:inline">Starting Price</span>
                </th>
              </tr>
            </thead>

            <tbody className="text-[var(--color-foreground)] align-top">
              {services.map(({ id, name, description, price }) => (
                <tr
                  key={id}
                  className="border-t border-[var(--color-foreground)]/10"
                >
                  <td className="p-2 sm:p-4 font-medium leading-snug break-words hyphens-auto">
                    {name}
                  </td>
                  <td className="p-2 sm:p-4 leading-snug break-words hyphens-auto">
                    {description}
                  </td>
                  <td
                    className="
                      pl-2 pr-3 sm:pr-5 py-2 sm:py-4
                      text-[11px] sm:text-sm text-teal-400
                      whitespace-nowrap text-right tabular-nums leading-tight
                      min-w-[72px] sm:min-w-0
                    "
                  >
                    {price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Helpful shop notes */}
        <div className="mt-6 space-y-2 text-xs sm:text-sm text-[var(--color-foreground)]/70 max-w-[680px] mx-auto">
          <p>
            <strong>Build volumes:</strong>{' '}
            {effectiveMeta.note_build_volumes ?? DEFAULT_META.note_build_volumes}
          </p>
          <p>
            <strong>Tolerances:</strong>{' '}
            {effectiveMeta.note_tolerances ?? DEFAULT_META.note_tolerances}
          </p>
          <p>
            <strong>File formats:</strong>{' '}
            {effectiveMeta.note_file_formats ?? DEFAULT_META.note_file_formats}
          </p>
        </div>

        <p className="text-center mt-6 text-xs sm:text-sm text-[var(--color-foreground)]/70">
          {effectiveMeta.note_ready ?? DEFAULT_META.note_ready}
        </p>
        <p className="text-[10px] sm:text-xs text-center text-[var(--color-foreground)]/50 mt-2">
          {effectiveMeta.note_disclaimer ?? DEFAULT_META.note_disclaimer}
        </p>
      </div>
    </section>
  );
}