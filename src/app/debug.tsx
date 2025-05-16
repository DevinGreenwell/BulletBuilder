// src/app/debug/page.tsx
import { ThemeDebugger } from '@/components/debug/ThemeDebugger';

export default function DebugPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Theme Debug Page</h1>
      <ThemeDebugger />
    </div>
  );
}