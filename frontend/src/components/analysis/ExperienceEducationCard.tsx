import React from 'react';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { Briefcase, GraduationCap, Award, Calendar } from 'lucide-react';

export interface ExperienceEducationCardProps {
  experienceYears?: number | null;
  experienceCompatibility?: string;
  educationLevel?: string | null;
  educationCompatibility?: string;
}

export const ExperienceEducationCard: React.FC<ExperienceEducationCardProps> = ({
  experienceYears,
  experienceCompatibility,
  educationLevel,
  educationCompatibility,
}) => {
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
        action={experienceCompatibility ? <StatusBadge verdict={experienceCompatibility} size="sm" /> : undefined}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">Total Experience</span>
                <span className="text-sm font-semibold text-slate-900">
                  {experienceYears !== null && experienceYears !== undefined
                    ? `${experienceYears} Years Documented`
                    : 'Duration not specified'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <div className="flex items-center justify-between text-slate-500 py-1.5 border-b border-slate-100">
              <span>Experience Level:</span>
              <span className="font-medium text-slate-800">
                {experienceYears !== null && experienceYears !== undefined
                  ? experienceYears >= 5 ? 'Senior (5+ years)' : experienceYears >= 2 ? 'Mid-Level (2–5 years)' : 'Junior / Entry-Level'
                  : 'Derived from timeline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 py-1.5">
              <span>Experience Compatibility:</span>
              <span className="font-medium text-slate-800">
                {experienceCompatibility || 'Evaluated against job requirements'}
              </span>
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
        action={educationCompatibility ? <StatusBadge verdict={educationCompatibility} size="sm" /> : undefined}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">Identified Degree / Credential</span>
                <span className="text-sm font-semibold text-slate-900">
                  {educationLevel || 'Degree extracted from Academic background'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <div className="flex items-center justify-between text-slate-500 py-1.5 border-b border-slate-100">
              <span>Academic Verification:</span>
              <span className="font-medium text-slate-800">
                {educationLevel ? 'Extracted from Resume' : 'Not identified'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 py-1.5">
              <span>Education Compatibility:</span>
              <span className="font-medium text-slate-800">
                {educationCompatibility || 'Evaluated against job requirements'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
