'use client'

import { useState } from 'react'
import { FaFacebook, FaInstagram, FaTiktok, FaXTwitter } from 'react-icons/fa6'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <>
      <footer className="py-12 px-4 text-center text-sm text-[var(--color-foreground)]/60">
        <hr className="border-t border-[var(--color-foreground)]/10 mb-6" />

        {/* 🌐 Social Media Icons */}
        <div className="flex justify-center gap-8 text-3xl mb-6 text-[var(--color-foreground)]/70">
          <a
            href="https://www.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500 transition-transform transform hover:scale-110"
            aria-label="Facebook"
          >
            <FaFacebook />
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition-transform transform hover:scale-110"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
          <a
            href="https://www.tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-transform transform hover:scale-110"
            aria-label="TikTok"
          >
            <FaTiktok />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-transform transform hover:scale-110"
            aria-label="X (Twitter)"
          >
            <FaXTwitter />
          </a>
        </div>

        {/* Copyright + Legal Links */}
        <p className="mb-2">
          &copy; {new Date().getFullYear()} Rad Dad Prints. All rights reserved.
        </p>

        <div className="space-x-4">
          <button onClick={() => setShowTerms(true)} className="hover:underline cursor-pointer">
            Terms of Service
          </button>
          <button onClick={() => setShowPrivacy(true)} className="hover:underline cursor-pointer">
            Privacy Policy
          </button>
        </div>

        <p className="mt-4 opacity-50">Built with ❤️ by 2 On Web Solutions</p>
      </footer>

      {/* Modals */}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  )
}