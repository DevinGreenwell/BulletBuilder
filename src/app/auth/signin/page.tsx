'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import BrandLogo from '@/components/BrandLogo';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn('email', { email, callbackUrl: '/' });
    setSent(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <BrandLogo size={64} withText />
      {sent ? (
        <p className="mt-6 text-center">
          Check your inbox for the magic link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 w-80">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-white"
          >
            Send magic link
          </button>
        </form>
      )}
    </main>
  );
}
