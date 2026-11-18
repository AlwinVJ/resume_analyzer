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
  experienceCompatibility = 'High',
  educationLevel = "Master's Degree in Computer Science",
  educationCompatibility = 'Satisfied',
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
        action={<StatusBadge verdict={experienceCompatibility} size="sm" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">Total Relevant Experience</span>
                <span className="text-sm font-semibold text-slate-900">
                  {experienceYears !== null && experienceYears !== undefined
                    ? `${experienceYears} Years Proven Experience`
                    : 'Experience calculated from date intervals'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="flex items-center justify-between text-slate-500 py-1 border-b border-slate-100">
              <span>Required by Job:</span>
              <span className="font-medium text-slate-700">3+ Years (Mid-Senior)</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 py-1 border-b border-slate-100">
              <span>Candidate Track Record:</span>
              <span className="font-medium text-emerald-700">Meets Seniority Threshold</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 py-1">
              <span>Seniority Alignment:</span>
              <span className="font-medium text-slate-700">Strong Senior Fit</span>
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
        action={<StatusBadge verdict={educationCompatibility} size="sm" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs text-slate-500 block">Highest Degree Identified</span>
                <span className="text-sm font-semibold text-slate-900">
                  {educationLevel || 'Degree extracted from Academic background'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="flex items-center justify-between text-slate-500 py-1 border-b border-slate-100">
              <span>Prerequisite:</span>
              <span className="font-medium text-slate-700">Bachelor's or Master's in STEM</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 py-1 border-b border-slate-100">
              <span>Major Field:</span>
              <span className="font-medium text-slate-700">Computer Science / Data Science</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 py-1">
              <span>Academic Match Status:</span>
              <span className="font-medium text-emerald-700">Full Requirement Verified</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
