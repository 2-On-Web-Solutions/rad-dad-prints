'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/* ===========================================================
   ADJUST HERE (MOBILE)
   -----------------------------------------------------------
   These ONLY affect mobile/tablet (no lg: prefix). Desktop
   keeps your original positions/sizes.
   =========================================================== */

// Mobile LOGO tile — size/shape/spacing/position
const MOBILE_LOGO = {
  // width cap
  maxW: 'max-w-[44vw]',

  // shape / tallness
  aspect: 'aspect-[4/3]',

  // vertical spacing (negative = overlap the video more)
  marginBottom: '-mb-16',

  // horizontal alignment (choose one)
  // switched to RIGHT side on mobile:
  align: 'ml-auto',              // right (was 'mx-auto')
  // nudge away from the edge (use 'mr-2', 'mr-3', 'mr-4', etc.)
  offset: 'mr-4',

  // stacking order on mobile (logo above video)
  z: 'z-[60]',

  // optional fine nudges (requires `relative`)
  xNudge: 'translate-x-0',
  yNudge: 'translate-y-0',
}

// Mobile VIDEO frame — size/shape & letterboxing
const MOBILE_VIDEO = {
  maxW: 'max-w-[62vw]',
  aspect: 'aspect-[10/16]',
  fit: 'object-contain',
  topMargin: 'mt-4',
  z: 'z-[40]',
}

/* ===========================================================
   Helper builders
   =========================================================== */
const mobileLogoClass = [
  'block lg:hidden',
  'relative',
  MOBILE_LOGO.z,
  MOBILE_LOGO.align,
  MOBILE_LOGO.offset,
  MOBILE_LOGO.marginBottom,
  MOBILE_LOGO.xNudge,
  MOBILE_LOGO.yNudge,
  'w-full',
  MOBILE_LOGO.maxW,
  MOBILE_LOGO.aspect,
  'p-[2px] bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af]',
  'shadow-[0_0_35px_rgba(19,200,223,0.45)]',
].join(' ')

const mobileVideoFrameClass = [
  'relative p-[2px]',
  MOBILE_VIDEO.z,
  'bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af]',
  'shadow-[0_0_35px_rgba(19,200,223,0.45)]',
  'mx-auto w-full',
  MOBILE_VIDEO.maxW,
  MOBILE_VIDEO.aspect,
  MOBILE_VIDEO.topMargin,
  // desktop keeps its original sizing/offsets:
  'lg:mx-0 lg:top-12 lg:right-110 lg:w-[900px] lg:h-[600px] lg:aspect-auto',
].join(' ')

export default function Hero() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const logoSrc =
    mounted && theme === 'light'
      ? '/assets/rad-dad-prints.png'
      : '/assets/rad-dad-prints.png'

  return (
    <section
      className="
        relative w-full min-h-[100svh]
        px-4 sm:px-6 lg:px-8
        pt-24 sm:pt-28 md:pt-32 lg:pt-8
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
          mt-6 sm:mt-20 md:mt-24 lg:mt-0
          lg:absolute lg:left-[43%] lg:top-[12%]
        "
      >
        {/* Mobile logo tile (stacked, now on right) */}
        <div className={mobileLogoClass}>
          <div className="relative w-full h-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
            <Image src={logoSrc} alt="Showcase" fill className="object-contain" priority />
          </div>
        </div>

        {/* Video frame (mobile adjustable / desktop original) */}
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

          {/* Floating logo tile (desktop only) */}
          <div
            className="
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

      {/* Tagline (now just below the video on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        className="
          order-10 w-full max-w-3xl mx-auto mt-8 sm:mt-10 md:mt-12 text-center
          lg:absolute lg:right-20 lg:top-160 lg:text-right lg:max-w-xl lg:mt-0
        "
      >
        <p className="text-2xl sm:text-4xl font-dancing tracking-wide leading-snug animate-fadeIn">
          <span className="text-[var(--color-foreground)] lg:text-white lg:[text-shadow:_0_0_10px_rgba(0,0,0,.35)]">
            Cus
          </span>
          <span className="text-[var(--color-foreground)]">
            tom 3D Printing. Creative Ideas.
          </span>
          <span className="block lg:-mr-5 text-[var(--color-foreground)]">
            With Results You Will Love!
          </span>
        </p>
      </motion.div>

      {/* CTA (now last on mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.35 }}
        className="
          order-20 relative
          mt-6 sm:mt-8 md:mt-10
          w-full max-w-[min(90vw,420px)]
          flex flex-col items-center gap-2
          lg:absolute lg:-left-[4%] lg:top-[69%] lg:w-[360px]
        "
      >
        <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_28px_rgba(19,200,223,0.45)]">
          <a
            href="/creative-corner"
            className="group flex items-center gap-2 rounded-full px-5 sm:px-6 py-2.5
                      bg-white/90 dark:bg-black/70 backdrop-blur-md
                      text-neutral-900 dark:text-white font-semibold transition-colors"
          >
            <span className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-bold tracking-wide bg-[#13c8df] text-white">
              NEW
            </span>
            <span className="text-sm sm:text-base">Creative Corner</span>
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-500 text-center leading-snug">
          Upload, customize & export for 3D print —
          <br className="hidden sm:block" />
          then request a quote.
        </p>
      </motion.div>
    </section>
  )
}