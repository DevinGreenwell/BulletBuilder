// src/hooks/useUserPersistence.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { Bullet } from '@/types/bullets';

interface UserPreferences {
  rankCategory: 'Officer' | 'Enlisted';
  rank: string;
  lastActiveTab: 'chat' | 'bullets' | 'oer';
  competencyPreferences: string[];
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  competency?: string;
  timestamp: number;
  type?: 'bullet' | 'question' | 'error';
}

interface ChatSession {
  messages: DisplayMessage[];
  lastCompetency: string;
}

interface UserData {
  bullets: Bullet[];
  preferences: UserPreferences;
  chatSessions: { [sessionId: string]: ChatSession };
  evaluationData: {
    startDate: string;
    endDate: string;
    officerName: string;
    unitName: string;
    position: string;
  };
  bulletWeights: { [bulletId: string]: string };
  summaries: { [category: string]: string };
}

const defaultUserData: UserData = {
  bullets: [],
  preferences: {
    rankCategory: 'Officer',
    rank: 'O3',
    lastActiveTab: 'chat',
    competencyPreferences: []
  },
  chatSessions: {},
  evaluationData: {
    startDate: '',
    endDate: '',
    officerName: '',
    unitName: '',
    position: ''
  },
  bulletWeights: {},
  summaries: {}
};

export function useUserPersistence() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [workId, setWorkId] = useState<string | null>(null);
  
  // Use refs to prevent infinite re-renders
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Load user data when session is available
  const loadUserData = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user-data');
      if (!response.ok) {
        if (response.status === 404) {
          // No saved data yet, use defaults
          setUserData(defaultUserData);
          setIsLoading(false);
          return;
        }
        throw new Error(`Failed to load user data: ${response.status}`);
      }

      const data: unknown = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const latestWork = data[0] as { id: string; content: UserData };
        setWorkId(latestWork.id);
        
        // Merge saved data with defaults to ensure all fields exist
        const parsedData: UserData = {
          bullets: latestWork.content.bullets || defaultUserData.bullets,
          preferences: {
            ...defaultUserData.preferences,
            ...latestWork.content.preferences
          },
          chatSessions: latestWork.content.chatSessions || defaultUserData.chatSessions,
          evaluationData: {
            ...defaultUserData.evaluationData,
            ...latestWork.content.evaluationData
          },
          bulletWeights: latestWork.content.bulletWeights || defaultUserData.bulletWeights,
          summaries: latestWork.content.summaries || defaultUserData.summaries
        };
        
        setUserData(parsedData);
      } else {
        setUserData(defaultUserData);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      setUserData(defaultUserData);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  // Save user data with debouncing
  const saveUserData = useCallback(async (data: Partial<UserData>) => {
    if (status !== 'authenticated' || !session?.user?.id || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');
      setError(null);

      const updatedData = { ...userData, ...data };
      setUserData(updatedData);

      const payload = {
        userId: session.user.id,
        content: updatedData,
        title: 'USCG Evaluation Data',
        ...(workId ? { id: workId } : {})
      };

      const response = await fetch('/api/user-data', {
        method: workId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to save user data: ${response.status}`);
      }

      const responseData: { id?: string } = await response.json();
      if (!workId && responseData.id) {
        setWorkId(responseData.id);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user data');
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [session, status, userData, workId]);

  // Debounced save function
  const debouncedSave = useCallback((changes: Partial<UserData>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveUserData(changes);
    }, 1000); // 1 second debounce
  }, [saveUserData]);

  // Specific helper functions
  const updateBullets = useCallback((bullets: Bullet[]) => {
    const changes = { bullets };
    setUserData(prev => ({ ...prev, ...changes }));
    debouncedSave(changes);
  }, [debouncedSave]);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    const changes = { 
      preferences: { 
        ...userData.preferences, 
        ...preferences 
      } 
    };
    setUserData(prev => ({ ...prev, ...changes }));
    debouncedSave(changes);
  }, [debouncedSave, userData.preferences]);

  const updateEvaluationData = useCallback((evaluationData: Partial<UserData['evaluationData']>) => {
    const changes = { 
      evaluationData: { 
        ...userData.evaluationData, 
        ...evaluationData 
      } 
    };
    setUserData(prev => ({ ...prev, ...changes }));
    debouncedSave(changes);
  }, [debouncedSave, userData.evaluationData]);

  const updateBulletWeights = useCallback((bulletWeights: { [bulletId: string]: string }) => {
    const changes = { bulletWeights };
    setUserData(prev => ({ ...prev, ...changes }));
    debouncedSave(changes);
  }, [debouncedSave]);

  const updateSummaries = useCallback((summaries: { [category: string]: string }) => {
    const changes = { summaries };
    setUserData(prev => ({ ...prev, ...changes }));
    debouncedSave(changes);
  }, [debouncedSave]);

  const saveChatSession = useCallback((sessionId: string, chatSession: ChatSession) => {
    const changes = { 
      chatSessions: { 
        ...userData.chatSessions, 
        [sessionId]: chatSession 
      } 
    };
    setUserData(prev => ({ ...prev, ...changes }));
    debouncedSave(changes);
  }, [debouncedSave, userData.chatSessions]);

  // Load data on session change
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    userData,
    isLoading,
    error,
    saveStatus,
    
    // Actions
    updateBullets,
    updatePreferences,
    updateEvaluationData,
    updateBulletWeights,
    updateSummaries,
    saveChatSession,
    
    // Manual save/load
    saveUserData,
    loadUserData,
    
    // Status
    isAuthenticated: status === 'authenticated'
  };
}