// src/components/debug/ThemeDebugger.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ThemeDebugger() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div>Loading theme debugger...</div>;

  return (
    <div className="p-4 border border-primary rounded-md m-4">
      <h2 className="text-lg font-bold mb-2">Theme Debugger</h2>
      <div className="space-y-2">
        <p>Current theme: <strong>{theme}</strong></p>
        <p>System preference: <strong>{systemTheme}</strong></p>
        <p>Dark class on HTML: <strong>{document.documentElement.classList.contains('dark') ? 'Yes' : 'No'}</strong></p>
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => setTheme('light')}
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
          >
            Set Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
          >
            Set Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md"
          >
            Set System
          </button>
        </div>
      </div>
    </div>
  );
}