import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { analysisApi } from '../services/api/analysisApi';
import { historyApi } from '../services/api/historyApi';
import { MatchResult, ApiError } from '../types';
import { AnalysisResultView } from '../components/analysis/AnalysisResultView';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ElapsedTime } from '../components/common/ElapsedTime';
import {
  UploadCloud,
  X,
  Clipboard,
  Trash2,
  ArrowRight,
  FileCheck,
  Loader2,
} from 'lucide-react';

export const AnalyzeView: React.FC = () => {
  const { selectedMatchResult, setSelectedMatchResult } = useApp();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [activeResult, setActiveResult] = useState<MatchResult | null>(selectedMatchResult);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError({
        message: 'This file format is not supported. Please upload a PDF.',
      });
      return;
    }
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError({
        message: `The file exceeds the ${MAX_SIZE_MB}MB limit. Please upload a smaller PDF.`,
      });
      return;
    }
    setResumeFile(file);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJobDescription(text);
    } catch {
      // Clipboard access denied by browser
    }
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError({ message: 'Please upload a resume PDF to analyze.' });
      return;
    }
    if (!jobDescription.trim()) {
      setError({ message: 'Please provide a valid job description before continuing.' });
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError({
        message: 'The job description is too short. Please provide a more complete job description.',
      });
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Real API call to POST /analyze
      const result = await analysisApi.analyze({
        file: resumeFile,
        job_description: jobDescription,
      });

      setActiveResult(result);
      setSelectedMatchResult(result);

      // Save to history
      await historyApi.saveHistoryItem({
        id: `analysis-${Date.now()}`,
        candidate_name: result.candidate_name || resumeFile.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
        file_name: result.file_name || resumeFile.name,
        job_title: result.job_title || 'Position Evaluated',
        score: result.final_score,
        verdict: result.verdict,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'single',
        result: result,
        job_description_snippet: jobDescription.trim().slice(0, 160),
      });
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError({
        message: apiErr.message || 'Something went wrong while processing your request. Please try again.',
        status: apiErr.status,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveResult(null);
    setSelectedMatchResult(null);
  };

  // If a result is active, show the full result view
  if (activeResult) {
    return (
      <AnalysisResultView
        result={activeResult}
        onBack={handleReset}
        onReAnalyze={() => {
          setActiveResult(null);
          handleAnalyze();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Resume Analysis
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload a candidate resume and provide the target job description to generate detailed alignment scoring.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          title="Analysis Could Not Be Completed"
          message={error.message}
          onDismiss={() => setError(null)}
          onRetry={handleAnalyze}
        />
      )}

      {/* Loading State Banner */}
      {/* Real stage-by-stage progress would require backend progress streaming */}
      {isLoading && (
        <Card className="p-8 border-emerald-200 bg-emerald-50/20 text-center">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <h3 className="text-sm font-semibold text-slate-900">
              Analyzing Resume Against Job Requirements...
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Extracting candidate information, matching skill requirements, and calculating overall compatibility. This may take a moment.
            </p>
            <ElapsedTime fileName={resumeFile?.name} />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Resume Upload */}
        <Card
          title="1. Candidate Resume"
          subtitle="Upload candidate CV in PDF format"
          className="flex flex-col justify-between"
        >
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!resumeFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-emerald-600 mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">
                  Click to browse or drag & drop PDF
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Supports standard text-based PDF resumes up to 10MB
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-4 pointer-events-none"
                >
                  Select File
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 text-sm block truncate max-w-xs">
                      {resumeFile.name}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {(resumeFile.size / 1024).toFixed(1)} KB • PDF Document
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Text-based PDF documents are processed securely</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Extracts professional experience, education, and skill profiles</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Job Description Input */}
        <Card
          title="2. Target Job Description"
          subtitle="Paste target role requirements and qualifications"
          action={
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="space-y-2">
            <textarea
              rows={9}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description, required skills, responsibilities, and qualifications..."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors resize-none leading-relaxed font-sans"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{jobDescription.length} characters</span>
              {jobDescription.length > 0 && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-600"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          variant="primary"
          onClick={handleAnalyze}
          isLoading={isLoading}
          disabled={isLoading || !resumeFile || !jobDescription.trim()}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Analyze Resume & Generate Report
        </Button>
      </div>
    </div>
  );
};
