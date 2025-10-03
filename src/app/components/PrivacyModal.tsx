'use client'

import { useEffect } from 'react'

interface PrivacyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[var(--color-background)] text-[var(--color-foreground)] max-w-2xl w-full p-6 rounded-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl text-[var(--color-foreground)] hover:text-purple-700"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 text-sm leading-relaxed pr-2">
          <p>
            At Rad Dad Prints, your privacy is important to us. We only collect personal information you voluntarily
            provide, such as your name, email, and project details when requesting a quote or placing an order.
          </p>
          <p>
            Any design files you upload (such as images or 3D models) are used solely to prepare your quote and produce
            your prints. We do not share, sell, or reuse your files for any purpose outside of your project.
          </p>
          <p>
            We use your contact information only to communicate with you about your order or inquiry. We do not sell or
            distribute your personal data to third parties.
          </p>
          <p>
            Our website may use basic cookies or analytics tools to improve performance and the user experience. These
            do not collect sensitive personal data without your consent.
          </p>
          <p>
            You have the right to request access to, correction of, or deletion of your personal data by contacting us
            directly. We aim to stay compliant with applicable privacy regulations.
          </p>
          <p>
            This Privacy Policy may be updated from time to time. Continued use of our services means you agree to the
            most recent version.
          </p>
        </div>
      </div>
    </div>
  )
}