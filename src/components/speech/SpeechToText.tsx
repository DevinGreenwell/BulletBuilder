'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpeechFeedback from './SpeechFeedback';

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  isDisabled?: boolean;
  className?: string;
  showFeedback?: boolean;
}

export default function SpeechToText({ 
  onTranscript, 
  isDisabled = false,
  className = '',
  showFeedback = true
}: SpeechToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Check if speech recognition is supported
  useEffect(() => {
    const isBrowser = typeof window !== 'undefined';
    const isSupported = isBrowser && (
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window
    );
    setIsSpeechSupported(isSupported);
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
    }
  }, []);

  // Setup speech recognition
  const startListening = useCallback(() => {
    setError(null);
    setIsListening(true);
    setTranscript('');
    if (showFeedback) {
      setShowFeedbackModal(true);
    }

    // Browser compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        setError(`Error occurred in recognition: ${event.error}`);
        setIsListening(false);
        setShowFeedbackModal(false);
      };

      recognition.onend = () => {
        // Only finalize if we're still supposed to be listening
        // This prevents finalizing when stopped manually
        if (isListening) {
          setIsListening(false);
          setShowFeedbackModal(false);
          if (transcript) {
            onTranscript(transcript);
          }
        }
      };

      recognition.start();

      // Store the recognition instance to stop it later
      (window as any).currentRecognition = recognition;
    } catch (err) {
      setError('Error initializing speech recognition');
      setIsListening(false);
      setShowFeedbackModal(false);
      console.error('Speech recognition error:', err);
    }
  }, [onTranscript, transcript, isListening, showFeedback]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    setShowFeedbackModal(false);
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
      if (transcript) {
        onTranscript(transcript);
      }
    }
  }, [onTranscript, transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ((window as any).currentRecognition) {
        (window as any).currentRecognition.stop();
      }
    };
  }, []);

  if (!isSpeechSupported) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        disabled 
        title="Speech recognition not supported"
        className={className}
      >
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={isListening ? 'ripple-container' : ''}>
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={isListening ? stopListening : startListening}
          disabled={isDisabled}
          title={isListening ? "Stop recording" : "Start speech-to-text"}
          aria-label={isListening ? "Stop recording" : "Start speech-to-text"}
          className={isListening ? 'recording-pulse' : ''}
        >
          {isListening ? (
            <Loader2 className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {error && (
        <span className="ml-2 text-xs text-destructive animate-fade-in">
          {error}
        </span>
      )}
      
      {isListening && transcript && !showFeedbackModal && (
        <span className="ml-2 text-xs italic text-muted-foreground max-w-xs truncate typing-animation">
          {transcript}
        </span>
      )}
      
      {/* Speech feedback modal */}
      {showFeedbackModal && (
        <SpeechFeedback 
          isListening={isListening} 
          transcript={transcript} 
        />
      )}
    </div>
  );
}
interface _SpeechRecognitionConstructor {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

// Removed redundant global declaration since 'SpeechRecognition' is already declared in env.d.ts.