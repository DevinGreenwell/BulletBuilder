'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getWork, saveWork, WorkRecord } from '@/lib/work';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input" // eslint-disable-line @typescript-eslint/no-unused-vars
import { Textarea } from "@/components/ui/textarea" // eslint-disable-line @typescript-eslint/no-unused-vars
import { Select } from "@/components/ui/select" // eslint-disable-line @typescript-eslint/no-unused-vars
import { cn } from "@/lib/utils" // eslint-disable-line @typescript-eslint/no-unused-vars
// Removed ChevronUp as it was unused
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from "lucide-react"

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

  // Load persisted work.
  // This effect now includes initialBullets and onBulletsChanged in its dependency array.
  useEffect(() => {
    // Only load from storage if no initialBullets provided or if they are empty
    if (!initialBullets || initialBullets.length === 0) {
      getWork()
        .then((records: WorkRecord[]) => {
          if (records.length > 0) {
            const saved = records[0].content as Bullet[];
            console.log("BulletEditor: Loaded bullets from storage:", saved);
            setBullets(saved);
            // Call onBulletsChanged if it's provided
            if (onBulletsChanged) {
              onBulletsChanged(saved);
            }
          }
        })
        .catch((err) => console.error('Failed to load bullets:', err));
    }
  }, [initialBullets, onBulletsChanged]); // Added initialBullets and onBulletsChanged to dependencies

  // Save bullets whenever they change
  const handleChange = (newBullets: Bullet[]) => {
    setBullets(newBullets);
    // Call onBulletsChanged if it's provided
    if (onBulletsChanged) {
      onBulletsChanged(newBullets);
    }
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
      // Consider using a more user-friendly notification than alert
      alert('Please fill out all fields');
      return;
    }
    
    const bullet: Bullet = {
      id: generateBulletId(),
      competency: newBullet.competency,
      content: newBullet.content.trim(),
      isApplied: false,
      category: newBullet.category,
      createdAt: Date.now(),
      source: 'manual'
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
    // Swap elements
    [newBullets[index - 1], newBullets[index]] = [newBullets[index], newBullets[index - 1]];
    
    handleChange(newBullets);
  };

  // Move bullet down in the list
  const moveBulletDown = (bulletId: string) => {
    const index = bullets.findIndex(b => b.id === bulletId);
    if (index === -1 || index === bullets.length - 1) return; // Not found or already at bottom
    
    const newBullets = [...bullets];
    // Swap elements
    [newBullets[index + 1], newBullets[index]] = [newBullets[index], newBullets[index + 1]];
    
    handleChange(newBullets);
  };

  // Group bullets by category
  const grouped = bullets.reduce((acc, bullet) => {
    // Ensure category exists, fallback if necessary
    const cat = bullet.category || getCategoryFromCompetency(bullet.competency) || 'Other';
    acc[cat] = acc[cat] || [];
    acc[cat].push(bullet);
    return acc;
  }, {} as Record<string, Bullet[]>);
  
  // Define the correct category order
  const categoryOrder = [
    'Performance of Duties',
    'Leadership Skills',
    'Personal and Professional Qualities',
    'Military', // Example, adjust as needed
    'Performance', // Example, adjust as needed
    'Professional Qualities', // Example, adjust as needed
    'Leadership', // Example, adjust as needed
    'Other' // Fallback category
  ];
  
  // Log for debugging (can be removed in production)
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
    
    return competencyToCategory[competency] || 'Other'; // Fallback to 'Other'
  }

  return (
    <div className="max-w-4xl mx-auto p-4"> {/* Added some padding for better spacing */}
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
        <div className="mb-6 p-4 border border-ring rounded-md bg-card shadow-md"> {/* Added shadow for depth */}
          <h3 className="text-lg font-semibold mb-3">Add New Bullet</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1 text-foreground"> {/* Ensured text color */}
                Category:
              </label>
              <select
                id="category"
                value={newBullet.category}
                onChange={handleCategoryChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" /* Improved focus styling and consistency */
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="competency" className="block text-sm font-medium mb-1 text-foreground">
                Competency:
              </label>
              <select
                id="competency"
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
              <label htmlFor="content" className="block text-sm font-medium mb-1 text-foreground">
                Bullet Content:
              </label>
              <textarea
                id="content"
                value={newBullet.content}
                onChange={(e) => setNewBullet({...newBullet, content: e.target.value})}
                rows={4}
                placeholder="Enter bullet content..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" /* Improved styling */
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

      {/* Log sorted categories for verification (can be removed) */}
      {/* This div is for debugging and can be removed or commented out in production */}
      {/* <div style={{ display: 'none' }}>
        {Object.entries(grouped)
          .sort(([catA], [catB]) => {
            const indexA = categoryOrder.indexOf(catA);
            const indexB = categoryOrder.indexOf(catB);
            return (indexA === -1 ? categoryOrder.length : indexA) - (indexB === -1 ? categoryOrder.length : indexB);
          })
          .map(([category], index) => {
            console.log(`Sorted Category ${index + 1}: ${category}`);
            return null;
          })
        }
      </div> 
      */}

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center p-6 bg-background border border-input rounded-md shadow"> {/* Added shadow */}
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
            // console.log(`Sorting: ${catA} (index: ${indexA}) vs ${catB} (index: ${indexB})`); // Debug log
            return (indexA === -1 ? categoryOrder.length : indexA) - (indexB === -1 ? categoryOrder.length : indexB);
          })
          .map(([category, bulletsList]) => (
          <div key={category} className="mb-6 border border-input rounded-md overflow-hidden shadow-md"> {/* Added shadow */}
            {/* Category Header with Collapse Toggle */}
            <div 
              className="flex justify-between items-center p-3 bg-muted cursor-pointer hover:bg-muted/80 transition-colors" /* Added hover effect */
              onClick={() => toggleCategoryCollapse(category)}
              role="button" // Added role for accessibility
              tabIndex={0} // Added tabIndex for accessibility
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCategoryCollapse(category); }} // Keyboard accessibility
            >
              <h3 className="text-lg font-semibold flex items-center text-foreground"> {/* Ensured text color */}
                {collapsedCategories[category] ? 
                  <ChevronRight className="h-5 w-5 mr-2" /> :  /* Added margin */
                  <ChevronDown className="h-5 w-5 mr-2" />} /* Added margin */
                {category} <span className="ml-2 text-sm text-muted-foreground">({bulletsList.length} bullets)</span>
              </h3>
            </div>
            
            {/* Bullets List - Collapsible */}
            {!collapsedCategories[category] && (
              <div className="space-y-3 p-3 bg-background"> {/* Ensured background color */}
                {bulletsList.map((bullet, index) => (
                  <div
                    key={bullet.id}
                    className={`p-3 border rounded-md relative shadow-sm ${ /* Added shadow-sm */
                      bullet.isApplied ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-700' : 'bg-card border-input' /* Improved applied style for dark/light mode */
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
                            size="sm" // Consistent button sizing
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm" // Consistent button sizing
                            onClick={saveEditing}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4 pr-16 text-foreground break-words">{bullet.content}</div> /* Ensured text color and word break */
                    )}
                    
                    {/* Bullet Actions - Only show when not editing */}
                    {editingBullet !== bullet.id && (
                      <div className="flex flex-wrap gap-2 justify-between items-center"> {/* Added flex-wrap and gap */}
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
                        
                        <div className="flex gap-2"> {/* Grouped edit/delete buttons */}
                          <Button
                            variant="ghost" // Subtler button style
                            size="sm"
                            onClick={() => startEditing(bullet.id, bullet.content)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost" // Subtler button style
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
                      <div className="absolute right-2 top-2 flex flex-col space-y-1"> {/* Adjusted layout for reorder buttons */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent category collapse toggle
                            moveBulletUp(bullet.id);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-50" /* Improved styling */
                          disabled={index === 0}
                          title="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent category collapse toggle
                            moveBulletDown(bullet.id);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md disabled:opacity-50" /* Improved styling */
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
