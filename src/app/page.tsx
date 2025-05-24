// src/app/page.tsx

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSession } from 'next-auth/react';
import ChatInterface from '@/components/chat/ChatInterface';
import BulletEditor from '@/components/bullets/BulletEditor';
import OERPreview from '@/components/oer/OERPreview';
import RankSelector from '@/components/ui/RankSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BuyMeCoffeeButton from '@/components/SplashScreen';
import { useUserPersistence } from '@/hooks/useUserPersistence';
import { cn } from '@/lib/utils';
import type { Bullet } from '@/types/bullets';

// Tab type
type TabType = 'chat' | 'bullets' | 'oer';

// Tab component for better organization
interface TabProps {
  id: TabType;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const Tab: React.FC<TabProps> = ({ id, isActive, onClick, label }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 font-medium transition-colors',
      isActive 
        ? 'border-b-2 border-ring text-ring' 
        : 'text-muted-foreground hover:text-foreground'
    )}
    role="tab"
    aria-selected={isActive}
    aria-controls={`${id}-panel`}
    id={`${id}-tab`}
  >
    {label}
  </button>
);

// Error fallback component
const ErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-900">
    <h3 className="text-lg font-semibold mb-2">Component Error</h3>
    <p className="text-sm">{error.message || 'An unknown error occurred'}</p>
  </div>
);

// Loading component
const LoadingState = () => (
  <div className="min-h-screen p-4 md:p-8 bg-background text-foreground">
    <div className="mx-auto max-w-6xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-md w-1/2 mx-auto mb-6"></div>
        <div className="h-32 bg-gray-200 rounded-md mb-6"></div>
        <div className="h-12 bg-gray-200 rounded-md mb-6"></div>
        <div className="h-96 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  </div>
);

