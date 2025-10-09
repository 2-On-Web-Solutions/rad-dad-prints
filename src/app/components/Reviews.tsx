'use client'

import { FaFacebook, FaInstagram, FaTiktok, FaStar } from 'react-icons/fa'

export default function Reviews() {
  const reviews = [
    {
      name: 'Sarah M.',
      text: 'Amazing print quality and fast turnaround! My custom project came out better than expected.',
      rating: 5,
    },
    {
      name: 'Jason L.',
      text: 'Great communication and attention to detail. Highly recommend Rad Dad Prints!',
      rating: 5,
    },
    {
      name: 'Emily T.',
      text: 'Affordable and professional service. I’ll definitely be ordering again soon.',
      rating: 4,
    },
  ]

  return (
    <section id="reviews" className="py-20 px-4 sm:px-8 lg:px-16 max-w-[1100px] mx-auto text-center">
      <h2 className="text-4xl font-semibold mb-6 text-[var(--color-foreground)]">Customer Reviews</h2>
      <p className="text-lg text-[var(--color-foreground)]/70 mb-10">
        Hear what our customers have to say about their 3D printing experience!
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {reviews.map(({ name, text, rating }) => (
          <div
            key={name}
            className="bg-[var(--color-background)] border border-[var(--color-foreground)]/10 rounded-lg shadow-md p-6 transition hover:shadow-lg"
          >
            <div className="flex justify-center mb-3 text-yellow-400">
              {[...Array(rating)].map((_, i) => (
                <FaStar key={i} />
              ))}
            </div>
            <p className="text-[var(--color-foreground)]/90 italic mb-4">“{text}”</p>
            <p className="font-semibold text-[var(--color-foreground)]">— {name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}