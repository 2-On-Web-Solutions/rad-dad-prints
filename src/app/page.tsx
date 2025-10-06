'use client';

import { useState, useEffect } from 'react';
import './styles/animated-button.css';
import './styles/effects.css';
import './globals.css';
import Header from './components/Header';
import Hero from './components/Hero';
import WavesEffect from './components/WaveEffects';
import ContactModal from './components/ContactModal';
import PrintDesign from './components/PrintDesign';
import BundlesPackages from './components/BundlesPackages';
import Services from './components/Services';
import Footer from './components/Footer';
import GalleryModal from './components/GalleryModal';

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [mounted, setMounted] = useState(false);

  //Static image list for now (will later come from DB)
  const galleryImages = [
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 font-[var(--font-geist-sans)] overflow-hidden transition-colors duration-500">
      {/* Header now opens both Contact & Gallery modals */}
      <Header
        onContact={() => setShowModal(true)}
        onOpenGallery={() => setShowGallery(true)}
      />

      <Hero />

      <hr className="w-full border-t border-[var(--color-foreground)] opacity-30 my-16 transition-colors" />
      <PrintDesign />
      <hr className="w-full border-t border-[var(--color-foreground)] opacity-30 my-16 transition-colors" />
      <BundlesPackages />
      <hr className="w-full border-t border-[var(--color-foreground)] opacity-30 my-16 transition-colors" />

      {mounted && <WavesEffect />}

      {/* Contact Modal */}
      {showModal && <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />}

      {/* Gallery Modal */}
      <GalleryModal
        open={showGallery}
        images={galleryImages}
        onClose={() => setShowGallery(false)}
      />

      {mounted && (
        <>
          <Services />
          <hr className="w-full border-t border-[var(--color-foreground)] opacity-30 my-16 transition-colors" />
          <Footer />
        </>
      )}
    </div>
  );
}