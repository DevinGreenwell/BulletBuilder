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
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode | string;
  readonly message: string;
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

// Custom interface for the SpeechRecognition instance
// Properties are based on the standard Web Speech API
interface CustomSpeechRecognitionInstance extends EventTarget {
  grammars: any; // Type as SpeechGrammarList if you use it, else 'any' is fine for now
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  start(): void;
  stop(): void;
  abort(): void;

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

// Extend the global Window interface ONLY for custom properties
declare global {
  interface Window {
    // These are standard browser APIs. Rely on TypeScript's lib.dom.d.ts for their base types.
    // We will cast to our more specific custom types at the point of use if necessary.
    SpeechRecognition?: { new(): any }; // Generic constructor signature for existence check
    webkitSpeechRecognition?: { new(): any }; // Generic constructor signature for existence check
    currentRecognition?: CustomSpeechRecognitionInstance; // Our custom property
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
                                  (window.SpeechRecognition || window.webkitSpeechRecognition);
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
    // Set isListening true here, so the dependency is up-to-date for the onend closure
    setIsListening(true); 
    setTranscript(''); 
    if (showFeedback) {
      setShowFeedbackModal(true);
    }

    const SpeechRecognitionAPIConstructor = 
        (window.SpeechRecognition || window.webkitSpeechRecognition) as CustomSpeechRecognitionConstructor | undefined;
    
    if (!SpeechRecognitionAPIConstructor) {
      setError('Speech recognition API could not be initialized.');
      setIsListening(false); // Reset if constructor not found
      setShowFeedbackModal(false);
      return;
    }
    
    try {
      const recognition: CustomSpeechRecognitionInstance = new SpeechRecognitionAPIConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started.');
        // isListening is already set true before calling recognition.start()
      };

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
        // The 'isListening' in this closure will be from the render `startListening` was created.
        // This is why `isListening` is added as a dependency to `startListening`'s `useCallback`.
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
            // This condition checks the `isListening` from the closure.
            // If `startListening`'s `useCallback` has `isListening` as a dep, this will be up-to-date.
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
  // Added isListening to dependencies because the onend handler closes over it.
  // onTranscript and showFeedback are props/stable values.
  }, [isSpeechSupported, onTranscript, showFeedback, isListening]);

  const stopListening = useCallback(() => {
    if (window.currentRecognition) {
      console.log('Manually stopping speech recognition.');
      // isListening will be set to false by the onend handler if it's the current recognition
      window.currentRecognition.stop(); 
    } else {
      // If no currentRecognition, ensure UI is updated
      setIsListening(false);
    }
    setShowFeedbackModal(false); 
  }, []); // No direct dependencies that change frequently

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
