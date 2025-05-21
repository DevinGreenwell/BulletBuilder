'use client';

import Link from 'next/link';

/**
 * Shown after a magic‑link or password‑reset request.
 * Now that production e‑mail flows through Resend, we no longer
 * point users at the Ethereal dev inbox.
 */
export default function VerifyRequestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="mb-4 text-2xl font-semibold">Check your email</h1>
      <p className="mb-6">
        We’ve sent a secure sign‑in link to the address you provided. It
        should arrive within a few seconds—please check your inbox (and
        spam folder) for a message from <em>no-reply@bulletbuilder.net</em>.
      </p>
      <p className="mb-4 text-sm text-muted-foreground">
        Didn’t receive it? Wait a minute and try again, or contact support
        at&nbsp;
        <a
          href="mailto:support@bulletbuilder.net"
          className="text-blue-600 hover:underline"
        >
          devin.c.greenwell@gmail.com
        </a>.
      </p>
      <Link href="/signin" className="text-blue-600 hover:underline">
        ← Back to sign in
      </Link>
    </main>
  );
}
