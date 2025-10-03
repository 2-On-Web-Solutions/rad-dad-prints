'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-neutral-800 rounded-full">
      <FaSun className="text-white-300" size={14} />
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="relative w-10 h-5 bg-neutral-600 rounded-full transition-colors duration-300 ease-in-out focus:outline-none"
        aria-label="Toggle Theme"
      >
        <span
          className={`absolute top-[2px] left-[2px] w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            isDark ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <FaMoon className="text-white-300" size={14} />
    </div>
  )
}