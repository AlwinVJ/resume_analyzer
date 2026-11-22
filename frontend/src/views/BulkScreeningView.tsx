import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { screeningApi } from '../services/api/screeningApi';
import { analysisApi } from '../services/api/analysisApi';
import { historyApi } from '../services/api/historyApi';
import { CandidateScreeningResult, ApiError, MatchResult } from '../types';
import { CandidateTable } from '../components/screening/CandidateTable';
import { CandidateCard } from '../components/screening/CandidateCard';
import { CandidateCompareModal } from '../components/screening/CandidateCompareModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { CircularProgress } from '../components/common/CircularProgress';
import { ElapsedTime } from '../components/common/ElapsedTime';
import { verdictForScore } from '../utils/verdict';
import { monthsFromResult } from '../utils/experience';
import {
  UploadCloud,
  X,
  Users,
  ArrowRight,
  Database,
  List,
  LayoutGrid,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const BULK_ANALYZE_CONCURRENCY = 1;

interface FileBatchItem {
  file: File;
  status: 'waiting' | 'analyzing' | 'done' | 'failed';
  error?: string;
  result?: MatchResult;
}

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

  // Batch progress state
  const [batchItems, setBatchItems] = useState<FileBatchItem[]>([]);
  const [failedList, setFailedList] = useState<{ fileName: string; reason: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (isLoading) return;
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
    setFailedList([]);
    setIsLoading(true);

    if (usePreIndexedCorpus) {
      // Single request to candidate pool
      try {
        const results = await screeningApi.screen(jobDescription, 10);
        setCandidates(results);

        if (results.length > 0) {
          const avgScore = Math.round(results.reduce((acc, c) => acc + c.score, 0) / results.length);
          try {
            await historyApi.saveHistoryItem({
              id: `screening-${Date.now()}`,
              candidate_name: `${results.length} Candidates Screened`,
              file_name: `Screening Batch (${results.length} candidates)`,
              job_title: 'Bulk Role Evaluation',
              score: avgScore,
              verdict: verdictForScore(avgScore),
              date: new Date().toISOString().replace('T', ' ').substring(0, 16),
              type: 'bulk',
              candidates: results,
              job_description_snippet: jobDescription.trim().slice(0, 160),
              schema_version: 2,
            });
          } catch (saveErr) {
            console.warn('Failed to save screening history record:', saveErr);
          }
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
      return;
    }

    // "Upload Files" mode: sequential per-file POST /analyze
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Pre-flight file validation
    const initialBatch: FileBatchItem[] = files.map((file) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const sizeOk = file.size <= 10 * 1024 * 1024;

      if (!isPdf) {
        return {
          file,
          status: 'failed',
          error: 'This file format is not supported. Please upload a valid PDF document.',
        };
      }
      if (!sizeOk) {
        return {
          file,
          status: 'failed',
          error: 'The uploaded file exceeds the 10MB limit.',
        };
      }
      return {
        file,
        status: 'waiting',
      };
    });

    setBatchItems(initialBatch);

    const successfulCandidates: CandidateScreeningResult[] = [];
    const localFailedList: { fileName: string; reason: string }[] = [];

    // Collect pre-flight failures immediately
    initialBatch.forEach((item) => {
      if (item.status === 'failed') {
        localFailedList.push({ fileName: item.file.name, reason: item.error || 'Invalid file format' });
      }
    });

    try {
      for (let i = 0; i < initialBatch.length; i++) {
        if (controller.signal.aborted) break;

        const currentItem = initialBatch[i];
        if (currentItem.status === 'failed') continue;

        // Set status to analyzing
        setBatchItems((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: 'analyzing' } : item))
        );

        try {
          const result = await analysisApi.analyze({
            file: currentItem.file,
            job_description: jobDescription,
            signal: controller.signal,
          });

          if (controller.signal.aborted) break;

          // Mark done
          setBatchItems((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: 'done', result } : item))
          );

          const candidateName =
            result.candidate_name ||
            currentItem.file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const expMonths = monthsFromResult(result);

          successfulCandidates.push({
            resume_id: `upload-${i}-${currentItem.file.name}`,
            file_name: currentItem.file.name,
            candidate_name: candidateName,
            score: result.final_score,
            verdict: result.verdict,
            matched_skills: result.skill_gap?.matched_skills || [],
            missing_skills: result.skill_gap?.missing_skills?.map((s) => s.skill) || [],
            experience_years: expMonths !== null ? expMonths / 12 : null,
            experience_compatibility: result.experience?.compatibility ?? null,
            education_compatibility: result.education?.compatibility ?? null,
            match_result: result,
          });
        } catch (err: unknown) {
          if (controller.signal.aborted) break;

          const apiErr = err as ApiError;
          const reason = apiErr.message || 'Analysis could not be completed for this file.';
          localFailedList.push({ fileName: currentItem.file.name, reason });

          setBatchItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'failed', error: reason } : item
            )
          );
        }
      }

      if (controller.signal.aborted) {
        return;
      }

      setFailedList(localFailedList);

      // Rank successful candidates descending by score
      successfulCandidates.sort((a, b) => b.score - a.score);
      setCandidates(successfulCandidates);

      if (successfulCandidates.length === 0 && localFailedList.length > 0) {
        setError({
          message: `All ${localFailedList.length} uploaded resumes could not be analyzed. Please check the files and try again.`,
        });
      } else if (successfulCandidates.length > 0) {
        const avgScore = Math.round(
          successfulCandidates.reduce((acc, c) => acc + c.score, 0) / successfulCandidates.length
        );

        try {
          await historyApi.saveHistoryItem({
            id: `screening-${Date.now()}`,
            candidate_name: `${successfulCandidates.length} Candidates Screened`,
            file_name: `Screening Batch (${successfulCandidates.length} candidates)`,
            job_title: 'Bulk Role Evaluation',
            score: avgScore,
            verdict: verdictForScore(avgScore),
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'bulk',
            candidates: successfulCandidates,
            job_description_snippet: jobDescription.trim().slice(0, 160),
            schema_version: 2,
          });
        } catch (saveErr) {
          console.warn('Failed to save screening history record:', saveErr);
        }
      }
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

  // Compute live counts for circular progress
  const doneCount = batchItems.filter((i) => i.status === 'done').length;
  const failedCount = batchItems.filter((i) => i.status === 'failed').length;
  const processedCount = doneCount + failedCount;
  const waitingCount = batchItems.filter((i) => i.status === 'waiting').length;
  const inFlightItem = batchItems.find((i) => i.status === 'analyzing');

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
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCandidates([]);
                setFailedList([]);
                setBatchItems([]);
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

      {/* Loading State Indicators */}
      {isLoading && (
        usePreIndexedCorpus ? (
          /* Candidate Pool Indeterminate Loader */
          <Card className="p-8 border-emerald-200 bg-emerald-50/20 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <h3 className="text-sm font-semibold text-slate-900">
                Screening & Ranking Candidates...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                Evaluating candidate resumes against job description criteria. Please wait while results are processed.
              </p>
              <ElapsedTime prefix="Screening candidate repository" />
            </div>
          </Card>
        ) : (
          /* File Upload Circular Progress Ring */
          <Card className="p-6 border-emerald-200 bg-emerald-50/20">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
              <CircularProgress
                completed={processedCount}
                total={batchItems.length}
                failed={failedCount}
              />
              <div className="space-y-1.5 text-center sm:text-left text-xs" aria-live="polite">
                <div className="font-semibold text-slate-900 text-sm">
                  Screening Uploaded Resumes
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                  <span className="text-emerald-700 font-medium">✓ {doneCount} analyzed</span>
                  {failedCount > 0 && (
                    <span className="text-rose-600 font-medium">· ✗ {failedCount} failed</span>
                  )}
                  {waitingCount > 0 && (
                    <span className="text-slate-400">· {waitingCount} waiting</span>
                  )}
                </div>
                {inFlightItem && (
                  <div className="text-slate-600 truncate max-w-xs font-mono text-[11px] pt-1">
                    Analyzing: <span className="font-semibold text-slate-800">{inFlightItem.file.name}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
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
                  disabled={isLoading}
                  onClick={() => setUsePreIndexedCorpus(true)}
                  className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    usePreIndexedCorpus
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Candidate Pool</span>
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setUsePreIndexedCorpus(false)}
                  className={`py-2 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    !usePreIndexedCorpus
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                    disabled={isLoading}
                    className="hidden"
                  />
                  <div
                    onClick={() => {
                      if (!isLoading) fileInputRef.current?.click();
                    }}
                    className={`border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${
                      isLoading
                        ? 'opacity-60 cursor-not-allowed bg-slate-100/50'
                        : 'hover:border-slate-400 cursor-pointer bg-slate-50/50'
                    }`}
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
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleRemoveFile(i)}
                            className={`p-0.5 text-slate-400 hover:text-rose-600 ${
                              isLoading ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
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
                disabled={isLoading}
                placeholder="Paste role requirements, responsibilities, and must-have skill stack..."
                className={`w-full p-3 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors resize-none leading-relaxed font-sans ${
                  isLoading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
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

      {/* Could not analyze (N) list */}
      {!isLoading && failedList.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Could not analyze ({failedList.length})</span>
          </div>
          <div className="divide-y divide-rose-100 max-h-48 overflow-y-auto">
            {failedList.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-3 text-slate-700">
                <span className="font-mono text-slate-900 truncate max-w-xs font-medium">
                  {item.fileName}
                </span>
                <span className="text-rose-700 text-[11px] text-right">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
