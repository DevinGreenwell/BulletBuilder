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
        ? 'border-b-2 border-primary text-primary' 
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

export default function Home() {
  const { data: session, status } = useSession();
  
  // Local state management (without persistence for now)
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [error, setError] = useState<string | null>(null);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [rankCategory, setRankCategory] = useState<'Officer' | 'Enlisted'>('Officer');
  const [rank, setRank] = useState('O3');

  // Constants
  const defaultOfficerRank = "O1";
  const defaultEnlistedRank = "E4";

  // Callbacks
  const handleRankCategoryChange = useCallback((newCategory: string) => {
    const category = newCategory as 'Officer' | 'Enlisted';
    const newRank = category === 'Officer' ? defaultOfficerRank : defaultEnlistedRank;
    
    setRankCategory(category);
    setRank(newRank);
  }, []);

  const handleRankChange = useCallback((newRank: string) => {
    setRank(newRank);
  }, []);

  const handleTabChange = useCallback((newTab: TabType) => {
    setActiveTab(newTab);
  }, []);

  const handleBulletGenerated = useCallback(async (newBullet: Bullet) => {
    try {
      console.log("page.tsx: handleBulletGenerated received new bullet:", newBullet);
      
      if (!newBullet.id || !newBullet.competency || !newBullet.content) {
        throw new Error("Invalid bullet data received");
      }

      setBullets(prevBullets => {
        if (prevBullets.some(b => b.id === newBullet.id)) {
          console.log("page.tsx: Bullet already exists, not adding:", newBullet.id);
          return prevBullets;
        }

        // Make sure the new bullet has all required properties
        const completeNewBullet: Bullet = {
          ...newBullet,
          isApplied: newBullet.isApplied ?? false,
          category: newBullet.category ?? '',
          createdAt: newBullet.createdAt ?? Date.now(),
        };

        const updatedBullets = [...prevBullets, completeNewBullet];
        console.log("page.tsx: Updated bullets state after generation:", updatedBullets);
        return updatedBullets;
      });

      handleTabChange('bullets');
      setError(null);
    } catch (err) {
      console.error("Error in handleBulletGenerated:", err);
      setError(err instanceof Error ? err.message : 'An error occurred while generating the bullet');
      throw err;
    }
  }, [handleTabChange]);

  const handleBulletsChanged = useCallback((updatedBulletsFromEditor: any[]) => {
    console.log("page.tsx: handleBulletsChanged received from BulletEditor:", updatedBulletsFromEditor);
    
    // Ensure all bullets have required properties
    const completeUpdatedBullets: Bullet[] = updatedBulletsFromEditor.map(bullet => ({
      ...bullet,
      createdAt: bullet.createdAt || Date.now(),
      isApplied: Boolean(bullet.isApplied) // Ensure strict boolean type
    }));
    
    setBullets(completeUpdatedBullets);
    setError(null);
  }, []);

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
            initialBullets={bullets.map(bullet => ({
              ...bullet,
              isApplied: Boolean(bullet.isApplied)
            }))}
            onBulletsChanged={handleBulletsChanged}
          />
        );
      case 'oer':
        return (
          <OERPreview
            bullets={bullets
              .filter((bullet): bullet is Bullet & { id: string } => 
                typeof bullet.id === 'string' && bullet.id.length > 0
              )
              .map(bullet => ({
                ...bullet,
                isApplied: Boolean(bullet.isApplied)
              }))
            }
            rankCategory={rankCategory}
            rank={rank}
          />
        );
      default:
        return null;
    }
  };

  const isAuthenticated = status === 'authenticated';

  return (
    <main className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-center text-2xl font-bold md:text-3xl text-foreground flex-1">
            USCG {getEvaluationTitle()} Generator
          </h1>
        </div>

        {/* Authentication notice */}
        {!isAuthenticated && (
          <div className="flex m-6">
            <Alert>
              <AlertDescription>
                Sign in to save your work and access it across sessions.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Rank Selector */}
        <div className="mb-6 p-4 md:p-6 bg-card text-card-foreground border border-ring shadow-sm">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <div>
              <RankSelector
                selectedRankCategory={rankCategory}
                selectedRank={rank}
                onRankCategoryChange={handleRankCategoryChange}
                onRankChange={handleRankChange}
              />
            </div>
          </ErrorBoundary>
        </div>

        {/* Tabs Navigation */}
        <nav className="mb-6">
          <div className="flex border-b border-ring">
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
        <div className="p-4 md:p-6 bg-card text-card-foreground border border-ring rounded-md shadow-sm">
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
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <div>
                {renderActiveTabContent()}
              </div>
            </ErrorBoundary>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 flex flex-col items-center gap-2">
          <p className="text-center text-sm text-muted-foreground">
            This application helps generate performance bullets and create {getEvaluationTitle()}s.
          </p>
          <div className="mt-2">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <div>
                <BuyMeCoffeeButton />
              </div>
            </ErrorBoundary>
          </div>
        </footer>
      </div>
    </main>
  );
}