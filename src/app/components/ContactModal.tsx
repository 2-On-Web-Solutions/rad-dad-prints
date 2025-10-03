'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { FaTimes } from 'react-icons/fa'

//Type declaration for Turnstile window object
declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: {
        sitekey: string
        theme: string
        callback: (token: string) => void
      }) => void
    }
  }
}

export default function ContactModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  //Re-render Turnstile widget on every open
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      const container = document.querySelector('.cf-turnstile') as HTMLElement | null
      if (container && window.turnstile) {
        container.innerHTML = '' // Clear old widget
        window.turnstile.render(container, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          theme: 'auto',
          callback: (token: string) => {
            console.log('Verified token:', token)
          }
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

    const token = (document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement)?.value
    if (!token) {
      alert('Please complete the human verification.')
      return
    }

    try {
      const res = await fetch("https://formspree.io/f/xwplyokp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      })

      if (res.ok) {
        setIsSubmitted(true)
      } else {
        alert('Error sending message.')
      }
    } catch {
      alert('Error sending message.')
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
            <h2 className="text-2xl font-semibold mb-6 text-center font-dancing">Let&rsquo;s Work Together</h2>
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
                <option value="UX/UI Design">UX/UI Design</option>
                <option value="Web Development">Web Development</option>
                <option value="SEO - Search Engine Optimization">SEO - Search Engine Optimization</option>
                <option value="App Development">App Development</option>
                <option value="Bug Fix / Support">Bug Fix / Support</option>
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

              <div className="cf-turnstile my-2 ml-18" />

              <div className="animated-link-wrapper self-center">
                <div className="animated-link-effect"><div></div></div>
                <button type="submit" className="animated-link">Send Message</button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-dancing mb-4">Thank you!</h2>
            <p className="mb-6">Your message has been sent. We&rsquo;ll get back to you soon.</p>
            <div className="animated-link-wrapper self-center">
              <div className="animated-link-effect"><div></div></div>
              <button onClick={onClose} className="animated-link">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}