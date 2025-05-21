'use client';

import React, { useState, useEffect } from 'react';
import SpeechToText from './SpeechToText';

interface MobileSpeechButtonProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
}

export default function MobileSpeechButton({ 
  onTranscript, 
  isDisabled = false 
}: MobileSpeechButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Only show on smaller screens and add a nice entry animation
  useEffect(() => {
    // Check if it's a mobile device
    const isMobileDevice = window.innerWidth <= 768;
    
    if (isMobileDevice) {
      // Add a delay for a nicer entry
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-20 right-6 md:hidden z-10 animate-fade-in">
      <div className="bg-primary rounded-full shadow-lg p-1">
        <SpeechToText 
          onTranscript={onTranscript}
          isDisabled={isDisabled}
          className="speech-btn-mobile mobile-tap-target"
        />
      </div>
    </div>
  );
}