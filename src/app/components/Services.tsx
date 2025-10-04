'use client'

export default function Services() {
  return (
    <section id="services" className="py-20 px-4 sm:px-8 lg:px-16 max-w-[1200px] mx-auto">
      <h2 className="text-5xl text-center text-[var(--color-foreground)] mb-4">Services</h2>
      <p className="text-center text-lg opacity-70 mb-10 text-[var(--color-foreground)]">
        Rapid, reliable 3D printing for prototypes, parts, miniatures, and small-batch production.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[var(--color-foreground)]/10 rounded-lg">
          <thead>
            <tr className="bg-[var(--color-foreground)]/5 text-left text-sm sm:text-base text-[var(--color-foreground)]">
              <th className="p-4 font-semibold">Service</th>
              <th className="p-4 font-semibold">What’s Included</th>
              <th className="p-4 font-semibold">Starting Price</th>
            </tr>
          </thead>

          <tbody className="text-[var(--color-foreground)]">
            {[
              {
                service: 'FDM Printing (PLA / PETG / ABS)',
                description:
                  'Strong & affordable parts. Multiple colors, 0.12–0.28 mm layer heights, quality check, basic cleanup.',
                price: 'From $15',
              },
              {
                service: 'Resin Printing (SLA/DLP)',
                description:
                  'High-detail minis & functional small parts. UV cure, supports removed, fine layer heights (0.025–0.05 mm).',
                price: 'From $25',
              },
              {
                service: 'Design & File Prep (CAD/Repair)',
                description:
                  'We repair STLs, add tolerances, convert sketches to printable models, or design parts from scratch.',
                price: 'From $40/hr',
              },
              {
                service: 'Post-Processing & Finishing',
                description:
                  'Support removal, sanding, gap-fill/prime, vapor-smooth (ABS), color coating, decals, or clear coat.',
                price: 'From $10',
              },
              {
                service: 'Functional Prototypes',
                description:
                  'Fit/assembly prototypes, threaded inserts, multi-part assemblies, material guidance for strength & heat.',
                price: 'From $35',
              },
              {
                service: 'Small-Batch Production',
                description:
                  'Repeatable quality for 10–500 pcs. Batch pricing, QC sampling, labeled bagging, and optional kitting.',
                price: 'Custom',
              },
              {
                service: 'Large-Format Prints',
                description:
                  'Oversized parts split & keyed for assembly. Alignment pins, epoxy bond, seam finishing available.',
                price: 'From $45',
              },
              {
                service: 'Rush / Same-Day Options',
                description:
                  'Priority queue with late-night/ weekend runs (when available). Price depends on size & material.',
                price: 'From +25%',
              },
              {
                service: '3D Scanning (basic)',
                description:
                  'Simple object capture for reference or rough reproduction. Mesh cleanup and printable export.',
                price: 'From $35',
              },
              {
                service: 'Material Consulting',
                description:
                  'PLA, PETG, ABS, ASA, TPU (flex), and resin types. We recommend the best material for strength, heat, or detail.',
                price: 'Free with order',
              },
            ].map(({ service, description, price }) => (
              <tr key={service} className="border-t border-[var(--color-foreground)]/10">
                <td className="p-4 font-medium">{service}</td>
                <td className="p-4">{description}</td>
                <td className="p-4 text-sm text-teal-400">{price}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Helpful shop notes */}
        <div className="mt-6 space-y-2 text-sm text-[var(--color-foreground)]/70">
          <p>
            <strong>Build volumes:</strong> FDM up to ~300×300×300&nbsp;mm. Resin up to ~130×80×160&nbsp;mm
            (larger available via split/assembly).
          </p>
          <p>
            <strong>Tolerances:</strong> typical ±0.2–0.4&nbsp;mm (material-dependent). Tight fits and press-fits
            available with testing.
          </p>
          <p>
            <strong>File formats:</strong> STL, 3MF, STEP/IGES (for CAD). We can repair or convert files if needed.
          </p>
        </div>

        <p className="text-center mt-6 text-sm text-[var(--color-foreground)]/70">
          Ready to print? Use the <strong>Contact</strong> button (top right) to upload your files and get a quote.
        </p>
        <p className="text-xs text-center text-[var(--color-foreground)]/50 mt-2">
          Prices are estimates and vary by size, material, complexity, and finish.
        </p>
      </div>
    </section>
  )
}