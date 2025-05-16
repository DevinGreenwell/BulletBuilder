'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpeechFeedback from './SpeechFeedback';

// ───────────────────────── TYPE DEFINITIONS FOR WEB SPEECH API ─────────────────────────
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult; // Index signature
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative; // Index signature
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

// Based on MDN and common usage for SpeechRecognitionErrorEvent
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode | string; // error can be a specific code or a string message
  readonly message: string; // Often contains a more descriptive message
}

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

// Interface for the SpeechRecognition instance itself
interface ISpeechRecognition extends EventTarget {
  grammars: any; // SpeechGrammarList; can be kept as any if not deeply used
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string; // Optional property

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
}

// Interface for the constructor of SpeechRecognition
interface SpeechRecognitionStatic {
  new (): ISpeechRecognition;
}

// Extend the global Window interface
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic; // Note: Optional because it might not exist
    webkitSpeechRecognition?: SpeechRecognitionStatic; // For Safari/older Chrome
    currentRecognition?: ISpeechRecognition; // Typed instance
  }
}
// ───────────────────────── END OF TYPE DEFINITIONS ─────────────────────────

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

  useEffect(() => {
    const isBrowser = typeof window !== 'undefined';
    const browserSupportsSpeech = isBrowser && (
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window
    );
    setIsSpeechSupported(browserSupportsSpeech);
    if (!browserSupportsSpeech) {
      setError('Speech recognition is not supported in this browser.');
      console.warn('Speech recognition API not found in window object.');
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSpeechSupported) {
      setError('Speech recognition is not supported.');
      return;
    }

    setError(null);
    setIsListening(true);
    setTranscript('');
    if (showFeedback) {
      setShowFeedbackModal(true);
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition API could not be initialized.');
      setIsListening(false);
      setShowFeedbackModal(false);
      return;
    }
    
    try {
      const recognition: ISpeechRecognition = new SpeechRecognitionAPI();
      recognition.continuous = true; // Keep listening even after a pause
      recognition.interimResults = true; // Get results as they are being processed
      recognition.lang = 'en-US'; // Set language

      recognition.onstart = () => {
        console.log('Speech recognition started.');
        setIsListening(true); // Ensure state is correctly set
      };

      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscriptAccumulator = '';
        let finalTranscriptAccumulator = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const currentSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptAccumulator += currentSegment;
          } else {
            interimTranscriptAccumulator += currentSegment;
          }
        }
        // Update transcript state with the latest, preferring final if available
        setTranscript(finalTranscriptAccumulator || interimTranscriptAccumulator);
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        setError(`Recognition error: ${event.error} - ${event.message || 'No additional message.'}`);
        setIsListening(false);
        setShowFeedbackModal(false);
      };

      // Handle end of speech recognition session
      recognition.onend = () => {
        console.log('Speech recognition ended.');
        // Check window.currentRecognition to see if stop was called manually
        // or if it ended naturally (e.g., long silence)
        if (window.currentRecognition === recognition) { // Check if it's the same instance that should be active
            setIsListening(false);
            setShowFeedbackModal(false);
            // Finalize transcript if it hasn't been processed by a manual stop
            // Check transcript state directly as it's updated by onresult
            setTranscript(prevTranscript => {
              if (prevTranscript.trim()) {
                onTranscript(prevTranscript.trim());
              }
              return prevTranscript; // Or clear it: return '';
            });
        }
        // Clean up the global reference if this instance is ending
        if (window.currentRecognition === recognition) {
            window.currentRecognition = undefined;
        }
      };

      recognition.start();
      window.currentRecognition = recognition; // Store the instance

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during speech initialization.';
      console.error('Error initializing speech recognition:', errorMessage, err);
      setError(`Initialization error: ${errorMessage}`);
      setIsListening(false);
      setShowFeedbackModal(false);
    }
  // Dependencies for useCallback
  }, [isSpeechSupported, onTranscript, showFeedback]); // Removed isListening and transcript as they cause re-creation issues here

  const stopListening = useCallback(() => {
    if (window.currentRecognition) {
      window.currentRecognition.stop(); // This will trigger the 'onend' event
      // The onTranscript call is now primarily handled in onend to ensure final results
    }
    setIsListening(false); // Immediately update UI state
    setShowFeedbackModal(false);
    // The global currentRecognition is cleared in the onend handler of the specific instance
  }, []); // No direct dependencies needed if onTranscript is stable or handled in onend

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.currentRecognition) {
        console.log('SpeechToText unmounting, stopping recognition.');
        window.currentRecognition.abort(); // Use abort for immediate stop without processing final results
        window.currentRecognition = undefined;
      }
    };
  }, []);

  if (!isSpeechSupported) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        disabled 
        title="Speech recognition not supported in this browser."
        className={className}
        aria-label="Speech recognition not supported"
      >
        <MicOff className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className={isListening ? 'ripple-container' : ''}> {/* For visual feedback */}
        <Button
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          onClick={isListening ? stopListening : startListening}
          disabled={isDisabled}
          title={isListening ? "Stop recording" : "Start speech-to-text"}
          aria-label={isListening ? "Stop recording" : "Start speech-to-text"}
          className={isListening ? 'recording-pulse' : ''} // For visual feedback
        >
          {isListening ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {error && !isListening && ( // Only show error if not actively listening
        <span className="ml-2 text-xs text-destructive animate-fade-in">
          {error}
        </span>
      )}
      
      {/* Optional: Display interim transcript while listening, if not using modal */}
      {isListening && transcript && !showFeedback && !showFeedbackModal && (
        <span className="ml-2 text-xs italic text-muted-foreground max-w-xs truncate typing-animation">
          {transcript}
        </span>
      )}
      
      {/* Speech feedback modal */}
      {showFeedbackModal && showFeedback && ( // Ensure showFeedback prop is also true
        <SpeechFeedback 
          isListening={isListening} 
          transcript={transcript} 
        />
      )}
    </div>
  );
}
