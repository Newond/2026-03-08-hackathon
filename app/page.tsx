"use client";

import { useState, useCallback, useRef } from "react";
import { type PoseAngles } from "@/lib/pose/angle-calculator";
import {
  WARN_ANGLE,
  DANGER_ANGLE,
  CONSECUTIVE_FRAMES_THRESHOLD,
  LLM_COOLDOWN,
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
  const [sheetOpen, setSheetOpen] = useState(false);

  // 連続フレーム数（ref で管理して再レンダリングを抑える）
  const consecutiveRef = useRef(0);
  const lastLLMTimeRef = useRef(0);
  const [consecutiveDisplay, setConsecutiveDisplay] = useState(0);

  // 角度更新 + 自動トリガー判定
  const handleAnglesUpdate = useCallback(
    (newAngles: PoseAngles) => {
      setAngles(newAngles);

      if (newAngles.trunk === null) {
        consecutiveRef.current = 0;
        setConsecutiveDisplay(0);
        return;
      }

      // 連続フレームカウント
      if (newAngles.trunk >= DANGER_ANGLE) {
        consecutiveRef.current++;
      } else if (newAngles.trunk < WARN_ANGLE) {
        consecutiveRef.current = Math.max(0, consecutiveRef.current - 1);
      }
      // WARN_ANGLE <= trunk < DANGER_ANGLE → 凍結

      setConsecutiveDisplay(consecutiveRef.current);

      // 自動トリガー
      if (
        consecutiveRef.current >= CONSECUTIVE_FRAMES_THRESHOLD &&
        Date.now() - lastLLMTimeRef.current >= LLM_COOLDOWN &&
        !isAnalyzing &&
        isKeySet
      ) {
        triggerAnalysis();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAnalyzing, isKeySet]
  );

  // 分析トリガー
  const triggerAnalysis = useCallback(() => {
    if (isAnalyzing || !isKeySet) return;
    setIsAnalyzing(true);
    lastLLMTimeRef.current = Date.now();
    consecutiveRef.current = 0;
    setConsecutiveDisplay(0);
    setCaptureRequested(true);
  }, [isAnalyzing, isKeySet]);

  // キャプチャ完了 → API呼び出し
  const handleCaptured = useCallback(
    async (base64: string) => {
      setCaptureRequested(false);

      try {
        const res = await fetch("/api/realtime-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frame: base64,
            trunkAngle: angles.trunk,
            neckAngle: angles.neck,
            apiKey,
          }),
        });

        if (!res.ok) throw new Error(await res.text());

        const text = await res.text();
        const parsed = parsePostureResponse(text);
        setResult(parsed);
        setSheetOpen(true);
      } catch (e) {
        console.error("分析エラー:", e);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [angles, apiKey]
  );

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem-4rem)] bg-slate-900 rounded-2xl overflow-hidden mx-auto max-w-lg">
      {/* APIキー未設定の警告 */}
      {!isKeySet && cameraActive && (
        <div className="absolute top-12 left-4 right-4 z-30 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-2 rounded-lg text-center">
          設定画面でAPIキーを入力すると分析機能が使えます
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

      {/* 結果ボトムシート */}
      <ResultSheet
        result={result}
        trunkAngle={angles.trunk}
        neckAngle={angles.neck}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
