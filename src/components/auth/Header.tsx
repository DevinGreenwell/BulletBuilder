'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import UserMenu from '@/components/auth/UserMenu';
import { ModeToggle } from '@/components/ui/theme-toggle';

export default function Header() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  return (
    <header className="bg-card text-foreground shadow transition-colors duration-200"> {/* Added transition */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Left Side: Title */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font text-foreground"> {/* Use primary color */}
              Bullet Builder 2.0
            </Link>
          </div>

          {/* Center: Navigation (Optional) */}
          <nav className="hidden md:flex space-x-4">
            {/* Add nav links if needed */}
          </nav>

          {/* Right Side: Auth & Theme Toggle */}
          <div className="flex items-center gap-4"> {/* Use gap for spacing */}
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
            ) : session ? (
              <UserMenu />
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring" // Use primary variants
              >
                Sign in
              </Link>
            )}
            <ModeToggle /> {/* Add the theme toggle button */}
          </div>
        </div>
      </div>
    </header>
  );
}
