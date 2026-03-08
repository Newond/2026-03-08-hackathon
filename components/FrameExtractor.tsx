"use client";

import { useState, useCallback } from "react";
import { ScanSearch, ChevronRight, Loader2, Clock } from "lucide-react";
import { extractFrames, type ExtractedFrame } from "@/lib/extractFrames";

interface FrameExtractorProps {
  videoUrl: string;
  onFramesReady: (frames: ExtractedFrame[]) => void;
}

const FRAME_COUNT = 8;

export default function FrameExtractor({ videoUrl, onFramesReady }: FrameExtractorProps) {
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [progress, setProgress] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExtract = useCallback(async () => {
    setIsExtracting(true);
    setProgress(0);
    setFrames([]);
    setDone(false);

    try {
      const result = await extractFrames(videoUrl, FRAME_COUNT, (current, total) => {
        setProgress(Math.round((current / total) * 100));
      });
      setFrames(result);
      setDone(true);
      onFramesReady(result);
    } catch (e) {
      console.error(e);
      alert("フレーム抽出に失敗しました。別の動画をお試しください。");
    } finally {
      setIsExtracting(false);
    }
  }, [videoUrl, onFramesReady]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          2
        </span>
        <h2 className="font-semibold text-slate-800">フレーム抽出</h2>
      </div>

      <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 border border-slate-100">
        <p className="text-sm text-slate-600">
          動画から <span className="font-semibold text-slate-800">{FRAME_COUNT}枚</span> のフレームを均等間隔で抽出します。
          抽出した画像をAIに送って介助動作を分析します。
        </p>

        {/* プログレスバー */}
        {isExtracting && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                抽出中…
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 抽出ボタン */}
        {!done && (
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {isExtracting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ScanSearch className="w-4 h-4" />
            )}
            {isExtracting ? "処理中…" : "フレームを抽出する"}
          </button>
        )}
      </div>

      {/* フレームプレビューグリッド */}
      {frames.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-700">
            抽出されたフレーム（{frames.length}枚）
          </p>
          <div className="grid grid-cols-4 gap-2">
            {frames.map((frame, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.base64}
                    alt={`frame ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1 left-1 text-[9px] font-bold text-white bg-black/60 px-1 rounded">
                    {i + 1}
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 flex items-center gap-0.5 justify-center">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(frame.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 次へボタン */}
      {done && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold">✓</span>
            {frames.length}枚のフレーム抽出が完了しました
          </div>
          <button
            onClick={() => onFramesReady(frames)}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-2xl transition-colors"
          >
            次へ：AI分析へ
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
