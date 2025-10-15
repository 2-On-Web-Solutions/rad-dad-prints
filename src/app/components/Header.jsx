'use client';

import { useEffect, useState } from 'react';
import { FaBars } from 'react-icons/fa';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';

export default function Header({ onContact, onOpenGallery }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '/');
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-neutral-800 text-white py-4 px-4 sm:py-6 sm:px-8 lg:px-16 z-50 shadow-md overflow-visible">
      {/* Positioning context for dropdown */}
      <div
        className="relative max-w-7xl mx-auto"
        style={{
          '--logo-left': '-300px',
          '--logo-top': '225%',
          '--logo-width': '300px',
        }}
      >
        {/* Floating desktop logo (hidden on small screens) */}
        <button
          onClick={scrollToTop}
          aria-label="Go to top"
          className="hidden lg:block absolute z-50 select-none -translate-y-1/2"
          style={{ left: 'var(--logo-left)', top: 'var(--logo-top)', lineHeight: 0 }}
        >
          <Image
            src="/assets/rad-dad-prints.png"
            alt="Rad Dad Prints Logo"
            width={300}
            height={200}
            style={{ width: 'var(--logo-width)', height: 'auto' }}
            priority
            className="object-contain drop-shadow-lg pointer-events-none"
          />
        </button>

        {/* Nav */}
        {/* flex-wrap lets the md dropdown wrap onto the next line */}
          <nav
            className="
              max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-center w-full
              gap-x-4 sm:gap-x-10 gap-y-1 sm:gap-y-2
              relative
              md:pb-0 md:-mb-2 md:gap-y-0  /* <— removes bottom gap/padding on iPad Mini */
            "
          >
          {/* ===== Mobile ONLY (≤767px) — unchanged (logo then hamburger) ===== */}
          <div className="w-full md:hidden -mr-12 -mt-2 -mb-6 flex items-center justify-start gap-3">
            <button onClick={scrollToTop} aria-label="Go to top" className="shrink-0">
              <Image
                src="/assets/rad-dad-prints03.png"
                alt="Rad Dad Prints"
                width={136}
                height={36}
                className="h-18 w-auto object-contain"
                priority
              />
            </button>
            <button
              className="text-2xl focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation"
            >
              <FaBars />
            </button>
          </div>

          {/* ===== iPad Mini / Tablet ONLY (768–1023px) — hamburger before logo ===== */}
          <div
            className="
              hidden md:flex lg:hidden md:w-auto w-full
              -mr-12 md:-mt-1 md:mb-0 -mt-2 -mb-6
              items-center justify-start gap-3
            "
          >
            <button
              className="text-2xl focus:outline-none"
              onClick={() => setIsOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              <FaBars />
            </button>
            <button onClick={scrollToTop} aria-label="Go to top" className="shrink-0">
              <Image
                src="/assets/rad-dad-prints03.png"
                alt="Rad Dad Prints"
                width={136}
                height={36}
                className="h-18 w-auto object-contain"
                priority
              />
            </button>
          </div>

          {/* ===== Desktop Inline Links (unchanged) ===== */}
          <ul
            className={`flex-col lg:flex-row gap-4 lg:gap-10 xl:gap-20 2xl:gap-40
                        text-center text-lg font-semibold tracking-wide transition-all duration-300
                        ${isOpen ? 'flex' : 'hidden'} md:hidden lg:flex
                        lg:mx-auto`}
          >
            <li>
              <a href="#print-designs" className="rdp-navlink transition py-1 whitespace-nowrap">
                Print Designs
              </a>
            </li>
            <li>
              <a href="#bundles-packages" className="rdp-navlink transition py-1 whitespace-nowrap">
                Bundles & Packages
              </a>
            </li>
            <li>
              <a href="#services" className="rdp-navlink transition py-1">
                Services
              </a>
            </li>
            <li>
              <button onClick={onOpenGallery} className="rdp-navlink transition py-1 whitespace-nowrap">
                Gallery
              </button>
            </li>
          </ul>

          {/* ===== Right: Theme + Contact (inline on md, unchanged elsewhere) ===== */}
            <div
              className="
                flex gap-4 justify-center sm:justify-end items-center
                mt-3 -mb-2 sm:mt-0
                md:-mt-1 md:mb-0 md:ml-auto
                lg:mr-4 xl:mr-8 2xl:-mr-70
              "
            >
            <div className="scale-75 sm:scale-100 origin-center">
              <ThemeToggle />
            </div>
            <div className="animated-link-wrapper">
              <div className="animated-link-effect-2"><div /></div>
              <button
                onClick={() => onContact?.()}
                className="animated-link-2 text-sm sm:text-base"
              >
                Contact
              </button>
            </div>
          </div>

          {/* ===== iPad Mini Dropdown — in-flow, expands header height ===== */}
          <div
            className="hidden md:block lg:hidden w-full basis-full overflow-hidden transition-[max-height] duration-300"
            style={{ maxHeight: isOpen ? '260px' : '0px' }}
            aria-hidden={!isOpen}
          >
            <hr className="rdp-hr mt-1 mb-2 opacity-20" />
            <ul className="flex flex-col items-center gap-3 py-3 text-base font-semibold">
              <li>
                <a
                  href="#print-designs"
                  className="rdp-navlink py-1 whitespace-nowrap"
                  onClick={() => setIsOpen(false)}
                >
                  Print Designs
                </a>
              </li>
              <li>
                <a
                  href="#bundles-packages"
                  className="rdp-navlink py-1 whitespace-nowrap"
                  onClick={() => setIsOpen(false)}
                >
                  Bundles & Packages
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="rdp-navlink py-1"
                  onClick={() => setIsOpen(false)}
                >
                  Services
                </a>
              </li>
              <li>
                <button
                  onClick={() => { setIsOpen(false); onOpenGallery?.(); }}
                  className="rdp-navlink py-1 whitespace-nowrap"
                >
                  Gallery
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}