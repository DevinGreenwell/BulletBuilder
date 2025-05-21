'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWork, saveWork, WorkRecord } from '@/lib/work';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

// Removed duplicate Bullet type import to avoid conflict with local declaration
interface Bullet {
  id: string;
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
}

interface BulletEditorProps {
  initialBullets?: Bullet[]; // Now uses the imported Bullet type
  onBulletsChanged?: (bullets: Bullet[]) => void;
}

export default function BulletEditor({ initialBullets, onBulletsChanged }: BulletEditorProps) {
  const [bullets, setBullets] = useState<Bullet[]>(initialBullets || []);
  
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
  const competencyOptions = {
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

  // Update bullets when initialBullets changes
  useEffect(() => {
    console.log("BulletEditor: initialBullets changed:", initialBullets);
    if (initialBullets && initialBullets.length > 0) {
      setBullets(initialBullets);
    }
  }, [initialBullets]);

  // Load persisted work only on initial mount and only if no initialBullets
  useEffect(() => {
    // Only load from storage if no initialBullets provided
    if (!initialBullets || initialBullets.length === 0) {
      getWork()
        .then((records: WorkRecord[]) => {
          if (records.length > 0) {
            const saved = records[0].content as Bullet[];
            console.log("BulletEditor: Loaded bullets from storage:", saved);
            setBullets(saved);
            onBulletsChanged?.(saved);
          }
        })
        .catch((err) => console.error('Failed to load bullets:', err));
    }
  }, []); // Empty dependency array means this only runs once on mount

  // Save bullets whenever they change
  const handleChange = (newBullets: Bullet[]) => {
    setBullets(newBullets);
    onBulletsChanged?.(newBullets);
    saveWork(newBullets).catch((err) => console.error('Failed to save bullets:', err));
  };
  
  // Start editing a bullet
  const startEditing = (bulletId: string, currentContent: string) => {
    setEditingBullet(bulletId);
    setEditText(currentContent);
    // Focus the input after it renders
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
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
      setEditingBullet(null);
      setEditText('');
    }
  };

  // Handlers for edit, delete, toggle
  const handleEditSave = (id: string, newContent: string) => {
    const updated = bullets.map((b) => (b.id === id ? { ...b, content: newContent } : b));
    handleChange(updated);
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
    // Reset competency when category changes
    setNewBullet({
      ...newBullet,
      category,
      competency: competencyOptions[category as keyof typeof competencyOptions]?.[0] || ''
    });
  };
  
  // Handle adding a new bullet
  const handleAddBullet = () => {
    if (!newBullet.category || !newBullet.competency || !newBullet.content.trim()) {
      alert('Please fill out all fields');
      return;
    }
    
    const bullet: Bullet = {
      id: generateBulletId(),
      competency: newBullet.competency,
      content: newBullet.content.trim(),
      isApplied: false,
      category: newBullet.category
    };
    
    const updatedBullets = [...bullets, bullet];
    handleChange(updatedBullets);
    
    // Reset form
    setNewBullet({
      competency: '',
      content: '',
      category: ''
    });
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
    if (index <= 0) return; // Already at top or not found
    
    const newBullets = [...bullets];
    const temp = newBullets[index];
    newBullets[index] = newBullets[index - 1];
    newBullets[index - 1] = temp;
    
    handleChange(newBullets);
  };

  // Move bullet down in the list
  const moveBulletDown = (bulletId: string) => {
    const index = bullets.findIndex(b => b.id === bulletId);
    if (index === -1 || index === bullets.length - 1) return; // Not found or already at bottom
    
    const newBullets = [...bullets];
    const temp = newBullets[index];
    newBullets[index] = newBullets[index + 1];
    newBullets[index + 1] = temp;
    
    handleChange(newBullets);
  };

  // Group bullets by category
  const grouped = bullets.reduce((acc, bullet) => {
    const cat = bullet.category || getCategoryFromCompetency(bullet.competency);
    acc[cat] = acc[cat] || [];
    acc[cat].push(bullet);
    return acc;
  }, {} as Record<string, Bullet[]>);
  
  // Define the correct category order
  const categoryOrder = [
    'Performance of Duties',
    'Leadership Skills',
    'Personal and Professional Qualities',
    'Military',
    'Performance',
    'Professional Qualities',
    'Leadership',
    'Other'
  ];
  
  // Log for debugging
  console.log("Categories before sorting:", Object.keys(grouped));
  console.log("Defined category order:", categoryOrder);

  function getCategoryFromCompetency(competency: string): string {
    // Map of competencies to categories - using exact names from categoryOrder
    const competencyToCategory: Record<string, string> = {
      // Performance of Duties competencies
      'Planning & Preparedness': 'Performance of Duties',
      'Using Resources': 'Performance of Duties',
      'Results/Effectiveness': 'Performance of Duties',
      'Adaptability': 'Performance of Duties',
      'Professional Competence': 'Performance of Duties',
      'Speaking and Listening': 'Performance of Duties',
      'Writing': 'Performance of Duties',
      
      // Leadership Skills competencies
      'Looking Out For Others': 'Leadership Skills',
      'Developing Others': 'Leadership Skills',
      'Directing Others': 'Leadership Skills',
      'Teamwork': 'Leadership Skills',
      'Workplace Climate': 'Leadership Skills',
      'Evaluations': 'Leadership Skills',
      
      // Personal and Professional Qualities competencies
      'Initiative': 'Personal and Professional Qualities',
      'Judgment': 'Personal and Professional Qualities',
      'Responsibility': 'Personal and Professional Qualities',
      'Professional Presence': 'Personal and Professional Qualities',
      'Health and Well Being': 'Personal and Professional Qualities',
    };
    
    return competencyToCategory[competency] || 'Other';
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Performance Bullets</h2>
        <Button 
          onClick={() => setShowNewBulletForm(!showNewBulletForm)}
          variant={showNewBulletForm ? "outline" : "default"}
        >
          {showNewBulletForm ? 'Cancel' : 'Add Bullet Manually'}
        </Button>
      </div>
      
      {/* New Bullet Form */}
      {showNewBulletForm && (
        <div className="mb-6 p-4 border border-ring rounded-md bg-card">
          <h3 className="text-lg font-semibold mb-3">Add New Bullet</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category:
              </label>
              <select
                id="category"
                value={newBullet.category}
                onChange={handleCategoryChange}
                className="w-full rounded-md border border-ring bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="competency" className="block text-sm font-medium mb-1">
                Competency:
              </label>
              <select
                id="competency"
                value={newBullet.competency}
                onChange={(e) => setNewBullet({...newBullet, competency: e.target.value})}
                className="w-full rounded-md border border-ring bg-background px-3 py-2 text-sm"
                disabled={!newBullet.category}
              >
                <option value="">Select Competency</option>
                {newBullet.category && competencyOptions[newBullet.category as keyof typeof competencyOptions]?.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-1">
                Bullet Content:
              </label>
              <textarea
                id="content"
                value={newBullet.content}
                onChange={(e) => setNewBullet({...newBullet, content: e.target.value})}
                rows={4}
                placeholder="Enter bullet content..."
                className="w-full rounded-md border border-ring bg-background px-3 py-2 text-sm"
              />
            </div>
            
            <div className="flex justify-end">
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

      {/* Log sorted categories for verification */}
      <div style={{ display: 'none' }}>
        {Object.entries(grouped)
          .sort(([catA], [catB]) => {
            const indexA = categoryOrder.indexOf(catA);
            const indexB = categoryOrder.indexOf(catB);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          })
          .map(([category], index) => {
            console.log(`${index + 1}. ${category}`);
            return null;
          })
        }
      </div>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center p-6 bg-background border border-ring rounded-md">
          <p className="text-muted-foreground">
            No bullets yet. Use the chat interface to generate bullets or add them manually.
          </p>
        </div>
      ) : (
        // Sort categories according to the defined order
        Object.entries(grouped)
          .sort(([catA], [catB]) => {
            const indexA = categoryOrder.indexOf(catA);
            const indexB = categoryOrder.indexOf(catB);
            // If category isn't in the list, put it at the end
            console.log(`Sorting: ${catA} (index: ${indexA}) vs ${catB} (index: ${indexB})`);
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          })
          .map(([category, bulletsList]) => (
          <div key={category} className="mb-6 border border-ring rounded-md overflow-hidden">
            {/* Category Header with Collapse Toggle */}
            <div 
              className="flex justify-between items-center p-3 bg-muted cursor-pointer"
              onClick={() => toggleCategoryCollapse(category)}
            >
              <h3 className="text-lg font-semibold flex items-center">
                {collapsedCategories[category] ? 
                  <ChevronRight className="h-5 w-5 mr-1" /> : 
                  <ChevronDown className="h-5 w-5 mr-1" />}
                {category} <span className="ml-2 text-sm text-muted-foreground">({bulletsList.length} bullets)</span>
              </h3>
            </div>
            
            {/* Bullets List - Collapsible */}
            {!collapsedCategories[category] && (
              <div className="space-y-3 p-3">
                {bulletsList.map((bullet, index) => (
                  <div
                    key={bullet.id}
                    className={`p-3 border rounded-md relative ${
                      bullet.isApplied ? 'bg-ring/25 border-ring' : 'bg-background border-ring'
                    }`}
                  >
                    <div className="text-sm text-muted-foreground mb-1">{bullet.competency}</div>
                    
                    {editingBullet === bullet.id ? (
                      <div className="mb-4">
                        <textarea 
                          ref={editInputRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full rounded-md border border-ring bg-background px-3 py-2 text-sm"
                          rows={4}
                          onKeyDown={(e) => {
                            // Save on Ctrl+Enter
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              e.preventDefault();
                              saveEditing();
                            }
                            // Cancel on Escape
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEditing();
                            }
                          }}
                        />
                        <div className="flex justify-end mt-2 space-x-2">
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 border border-ring rounded-md text-muted-foreground text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveEditing}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 pr-16">{bullet.content}</div>
                    )}
                    
                    {/* Bullet Actions - Only show when not editing */}
                    {editingBullet !== bullet.id && (
                      <div className="flex justify-between">
                        <div>
                          <button
                            onClick={() => handleToggleApply(bullet.id)}
                            className={`px-3 py-1 rounded-md mr-2 ${
                              bullet.isApplied
                                ? 'bg-green-600 text-white'
                                : 'border border-green-600 text-green-600'
                            }`}
                          >
                            {bullet.isApplied ? 'Applied' : 'Apply to Eval'}
                          </button>
                        </div>
                        
                        <div>
                          <button
                            onClick={() => startEditing(bullet.id, bullet.content)}
                            className="px-3 py-1 text-blue-600 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bullet.id)}
                            className="px-3 py-1 text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Reordering buttons - only show when not editing */}
                    {editingBullet !== bullet.id && (
                      <div className="absolute right-2 top-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBulletUp(bullet.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground"
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
                          className="p-1 text-muted-foreground hover:text-foreground"
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
        ))
      )}
    </div>
  );
}