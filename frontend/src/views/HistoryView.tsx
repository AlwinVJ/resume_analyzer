import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AnalysisHistoryItem, MatchVerdict } from '../types';
import { historyApi } from '../services/api/historyApi';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import {
  History,
  Search,
  Trash2,
  FileText,
  Users,
  ChevronRight,
  Calendar,
  Briefcase,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { setCurrentTab, openHistorySession } = useApp();
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'bulk'>('all');
  const [filterVerdict, setFilterVerdict] = useState<'all' | MatchVerdict>('all');

  const loadHistory = async () => {
    try {
      const items = await historyApi.getHistory();
      setHistoryItems(items || []);
    } catch {
      setHistoryItems([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpenItem = (item: AnalysisHistoryItem) => {
    openHistorySession(item);
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await historyApi.deleteHistoryItem(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your local analysis history?')) {
      await historyApi.clearHistory();
      setHistoryItems([]);
    }
  };

  const filteredHistory = historyItems.filter((item) => {
    const matchesSearch =
      item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.job_title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesVerdict = filterVerdict === 'all' || item.verdict === filterVerdict;

    return matchesSearch && matchesType && matchesVerdict;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Analysis History & Records
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse and inspect previous resume evaluations, screening sessions, and candidate score reports.
          </p>
        </div>

        {historyItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="text-slate-600 hover:text-rose-600"
          >
            Clear History
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, file, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Type filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'single' | 'bulk')}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="single">Single Analysis</option>
              <option value="bulk">Bulk Screening</option>
            </select>
          </div>

          {/* Verdict filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Verdict:</span>
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value as 'all' | MatchVerdict)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Verdicts</option>
              <option value="Strong Match">Strong Match</option>
              <option value="Moderate Match">Moderate Match</option>
              <option value="Weak Match">Weak Match</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenItem(item)}
              className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-card hover:border-slate-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  {item.type === 'bulk' ? (
                    <Users className="w-5 h-5 text-purple-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.candidate_name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">
                      {item.type === 'single' ? 'Single Analysis' : 'Bulk Screening'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {item.job_title}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {item.date}
                    </span>
                    <span className="font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[11px]">
                      {item.file_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <StatusBadge verdict={item.verdict} size="sm" />
                <div className="flex flex-col items-end">
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {item.score}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Score
                  </span>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<History className="w-8 h-8 text-slate-400" />}
          title="No History Records Found"
          description={
            searchQuery
              ? 'No analysis matches your active search term or filter.'
              : 'Analyses you run will be logged here for persistent tracking, auditing, and export.'
          }
          actionText={searchQuery ? 'Clear Search' : 'Analyze a Resume'}
          onAction={() => {
            if (searchQuery) {
              setSearchQuery('');
              setFilterType('all');
              setFilterVerdict('all');
            } else {
              setCurrentTab('analyze');
            }
          }}
        />
      )}
    </div>
  );
};
