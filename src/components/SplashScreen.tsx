'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SplashScreen() {
  const [show, setShow] = useState(false);

  // 👉 show once per browser (localStorage flag)
  useEffect(() => {
    const flag = window.localStorage.getItem('sawSplash');
    if (!flag) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-80 rounded-2xl bg-white p-6 text-center shadow-xl">
        <h1 className="mb-3 text-xl text-gray-800 font-semibold">Enjoying Bullet Builder 2.0?</h1>
        <p className="mb-6 text-sm text-gray-600">
          If this tool helps you out, buy me a coffee!
        </p>

        <Link
          href="https://account.venmo.com/u/Devin-Greenwell-1"
          target="_blank"
          className="inline-block rounded-full bg-blue-500 px-5 py-2 font-medium text-white hover:bg-blue-600"
        >
          ☕ Send via Venmo
        </Link>

        <button
          onClick={() => {
            window.localStorage.setItem('sawSplash', '1');
            setShow(false);
          }}
          className="mt-4 block w-full text-xs text-gray-500 hover:underline"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
