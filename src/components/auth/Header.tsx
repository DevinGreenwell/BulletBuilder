'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

import BrandLogo from '@/components/BrandLogo';
import { ModeToggle } from '@/components/ui/theme-toggle';
import UserMenu from '@/components/auth/UserMenu';

import { Loader2 } from 'lucide-react';

/**
 * Global site header.
 * – shows brand logo & word‑mark (links home)
 * – spinner while NextAuth loads
 * – Sign‑in button when unauthenticated
 * – user dropdown when authenticated
 * – dark/light toggle always present
 */
export default function Header() {
  const { status } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/60 backdrop-blur dark:bg-gray-900/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* logo */}
        <BrandLogo size={40} withText />

        {/* right side */}
        <div className="flex items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}

          {status === 'unauthenticated' && (
            <Link
              href="/signin"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Sign in
            </Link>
          )}

          {status === 'authenticated' && <UserMenu />}

          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
