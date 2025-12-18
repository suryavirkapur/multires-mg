"use client";

import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Job = {
  id: string | number;
  title?: string;
  company?: string;
  location?: string;
  similarity?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Icons (inline SVGs for simplicity)
// ─────────────────────────────────────────────────────────────────────────────

function UploadIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function SparklesIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function BriefcaseIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}

function MapPinIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function BuildingIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass-card p-6 space-y-4">
        <div className="shimmer h-6 w-40 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="glass-card p-6 space-y-4">
        <div className="shimmer h-6 w-56 rounded" />
        <div className="shimmer h-40 rounded-xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Card
// ─────────────────────────────────────────────────────────────────────────────

function JobCard({ job, index }: { job: Job; index: number }) {
  const similarity = typeof job.similarity === "number"
    ? Math.round(job.similarity * 100)
    : null;

  return (
    <div
      className="glass-card p-5 group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-accent transition-colors">
            {job.title || "(Untitled)"}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
            {job.company && (
              <span className="flex items-center gap-1.5">
                <BuildingIcon className="w-4 h-4 opacity-60" />
                {job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="w-4 h-4 opacity-60" />
                {job.location}
              </span>
            )}
          </div>
        </div>

        {similarity !== null && (
          <div className="flex-shrink-0">
            <div className="similarity-badge flex items-center gap-1.5">
              <span className="font-bold">{similarity}%</span>
              <span className="opacity-75 text-xs">match</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ResumeMatcherPage() {
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setJobs(null);
    setSuggestions(null);

    try {
      const form = new FormData();
      if (resumeText.trim()) form.append("resumeText", resumeText.trim());
      if (file) form.append("file", file);

      const res = await fetch("/api/resume-match", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setJobs(data.jobs as Job[]);
      setSuggestions(data.suggestions as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const hasInput = resumeText.trim() || file;

  return (
    <>
      {/* Background gradient orbs */}
      <div className="bg-gradient-orbs" aria-hidden="true" />

      <div className="min-h-screen px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl space-y-8">

          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-muted">
              <SparklesIcon className="w-4 h-4 text-accent" />
              AI-Powered Resume Analysis
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="gradient-text">Resume Matcher</span>
            </h1>

            <p className="text-muted max-w-xl mx-auto leading-relaxed">
              Upload your resume or paste the text below. We&apos;ll find the top matching
              job listings and provide targeted improvements to boost your chances.
            </p>
          </header>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Text input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Paste Your Resume
              </label>
              <textarea
                className="input-field w-full min-h-48 font-mono text-sm"
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            {/* File upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Or Upload a File
              </label>

              {!file ? (
                <div
                  className={`file-upload ${dragOver ? "drag-over" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.txt,.text"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-surface border border-border">
                      <UploadIcon className="w-6 h-6 text-muted" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        Drop your file here or <span className="text-accent">browse</span>
                      </p>
                      <p className="text-sm text-muted mt-1">
                        Supports PDF and TXT files
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="file-upload has-file flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/20">
                      <CheckIcon className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="p-2 rounded-lg hover:bg-surface transition-colors"
                  >
                    <XIcon className="w-5 h-5 text-muted hover:text-error" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`btn-primary w-full ${loading ? "pulse-glow" : ""}`}
              disabled={loading || !hasInput}
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing Resume...
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    Find Matching Jobs
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Error message */}
          {error && (
            <div className="glass-card border-error/30 bg-error/5 p-4 flex items-start gap-3">
              <div className="p-1 rounded-full bg-error/20 flex-shrink-0 mt-0.5">
                <XIcon className="w-4 h-4 text-error" />
              </div>
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Loading state */}
          {loading && <LoadingSkeleton />}

          {/* Results */}
          {!loading && jobs && jobs.length > 0 && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Top Matches */}
              <div className="glass-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-semibold">Top Matches</h2>
                </div>
                <div className="space-y-3">
                  {jobs.map((job, index) => (
                    <JobCard key={job.id} job={job} index={index} />
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {suggestions && (
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-accent-secondary" />
                    <h2 className="text-xl font-semibold">Targeted Improvements</h2>
                  </div>
                  <div className="markdown-content prose prose-invert max-w-none text-sm leading-relaxed">
                    <pre className="whitespace-pre-wrap bg-transparent p-0 border-0 font-sans text-muted">
                      {suggestions}
                    </pre>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
