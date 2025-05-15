export interface Bullet {
  id?: string;
  content: string;
  competency: string;
  rankCategory?: string;
  rank?: string;
  isApplied: boolean; // Add this missing property
  category: string;   // Add this missing property
  // Any other properties needed
}