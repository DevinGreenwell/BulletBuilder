// --- START OF COMPLETE src/app/page.tsx ---
'use client';

import { useState, useMemo, useEffect } from 'react'; // Added useEffect and useMemo if not already present
import ChatInterface from '@/components/chat/ChatInterface';
import BulletEditor from '@/components/bullets/BulletEditor';
import OERPreview from '@/components/oer/OERPreview';
import RankSelector from '@/components/ui/RankSelector';
import { Card } from '@/components/ui/card'; 
import BuyMeCoffeeButton from '@/components/ui/BuyMeCoffeeButton';

// Define the structure for a bullet
// Ensure this matches the Bullet interface in BulletEditor.tsx
interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt: number; 
  source?: string;   
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'bullets' | 'oer'>('chat');
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [rankCategory, setRankCategory] = useState<'Officer' | 'Enlisted'>('Officer');
  const [rank, setRank] = useState('O3'); 

  const defaultOfficerRank = "O1"; 
  const defaultEnlistedRank = "E4"; 

  const handleRankCategoryChange = (newCategory: string) => {
    const category = newCategory as 'Officer' | 'Enlisted';
    setRankCategory(category);
    setRank(category === 'Officer' ? defaultOfficerRank : defaultEnlistedRank);
  };

  const handleRankChange = (newRank: string) => {
    setRank(newRank);
  };

  const handleBulletGenerated = (newBullet: Bullet) => {
    console.log("page.tsx: handleBulletGenerated received new bullet:", newBullet);
    if (!newBullet.id || !newBullet.competency || !newBullet.content) {
      console.error("page.tsx: Invalid bullet data received in handleBulletGenerated:", newBullet);
      return;
    }
    setBullets(prevBullets => {
      // Check if bullet already exists to prevent duplicates from chat
      if (prevBullets.some(b => b.id === newBullet.id)) {
        console.log("page.tsx: Bullet already exists, not adding:", newBullet.id);
        return prevBullets;
      }
      const updatedBullets = [...prevBullets, newBullet];
      console.log("page.tsx: Updated bullets state after generation:", updatedBullets);
      return updatedBullets;
    });
    setActiveTab('bullets');
    console.log("page.tsx: Switched to 'bullets' tab after generation");
  };

  // Handler for when bullets are modified in BulletEditor
  const handleBulletsChanged = (updatedBulletsFromEditor: Bullet[]) => {
    console.log("page.tsx: handleBulletsChanged received from BulletEditor:", updatedBulletsFromEditor);
    // Check the isApplied status of a few bullets for debugging
    if (updatedBulletsFromEditor.length > 0) {
        updatedBulletsFromEditor.slice(0, 3).forEach(b => {
            console.log(`page.tsx: Bullet ID ${b.id}, isApplied: ${b.isApplied}`);
        });
    }
    setBullets(updatedBulletsFromEditor);
  };

  // For debugging: Log the bullets state whenever it changes
  useEffect(() => {
    console.log("page.tsx: 'bullets' state has changed to:", bullets);
  }, [bullets]);

  const getEvaluationTitle = () => {
    return rankCategory === 'Officer' ? 'Officer Evaluation Report' : 'Enlisted Evaluation Report';
  };

  const getPreviewTabLabel = () => {
    return rankCategory === 'Officer' ? 'OER Preview' : 'Evaluation Preview';
  };

  // Memoize the bullets passed to OERPreview to ensure it only re-renders when necessary.
  // This is especially important if OERPreview does its own filtering.
  const bulletsForPreview = useMemo(() => {
    // OERPreview itself will filter for applied bullets, so we pass all of them.
    // The key is that this `bullets` array reference changes when `setBullets` is called.
    console.log("page.tsx: Recalculating bulletsForPreview. Current bullets state:", bullets);
    return bullets; 
  }, [bullets]);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-background text-foreground">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-center text-2xl font-bold md:text-3xl text-foreground">
          USCG {getEvaluationTitle()} Generator
        </h1>

        <Card className="mb-6 p-4 md:p-6 bg-card text-card-foreground border border-border shadow-sm">
          <RankSelector
            selectedRankCategory={rankCategory}
            selectedRank={rank}
            onRankCategoryChange={handleRankCategoryChange}
            onRankChange={handleRankChange}
          />
        </Card>

        <div className="mb-6">
          <div className="flex border-b border-border">
            {(['chat', 'bullets', 'oer'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary' // Adjusted for better visibility
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'chat'
                  ? 'Generate Bullets'
                  : tab === 'bullets'
                  ? 'Manage Bullets'
                  : getPreviewTabLabel()}
              </button>
            ))}
          </div>
        </div>

        <Card className="p-4 md:p-6 bg-card text-card-foreground border border-border shadow-sm">
          {activeTab === 'chat' && (
            <ChatInterface
              onBulletGenerated={handleBulletGenerated}
              rankCategory={rankCategory}
              rank={rank}
            />
          )}
          {activeTab === 'bullets' && (
            <BulletEditor
              initialBullets={bullets} // Pass the current state of bullets
              onBulletsChanged={handleBulletsChanged} // This updates the state in page.tsx
            />
          )}
          {activeTab === 'oer' && (
            // OERPreview receives the full list of bullets.
            // It should internally filter for bullets where isApplied is true.
            <OERPreview
              bullets={bulletsForPreview} // Pass the memoized or direct bullets state
              rankCategory={rankCategory}
              rank={rank}
            />
          )}
        </Card>

        <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-center text-sm text-muted-foreground">
          This application helps generate performance bullets and create {getEvaluationTitle()}s.
        </p>
        <div className="mt-2">
          <BuyMeCoffeeButton />
        </div>
      </div>
      </div>
    </main>
  );
}
// --- END OF COMPLETE src/app/page.tsx ---
