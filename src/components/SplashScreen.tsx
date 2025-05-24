'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/** ----------------------------------------------------------------
 *  A simple wrapper-style splash screen.
 *  – Shows a spinner for a moment, then renders its children.
 *  – ALSO exports <BuyMeCoffeeButton/> as a stand-alone widget.
 *  ---------------------------------------------------------------- */
type Props = { children: React.ReactNode };

export default function SplashScreen({ children }: Props) {
  const [isReady, setIsReady] = useState(false);

  // Fake “initialising” delay so the spinner is visible
  useEffect(() => {
    const id = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(id);
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}

/* -----------------------  Extra widget  ------------------------ */
export const BuyMeCoffeeButton: React.FC = () => (
  <a
    href="https://www.buymeacoffee.com/bulletbuilder"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-4 right-4 z-50 rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-background shadow-lg transition-colors hover:bg-yellow-300"
  >
    Buy me a coffee
  </a>
);
