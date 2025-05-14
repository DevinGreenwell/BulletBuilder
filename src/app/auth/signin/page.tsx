'use client';

import React, { useEffect, useState, FormEvent } from 'react';
import { getProviders, signIn, ClientSafeProvider } from 'next-auth/react';

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadProviders = async () => {
      const providersData = await getProviders();
      console.log("Available providers:", providersData); // Log for debugging
      setProviders(providersData);
    };
    
    loadProviders();
  }, []);

  if (!providers) {
    return <div className="p-4">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      
      <div className="space-y-4 w-full max-w-xs">
        {/* Email Provider */}
        {providers.email && (
          <form
          key="email"
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            alert('🟢 form handler fired');
            setIsSubmitting(true);
            console.log("Submitting email:", email);
            try {
              const result = await signIn('email', { 
                email, 
                callbackUrl: '/',
                redirect: true // Force redirect
              });
              console.log("Sign in result:", result);
            } catch (error) {
              console.error("Sign in error:", error);
            } finally {
              setIsSubmitting(false);
            }
          }}
          className="flex flex-col space-y-2"
          >
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in with Email'}
            </button>
          </form>
        )}
        
        {/* Google Provider */}
        {providers.google && (
          <button
            key="google"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          >
            Sign in with {providers.google.name}
          </button>
        )}
        
        {/* Other providers */}
        {Object.values(providers).filter(p => p.id !== 'email' && p.id !== 'google').map((provider) => (
          <button
            key={provider.id}
            onClick={() => signIn(provider.id, { callbackUrl: '/' })}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white"
          >
            Sign in with {provider.name}
          </button>
        ))}
      </div>
    </div>
  );
}