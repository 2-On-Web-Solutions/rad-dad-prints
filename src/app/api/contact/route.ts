// src/app/api/contact/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const esc = (s = '') =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// Robust ticket id: UTC timestamp + short random
function makeTicketId() {
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const stamp =
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${stamp}-${rnd}`; // e.g. 20251009-142310-K9F3
}

export async function POST(req: Request) {
  try {
    // ---------- 1) Read multipart form ----------
    const form = await req.formData();

    const name    = String(form.get('name') || '');
    const email   = String(form.get('email') || '');
    const subject = String(form.get('subject') || '');
    const message = String(form.get('message') || '');
    const token   = String(form.get('token') || '');

    // ---------- 2) Turnstile verify ----------
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY || '',
        response: token,
        remoteip: (req.headers.get('x-forwarded-for') || '').split(',')[0] ?? '',
      }),
    });
    const verify = await verifyRes.json();
    if (!verify?.success) {
      return NextResponse.json({ success: false, error: 'Turnstile verification failed' }, { status: 400 });
    }

    // ---------- 3) Collect attachments ----------
    const files = form.getAll('files');
    const attachments: { filename: string; content: string }[] = [];
    for (const v of files) {
      if (v instanceof File) {
        const buf = Buffer.from(await v.arrayBuffer());
        attachments.push({
          filename: v.name,
          content: buf.toString('base64'), // Resend expects base64
        });
      }
    }

    // ---------- 4) Prepare recipients / subjects / headers ----------
    const toList: string[] = (process.env.CONTACT_TO || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!toList.length) {
      console.error('No CONTACT_TO configured.');
      return NextResponse.json({ success: false, error: 'Server misconfiguration' }, { status: 500 });
    }

    const fromStaff = process.env.CONTACT_FROM || 'Rad Dad Prints <onboarding@resend.dev>';
    const fromAuto  = process.env.CONTACT_AUTO_FROM || fromStaff; // use a no-reply if you configure one

    const ticketId = makeTicketId();

    // Subjects designed to prevent cross-customer threading
    const staffSubject = `[RDP #${ticketId}] ${subject || 'New message'}`;
    const autoSubject  = `We got your message — Rad Dad Prints (Ref #${ticketId})`;

    // Helpful custom header for filters/automation
    const ticketHeaders = { 'X-RDP-Ticket': ticketId };

    // ---------- 5) Send primary email to your team ----------
    const staffText = `New contact form submission (Ref #${ticketId})

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
`;

    const staffHtml = `
      <table style="max-width:640px;width:100%;font-family:Arial,Helvetica,sans-serif">
        <tr><td>
          <h2 style="margin:0 0 12px 0">New Contact Form Submission</h2>
          <p><b>Ref #:</b> ${ticketId}</p>
          <p><b>Name:</b> ${esc(name)}</p>
          <p><b>Email:</b> ${esc(email)}</p>
          <p><b>Subject:</b> ${esc(subject)}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:16px 0" />
          <div style="white-space:pre-wrap;line-height:1.6">${esc(message)}</div>
        </td></tr>
      </table>
    `;

    const { data: primaryData, error: primaryErr } = await resend.emails.send({
      from: fromStaff,
      to: toList, // string[]
      // @ts-expect-error reply_to is supported by Resend but not yet typed
      reply_to: email || undefined,       // replies from your team go to the customer
      subject: staffSubject,
      text: staffText,
      html: staffHtml,
      attachments,
      headers: ticketHeaders,             // metadata for filtering
      // NOTE: Do NOT set In-Reply-To/References for a brand-new ticket message
    });

    if (primaryErr) {
      console.error('Resend error (primary):', primaryErr);
      return NextResponse.json({ success: false, error: 'Email send failed' }, { status: 502 });
    }

    // ---------- 6) Autoresponder to the sender (separate thread) ----------
    const looksLikeEmail = /\S+@\S+\.\S+/.test(email);
    if (looksLikeEmail) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://raddadprints.ca';
      const logoUrl = `${siteUrl}/assets/rad-dad-prints.png`;

      const autoText = `Hi ${name || 'there'},

Thanks for contacting Rad Dad Prints! We’ve received your message.
Your reference number is: ${ticketId}.

A team member will follow up within 1–2 business days.

— Rad Dad Prints
${siteUrl}
`;

      const autoresponderHtml = `
        <table role="presentation" width="100%" style="font-family:Arial,Helvetica,sans-serif;background:#0f0f10;color:#f5f5f5;padding:24px 0">
          <tr>
            <td align="center">
              <table role="presentation" width="600" style="max-width:600px;width:100%;background:#141416;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden">
                <tr>
                  <td style="padding:24px 24px 8px 24px;text-align:center">
                    <img src="${logoUrl}" alt="Rad Dad Prints" width="160" style="display:block;margin:0 auto 8px auto"/>
                    <h2 style="margin:8px 0 0 0;font-size:22px;font-weight:700;color:#ffffff">Thanks for reaching out!</h2>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 16px 24px">
                    <p style="margin:0;color:#d3d3d3;line-height:1.6">
                      Hi ${esc(name) || 'there'},<br/><br/>
                      We’ve received your message. Your reference number is <b>${ticketId}</b>.<br/>
                      A team member will follow up within <b>1–2 business days</b>.<br/><br/>
                      For your privacy, please wait for our reply before sharing any sensitive details.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px 24px 24px;text-align:center">
                    <a href="${siteUrl}" style="display:inline-block;background:#6d44ff;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px">Visit our site</a>
                  </td>
                </tr>
                <tr>
                  <td style="background:#0e0f12;padding:16px 24px;text-align:center;color:#a9a9b3;font-size:12px">
                    <div>Follow us</div>
                    <div style="margin-top:8px">
                      <a href="https://www.instagram.com/" style="color:#a9a9b3;margin:0 8px;text-decoration:none">Instagram</a> •
                      <a href="https://www.facebook.com/"  style="color:#a9a9b3;margin:0 8px;text-decoration:none">Facebook</a> •
                      <a href="https://x.com/"              style="color:#a9a9b3;margin:0 8px;text-decoration:none">X</a>
                    </div>
                    <div style="margin-top:10px">© ${new Date().getFullYear()} Rad Dad Prints</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `;

      try {
        await resend.emails.send({
          from: fromAuto,        // ideally no-reply@… (verified)
          to: email,             // customer
          subject: autoSubject,
          text: autoText,
          html: autoresponderHtml,
          headers: {
            ...ticketHeaders,                 // same ref for your filters
            'Auto-Submitted': 'auto-replied', // hints for MTAs
            'X-Auto-Response-Suppress': 'All',
            'Precedence': 'bulk',
          },
          // IMPORTANT: do NOT set reply_to here (we don't invite replies to auto email)
          // Also omit In-Reply-To/References so this becomes its own clean thread.
        });
      } catch (e) {
        // Don't fail the API if the autoresponder fails
        console.error('Autoresponder error:', e);
      }
    }

    return NextResponse.json({ success: true, id: primaryData?.id, ticket: makeTicketId });
  } catch (err) {
    console.error('contact route error', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}