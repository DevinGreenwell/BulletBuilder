export interface Bullet {
  id?: string; // Keep as string if it's always defined when in the bullets array
  competency: string;
  content: string;
  isApplied: boolean;
  category: string;
  createdAt?: number;
  source?: string;
}