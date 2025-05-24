// src/components/oer/OERPreview.tsx (with debugging)

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardCopy, Loader2 } from 'lucide-react';
import { useUserPersistence } from '@/hooks/useUserPersistence';

// Type definitions
interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt?: number;
  source?: string;
}

interface OERPreviewProps {
  bullets?: Bullet[];
  rankCategory?: string;
  rank?: string;
}

type BulletWeights = { [bulletId: string]: string };
type CategorySummaries = { [category: string]: string };
type LoadingSummaries = { [category: string]: boolean };
type WeightErrors = { [category: string]: string };

export default function OERPreview({ 
  bullets: propBullets = [], 
  rankCategory = 'Officer', 
  rank = 'O3' 
}: OERPreviewProps) {
  // Use the shared persistence system
  const {
    userData,
    updateEvaluationData,
    updateBulletWeights,
    updateSummaries,
    isAuthenticated
  } = useUserPersistence();

  // Local state for UI only (not persisted)
  const [error, setError] = useState<string | null>(null);
  const [copiedCategory, setCopiedCategory] = useState<string | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState<LoadingSummaries>({});

  // Use bullets from props (managed by parent component)
  const appliedBullets = useMemo(() => 
    propBullets.filter(bullet => bullet.isApplied),
    [propBullets]
  );

  // Use persisted data from the shared system
  const evaluationData = userData.evaluationData;
  const bulletWeights = userData.bulletWeights;
  const summaries = userData.summaries;

  // Debug: Log the evaluation data
  useEffect(() => {
    console.log('OER Preview - Current evaluation data:', evaluationData);
    console.log('OER Preview - Form validation check:', {
      officerName: evaluationData.officerName,
      startDate: evaluationData.startDate,
      endDate: evaluationData.endDate,
      unitName: evaluationData.unitName,
      position: evaluationData.position
    });
  }, [evaluationData]);

  // Handle input changes - these will auto-save via the persistence system
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`OER Preview - Input changed: ${name} = "${value}"`);
    updateEvaluationData({ [name]: value });
  }, [updateEvaluationData]);

  // Copy summary to clipboard
  const copySummaryToClipboard = useCallback(async (category: string, summaryText: string) => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopiedCategory(category);
      setTimeout(() => setCopiedCategory(null), 2000);
    } catch (err) {
      console.error('Could not copy text: ', err);
      setError('Failed to copy to clipboard');
    }
  }, []);

  // Memoized grouped bullets with weight validation
  const groupedBulletsByCategory = useMemo(() => {
    const groups: Record<string, (Bullet & { weight: string })[]> = {};
    const errors: WeightErrors = {};

    appliedBullets.forEach(bullet => {
      const category = bullet.category || 'Uncategorized';
      if (!groups[category]) groups[category] = [];
      groups[category].push({
        ...bullet,
        weight: bulletWeights[bullet.id] || ''
      });
    });

    // Validate weights
    Object.entries(groups).forEach(([category, categoryBullets]) => {
      if (categoryBullets.length > 0) {
        const sum = categoryBullets.reduce((acc, b) => acc + (parseInt(b.weight, 10) || 0), 0);
        const hasEnteredWeight = categoryBullets.some(b => b.weight !== '');
        if (hasEnteredWeight && sum !== 100) {
          errors[category] = `Weights must sum to 100% (currently ${sum}%)`;
        }
      }
    });

    return { groups, errors };
  }, [appliedBullets, bulletWeights]);

  // Handle weight changes
  const handleWeightChange = useCallback((bulletId: string, value: string) => {
    const numericValue = parseInt(value, 10);
    if (value === '' || (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100)) {
      updateBulletWeights({
        ...bulletWeights,
        [bulletId]: value
      });
    }
  }, [bulletWeights, updateBulletWeights]);

  // Handle category summarization
  const handleSummarizeCategory = useCallback(async (
    category: string, 
    categoryBullets: (Bullet & { weight: string | number })[]
  ) => {
    const bulletsWithParsedWeights = categoryBullets.map(b => ({
      content: b.content,
      competency: b.competency,
      weight: parseInt(b.weight as string, 10) || 0
    }));

    const currentSum = bulletsWithParsedWeights.reduce((acc, b) => acc + b.weight, 0);
    if (currentSum !== 100 && categoryBullets.some(b => b.weight !== '')) {
      setError(`Cannot summarize "${category}". Please ensure weights sum to 100% or are all empty.`);
      return;
    }

    try {
      setLoadingSummaries(prev => ({ ...prev, [category]: true }));
      setError(null);

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullets: bulletsWithParsedWeights.filter(b => b.weight > 0),
          categoryName: category,
          rankCategory,
          rank,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to summarize category');
      }

      if (data.success) {
        updateSummaries({
          ...summaries,
          [category]: data.summary
        });
      } else {
        throw new Error(data.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error(`Error summarizing ${category}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to summarize category');
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [category]: false }));
    }
  }, [rankCategory, rank, summaries, updateSummaries]);

  // Generate report document with better validation and debugging
  const generateReportDocument = useCallback(async () => {
    // Get fresh data from the persistence system
    const currentEvaluationData = userData.evaluationData;
    
    // More detailed validation with debugging
    const requiredFields = {
      officerName: currentEvaluationData.officerName,
      startDate: currentEvaluationData.startDate,
      endDate: currentEvaluationData.endDate,
      unitName: currentEvaluationData.unitName,
      position: currentEvaluationData.position
    };

    console.log('PDF Generation - Fresh evaluation data:', currentEvaluationData);
    console.log('PDF Generation - Required fields check:', requiredFields);

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || value.trim() === '')
      .map(([field, _]) => field);

    if (missingFields.length > 0) {
      const errorMessage = `Please fill in the following required fields: ${missingFields.join(', ')}`;
      console.log('PDF Generation - Missing fields:', missingFields);
      setError(errorMessage);
      return;
    }

    const hasErrors = Object.values(groupedBulletsByCategory.errors).some(e => !!e);
    if (hasErrors) {
      setError('Please correct the weight distribution errors before generating the document.');
      return;
    }

    try {
      setIsGeneratingDoc(true);
      setError(null);

      const payload = {
        officerName: currentEvaluationData.officerName,
        unitName: currentEvaluationData.unitName,
        position: currentEvaluationData.position,
        startDate: currentEvaluationData.startDate,
        endDate: currentEvaluationData.endDate,
        bullets: appliedBullets, // Move bullets to top level
        rankCategory,
        rank,
        // Keep structured content for potential future use
        structuredContent: {
          bullets: appliedBullets,
          evaluationData: currentEvaluationData,
          bulletWeights,
          summaries
        }
      };

      console.log('PDF Generation - Detailed Payload Check:', {
        officerName: payload.officerName,
        unitName: payload.unitName,
        position: payload.position,
        startDate: payload.startDate,
        endDate: payload.endDate,
        rankCategory: payload.rankCategory,
        rank: payload.rank,
        appliedBulletsCount: appliedBullets.length,
        hasStructuredContent: !!payload.structuredContent,
        fullPayload: payload
      });

      const response = await fetch('/api/oer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          console.log('PDF Generation - Server error:', errorData);
          throw new Error(errorData.error || `Failed to generate document (${response.status})`);
        }
        throw new Error(`Server error (${response.status}): Failed to generate document`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filePrefix = rankCategory === 'Officer' ? 'OER' : `EER_${rank}`;
      const safeName = currentEvaluationData.officerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';
      const dateSuffix = new Date().toISOString().split('T')[0];
      a.download = `${filePrefix}_${safeName}_${dateSuffix}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setError(null);
      console.log('PDF Generation - Success');
    } catch (err) {
      console.error('Error generating report document:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate document');
    } finally {
      setIsGeneratingDoc(false);
    }
  }, [
    userData.evaluationData,
    groupedBulletsByCategory.errors,
    appliedBullets,
    bulletWeights,
    summaries,
    rankCategory,
    rank
  ]);

  // Get evaluation title and categories
  const { reportTitle, evaluationCategories } = useMemo(() => {
    const officerTitle = 'Officer Evaluation Report';
    const officerCategories = ['Performance of Duties', 'Leadership Skills', 'Personal and Professional Qualities'];
    const enlistedCategories = ['Military', 'Performance', 'Professional Qualities', 'Leadership'];
    const rankTitles: Record<string, string> = {
      'E4': 'Third Class Petty Officer',
      'E5': 'Second Class Petty Officer',
      'E6': 'First Class Petty Officer',
      'E7': 'Chief Petty Officer',
      'E8': 'Senior Chief Petty Officer',
    };
    const enlistedTitle = `${rankTitles[rank] || 'Enlisted'} Evaluation Report`;

    return rankCategory === 'Officer'
      ? { reportTitle: officerTitle, evaluationCategories: officerCategories }
      : { reportTitle: enlistedTitle, evaluationCategories: enlistedCategories };
  }, [rankCategory, rank]);

  // Check if all required fields are filled for the button state
  const isFormValid = useMemo(() => {
    return !!(
      evaluationData.officerName?.trim() &&
      evaluationData.startDate?.trim() &&
      evaluationData.endDate?.trim() &&
      evaluationData.unitName?.trim() &&
      evaluationData.position?.trim()
    );
  }, [evaluationData]);

  return (
    <div className="max-w-4xl mx-auto p-4" role="main" aria-label={reportTitle}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{reportTitle} Preview & Summarization</h2>
        {isAuthenticated && (
          <span className="text-xs text-muted-foreground">Auto-saving enabled</span>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Debug info - remove this after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
          <strong>Debug Info:</strong>
          <br />Form Valid: {isFormValid ? 'Yes' : 'No'}
          <br />Officer Name: "{evaluationData.officerName}"
          <br />Start Date: "{evaluationData.startDate}"
          <br />End Date: "{evaluationData.endDate}"
          <br />Unit Name: "{evaluationData.unitName}"
          <br />Position: "{evaluationData.position}"
        </div>
      )}

      {/* Form section */}
      <section className="bg-card border border-border rounded-md p-6 mb-6 shadow" aria-label="Report Information">
        <h3 className="text-lg font-semibold mb-4 text-card-foreground">Report Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member Name */}
          <div>
            <label htmlFor="officerName" className="block text-sm font-medium mb-1 text-foreground">
              {rankCategory === 'Officer' ? 'Officer' : 'Member'} Name: <span className="text-red-500">*</span>
            </label>
            <Input
              id="officerName"
              name="officerName"
              className="bg-background border-input text-foreground"
              value={evaluationData.officerName || ''}
              onChange={handleInputChange}
              required
              aria-required="true"
              placeholder="Enter full name"
            />
          </div>

          {/* Unit Name */}
          <div>
            <label htmlFor="unitName" className="block text-sm font-medium mb-1 text-foreground">
              Unit Name: <span className="text-red-500">*</span>
            </label>
            <Input
              id="unitName"
              name="unitName"
              className="bg-background border-input text-foreground"
              value={evaluationData.unitName || ''}
              onChange={handleInputChange}
              required
              aria-required="true"
              placeholder="Enter unit name"
            />
          </div>

          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium mb-1 text-foreground">
              Position Title: <span className="text-red-500">*</span>
            </label>
            <Input
              id="position"
              name="position"
              className="bg-background border-input text-foreground"
              value={evaluationData.position || ''}
              onChange={handleInputChange}
              required
              aria-required="true"
              placeholder="Enter position title"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium mb-1 text-foreground">
                Start Date: <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                className="bg-background border-input text-foreground"
                value={evaluationData.startDate || ''}
                onChange={handleInputChange}
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium mb-1 text-foreground">
                End Date: <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                className="bg-background border-input text-foreground"
                value={evaluationData.endDate || ''}
                onChange={handleInputChange}
                required
                aria-required="true"
              />
            </div>
          </div>
        </div>
      </section>

      {/* No bullets message */}
      {appliedBullets.length === 0 && (
        <div className="text-center p-6 bg-card border border-border rounded-md shadow">
          <p className="text-destructive-foreground">No bullets have been applied yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Go to the 'Manage Bullets' tab to apply bullets first.
          </p>
        </div>
      )}

      {/* Categories */}
      {evaluationCategories.map(category => {
        const categoryBullets = groupedBulletsByCategory.groups[category] || [];
        if (categoryBullets.length === 0 && !loadingSummaries[category]) return null;

        const error = groupedBulletsByCategory.errors[category];
        const isLoadingSummary = loadingSummaries[category];
        const summary = summaries[category];
        const currentWeightSum = categoryBullets.reduce((acc, b) => acc + (parseInt(b.weight as string, 10) || 0), 0);
        const isWeightValidForSummarize = !error || categoryBullets.every(b => b.weight === '' || b.weight === '0');
        const isCopied = copiedCategory === category;

        return (
          <section
            key={category}
            className="mb-8 p-4 border border-border rounded-lg bg-card shadow-sm"
            aria-labelledby={`category-${category}`}
          >
            <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
              <h3 id={`category-${category}`} className="text-lg font-semibold text-card-foreground">
                {category}
              </h3>
              <span
                className={`text-xs font-mono p-1 px-2 rounded ${
                  currentWeightSum === 100
                    ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                    : currentWeightSum > 0
                    ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                Total Weight: {currentWeightSum}%
              </span>
            </div>

            {/* Bullets */}
            <div className="space-y-3 mb-4">
              {categoryBullets.map(bullet => (
                <div
                  key={bullet.id}
                  className="flex items-start gap-3 p-3 border border-border rounded-md bg-background shadow-inner"
                >
                  <div className="flex-grow">
                    <div className="text-xs text-muted-foreground mb-1">{bullet.competency}</div>
                    <p className="text-sm text-foreground">{bullet.content}</p>
                  </div>
                  <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={bullet.weight}
                      onChange={(e) => handleWeightChange(bullet.id, e.target.value)}
                      className={`h-8 text-sm text-right bg-background border-input text-foreground ${
                        error ? 'border-red-500 ring-1 ring-red-500' : ''
                      }`}
                      placeholder="%"
                      aria-label={`Weight percentage for ${bullet.competency} bullet`}
                      aria-invalid={!!error}
                    />
                  </div>
                </div>
              ))}

              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Summary section */}
            <div className="mt-4 border-t border-border pt-4">
              <Button
                onClick={() => handleSummarizeCategory(category, categoryBullets)}
                disabled={!isWeightValidForSummarize || isLoadingSummary || categoryBullets.length === 0}
                className="flex items-center gap-2"
              >
                {isLoadingSummary ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Summarizing...</span>
                  </>
                ) : (
                  `Summarize ${category}`
                )}
              </Button>

              {summary && (
                <div className="mt-3 p-3 border border-border rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 relative shadow-inner">
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
            </div>
          </section>
        );
      })}

      {/* Generate document button */}
      <div className="mt-6 flex justify-end items-center">
        <Button
          onClick={generateReportDocument}
          disabled={
            isGeneratingDoc ||
            appliedBullets.length === 0 ||
            !isFormValid ||
            Object.values(groupedBulletsByCategory.errors).some(e => !!e)
          }
          className="px-4 py-2"
        >
          {isGeneratingDoc ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating PDF...</span>
            </div>
          ) : (
            `Generate ${rankCategory === 'Officer' ? 'OER' : 'Evaluation'} Document`
          )}
        </Button>
      </div>
    </div>
  );
}