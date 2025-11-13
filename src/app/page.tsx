'use client';

import { useState, useEffect } from 'react';
import './styles/animated-button.css';
import './styles/effects.css';
import './globals.css';

import Header from './components/Header';
import Hero from './components/Hero';
import ContactModal from './components/ContactModal';
import PrintDesign from './components/PrintDesign';
import BundlesPackages from './components/BundlesPackages';
import Services from './components/Services';
import Reviews from './components/Reviews';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';

import GalleryModal, {
  type GalleryItem,
} from './components/GalleryModal';

export default function Home() {
  // contact modal
  const [showModal, setShowModal] = useState(false);

  // gallery modal
  const [showGallery, setShowGallery] = useState(false);

  // SSR-safe mount flag for sections that rely on browser-only stuff
  const [mounted, setMounted] = useState(false);

  // gallery items pulled from Supabase
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // fetch published media for gallery on mount
  useEffect(() => {
    async function loadGallery() {
      setGalleryLoading(true);
      try {
        const res = await fetch('/api/media/gallery', {
          method: 'GET',
        });

        if (!res.ok) {
          console.error('Failed to load gallery:', await res.text());
          return;
        }

        const json = await res.json();
        // expecting { media: [{ id, url, caption }] }
        setGalleryItems(json.media ?? []);
      } catch (err) {
        console.error('Error fetching gallery:', err);
      } finally {
        setGalleryLoading(false);
      }
    }

    loadGallery();
  }, []);

  // mark client mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 font-[var(--font-geist-sans)] overflow-hidden transition-colors duration-500">
      {/* HEADER (opens both Contact + Gallery modals) */}
      <Header
        onContact={() => setShowModal(true)}
        onOpenGallery={() => setShowGallery(true)}
      />

      <Hero />

      <hr className="rdp-hr my-16" aria-hidden="true" />
      <PrintDesign />
      <hr className="rdp-hr my-16" aria-hidden="true" />
      <BundlesPackages />
      <hr className="rdp-hr my-16" aria-hidden="true" />

      {/* CONTACT MODAL */}
      {showModal && (
        <ContactModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* GALLERY MODAL */}
      <GalleryModal
        open={showGallery}
        items={galleryItems}
        startIndex={0}
        onClose={() => setShowGallery(false)}
      />

      {/* Rest of the marketing content (stuff that's fine to delay until after mount) */}
      {mounted && (
        <>
          <Services />
          <hr className="rdp-hr my-16" aria-hidden="true" />
          <Reviews />
          <Footer />
        </>
      )}

      {/* Floating chat widget bottom-right */}
      <ChatWidget />

      {/* Optional debug info while building */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-3 left-3 text-[10px] text-white/40 font-mono pointer-events-none select-none">
          {galleryLoading
            ? 'Loading gallery…'
            : `Gallery items: ${galleryItems.length}`}
        </div>
      )}
    </div>
  );
}