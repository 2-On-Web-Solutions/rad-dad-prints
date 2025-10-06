'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { FaTimes } from 'react-icons/fa'

// Type declaration for Turnstile window object
declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          theme?: 'auto' | 'light' | 'dark'
          appearance?: 'always' | 'execute' | 'interaction-only'
          callback: (token: string) => void
        }
      ) => void
    }
  }
}

export default function ContactModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  // Re-render Turnstile widget each time modal opens
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      const container = document.querySelector('.cf-turnstile') as HTMLElement | null
      if (container && window.turnstile) {
        container.innerHTML = '' // Clear old widget instance
        window.turnstile.render(container, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          theme: 'auto',
          appearance: 'always', // force visible widget
          callback: (t: string) => {
            console.log('✅ Turnstile token:', t)
            setToken(t)
          },
        })
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [isOpen])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      alert('Please complete the human verification.')
      return
    }

    try {
      setIsSending(true)

      // ✅ Send to our custom Next.js route instead of Formspree
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          token, // send Turnstile token for backend verification
        }),
      })

      const data = await res.json()

      if (res.ok && data?.success) {
        setIsSubmitted(true)
        setFormData({ name: '', email: '', subject: '', message: '' })
        setToken(null)
      } else {
        alert(data?.error || 'Error sending message.')
      }
    } catch (err) {
      console.error('❌ Error submitting contact form:', err)
      alert('An error occurred while sending your message.')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
      />

      <div className="bg-neutral-900 dark:bg-neutral-900 text-white dark:text-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-lg">
          <FaTimes />
        </button>

        {!isSubmitted ? (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center font-dancing">
              Let&rsquo;s Work Together
            </h2>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                className="p-2 rounded bg-neutral-800 dark:bg-neutral-800"
                value={formData.name}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                className="p-2 rounded bg-neutral-800 dark:bg-neutral-800"
                value={formData.email}
                onChange={handleChange}
              />
              <select
                name="subject"
                required
                className="p-2 rounded bg-neutral-800 dark:bg-neutral-800"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="">Select Subject</option>
                <option value="Custom 3D Print">Custom 3D Print</option>
                <option value="Prototype / Part">Prototype / Part</option>
                <option value="Resin Miniatures">Resin Miniatures</option>
                <option value="Bulk / Bundle Quote">Bulk / Bundle Quote</option>
                <option value="3D Model Help">3D Model Help</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                name="message"
                rows={4}
                placeholder="Your Message"
                required
                className="p-2 rounded bg-neutral-800 dark:bg-neutral-800"
                value={formData.message}
                onChange={handleChange}
              />

              {/* Cloudflare Turnstile placeholder */}
              <div className="cf-turnstile my-2 flex justify-center" style={{ minHeight: 66 }} />
              <p className="text-xs text-gray-400">
                {token ? 'Human verification complete ✓' : 'Please verify you’re human.'}
              </p>

              <div className="animated-link-wrapper self-center">
                <div className="animated-link-effect-2"><div></div></div>
                <button
                  type="submit"
                  className="animated-link"
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-dancing mb-4">Thank you!</h2>
            <p className="mb-6">
              Your message has been sent. We&rsquo;ll get back to you soon.
            </p>
            <div className="animated-link-wrapper self-center">
              <div className="animated-link-effect"><div></div></div>
              <button onClick={onClose} className="animated-link">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}