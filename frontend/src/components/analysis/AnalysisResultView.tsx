import React, { useState } from 'react';
import { MatchResult } from '../../types';
import { ScoreBreakdownCard } from './ScoreBreakdownCard';
import { SkillAnalysisCard } from './SkillAnalysisCard';
import { ExperienceEducationCard } from './ExperienceEducationCard';
import { EvidenceViewerCard } from './EvidenceViewerCard';
import { RecommendationsCard } from './RecommendationsCard';
import { Button } from '../common/Button';
import {
  FileText,
  Download,
  RotateCcw,
  ArrowLeft,
  Briefcase,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export interface AnalysisResultViewProps {
  result: MatchResult;
  onBack?: () => void;
  onReAnalyze?: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  onBack,
  onReAnalyze,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'skills' | 'experience' | 'evidence'>('all');

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${result.candidate_name || 'candidate'}_analysis.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Return to screening list or previous view"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {result.candidate_name || result.file_name || 'Candidate Analysis'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              {result.job_title && !result.job_title.toLowerCase().startsWith('screening eval') && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {result.job_title}
                </span>
              )}
              {result.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              )}
              {result.file_name && (
                <span className="font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {result.file_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {onReAnalyze && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReAnalyze}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Re-analyze
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Comprehensive Overview
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Skill Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('experience')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'experience'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Experience & Education</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'bg-slate-900 text-white font-semibold shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evidence & Recommendations</span>
        </button>
      </div>

      {/* Tab Panels */}
      {(activeTab === 'all' || activeTab === 'skills') && (
        <>
          {/* Main Score Breakdown Card */}
          <ScoreBreakdownCard
            finalScore={result.final_score}
            verdict={result.verdict}
            summary={result.summary}
            breakdown={result.breakdown}
            breakdownMax={result.breakdown_max}
            insights={result.insights}
          />

          {/* Skill Coverage Analysis */}
          <SkillAnalysisCard skillGap={result.skill_gap} />
        </>
      )}

      {(activeTab === 'all' || activeTab === 'experience') && (
        <ExperienceEducationCard
          experience={result.experience}
          education={result.education}
          experienceYears={result.experience_years}
          educationLevel={result.education_level}
        />
      )}

      {(activeTab === 'all' || activeTab === 'evidence') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EvidenceViewerCard evidence={result.evidence} />
          <RecommendationsCard recommendations={result.recommendations || []} />
        </div>
      )}
    </div>
  );
};
