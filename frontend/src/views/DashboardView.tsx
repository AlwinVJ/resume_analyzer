import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DashboardStats, AnalysisHistoryItem } from '../types';
import { historyApi } from '../services/api/historyApi';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import {
  FileSearch,
  Users,
  TrendingUp,
  FileText,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { setCurrentTab, openHistorySession } = useApp();
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyzed: 0,
    totalScreeningSessions: 0,
    averageScore: 0,
    topScore: 0,
    recentAnalyses: [],
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const history = await historyApi.getHistory();
        if (history && history.length > 0) {
          const totalScore = history.reduce((acc, h) => acc + h.score, 0);
          const topScore = Math.max(...history.map((h) => h.score));
          setStats({
            totalAnalyzed: history.length,
            totalScreeningSessions: history.filter((h) => h.type === 'bulk').length,
            averageScore: Math.round(totalScore / history.length),
            topScore: topScore,
            recentAnalyses: history.slice(0, 5),
          });
        }
      } catch {
        // Leave default zero state
      }
    };

    loadStats();
  }, []);

  const handleOpenAnalysis = (item: AnalysisHistoryItem) => {
    openHistorySession(item);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white p-6 sm:p-8 shadow-sm border border-slate-700/40">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Resume Matching & Candidate Ranking</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Candidate Screening & Matching
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Evaluate candidate profiles against job requirements with verified skill extraction, semantic text alignment, and explainable multi-factor scoring.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setCurrentTab('analyze')}
              leftIcon={<FileSearch className="w-4 h-4" />}
            >
              Analyze Resume
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentTab('screening')}
              leftIcon={<Users className="w-4 h-4" />}
              className="bg-slate-800/80 text-white border-slate-600 hover:bg-slate-700"
            >
              Bulk Screening
            </Button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Total Analyzed</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {stats.totalAnalyzed}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Resumes evaluated</span>
          </div>
        </Card>

        {/* Screening Sessions */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Screening Sessions</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {stats.totalScreeningSessions}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Bulk batch runs</span>
          </div>
        </Card>

        {/* Average Match Score */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Average Match Score</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {stats.averageScore > 0 ? `${stats.averageScore}%` : '—'}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-0.5">
              {stats.averageScore > 0 ? 'Across completed runs' : 'No data yet'}
            </span>
          </div>
        </Card>

        {/* Top Match Score */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">Top Match Score</span>
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {stats.topScore > 0 ? `${stats.topScore}%` : '—'}
            </span>
            <span className="text-[11px] text-amber-600 font-medium block mt-0.5">
              {stats.topScore > 0 ? 'Highest scoring profile' : 'No data yet'}
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-4">
              <FileSearch className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Resume Analysis</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Upload a candidate PDF resume and compare it against target job requirements. Receive detailed alignment scoring, verified skill overlap, and gap recommendations.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">1 Resume + 1 JD</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentTab('analyze')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Start Analysis
            </Button>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Bulk Candidate Screening</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Screen multiple candidates simultaneously against a job description. Rank candidates, filter by match classification, and compare candidate profiles side-by-side.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">Multiple Resumes + 1 JD</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentTab('screening')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Start Screening
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Analysis Activity */}
      <Card
        title="Recent Analysis Activity"
        subtitle="Latest evaluated candidates and screening sessions"
        action={
          stats.recentAnalyses.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentTab('history')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Full History
            </Button>
          ) : undefined
        }
      >
        {stats.recentAnalyses.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentAnalyses.map((item) => (
              <div
                key={item.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                onClick={() => handleOpenAnalysis(item)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                    {item.type === 'bulk' ? <Users className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm block">
                      {item.candidate_name}
                    </span>
                    <span className="text-xs text-slate-400 block truncate max-w-sm">
                      {item.job_title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <StatusBadge verdict={item.verdict} size="sm" />
                  <span className="font-bold font-mono text-slate-800 text-sm">
                    {item.score}%
                  </span>
                  <span className="text-slate-400 hidden sm:inline">
                    {item.date}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Analysis Activity Yet"
            description="Upload a resume for analysis or run bulk candidate screening to begin generating match intelligence."
            actionText="Analyze First Resume"
            onAction={() => setCurrentTab('analyze')}
          />
        )}
      </Card>
    </div>
  );
};
