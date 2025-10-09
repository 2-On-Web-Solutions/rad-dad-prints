'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Hero() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted
    ? theme === 'light'
      ? '/assets/rad-dad-prints.png'
      : '/assets/rad-dad-prints.png'
    : '/assets/rad-dad-prints.png'

  return (
    <section className="w-full min-h-[100svh] flex flex-col md:flex-row items-center justify-between px-8 pt-8 pb-8 relative">
      {/* Left side: Hero Logo (kept for future use) */}
      {mounted && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}

      {/* Creative Corner CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
        className="absolute -left-[4%] top-[70%] z-10 w-[360px] flex flex-col items-center space-y-2"
      >
        <div className="inline-block p-[2px] rounded-full bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_28px_rgba(19,200,223,0.45)]">
          <a
            href="/creative-corner"
            className="group flex items-center gap-2 rounded-full px-6 py-3
                      bg-white/90 dark:bg-black/70 backdrop-blur-md
                      text-neutral-900 dark:text-white font-semibold
                      transition-colors"
          >
            <span className="rounded-full px-2 py-0.5 text-xs font-bold tracking-wide bg-[#13c8df] text-white">
              NEW
            </span>
            <span>Creative Corner</span>
            <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        <p className="text-sm text-neutral-700 dark:text-neutral-500 text-center leading-snug">
          Upload, customize & export for 3D print —
          <br />
          then request a quote.
        </p>
      </motion.div>

      {/* Right side: Fixed-size video container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="absolute right-[5%] top-[12%]"
      >
        {/* VIDEO FRAME */}
        <div className="relative p-[2px] top-12 right-110 bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_35px_rgba(19,200,223,0.45)] w-[900px] h-[600px]">
          <div className="overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl w-full h-full">
            <video
              src="/assets/videos/rad-dad-prints-video01.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="block w-full h-full object-contain"
            />
          </div>

          {/* IMAGE FRAME */}
          <div className="absolute left-full -top-20 -ml-20 p-[2px] bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_35px_rgba(19,200,223,0.45)] w-[420px] h-[320px]">
            <div className="relative w-full h-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
              <Image
                src="/assets/rad-dad-prints.png"
                alt="Showcase"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
        className="absolute bottom-12 right-8 md:right-16 text-right max-w-xl"
      >
        <p className="text-2xl sm:text-4xl -mt-60 mr-2 font-dancing tracking-wide leading-snug animate-fadeIn">
          <span className="text-white [text-shadow:_0_0_10px_rgba(0,0,0,.35)]">Cus</span>
          <span className="text-[var(--color-foreground)]">
            tom 3D Printing. Creative Ideas.
          </span>
          <span className="block text-[var(--color-foreground)] md:mr-[-6ch] lg:mr-[-8ch] xl:mr-[-2.5ch]">
            With Results You Will Love!
          </span>
        </p>
      </motion.div>
    </section>
  )
}