"use client";

import { useState } from "react";

type Job = {
  id: string | number;
  title?: string;
  company?: string;
  location?: string;
  similarity?: number;
};

export default function ResumeMatcherPage() {
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Resume Matcher</h1>
      <p className="text-sm text-gray-600">
        Paste your resume or upload a PDF/text file. We&apos;ll find the top 3 matching job listings from the database and suggest targeted improvements.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Paste Resume Text</label>
          <textarea
            className="w-full min-h-40 border rounded-md p-3"
            placeholder="Paste your resume (or upload a file below)"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Or Upload File (PDF/TXT)</label>
          <input
            type="file"
            accept=".pdf,.txt,.text"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing..." : "Find Matches"}
        </button>
      </form>

      {error && (
        <div className="text-red-600 text-sm border border-red-200 p-3 rounded-md">
          {error}
        </div>
      )}

      {jobs && jobs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Top Matches</h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{job.title || "(Untitled)"}</div>
                    <div className="text-sm text-gray-600">{job.company}</div>
                    {job.location && (
                      <div className="text-sm text-gray-500">{job.location}</div>
                    )}
                  </div>
                  {typeof job.similarity === "number" && (
                    <div className="text-xs text-gray-500">sim {(job.similarity * 100).toFixed(1)}%</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Targeted Resume Improvements</h2>
          <pre className="whitespace-pre-wrap border rounded-md p-4 text-sm">
            {suggestions}
          </pre>
        </div>
      )}
    </div>
  );
}


