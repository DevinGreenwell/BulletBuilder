'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; 
import { getWork, saveWork, WorkRecord } from '@/lib/work';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";

interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt: number;
  source?: string;
}

interface StructuredContentWithBullets {
  bullets: Bullet[];
}

function isStructuredContentWithBullets(content: unknown): content is StructuredContentWithBullets {
  return typeof content === 'object' && content !== null && 'bullets' in content && Array.isArray(content.bullets);
}


interface BulletEditorProps {
  initialBullets?: Bullet[];
  onBulletsChanged?: (bullets: Bullet[]) => void;
}

export default function BulletEditor({ initialBullets = [], onBulletsChanged }: BulletEditorProps) {
  const [bullets, setBullets] = useState<Bullet[]>(initialBullets);
  const [showNewBulletForm, setShowNewBulletForm] = useState(false);
  const [newBullet, setNewBullet] = useState({
    competency: '',
    content: '',
    category: ''
  });
  
  const [editingBullet, setEditingBullet] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  
  const competencyOptions: Record<string, string[]> = {
    'Performance of Duties': [
      'Planning & Preparedness', 'Using Resources', 'Results/Effectiveness',
      'Adaptability', 'Professional Competence', 'Speaking and Listening', 'Writing'
    ],
    'Leadership Skills': [
      'Looking Out For Others', 'Developing Others', 'Directing Others',
      'Teamwork', 'Workplace Climate', 'Evaluations'
    ],
    'Personal and Professional Qualities': [
      'Initiative', 'Judgment', 'Responsibility',
      'Professional Presence', 'Health and Well Being'
    ],
  };
  
  const categories = Object.keys(competencyOptions);

  // Effect to synchronize initialBullets prop to local bullets state
  useEffect(() => {
    // Only update if initialBullets is actually different to prevent unnecessary re-renders
    // and overwriting local changes if prop reference changes but content is same.
    if (initialBullets && JSON.stringify(initialBullets) !== JSON.stringify(bullets)) {
      console.log("BulletEditor: initialBullets prop has changed, updating local state.");
      setBullets(initialBullets);
    }
  }, [initialBullets, bullets]); // 'bullets' is included because we compare against it

  // Effect to load persisted work on initial mount if no initialBullets are provided
  useEffect(() => {
    // Check if initialBullets is truly empty or not provided
    if ((!initialBullets || initialBullets.length === 0) && typeof window !== 'undefined') {
      console.log("BulletEditor: No initial bullets, attempting to load from storage.");
      getWork()
        .then((records: WorkRecord[]) => {
          if (records.length > 0 && records[0].content) {
            const savedContent = records[0].content;
            let loadedBullets: Bullet[] = [];
            if (isStructuredContentWithBullets(savedContent)) {
                loadedBullets = savedContent.bullets;
            } else if (Array.isArray(savedContent)) { 
                loadedBullets = savedContent as Bullet[];
            }
            
            if (loadedBullets.length > 0) {
                console.log("BulletEditor: Loaded bullets from storage:", loadedBullets);
                setBullets(loadedBullets); // Update local state
                // Call onBulletsChanged to inform parent about these loaded bullets
                // This is important if parent needs to know about initially loaded data
                console.log("BulletEditor: Calling onBulletsChanged for initially loaded bullets from storage.");
                onBulletsChanged?.(loadedBullets); 
            }
          }
        })
        .catch((err) => console.error('BulletEditor: Failed to load bullets from storage:', err));
    }
  // onBulletsChanged is a function, if it can change, it should be in deps.
  // initialBullets prop is also a dependency.
  }, [initialBullets, onBulletsChanged]);

  // Debounced effect to call onBulletsChanged and saveWork when 'bullets' state changes
  useEffect(() => {
    // This effect will run after any setBullets call (e.g., from handleChange)
    // and also if onBulletsChanged prop itself changes.

    // Skip if onBulletsChanged is not provided
    if (!onBulletsChanged) {
        // console.log("BulletEditor: onBulletsChanged not provided, skipping debounced effect.");
        return;
    }
    
    // console.log("BulletEditor: Debounce useEffect triggered because 'bullets' or 'onBulletsChanged' changed.");

    const handler = setTimeout(() => {
      // This is the point where we inform the parent about the current state of 'bullets'
      console.log("BulletEditor: Debounced: Calling onBulletsChanged with:", bullets);
      onBulletsChanged(bullets); // Call directly since we checked it exists
      
      // Persist the content
      // Ensure saveWork is appropriate here (e.g., content structure)
      saveWork({ content: bullets }) 
        .catch((err) => console.error('BulletEditor: Failed to save bullets (debounced):', err));
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
    };
  // This effect should run if the bullets content changes or if the callback changes.
  // Removing initialBullets from here, as its main sync is handled by the first useEffect.
  // The purpose here is to react to local 'bullets' state modifications.
  }, [bullets, onBulletsChanged]); 


  const handleChange = (newBullets: Bullet[]) => {
    // This function is the primary way local interactions update the 'bullets' state
    console.log("BulletEditor: handleChange called. New bullets count:", newBullets.length);
    setBullets(newBullets);
    // The useEffect watching 'bullets' will handle calling onBulletsChanged and saveWork
  };
  
  const startEditing = (bulletId: string, currentContent: string) => {
    setEditingBullet(bulletId);
    setEditText(currentContent);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 10); 
  };
  
  const cancelEditing = () => {
    setEditingBullet(null);
    setEditText('');
  };
  
  const saveEditing = () => {
    if (editingBullet && editText.trim()) {
      handleEditSave(editingBullet, editText);
    }
    setEditingBullet(null); 
    setEditText('');
  };

  const handleEditSave = (id: string, newContent: string) => {
    handleChange(bullets.map((b: Bullet) => (b.id === id ? { ...b, content: newContent } : b)));
  };

  const handleDelete = (id: string) => {
    handleChange(bullets.filter((b: Bullet) => b.id !== id));
  };

  const handleToggleApply = (id: string) => {
    const bulletToToggle = bullets.find((b: Bullet) => b.id === id);
    console.log(`BulletEditor: handleToggleApply called for ID: ${id}. Current isApplied: ${bulletToToggle?.isApplied}`);

    const updatedBullets = bullets.map((b: Bullet) => 
      b.id === id ? { ...b, isApplied: !b.isApplied } : b
    );
    const toggledBullet = updatedBullets.find((b: Bullet) => b.id === id);
    console.log(`BulletEditor: Bullet ID ${id} new isApplied state (immediate): ${toggledBullet?.isApplied}`);
    
    handleChange(updatedBullets); 
  };
  
  const generateBulletId = () => `bullet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setNewBullet({
      ...newBullet,
      category,
      competency: competencyOptions[category as keyof typeof competencyOptions]?.[0] || ''
    });
  };
  
  const handleAddBullet = () => {
    if (!newBullet.category || !newBullet.competency || !newBullet.content.trim()) {
      alert('Please fill out all fields for the new bullet.');
      return;
    }
    
    const bulletToAdd: Bullet = {
      id: generateBulletId(),
      competency: newBullet.competency,
      content: newBullet.content.trim(),
      isApplied: false, 
      category: newBullet.category,
      createdAt: Date.now(),
      source: 'manual' 
    };
    
    handleChange([...bullets, bulletToAdd]);
    
    setNewBullet({ competency: '', content: '', category: '' });
    setShowNewBulletForm(false);
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories((prev: Record<string, boolean>) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const moveBulletUp = (bulletId: string) => {
    const index = bullets.findIndex((b: Bullet) => b.id === bulletId);
    if (index <= 0) return;
    
    const newBullets = [...bullets];
    [newBullets[index - 1], newBullets[index]] = [newBullets[index], newBullets[index - 1]];
    handleChange(newBullets);
  };

  const moveBulletDown = (bulletId: string) => {
    const index = bullets.findIndex((b: Bullet) => b.id === bulletId);
    if (index === -1 || index >= bullets.length - 1) return;
    
    const newBullets = [...bullets];
    [newBullets[index + 1], newBullets[index]] = [newBullets[index], newBullets[index + 1]];
    handleChange(newBullets);
  };
  
  const getCategoryFromCompetency = useCallback((competency: string): string => {
    for (const [category, competencies] of Object.entries(competencyOptions)) {
      if (competencies.includes(competency)) {
        return category;
      }
    }
    return 'Other'; 
  }, [competencyOptions]); 

  const groupedBullets = useMemo(() => {
    return bullets.reduce((acc, bullet) => {
      const category = bullet.category || getCategoryFromCompetency(bullet.competency);
      (acc[category] = acc[category] || []).push(bullet);
      return acc;
    }, {} as Record<string, Bullet[]>);
  }, [bullets, getCategoryFromCompetency]); 
  
  const sortedCategoryKeys = useMemo(() => {
    const categoryOrder = [ 
      'Performance of Duties',
      'Leadership Skills',
      'Personal and Professional Qualities',
    ];
    const keys = Object.keys(groupedBullets);
    return keys.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b); 
      if (indexA === -1) return 1; 
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedBullets]);


  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Performance Bullets</h2>
        <Button 
          onClick={() => setShowNewBulletForm(!showNewBulletForm)}
          variant={showNewBulletForm ? "outline" : "default"}
        >
          {showNewBulletForm ? 'Cancel New Bullet' : 'Add Bullet Manually'}
        </Button>
      </div>
      
      {showNewBulletForm && (
        <div className="mb-6 p-4 border border-border rounded-md bg-card shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">Add New Bullet</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-bullet-category" className="block text-sm font-medium mb-1 text-foreground">
                Category:
              </label>
              <select
                id="new-bullet-category"
                value={newBullet.category}
                onChange={handleCategoryChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-bullet-competency" className="block text-sm font-medium mb-1 text-foreground">
                Competency:
              </label>
              <select
                id="new-bullet-competency"
                value={newBullet.competency}
                onChange={(e) => setNewBullet({...newBullet, competency: e.target.value})}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                disabled={!newBullet.category}
              >
                <option value="">Select Competency</option>
                {newBullet.category && competencyOptions[newBullet.category as keyof typeof competencyOptions]?.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-bullet-content" className="block text-sm font-medium mb-1 text-foreground">
                Bullet Content:
              </label>
              <textarea
                id="new-bullet-content"
                value={newBullet.content}
                onChange={(e) => setNewBullet({...newBullet, content: e.target.value})}
                rows={4}
                placeholder="Enter bullet content..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewBulletForm(false)}>Cancel</Button>
              <Button 
                onClick={handleAddBullet}
                disabled={!newBullet.category || !newBullet.competency || !newBullet.content.trim()}
              >
                Add Bullet
              </Button>
            </div>
          </div>
        </div>
      )}

      {bullets.length === 0 && !showNewBulletForm ? ( 
        <div className="text-center p-6 bg-card border border-border rounded-md shadow">
          <p className="text-muted-foreground">
            No bullets yet. Use the chat interface to generate bullets or add them manually above.
          </p>
        </div>
      ) : (
        sortedCategoryKeys.map(category => {
          const bulletsList = groupedBullets[category];
          if (!bulletsList || bulletsList.length === 0) return null;

          return (
            <div key={category} className="mb-6 border border-border rounded-md overflow-hidden shadow-md">
              <div 
                className="flex justify-between items-center p-3 bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleCategoryCollapse(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCategoryCollapse(category); }}
              >
                <h3 className="text-lg font-semibold flex items-center text-foreground">
                  {collapsedCategories[category] ? 
                    <ChevronRight className="h-5 w-5 mr-2" /> : 
                    <ChevronDown className="h-5 w-5 mr-2" />}
                  {category} <span className="ml-2 text-sm text-muted-foreground">({bulletsList.length} bullets)</span>
                </h3>
              </div>
              
              {!collapsedCategories[category] && (
                <div className="space-y-3 p-3 bg-background">
                  {bulletsList.map((bullet, index) => (
                    <div
                      key={bullet.id}
                      className={`p-3 border rounded-md relative shadow-sm ${
                        bullet.isApplied ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-700' : 'bg-card border-input'
                      }`}
                    >
                      <div className="text-sm text-muted-foreground mb-1">{bullet.competency}</div>
                      
                      {editingBullet === bullet.id ? (
                        <div className="mb-4">
                          <textarea 
                            ref={editInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            rows={4}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                saveEditing();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                cancelEditing();
                              }
                            }}
                          />
                          <div className="flex justify-end mt-2 space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveEditing}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 pr-16 text-foreground break-words">{bullet.content}</div>
                      )}
                      
                      {editingBullet !== bullet.id && (
                        <div className="flex flex-wrap gap-2 justify-between items-center">
                          <div>
                            <Button
                              size="sm"
                              onClick={() => handleToggleApply(bullet.id)}
                              variant={bullet.isApplied ? "default" : "outline"}
                              className={`${
                                bullet.isApplied
                                  ? 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800' 
                                  : 'border-green-600 text-green-600 hover:bg-green-50 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/50'
                              }`}
                            >
                              {bullet.isApplied ? 'Applied' : 'Apply to Eval'}
                            </Button>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(bullet.id, bullet.content)}
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(bullet.id)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {editingBullet !== bullet.id && (
                        <div className="absolute right-2 top-2 flex flex-col space-y-1">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              moveBulletUp(bullet.id);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-50"
                            disabled={index === 0}
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              moveBulletDown(bullet.id);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-50"
                            disabled={index === bulletsList.length - 1}
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  );
}
