import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { screeningApi } from '../services/api/screeningApi';
import { historyApi } from '../services/api/historyApi';
import { CandidateScreeningResult, ApiError } from '../types';
import { CandidateTable } from '../components/screening/CandidateTable';
import { CandidateCard } from '../components/screening/CandidateCard';
import { CandidateCompareModal } from '../components/screening/CandidateCompareModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { verdictForScore } from '../utils/verdict';
import {
  UploadCloud,
  X,
  Users,
  ArrowRight,
  Database,
  LayoutGrid,
  List,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export const BulkScreeningView: React.FC = () => {
  const { navigateToCandidateDetail } = useApp();

  const [files, setFiles] = useState<File[]>([]);
  const [usePreIndexedCorpus, setUsePreIndexedCorpus] = useState<boolean>(true);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [candidates, setCandidates] = useState<CandidateScreeningResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [candidatesToCompare, setCandidatesToCompare] = useState<CandidateScreeningResult[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.name.toLowerCase().endsWith('.pdf')
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartScreening = async () => {
    if (!jobDescription.trim()) {
      setError({ message: 'Please provide a valid job description before continuing.' });
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError({ message: 'The job description is too short. Please provide a more complete job description.' });
      return;
    }

    if (!usePreIndexedCorpus && files.length === 0) {
      setError({ message: 'Please upload at least one PDF resume to screen or select the indexed candidate pool.' });
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let results: CandidateScreeningResult[];

      if (usePreIndexedCorpus) {
        // Hit backend POST /screen endpoint
        results = await screeningApi.screen(jobDescription, 10);
      } else {
        // Hit backend POST /screen/batch with uploaded files
        results = await screeningApi.screenFiles(files, jobDescription);
      }

      setCandidates(results);

      // Save summary record in history if results found
      if (results.length > 0) {
        const avgScore = Math.round(results.reduce((acc, c) => acc + c.score, 0) / results.length);
        const topCandidate = results[0];

        await historyApi.saveHistoryItem({
          id: `screening-${Date.now()}`,
          candidate_name: `${results.length} Candidates Screened`,
          file_name: `Screening Batch (${results.length} candidates)`,
          job_title: 'Bulk Role Evaluation',
          score: avgScore,
          verdict: verdictForScore(avgScore),
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'bulk',
          result: topCandidate.match_result || {
            final_score: topCandidate.score,
            verdict: topCandidate.verdict,
            candidate_name: topCandidate.candidate_name,
            file_name: topCandidate.file_name,
            job_title: 'Screening Evaluation',
            summary: `Candidate ranked #${1} in screening session with a score of ${topCandidate.score}%.`,
            breakdown: {
              skill_overlap: Math.round(topCandidate.score * 0.4),
              semantic_similarity: Math.round(topCandidate.score * 0.3),
              experience_match: Math.round(topCandidate.score * 0.2),
              education_match: Math.round(topCandidate.score * 0.1),
            },
            insights: [`Candidate achieved rank #1 in the screening batch.`],
            skill_gap: {
              resume_skills: topCandidate.matched_skills,
              jd_skills: [...topCandidate.matched_skills, ...topCandidate.missing_skills],
              matched_skills: topCandidate.matched_skills,
              missing_skills: topCandidate.missing_skills.map((s) => ({ skill: s, importance: 0.8 })),
              uncertain_skills: [],
              overlap_ratio: topCandidate.score / 100,
              gap_count: topCandidate.missing_skills.length,
            },
            evidence: [],
            recommendations: [],
            created_at: new Date().toISOString(),
          },
        });
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError({
        message: apiErr.message || 'Candidate screening is temporarily unavailable. Please try again later.',
        status: apiErr.status,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCandidate = (candidate: CandidateScreeningResult) => {
    navigateToCandidateDetail(candidate);
  };

  const handleOpenCompare = (selected: CandidateScreeningResult[]) => {
    setCandidatesToCompare(selected);
    setCompareModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Bulk Candidate Screening
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rank multiple candidates against a target job description using semantic search and skill verification.
          </p>
        </div>

        {candidates.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'table' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-400'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'cards' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-400'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCandidates([]);
                setFiles([]);
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              New Screening
            </Button>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <ErrorAlert
          title="Screening Request Failed"
          message={error.message}
          onDismiss={() => setError(null)}
          onRetry={handleStartScreening}
        />
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <Card className="p-8 border-emerald-200 bg-emerald-50/20 text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">
              Screening & Ranking Candidates...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Evaluating candidate resumes against job description criteria. Please wait while results are processed.
            </p>
          </div>
        </Card>
      )}

      {/* Top Input Form (Upload + JD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Resume Source Section (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Candidate Sources</span>
              </div>
            }
            subtitle="Choose between existing candidate pool or upload a new batch"
          >
            <div className="space-y-4">
              {/* Source Mode Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setUsePreIndexedCorpus(true)}
                  className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    usePreIndexedCorpus
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Candidate Pool</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUsePreIndexedCorpus(false)}
                  className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    !usePreIndexedCorpus
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Upload Files</span>
                </button>
              </div>

              {usePreIndexedCorpus ? (
                <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-900">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Candidate Repository Active</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Evaluates all candidate profiles currently stored in the candidate repository against the job requirements.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 transition-colors"
                  >
                    <UploadCloud className="w-6 h-6 text-indigo-600 mb-2" />
                    <span className="text-xs font-semibold text-slate-800">
                      Upload multiple PDF resumes
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Drag & drop or click to browse
                    </span>
                  </div>

                  {files.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <span className="truncate max-w-[200px] text-slate-700 font-mono">
                            {f.name}
                          </span>
                          <button
                            onClick={() => handleRemoveFile(i)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Job Description Input (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Target Job Description"
            subtitle="Paste target job requirements for ranking"
          >
            <div className="space-y-2">
              <textarea
                rows={7}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste role requirements, responsibilities, and must-have skill stack..."
                className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors resize-none leading-relaxed font-sans"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{jobDescription.length} characters</span>
                <Button
                  size="md"
                  variant="primary"
                  onClick={handleStartScreening}
                  isLoading={isLoading}
                  disabled={isLoading || !jobDescription.trim()}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Screen & Rank Candidates
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {candidates.length > 0 ? (
          viewMode === 'table' ? (
            <CandidateTable
              candidates={candidates}
              onSelectCandidate={handleOpenCandidate}
              onCompareCandidates={handleOpenCompare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((cand) => (
                <CandidateCard
                  key={cand.resume_id}
                  candidate={cand}
                  onSelect={handleOpenCandidate}
                />
              ))}
            </div>
          )
        ) : (
          !isLoading && (
            <EmptyState
              icon={<Users className="w-8 h-8 text-slate-400" />}
              title="No Candidates Screened Yet"
              description="Provide a job description above and start screening to retrieve ranked candidates."
            />
          )
        )}
      </div>

      {/* Side-by-Side Comparison Modal */}
      <CandidateCompareModal
        candidates={candidatesToCompare}
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        onSelectCandidate={(cand) => {
          setCompareModalOpen(false);
          handleOpenCandidate(cand);
        }}
      />
    </div>
  );
};
