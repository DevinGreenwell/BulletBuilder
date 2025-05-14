// src/lib/work.ts

export type WorkRecord = {
    id: string;
    userId: string;
    content: any;
    createdAt: string;
    updatedAt: string;
  };
  
  // Fetch the current user’s work (returns [] or [record])
  export async function getWork(): Promise<WorkRecord[]> {
    const res = await fetch('/api/work');
    if (!res.ok) throw new Error('Failed to fetch work');
    return res.json();
  }
  
  // Upsert the user’s work content
  export async function saveWork(content: any): Promise<WorkRecord> {
    const res = await fetch('/api/work', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('Failed to save work');
    return res.json();
  }
  