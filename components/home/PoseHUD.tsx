"use client";

import { type PoseAngles } from "@/lib/pose/angle-calculator";
import {
  WARN_ANGLE,
  DANGER_ANGLE,
  ARC_LEN,
  CONSECUTIVE_FRAMES_THRESHOLD,
} from "@/lib/pose/constants";

interface PoseHUDProps {
  angles: PoseAngles;
  consecutiveFrames: number;
  isAnalyzing: boolean;
  onManualAnalyze: () => void;
}

function getColor(trunkAngle: number | null): string {
  if (trunkAngle === null) return "#00c896";
  if (trunkAngle >= DANGER_ANGLE) return "#ef4444";
  if (trunkAngle >= WARN_ANGLE) return "#f59e0b";
  return "#00c896";
}

function getStatusText(trunkAngle: number | null): string {
  if (trunkAngle === null) return "検出不可";
  if (trunkAngle >= DANGER_ANGLE) return "危険：前傾しすぎです";
  if (trunkAngle >= WARN_ANGLE) return "注意：前傾気味です";
  return "良好な姿勢";
}

export default function PoseHUD({
  angles,
  consecutiveFrames,
  isAnalyzing,
  onManualAnalyze,
}: PoseHUDProps) {
  const color = getColor(angles.trunk);
  const statusText = getStatusText(angles.trunk);

  // アークゲージの計算
  const arcRatio =
    angles.trunk !== null ? Math.min(angles.trunk / 90, 1.0) : 0;
  const dashOffset = ARC_LEN * (1 - arcRatio);

  // トリガープログレス
  const triggerProgress =
    consecutiveFrames > 0 && angles.trunk !== null && angles.trunk >= WARN_ANGLE
      ? Math.min((consecutiveFrames / CONSECUTIVE_FRAMES_THRESHOLD) * 100, 100)
      : 0;
  const showTriggerBar = triggerProgress > 0;

  return (
    <>
      {/* HUD Top: アークゲージ + 頸部角バッジ */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-10 pointer-events-none">
        {/* アークゲージ */}
        <div className="w-20 h-20 relative pointer-events-auto">
          <svg viewBox="0 0 80 80" className="w-full h-full">
            <path
              d="M10,60 A35,35 0 1,1 70,60"
              fill="none"
              stroke="#334155"
              strokeWidth={6}
            />
            <path
              d="M10,60 A35,35 0 1,1 70,60"
              fill="none"
              stroke={color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={ARC_LEN}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.15s, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-xl font-bold leading-none"
              style={{ color }}
            >
              {angles.trunk !== null ? `${angles.trunk}°` : "--"}
            </span>
            <span className="text-[10px] text-slate-400">体幹角</span>
          </div>
        </div>

        {/* 頸部角バッジ */}
        <div className="bg-black/60 backdrop-blur-sm px-3.5 py-2 rounded-xl text-center pointer-events-auto">
          <div className="text-[10px] text-slate-400">頸部角</div>
          <div className="text-lg font-bold text-white">
            {angles.neck !== null ? `${angles.neck}°` : "--"}
          </div>
        </div>
      </div>

      {/* ステータスピル */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div
          className="bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap"
          style={{ color }}
        >
          {statusText}
        </div>
      </div>

      {/* トリガープログレスバー */}
      <div
        className="absolute bottom-20 left-4 right-4 h-1 bg-white/10 rounded-full z-10 overflow-hidden"
        style={{
          opacity: showTriggerBar ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        <div
          className="h-full bg-red-500 rounded-full"
          style={{
            width: `${triggerProgress}%`,
            transition: "width 0.1s",
          }}
        />
      </div>

      {/* HUD Bottom: 分析ボタン */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center z-10">
        <button
          onClick={onManualAnalyze}
          disabled={isAnalyzing}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5 backdrop-blur-sm border transition-colors ${
            isAnalyzing
              ? "bg-red-500/30 border-red-500 text-red-300 opacity-60"
              : "bg-emerald-500/30 border-emerald-500 text-emerald-300 hover:bg-emerald-500/40"
          }`}
        >
          {isAnalyzing ? "分析中…" : "📊 分析"}
        </button>
      </div>
    </>
  );
}
