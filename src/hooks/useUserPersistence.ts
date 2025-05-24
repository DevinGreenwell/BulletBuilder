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

interface UserData {
  bullets: Bullet[];
  preferences: UserPreferences;
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
  
  // Use refs to prevent infinite re-renders and reduce save frequency
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const lastSaveRef = useRef<number>(0);
  const minSaveInterval = 5000; // Minimum 5 seconds between saves

  // Load user data when session is available
  const loadUserData = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 401) {
          // No saved data yet or not authenticated, use defaults
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
        
        // Merge saved data with defaults
        const parsedData: UserData = {
          bullets: Array.isArray(latestWork.content.bullets) ? latestWork.content.bullets : defaultUserData.bullets,
          preferences: {
            ...defaultUserData.preferences,
            ...latestWork.content.preferences
          },
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

  // Save user data with much less frequency
  const saveUserData = useCallback(async (data: Partial<UserData>) => {
    if (status !== 'authenticated' || !session?.user?.id || isSavingRef.current) {
      return;
    }

    // Check if enough time has passed since last save
    const now = Date.now();
    if (now - lastSaveRef.current < minSaveInterval) {
      console.log('Skipping save - too frequent');
      return;
    }

    try {
      isSavingRef.current = true;
      lastSaveRef.current = now;
      setSaveStatus('saving');
      setError(null);

      const updatedData = { ...userData, ...data };
      
      // Update local state immediately for responsiveness
      setUserData(updatedData);

      const payload = {
        userId: session.user.id,
        content: updatedData,
        title: 'USCG Evaluation Data',
        ...(workId ? { id: workId } : {})
      };

      console.log('Saving to /api/user-data with payload:', { 
        userId: payload.userId, 
        hasContent: !!payload.content,
        method: workId ? 'PUT' : 'POST'
      });

      const response = await fetch('/api/user-data', {
        method: workId ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed with response:', errorText);
        throw new Error(`Failed to save: ${response.status} - ${errorText}`);
      }

      const responseData: { id?: string } = await response.json();
      if (!workId && responseData.id) {
        setWorkId(responseData.id);
        console.log('Set workId to:', responseData.id);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save user data');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [session, status, userData, workId]);

  // Very infrequent debounced save function
  const debouncedSave = useCallback((changes: Partial<UserData>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout - much longer delay
    saveTimeoutRef.current = setTimeout(() => {
      saveUserData(changes);
    }, 10000); // 10 second delay
  }, [saveUserData]);

  // Manual save function for important changes
  const manualSave = useCallback((changes: Partial<UserData>) => {
    // Clear any pending debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save immediately
    const updatedData = { ...userData, ...changes };
    setUserData(updatedData);
    saveUserData(changes);
  }, [saveUserData, userData]);

  // Helper functions that update local state immediately
  const updateBullets = useCallback((bullets: Bullet[]) => {
    const changes = { bullets };
    setUserData(prev => ({ ...prev, ...changes }));
    
    // Only save if authenticated, and use manual save for important data like bullets
    if (status === 'authenticated') {
      manualSave(changes);
    }
  }, [manualSave, status]);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    const changes = { 
      preferences: { 
        ...userData.preferences, 
        ...preferences 
      } 
    };
    setUserData(prev => ({ ...prev, ...changes }));
    
    // Use debounced save for preferences (less critical)
    if (status === 'authenticated') {
      debouncedSave(changes);
    }
  }, [debouncedSave, userData.preferences, status]);

  const updateEvaluationData = useCallback((evaluationData: Partial<UserData['evaluationData']>) => {
    const changes = { 
      evaluationData: { 
        ...userData.evaluationData, 
        ...evaluationData 
      } 
    };
    setUserData(prev => ({ ...prev, ...changes }));
    
    if (status === 'authenticated') {
      debouncedSave(changes);
    }
  }, [debouncedSave, userData.evaluationData, status]);

  const updateBulletWeights = useCallback((bulletWeights: { [bulletId: string]: string }) => {
    const changes = { bulletWeights };
    setUserData(prev => ({ ...prev, ...changes }));
    
    if (status === 'authenticated') {
      debouncedSave(changes);
    }
  }, [debouncedSave, status]);

  const updateSummaries = useCallback((summaries: { [category: string]: string }) => {
    const changes = { summaries };
    setUserData(prev => ({ ...prev, ...changes }));
    
    if (status === 'authenticated') {
      debouncedSave(changes);
    }
  }, [debouncedSave, status]);

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
    
    // Manual save/load
    saveUserData,
    loadUserData,
    manualSave,
    
    // Status
    isAuthenticated: status === 'authenticated'
  };
}