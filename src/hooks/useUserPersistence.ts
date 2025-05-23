// src/hooks/useUserPersistence.ts
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt: number;
  source?: string;
}

interface UserPreferences {
  rankCategory: 'Officer' | 'Enlisted';
  rank: string;
  lastActiveTab: 'chat' | 'bullets' | 'oer';
  competencyPreferences: string[];
}

interface ChatSession {
  messages: any[];
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

      const data = await response.json();
      if (data && data.length > 0) {
        const latestWork = data[0];
        setWorkId(latestWork.id);
        
        // Parse the stored data
        const parsedData: UserData = {
          ...defaultUserData,
          ...latestWork.content
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

  // Save user data
  const saveUserData = useCallback(async (data: Partial<UserData>) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    try {
      setSaveStatus('saving');
      setError(null);

      const updatedData = { ...userData, ...data };
      setUserData(updatedData);

      const payload = {
        userId: session.user.id,
        content: updatedData,
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

      const responseData = await response.json();
      if (!workId && responseData.id) {
        setWorkId(responseData.id);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user data');
      setSaveStatus('error');
    }
  }, [session, status, userData, workId]);

  // Auto-save with debouncing
  const [pendingChanges, setPendingChanges] = useState<Partial<UserData> | null>(null);

  useEffect(() => {
    if (!pendingChanges) return;

    const timeoutId = setTimeout(() => {
      saveUserData(pendingChanges);
      setPendingChanges(null);
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [pendingChanges, saveUserData]);

  // Queue changes for auto-save
  const queueSave = useCallback((changes: Partial<UserData>) => {
    setPendingChanges(prev => ({ ...prev, ...changes }));
  }, []);

  // Specific helper functions
  const updateBullets = useCallback((bullets: Bullet[]) => {
    queueSave({ bullets });
  }, [queueSave]);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    queueSave({ 
      preferences: { 
        ...userData.preferences, 
        ...preferences 
      } 
    });
  }, [queueSave, userData.preferences]);

  const updateEvaluationData = useCallback((evaluationData: Partial<UserData['evaluationData']>) => {
    queueSave({ 
      evaluationData: { 
        ...userData.evaluationData, 
        ...evaluationData 
      } 
    });
  }, [queueSave, userData.evaluationData]);

  const updateBulletWeights = useCallback((bulletWeights: { [bulletId: string]: string }) => {
    queueSave({ bulletWeights });
  }, [queueSave]);

  const updateSummaries = useCallback((summaries: { [category: string]: string }) => {
    queueSave({ summaries });
  }, [queueSave]);

  const saveChatSession = useCallback((sessionId: string, session: ChatSession) => {
    queueSave({ 
      chatSessions: { 
        ...userData.chatSessions, 
        [sessionId]: session 
      } 
    });
  }, [queueSave, userData.chatSessions]);

  // Load data on session change
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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