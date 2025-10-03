'use client'

import { useState } from 'react'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <>
      <footer className="py-8 px-4 text-center text-sm text-[var(--color-foreground)]/60">
        <hr className="border-t border-[var(--color-foreground)]/10 mb-6" />
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