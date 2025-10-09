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
      {/* Container gives us a positioning context for the floating logo */}
      <div
        className="relative max-w-7xl mx-auto"
        style={{
          '--logo-left': '-300px',
          '--logo-top': '225%',
          '--logo-width': '300px',
        }}
      >
        {/* Floating logo (absolute) */}
        <button
          onClick={scrollToTop}
          aria-label="Go to top"
          className="absolute z-50 select-none -translate-y-1/2"
          style={{
            left: 'var(--logo-left)',
            top: 'var(--logo-top)',
            lineHeight: 0,
          }}
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
        <nav className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center w-full gap-4 sm:gap-10 relative">
          {/* Hamburger (below lg) */}
          <button
            className="lg:hidden text-2xl focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            <FaBars />
          </button>

          {/* Links */}
          <ul
            className={`flex-col lg:flex-row gap-4 lg:gap-10 xl:gap-20 2xl:gap-40 
                        text-center text-lg font-semibold tracking-wide transition-all duration-300
                        ${isOpen ? 'flex' : 'hidden'} lg:flex 
                        lg:mx-auto`}
          >
            <li>
              <a
                href="#print-designs"
                className="rdp-navlink transition py-1 whitespace-nowrap"
              >
                Print Designs
              </a>
            </li>
            <li>
              <a
                href="#bundles-packages"
                className="rdp-navlink transition py-1 whitespace-nowrap"
              >
                Bundles & Packages
              </a>
            </li>
            <li>
              <a
                href="#services"
                className="rdp-navlink transition py-1"
              >
                Services
              </a>
            </li>
            <li>
              <button
                onClick={onOpenGallery}
                className="rdp-navlink transition py-1 whitespace-nowrap"
              >
                Gallery
              </button>
            </li>
          </ul>

          {/* Right: Theme + Contact */}
          <div className="flex gap-4 justify-center sm:justify-end items-center mt-2 sm:mt-0 lg:mr-4 xl:mr-8 2xl:-mr-70">
            <ThemeToggle />
            <div className="animated-link-wrapper">
              <div className="animated-link-effect-2">
                <div />
              </div>
              <button
                onClick={() => onContact?.()}
                className="animated-link-2 text-sm sm:text-base"
              >
                Contact
              </button>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}