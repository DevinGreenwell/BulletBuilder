// SYSTEMATIC DEBUGGING: Since RankSelector isn't using Radix, 
// the issue is in other shadcn/ui components that use Radix internally

// STEP 1: Create a minimal test version of your page.tsx
// Replace your current page.tsx with this to isolate the issue:

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BuyMeCoffeeButton } from '@/components/SplashScreen';
import RankSelector from '@/components/ui/RankSelector';
import { useUserPersistence } from '@/hooks/useUserPersistence';
import { cn } from '@/lib/utils';

type TabType = 'chat' | 'bullets' | 'oer';

// Simple Tab component (this one is definitely not the issue)
const Tab: React.FC<{
  id: TabType;
  isActive: boolean;
  onClick: () => void;
  label: string;
}> = ({ id, isActive, onClick, label }) => (
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

export default function TestingHome() {
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

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [error, setError] = useState<string | null>(null);
  const [testPhase, setTestPhase] = useState(0);

  const bullets = userData?.bullets || [];
  const rankCategory = userData?.preferences.rankCategory || 'Officer';
  const rank = userData?.preferences.rank || 'O3';

  const handleRankCategoryChange = useCallback((newCategory: string) => {
    const category = newCategory as 'Officer' | 'Enlisted';
    const newRank = category === 'Officer' ? "O1" : "E4";
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

  const getEvaluationTitle = useCallback(() => {
    return rankCategory === 'Officer' ? 'Officer Evaluation Report' : 'Enlisted Evaluation Report';
  }, [rankCategory]);

  const getPreviewTabLabel = useCallback(() => {
    return rankCategory === 'Officer' ? 'OER Preview' : 'Evaluation Preview';
  }, [rankCategory]);

  const tabs: { id: TabType; label: string }[] = useMemo(() => [
    { id: 'chat', label: 'Generate Bullets' },
    { id: 'bullets', label: 'Manage Bullets' },
    { id: 'oer', label: getPreviewTabLabel() }
  ], [getPreviewTabLabel]);

  if (persistenceLoading || status === 'loading') {
    return <LoadingState />;
  }

  // DEBUGGING PHASES - Test each component incrementally
  const renderTestPhase = () => {
    switch (testPhase) {
      case 0:
        return <div>Phase 0: Basic content (no Radix components)</div>;
      
      case 1:
        return (
          <div>
            <div>Phase 1: Testing RankSelector</div>
            <RankSelector
              selectedRankCategory={rankCategory}
              selectedRank={rank}
              onRankCategoryChange={handleRankCategoryChange}
              onRankChange={handleRankChange}
            />
          </div>
        );
      
      case 2:
        return (
          <div>
            <div>Phase 2: Testing Alert components</div>
            <Alert>
              <AlertDescription>
                Test alert message
              </AlertDescription>
            </Alert>
          </div>
        );
      
      case 3:
        return (
          <div>
            <div>Phase 3: Testing Alert with error variant</div>
            <Alert variant="destructive">
              <AlertDescription>
                Test error alert
              </AlertDescription>
            </Alert>
          </div>
        );
      
      case 4:
        return (
          <div>
            <div>Phase 4: Testing Tab navigation</div>
            <nav>
              <div className="flex border-b border-ring" role="tablist">
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
          </div>
        );
      
      case 5:
        return (
          <div>
            <div>Phase 5: Testing BuyMeCoffeeButton</div>
            <BuyMeCoffeeButton />
          </div>
        );
      
      case 6:
        // Only test this if phases 0-5 work
        // Uncomment one of these imports at a time to test:
        
        // import ChatInterface from '@/components/chat/ChatInterface';
        // import BulletEditor from '@/components/bullets/BulletEditor';
        // import OERPreview from '@/components/oer/OERPreview';
        
        return (
          <div>
            <div>Phase 6: Testing tab content components</div>
            <div>Uncomment and test ChatInterface, BulletEditor, OERPreview one by one</div>
            {/* 
            <ChatInterface
              onBulletGenerated={() => {}}
              rankCategory={rankCategory}
              rank={rank}
            />
            */}
          </div>
        );
      
      default:
        return <div>All phases tested!</div>;
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">
            DEBUGGING MODE - Testing Radix Components
          </h1>
          
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p><strong>Current Phase: {testPhase}</strong></p>
            <p>Click "Next Phase" to test components incrementally</p>
            <p>If the error appears, the component in the current phase is the culprit!</p>
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTestPhase(prev => Math.max(0, prev - 1))}
              className="px-4 py-2 bg-gray-500 text-white rounded"
              disabled={testPhase === 0}
            >
              Previous Phase
            </button>
            <button
              onClick={() => setTestPhase(prev => Math.min(6, prev + 1))}
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={testPhase === 6}
            >
              Next Phase
            </button>
            <button
              onClick={() => setTestPhase(0)}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Reset to Phase 0
            </button>
          </div>
        </div>

        <div className="p-6 bg-card border border-ring rounded-md">
          {renderTestPhase()}
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Start at Phase 0 (should work fine)</li>
            <li>Click "Next Phase" to advance</li>
            <li>If the React.Children.only error appears, note which phase caused it</li>
            <li>That component is your culprit!</li>
            <li>Common culprits: Alert components, Select components in ChatInterface/BulletEditor</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

// STEP 2: Common fixes for when you find the problematic component

// Fix for Alert components (most likely culprit):
const CorrectAlertUsage = () => (
  <>
    {/* ✅ CORRECT - Only AlertDescription */}
    <Alert>
      <AlertDescription>Your message here</AlertDescription>
    </Alert>
    
    {/* ❌ WRONG - Multiple children */}
    {/* 
    <Alert>
      <AlertIcon />
      <AlertDescription>Your message here</AlertDescription>
      <div>Extra content</div>
    </Alert>
    */}
  </>
);

// Fix for Select components (if they exist in ChatInterface/BulletEditor):
const CorrectSelectUsage = () => (
  <>
    {/* ✅ CORRECT - Proper Radix Select structure */}
    {/*
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="item1">Item 1</SelectItem>
        <SelectItem value="item2">Item 2</SelectItem>
      </SelectContent>
    </Select>
    */}
    
    {/* ❌ WRONG - Extra children in SelectTrigger or SelectContent */}
    {/*
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select..." />
        <ExtraIcon />  // This causes the error!
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="item1">Item 1</SelectItem>
        <div>Extra content</div>  // This causes the error!
      </SelectContent>
    </Select>
    */}
  </>
);

// STEP 3: Once you identify the problematic component:
// 1. Check all Alert components for multiple children
// 2. Check all Select components for extra elements
// 3. Check any other shadcn/ui components for proper usage
// 4. Look for React Fragments or arrays being passed as children to Radix components