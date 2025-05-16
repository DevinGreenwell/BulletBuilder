'use client';

import { useEffect, useState } from 'react';

interface SpeechFeedbackProps {
  isListening: boolean;
  transcript: string;
  className?: string;
}

export default function SpeechFeedback({ 
  isListening, 
  transcript, 
  className = '' 
}: SpeechFeedbackProps) {
  const [dots, setDots] = useState('');
  
  // Create loading dots animation when listening but no transcript yet
  useEffect(() => {
    if (isListening && !transcript) {
      const intervalId = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
      
      return () => clearInterval(intervalId);
    }
  }, [isListening, transcript]);
  
  if (!isListening) return null;
  
  return (
    <div 
      className={`fixed bottom-32 right-6 md:bottom-auto md:right-auto md:left-1/2 md:-translate-x-1/2 md:top-20 
                  bg-primary/10 border border-primary/30 rounded-lg shadow-lg p-3 z-20 animate-fade-in max-w-xs
                  ${className}`}
    >
      {!transcript ? (
        <div className="flex items-center space-x-2 text-sm text-primary">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
          <p>Listening{dots}</p>
        </div>
      ) : (
        <div className="text-sm text-primary">
          <p className="font-medium mb-1">Heard:</p>
          <p className="italic typing-animation">{transcript}</p>
        </div>
      )}
    </div>
  );
}