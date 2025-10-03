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
      ? '/assets/twologo-light.png'
      : '/assets/twologo-dark.png'
    : '/assets/twologo-dark.png'

  return (
    <>
      {/* Hero Logo with fade-in */}
      {mounted && (
        <Image
          src={logoSrc}
          alt="Rad Dad Prints"
          width={360}
          height={100}
          priority
          className="ml-10 mt-45 md:-ml-80 md:mt-90 lg:-ml-80 lg:mt-130 xl:-ml-210 xl:mt-130 2xl:-ml-360 2xl:mt-90 z-20 transition-opacity duration-700 opacity-100"
        />
      )}

      {/* Tagline */}
      <p className="text-2xl sm:text-4xl font-dancing tracking-wide mt-30 mr-0 md:mt-30 md:-mr-10 lg:mt-40 lg:-mr-30 xl:-mt-160 xl:-mr-160 2xl:-mt-80 2xl:-mr-240 text-center max-w-2xl leading-snug animate-fadeIn">
        Custom 3D Printing. Creative Ideas. With Results You Will Love!
      </p>

      {/* Decorative Chart Image */}
      {mounted && (
        <Image
          src="/assets/main02.png"
          alt="Chart Icon"
          width={760}
          height={60}
          priority
          className="ml-10 -mt-100 mb-100 rotate-[5deg] md:ml-80 md:-mt-200 md:mb-100 lg:ml-80 lg:-mt-240 lg:-mb-10 xl:-ml-60 xl:-mt-40 xl:-mb-10 2xl:-ml-190 2xl:-mt-110 2xl:-mb-10 md:rotate-[70deg] transition-opacity duration-700 opacity-100"
        />
      )}
    </>
  )
}