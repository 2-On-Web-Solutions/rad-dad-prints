'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Oswald } from 'next/font/google';

const taglineFont = Oswald({ subsets: ['latin'], weight: ['400','500','600'] });

/* =====================  MOBILE TUNABLES  ===================== */
const MOBILE_LOGO = {
  maxW: 'max-w-[50vw]',
  aspect: 'aspect-[3/2]',
  marginTop: '-mt-1',
  marginBottom: '-mb-14',
  align: 'ml-auto',
  offset: '-mr-6',
  z: 'z-[60]',
  xNudge: 'translate-x-0',
  yNudge: 'translate-y-0',
};
const MOBILE_VIDEO = {
  maxW: 'max-w-[69vw]',
  aspect: 'aspect-[12/16]',
  fit: 'object-contain',
  topMargin: 'mt-5',
  z: 'z-[40]',
};

/* =====================  CLASS BUILDERS  ===================== */
const mobileLogoClass = [
  'block lg:hidden',
  'relative ipm-logo', // <-- iPad Mini target
  MOBILE_LOGO.z,
  MOBILE_LOGO.align,
  MOBILE_LOGO.offset,
  MOBILE_LOGO.marginTop,
  MOBILE_LOGO.marginBottom,
  MOBILE_LOGO.xNudge,
  MOBILE_LOGO.yNudge,
  'w-full',
  MOBILE_LOGO.maxW,
  MOBILE_LOGO.aspect,
  'p-[2px] bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af]',
  'shadow-[0_0_35px_rgba(19,200,223,0.45)]',
].join(' ');

const mobileVideoFrameClass = [
  'relative p-[2px] ipm-video', // <-- iPad Mini target
  MOBILE_VIDEO.z,
  'bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af]',
  'shadow-[0_0_35px_rgba(19,200,223,0.45)]',
  'mx-auto w-full',
  MOBILE_VIDEO.maxW,
  MOBILE_VIDEO.aspect,
  MOBILE_VIDEO.topMargin,
  'lg:mx-0 lg:top-12 lg:right-110 lg:w-[900px] lg:h-[600px] lg:aspect-auto',
].join(' ');

/* =====================  COMPONENT  ===================== */
export default function Hero() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const logoSrc = mounted && theme === 'light'
    ? '/assets/rad-dad-prints.png'
    : '/assets/rad-dad-prints.png';

  return (
    <section
      className="
        ipm-scope                      /* <-- iPad Mini scope */
        relative w-full min-h-[100svh]
        px-4 sm:px-6 lg:px-8
        pt-24 sm:pt-28 md:pt-32 lg:pt-8 ipm-hero-pad
        pb-20 lg:pb-8
        flex flex-col items-center
      "
    >
      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* MEDIA (video + optional logo tile) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        className="
          relative isolate w-full
          mt-12 sm:mt-20 md:mt-24 lg:mt-0
          lg:absolute lg:left-[43%] lg:top-[12%]
        "
      >
        {/* Mobile logo tile */}
        <div className={mobileLogoClass}>
          <div className="relative w-full h-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
            <Image src={logoSrc} alt="Showcase" fill className="object-contain" priority />
          </div>
        </div>

        {/* Video frame */}
        <div className={mobileVideoFrameClass}>
          <div className="overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl w-full h-full">
            <video
              src="/assets/videos/rad-dad-prints-video02.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className={`block w-full h-full ${MOBILE_VIDEO.fit} lg:object-contain`}
            />
          </div>

          {/* Floating logo (desktop only) — add stable class hook */}
          <div
            className="
              ipm-right-tile
              hidden lg:block
              absolute left-full -top-20 -ml-20
              p-[2px] bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af]
              shadow-[0_0_35px_rgba(19,200,223,0.45)]
              w-[420px] h-[320px]
            "
          >
            <div className="relative w-full h-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
              <Image src={logoSrc} alt="Showcase" fill className="object-contain" priority />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        className="
          order-10 w-full max-w-3xl mx-auto mt-4 sm:mt-8 md:mt-10 text-center ipm-tagline
          lg:absolute lg:right-20 lg:top-160 lg:text-right lg:max-w-xl lg:mt-0
        "
      >
        <p
          className={`
            ${taglineFont.className}
            text-base sm:text-2xl md:text-3xl
            tracking-wide sm:tracking-wider
            leading-tight
            uppercase
          `}
        >
          <span className="text-[var(--color-foreground)] lg:text-white lg:[text-shadow:_0_0_10px_rgba(0,0,0,.35)]">
            Custom 3D Printing&nbsp;–&nbsp;Creative Ideas.
          </span>
          <br />
          <span className="text-[var(--color-foreground)]">
            With Results You&nbsp;Will&nbsp;Love!
          </span>
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
        className="
          order-20 relative ipm-cta
          mt-6 sm:mt-8 md:mt-10
          w-full max-w-[min(90vw,420px)]
          flex flex-col items-center gap-2
          lg:absolute lg:-left-[4%] lg:top-[69%] lg:w-[360px]
        "
      >
        {/* gradient ring (PILL WRAPPER HOOK) */}
        <div className="ipm-cc inline-block p-[1.5px] rounded-full bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_28px_rgba(19,200,223,0.45)]">
          <a
            href="/creative-corner"
            className="
              group flex items-center justify-center gap-1.5 sm:gap-2
              rounded-full
              px-3 py-3 sm:px-5 sm:py-2.5
              min-h-[30px]
              bg-white/90 dark:bg-black/70 backdrop-blur-md
              text-neutral-900 dark:text-white
              font-semibold transition-all
              text-xs sm:text-sm
              leading-none
            "
          >
            <span className="rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wide bg-[#13c8df] text-white">
              NEW
            </span>
            <span className="text-xs sm:text-base">Creative Corner</span>
            <span className="ml-0.5 sm:ml-1 transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </div>

        {/* caption */}
        <p className="text-[10px] sm:text-sm text-neutral-700 dark:text-neutral-500 text-center leading-snug max-w-[220px] sm:max-w-[340px] mx-auto">
          Upload, customize & export for 3D print —
          <br className="hidden sm:block" />
          then request a quote.
        </p>
      </motion.div>
    </section>
  );
}