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
  className="rounded-full" // Keep existing styling if needed
  width={32} // Example width (h-8 = 32px usually)
  height={32} // Example height (w-8 = 32px usually)
/>
        ) : (
          <FaUser className="h-5 w-5" />
        )}
        <span className="hidden md:inline">{session.user?.name || session.user?.email}</span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-2 text-sm text-gray-700">
            <p className="font-medium">{session.user?.name}</p>
            <p className="truncate">{session.user?.email}</p>
          </div>
          <hr />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
