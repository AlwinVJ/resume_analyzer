import React, { useState, useMemo } from 'react';
import { CandidateScreeningResult, MatchVerdict } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../common/Button';
import {
  Search,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  GitCompare,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export interface CandidateTableProps {
  candidates: CandidateScreeningResult[];
  onSelectCandidate: (candidate: CandidateScreeningResult) => void;
  onCompareCandidates?: (candidates: CandidateScreeningResult[]) => void;
}

type SortField = 'score' | 'name' | 'experience';
type SortOrder = 'asc' | 'desc';

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  onSelectCandidate,
  onCompareCandidates,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<'all' | MatchVerdict>('all');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedCandidates = useMemo(() => {
    return candidates
      .filter((c) => {
        const matchesQuery =
          c.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.matched_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesVerdict = verdictFilter === 'all' || c.verdict === verdictFilter;

        return matchesQuery && matchesVerdict;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'score') {
          comp = a.score - b.score;
        } else if (sortField === 'name') {
          comp = a.candidate_name.localeCompare(b.candidate_name);
        } else if (sortField === 'experience') {
          comp = (a.experience_years || 0) - (b.experience_years || 0);
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [candidates, searchQuery, verdictFilter, sortField, sortOrder]);

  const selectedCandidates = useMemo(() => {
    return candidates.filter((c) => selectedIds.includes(c.resume_id));
  }, [candidates, selectedIds]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search, Filter and Bulk Compare Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, file, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors shadow-2xs"
            />
          </div>

          {/* Verdict Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value as 'all' | MatchVerdict)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              <option value="all">All Verdicts</option>
              <option value="Strong Match">Strong Match</option>
              <option value="Moderate Match">Moderate Match</option>
              <option value="Weak Match">Weak Match</option>
            </select>
          </div>
        </div>

        {/* Comparison CTA */}
        {onCompareCandidates && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {selectedIds.length > 0 ? `${selectedIds.length} of 3 selected` : 'Select 2-3 to compare'}
            </span>
            <Button
              size="sm"
              variant={selectedIds.length >= 2 ? 'primary' : 'outline'}
              disabled={selectedIds.length < 2}
              onClick={() => onCompareCandidates(selectedCandidates)}
              leftIcon={<GitCompare className="w-3.5 h-3.5" />}
            >
              Compare Side-by-Side
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 w-10">
                <span className="sr-only">Select</span>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Candidate & File</span>
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('score')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Match Score</span>
                  {sortField === 'score' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-300" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4">Classification</th>
              <th className="py-3 px-4">Skills Overlap</th>
              <th className="py-3 px-4">Experience</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredAndSortedCandidates.length > 0 ? (
              filteredAndSortedCandidates.map((cand) => {
                const isSelected = selectedIds.includes(cand.resume_id);

                return (
                  <tr
                    key={cand.resume_id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleSelect(cand.resume_id)}
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Select for comparison"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Candidate Name & File */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0 mt-0.5">
                          {cand.candidate_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 hover:text-emerald-600 cursor-pointer transition-colors"
                               onClick={() => onSelectCandidate(cand)}>
                            {cand.candidate_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                            {cand.file_name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Match Score */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cand.score >= 75
                                ? 'bg-emerald-500'
                                : cand.score >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${cand.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 font-mono">{cand.score}%</span>
                      </div>
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-4">
                      <StatusBadge verdict={cand.verdict} size="sm" />
                    </td>

                    {/* Skills Overlap */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200/60">
                          {cand.matched_skills.length} matched
                        </span>
                        {cand.missing_skills.length > 0 && (
                          <span className="text-slate-500 text-[11px]">
                            ({cand.missing_skills.length} missing)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Experience */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-medium text-slate-800">
                          {cand.experience_years ? `${cand.experience_years} yrs` : '—'}
                        </span>
                        <span className="text-slate-400 block text-[10px]">
                          {cand.experience_compatibility || 'Evaluated'}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectCandidate(cand)}
                        rightIcon={<ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        className="hover:bg-slate-200/60"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                  No candidates match the filter or search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {filteredAndSortedCandidates.length} of {candidates.length} candidates
        </span>
        <span className="text-slate-400">Ranked by candidate match score</span>
      </div>
    </div>
  );
};
