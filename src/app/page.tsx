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
import Footer from './components/Footer';
import GalleryModal from './components/GalleryModal';
import ChatWidget from './components/ChatWidget'; // 👈 Added import
import Reviews from './components/Reviews'

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Static image list for now (will later come from DB)
  const galleryImages = [
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
    '/assets/rad-dad-prints.png',
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

      <hr className="rdp-hr my-16" aria-hidden="true" />
      <PrintDesign />
      <hr className="rdp-hr my-16" aria-hidden="true" />
      <BundlesPackages />
      <hr className="rdp-hr my-16" aria-hidden="true" />

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
          <hr className="rdp-hr my-16" aria-hidden="true" />
          <Reviews />
          <Footer />
        </>
      )}

      {/* 👇 Fixed bottom-right chatbot */}
      <ChatWidget />
    </div>
  );
}