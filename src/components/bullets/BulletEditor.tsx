// src/components/bullets/BulletEditor.tsx

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import React from 'react';

export interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt: number;
  source?: string;
}

export interface BulletEditorProps {
  initialBullets: Bullet[];
  onBulletsChanged: (updatedBullets: Bullet[]) => void;
  rankCategory?: 'Officer' | 'Enlisted';
  rank?: string;
}

interface FilterState {
  competency: string;
  category: string;
  applied: string;
  searchTerm: string;
}

// Competency definitions matching ChatInterface
const competencyDefinitions = {
  officer: {
    competencies: [
      'Planning & Preparedness',
      'Using Resources',
      'Results/Effectiveness',
      'Adaptability',
      'Professional Competence',
      'Speaking and Listening',
      'Writing',
      'Looking Out For Others',
      'Developing Others',
      'Directing Others',
      'Teamwork',
      'Workplace Climate',
      'Evaluations',
      'Initiative',
      'Judgment',
      'Responsibility',
      'Professional Presence',
      'Health and Well Being',
    ],
    categories: {
      'Performance of Duties': [
        'Planning & Preparedness',
        'Using Resources',
        'Results/Effectiveness',
        'Adaptability',
        'Professional Competence',
        'Speaking and Listening',
        'Writing',
      ],
      'Leadership Skills': [
        'Looking Out For Others',
        'Developing Others',
        'Directing Others',
        'Teamwork',
        'Workplace Climate',
        'Evaluations',
      ],
      'Personal and Professional Qualities': [
        'Initiative',
        'Judgment',
        'Responsibility',
        'Professional Presence',
        'Health and Well Being',
      ],
    },
  },
  enlisted: {
    e4e6: {
      competencies: [
        'Military Bearing',
        'Customs, Courtesies, and Traditions',
        'Quality of Work',
        'Technical Proficiency',
        'Initiative',
        'Decision Making and Problem Solving',
        'Military Readiness',
        'Self-Awareness and Learning',
        'Team Building',
        'Respect for Others',
        'Accountability and Responsibility',
        'Influencing Others',
        'Effective Communication',
      ],
      categories: {
        Military: [
          'Military Bearing',
          'Customs, Courtesies, and Traditions',
        ],
        Performance: [
          'Quality of Work',
          'Technical Proficiency',
          'Initiative',
        ],
        'Professional Qualities': [
          'Decision Making and Problem Solving',
          'Military Readiness',
          'Self-Awareness and Learning',
          'Team Building',
        ],
        Leadership: [
          'Respect for Others',
          'Accountability and Responsibility',
          'Influencing Others',
          'Effective Communication',
        ],
      },
    },
    e7e8: {
      competencies: [
        'Military Bearing',
        'Customs, Courtesies, and Traditions',
        'Quality of Work',
        'Technical Proficiency',
        'Initiative',
        'Strategic Thinking',
        'Decision Making and Problem Solving',
        'Military Readiness',
        'Self-Awareness and Learning',
        'Partnering',
        'Respect for Others',
        'Accountability and Responsibility',
        'Workforce Management',
        'Effective Communication',
        'Chiefs Mess Leadership and Participation',
      ],
      categories: {
        Military: [
          'Military Bearing',
          'Customs, Courtesies, and Traditions',
        ],
        Performance: [
          'Quality of Work',
          'Technical Proficiency',
          'Initiative',
          'Strategic Thinking',
        ],
        'Professional Qualities': [
          'Decision Making and Problem Solving',
          'Military Readiness',
          'Self-Awareness and Learning',
          'Partnering',
        ],
        Leadership: [
          'Respect for Others',
          'Accountability and Responsibility',
          'Workforce Management',
          'Effective Communication',
          'Chiefs Mess Leadership and Participation',
        ],
      },
    },
  },
};

