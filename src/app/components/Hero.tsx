'use client';

import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useState, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import {
  Oswald,
  Dancing_Script,
  Roboto_Mono,
  Nunito,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from 'next/font/google';

type MediaKind = 'video' | 'image';
type ThemeKind = 'gradient' | 'solid' | 'custom-gradient' | 'custom-solid';
type FontId = 'sans' | 'script' | 'mono' | 'display' | 'rounded' | 'serif';

type HeroMediaConfig = {
  mainKind: MediaKind;
  mainSrc: string;
  mainLabel: string;
  sideKind: MediaKind;
  sideSrc: string;
  sideLabel: string;
};

type PublicThemeResponse = {
  kind: ThemeKind;
  solidColor?: string | null;
  from?: string | null;
  to?: string | null;
};

type PublicTaglineResponse = {
  main_text?: string | null;
  sub_text?: string | null;
  font_id?: string | null;
};

// These are your undeletable defaults and also our fallback
const DEFAULT_HERO_MEDIA: HeroMediaConfig = {
  mainKind: 'video',
  mainSrc: '/assets/videos/rad-dad-prints-video02.mp4',
  mainLabel: 'Runway hero video',
  sideKind: 'image',
  sideSrc: '/assets/rad-dad-prints.png',
  sideLabel: 'Rad Dad logo loop',
};

/* ====== Fonts for each style option ====== */
const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
const fontScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
const fontMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
const fontDisplay = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
const fontRounded = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});
const fontSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

function isMediaKind(value: unknown): value is MediaKind {
  return value === 'video' || value === 'image';
}

function isFontId(value: unknown): value is FontId {
  return (
    value === 'sans' ||
    value === 'script' ||
    value === 'mono' ||
    value === 'display' ||
    value === 'rounded' ||
    value === 'serif'
  );
}

/* Helper to detect remote URLs (Supabase, etc.) */
function isRemoteSrc(src: string | null | undefined) {
  return !!src && (src.startsWith('http://') || src.startsWith('https://'));
}

/* Pick the actual font object based on font_id */
function getTaglineFont(fontId: FontId | null | undefined) {
  switch (fontId) {
    case 'script':
      return fontScript;
    case 'mono':
      return fontMono;
    case 'display':
      return fontDisplay; // Oswald
    case 'rounded':
      return fontRounded;
    case 'serif':
      return fontSerif;
    case 'sans':
      return fontSans;
    default:
      // 🔹 Fallback to original hero font (Oswald)
      return fontDisplay;
  }
}

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

const mobileLogoClass = [
  'block lg:hidden',
  'relative ipm-logo',
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
  'p-[2px]', // gradient + glow from CSS vars now
].join(' ');

