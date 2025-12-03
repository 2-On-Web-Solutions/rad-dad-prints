'use client';

import { useEffect, useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { FaFacebook, FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import { supabaseBrowser } from '@/lib/supabase/client';

const FALLBACK_LINKS = [
  { id: 'facebook', url: 'https://www.facebook.com', enabled: true },
  { id: 'instagram', url: 'https://www.instagram.com', enabled: true },
  { id: 'tiktok', url: 'https://www.tiktok.com', enabled: true },
  { id: 'x', url: 'https://x.com', enabled: true },
];

const ICONS = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  x: FaXTwitter,
};

function hoverClass(id) {
  switch (id) {
    case 'facebook':
      return 'hover:text-blue-500';
    case 'instagram':
      return 'hover:text-pink-500';
    case 'tiktok':
      return 'hover:text-gray-400';
    case 'x':
      return 'hover:text-slate-300';
    default:
      return '';
  }
}

export default function Header({ onContact, onOpenGallery }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState(FALLBACK_LINKS);

  useEffect(() => setMounted(true), []);

  // load social links from Supabase
  useEffect(() => {
    async function loadLinks() {
      try {
        const { data, error } = await supabaseBrowser
          .from('site_social_links')
          .select('id,url,enabled,sort_order')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Header social links error', error);
          return;
        }

        if (!data || data.length === 0) return;

        const mapped = data
          .filter((row) => row.url && typeof row.id === 'string')
          .map((row) => ({
            id: row.id,
            url: row.url,
            enabled: !!row.enabled,
          }));

        if (mapped.length > 0) {
          setLinks(mapped);
        }
      } catch (err) {
        console.error('Header social links load error', err);
      }
    }

    loadLinks();
  }, []);

  if (!mounted) return null;

  const activeLinks = links.filter((l) => l.enabled && l.url);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', '/');
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-neutral-800 text-white py-3 px-4 sm:py-4 sm:px-8 lg:px-16 z-50 shadow-md overflow-visible">
      {/* Positioning context for dropdown */}
      <div
        className="rdp-header relative max-w-7xl mx-auto"
        style={{
          '--logo-left': '-300px',
          '--logo-top': '185%', // moved up slightly from 225%
          '--logo-width': '280px',
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

        {/* Nav (flex-wrap lets the md dropdown wrap onto the next line) */}
        <nav
          className="
            max-w-7xl mx-auto flex flex-col sm:flex-row flex-wrap items-center w-full
            gap-x-4 sm:gap-x-10 gap-y-0.5 sm:gap-y-1
            relative
            md:pb-0 md:-mb-2 md:gap-y-0
          "
        >
          {/* ===== Mobile ONLY (≤767px) — logo then hamburger ===== */}
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
              aria-expanded={isOpen}
              aria-controls="tablet-dropdown"
            >
              <FaBars />
            </button>
          </div>

          {/* ===== Tablet ONLY (768–1023px) — hamburger before logo ===== */}
          <div
            data-nav="tablet-top"
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
              aria-expanded={isOpen}
              aria-controls="tablet-dropdown"
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

          {/* ===== Desktop Inline Links ===== */}
          <ul
            data-nav="desktop-links"
            className={`rdp-links flex-col lg:flex-row gap-4 lg:gap-10 xl:gap-20 2xl:gap-40 2xl:-mr-6
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
              <button
                onClick={onOpenGallery}
                className="rdp-navlink transition py-1 whitespace-nowrap"
              >
                Gallery
              </button>
            </li>
          </ul>

          {/* ===== Right: Theme + Contact (top) + Socials (bottom) ===== */}
          <div
            className="
              rdp-tools
              flex flex-col items-end justify-center
              gap-1
              mt-4 -mb-3 sm:mt-0
              md:-mt-4 md:mb-0 md:ml-auto
              lg:mr-4 xl:mr-8 2xl:-mr-74
            "
          >
            {/* Top row: smaller toggle + contact inline */}
            <div className="flex items-center">
              <div className="animated-link-wrapper scale-75 sm:scale-75 mt-1 -mr-3 origin-center">
                <div className="animated-link-effect-2">
                  <div />
                </div>
                <button
                  onClick={() => onContact?.()}
                  className="animated-link-2 text-xs sm:text-sm"
                >
                  Contact
                </button>
              </div>
              <div className="scale-75 sm:scale-80 -mr-3 origin-center">
                <ThemeToggle />
              </div>
            </div>

            {/* Bottom row: Follow us + socials */}
            {activeLinks.length > 0 && (
              <div className="flex items-center -mt-1 mr-1 gap-4 text-[13px] whitespace-nowrap">
                <span className="opacity-70">Follow us on:</span>
                <div className="flex items-center gap-2 text-sm mr-4 sm:text-base">
                  {activeLinks.map((link) => {
                    const Icon = ICONS[link.id];
                    if (!Icon) return null;
                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.id}
                        className={`transition-transform transform hover:scale-110 ${hoverClass(
                          link.id
                        )}`}
                      >
                        <Icon />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== Tablet Dropdown ===== */}
          <div
            id="tablet-dropdown"
            data-nav="tablet-dd"
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
                  onClick={() => {
                    setIsOpen(false);
                    onOpenGallery?.();
                  }}
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