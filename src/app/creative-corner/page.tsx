// src/app/creative-corner/page.tsx
import Link from "next/link";
import { Wrench } from "lucide-react";

export const metadata = {
  title: "Creative Corner — Coming soon",
  description:
    "We’re building a self-serve uploader so you can customize models and request a print. Stay tuned!",
};

export default function CreativeCornerSoon() {
  return (
    <main className="min-h-[70vh] grid place-items-center px-6">
      <div className="max-w-xl text-center">
        {/* Icon tile */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl grid place-items-center border border-[var(--color-foreground)]/15 bg-[var(--color-foreground)]/5">
          <Wrench className="w-8 h-8 text-brand-500" />
        </div>

        <h1 className="text-3xl md:text-4xl font-semibold">Creative Corner</h1>
        <p className="mt-3 opacity-80">
          We’re putting the finishing touches on a self-serve uploader so you can
          customize models and request a print—right from your browser.
        </p>
        <p className="opacity-70 mt-1">Please check back soon!</p>

        {/* === Same pill/gradient CTA style as homepage === */}
        <div className="mt-8 flex justify-center">
          <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_28px_rgba(19,200,223,0.45)]">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-full px-6 py-3
                         bg-white/90 dark:bg-black/70 backdrop-blur-md
                         border border-white/20 dark:border-white/10
                         text-neutral-900 dark:text-white font-semibold transition-colors"
            >
              <span>Back to the site</span>
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}