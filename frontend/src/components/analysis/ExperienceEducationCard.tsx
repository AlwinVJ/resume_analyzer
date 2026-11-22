import React, { useState } from 'react';
import { Card } from '../common/Card';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { ExperienceAssessment, EducationAssessment } from '../../types';
import {
  formatDuration,
  experienceLevel,
  monthsFromResult,
  getHighestQualification,
} from '../../utils/experience';
import { Briefcase, GraduationCap, Calendar, Award, ChevronDown, ChevronUp } from 'lucide-react';

export interface ExperienceEducationCardProps {
  experience?: ExperienceAssessment;
  education?: EducationAssessment;
  experienceYears?: number | null;
  educationLevel?: string | null;
}

export const ExperienceEducationCard: React.FC<ExperienceEducationCardProps> = ({
  experience,
  education,
  experienceYears,
  educationLevel,
}) => {
  const [showAllQualifications, setShowAllQualifications] = useState(false);

  // Experience calculation
  const months = monthsFromResult({ experience, experience_years: experienceYears });
  const levelText = experienceLevel(months);

  // Education calculation
  const qualifications = education?.qualifications || [];
  const highestQualification = getHighestQualification(qualifications);
  const otherQualifications = qualifications.filter((q) => q !== highestQualification);

  const isLegacyFabricatedEducation =
    educationLevel === 'Requirements Satisfied' || educationLevel === 'Satisfied';
  const displayLegacyEducation =
    educationLevel && !isLegacyFabricatedEducation ? educationLevel : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Experience Evaluation Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Experience Analysis</span>
          </div>
        }
        action={
          experience?.compatibility ? (
            <CompatibilityBadge level={experience.compatibility} size="sm" />
          ) : undefined
        }
      >
        <div className="space-y-4">
          {/* Total Experience Row */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-slate-500 block">Total Experience</span>
                {months !== null ? (
                  <div>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDuration(months)}
                    </span>
                    {experience?.internship_months && experience.internship_months > 0 ? (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        + {experience.internship_months}{' '}
                        {experience.internship_months === 1 ? 'month' : 'months'} of internships (not included)
                      </span>
                    ) : null}
                    {experience?.roles_without_dates && experience.roles_without_dates > 0 ? (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {experience.roles_without_dates}{' '}
                        {experience.roles_without_dates === 1 ? 'role' : 'roles'} without dates were not counted
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">Not found in resume</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            {/* Experience Level */}
            <div className="flex items-center justify-between text-slate-500 py-1.5 border-b border-slate-100">
              <span>Experience Level:</span>
              <span className="font-medium text-slate-800">
                {levelText || <span className="text-slate-400 font-normal">Not determined</span>}
              </span>
            </div>

            {/* Experience Compatibility */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span>Experience Compatibility:</span>
                <div>
                  {experience?.compatibility ? (
                    <CompatibilityBadge level={experience.compatibility} size="sm" />
                  ) : experience?.required_min_years === null && experience?.compatibility === null ? (
                    <span className="text-slate-400 font-normal">No experience requirement in job description</span>
                  ) : (
                    <span className="text-slate-400 font-normal">Not evaluated</span>
                  )}
                </div>
              </div>

              {experience?.compatibility && (
                <div className="mt-2 text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {(experience.required_min_years != null || experience.relevant_months != null) && (
                    <div className="font-mono text-slate-700">
                      {experience.required_min_years != null
                        ? `Required: ${experience.required_min_years}+ years`
                        : 'No requirement specified'}
                      {' · '}
                      {experience.relevant_months != null
                        ? `Relevant: ${formatDuration(experience.relevant_months)}`
                        : 'Relevant: Not specified'}
                    </div>
                  )}
                  {experience.basis && (
                    <div className="text-slate-500 italic">{experience.basis}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Education Evaluation Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" />
            <span>Education Analysis</span>
          </div>
        }
        action={
          education?.compatibility ? (
            <CompatibilityBadge level={education.compatibility} size="sm" />
          ) : undefined
        }
      >
        <div className="space-y-4">
          {/* Identified Qualification Row */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-start gap-2.5">
              <Award className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-xs text-slate-500 block">Identified Qualification(s)</span>
                {highestQualification ? (
                  <div>
                    <span className="text-sm font-semibold text-slate-900 block">
                      {highestQualification.degree_raw}
                    </span>
                    {(highestQualification.institution || highestQualification.year) && (
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {[highestQualification.institution, highestQualification.year]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}

                    {otherQualifications.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setShowAllQualifications((prev) => !prev)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 hover:text-purple-900"
                        >
                          <span>
                            {showAllQualifications
                              ? 'Hide other qualifications'
                              : `+${otherQualifications.length} more`}
                          </span>
                          {showAllQualifications ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>

                        {showAllQualifications && (
                          <div className="mt-1.5 space-y-1.5 pl-2 border-l-2 border-purple-200">
                            {otherQualifications.map((q, idx) => (
                              <div key={idx} className="text-xs text-slate-700">
                                <span className="font-medium">{q.degree_raw}</span>
                                {(q.institution || q.year) && (
                                  <span className="text-[11px] text-slate-400 block">
                                    {[q.institution, q.year].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : displayLegacyEducation ? (
                  <span className="text-sm font-semibold text-slate-900 block">
                    {displayLegacyEducation}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">
                    No qualification found in resume
                  </span>
                )}
                <span className="text-[11px] text-slate-400 block mt-1.5">
                  As stated in the resume (not independently verified).
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
            {/* Job Requirement */}
            <div className="flex items-start justify-between text-slate-500 py-1.5 border-b border-slate-100 gap-4">
              <span className="shrink-0">Job Requirement:</span>
              <span className="font-medium text-slate-800 text-right">
                {education?.required && education.required.length > 0 ? (
                  education.required.join('; ')
                ) : (
                  <span className="text-slate-400 font-normal">
                    No education requirement in job description
                  </span>
                )}
              </span>
            </div>

            {/* Education Compatibility */}
            <div className="py-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span>Education Compatibility:</span>
                <div>
                  {education?.compatibility ? (
                    <CompatibilityBadge level={education.compatibility} size="sm" />
                  ) : education?.required && education.required.length === 0 ? (
                    <span className="text-slate-400 font-normal">
                      Not applicable (no requirement)
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal">Not evaluated</span>
                  )}
                </div>
              </div>

              {education?.basis && (
                <div className="mt-2 text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {education.basis}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
