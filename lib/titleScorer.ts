// Typed client entry point for the Viral Title Scorer engine.
// The implementation lives in titleScorerRuntime.js so the Vercel
// serverless API and the browser share one single source of truth.
import { scoreTitle as scoreTitleImpl } from './titleScorerRuntime.js';

export interface RuleBreakdown {
  id: string;
  label: string;
  score: number;
  weight: number;
  points: number;
  tip: string;
}

export interface TitleSuggestion {
  title: string;
  score: number;
}

export interface TitleScoreResult {
  score: number;
  breakdown: RuleBreakdown[];
  suggestions: TitleSuggestion[];
}

export function scoreTitle(title: string): TitleScoreResult {
  return scoreTitleImpl(title) as TitleScoreResult;
}
