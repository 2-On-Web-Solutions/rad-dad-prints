// src/app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const esc = (s = '') =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))

export async function POST(req: Request) {
  try {
    const { name = '', email = '', subject = '', message = '', token = '' } = await req.json()

    // 1) Turnstile verify
    const secretKey = process.env.TURNSTILE_SECRET_KEY
    if (!secretKey) {
      console.error('❌ Missing TURNSTILE_SECRET_KEY.')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }
    const formData = new URLSearchParams({ secret: secretKey, response: token })
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    })
    const verification = await verifyRes.json()
    if (!verification?.success) {
      console.warn('⚠️ Turnstile verification failed:', verification)
      return NextResponse.json({ error: 'Failed Turnstile verification' }, { status: 400 })
    }

    // 2) Mail setup
    const apiKey = process.env.RESEND_API_KEY
    const toEnv = process.env.CONTACT_TO
    if (!apiKey || !toEnv) {
      console.error('❌ Missing RESEND_API_KEY or CONTACT_TO.')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // allow comma-separated recipients
    const to: string[] = toEnv.split(',').map(s => s.trim()).filter(Boolean)

    // use your verified domain sender
    const from = process.env.CONTACT_FROM || 'Rad Dad Prints <contact@raddadprints.ca>'
    const subj = subject?.trim() || 'New message from Rad Dad Prints contact form'

    // 3) Send
    const { data, error } = await resend.emails.send({
      from,
      to,
      // @ts-expect-error: reply_to not yet in type defs but valid for Resend API
      reply_to: email || undefined,          // <-- snake_case
      subject: subj,
      text: `New contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subj}

Message:
${message}
`,
      html: `
        <table style="max-width:640px;width:100%;font-family:Arial,Helvetica,sans-serif">
          <tr><td>
            <h2 style="margin:0 0 12px 0">New Contact Form Submission</h2>
            <p><b>Name:</b> ${esc(name)}</p>
            <p><b>Email:</b> ${esc(email)}</p>
            <p><b>Subject:</b> ${esc(subj)}</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
            <div style="white-space:pre-wrap;line-height:1.6">${esc(message)}</div>
          </td></tr>
        </table>
      `,
    })

    console.log('📩 RESEND RESPONSE:', { id: data?.id, error })
    if (error) {
      console.error('❌ Email send failed:', error)
      return NextResponse.json({ error: 'Email send failed', details: error }, { status: 502 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('❌ Contact route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}