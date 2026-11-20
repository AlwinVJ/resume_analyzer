import { MatchVerdict } from '../types';

// Matching score from get_verdict() in src/scoring/weighted_score.py.
export const STRONG_MATCH_MIN = 80;
export const MODERATE_MATCH_MIN = 65;

export function verdictForScore(score: number): MatchVerdict {
  if (score >= STRONG_MATCH_MIN) return 'Strong Match';
  if (score >= MODERATE_MATCH_MIN) return 'Moderate Match';
  return 'Weak Match';
}
