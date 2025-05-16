'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWork, saveWork, WorkRecord } from '@/lib/work';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Textarea } from "@/components/ui/textarea"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Select } from "@/components/ui/select"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { cn } from "@/lib/utils"; // eslint-disable-line @typescript-eslint/no-unused-vars
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

interface BulletEditorProps {
  initialBullets?: Bullet[];
  onBulletsChanged?: (bullets: Bullet[]) => void;
}

export default function BulletEditor({ initialBullets = [], onBulletsChanged }: BulletEditorProps) {
  console.log("BulletEditor: received initialBullets:", initialBullets);
  
  // Persisted bullets state
  const [bullets, setBullets] = useState<Bullet[]>(initialBullets);
  
  // State for new bullet form
  const [showNewBulletForm, setShowNewBulletForm] = useState(false);
  const [newBullet, setNewBullet] = useState({
    competency: '',
    content: '',
    category: ''
  });
  
  // State for inline editing
  const [editingBullet, setEditingBullet] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  
  // State for collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  
  // Competency options by category
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
    // Add enlisted categories and competencies as needed
  };
  
  // Available categories
  const categories = Object.keys(competencyOptions);

  // Update bullets when initialBullets prop changes
  useEffect(() => {
    console.log("BulletEditor: initialBullets prop changed:", initialBullets);
    // Only update from props if initialBullets is actually provided and different
    // This helps prevent overwriting local changes if prop reference changes unnecessarily
    if (initialBullets && JSON.stringify(initialBullets) !== JSON.stringify(bullets)) {
      setBullets(initialBullets);
    }
  }, [initialBullets]); // Removed 'bullets' from dependency to avoid loop if prop is stable

  // Load persisted work only on initial mount if no initialBullets provided
  useEffect(() => {
    if ((!initialBullets || initialBullets.length === 0) && typeof window !== 'undefined') {
      getWork()
        .then((records: WorkRecord[]) => {
          if (records.length > 0 && records[0].content) {
            // Assuming content could be StructuredContent or Bullet[]
            const savedContent = records[0].content;
            let loadedBullets: Bullet[] = [];

            if (typeof savedContent === 'object' && 'bullets' in savedContent && Array.isArray((savedContent as any).bullets)) {
                loadedBullets = (savedContent as any).bullets as Bullet[];
            } else if (Array.isArray(savedContent)) {
                loadedBullets = savedContent as Bullet[];
            }
            
            if (loadedBullets.length > 0) {
                console.log("BulletEditor: Loaded bullets from storage:", loadedBullets);
                setBullets(loadedBullets);
                onBulletsChanged?.(loadedBullets);
            }
          }
        })
        .catch((err) => console.error('Failed to load bullets:', err));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty: run once on mount if no initial bullets

  // Debounced save bullets whenever they change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (bullets !== initialBullets) { // Only save if there's a change from initial or last saved
        console.log("BulletEditor: Saving bullets due to change:", bullets);
        saveWork({ content: bullets }) // Assuming saveWork expects an object with a content key
          .catch((err) => console.error('Failed to save bullets:', err));
        onBulletsChanged?.(bullets);
      }
    }, 1000); // Debounce time: 1 second

    return () => {
      clearTimeout(handler);
    };
  }, [bullets, initialBullets, onBulletsChanged]);


  // Handler for local bullet changes that then triggers debounced save
  const handleChange = (newBullets: Bullet[]) => {
    setBullets(newBullets);
    // onBulletsChanged and saveWork are called by the useEffect hook watching 'bullets'
  };
  
  // Start editing a bullet
  const startEditing = (bulletId: string, currentContent: string) => {
    setEditingBullet(bulletId);
    setEditText(currentContent);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 10);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingBullet(null);
    setEditText('');
  };
  
  // Save edited bullet
  const saveEditing = () => {
    if (editingBullet && editText.trim()) {
      handleEditSave(editingBullet, editText);
    }
    setEditingBullet(null); // Always exit editing mode
    setEditText('');
  };

  // Handlers for edit, delete, toggle
  const handleEditSave = (id: string, newContent: string) => {
    handleChange(bullets.map((b) => (b.id === id ? { ...b, content: newContent } : b)));
  };

  const handleDelete = (id: string) => {
    handleChange(bullets.filter((b) => b.id !== id));
  };

  const handleToggleApply = (id: string) => {
    handleChange(
      bullets.map((b) => (b.id === id ? { ...b, isApplied: !b.isApplied } : b))
    );
  };
  
  // Function to generate a new bullet ID
  const generateBulletId = () => `bullet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  // Handle category selection in new bullet form
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setNewBullet({
      ...newBullet,
      category,
      competency: competencyOptions[category as keyof typeof competencyOptions]?.[0] || ''
    });
  };
  
  // Handle adding a new bullet
  const handleAddBullet = () => {
    if (!newBullet.category || !newBullet.competency || !newBullet.content.trim()) {
      alert('Please fill out all fields for the new bullet.'); // User-friendly alert
      return;
    }
    
    const bulletToAdd: Bullet = {
      id: generateBulletId(),
      competency: newBullet.competency,
      content: newBullet.content.trim(),
      isApplied: false, // Default to not applied
      category: newBullet.category,
      createdAt: Date.now(),
      source: 'manual' // Indicate it was manually added
    };
    
    handleChange([...bullets, bulletToAdd]);
    
    // Reset form and hide
    setNewBullet({ competency: '', content: '', category: '' });
    setShowNewBulletForm(false);
  };

  // Toggle category collapse state
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Move bullet up in the list
  const moveBulletUp = (bulletId: string) => {
    const index = bullets.findIndex(b => b.id === bulletId);
    if (index <= 0) return;
    
    const newBullets = [...bullets];
    [newBullets[index - 1], newBullets[index]] = [newBullets[index], newBullets[index - 1]]; // Swap
    handleChange(newBullets);
  };

  // Move bullet down in the list
  const moveBulletDown = (bulletId: string) => {
    const index = bullets.findIndex(b => b.id === bulletId);
    if (index === -1 || index >= bullets.length - 1) return;
    
    const newBullets = [...bullets];
    [newBullets[index + 1], newBullets[index]] = [newBullets[index], newBullets[index + 1]]; // Swap
    handleChange(newBullets);
  };
  
  // Helper to get category from competency (if bullet.category is missing)
  function getCategoryFromCompetency(competency: string): string {
    for (const [category, competencies] of Object.entries(competencyOptions)) {
      if (competencies.includes(competency)) {
        return category;
      }
    }
    return 'Other'; // Fallback category
  }

  // Group bullets by category
  const groupedBullets = useMemo(() => {
    return bullets.reduce((acc, bullet) => {
      const category = bullet.category || getCategoryFromCompetency(bullet.competency);
      (acc[category] = acc[category] || []).push(bullet);
      return acc;
    }, {} as Record<string, Bullet[]>);
  }, [bullets]); // Re-group only when bullets array changes
  
  // Define the correct category order for display
  const categoryOrder = [
    'Performance of Duties',
    'Leadership Skills',
    'Personal and Professional Qualities',
    // Add other categories in desired order, 'Other' will be appended if not listed
  ];
  
  // Get sorted category keys for rendering
  const sortedCategoryKeys = useMemo(() => {
    const keys = Object.keys(groupedBullets);
    return keys.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Sort alphabetically if both not in order
      if (indexA === -1) return 1; // Put 'a' at the end
      if (indexB === -1) return -1; // Put 'b' at the end
      return indexA - indexB;
    });
  }, [groupedBullets, categoryOrder]);


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
      
      {/* New Bullet Form */}
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

      {/* Display Bullets by Category */}
      {bullets.length === 0 ? (
        <div className="text-center p-6 bg-card border border-border rounded-md shadow">
          <p className="text-muted-foreground">
            No bullets yet. Use the chat interface to generate bullets or add them manually above.
          </p>
        </div>
      ) : (
        sortedCategoryKeys.map(category => {
          const bulletsList = groupedBullets[category];
          if (!bulletsList || bulletsList.length === 0) return null; // Should not happen if keys are from groupedBullets

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
                      
                      {/* Bullet Actions - Only show when not editing */}
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
                      
                      {/* Reordering buttons - only show when not editing */}
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
