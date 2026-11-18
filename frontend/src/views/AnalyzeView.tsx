import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { analysisApi } from '../services/api/analysisApi';
import { historyApi } from '../services/api/historyApi';
import { MOCK_ANALYSIS_RESULT, SAMPLE_JOB_DESCRIPTIONS } from '../services/mockData';
import { MatchResult, ApiError } from '../types';
import { AnalysisResultView } from '../components/analysis/AnalysisResultView';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ProgressStepper, StepItem } from '../components/common/ProgressStepper';
import {
  UploadCloud,
  X,
  Clipboard,
  Trash2,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

const ANALYSIS_STEPS: StepItem[] = [
  { id: '1', label: 'PDF Parsing', description: 'Extracting clean sections' },
  { id: '2', label: 'Skill Extraction', description: 'Finding technical skills' },
  { id: '3', label: 'Semantic Matching', description: 'Sentence-BERT embeddings' },
  { id: '4', label: 'Scoring Engine', description: 'Calculating final alignment' },
];

export const AnalyzeView: React.FC = () => {
  const { isDemoMode, selectedMatchResult, setSelectedMatchResult } = useApp();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
        message: 'Invalid file format: Only PDF documents are supported for resume analysis.',
        error_code: 'INVALID_FILE_TYPE',
      });
      return;
    }
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError({
        message: `File size exceeds the ${MAX_SIZE_MB}MB limit. Please upload a smaller PDF.`,
        error_code: 'FILE_TOO_LARGE',
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
      // Clipboard access denied
    }
  };

  const handleLoadSampleJD = () => {
    const sample = SAMPLE_JOB_DESCRIPTIONS[0];
    setJobDescription(sample.text);
  };

  const handleAnalyze = async () => {
    if (!resumeFile && !isDemoMode) {
      setError({ message: 'Please upload a resume PDF to analyze.' });
      return;
    }
    if (!jobDescription.trim()) {
      setError({ message: 'Please provide a job description to compare against.' });
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError({
        message: 'The job description is too short. Please provide at least 50 characters of job requirements.',
      });
      return;
    }

    setError(null);
    setIsLoading(true);
    setCurrentStep(0);

    // Progress step animation
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      let result: MatchResult;

      if (isDemoMode) {
        // Simulated network delay
        await new Promise((res) => setTimeout(res, 2200));
        result = {
          ...MOCK_ANALYSIS_RESULT,
          file_name: resumeFile ? resumeFile.name : MOCK_ANALYSIS_RESULT.file_name,
          candidate_name: resumeFile
            ? resumeFile.name.replace(/_Resume.*|\.pdf.*$/i, '').replace(/[-_]/g, ' ')
            : MOCK_ANALYSIS_RESULT.candidate_name,
        };
      } else {
        // Real API call to POST /analyze
        result = await analysisApi.analyze({
          file: resumeFile || undefined,
          job_description: jobDescription,
        });
      }

      clearInterval(stepInterval);
      setActiveResult(result);
      setSelectedMatchResult(result);

      // Save to history
      await historyApi.saveHistoryItem({
        id: `analysis-${Date.now()}`,
        candidate_name: result.candidate_name || resumeFile?.name || 'Candidate',
        file_name: result.file_name || resumeFile?.name || 'resume.pdf',
        job_title: result.job_title || 'Position Evaluated',
        score: result.final_score,
        verdict: result.verdict,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'single',
        result: result,
      });
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const apiErr = err as ApiError;
      setError({
        message: apiErr.message || 'Analysis failed. Could not process resume against the job description.',
        status: apiErr.status,
        error_code: apiErr.error_code,
        details:
          apiErr.status === 0
            ? 'Backend is not running at http://localhost:8000. Start your FastAPI server with `uvicorn api.main:app --reload` or toggle "UI Demo Mode" in the sidebar to review the interface.'
            : apiErr.status === 404
            ? 'Endpoint POST /analyze not yet implemented on backend. (See FRONTEND_BACKEND_INTEGRATION.md for contract).'
            : JSON.stringify(apiErr.details || {}),
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
          One-to-One Resume Analysis
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload a candidate resume PDF and provide the target job description to generate detailed alignment scoring.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          title="Analysis Could Not Complete"
          message={error.message}
          details={typeof error.details === 'string' ? error.details : undefined}
          onDismiss={() => setError(null)}
          onRetry={handleAnalyze}
        />
      )}

      {/* Analysis Stepper during loading */}
      {isLoading && (
        <Card className="p-6 border-emerald-200 bg-emerald-50/20">
          <h3 className="text-sm font-semibold text-slate-800 text-center mb-1">
            Analyzing Resume Against Job Requirements...
          </h3>
          <p className="text-xs text-slate-500 text-center mb-4">
            Executing NLP parsing, hybrid retrieval, and multi-factor scoring
          </p>
          <ProgressStepper steps={ANALYSIS_STEPS} currentStepIndex={currentStep} />
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
                <span>Text-based PDFs are automatically parsed by PyMuPDF</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Extracts experience, education, and technical skills</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Job Description Input */}
        <Card
          title="2. Target Job Description"
          subtitle="Paste or load target role requirements"
          action={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleLoadSampleJD}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200/60"
                title="Load sample Machine Learning Engineer JD"
              >
                Sample JD
              </button>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>
            </div>
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
          disabled={isLoading || (!resumeFile && !isDemoMode) || !jobDescription.trim()}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Analyze Resume & Generate Report
        </Button>
      </div>
    </div>
  );
};
