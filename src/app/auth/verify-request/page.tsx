'use client';
import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">Check your email</h1>
      <p className="mb-6">
        A sign in link has been sent to your email address.
        Check your inbox (and spam folder) for the verification link.
      </p>
      <p className="mb-4 text-sm text-gray-500">
        For development with Ethereal, check the inbox at:
        <a 
          href="https://ethereal.email/messages" 
          target="_blank" 
          rel="noopener noreferrer"
          className="ml-1 text-blue-600 hover:underline"
        >
          ethereal.email/messages
        </a>
      </p>
      <Link href="/auth/signin" className="text-blue-600 hover:underline">
        ← Back to sign in
      </Link>
    </div>
  );
}