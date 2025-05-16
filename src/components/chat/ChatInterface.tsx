'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from 'react';
import { ArrowRightCircle, Loader2 } from 'lucide-react'; // ArrowRightSquare was removed as unused
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Added missing Button import
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
      return 'Other'; // Fallback category if not found
    },
    [rank, rankCategory, competencyDefinitions]
  );

  /* populate default competency */
  useEffect(() => {
    const currentCompetencies = getCompetencies();
    if (currentCompetencies.length > 0) {
      if (!selectedCompetency || !currentCompetencies.includes(selectedCompetency)) {
        setSelectedCompetency(currentCompetencies[0]);
      }
    }
  }, [getCompetencies, selectedCompetency]);

  /* scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  /* Focus input when not loading */
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  /* ───────────  bullet detection  ─────────── */
  function detectBullet(text: string): { isBullet: boolean; bulletContent: string } {
    const exactPrefixes = [
      "OK, here's a draft bullet:",
      "Here's a draft bullet:",
      "Here's your bullet:",
      'Bullet:'
    ];

    if (text.includes('?') && !text.toLowerCase().includes('bullet')) {
      return { isBullet: false, bulletContent: '' };
    }

    for (const prefix of exactPrefixes) {
      const lowerText = text.toLowerCase();
      const lowerPrefix = prefix.toLowerCase();
      if (lowerText.startsWith(lowerPrefix)) { 
        let bulletText = text.substring(prefix.length).trim();
        
        const paragraphBreakIndex = bulletText.indexOf('\n\n');
        if (paragraphBreakIndex !== -1) {
          bulletText = bulletText.substring(0, paragraphBreakIndex).trim();
        }
        
        const closers = ["Is there anything else I can help you with?", "Let me know if you need further adjustments."];
        for (const closer of closers) {
          if (bulletText.endsWith(closer)) {
            bulletText = bulletText.substring(0, bulletText.length - closer.length).trim();
          }
        }

        if (bulletText) {
          return { isBullet: true, bulletContent: bulletText };
        }
      }
    }
    return { isBullet: false, bulletContent: '' };
  }

  /* ───────────  Speech-to-text handler  ─────────── */
  const handleSpeechTranscript = useCallback((transcript: string) => {
    setInput(prev => {
      if (prev.trim()) {
        return `${prev.trim()} ${transcript}`;
      }
      return transcript;
    });
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100); 
  }, []);

  /* ───────────  API call  ─────────── */
  const handleSendMessage = async () => {
    const cleanInput = input.trim();
    if (!cleanInput || !selectedCompetency || isLoading) return;

    setErrorMessage(null); 

    const userMsg: DisplayMessage = {
      id: msgId(),
      role: 'user',
      content: cleanInput,
      competency: selectedCompetency,
      timestamp: Date.now(),
    };
    setDisplayMessages(prev => [...prev, userMsg]);
    setInput(''); 
    setIsLoading(true);

    const historyForApi: ApiMessage[] = displayMessages
      .filter(m => m.type !== 'error') 
      .map(m => ({ role: m.role, content: m.content }));
    historyForApi.push({ role: userMsg.role, content: userMsg.content });


    try {
      const apiUrl = window.location.origin + '/api/generate';
      console.log('Sending request to:', apiUrl, { history: historyForApi, competency: selectedCompetency, rankCategory, rank });
      
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
      
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type');
        let errorDetail = `Request failed with status: ${resp.status}`;
        if (contentType && contentType.includes('application/json')) {
          const errorData = await resp.json();
          errorDetail = errorData.error || errorDetail;
        } else {
          const errorText = await resp.text();
          console.error('Received non-JSON error response:', errorText.substring(0, 200) + '...');
          errorDetail = `API error (${resp.status}): Unexpected response format.`;
        }
        throw new Error(errorDetail);
      }
      
      let data;
      try {
        data = await resp.json();
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse API response. Please check the server logs.');
      }
      
      if (!data || !data.success || typeof data.response !== 'string') {
        throw new Error(data?.error || 'API returned an unsuccessful or invalid response.');
      }

      const assistantResponseText: string = data.response;
      
      if (!assistantResponseText.trim()) {
        throw new Error('Received an empty response from the API.');
      }
      
      const { isBullet, bulletContent } = detectBullet(assistantResponseText);
      let finalContent = assistantResponseText;
      const msgType: DisplayMessage['type'] = isBullet ? 'bullet' : 'question';

      if (isBullet && bulletContent && bulletContent.length > 10 && onBulletGenerated) {
        const newBulletId = bulletId();
        const bulletObj: BulletData = {
          id: newBulletId,
          competency: selectedCompetency,
          content: bulletContent,
          isApplied: false,
          category: getCategoryFromCompetency(selectedCompetency),
          createdAt: Date.now(),
          source: `chat_${userMsg.id}`, 
        };
        
        onBulletGenerated(bulletObj);
        finalContent = wrapWithNotice(assistantResponseText); 
      }
      
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
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setErrorMessage(errorMsg); 
      setDisplayMessages(prev => [
        ...prev,
        {
          id: msgId(),
          role: 'assistant',
          content: `Error: ${errorMsg}`, 
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
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      setDisplayMessages([]);
      setInput('');
      setErrorMessage(null); 
    }
  };

  /* ───────────  keydown helper  ─────────── */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    } 
    else if (!isMobileDevice && e.key === 'Enter' && !e.shiftKey && !isLoading) {
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
            htmlFor="competency-select" 
            className="mb-1 block text-sm font-medium text-card-foreground"
          >
            Select Competency Area:
          </label>
          <select
            id="competency-select"
            value={selectedCompetency}
            onChange={e => setSelectedCompetency(e.target.value)}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm', 
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            )}
          >
            {getCompetencies().map(c => (
              <option key={c} value={c}>{c}</option> 
            ))}
          </select>
        </div>

        {displayMessages.length > 0 && (
          <Button
            variant="ghost" 
            size="sm"
            onClick={handleReset}
            className="text-destructive hover:text-destructive focus:ring-destructive"
          >
            Clear Chat
          </Button>
        )}
      </div>

      {/* chat history */}
      <div
        className={cn(
          'mb-4 flex-1 overflow-y-auto rounded-md border border-border bg-card p-4 text-card-foreground shadow-inner', 
          isMobile ? 'min-h-[200px] max-h-[calc(100vh-350px)]' : 'min-h-[300px] max-h-[calc(100vh-400px)]' 
        )}
      >
        {displayMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-base">Enter your achievement below or use the microphone.</p>
            <p className="mt-2 text-sm">
              The assistant will refine it into a{' '}
              <span className="font-semibold text-foreground">{selectedCompetency || 'selected'}</span> bullet for{' '}
              <span className="font-semibold text-foreground">{rankCategory} {rank}</span>.
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
                    'max-w-[85%] rounded-lg px-3 py-2 shadow-sm', 
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground', 
                    m.type === 'error' && 'bg-destructive text-destructive-foreground'
                  )}
                >
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                  {m.competency && m.role === 'user' && (
                    <div className="mt-1 text-xs opacity-70">
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
          placeholder={isLoading ? "Assistant is typing..." : `Describe your achievement for ${selectedCompetency}...`}
          className={cn(
            'min-h-[80px] w-full resize-none rounded-md border border-input bg-background p-3 pr-20 text-sm text-foreground shadow-sm', 
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isMobile ? 'text-base' : 'text-sm'
          )}
          disabled={isLoading}
          rows={isMobile ? 2 : 3} 
        />

        <div className="absolute bottom-2.5 right-11 flex items-center"> 
          {isMobile ? (
            <MobileSpeechButton onTranscript={handleSpeechTranscript} />
          ) : (
            <SpeechToText onTranscript={handleSpeechTranscript} />
          )}
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
          size="icon" 
          className="absolute bottom-2 right-2" 
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRightCircle className="h-5 w-5" />
          )}
        </Button>
      </div>

      {errorMessage && (
        <div className="mt-2 rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
