'use client'

import { useEffect, useState } from 'react'
import { FaBars } from 'react-icons/fa'
import ThemeToggle from './ThemeToggle'

export default function Header({ onContact }: { onContact: () => void }) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    history.replaceState(null, '', '/')
  }

  if (!mounted) return null

  return (
    <header className="fixed top-0 left-0 w-full bg-neutral-800 text-white py-4 px-4 sm:py-6 sm:px-8 lg:px-16 z-50 shadow-md">
      <nav className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-10">

        {/* Top row: Logo + Hamburger */}
        <div className="w-full flex justify-between items-center">
          <div
            onClick={scrollToTop}
            className="text-2xl sm:text-3xl lg:text-[1.65rem] xl:text-4xl font-dancing tracking-wide cursor-pointer text-center sm:text-left lg:ml-4 xl:ml-8 2xl:-ml-70 text-purple-700"
          >
            Rad Dad Prints
          </div>

          {/* Hamburger toggle button (below lg only) */}
          <button
            className="lg:hidden text-2xl focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            <FaBars />
          </button>
        </div>

        {/* Nav Links */}
        <ul
          className={`flex-col lg:flex-row gap-4 lg:gap-10 xl:gap-20 2xl:gap-40 2xl:mr-55 2xl:text-lg text-center text-base font-semibold tracking-wide transition-all duration-300 ${
            isOpen ? 'flex' : 'hidden'
          } lg:flex`}
        >
          <li><a href="#welcome" className="hover:text-purple-700 transition py-1">PrintDesigns</a></li>
          <li><a href="#features-products" className="hover:text-purple-700 transition py-1 whitespace-nowrap">Bundles & Packages</a></li>
          <li><a href="#services" className="hover:text-purple-700 transition py-1">Services</a></li>
          <li><a href="#gallery" className="hover:text-purple-700 transition py-1">Gallery</a></li>
        </ul>

        {/* Right side: Theme + Contact */}
        <div className="flex gap-4 justify-center sm:justify-end items-center mt-2 sm:mt-0 lg:mr-4 xl:mr-8 2xl:-mr-70">
          <ThemeToggle />
          <div className="animated-link-wrapper">
            <div className="animated-link-effect-2"><div></div></div>
            <button onClick={onContact} className="animated-link-2 text-sm sm:text-base">Contact</button>
          </div>
        </div>
      </nav>
    </header>
  )
}