'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function SpeechHint() {
  const [showHint, setShowHint] = useState(false);
  
  useEffect(() => {
    // Check if this is the first visit
    const hasSeenHint = localStorage.getItem('hasSeenSpeechHint');
    
    if (!hasSeenHint) {
      // Show the hint after a short delay
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem('hasSeenSpeechHint', 'true');
  };
  
  if (!showHint) return null;
  
  return (
    <div className="fixed bottom-28 right-6 md:fixed md:bottom-auto md:right-auto md:top-20 md:left-1/2 md:-translate-x-1/2 z-20 max-w-xs md:max-w-sm bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 text-sm text-blue-800 animate-fade-in">
      <button 
        onClick={dismissHint}
        className="absolute top-2 right-2 text-blue-500 hover:text-blue-700"
        aria-label="Dismiss hint"
      >
        <X size={18} />
      </button>
      
      <div className="flex flex-col items-center gap-2">
        <p className="font-medium text-center">
          💡 New Feature: Speech-to-Text
        </p>
        <p className="text-center">
          You can now dictate your achievements using the microphone button
          {window.innerWidth <= 768 
            ? " in the bottom-right corner" 
            : " next to the input area"}!
        </p>
        <button
          onClick={dismissHint}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}