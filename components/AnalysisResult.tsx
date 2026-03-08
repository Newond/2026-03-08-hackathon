"use client";

import { useState, useCallback } from "react";
import { Loader2, AlertCircle, Sparkles, ListChecks } from "lucide-react";
import { type ExtractedFrame, dataUrlToBase64 } from "@/lib/extractFrames";
import { Card, CardContent } from "./ui/Card";

interface AnalysisResultProps {
  frames: ExtractedFrame[];
  onAnalysisDone: (text: string) => void;
}

interface CategoryScore {
  name: string;
  score: number;
  importance: "高" | "中" | "低";
}

interface ParsedAnalysis {
  totalScore: number | null;
  categories: CategoryScore[];
  summary: string[];       // 要点まとめ
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

    // セクション検出
    if (trimmed.startsWith("## ")) {
      section = trimmed.replace("## ", "");
      continue;
    }

    // 総合スコア
    if (section === "総合スコア") {
      const m = trimmed.match(/SCORE:(\d+)/);
      if (m) result.totalScore = parseInt(m[1]);
      continue;
    }

    // カテゴリ別評価
    if (section === "カテゴリ別評価") {
      const m = trimmed.match(/CATEGORY:(.+):(\d+):(高|中|低)/);
      if (m) {
        result.categories.push({
          name: m[1],
          score: parseInt(m[2]),
          importance: m[3] as "高" | "中" | "低",
        });
      }
      continue;
    }

    // 要点まとめ
    if (section === "要点まとめ") {
      const text = trimmed.replace(/^[-・・\d.]\s*/, "").trim();
      if (text) result.summary.push(text);
      continue;
    }

    // 問題点
    if (section === "問題点") {
      const text = trimmed.replace(/^[-・・\d.]\s*/, "").trim();
      if (text) result.problems.push(text);
      continue;
    }

    // 改善方法
    if (section === "改善方法") {
      const text = trimmed.replace(/^[-・・\d.]\s*/, "").trim();
      if (text) result.solutions.push(text);
      continue;
    }

    // 総評
    if (section === "総評") {
      result.review += (result.review ? " " : "") + trimmed;
      continue;
    }
  }

  return result;
}

const importanceConfig = {
  高: { color: "bg-red-100 text-red-700", bar: "bg-red-400" },
  中: { color: "bg-amber-100 text-amber-700", bar: "bg-amber-400" },
  低: { color: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-400" },
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
        body: JSON.stringify({ frames: base64Frames }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setRawText(fullText);
      }

      const p = parseAnalysis(fullText);
      setParsed(p);
      setStatus("done");
      onAnalysisDone(fullText);
    } catch (e) {
      console.error(e);
      setErrorMsg("分析に失敗しました。もう一度お試しください。");
      setStatus("error");
    }
  }, [frames, onAnalysisDone]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          3
        </span>
        <h2 className="font-semibold text-slate-800">AI分析</h2>
      </div>

      {/* 分析開始ボタン */}
      {status === "idle" && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{frames.length}枚</span>のフレームをAIが分析し、
            スコア・重要度・改善ポイントを出力します。
          </p>
          <button
            onClick={handleAnalyze}
            className="flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AIで分析する
          </button>
        </div>
      )}

      {/* ローディング（ストリーミング前） */}
      {status === "loading" && !rawText && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm text-slate-500">AIが動作を分析中…</p>
        </div>
      )}

      {/* ストリーミング中：生テキスト表示 */}
      {status === "loading" && rawText && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> 分析中…
            </p>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-sans">
              {rawText}
              <span className="inline-block w-1.5 h-3.5 bg-sky-500 animate-pulse rounded-sm ml-0.5 align-text-bottom" />
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 分析完了：構造化表示 */}
      {status === "done" && parsed && (
        <div className="flex flex-col gap-4">

          {/* ① 総合スコア */}
          {parsed.totalScore !== null && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">総合スコア</p>
                <div className="flex items-center gap-4">
                  <ScoreRing score={parsed.totalScore} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {parsed.totalScore >= 80
                        ? "良好な介助動作です"
                        : parsed.totalScore >= 60
                        ? "改善の余地があります"
                        : "要改善：優先的に修正を"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {parsed.categories.length}項目を評価
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ② カテゴリ別評価 */}
          {parsed.categories.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">カテゴリ別評価</p>
                <div className="flex flex-col gap-3">
                  {parsed.categories.map((cat) => {
                    const cfg = importanceConfig[cat.importance];
                    return (
                      <div key={cat.name} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                              重要度：{cat.importance}
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

          {/* ③ 要点まとめ */}
          {parsed.summary.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <ListChecks className="w-3.5 h-3.5" /> 要点まとめ
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

          {/* ④ 問題点 */}
          {parsed.problems.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3">問題点</p>
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

          {/* ⑤ 改善方法 */}
          {parsed.solutions.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">改善方法</p>
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

          {/* ⑥ 総評 */}
          {parsed.review && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">総評</p>
                <p className="text-sm text-slate-700 leading-relaxed">{parsed.review}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* エラー */}
      {status === "error" && (
        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-700">{errorMsg}</p>
            <button onClick={handleAnalyze} className="text-xs text-red-600 font-medium underline self-start">
              再試行
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
