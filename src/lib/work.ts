
export interface WorkRecord {
  // Define properties of a work record according to your application's requirements.
  id: string;
  data: any;
}

export async function saveWork(data: any) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid work data: must be a non-null object');
  }

  const res = await fetch('/api/work', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data ?? {}),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Save failed:', res.status, err);
    throw new Error('Failed to save work');
  }

  return res.json();
}

export async function deleteWork(id: string) {
  const res = await fetch(`/api/work?id=${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Delete failed:', res.status, err);
    throw new Error('Failed to delete work');
  }

  return res.json();
}

export async function getWork(): Promise<WorkRecord[]> {
  const res = await fetch('/api/work', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Get work failed:', res.status, err);
    throw new Error('Failed to fetch work');
  }

  return res.json();
}
