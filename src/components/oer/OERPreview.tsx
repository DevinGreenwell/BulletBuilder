'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from 'next-auth/react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardCopy } from 'lucide-react'; // Import clipboard icon

// Bullet and other interfaces
interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
}

interface OERPreviewProps {
  bullets?: Bullet[];
  rankCategory?: string;
  rank?: string;
}

// Type definitions for component state
type BulletWeights = { [bulletId: string]: string };
type CategorySummaries = { [category: string]: string };
type LoadingSummaries = { [category: string]: boolean };
type WeightErrors = { [category: string]: string };
type WorkData = {
  id?: string; // Include ID for updates
  userId: string;
  content: Bullet[] | any;
  evaluationData?: {
    startDate: string;
    endDate: string;
    officerName: string;
    unitName: string;
    position: string;
  };
  bulletWeights?: BulletWeights;
  summaries?: CategorySummaries;
};

export default function OERPreview({ bullets = [], rankCategory = 'Officer', rank = 'O3' }: OERPreviewProps) {
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
  
  if (status === 'authenticated' && (session?.user as { id: string }).id) {
    setIsLoading(true);
    
    fetch('/api/work')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user data');
        return res.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          const latestWork = data[0]; // Assuming sorted by latest first
          setWorkId(latestWork.id);
          
          // Check if content is in the new nested format or old format
          if (latestWork.content) {
            if (latestWork.content.bullets && Array.isArray(latestWork.content.bullets)) {
              // New nested format
              setLocalBullets(latestWork.content.bullets);
              
              if (latestWork.content.evaluationData) {
                setEvaluationData(latestWork.content.evaluationData);
              }
              
              if (latestWork.content.bulletWeights) {
                setBulletWeights(latestWork.content.bulletWeights);
              }
              
              if (latestWork.content.summaries) {
                setSummaries(latestWork.content.summaries);
              }
            } else if (Array.isArray(latestWork.content)) {
              // Old format - content is directly the bullets array
              setLocalBullets(latestWork.content);
            }
          }
        } else {
          // Initialize with prop bullets if no saved data
          setLocalBullets(bullets);
        }
      })
      .catch(error => {
        console.error('Error loading work data:', error);
        setLocalBullets(bullets); // Fallback to props
      })
      .finally(() => {
        setIsLoading(false);
      });
  } else {
    // Not authenticated, use prop bullets
    setLocalBullets(bullets);
    setIsLoading(false);
  }
}, [bullets, session, status]);

  // Auto-save data when changes occur
  useEffect(() => {
    if (status !== 'authenticated' || isLoading) return;
    
    const saveTimeout = setTimeout(() => {
      saveWorkData();
    }, 2000); // Debounce save to prevent too many requests
    
    return () => clearTimeout(saveTimeout);
  }, [localBullets, evaluationData, bulletWeights, summaries, status]);

  // Function to save work data
  const saveWorkData = async () => {
    if (status !== 'authenticated' || !session?.user?.id) return;
    
    setSaveStatus('Saving...');
    
    try {
      // Temporarily only save the content property since that's all your schema supports
      const workData = {
        userId: session.user.id,
        content: localBullets,
        // We'll save the other data within the content field for now
        // by creating a structured object
        _tempEvaluationData: evaluationData,
        _tempBulletWeights: bulletWeights,
        _tempSummaries: summaries
      };
      
      const method = workId ? 'PUT' : 'POST';
      
      if (workId) {
        workData.id = workId;
      }
      
      const response = await fetch('/api/work', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workData),
      });
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Handle non-JSON response
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 500) + '...');
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save data (status: ${response.status})`);
      }
      
      const data = await response.json();
      
      // If this was a new record, store the ID for future updates
      if (!workId && data.id) {
        setWorkId(data.id);
      }
      
      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Error saving work data:', error);
      setSaveStatus('Failed to save');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEvaluationData(prev => ({...prev, [name]: value }));
  };

  // Copy summary to clipboard function
  const copySummaryToClipboard = (category: string, summaryText: string) => {
    navigator.clipboard.writeText(summaryText).then(
      () => {
        setCopiedCategory(category);
        // Reset the copied status after 2 seconds
        setTimeout(() => setCopiedCategory(null), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy to clipboard');
      }
    );
  };

  const appliedBullets = useMemo(() => (localBullets.length > 0 ? localBullets : bullets).filter(bullet => bullet.isApplied), [localBullets, bullets]);

  // Group applied bullets by Category and manage weight errors
  const groupedBulletsByCategory = useMemo(() => {
    console.log("Recalculating grouped bullets by CATEGORY...");
    const groups: Record<string, (Bullet & { weight: string })[]> = {};
    const errors: WeightErrors = {};
    const currentWeights = { ...bulletWeights };

    // Initialize weights for any newly applied bullets
    appliedBullets.forEach(bullet => {
        if (currentWeights[bullet.id] === undefined) {
            currentWeights[bullet.id] = '';
        }
    });

    // Group bullets
    appliedBullets.forEach(bullet => {
      const category = bullet.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push({
          ...bullet,
          weight: currentWeights[bullet.id] ?? ''
       });
    });

    // Calculate sums and check errors for each category group
    Object.entries(groups).forEach(([category, categoryBullets]) => {
        if (categoryBullets.length > 0) {
          const sum = categoryBullets.reduce((acc, b) => acc + (parseInt(b.weight, 10) || 0), 0);
          const hasEnteredWeight = categoryBullets.some(b => b.weight !== '');
          if (hasEnteredWeight && sum !== 100) {
            errors[category] = `Weights must sum to 100% (currently ${sum}%)`;
          } else {
             delete errors[category];
          }
        }
    });

    if (JSON.stringify(errors) !== JSON.stringify(weightErrors)) {
         setTimeout(() => setWeightErrors(errors), 0);
    }
    if (JSON.stringify(currentWeights) !== JSON.stringify(bulletWeights)) {
          setTimeout(() => setBulletWeights(currentWeights), 0);
    }

    return groups;
  }, [appliedBullets, bulletWeights, weightErrors]);

  // Handler for Weight Input Change
  const handleWeightChange = (bulletId: string, value: string) => {
      const numericValue = parseInt(value, 10);
      if (value === '' || (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
          setBulletWeights(prev => ({ ...prev, [bulletId]: value }));
      }
  };

  // Handler for Summarize Button Click (Summarizes by Category)
  const handleSummarizeCategory = useCallback(async (category: string, categoryBullets: (Bullet & { weight: string | number })[]) => {
    console.log(`Summarizing category ${category}...`);

    const bulletsWithParsedWeights = categoryBullets.map(b => ({
        content: b.content,
        competency: b.competency,
        weight: parseInt(b.weight as string, 10) || 0
    }));

    const currentSum = bulletsWithParsedWeights.reduce((acc, b) => acc + b.weight, 0);
    if (currentSum !== 100) {
        alert(`Cannot summarize "${category}". Please ensure weights sum to 100%.`);
        return;
    }

    setLoadingSummaries(prev => ({ ...prev, [category]: true }));
    setSummaries(prev => ({ ...prev, [category]: '' }));

    try {
        const payload = {
            bullets: bulletsWithParsedWeights.filter(b => b.weight > 0),
            categoryName: category,
            rankCategory,
            rank,
        };
        console.log("Sending payload to /api/summarize:", payload);

        const response = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log("Received response from /api/summarize:", data);

        if (response.ok && data.success) {
            setSummaries(prev => ({ ...prev, [category]: data.summary }));
            
            // Save after summarizing
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
  }, [rankCategory, rank, saveWorkData]);

 // Function to generate the final PDF/HTML document
const generateReportDocument = async () => {
  if (!evaluationData.officerName || !evaluationData.startDate || !evaluationData.endDate) {
    alert('Please fill in Member Name and Marking Period dates.');
    return;
  }
  // Check for weight errors before generating final doc
  const hasErrors = Object.values(weightErrors).some(e => !!e);
  if (hasErrors) {
    alert('Please correct the weight distribution errors (must sum to 100% for each category) before generating the document.');
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
        bullets: appliedBullets,
        rankCategory: rankCategory,
        rank: rank
      }),
    });

    // Check content type to determine how to handle the response
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      // If error response is JSON, try to extract the error message
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate document (status: ${response.status})`);
      } else {
        // If not JSON, get the text and include part of it in the error
        const errorText = await response.text();
        const trimmedError = errorText.substring(0, 100) + (errorText.length > 100 ? '...' : '');
        console.error('Error response from server:', trimmedError);
        throw new Error(`Server error (${response.status}): Failed to generate document`);
      }
    }

    // For successful responses, expect a PDF blob
    if (contentType && contentType.includes('application/pdf')) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      const filePrefix = rankCategory === 'Officer' ? 'OER' : `EER_${rank}`;
      const safeName = evaluationData.officerName.replace(/[^a-zA-Z0-9]/g, '_');
      const dateSuffix = new Date().toISOString().split('T')[0];
      const fileName = `${filePrefix}_${safeName}_${dateSuffix}.pdf`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      // Unexpected content type
      console.error('Unexpected content type:', contentType);
      throw new Error('Server returned an unexpected response format');
    }
  } catch (error) {
    console.error('Error generating report document:', error);
    alert(`An error occurred while generating the evaluation document: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    setIsGeneratingDoc(false);
  }
};

  // Determine title and categories based on rank
  const { reportTitle, evaluationCategories } = useMemo(() => {
     const officerTitle = 'Officer Evaluation Report';
     const officerCategories = ['Performance of Duties', 'Leadership Skills', 'Personal and Professional Qualities'];
     const enlistedCategories = ['Military', 'Performance', 'Professional Qualities', 'Leadership'];
     const rankTitles: Record<string, string> = {
        'E4': 'Third Class Petty Officer', 'E5': 'Second Class Petty Officer',
        'E6': 'First Class Petty Officer', 'E7': 'Chief Petty Officer', 'E8': 'Senior Chief Petty Officer'
      };
     const enlistedTitle = `${rankTitles[rank] || 'Enlisted'} Evaluation Report`;

     return rankCategory === 'Officer'
        ? { reportTitle: officerTitle, evaluationCategories: officerCategories }
        : { reportTitle: enlistedTitle, evaluationCategories: enlistedCategories };
  }, [rankCategory, rank]);

  if (isLoading) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{reportTitle} Preview & Summarization</h2>
        {saveStatus && (
          <span className={`text-sm px-2 py-1 rounded ${
            saveStatus === 'Saved' ? 'bg-green-100 text-green-800' : 
            saveStatus === 'Saving...' ? 'bg-blue-100 text-blue-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {saveStatus}
          </span>
        )}
      </div>

      {/* Evaluation Info Form */}
      <div className="bg-background border border-ring rounded-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Report Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="officerName" className="block text-sm font-medium mb-1 text-foreground">
              {rankCategory === 'Officer' ? 'Officer' : 'Member'} Name: <span className="text-red-500">*</span>
            </label>
            <Input 
            id="officerName" 
            name="officerName"
            className="bg-card border border-ring card-foreground text-foreground-muted"
            value={evaluationData.officerName} 
            onChange={handleInputChange} 
            required />
          </div>
          <div>
            <label htmlFor="unitName" className="block text-sm font-medium mb-1 text-foreground">Unit Name: <span className="text-red-500">*</span></label>
            <Input 
            id="unitName" 
            name="unitName"
            className="bg-card border border-ring card-foreground text-foreground-muted"
            value={evaluationData.unitName} 
            onChange={handleInputChange} 
            required/>
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium mb-1 text-foreground">Position Title: <span className="text-red-500">*</span></label>
            <Input 
            id="position" 
            name="position"
            className="bg-card border border-ring card-foreground text-foreground-muted"
            value={evaluationData.position} 
            onChange={handleInputChange} />
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-1">
            <div>
              <label htmlFor="startDate" className="block text-smfont-medium mb-1 text-foreground">Start Date: <span className="text-red-500">*</span></label>
              <Input 
              type="date" 
              id="startDate" 
              name="startDate"
              className="bg-card border border-ring card-foreground text-foreground-muted"
              value={evaluationData.startDate} 
              onChange={handleInputChange} required />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-foreground">End Date: <span className="text-red-500">*</span></label>
              <Input type="date" 
              id="endDate" 
              name="endDate"
              className="bg-card border border-ring card-foreground text-foreground-muted"
              value={evaluationData.endDate} 
              onChange={handleInputChange} 
              required />
            </div>
          </div>
        </div>
      </div>

      {/* Render Sections by Category */}
      {appliedBullets.length === 0 ? (
          <div className="text-center p-6 bg-background border border-ring rounded-md border">
              <p className="text-destructive">No bullets have been applied yet.</p>
              <p className="text-sm text-gray-400 mt-1">Go to the 'Manage Bullets' tab to apply bullets first.</p>
          </div>
      ) : (
          evaluationCategories.map(category => {
              const categoryBullets = groupedBulletsByCategory[category] || [];
              if (categoryBullets.length === 0) return null; // Don't render empty categories

              const error = weightErrors[category];
              const isLoadingSummary = loadingSummaries[category];
              const summary = summaries[category];
              const currentWeightSum = categoryBullets.reduce((acc, b) => acc + (parseInt(b.weight as string, 10) || 0), 0);
              const isWeightValid = !error; // Valid if no error string exists for this category
              const isCopied = copiedCategory === category;

              return (
                  <div key={category} className="mb-8 p-4 border border-ring rounded-lg bg-background shadow-sm">
                      {/* Category Title & Weight Sum */}
                      <div className="flex justify-between items-center mb-4 border-b pb-2">
                           <h3 className="text-lg font-semibold">{category}</h3>
                           <span className={`text-xs font-mono p-1 px-2 rounded ${currentWeightSum === 100 ? 'bg-green-100 text-green-800' : (currentWeightSum > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600')}`}>
                                Total Weight: {currentWeightSum}%
                           </span>
                      </div>

                      {/* Bullets and Weight Inputs */}
                      <div className="space-y-3 mb-4">
                          {categoryBullets.map((bullet) => (
                              <div key={bullet.id} className="flex items-start gap-3 p-3 border border-ring rounded-md bg-card">
                                  <div className="flex-grow">
                                      <div className="text-xs text-gray-500 mb-1">{bullet.competency}</div>
                                      <p className="text-sm">{bullet.content}</p>
                                  </div>
                                  <div className="w-20 shrink-0">
                                      <label htmlFor={`weight-${bullet.id}`} className="sr-only">Weight (%) for bullet {bullet.id}</label>
                                      <Input
                                          id={`weight-${bullet.id}`}
                                          type="number" min="0" max="100" step="1"
                                          value={bulletWeights[bullet.id] || ''} // Use state value
                                          onChange={(e) => handleWeightChange(bullet.id, e.target.value)}
                                          className={`h-8 text-sm text-right ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                                          placeholder="%"
                                          aria-invalid={!!error}
                                          aria-describedby={error ? `error-${category}` : undefined}
                                      />
                                  </div>
                              </div>
                          ))}
                           {/* Validation Message */}
                           {error && (
                               <Alert variant="destructive" className="mt-2 text-xs py-1 px-2" id={`error-${category}`}>
                                   <AlertDescription>{error}</AlertDescription>
                               </Alert>
                           )}
                      </div>

                      {/* Summarization Area */}
                      <div className="mt-4 border-t pt-4">
                           <Button
                              onClick={() => handleSummarizeCategory(category, categoryBullets)}
                              disabled={!isWeightValid || isLoadingSummary || categoryBullets.length === 0}
                              size="sm"
                            >
                              {isLoadingSummary ? (
                                <>
                                   <Skeleton className="h-4 w-4 mr-2 rounded-full animate-spin border-t-transparent border-2 border-current"/>
                                   Summarizing...
                                </>
                              ) : `Summarize ${category}`}
                            </Button>
                        
                          {/* Display Summary Area with Copy Button */}
                           {summary && (
                               <div className="mt-3 p-3 border rounded-md bg-blue-50 text-sm text-gray-800 relative">
                                   <div className="flex justify-between items-center mb-2">
                                       <p className="font-medium text-gray-600">AI Summary:</p>
                                       <Button
                                           onClick={() => copySummaryToClipboard(category, summary)}
                                           size="sm"
                                           variant="ghost"
                                           className="p-1 h-8 text-xs flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-800"
                                       >
                                           <ClipboardCopy className="h-3 w-3 mr-1" />
                                           {isCopied ? 'Copied!' : 'Copy'}
                                       </Button>
                                   </div>
                                   <p className="whitespace-pre-wrap">{summary}</p>
                               </div>
                           )}
                           {/* Show skeleton while loading */}
                           {isLoadingSummary && !summary && (
                               <div className="mt-3 space-y-2 p-3 border rounded-md bg-grey-50">
                                   <Skeleton className="h-4 w-3/4" />
                                   <Skeleton className="h-4 w-full" />
                                   <Skeleton className="h-4 w-5/6" />
                               </div>
                           )}
                      </div>
                  </div>
              );
          })
      )}

      {/* Generate Document Button */}
      <div className="mt-6 flex justify-end items-center">
        <Button
            onClick={generateReportDocument}
            disabled={isGeneratingDoc || appliedBullets.length === 0 || Object.values(weightErrors).some(e => !!e)}
            className="px-4 py-2"
        >
            {isGeneratingDoc ? 'Generating PDF...' : `Generate ${rankCategory === 'Officer' ? 'OER' : 'Evaluation'} Document`}
        </Button>
      </div>
    </div>
  );
}