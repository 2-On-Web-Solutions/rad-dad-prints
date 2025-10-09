'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  src: string
  poster?: string
  title?: string
  className?: string
}

export default function VideoShowcase({
  src,
  poster,
  title,
  className = '',
}: Props) {
  const vidRef = useRef<HTMLVideoElement | null>(null)
  const [aspect, setAspect] = useState<string>('1 / 1') // default to square

  const handleMeta = () => {
    const v = vidRef.current
    if (v && v.videoWidth && v.videoHeight) {
      setAspect(`${v.videoWidth} / ${v.videoHeight}`)
    }
  }

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${className}`}
    >
      {/* Border */}
      <div className="relative p-[2px] bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#13c8df] shadow-[0_0_25px_rgba(19,200,223,0.35)]">
        {/* Square container (no rounded corners) */}
        <div
          className="overflow-hidden bg-black shadow-2xl"
          style={{ aspectRatio: aspect }}
        >
          <video
            ref={vidRef}
            src={src}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={handleMeta}
            className="block w-full h-full object-contain bg-black"
          />
        </div>
      </div>

      {title && (
        <figcaption className="absolute left-4 bottom-3 text-sm text-white/90">
          {title}
        </figcaption>
      )}
    </motion.figure>
  )
}