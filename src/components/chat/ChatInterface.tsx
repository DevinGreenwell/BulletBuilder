'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from 'react';
import { ArrowRightCircle, ArrowRightSquare, Loader2 } from 'lucide-react';
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

export interface BulletData {
  id: string;
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
 // Fix the detectBullet function in ChatInterface.tsx
// Around line 190

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
// Improved error handling for API calls
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
    // Add absolute URL for API calls to ensure proper routing
    const apiUrl = window.location.origin + '/api/generate';
    console.log('Sending request to:', apiUrl);
    
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: historyForApi,
        competency: selectedCompetency,
        rankCategory,
        rank,
      }),
    });
    
    // Improved error handling for non-JSON responses
    if (!resp.ok) {
      const contentType = resp.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await resp.json();
        throw new Error(errorData.error || `Request failed with status: ${resp.status}`);
      } else {
        // Handle HTML or other non-JSON error responses
        const errorText = await resp.text();
        console.error('Received non-JSON error response:', errorText.substring(0, 200) + '...');
        throw new Error(`API error (${resp.status}): The server returned an unexpected response format`);
      }
    }
    
    // Parse response data with error handling
    let data;
    try {
      data = await resp.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse API response as JSON');
    }
    
    // Validate the response data
    if (!data || !data.success) {
      throw new Error(data?.error || 'API returned unsuccessful response');
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
    console.error('Chat error:', err);
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
                    'max-w-[85%] rounded-lg px-4 py-2',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground',
                    m.type === 'error' && 'bg-destructive text-destructive-foreground'
                  )}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {m.competency && m.role === 'user' && (
                    <div className="mt-1 text-xs opacity-80">
                      Competency: {m.competency}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* input area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Describe your achievement for ${selectedCompetency}...`}
          className={cn(
            'min-h-[80px] w-full resize-none rounded-md border border-ring bg-background px-3 py-2 pr-10 text-foreground shadow-sm',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isMobile ? 'text-base' : 'text-sm'
          )}
          disabled={isLoading}
        />

        {/* Speech to text button */}
        <div className="absolute bottom-2 right-12">
          {isMobile ? (
            <MobileSpeechButton onTranscript={handleSpeechTranscript} />
          ) : (
            <SpeechToText onTranscript={handleSpeechTranscript} />
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          className={cn(
            'absolute bottom-2 right-2 rounded-md p-2 text-foreground transition-colors',
            'hover:bg-primary hover:text-primary-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground'
          )}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRightCircle className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-2 text-sm text-destructive">{errorMessage}</div>
      )}
    </div>
  );
}
