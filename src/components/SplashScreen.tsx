// src/components/SplashScreen.tsx - ENHANCED VERSION WITH DONATION POPUP
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, X, Coffee, Heart } from 'lucide-react';

/** ----------------------------------------------------------------
 *  Enhanced splash screen with donation popup modal
 *  – Shows loading spinner for 600ms
 *  – Then shows donation popup (dismissible, remembers choice)
 *  – Always shows persistent "Buy me coffee" button
 *  ---------------------------------------------------------------- */
type Props = { children: React.ReactNode };

export default function SplashScreen({ children }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [showDonationModal, setShowDonationModal] = useState(false);

  // Check if user has already seen the donation popup in this session
  useEffect(() => {
    const hasSeenDonationPopup = sessionStorage.getItem('hasSeenDonationPopup');
    
    // Show loading spinner for 600ms
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      
      // Show donation modal if user hasn't seen it this session
      if (!hasSeenDonationPopup) {
        const modalTimeout = setTimeout(() => {
          setShowDonationModal(true);
        }, 800); // Small delay after loading finishes
        
        return () => clearTimeout(modalTimeout);
      }
    }, 600);

    return () => clearTimeout(loadingTimeout);
  }, []);

  // Handle closing the donation modal
  const closeDonationModal = () => {
    setShowDonationModal(false);
    sessionStorage.setItem('hasSeenDonationPopup', 'true');
  };

  // Handle donation button click
  const handleDonateClick = () => {
    window.open('https://www.buymeacoffee.com/DevinGreenwell', '_blank', 'noopener,noreferrer');
    closeDonationModal();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" aria-label="Loading" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading Bullet Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="splash-ready">
      {children}
      
      {/* Donation Modal Popup */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            {/* Close button */}
            <button
              onClick={closeDonationModal}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                <Heart className="h-8 w-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Enjoying Bullet Builder?
              </h2>

              {/* Description */}
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                This tool is built with ❤️ by an Active Duty Coastie. 
                Your support helps keep it running and improving!
              </p>

              {/* Benefits */}
              <div className="mb-6 space-y-2 text-left">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  Free to use, no ads
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  Regular updates & improvements
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  Built for the USCG community
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleDonateClick}
                  className="flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-700 hover:shadow-lg"
                >
                  <Coffee className="h-5 w-5" />
                  <span>Buy me a coffee</span>
                </button>
                
                <button
                  onClick={closeDonationModal}
                  className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Maybe later
                </button>
              </div>

              {/* Small note */}
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                email feedback to <a href='mailto: devin.c.greenwell@gmail.com' className="text-blue-500 hover:underline">devin.c.greenwell@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Buy Me Coffee Button */}
      <BuyMeCoffeeButton />
    </div>
  );
}

/* -----------------------  Persistent Coffee Button  ------------------------ */
export const BuyMeCoffeeButton: React.FC = () => (
  <a
    href="https://www.buymeacoffee.com/DevinGreenwell"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:from-blue-600 hover:to-purple-700 hover:shadow-xl hover:scale-105"
    title="Support the developer"
  >
    <Coffee className="h-4 w-4" />
    <span className="hidden sm:inline">Buy me a coffee</span>
  </a>
);