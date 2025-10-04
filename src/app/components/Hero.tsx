'use client'

import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Hero() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hydration-safe fallback for logo
  const logoSrc = mounted
    ? theme === 'light'
      ? '/assets/rad-dad-prints.png'
      : '/assets/rad-dad-prints.png'
    : '/assets/rad-dad-prints.png'

  return (
    <section className="w-full min-h-[140vh] flex flex-col md:flex-row items-center justify-between px-8 py-16">
      {/* Left side: Hero Logo */}
      {mounted && (
        <Image
          src={logoSrc}
          alt="Rad Dad Prints"
          width={360}
          height={100}
          priority
          className="transition-opacity duration-700 opacity-100"
        />
      )}

      {/* Right side: Tagline */}
      <div className="mt-8 md:mt-0 md:ml-12 text-right max-w-xl">
        <p className="text-2xl sm:text-4xl font-dancing tracking-wide leading-snug animate-fadeIn">
          Custom 3D Printing. Creative Ideas. With Results You Will Love!
        </p>
      </div>
    </section>
  )
}