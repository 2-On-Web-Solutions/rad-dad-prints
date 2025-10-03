'use client'

import { useState, useEffect } from 'react'
import './styles/animated-button.css'
import './styles/effects.css'
import './globals.css'
import Header from './components/Header'
import Hero from './components/Hero'
import WavesEffect from './components/WaveEffects'
import ContactModal from './components/ContactModal'
import Footer from './components/Footer'

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20 font-[var(--font-geist-sans)] overflow-hidden transition-colors duration-500">
      <Header onContact={() => setShowModal(true)} />
      <Hero />
      {mounted && <WavesEffect />}
      {showModal && <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />}
      {mounted && (
        <>
          <Footer />
        </>
      )}
    </div>
  )
}