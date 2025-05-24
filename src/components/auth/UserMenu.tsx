'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { FaUser } from 'react-icons/fa';
import { useState } from 'react';

export default function UserMenu() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center space-x-2 rounded-full bg-blue-100 p-2 text-blue-800 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user?.name || 'User'}
            className="rounded-full object-cover" // Added object-cover for proper scaling
            width={32}
            height={32}
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              minHeight: '32px'
            }} // Force exact dimensions
          />
        ) : (
          <FaUser className="h-8 w-8" /> // Made slightly larger to match image size
        )}
        <span className="hidden md:inline">{session.user?.name || session.user?.email}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:text-white">
          <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
            <p className="font-medium">{session.user?.name}</p>
            <p className="truncate">{session.user?.email}</p>
          </div>
          <hr className="dark:border-gray-600" />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}