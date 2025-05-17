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
interface CustomSpeechRecognitionInstance extends EventTarget {
  grammars: any; 
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

// Extend the global Window interface ONLY for custom properties.
// Do NOT re-declare standard browser APIs like SpeechRecognition here.
declare global {
  interface Window {
    currentRecognition?: CustomSpeechRecognitionInstance; // Our application-specific property
    // SpeechRecognition and webkitSpeechRecognition are assumed to be part of the global scope
    // as provided by lib.dom.d.ts or the browser environment.
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
  const [isSpeechSupported, setIsSpeechSupported] = useState(true); // Assume supported until checked
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    // Check for SpeechRecognition API existence by casting window to any for the property access
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

    // Access the API from window (casting to any) and then cast to our custom constructor type.
    const SpeechRecognitionAPIConstructor = 
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as CustomSpeechRecognitionConstructor | undefined;
    
    if (!SpeechRecognitionAPIConstructor) {
      setError('Speech recognition API could not be initialized.');
      setIsListening(false); 
      setShowFeedbackModal(false);
      console.error('SpeechRecognitionAPIConstructor is undefined after existence check.');
      return;
    }
    
    try {
      // Ensure previous recognition is stopped before starting a new one
      if (window.currentRecognition) {
        window.currentRecognition.abort();
        window.currentRecognition = undefined;
      }

      const recognition: CustomSpeechRecognitionInstance = new SpeechRecognitionAPIConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started.');
        // isListening is already set to true
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
        // Check if this instance was the one being managed and isListening was true
        // This 'isListening' refers to the state when this onend handler was defined (closure)
        if (window.currentRecognition === recognition) { 
            setIsListening(false); 
            setShowFeedbackModal(false);
            // Use functional update to get the latest transcript value for onTranscript
            setTranscript(currentTranscriptValue => {
              if (currentTranscriptValue.trim()) {
                onTranscript(currentTranscriptValue.trim());
              }
              return ''; // Clear transcript after processing
            });
            window.currentRecognition = undefined; 
        }
        // If isListening became false due to a manual stop that already cleared currentRecognition
        else if (!isListening && window.currentRecognition === undefined) { 
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
  // isListening is a dependency because its value is used in the onend closure.
  }, [isSpeechSupported, onTranscript, showFeedback, isListening]); 

  const stopListening = useCallback(() => {
    if (window.currentRecognition) {
      console.log('Manually stopping speech recognition.');
      // Setting isListening to false here is more for immediate UI feedback.
      // The onend handler will also set it.
      setIsListening(false); 
      window.currentRecognition.stop(); // This will trigger the 'onend' event.
    } else {
      // If no currentRecognition (e.g., error occurred or not started), ensure UI is updated.
      setIsListening(false);
    }
    setShowFeedbackModal(false); 
  }, []); 

  useEffect(() => {
    // Cleanup function to abort recognition if component unmounts
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
      
      {error && !isListening && ( // Show error only if not actively listening
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
      {showFeedbackModal && showFeedback && (
        <SpeechFeedback 
          isListening={isListening} 
          transcript={transcript} 
        />
      )}
    </div>
  );
}
