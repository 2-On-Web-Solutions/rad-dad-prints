import Link from "next/link";
import { Wrench } from "lucide-react";

export const metadata = {
  title: "Creative Corner — Coming Soon",
  description:
    "We’re building a self-serve uploader so you can customize models and request a print. Check back soon!",
};

export default function CreativeCornerSoon() {
  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        {/* Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl grid place-items-center border border-[var(--color-foreground)]/30">
          <Wrench className="w-8 h-8 opacity-70" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-3">
          Creative Corner is under construction
        </h1>

        {/* Description */}
        <p className="text-[var(--color-foreground)]/70 leading-relaxed mb-8">
          We’re building a self-serve uploader so you can customize models and
          request a 3D print. Check back soon!
        </p>

        {/* Gradient pill button */}
        <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_20px_rgba(19,200,223,0.45)]">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-full
                       px-6 py-2 sm:px-8 sm:py-2.5
                       bg-white/90 dark:bg-black/70 backdrop-blur-md
                       text-neutral-900 dark:text-white font-semibold
                       transition-all hover:scale-[1.02]"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}