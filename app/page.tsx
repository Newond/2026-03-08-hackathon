"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { type PoseAngles } from "@/lib/pose/angle-calculator";
import {
  WARN_ANGLE,
  DANGER_ANGLE,
  CONSECUTIVE_FRAMES_THRESHOLD,
  AUTO_ANALYZE_INTERVAL,
} from "@/lib/pose/constants";
import {
  parsePostureResponse,
  type PostureAnalysisResult,
} from "@/lib/prompts/realtime-posture";
import { useApiKey } from "@/lib/api-key-context";
import PoseCamera from "@/components/home/PoseCamera";
import PoseHUD from "@/components/home/PoseHUD";
import ResultSheet from "@/components/home/ResultSheet";

export default function HomePage() {
  const { apiKey, isKeySet } = useApiKey();
  const [angles, setAngles] = useState<PoseAngles>({ trunk: null, neck: null });
  const [cameraActive, setCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [captureRequested, setCaptureRequested] = useState(false);
  const [result, setResult] = useState<PostureAnalysisResult | null>(null);

  // 連続フレーム数（ref で管理して再レンダリングを抑える）
  const consecutiveRef = useRef(0);
  const [consecutiveDisplay, setConsecutiveDisplay] = useState(0);

  // 最新の角度を ref で保持（タイマーコールバックから参照するため）
  const anglesRef = useRef<PoseAngles>({ trunk: null, neck: null });
  const isAnalyzingRef = useRef(false);

  // 角度更新
  const handleAnglesUpdate = useCallback(
    (newAngles: PoseAngles) => {
      setAngles(newAngles);
      anglesRef.current = newAngles;

      if (newAngles.trunk === null) {
        consecutiveRef.current = 0;
        setConsecutiveDisplay(0);
        return;
      }

      // 連続フレームカウント（HUD表示用）
      if (newAngles.trunk >= DANGER_ANGLE) {
        consecutiveRef.current++;
      } else if (newAngles.trunk < WARN_ANGLE) {
        consecutiveRef.current = Math.max(0, consecutiveRef.current - 1);
      }

      setConsecutiveDisplay(consecutiveRef.current);
    },
    []
  );

  // 分析トリガー
  const triggerAnalysis = useCallback(() => {
    if (isAnalyzingRef.current || !isKeySet) return;
    setIsAnalyzing(true);
    isAnalyzingRef.current = true;
    consecutiveRef.current = 0;
    setConsecutiveDisplay(0);
    setCaptureRequested(true);
  }, [isKeySet]);

  // キャプチャ完了 → API呼び出し
  const handleCaptured = useCallback(
    async (base64: string) => {
      setCaptureRequested(false);

      try {
        const currentAngles = anglesRef.current;
        const res = await fetch("/api/realtime-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frame: base64,
            trunkAngle: currentAngles.trunk,
            neckAngle: currentAngles.neck,
            apiKey,
          }),
        });

        if (!res.ok) throw new Error(await res.text());

        const text = await res.text();
        const parsed = parsePostureResponse(text);
        setResult(parsed);
      } catch (e) {
        console.error("Analysis error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    },
    [apiKey]
  );

  // 2秒ごとの自動分析タイマー
  useEffect(() => {
    if (!cameraActive || !isKeySet) return;

    const timer = setInterval(() => {
      if (!isAnalyzingRef.current) {
        triggerAnalysis();
      }
    }, AUTO_ANALYZE_INTERVAL);

    return () => clearInterval(timer);
  }, [cameraActive, isKeySet, triggerAnalysis]);

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem-4rem)] bg-slate-900 rounded-2xl overflow-hidden mx-auto max-w-lg">
      {/* APIキー未設定の警告 */}
      {!isKeySet && cameraActive && (
        <div className="absolute top-12 left-4 right-4 z-30 bg-amber-900/85 backdrop-blur-sm text-white text-sm px-4 py-3 rounded-xl text-center flex flex-col gap-1">
          <span className="font-semibold">Voice Assistant Unavailable</span>
          <span className="text-xs text-amber-200">
            Please register your API key in the Settings tab to enable AI-powered voice assistance.
          </span>
        </div>
      )}

      {/* カメラ + MediaPipe */}
      <PoseCamera
        onAnglesUpdate={handleAnglesUpdate}
        onStatusChange={setCameraActive}
        captureRequested={captureRequested}
        onCaptured={handleCaptured}
      />

      {/* HUD オーバーレイ */}
      {cameraActive && (
        <PoseHUD
          angles={angles}
          consecutiveFrames={consecutiveDisplay}
          isAnalyzing={isAnalyzing}
          onManualAnalyze={triggerAnalysis}
        />
      )}

      {/* 結果表示（常時表示 + 自動音声読み上げ） */}
      <ResultSheet
        result={result}
        trunkAngle={angles.trunk}
        neckAngle={angles.neck}
        open={result !== null}
        onClose={() => setResult(null)}
      />
    </div>
  );
}
