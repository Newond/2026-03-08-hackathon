"use client";

import { useEffect, useCallback } from "react";
import { type PostureAnalysisResult } from "@/lib/prompts/realtime-posture";

interface ResultSheetProps {
  result: PostureAnalysisResult | null;
  trunkAngle: number | null;
  neckAngle: number | null;
  open: boolean;
  onClose: () => void;
}

const riskConfig = {
  高: "bg-red-500/20 text-red-400",
  中: "bg-amber-500/20 text-amber-400",
  低: "bg-emerald-500/20 text-emerald-400",
};

function speak(result: PostureAnalysisResult) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const text = `${result.summary} ${result.instructions.join("。")}。`;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = 0.92;
  utter.pitch = 1.0;

  const voices = speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang.startsWith("ja"));
  if (jaVoice) utter.voice = jaVoice;

  speechSynthesis.speak(utter);
}

export default function ResultSheet({
  result,
  trunkAngle,
  neckAngle,
  open,
  onClose,
}: ResultSheetProps) {
  // 表示後400msで自動読み上げ
  useEffect(() => {
    if (open && result) {
      const timer = setTimeout(() => speak(result), 400);
      return () => clearTimeout(timer);
    }
  }, [open, result]);

  const handleClose = useCallback(() => {
    speechSynthesis.cancel();
    onClose();
  }, [onClose]);

  const handleSpeak = useCallback(() => {
    if (result) speak(result);
  }, [result]);

  if (!result) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-350 ease-out"
      style={{
        transform: open ? "translateY(0)" : "translateY(100%)",
        maxHeight: "60dvh",
      }}
    >
      <div className="bg-slate-800 rounded-t-2xl p-5 pb-[calc(20px+env(safe-area-inset-bottom))] overflow-y-auto max-h-[60dvh]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold ${riskConfig[result.risk]}`}
          >
            リスク: {result.risk}
          </span>
          <span className="text-xs text-slate-400">
            体幹 {trunkAngle ?? "--"}° / 頸部 {neckAngle ?? "--"}°
          </span>
        </div>

        {/* サマリー */}
        <p className="text-[15px] text-slate-200 leading-relaxed mb-3">
          {result.summary}
        </p>

        {/* 指示リスト */}
        <ul className="flex flex-col gap-2 mb-4">
          {result.instructions.map((inst, i) => (
            <li
              key={i}
              className="px-3 py-2.5 bg-white/5 rounded-lg text-sm text-slate-300 leading-relaxed"
            >
              <span className="text-emerald-400 mr-1">▸</span>
              {inst}
            </li>
          ))}
        </ul>

        {/* アクション */}
        <div className="flex gap-2">
          <button
            onClick={handleSpeak}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400"
          >
            🔊 読み上げ
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/10 text-slate-300"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
