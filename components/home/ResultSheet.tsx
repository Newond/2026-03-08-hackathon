"use client";

import { useEffect, useCallback } from "react";
import {
  type PostureAnalysisResult,
  PHASE_LABELS,
  TONE_CONFIG,
} from "@/lib/prompts/realtime-posture";

interface ResultSheetProps {
  result: PostureAnalysisResult | null;
  trunkAngle: number | null;
  neckAngle: number | null;
  open: boolean;
  onClose: () => void;
}

function speak(result: PostureAnalysisResult) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(result.instruction);
  utter.lang = "en-US";
  utter.rate = 0.92;
  utter.pitch = 1.0;

  const voices = speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) utter.voice = enVoice;

  speechSynthesis.speak(utter);
}

export default function ResultSheet({
  result,
  trunkAngle,
  neckAngle,
  open,
  onClose,
}: ResultSheetProps) {
  // Auto-speak 400ms after opening
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

  const toneStyle = TONE_CONFIG[result.tone];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-350 ease-out"
      style={{
        transform: open ? "translateY(0)" : "translateY(100%)",
        maxHeight: "60dvh",
      }}
    >
      <div className="bg-slate-800 rounded-t-2xl p-5 pb-[calc(20px+env(safe-area-inset-bottom))] overflow-y-auto max-h-[60dvh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold ${toneStyle.badge}`}
          >
            {PHASE_LABELS[result.phase]}
          </span>
          <span className="text-xs text-slate-400">
            Trunk {trunkAngle ?? "--"}° / Neck {neckAngle ?? "--"}°
          </span>
        </div>

        {/* Instruction */}
        <p className={`text-2xl font-bold leading-snug mb-5 ${toneStyle.text}`}>
          {result.instruction}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSpeak}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400"
          >
            Speak
          </button>
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/10 text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