export default function Home() {
  const { data: session, status } = useSession();
  const {
    userData,
    isLoading: persistenceLoading,
    error: persistenceError,
    saveStatus,
    updateBullets,
    updatePreferences,
    isAuthenticated
  } = useUserPersistence();

  // Local state for UI
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [error, setError] = useState<string | null>(null);

  // Derived state from persisted data
  const bullets = userData?.bullets || [];
  const rankCategory = userData?.preferences.rankCategory || 'Officer';
  const rank = userData?.preferences.rank || 'O3';

  // Initialize tab from persisted data
  useEffect(() => {
    if (!persistenceLoading && userData?.preferences.lastActiveTab) {
      setActiveTab(userData.preferences.lastActiveTab);
    }
  }, [persistenceLoading, userData?.preferences.lastActiveTab]);

  // Constants
  const defaultOfficerRank = "O1";
  const defaultEnlistedRank = "E4";

  // Callbacks
  const handleRankCategoryChange = useCallback((newCategory: string) => {
    const category = newCategory as 'Officer' | 'Enlisted';
    const newRank = category === 'Officer' ? defaultOfficerRank : defaultEnlistedRank;
    
    updatePreferences({
      rankCategory: category,
      rank: newRank
    });
  }, [updatePreferences]);

  const handleRankChange = useCallback((newRank: string) => {
    updatePreferences({ rank: newRank });
  }, [updatePreferences]);

  const handleTabChange = useCallback((newTab: TabType) => {
    setActiveTab(newTab);
    updatePreferences({ lastActiveTab: newTab });
  }, [updatePreferences]);

  const handleBulletGenerated = useCallback(async (newBullet: Bullet) => {
    try {
      console.log("page.tsx: handleBulletGenerated received new bullet:", newBullet);
      
      if (!newBullet.id || !newBullet.competency || !newBullet.content) {
        throw new Error("Invalid bullet data received");
      }

      // Check if bullet already exists
      if (bullets.some(b => b.id === newBullet.id)) {
        console.log("page.tsx: Bullet already exists, not adding:", newBullet.id);
        return;
      }

      // Make sure the new bullet has all required properties
      const completeNewBullet: Bullet = {
        ...newBullet,
        isApplied: newBullet.isApplied ?? false,
        category: newBullet.category ?? '',
        createdAt: newBullet.createdAt ?? Date.now(),
      };

      const updatedBullets = [...bullets, completeNewBullet];
      updateBullets(updatedBullets);
      console.log("page.tsx: Updated bullets state after generation:", updatedBullets);

      handleTabChange('bullets');
      setError(null);
    } catch (err) {
      console.error("Error in handleBulletGenerated:", err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the bullet');
      throw err;
    }
  }, [bullets, updateBullets, handleTabChange]);

  const handleBulletsChanged = useCallback((updatedBulletsFromEditor: Bullet[]) => {
    console.log("page.tsx: handleBulletsChanged received from BulletEditor:", updatedBulletsFromEditor);
    
    // Ensure all bullets have required properties
    const completeUpdatedBullets: Bullet[] = updatedBulletsFromEditor.map(bullet => ({
      ...bullet,
      createdAt: bullet.createdAt || Date.now(),
      isApplied: Boolean(bullet.isApplied)
    }));
    
    updateBullets(completeUpdatedBullets);
    setError(null);
  }, [updateBullets]);

  // Memoized values
  const getEvaluationTitle = useCallback(() => {
    return rankCategory === 'Officer' ? 'Officer Evaluation Report' : 'Enlisted Evaluation Report';
  }, [rankCategory]);

  const getPreviewTabLabel = useCallback(() => {
    return rankCategory === 'Officer' ? 'OER Preview' : 'Evaluation Preview';
  }, [rankCategory]);

  // Tab configuration
  const tabs: { id: TabType; label: string }[] = useMemo(() => [
    { id: 'chat', label: 'Generate Bullets' },
    { id: 'bullets', label: 'Manage Bullets' },
    { id: 'oer', label: getPreviewTabLabel() }
  ], [getPreviewTabLabel]);

  // Function to render the content for the active tab
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatInterface
            onBulletGenerated={handleBulletGenerated}
            rankCategory={rankCategory}
            rank={rank}
          />
        );
      case 'bullets':
        return (
          <BulletEditor
            initialBullets={bullets.map(bullet => ({ ...bullet, isApplied: Boolean(bullet.isApplied) }))}
            onBulletsChanged={handleBulletsChanged}
            rankCategory={rankCategory}
            rank={rank}
          />
        );
      case 'oer':
        return (
          <OERPreview
            bullets={bullets.map(bullet => ({ ...bullet, isApplied: Boolean(bullet.isApplied) }))}
            rankCategory={rankCategory}
            rank={rank}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state while data is being loaded
  if (persistenceLoading || status === 'loading') {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-center text-2xl font-bold md:text-3xl text-foreground flex-1">
            USCG {getEvaluationTitle()} Generator
          </h1>
          
          {/* Save status indicator */}
          {isAuthenticated && (
            <div className="text-sm">
              {saveStatus === 'saving' && (
                <span className="text-blue-600">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-600">Saved</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600">Save failed</span>
              )}
            </div>
          )}
        </div>

        {/* Authentication notice */}
        {!isAuthenticated && (
          <div className="mb-6">
            <Alert>
              <AlertDescription>
                Sign in to save your work and access it across sessions.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Persistence error */}
        {persistenceError && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertDescription>
                Data persistence error: {persistenceError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Rank Selector */}
        <div className="mb-6 p-4 md:p-6 bg-card text-card-foreground border border-border rounded-md shadow-sm">
          <ErrorBoundary 
            fallbackRender={({ error }) => (
              <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-900">
                <h3 className="text-lg font-semibold mb-2">Rank Selector Error</h3>
                <p className="text-sm">{error.message || 'An unknown error occurred'}</p>
              </div>
            )}
          >
            <RankSelector
              selectedRankCategory={rankCategory}
              selectedRank={rank}
              onRankCategoryChange={handleRankCategoryChange}
              onRankChange={handleRankChange}
            />
          </ErrorBoundary>
        </div>

        {/* Tabs Navigation */}
        <nav className="mb-6">
          <div className="flex border-b border-border" role="tablist">
            {tabs.map(tab => (
              <Tab
                key={tab.id}
                id={tab.id}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                label={tab.label}
              />
            ))}
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="p-4 md:p-6 bg-card text-card-foreground border border-border rounded-md shadow-sm">
          {error && (
            <div className="mb-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          
          <div 
            key={activeTab} 
            role="tabpanel" 
            id={`${activeTab}-panel`}
            aria-labelledby={`${activeTab}-tab`}
          >
            <ErrorBoundary 
              fallbackRender={({ error }) => (
                <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-900">
                  <h3 className="text-lg font-semibold mb-2">Component Error</h3>
                  <p className="text-sm">{error.message || 'An unknown error occurred'}</p>
                </div>
              )}
            >
              {renderActiveTabContent()}
            </ErrorBoundary>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-sm text-muted-foreground">
            This application helps generate performance bullets and create {getEvaluationTitle()}s.
            {isAuthenticated && (
              <span className="block mt-1">
                Your work is automatically saved.
              </span>
            )}
          </p>
          <div className="mt-2">
            <ErrorBoundary 
              fallbackRender={({ error }) => (
                <div className="p-2 border border-red-200 rounded-md bg-red-50 text-red-900 text-xs">
                  <p>Button Error: {error.message}</p>
                </div>
              )}
            >
              <BuyMeCoffeeButton />
            </ErrorBoundary>
          </div>
        </footer>
      </div>
    </main>
  );
}