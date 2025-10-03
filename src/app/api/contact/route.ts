import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, email, subject, message, token } = await req.json()

  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.error('❌ Missing TURNSTILE_SECRET_KEY in environment variables.')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const formData = new URLSearchParams()
  formData.append('secret', secretKey)
  formData.append('response', token)

  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })

    const verification = await verifyRes.json()

    if (!verification.success) {
      console.warn('⚠️ Turnstile verification failed:', verification)
      return NextResponse.json({ error: 'Failed Turnstile verification' }, { status: 400 })
    }

    console.log('✅ Turnstile passed:', { name, email, subject, message })

    // Optionally: send email, store in DB, etc.

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ Error verifying Turnstile:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}