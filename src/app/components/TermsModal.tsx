'use client'

import { useEffect } from 'react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
        <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 text-sm leading-relaxed pr-2">
          <p>
            Welcome to Rad Dad Prints. By using our website and services, you agree to the following terms:
          </p>
          <p>
            All 3D prints are produced based on the files and specifications provided by the client. 
            We are not responsible for errors or defects in submitted models, including geometry or sizing issues.
          </p>
          <p>
            Quotes are estimates and may vary based on print time, materials, finishing requirements, or unforeseen issues. 
            Final costs will be confirmed prior to production.
          </p>
          <p>
            Clients are responsible for ensuring they have the right to reproduce any designs submitted. 
            Rad Dad Prints does not assume liability for copyright or trademark violations.
          </p>
          <p>
            We cannot guarantee delivery dates in cases of equipment failure, supply delays, or other factors beyond our control. 
            We will communicate any delays as soon as possible.
          </p>
          <p>
            Payment is required before production begins unless otherwise arranged. Finished prints remain the property of Rad Dad Prints until payment is received in full.
          </p>
          <p>
            These terms may be updated periodically. Continued use of our services means you agree to the latest version.
          </p>
        </div>
      </div>
    </div>
  )
}