export default function BulletEditor({
  initialBullets,
  onBulletsChanged,
  rankCategory = 'Officer',
  rank = 'O3'
}: BulletEditorProps) {
  // State
  const [bullets, setBullets] = useState<Bullet[]>(initialBullets || []);
  const [filters, setFilters] = useState<FilterState>({
    competency: 'All',
    category: 'All',
    applied: 'All',
    searchTerm: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: string }>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBulletForm, setNewBulletForm] = useState({
    competency: '',
    content: '',
    category: ''
  });

  // Get current competencies and categories based on rank
  const getCurrentCompetencies = useCallback(() => {
    if (rankCategory === 'Officer') {
      return competencyDefinitions.officer.competencies;
    }
    if (rank === 'E7' || rank === 'E8') {
      return competencyDefinitions.enlisted.e7e8.competencies;
    }
    return competencyDefinitions.enlisted.e4e6.competencies;
  }, [rankCategory, rank]);

  const getCurrentCategories = useCallback(() => {
    if (rankCategory === 'Officer') {
      return Object.keys(competencyDefinitions.officer.categories);
    }
    if (rank === 'E7' || rank === 'E8') {
      return Object.keys(competencyDefinitions.enlisted.e7e8.categories);
    }
    return Object.keys(competencyDefinitions.enlisted.e4e6.categories);
  }, [rankCategory, rank]);

  const getCategoryFromCompetency = useCallback((competency: string) => {
    if (rankCategory === 'Officer') {
      for (const [cat, list] of Object.entries(competencyDefinitions.officer.categories)) {
        if (list.includes(competency)) return cat;
      }
    } else {
      const def = rank === 'E7' || rank === 'E8'
        ? competencyDefinitions.enlisted.e7e8.categories
        : competencyDefinitions.enlisted.e4e6.categories;
      for (const [cat, list] of Object.entries(def)) {
        if (list.includes(competency)) return cat;
      }
    }
    return 'Other';
  }, [rankCategory, rank]);

  // Update internal state when initialBullets change from parent
  useEffect(() => {
    console.log("BulletEditor: initialBullets updated:", initialBullets);
    setBullets(initialBullets || []);
  }, [initialBullets]);

  // Reset form when rank category changes
  useEffect(() => {
    setNewBulletForm({
      competency: '',
      content: '',
      category: ''
    });
    setFilters({
      competency: 'All',
      category: 'All',
      applied: 'All',
      searchTerm: ''
    });
  }, [rankCategory, rank]);

  // Memoized competencies and categories for current rank
  const { competencies, categories } = useMemo(() => {
    const currentCompetencies = getCurrentCompetencies();
    const currentCategories = getCurrentCategories();
    
    return {
      competencies: ['All', ...currentCompetencies],
      categories: ['All', ...currentCategories]
    };
  }, [getCurrentCompetencies, getCurrentCategories]);

  // Memoized filtered bullets
  const filteredBullets = useMemo(() => {
    return bullets.filter(bullet => {
      const matchesCompetency = filters.competency === 'All' || bullet.competency === filters.competency;
      const matchesCategory = filters.category === 'All' || bullet.category === filters.category;
      const matchesApplied = filters.applied === 'All' ||
        (filters.applied === 'Applied' && bullet.isApplied) ||
        (filters.applied === 'Not Applied' && !bullet.isApplied);
      const matchesSearch = !filters.searchTerm ||
        bullet.content.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        bullet.competency.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesCompetency && matchesCategory && matchesApplied && matchesSearch;
    });
  }, [bullets, filters]);

  // Helper function to safely update bullets and notify parent
  const updateBulletsAndNotifyParent = useCallback((updatedBullets: Bullet[]) => {
    console.log("BulletEditor: Updating bullets:", updatedBullets.length);
    setBullets(updatedBullets);
    onBulletsChanged(updatedBullets);
    setError(null);
  }, [onBulletsChanged]);

  // Handler for toggling bullet applied status
  const toggleBulletApplied = useCallback(async (id: string) => {
    try {
      console.log("BulletEditor: Toggling applied status for bullet:", id);
      const updatedBullets = bullets.map(bullet =>
        bullet.id === id ? { ...bullet, isApplied: !bullet.isApplied } : bullet
      );
      await updateBulletsAndNotifyParent(updatedBullets);
    } catch (err) {
      setError(`Failed to update bullet status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [bullets, updateBulletsAndNotifyParent]);

  // Handler for updating bullet content with debounce
  const updateBulletContent = useCallback(async (id: string, newContent: string) => {
    try {
      setPendingChanges(prev => ({ ...prev, [id]: newContent }));
      
      const updatedBullets = bullets.map(bullet =>
        bullet.id === id ? { ...bullet, content: newContent } : bullet
      );
      
      await updateBulletsAndNotifyParent(updatedBullets);
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      setError(`Failed to update bullet content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [bullets, updateBulletsAndNotifyParent]);

  // Handler for deleting bullets
  const deleteBullet = useCallback(async (id: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      if (window.confirm('Are you sure you want to delete this bullet?')) {
        console.log("BulletEditor: Deleting bullet:", id);
        const updatedBullets = bullets.filter(bullet => bullet.id !== id);
        await updateBulletsAndNotifyParent(updatedBullets);
      }
    } catch (err) {
      setError(`Failed to delete bullet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  }, [bullets, isDeleting, updateBulletsAndNotifyParent]);

  // Handler for adding new bullet
  const addNewBullet = useCallback(async () => {
    if (!newBulletForm.competency || !newBulletForm.content.trim()) {
      setError('Please select a competency and enter bullet content');
      return;
    }

    try {
      const category = getCategoryFromCompetency(newBulletForm.competency);
      const newBullet: Bullet = {
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        competency: newBulletForm.competency,
        content: newBulletForm.content.trim(),
        isApplied: false,
        category: category,
        createdAt: Date.now(),
        source: 'manual'
      };

      const updatedBullets = [...bullets, newBullet];
      await updateBulletsAndNotifyParent(updatedBullets);
      
      // Reset form
      setNewBulletForm({
        competency: '',
        content: '',
        category: ''
      });
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(`Failed to add bullet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [newBulletForm, bullets, getCategoryFromCompetency, updateBulletsAndNotifyParent]);

  // Handler for exporting bullets
  const exportBullets = useCallback(() => {
    try {
      console.log("BulletEditor: Exporting bullets");
      const appliedBullets = bullets.filter(b => b.isApplied);

      if (appliedBullets.length === 0) {
        setError('No applied bullets to export.');
        return;
      }

      // Group bullets by category and competency
      const categorizedBullets: { [key: string]: { [key: string]: Bullet[] } } = {};
      appliedBullets.forEach(bullet => {
        if (!categorizedBullets[bullet.category]) {
          categorizedBullets[bullet.category] = {};
        }
        if (!categorizedBullets[bullet.category][bullet.competency]) {
          categorizedBullets[bullet.category][bullet.competency] = [];
        }
        categorizedBullets[bullet.category][bullet.competency].push(bullet);
      });

      // Create markdown content
      const evalType = rankCategory === 'Officer' ? 'Officer' : `${rank} Enlisted`;
      let exportContent = `# USCG ${evalType} Evaluation Bullets\n\n`;
      Object.entries(categorizedBullets).forEach(([category, competencies]) => {
        exportContent += `## ${category}\n\n`;
        Object.entries(competencies).forEach(([competency, bullets]) => {
          exportContent += `### ${competency}\n\n`;
          bullets.forEach(bullet => {
            exportContent += `- ${bullet.content}\n`;
          });
          exportContent += '\n';
        });
      });

      // Create and download file
      const blob = new Blob([exportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uscg_${rankCategory.toLowerCase()}_${rank}_bullets.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setError(null);
    } catch (err) {
      setError(`Failed to export bullets: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [bullets, rankCategory, rank]);

  // Handler for clearing all bullets
  const clearAllBullets = useCallback(async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      if (window.confirm('Are you sure you want to delete ALL bullets? This cannot be undone.')) {
        console.log("BulletEditor: Clearing all bullets");
        await updateBulletsAndNotifyParent([]);
      }
    } catch (err) {
      setError(`Failed to clear bullets: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, updateBulletsAndNotifyParent]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="space-y-6" role="region" aria-label="Bullet Editor">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-xl font-semibold">
          Manage {rankCategory} {rankCategory === 'Enlisted' ? rank : ''} Bullets ({bullets.length})
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="outline"
            aria-label="Add new bullet manually"
          >
            {showAddForm ? 'Cancel' : 'Add Bullet'}
          </Button>
          
          <Button
            onClick={exportBullets}
            variant="secondary"
            disabled={!bullets.some(b => b.isApplied)}
            aria-label="Export applied bullets to markdown file"
          >
            Export Applied Bullets
          </Button>
          
          <Button
            onClick={clearAllBullets}
            variant="destructive"
            disabled={bullets.length === 0 || isDeleting}
            aria-label="Clear all bullets"
          >
            {isDeleting ? 'Clearing...' : 'Clear All Bullets'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add new bullet form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Add New Bullet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Competency <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newBulletForm.competency}
                  onValueChange={(value) => setNewBulletForm(prev => ({ 
                    ...prev, 
                    competency: value,
                    category: getCategoryFromCompetency(value)
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select competency" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentCompetencies().map(comp => (
                      <SelectItem key={comp} value={comp}>
                        {comp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Bullet Content <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={newBulletForm.content}
                  onChange={(e) => setNewBulletForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter the bullet content..."
                  className="min-h-[100px]"
                />
              </div>
              
              {newBulletForm.competency && (
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <Input
                    value={getCategoryFromCompetency(newBulletForm.competency)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={addNewBullet} disabled={!newBulletForm.competency || !newBulletForm.content.trim()}>
                  Add Bullet
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3" role="search">
        <div>
          <Input
            placeholder="Search bullets..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full"
            aria-label="Search bullets"
          />
        </div>
        
        <div>
          <Select
            value={filters.competency}
            onValueChange={(value) => handleFilterChange('competency', value)}
          >
            <SelectTrigger aria-label="Filter by competency">
              <SelectValue placeholder="Filter by Competency" />
            </SelectTrigger>
            <SelectContent>
              {competencies.map(comp => (
                <SelectItem key={comp} value={comp}>
                  {comp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger aria-label="Filter by category">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Select
            value={filters.applied}
            onValueChange={(value) => handleFilterChange('applied', value)}
          >
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Bullets</SelectItem>
              <SelectItem value="Applied">Applied Only</SelectItem>
              <SelectItem value="Not Applied">Not Applied Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bullets list */}
      <div role="list" aria-label="Bullets list">
        {filteredBullets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {bullets.length === 0 ? (
                <p>No bullets found. Use the Generate Bullets tab to create some evaluation bullets or click "Add Bullet" to manually create one.</p>
              ) : (
                <p>No bullets match your current filters.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBullets.map(bullet => (
              <Card key={bullet.id} role="listitem">
                <div className="p-4 flex flex-col sm:flex-row justify-between border-b">
                  <div>
                    <div className="text-sm font-medium">{bullet.competency}</div>
                    <div className="text-xs text-muted-foreground">{bullet.category}</div>
                    {bullet.source && (
                      <div className="text-xs text-muted-foreground">Source: {bullet.source}</div>
                    )}
                  </div>
                  
                  <div className="mt-2 sm:mt-0 flex flex-wrap gap-2">
                    <Button
                      variant={bullet.isApplied ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleBulletApplied(bullet.id)}
                      aria-pressed={bullet.isApplied}
                      aria-label={`${bullet.isApplied ? 'Remove from' : 'Add to'} applied bullets`}
                    >
                      {bullet.isApplied ? "Applied" : "Apply"}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBullet(bullet.id)}
                      disabled={isDeleting}
                      aria-label="Delete bullet"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <Textarea
                    defaultValue={bullet.content}
                    onChange={(e) => setPendingChanges(prev => ({ ...prev, [bullet.id]: e.target.value }))}
                    onBlur={(e) => updateBulletContent(bullet.id, e.target.value)}
                    className="min-h-[100px] w-full"
                    aria-label={`Edit bullet content for ${bullet.competency}`}
                  />
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(bullet.createdAt).toLocaleString()}
                    {pendingChanges[bullet.id] && (
                      <span className="ml-2 italic">(unsaved changes)</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}