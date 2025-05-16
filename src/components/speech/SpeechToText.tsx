'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SpeechFeedback from './SpeechFeedback';

// ───────────────────────── TYPE DEFINITIONS FOR WEB SPEECH API ─────────────────────────
// These event/result types are generally safe as they describe the structure of event objects.
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
interface CustomSpeechRecognitionInstance extends EventTarget {
  grammars: any; // SpeechGrammarList; can be any if not deeply used
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onaudioend: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onend: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onerror: ((this: CustomSpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: CustomSpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: CustomSpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onsoundstart: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onsoundend: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onspeechstart: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onspeechend: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
  onstart: ((this: CustomSpeechRecognitionInstance, ev: Event) => any) | null;
}

// Custom interface for the constructor of SpeechRecognition
interface CustomSpeechRecognitionConstructor {
  new (): CustomSpeechRecognitionInstance;
}

// Extend the global Window interface ONLY for custom properties
declare global {
  interface Window {
    // Do NOT re-declare SpeechRecognition or webkitSpeechRecognition here
    // if they are provided by TypeScript's lib.dom.d.ts.
    // We will rely on the global types and cast at the point of use.
    currentRecognition?: CustomSpeechRecognitionInstance; // Our custom property, typed specifically
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
    // Check for SpeechRecognition API existence
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
      console.warn('Attempted to start listening but speech is not supported.');
      return;
    }

    setError(null);
    setIsListening(true);
    setTranscript(''); 
    if (showFeedback) {
      setShowFeedbackModal(true);
    }

    // Access the API from window and cast to our custom constructor type.
    // This assumes that if SpeechRecognition exists, it's compatible with our CustomSpeechRecognitionConstructor.
    const SpeechRecognitionAPIConstructor = 
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as CustomSpeechRecognitionConstructor | undefined;
    
    if (!SpeechRecognitionAPIConstructor) {
      setError('Speech recognition API could not be initialized.');
      setIsListening(false);
      setShowFeedbackModal(false);
      console.error('SpeechRecognitionAPIConstructor is undefined after check.');
      return;
    }
    
    try {
      const recognition: CustomSpeechRecognitionInstance = new SpeechRecognitionAPIConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started.');
        setIsListening(true); 
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
  }, [isSpeechSupported, onTranscript, showFeedback]);

  const stopListening = useCallback(() => {
    if (window.currentRecognition) {
      console.log('Manually stopping speech recognition.');
      setIsListening(false); 
      window.currentRecognition.stop(); 
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
