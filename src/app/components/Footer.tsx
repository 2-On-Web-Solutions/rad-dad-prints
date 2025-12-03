'use client';

import { useEffect, useState } from 'react';
import { FaFacebook, FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6';
import TermsModal from './TermsModal';
import PrivacyModal from './PrivacyModal';
import { supabaseBrowser } from '@/lib/supabase/client';

type SocialLinkId = 'facebook' | 'instagram' | 'tiktok' | 'x';

type SocialLinkRow = {
  id: SocialLinkId;
  url: string | null;
  enabled: boolean | null;
  sort_order: number | null;
};

type SocialLink = {
  id: SocialLinkId;
  url: string;
  enabled: boolean;
};

const FALLBACK_LINKS: SocialLink[] = [
  { id: 'facebook', url: 'https://www.facebook.com', enabled: true },
  { id: 'instagram', url: 'https://www.instagram.com', enabled: true },
  { id: 'tiktok', url: 'https://www.tiktok.com', enabled: true },
  { id: 'x', url: 'https://x.com', enabled: true },
];

const ICONS: Record<SocialLinkId, typeof FaFacebook> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  x: FaXTwitter,
};

function hoverClass(id: SocialLinkId) {
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

export default function Footer() {
  const [links, setLinks] = useState<SocialLink[]>(FALLBACK_LINKS);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    async function loadLinks() {
      try {
        const { data, error } = await supabaseBrowser
          .from('site_social_links')
          .select('id,url,enabled,sort_order')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error loading site_social_links', error);
          return;
        }

        if (!data || data.length === 0) return;

        const mapped: SocialLink[] = (data as SocialLinkRow[])
          .filter((row) => row.url && typeof row.id === 'string')
          .map((row) => ({
            id: row.id,
            url: row.url ?? '',
            enabled: !!row.enabled,
          }));

        if (mapped.length > 0) {
          setLinks(mapped);
        }
      } catch (err) {
        console.error('Footer social links load error', err);
      }
    }

    void loadLinks();
  }, []);

  const activeLinks = links.filter((l) => l.enabled && l.url);

  return (
    <>
      <footer className="py-12 px-4 text-center text-sm text-[var(--color-foreground)]/60">
        <hr className="border-t border-[var(--color-foreground)]/10 mb-6" />

        {/* Social icons */}
        {activeLinks.length > 0 && (
          <div className="flex justify-center gap-8 text-3xl mb-6 text-[var(--color-foreground)]/70">
            {activeLinks.map((link) => {
              const Icon = ICONS[link.id];
              const label =
                link.id === 'x'
                  ? 'X (Twitter)'
                  : link.id.charAt(0).toUpperCase() + link.id.slice(1);

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`transition-transform transform hover:scale-110 ${hoverClass(
                    link.id
                  )}`}
                >
                  <Icon />
                </a>
              );
            })}
          </div>
        )}

        {/* Copyright + Legal Links */}
        <p className="mb-2">
          &copy; {new Date().getFullYear()} Rad Dad Prints. All rights reserved.
        </p>

        <div className="space-x-4">
          <button
            onClick={() => setShowTerms(true)}
            className="hover:underline cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            onClick={() => setShowPrivacy(true)}
            className="hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>

        <p className="mt-4 opacity-50">Built with ❤️ by 2 On Web Solutions</p>
      </footer>

      {/* Modals */}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  );
}