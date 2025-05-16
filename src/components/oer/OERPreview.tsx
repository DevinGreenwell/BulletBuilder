'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardCopy } from 'lucide-react'; // Import clipboard icon

// Consistent Bullet interface (matches BulletEditor)
interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt?: number; // Added for consistency
  source?: string;   // Added for consistency
}

interface OERPreviewProps {
  bullets?: Bullet[]; // These are initial/fallback bullets
  rankCategory?: string;
  rank?: string;
}

// Type definitions for component state parts
type BulletWeights = { [bulletId: string]: string };
type CategorySummaries = { [category: string]: string };
type LoadingSummaries = { [category: string]: boolean };
type WeightErrors = { [category: string]: string };

// Interface for the structured content to be saved
interface StructuredContent {
  bullets: Bullet[];
  evaluationData: {
    startDate: string;
    endDate: string;
    officerName: string;
    unitName: string;
    position: string;
  };
  bulletWeights: BulletWeights;
  summaries: CategorySummaries;
}

// Type for the data payload sent to/from the API
// 'content' can be the new structured object or, for backward compatibility during loading, an array of bullets.
type WorkPayload = {
  id?: string;
  userId: string;
  content: StructuredContent | Bullet[]; // Updated content type
};


export default function OERPreview({ bullets: propBullets = [], rankCategory = 'Officer', rank = 'O3' }: OERPreviewProps) {
  const { data: session, status } = useSession();
  const [localBullets, setLocalBullets] = useState<Bullet[]>([]);
  const [workId, setWorkId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);

  // State for evaluation header data
  const [evaluationData, setEvaluationData] = useState({
    startDate: '',
    endDate: '',
    officerName: '',
    unitName: '',
    position: '',
  });

  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [bulletWeights, setBulletWeights] = useState<BulletWeights>({});
  const [summaries, setSummaries] = useState<CategorySummaries>({});
  const [loadingSummaries, setLoadingSummaries] = useState<LoadingSummaries>({});
  const [weightErrors, setWeightErrors] = useState<WeightErrors>({});

  // Load user data when session is available
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'authenticated' && (session?.user as { id: string })?.id) {
      setIsLoading(true);
      
      fetch('/api/work') // Assuming this API returns WorkPayload compatible data
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch user data');
          return res.json();
        })
        .then(apiData => { // Renamed to avoid confusion with component's 'data' state
          // Assuming apiData is an array of work records, e.g., WorkPayload[]
          if (apiData && apiData.length > 0) {
            const latestWork = apiData[0] as WorkPayload; // Assuming sorted by latest first
            setWorkId(latestWork.id);
            
            if (latestWork.content) {
              // Check if content is in the new structured format
              if (typeof latestWork.content === 'object' && 'bullets' in latestWork.content && Array.isArray(latestWork.content.bullets)) {
                const structuredContent = latestWork.content as StructuredContent;
                setLocalBullets(structuredContent.bullets);
                
                if (structuredContent.evaluationData) {
                  setEvaluationData(structuredContent.evaluationData);
                }
                if (structuredContent.bulletWeights) {
                  setBulletWeights(structuredContent.bulletWeights);
                }
                if (structuredContent.summaries) {
                  setSummaries(structuredContent.summaries);
                }
              } else if (Array.isArray(latestWork.content)) {
                // Old format - content is directly the bullets array
                setLocalBullets(latestWork.content as Bullet[]);
              }
            }
          } else {
            // Initialize with prop bullets if no saved data
            setLocalBullets(propBullets);
          }
        })
        .catch(error => {
          console.error('Error loading work data:', error);
          setLocalBullets(propBullets); // Fallback to props
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Not authenticated or no user ID, use prop bullets
      setLocalBullets(propBullets);
      setIsLoading(false);
    }
  }, [propBullets, session, status]); // propBullets is used for initialization

  // Auto-save data when changes occur
  useEffect(() => {
    // Prevent saving if still loading, not authenticated, or no session user ID
    if (isLoading || status !== 'authenticated' || !session?.user?.id) return;
    
    const saveTimeout = setTimeout(() => {
      saveWorkData();
    }, 2000); // Debounce save
    
    return () => clearTimeout(saveTimeout);
  }, [localBullets, evaluationData, bulletWeights, summaries, status, isLoading, session]); // Added isLoading and session to dependencies

  // Function to save work data
  const saveWorkData = async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log("Save aborted: User not authenticated or no user ID.");
      return;
    }
    
    setSaveStatus('Saving...');
    
    try {
      // Construct the structured content
      const structuredContentData: StructuredContent = {
        bullets: localBullets,
        evaluationData: evaluationData,
        bulletWeights: bulletWeights,
        summaries: summaries,
      };

      // Prepare the payload for the API
      const payload: WorkPayload = {
        userId: session.user.id,
        content: structuredContentData,
      };
      
      const method = workId ? 'PUT' : 'POST';
      if (workId) {
        payload.id = workId;
      }
      
      const response = await fetch('/api/work', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500) + '...');
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save data (status: ${response.status})`);
      }
      
      const responseData = await response.json(); // Renamed to avoid conflict
      
      if (!workId && responseData.id) {
        setWorkId(responseData.id);
      }
      
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Error saving work data:', error);
      setSaveStatus('Failed to save');
      // Consider providing more specific feedback to the user if possible
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvaluationData(prev => ({...prev, [name]: value }));
  };

  const copySummaryToClipboard = (category: string, summaryText: string) => {
    navigator.clipboard.writeText(summaryText).then(
      () => {
        setCopiedCategory(category);
        setTimeout(() => setCopiedCategory(null), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy to clipboard');
      }
    );
  };

  // Use propBullets as a fallback if localBullets is empty, ensures appliedBullets always has a source.
  const appliedBullets = useMemo(() => 
    (localBullets.length > 0 ? localBullets : propBullets).filter(bullet => bullet.isApplied), 
    [localBullets, propBullets]
  );

  const groupedBulletsByCategory = useMemo(() => {
    const groups: Record<string, (Bullet & { weight: string })[]> = {};
    const errors: WeightErrors = {};
    const currentWeights = { ...bulletWeights };

    appliedBullets.forEach(bullet => {
        if (currentWeights[bullet.id] === undefined) {
            currentWeights[bullet.id] = ''; // Initialize weight if not present
        }
    });

    appliedBullets.forEach(bullet => {
      const category = bullet.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push({
          ...bullet,
          weight: currentWeights[bullet.id] ?? ''
       });
    });

    Object.entries(groups).forEach(([category, categoryBullets]) => {
        if (categoryBullets.length > 0) {
          const sum = categoryBullets.reduce((acc, b) => acc + (parseInt(b.weight, 10) || 0), 0);
          const hasEnteredWeight = categoryBullets.some(b => b.weight !== '');
          if (hasEnteredWeight && sum !== 100) {
            errors[category] = `Weights must sum to 100% (currently ${sum}%)`;
          } else {
             delete errors[category]; // Clear error if sum is 100 or no weights entered
          }
        }
    });

    // Schedule state updates to avoid direct update during render phase
    // This is a common pattern to handle derived state that also needs to update other state.
    // However, ideally, this logic might be better placed in useEffect hooks.
    if (JSON.stringify(errors) !== JSON.stringify(weightErrors)) {
         setTimeout(() => setWeightErrors(errors), 0);
    }
    if (JSON.stringify(currentWeights) !== JSON.stringify(bulletWeights)) {
          setTimeout(() => setBulletWeights(currentWeights), 0);
    }

    return groups;
  }, [appliedBullets, bulletWeights, weightErrors]); // weightErrors is included to re-evaluate if errors change externally, though it's set here.

  const handleWeightChange = (bulletId: string, value: string) => {
      const numericValue = parseInt(value, 10);
      if (value === '' || (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
          setBulletWeights(prev => ({ ...prev, [bulletId]: value }));
      }
  };

  const handleSummarizeCategory = useCallback(async (category: string, categoryBullets: (Bullet & { weight: string | number })[]) => {
    const bulletsWithParsedWeights = categoryBullets.map(b => ({
        content: b.content,
        competency: b.competency,
        weight: parseInt(b.weight as string, 10) || 0
    }));

    const currentSum = bulletsWithParsedWeights.reduce((acc, b) => acc + b.weight, 0);
    if (currentSum !== 100 && categoryBullets.some(b => b.weight !== '')) { // Only enforce if some weights are entered
        alert(`Cannot summarize "${category}". Please ensure weights sum to 100% or are all empty.`);
        return;
    }

    setLoadingSummaries(prev => ({ ...prev, [category]: true }));
    setSummaries(prev => ({ ...prev, [category]: '' })); // Clear previous summary

    try {
        const payload = {
            bullets: bulletsWithParsedWeights.filter(b => b.weight > 0), // Only send bullets with weight
            categoryName: category,
            rankCategory,
            rank,
        };
        
        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            setSummaries(prev => ({ ...prev, [category]: data.summary }));
            // Call saveWorkData after a successful summary to persist it
            saveWorkData(); 
        } else {
            const errorMsg = `Error: ${data.error || 'Failed to summarize category'}`;
            setSummaries(prev => ({ ...prev, [category]: errorMsg }));
            alert(`Error summarizing ${category}: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error summarizing ${category}:`, error);
        const errorMsg = 'Error: Could not connect to summarization service.';
        setSummaries(prev => ({ ...prev, [category]: errorMsg }));
        alert(`An error occurred while summarizing ${category}. Check console for details.`);
    } finally {
        setLoadingSummaries(prev => ({ ...prev, [category]: false }));
    }
  }, [rankCategory, rank, saveWorkData]); // saveWorkData is a dependency

 const generateReportDocument = async () => {
  if (!evaluationData.officerName || !evaluationData.startDate || !evaluationData.endDate) {
    alert('Please fill in Member Name and Marking Period dates.');
    return;
  }
  const hasErrors = Object.values(weightErrors).some(e => !!e);
  if (hasErrors) {
    alert('Please correct the weight distribution errors (must sum to 100% for each category with weights) before generating the document.');
    return;
  }

  setIsGeneratingDoc(true);
  try {
    const response = await fetch('/api/oer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        officerName: evaluationData.officerName,
        unitName: evaluationData.unitName,
        position: evaluationData.position,
        startDate: evaluationData.startDate,
        endDate: evaluationData.endDate,
        // Pass the full structured content for the report generation
        // The API can then extract bullets, summaries, etc. as needed
        structuredContent: { 
          bullets: appliedBullets, // Or localBullets if all should be considered
          evaluationData: evaluationData,
          bulletWeights: bulletWeights,
          summaries: summaries 
        },
        rankCategory: rankCategory,
        rank: rank
      }),
    });

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate document (status: ${response.status})`);
      } else {
        const errorText = await response.text();
        console.error('Error response from server:', errorText.substring(0,100));
        throw new Error(`Server error (${response.status}): Failed to generate document`);
      }
    }

    if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filePrefix = rankCategory === 'Officer' ? 'OER' : `EER_${rank}`;
      const safeName = evaluationData.officerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';
      const dateSuffix = new Date().toISOString().split('T')[0];
      a.download = `${filePrefix}_${safeName}_${dateSuffix}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      console.error('Unexpected content type:', contentType);
      throw new Error('Server returned an unexpected response format for the document.');
    }
  } catch (error) {
    console.error('Error generating report document:', error);
    alert(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    setIsGeneratingDoc(false);
  }
};

  const { reportTitle, evaluationCategories } = useMemo(() => {
     const officerTitle = 'Officer Evaluation Report';
     const officerCategories = ['Performance of Duties', 'Leadership Skills', 'Personal and Professional Qualities'];
     const enlistedCategories = ['Military', 'Performance', 'Professional Qualities', 'Leadership']; // Define these as needed
     const rankTitles: Record<string, string> = {
        'E4': 'Third Class Petty Officer', 'E5': 'Second Class Petty Officer',
        'E6': 'First Class Petty Officer', 'E7': 'Chief Petty Officer', 'E8': 'Senior Chief Petty Officer',
        // Add other E-ranks as needed
      };
     const enlistedTitle = `${rankTitles[rank] || 'Enlisted'} Evaluation Report`;

     return rankCategory === 'Officer'
        ? { reportTitle: officerTitle, evaluationCategories: officerCategories }
        : { reportTitle: enlistedTitle, evaluationCategories: enlistedCategories };
  }, [rankCategory, rank]);

  if (isLoading && status === 'loading') { // Show skeleton only during initial auth and data load
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  // Main component UI
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{reportTitle} Preview & Summarization</h2>
        {saveStatus && (
          <span className={`text-sm px-2 py-1 rounded ${
            saveStatus === 'Saved' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : 
            saveStatus === 'Saving...' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : 
            'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
          }`}>
            {saveStatus}
          </span>
        )}
      </div>

      {/* Evaluation Info Form */}
      <div className="bg-card border border-border rounded-md p-6 mb-6 shadow">
        <h3 className="text-lg font-semibold mb-4 text-card-foreground">Report Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="officerName" className="block text-sm font-medium mb-1 text-foreground">
              {rankCategory === 'Officer' ? 'Officer' : 'Member'} Name: <span className="text-red-500">*</span>
            </label>
            <Input 
            id="officerName" 
            name="officerName"
            className="bg-background border-input text-foreground" // Simplified classes, Tailwind handles dark mode
            value={evaluationData.officerName} 
            onChange={handleInputChange} 
            required />
          </div>
          <div>
            <label htmlFor="unitName" className="block text-sm font-medium mb-1 text-foreground">Unit Name: <span className="text-red-500">*</span></label>
            <Input 
            id="unitName" 
            name="unitName"
            className="bg-background border-input text-foreground"
            value={evaluationData.unitName} 
            onChange={handleInputChange} 
            required/>
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium mb-1 text-foreground">Position Title: <span className="text-red-500">*</span></label>
            <Input 
            id="position" 
            name="position"
            className="bg-background border-input text-foreground"
            value={evaluationData.position} 
            onChange={handleInputChange} 
            required/>
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-1">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-1 text-foreground">Start Date: <span className="text-red-500">*</span></label>
              <Input 
              type="date" 
              id="startDate" 
              name="startDate"
              className="bg-background border-input text-foreground"
              value={evaluationData.startDate} 
              onChange={handleInputChange} required />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-foreground">End Date: <span className="text-red-500">*</span></label>
              <Input type="date" 
              id="endDate" 
              name="endDate"
              className="bg-background border-input text-foreground"
              value={evaluationData.endDate} 
              onChange={handleInputChange} 
              required />
            </div>
          </div>
        </div>
      </div>

      {/* Render Sections by Category */}
      {appliedBullets.length === 0 && !isLoading ? ( // Show only if not loading and no bullets
          <div className="text-center p-6 bg-card border border-border rounded-md shadow">
              <p className="text-destructive-foreground">No bullets have been applied yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Go to the 'Manage Bullets' tab to apply bullets first.</p>
          </div>
      ) : (
          evaluationCategories.map(category => {
              const categoryBullets = groupedBulletsByCategory[category] || [];
              if (categoryBullets.length === 0 && !loadingSummaries[category]) return null;

              const error = weightErrors[category];
              const isLoadingSummary = loadingSummaries[category];
              const summary = summaries[category];
              const currentWeightSum = categoryBullets.reduce((acc, b) => acc + (parseInt(b.weight as string, 10) || 0), 0);
              const isWeightValidForSummarize = !error || categoryBullets.every(b => b.weight === '' || b.weight === '0'); // Valid if no error OR all weights are empty/zero
              const isCopied = copiedCategory === category;

              return (
                  <div key={category} className="mb-8 p-4 border border-border rounded-lg bg-card shadow-sm">
                      <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                           <h3 className="text-lg font-semibold text-card-foreground">{category}</h3>
                           <span className={`text-xs font-mono p-1 px-2 rounded ${currentWeightSum === 100 ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' : (currentWeightSum > 0 ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 'bg-muted text-muted-foreground')}`}>
                                Total Weight: {currentWeightSum}%
                           </span>
                      </div>

                      <div className="space-y-3 mb-4">
                          {categoryBullets.map((bullet) => (
                              <div key={bullet.id} className="flex items-start gap-3 p-3 border border-border rounded-md bg-background shadow-inner">
                                  <div className="flex-grow">
                                      <div className="text-xs text-muted-foreground mb-1">{bullet.competency}</div>
                                      <p className="text-sm text-foreground">{bullet.content}</p>
                                  </div>
                                  <div className="w-20 shrink-0">
                                      <label htmlFor={`weight-${bullet.id}`} className="sr-only">Weight (%) for {bullet.id}</label>
                                      <Input
                                          id={`weight-${bullet.id}`}
                                          type="number" min="0" max="100" step="1"
                                          value={bulletWeights[bullet.id] || ''}
                                          onChange={(e) => handleWeightChange(bullet.id, e.target.value)}
                                          className={`h-8 text-sm text-right bg-background border-input text-foreground ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                          placeholder="%"
                                          aria-invalid={!!error}
                                          aria-describedby={error ? `error-${category}` : undefined}
                                      />
                                  </div>
                              </div>
                          ))}
                           {error && (
                               <Alert variant="destructive" className="mt-2 text-xs py-1 px-2" id={`error-${category}`}>
                                   <AlertDescription>{error}</AlertDescription>
                               </Alert>
                           )}
                      </div>

                      <div className="mt-4 border-t border-border pt-4">
                           <Button
                              onClick={() => handleSummarizeCategory(category, categoryBullets)}
                              disabled={!isWeightValidForSummarize || isLoadingSummary || categoryBullets.length === 0}
                              size="sm"
                            >
                              {isLoadingSummary ? (
                                <>
                                   <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin border-t-transparent border-2 border-current"/>
                                   Summarizing...
                                </>
                              ) : `Summarize ${category}`}
                            </Button>
                        
                           {summary && (
                               <div className="mt-3 p-3 border border-border rounded-md bg-blue-50 dark:bg-blue-900/30 text-sm text-blue-800 dark:text-blue-200 relative shadow-inner">
                                   <div className="flex justify-between items-center mb-2">
                                       <p className="font-medium text-blue-700 dark:text-blue-300">AI Summary:</p>
                                       <Button
                                           onClick={() => copySummaryToClipboard(category, summary)}
                                           size="sm"
                                           variant="ghost"
                                           className="p-1 h-8 text-xs flex items-center gap-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-800 dark:text-blue-100"
                                       >
                                           <ClipboardCopy className="h-3 w-3 mr-1" />
                                           {isCopied ? 'Copied!' : 'Copy'}
                                       </Button>
                                   </div>
                                   <p className="whitespace-pre-wrap">{summary}</p>
                               </div>
                           )}
                           {isLoadingSummary && !summary && (
                               <div className="mt-3 space-y-2 p-3 border border-border rounded-md bg-muted/50">
                                   <Skeleton className="h-4 w-3/4 bg-muted" />
                                   <Skeleton className="h-4 w-full bg-muted" />
                                   <Skeleton className="h-4 w-5/6 bg-muted" />
                               </div>
                           )}
                      </div>
                  </div>
              );
          })
      )}

      <div className="mt-6 flex justify-end items-center">
        <Button
            onClick={generateReportDocument}
            disabled={isGeneratingDoc || appliedBullets.length === 0 || Object.values(weightErrors).some(e => !!e)}
            className="px-4 py-2" // Standard button padding
        >
            {isGeneratingDoc ? (
              <> 
                <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin border-t-transparent border-2 border-primary-foreground"/>
                Generating PDF...
              </>
            ) : (
              `Generate ${rankCategory === 'Officer' ? 'OER' : 'Evaluation'} Document`
            )}
        </Button>
      </div>
    </div>
  );
}