const mobileVideoFrameClass = [
  'relative p-[2px] ipm-video',
  MOBILE_VIDEO.z,
  // gradient + glow from CSS vars now
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

  // Hero media
  const [heroMedia, setHeroMedia] =
    useState<HeroMediaConfig>(DEFAULT_HERO_MEDIA);

  // Tagline + font (defaults match seed copy; font defaults to original Oswald)
  const [heroTagline, setHeroTagline] = useState('YOU THINK IT, WE PRINT IT!');
  const [heroSubline, setHeroSubline] = useState('Custom 3D Printing');
  const [heroFontId, setHeroFontId] = useState<FontId>('display'); // default = Oswald

  const activeFont = getTaglineFont(heroFontId);

  useEffect(() => {
    setMounted(true);

    let cancelled = false;

    async function loadHeroMedia() {
      try {
        const res = await fetch('/api/public/hero-media');
        if (!res.ok) return;

        const data = (await res.json()) as Partial<HeroMediaConfig>;
        if (cancelled || !data) return;

        // Merge server values over the defaults, with some type-safety
        setHeroMedia((prev) => ({
          mainKind: isMediaKind(data.mainKind) ? data.mainKind : prev.mainKind,
          mainSrc: data.mainSrc ?? prev.mainSrc,
          mainLabel: data.mainLabel ?? prev.mainLabel,
          sideKind: isMediaKind(data.sideKind) ? data.sideKind : prev.sideKind,
          sideSrc: data.sideSrc ?? prev.sideSrc,
          sideLabel: data.sideLabel ?? prev.sideLabel,
        }));
      } catch (err) {
        console.error('Failed to load public hero media config', err);
        // On error we silently keep the defaults
      }
    }

    loadHeroMedia();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔹 Load theme from public API and push into CSS vars
  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      try {
        const res = await fetch('/api/public/theme', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as PublicThemeResponse;
        if (cancelled || !data) return;

        const root = document.documentElement;

        const kind: ThemeKind = (data.kind as ThemeKind) ?? 'gradient';

        // base defaults
        let from = '#13c8df';
        let to = '#6b04af'; // corrected fallback
        let mid: string | null = null;

        if (kind === 'solid' || kind === 'custom-solid') {
          const solid = data.solidColor ?? '#432389';
          from = solid;
          to = solid;
        } else {
          from = data.from ?? '#13c8df';
          to = data.to ?? '#6b04af';
        }

        // If this matches the Rad Dad gradient, inject the middle stop
        if (
          (kind === 'gradient' || kind === 'custom-gradient') &&
          from.toLowerCase() === '#13c8df' &&
          to.toLowerCase() === '#6b04af'
        ) {
          mid = '#a78bfa';
        }

        root.style.setProperty('--hero-grad-from', from);
        if (mid) {
          root.style.setProperty('--hero-grad-mid', mid);
        } else {
          root.style.removeProperty('--hero-grad-mid');
        }
        root.style.setProperty('--hero-grad-to', to);

        // 🔥 Glow:
        // - If this is the Rad Dad gradient (we have a mid stop), match original teal glow
        // - Otherwise derive from the "from" color with 0.45 alpha
        if (mid) {
          root.style.setProperty('--hero-glow', 'rgba(19, 200, 223, 0.45)');
        } else {
          const hex = from.replace('#', '');
          if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            root.style.setProperty(
              '--hero-glow',
              `rgba(${r}, ${g}, ${b}, 0.45)`
            );
          } else {
            // Fallback if something unexpected comes through
            root.style.setProperty('--hero-glow', from + '72');
          }
        }
      } catch (err) {
        console.error('Failed to load public theme config', err);
      }
    }

    if (typeof window !== 'undefined') {
      loadTheme();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔹 Load tagline + font from public API
  useEffect(() => {
    let cancelled = false;

    async function loadTagline() {
      try {
        const res = await fetch('/api/public/tagline', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as PublicTaglineResponse | null;
        if (cancelled || !data) return;

        if (data.main_text) {
          setHeroTagline(data.main_text);
        }
        if (data.sub_text) {
          setHeroSubline(data.sub_text);
        }
        if (data.font_id && isFontId(data.font_id)) {
          setHeroFontId(data.font_id);
        }
      } catch (err) {
        console.error('Failed to load public tagline config', err);
      }
    }

    loadTagline();

    return () => {
      cancelled = true;
    };
  }, []);

  // If you ever want light/dark variants for the side tile, branch here
  const logoSrc =
    mounted && theme === 'light'
      ? heroMedia.sideSrc // could point to a light variant later
      : heroMedia.sideSrc;

  // Shared frame + glow style using CSS variables (now supports optional mid stop)
  const frameStyle: CSSProperties = {
    backgroundImage:
      'linear-gradient(90deg, var(--hero-grad-from), var(--hero-grad-mid, var(--hero-grad-to)), var(--hero-grad-to))',
    boxShadow: '0 0 35px var(--hero-glow)',
  };

  const pillStyle: CSSProperties = {
    backgroundImage:
      'linear-gradient(90deg, var(--hero-grad-from), var(--hero-grad-mid, var(--hero-grad-to)), var(--hero-grad-to))',
    boxShadow: '0 0 28px var(--hero-glow)',
  };

  return (
    <section
      className="
        ipm-scope
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

      {/* MEDIA (video/image + optional logo/side tile) */}
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
        {/* Mobile logo tile (uses side media config) */}
        <div className={mobileLogoClass} style={frameStyle}>
          <div className="relative h-full w-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
            {heroMedia.sideKind === 'video' ? (
              <video
                src={heroMedia.sideSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="block h-full w-full object-contain"
              />
            ) : isRemoteSrc(logoSrc) ? (
              <img
                src={logoSrc}
                alt={heroMedia.sideLabel}
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src={logoSrc}
                alt={heroMedia.sideLabel}
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
        </div>

        {/* Main hero frame */}
        <div className={mobileVideoFrameClass} style={frameStyle}>
          <div className="h-full w-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
            {heroMedia.mainKind === 'video' ? (
              <video
                src={heroMedia.mainSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className={`block h-full w-full ${MOBILE_VIDEO.fit} lg:object-contain`}
              />
            ) : isRemoteSrc(heroMedia.mainSrc) ? (
              <img
                src={heroMedia.mainSrc}
                alt={heroMedia.mainLabel}
                className={`h-full w-full ${MOBILE_VIDEO.fit} lg:object-contain`}
              />
            ) : (
              <Image
                src={heroMedia.mainSrc}
                alt={heroMedia.mainLabel}
                fill
                className={`object-contain ${MOBILE_VIDEO.fit} lg:object-contain`}
                priority
              />
            )}
          </div>

          {/* Floating side tile (desktop only) */}
          <div
            className="
              ipm-right-tile
              hidden lg:block
              absolute left-full -top-20 -ml-20
              p-[2px]
              w-[420px] h-[320px]
            "
            style={frameStyle}
          >
            <div className="relative h-full w-full overflow-hidden bg-neutral-800 dark:bg-black shadow-2xl">
              {heroMedia.sideKind === 'video' ? (
                <video
                  src={heroMedia.sideSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="block h-full w-full object-contain"
                />
              ) : isRemoteSrc(logoSrc) ? (
                <img
                  src={logoSrc}
                  alt={heroMedia.sideLabel}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={logoSrc}
                  alt={heroMedia.sideLabel}
                  fill
                  className="object-contain"
                  priority
                />
              )}
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
            ${activeFont.className}
            text-base sm:text-2xl md:text-3xl
            tracking-wide sm:tracking-wider
            leading-tight
            uppercase
          `}
        >
          <span className="text-[var(--color-foreground)]">
            {heroTagline}
          </span>
          <br />
          {/* Staggered bottom line – nudged slightly to the right */}
          <span
            className="
              inline-block
              relative left-2 sm:left-3 md:left-4
              text-[var(--color-foreground)]
            "
          >
            {heroSubline}
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
        <div
          className="ipm-cc inline-block p-[1.5px] rounded-full"
          style={pillStyle}
        >
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

        <p className="text-[10px] sm:text-sm text-neutral-700 dark:text-neutral-500 text-center leading-snug max-w-[220px] sm:max-w-[340px] mx-auto">
          Upload, customize &amp; export for 3D print —
          <br className="hidden sm:block" />
          then request a quote.
        </p>
      </motion.div>
    </section>
  );
}