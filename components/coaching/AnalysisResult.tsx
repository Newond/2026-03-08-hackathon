"use client";

import { useState, useCallback } from "react";
import { Loader2, AlertCircle, Sparkles, ListChecks } from "lucide-react";
import { type ExtractedFrame, dataUrlToBase64 } from "@/lib/extractFrames";
import { Card, CardContent } from "@/components/ui/Card";
import { useApiKey } from "@/lib/api-key-context";

interface AnalysisResultProps {
  frames: ExtractedFrame[];
  onAnalysisDone: (text: string) => void;
}

type Importance = "High" | "Medium" | "Low";

interface CategoryScore {
  name: string;
  score: number;
  importance: Importance;
}

interface ParsedAnalysis {
  totalScore: number | null;
  categories: CategoryScore[];
  summary: string[];
  problems: string[];
  solutions: string[];
  review: string;
}

function parseAnalysis(raw: string): ParsedAnalysis {
  const result: ParsedAnalysis = {
    totalScore: null,
    categories: [],
    summary: [],
    problems: [],
    solutions: [],
    review: "",
  };

  const lines = raw.split("\n");
  let section = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("## ")) {
      section = trimmed.replace("## ", "");
      continue;
    }

    if (section === "Overall Score") {
      const m = trimmed.match(/SCORE:(\d+)/);
      if (m) result.totalScore = parseInt(m[1]);
      continue;
    }

    if (section === "Category Scores") {
      const m = trimmed.match(/CATEGORY:(.+):(\d+):(High|Medium|Low)/);
      if (m) {
        result.categories.push({
          name: m[1],
          score: parseInt(m[2]),
          importance: m[3] as Importance,
        });
      }
      continue;
    }

    if (section === "Key Takeaways") {
      const text = trimmed.replace(/^[-\d.]\s*/, "").trim();
      if (text) result.summary.push(text);
      continue;
    }

    if (section === "Issues") {
      const text = trimmed.replace(/^[-\d.]\s*/, "").trim();
      if (text) result.problems.push(text);
      continue;
    }

    if (section === "Improvements") {
      const text = trimmed.replace(/^[-\d.]\s*/, "").trim();
      if (text) result.solutions.push(text);
      continue;
    }

    if (section === "Summary") {
      result.review += (result.review ? " " : "") + trimmed;
      continue;
    }
  }

  return result;
}

const importanceConfig = {
  High: { color: "bg-red-100 text-red-700", bar: "bg-red-400" },
  Medium: { color: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  Low: { color: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
};

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  const ring =
    score >= 80 ? "stroke-emerald-400" : score >= 60 ? "stroke-amber-400" : "stroke-red-400";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          className={ring}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className={`text-2xl font-bold tabular-nums ${color}`}>{score}</span>
        <span className="text-[10px] text-slate-400 font-medium">/ 100</span>
      </div>
    </div>
  );
}

export default function AnalysisResult({ frames, onAnalysisDone }: AnalysisResultProps) {
  const { apiKey, isKeySet } = useApiKey();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = useCallback(async () => {
    setStatus("loading");
    setRawText("");
    setParsed(null);
    setErrorMsg("");

    try {
      const base64Frames = frames.map((f) => dataUrlToBase64(f.base64));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames: base64Frames, apiKey }),
      });

      if (!res.ok) throw new Error(await res.text());

      const fullText = await res.text();
      setRawText(fullText);

      const p = parseAnalysis(fullText);
      setParsed(p);
      setStatus("done");
      onAnalysisDone(fullText);
    } catch (e) {
      console.error(e);
      setErrorMsg("Analysis failed. Please try again.");
      setStatus("error");
    }
  }, [frames, onAnalysisDone, apiKey]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          3
        </span>
        <h2 className="font-semibold text-slate-800">AI Analysis</h2>
      </div>

      {status === "idle" && !isKeySet && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex flex-col gap-2">
          <p className="text-sm text-amber-800 font-medium">API Key Required</p>
          <p className="text-sm text-amber-700">
            Please set your Anthropic API key in the Settings tab before running analysis.
          </p>
        </div>
      )}

      {status === "idle" && isKeySet && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            AI will analyze <span className="font-semibold text-slate-800">{frames.length} frames</span> and
            output scores, importance levels, and improvement suggestions.
          </p>
          <button
            onClick={handleAnalyze}
            className="flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Analyze with AI
          </button>
        </div>
      )}

      {status === "loading" && !rawText && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm text-slate-500">AI is analyzing your technique...</p>
        </div>
      )}

      {status === "loading" && rawText && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
            </p>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
              {rawText}
              <span className="inline-block w-1.5 h-3.5 bg-sky-500 animate-pulse rounded-sm ml-0.5 align-text-bottom" />
            </pre>
          </CardContent>
        </Card>
      )}

      {status === "done" && parsed && (
        <div className="flex flex-col gap-4">
          {parsed.totalScore !== null && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Overall Score</p>
                <div className="flex items-center gap-4">
                  <ScoreRing score={parsed.totalScore} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {parsed.totalScore >= 80
                        ? "Good caregiving technique"
                        : parsed.totalScore >= 60
                        ? "Room for improvement"
                        : "Needs improvement: priority corrections required"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {parsed.categories.length} categories evaluated
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.categories.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Category Scores</p>
                <div className="flex flex-col gap-3">
                  {parsed.categories.map((cat) => {
                    const cfg = importanceConfig[cat.importance];
                    return (
                      <div key={cat.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                              {cat.importance}
                            </span>
                            <span className="text-xs font-bold text-slate-800 tabular-nums w-8 text-right">
                              {cat.score}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.summary.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" /> Key Takeaways
                </p>
                <div className="flex flex-col gap-2">
                  {parsed.summary.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.problems.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">Issues</p>
                <div className="flex flex-col gap-2">
                  {parsed.problems.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.solutions.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Improvements</p>
                <div className="flex flex-col gap-2">
                  {parsed.solutions.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.review && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed">{parsed.review}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-700">{errorMsg}</p>
            <button onClick={handleAnalyze} className="text-xs text-red-600 font-medium underline self-start">
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
