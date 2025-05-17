'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpeechFeedback from './SpeechFeedback';

// ───────────────────────── TYPE DEFINITIONS FOR WEB SPEECH API ─────────────────────────
// Based on standard Web Speech API specifications

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
  // According to MDN, other properties like emma, interpretation, etc., can exist but are optional.
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult; // Index signature for array-like access
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

// Defines the structure for errors from the SpeechRecognition API
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode | string; // Can be a predefined code or a string message
  readonly message: string; // Often contains a more descriptive message
}

// Standard error codes for SpeechRecognition
type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

// Custom interface for the SpeechRecognition instance to ensure all properties are typed
interface CustomSpeechRecognitionInstance extends EventTarget {
  grammars: any; // Type as SpeechGrammarList if used, 'any' for now if not.
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string; // Optional

  start(): void;
  stop(): void;
  abort(): void;

  // Event handlers with typed events
  onaudiostart: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onaudioend: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onerror: ((this: CustomSpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void) | null;
  onnomatch: ((this: CustomSpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onresult: ((this: CustomSpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onsoundstart: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onsoundend: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechstart: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onspeechend: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: CustomSpeechRecognitionInstance, ev: Event) => void) | null;
}

// Custom interface for the constructor of SpeechRecognition
interface CustomSpeechRecognitionConstructor {
  new (): CustomSpeechRecognitionInstance;
}

// Augment the global Window interface ONLY for custom, application-specific properties.
// Standard browser APIs like SpeechRecognition should not be re-declared here
// to avoid conflicts with TypeScript's built-in lib.dom.d.ts.
declare global {
  interface Window {
    currentRecognition?: CustomSpeechRecognitionInstance; // Application-specific global instance
    // SpeechRecognition and webkitSpeechRecognition are accessed via (window as any)
    // and then cast to CustomSpeechRecognitionConstructor to use our specific types.
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
    const browserSupportsSpeech = typeof window !== 'undefined' && 
                                  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (!browserSupportsSpeech) {
      setIsSpeechSupported(false);
      setError('Speech recognition is not supported in this browser.');
      console.warn('SpeechRecognition or webkitSpeechRecognition not found in window object.');
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

    const SpeechRecognitionAPIConstructor = 
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as CustomSpeechRecognitionConstructor | undefined;
    
    if (!SpeechRecognitionAPIConstructor) {
      setError('Speech recognition API could not be initialized.');
      setIsListening(false); 
      setShowFeedbackModal(false);
      return;
    }
    
    try {
      if (window.currentRecognition) {
        window.currentRecognition.abort();
        window.currentRecognition = undefined;
      }

      const recognition: CustomSpeechRecognitionInstance = new SpeechRecognitionAPIConstructor();
      // Assigning properties to the recognition instance
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1; // Typically 1 is sufficient

      recognition.onstart = () => {
        console.log('Speech recognition started.');
        // isListening is already true
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscriptAccumulator = '';
        let finalTranscriptAccumulator = '';
        // Iterate through SpeechRecognitionResultList
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const resultItem: SpeechRecognitionResult = event.results[i];
          // Access the first SpeechRecognitionAlternative
          if (resultItem.length > 0) {
            const alternative: SpeechRecognitionAlternative = resultItem[0];
            if (resultItem.isFinal) {
              finalTranscriptAccumulator += alternative.transcript;
            } else {
              interimTranscriptAccumulator += alternative.transcript;
            }
          }
        }
        setTranscript(finalTranscriptAccumulator || interimTranscriptAccumulator);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        setError(`Recognition error: ${event.error} - ${event.message || 'No additional message.'}`);
        setIsListening(false);
        setShowFeedbackModal(false);
        if (window.currentRecognition === recognition) {
            window.currentRecognition = undefined;
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended.');
        // 'isListening' in this closure refers to the state when startListening was created.
        // It's a dependency of startListening's useCallback.
        if (window.currentRecognition === recognition) { 
            setIsListening(false); 
            setShowFeedbackModal(false);
            setTranscript(currentTranscriptValue => {
              if (currentTranscriptValue.trim()) {
                onTranscript(currentTranscriptValue.trim());
              }
              return ''; 
            });
            window.currentRecognition = undefined; 
        } else if (!isListening && window.currentRecognition === undefined) {
            setShowFeedbackModal(false);
        }
      };

      recognition.start();
      window.currentRecognition = recognition;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during speech initialization.';
      console.error('Error initializing speech recognition:', errorMessage, err);
      setError(`Initialization error: ${errorMessage}`);
      setIsListening(false);
      setShowFeedbackModal(false);
    }
  }, [isSpeechSupported, onTranscript, showFeedback, isListening]);

  const stopListening = useCallback(() => {
    if (window.currentRecognition) {
      console.log('Manually stopping speech recognition.');
      setIsListening(false); 
      window.currentRecognition.stop(); 
    } else {
      setIsListening(false);
    }
    setShowFeedbackModal(false); 
  }, []); 

  useEffect(() => {
    return () => {
      if (window.currentRecognition) {
        console.log('SpeechToText unmounting, aborting recognition.');
        window.currentRecognition.abort(); 
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
        <MicOff className="h-5 w-5 text-muted-foreground" />
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
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {error && !isListening && (
        <span className="ml-2 text-xs text-destructive animate-fade-in">
          {error}
        </span>
      )}
      
      {isListening && transcript && !showFeedback && !showFeedbackModal && (
        <span className="ml-2 text-xs italic text-muted-foreground max-w-xs truncate typing-animation">
          {transcript}
        </span>
      )}
      
      {showFeedbackModal && showFeedback && (
        <SpeechFeedback 
          isListening={isListening} 
          transcript={transcript} 
        />
      )}
    </div>
  );
}
