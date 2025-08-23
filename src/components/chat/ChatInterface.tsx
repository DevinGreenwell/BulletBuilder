'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from 'react';
import { ArrowRightCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SpeechToText from '@/components/speech/SpeechToText';
import MobileSpeechButton from '@/components/speech/MobileSpeechButton';

/* ─────────────────────────  type definitions  ───────────────────────── */
export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  competency?: string;
  timestamp: number;
  type?: 'bullet' | 'question' | 'error';
}

export interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BulletData { // This is what ChatInterface creates
  id: string; // This is fine, it's assignable to string | undefined
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt: number;
  source?: string;
}

export interface ChatInterfaceProps {
  onBulletGenerated?: (bullet: BulletData) => void;
  rankCategory?: 'Officer' | 'Enlisted';
  rank?: string;
  initialMessages?: DisplayMessage[];
  className?: string;
}

/* ─────────────────────────  helper generators  ──────────────────────── */
const msgId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const bulletId = () =>
  `bullet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const wrapWithNotice = (text: string) =>
  `${text}\n\n(Bullet added to "Manage Bullets" tab.)`;

/* ─────────────────────────  component  ──────────────────────────────── */
export default function ChatInterface({
  onBulletGenerated,
  rankCategory = 'Officer',
  rank = 'O3',
  initialMessages = [],
  className = '',
}: ChatInterfaceProps) {
  /* ----- state ----- */
  const [displayMessages, setDisplayMessages] =
    useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ───────────  competency definitions  ─────────── */
  const competencyDefinitions = useMemo(
    () => ({
      officer: {
        competencies: [
          'Planning & Preparedness',
          'Using Resources',
          'Results/Effectiveness',
          'Adaptability',
          'Professional Competence',
          'Speaking and Listening',
          'Writing',
          'Looking Out For Others',
          'Developing Others',
          'Directing Others',
          'Teamwork',
          'Workplace Climate',
          'Evaluations',
          'Initiative',
          'Judgment',
          'Responsibility',
          'Professional Presence',
          'Health and Well Being',
        ],
        categories: {
          'Performance of Duties': [
            'Planning & Preparedness',
            'Using Resources',
            'Results/Effectiveness',
            'Adaptability',
            'Professional Competence',
            'Speaking and Listening',
            'Writing',
          ],
          'Leadership Skills': [
            'Looking Out For Others',
            'Developing Others',
            'Directing Others',
            'Teamwork',
            'Workplace Climate',
            'Evaluations',
          ],
          'Personal and Professional Qualities': [
            'Initiative',
            'Judgment',
            'Responsibility',
            'Professional Presence',
            'Health and Well Being',
          ],
        },
      },
      enlisted: {
        e4e6: {
          competencies: [
            'Military Bearing',
            'Customs, Courtesies, and Traditions',
            'Quality of Work',
            'Technical Proficiency',
            'Initiative',
            'Decision Making and Problem Solving',
            'Military Readiness',
            'Self-Awareness and Learning',
            'Team Building',
            'Respect for Others',
            'Accountability and Responsibility',
            'Influencing Others',
            'Effective Communication',
          ],
          categories: {
            Military: [
              'Military Bearing',
              'Customs, Courtesies, and Traditions',
            ],
            Performance: [
              'Quality of Work',
              'Technical Proficiency',
              'Initiative',
            ],
            'Professional Qualities': [
              'Decision Making and Problem Solving',
              'Military Readiness',
              'Self-Awareness and Learning',
              'Team Building',
            ],
            Leadership: [
              'Respect for Others',
              'Accountability and Responsibility',
              'Influencing Others',
              'Effective Communication',
            ],
          },
        },
        e7e8: {
          competencies: [
            'Military Bearing',
            'Customs, Courtesies, and Traditions',
            'Quality of Work',
            'Technical Proficiency',
            'Initiative',
            'Strategic Thinking',
            'Decision Making and Problem Solving',
            'Military Readiness',
            'Self-Awareness and Learning',
            'Partnering',
            'Respect for Others',
            'Accountability and Responsibility',
            'Workforce Management',
            'Effective Communication',
            'Chiefs Mess Leadership and Participation',
          ],
          categories: {
            Military: [
              'Military Bearing',
              'Customs, Courtesies, and Traditions',
            ],
            Performance: [
              'Quality of Work',
              'Technical Proficiency',
              'Initiative',
              'Strategic Thinking',
            ],
            'Professional Qualities': [
              'Decision Making and Problem Solving',
              'Military Readiness',
              'Self-Awareness and Learning',
              'Partnering',
            ],
            Leadership: [
              'Respect for Others',
              'Accountability and Responsibility',
              'Workforce Management',
              'Effective Communication',
              'Chiefs Mess Leadership and Participation',
            ],
          },
        },
      },
    }),
    []
  );

  /* ───────────  competency helpers  ─────────── */
  const getCompetencies = useCallback(() => {
    if (rankCategory === 'Officer') return competencyDefinitions.officer.competencies;
    if (rank === 'E7' || rank === 'E8')
      return competencyDefinitions.enlisted.e7e8.competencies;
    return competencyDefinitions.enlisted.e4e6.competencies;
  }, [rank, rankCategory, competencyDefinitions]);

  const getCategoryFromCompetency = useCallback(
    (competency: string) => {
      if (rankCategory === 'Officer') {
        for (const [cat, list] of Object.entries(
          competencyDefinitions.officer.categories
        )) {
          if (list.includes(competency)) return cat;
        }
      } else {
        const def =
          rank === 'E7' || rank === 'E8'
            ? competencyDefinitions.enlisted.e7e8.categories
            : competencyDefinitions.enlisted.e4e6.categories;
        for (const [cat, list] of Object.entries(def)) {
          if (list.includes(competency)) return cat;
        }
      }
      return 'Other';
    },
    [rank, rankCategory, competencyDefinitions]
  );

  /* populate default competency */
  useEffect(() => {
    const list = getCompetencies();
    if (list.length && !selectedCompetency) setSelectedCompetency(list[0]);
    if (!list.includes(selectedCompetency) && list.length) {
      setSelectedCompetency(list[0]);
    }
  }, [getCompetencies, rank, rankCategory, selectedCompetency]);

  /* scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  /* ───────────  bullet detection  ─────────── */
  function detectBullet(text: string): { isBullet: boolean; bulletContent: string } {
    // More precise detection logic - only detect very explicit bullet prefixes
    const exactPrefixes = [
      "OK, here's a draft bullet:",
      "Here's a draft bullet:",
      "Here's your bullet:",
      'Bullet:'
    ];

    // Only detect actual bullets (not questions or other responses)
    if (text.includes('?') && !text.includes('bullet')) {
      return { isBullet: false, bulletContent: '' };
    }

    // Check for exact prefixes only
    for (const prefix of exactPrefixes) {
      if (text.includes(prefix)) {
        const parts = text.split(prefix);
        if (parts.length > 1) {
          // Take only what comes immediately after the prefix
          let bulletText = parts[1].trim();
          
          // If there's a paragraph break, only take content before it
          if (bulletText.includes('\n\n')) {
            bulletText = bulletText.split('\n\n')[0].trim();
          }
          
          if (bulletText) {
            return { isBullet: true, bulletContent: bulletText };
          }
        }
      }
    }

    // No bullet found
    return { isBullet: false, bulletContent: '' };
  }

  /* ───────────  Speech-to-text handler  ─────────── */
  const handleSpeechTranscript = useCallback((transcript: string) => {
    setInput(prev => {
      // If there's already text, append with space
      if (prev.trim()) {
        return `${prev.trim()} ${transcript}`;
      }
      return transcript;
    });
    
    // Focus the input after transcription completes
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  /* ───────────  API call  ─────────── */
  const handleSendMessage = async () => {
    const clean = input.trim();
    if (!clean || !selectedCompetency || isLoading) return;

    setErrorMessage(null);

    const userMsg: DisplayMessage = {
      id: msgId(),
      role: 'user',
      content: clean,
      competency: selectedCompetency,
      timestamp: Date.now(),
    };
    setDisplayMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const historyForApi: ApiMessage[] = [...displayMessages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const resp = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyForApi,
          competency: selectedCompetency,
          rankCategory,
          rank,
        }),
      });
      
      // Check for timeout or network errors early
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(errorText || `Request failed with status: ${resp.status}`);
      }
      
      // Parse response data
      const data = await resp.json();
      
      // Validate the response data
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      const text: string = data.response;
      
      // Check if response is empty
      if (!text || typeof text !== 'string') {
        throw new Error('Empty or invalid response from API');
      }
      
      // Now handle bullet detection with the improved detection logic
      const { isBullet, bulletContent } = detectBullet(text);

      let finalContent = text;
      let msgType: DisplayMessage['type'] = isBullet ? 'bullet' : 'question';

      // Clear follow-up question processing - only process as bullet if it's definitely a bullet
      if (isBullet && bulletContent && bulletContent.length > 10 && onBulletGenerated) {
        // Create a new bullet ID each time
        const newBulletId = bulletId();
        
        // Create the bullet object with all required properties
        const bulletObj = {
          id: newBulletId,
          competency: selectedCompetency,
          content: bulletContent,
          isApplied: false,
          category: getCategoryFromCompetency(selectedCompetency),
          createdAt: Date.now(),
          source: userMsg.id,
        };
        
        // Call the parent handler
        onBulletGenerated(bulletObj);
        finalContent = wrapWithNotice(text);
      }
      
      // Add message to display history
      setDisplayMessages(prev => [
        ...prev,
        {
          id: msgId(),
          role: 'assistant',
          content: finalContent,
          timestamp: Date.now(),
          type: msgType,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMessage(msg);
      setDisplayMessages(prev => [
        ...prev,
        {
          id: msgId(),
          role: 'assistant',
          content: `Error: ${msg}. Please try again.`,
          timestamp: Date.now(),
          type: 'error',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ───────────  reset chat  ─────────── */
  const handleReset = () => {
    if (window.confirm('Clear this conversation?')) {
      setDisplayMessages([]);
      setInput('');
      setErrorMessage(null);
    }
  };

  /* ───────────  keydown helper  ─────────── */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobile = window.innerWidth <= 768;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
    if (!isMobile && e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* ───────────  render  ─────────── */
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label
            htmlFor="competency"
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Select Competency Area:
          </label>
          <select
            id="competency"
            value={selectedCompetency}
            onChange={e => setSelectedCompetency(e.target.value)}
            className={cn(
              'w-full rounded-md border border-ring bg-background px-2 py-2 text-foreground shadow-sm',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            )}
          >
            {getCompetencies().map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {displayMessages.length > 0 && (
          <button
            onClick={handleReset}
            className={cn(
              'px-3 py-2 text-sm transition-colors',
              'rounded text-foreground hover:text-destructive',
              'focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-1'
            )}
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* chat history */}
      <div
        className={cn(
          'mb-4 flex-1 overflow-y-auto rounded-md border border-ring bg-background p-4 text-card-foreground',
          isMobile ? 'min-h-[200px] max-h-[350px] mobile-chat-container' : 'min-h-[300px] max-h-[500px]'
        )}
      >
        {displayMessages.length === 0 ? (
          <div className="mt-10 px-4 text-center text-muted-foreground">
            <p>Enter your achievement below or use the microphone to speak.</p>
            <p className="mt-2 text-sm">
              The assistant will refine it into a {' '}
              {selectedCompetency} bullet for ({rankCategory} {rank}).
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayMessages.map(m => (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg border border-ring p-3',
                    isMobile ? 'text-sm' : 'text-base',
                    m.type === 'error'
                      ? 'bg-destructive/10 text-destructive-foreground border-destructive/30'
                      : m.type === 'bullet'
                      ? 'bg-ring text-background border-ring'
                      : 'bg-card text-foreground'
                  )}
                >
                  {m.role === 'user' && m.competency && (
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                      For: {m.competency}
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isLoading && (
          <div className="mt-4 flex items-center justify-center p-2">
            <Loader2 className="h-5 w-5 text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">
              Assistant is thinking…
            </span>
          </div>
        )}
      </div>

      {/* error banner */}
      {errorMessage && !isLoading && (
        <div className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive-foreground">
          {errorMessage}
        </div>
      )}

      {/* input with speech-to-text button */}
      <div className="relative mb-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Describe your achievement for ${selectedCompetency}…`}
          rows={isMobile ? 4 : 3}
          disabled={isLoading}
          className={cn(
            'w-full resize-none rounded-md border border-input bg-background',
            'pr-24 pb-2 pl-2 pt-2 text-foreground placeholder:text-muted-foreground',
            isMobile ? 'input-container-mobile' : '',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
        />
        
        {/* Desktop Speech-to-text button (hidden on mobile) */}
        <div className="absolute right-14 top-1/2 -translate-y-1/2 hidden md:block">
          <SpeechToText 
            onTranscript={handleSpeechTranscript} 
            isDisabled={isLoading} 
          />
        </div>
        
        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 mobile-tap-target',
            'bg-primary text-primary-foreground transition-colors',
            'hover:bg-primary/80 disabled:opacity-50',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
          )}
        >
          {isLoading
            ? <Loader2 className="h-5 w-5" />
            : <ArrowRightCircle className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Floating Speech Button (only visible on mobile) - FIXED: Removed duplicate */}
      <MobileSpeechButton 
        onTranscript={handleSpeechTranscript}
        isDisabled={isLoading}
      />
    </div>
  );
}