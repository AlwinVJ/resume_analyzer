import { ExperienceAssessment, EducationQualification } from '../types';

/**
 * Pure helpers for experience duration and compatibility formatting.
 */

/**
 * Formats a duration in months into a human-readable string.
 * Returns null for null/undefined so callers can provide their own fallback text.
 */
export function formatDuration(months: number | null | undefined): string | null {
  if (months === null || months === undefined) {
    return null;
  }

  if (months === 0) {
    return 'No professional experience listed';
  }

  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  const years = Math.floor(months / 12);
  const remainder = months % 12;

  if (remainder === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }

  const yearStr = `${years} ${years === 1 ? 'year' : 'years'}`;
  const monthStr = `${remainder} ${remainder === 1 ? 'month' : 'months'}`;
  return `${yearStr}, ${monthStr}`;
}

/**
 * Returns the experience level classification based on existing thresholds:
 * >= 5 years: Senior
 * >= 2 years: Mid-Level
 * < 2 years: Entry Level / Junior
 */
export function experienceLevel(months: number | null | undefined): string | null {
  if (months === null || months === undefined) {
    return null;
  }

  if (months >= 60) {
    return 'Senior';
  }

  if (months >= 24) {
    return 'Mid-Level';
  }

  if (months >= 0) {
    return 'Entry Level / Junior';
  }

  return null;
}

/**
 * Extracts total experience in months from a result object.
 * Checks experience.total_months first; falls back to converting legacy experience_years; otherwise null.
 */
export function monthsFromResult(r?: {
  experience?: ExperienceAssessment;
  experience_years?: number | null;
} | null): number | null {
  if (!r) return null;

  if (r.experience?.total_months !== undefined && r.experience?.total_months !== null) {
    return r.experience.total_months;
  }

  if (typeof r.experience_years === 'number') {
    return Math.round(r.experience_years * 12);
  }

  return null;
}

/**
 * Degree level ranking: phd > master > bachelor > diploma > others > unknown.
 */
const DEGREE_RANK: Record<string, number> = {
  phd: 6,
  doctorate: 6,
  master: 5,
  masters: 5,
  postgraduate: 4,
  bachelor: 3,
  bachelors: 3,
  undergraduate: 3,
  diploma: 2,
  certificate: 1,
};

/**
 * Returns the highest education qualification from a list based on degree_level hierarchy,
 * preserving original order in case of ties.
 */
export function getHighestQualification(qualifications: EducationQualification[]): EducationQualification | null {
  if (!qualifications || qualifications.length === 0) return null;

  let best = qualifications[0];
  let bestRank = DEGREE_RANK[(best.degree_level || '').toLowerCase().trim()] || 0;

  for (let i = 1; i < qualifications.length; i++) {
    const q = qualifications[i];
    const rank = DEGREE_RANK[(q.degree_level || '').toLowerCase().trim()] || 0;
    if (rank > bestRank) {
      best = q;
      bestRank = rank;
    }
  }

  return best;
}
