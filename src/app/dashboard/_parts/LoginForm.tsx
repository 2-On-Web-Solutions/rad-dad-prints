/**
 * /src/app/dashboard/_parts/LoginForm.tsx
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client'; // ✅ correct import
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(false);
    setLoading(true);

    const supabase = supabaseBrowser; // ✅ use the browser client instance

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // ✅ Success — refresh session and UI
    setSuccess(true);
    setEmail('');
    setPassword('');

    // optional short delay for user feedback
    setTimeout(() => {
      router.refresh();
    }, 800);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email */}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 outline-none focus:border-white/40"
      />

      {/* Password */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 outline-none focus:border-white/40"
      />

      {/* Forgot password link */}
      <div className="text-right text-sm">
        <Link
          href="#"
          className="text-blue-400 hover:underline opacity-80"
        >
          Forgot password?
        </Link>
      </div>

      {/* Messages */}
      {err && (
        <p className="text-red-400 text-sm -mt-2">{err}</p>
      )}
      {success && (
        <p className="text-green-400 text-sm -mt-2">
          Login successful!
        </p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl border border-white/20 py-2 hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>

        <a
          href="/"
          className="flex-1 text-center rounded-xl border border-teal-400/40 py-2 hover:bg-teal-400/10"
        >
          Return Home
        </a>
      </div>
    </form>
  );
}