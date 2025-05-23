'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { Loader2 } from 'lucide-react';
import { isInAppBrowser, getInAppBrowserName } from '@/utils/browserDetection';
import { InAppBrowserWarning } from '@/components/InAppBrowserWarning';

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState<'email' | 'google' | null>(null);
  const [isInApp, setIsInApp] = useState(false);
  const [browserName, setBrowserName] = useState('');

  // Check for in-app browser
  useEffect(() => {
    const inApp = isInAppBrowser();
    setIsInApp(inApp);
    if (inApp) {
      setBrowserName(getInAppBrowserName());
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading('email');
    
    try {
      await signIn('email', { email, callbackUrl: '/' });
      setEmailSent(true);
    } catch (error) {
      console.error('Email sign-in error:', error);
    } finally {
      setIsLoading(null);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading('google');
    
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(null);
    }
  }

  // Show in-app browser warning
  if (isInApp) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <BrandLogo size={64} withText />
            <h2 className="mt-6 text-center text-2xl font-bold">
              Bullet Builder
            </h2>
          </div>
          <InAppBrowserWarning browserName={browserName} />
        </div>
      </main>
    );
  }

  // Don't show anything if already authenticated (will redirect)
  if (session) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <BrandLogo size={64} withText />
          <h2 className="mt-6 text-center text-2xl font-bold">
            Sign in to Bullet Builder
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Choose your preferred sign-in method
          </p>
        </div>

        {emailSent ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-center text-green-800">
              Check your inbox for the magic link!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Google Sign-in Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading !== null}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <button
                type="submit"
                disabled={isLoading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading === 'email' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Send magic link
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}