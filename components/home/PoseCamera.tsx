"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { calcAngles, type PoseAngles } from "@/lib/pose/angle-calculator";
import { DETECT_INTERVAL } from "@/lib/pose/constants";

interface PoseCameraProps {
  /** 角度が更新されるたびに呼ばれる */
  onAnglesUpdate: (angles: PoseAngles) => void;
  /** カメラの起動状態が変わったとき */
  onStatusChange: (active: boolean) => void;
  /** フレームキャプチャのリクエスト（trueにすると1枚キャプチャしてコールバック） */
  captureRequested: boolean;
  /** キャプチャ完了コールバック */
  onCaptured: (base64: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PoseLandmarkerType = any;

export default function PoseCamera({
  onAnglesUpdate,
  onStatusChange,
  captureRequested,
  onCaptured,
}: PoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarkerType>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const drawingUtilsRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const lastDetectRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Loading MediaPipe model…");
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  // MediaPipe 初期化
  useEffect(() => {
    let cancelled = false;

    async function initMediaPipe() {
      try {
        setLoadingMsg("Preparing MediaPipe runtime…");
        const cdnUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vision: any = await (new Function("url", "return import(url)"))(cdnUrl);

        if (cancelled) return;

        setLoadingMsg("Loading Pose Landmarker model…");
        const poseLandmarker = await vision.PoseLandmarker.createFromOptions(
          await vision.FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
          ),
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
          }
        );

        if (cancelled) return;

        poseLandmarkerRef.current = poseLandmarker;

        // DrawingUtils は overlay canvas のコンテキストで後から初期化
        const DrawingUtils = vision.DrawingUtils;
        const PoseLandmarkerClass = vision.PoseLandmarker;

        // カメラ起動
        setLoadingMsg("Starting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        // Canvas サイズ設定
        const overlay = overlayRef.current!;
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        const captureCanvas = document.createElement("canvas");
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        captureCanvasRef.current = captureCanvas;

        const overlayCtx = overlay.getContext("2d")!;
        drawingUtilsRef.current = new DrawingUtils(overlayCtx);

        // 描画ループ開始
        const POSE_CONNECTIONS = PoseLandmarkerClass.POSE_CONNECTIONS;

        function renderLoop() {
          if (cancelled) return;
          const now = performance.now();
          overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

          if (now - lastDetectRef.current >= DETECT_INTERVAL && poseLandmarkerRef.current) {
            lastDetectRef.current = now;
            try {
              const result = poseLandmarkerRef.current.detectForVideo(video, now);
              if (result.landmarks && result.landmarks.length > 0) {
                const lm = result.landmarks[0];
                drawingUtilsRef.current.drawLandmarks(lm, {
                  radius: 3,
                  color: "#00c896",
                  fillColor: "#00c896",
                });
                drawingUtilsRef.current.drawConnectors(lm, POSE_CONNECTIONS, {
                  color: "#00c89688",
                  lineWidth: 2,
                });
                const angles = calcAngles(lm);
                onAnglesUpdate(angles);
              } else {
                onAnglesUpdate({ trunk: null, neck: null });
              }
            } catch {
              // 検出エラーは無視
            }
          }

          animFrameRef.current = requestAnimationFrame(renderLoop);
        }

        setLoading(false);
        setCameraActive(true);
        onStatusChange(true);
        renderLoop();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(`Initialization failed: ${msg}`);
        setLoading(false);
      }
    }

    initMediaPipe();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フレームキャプチャ処理
  useEffect(() => {
    if (captureRequested && captureCanvasRef.current && videoRef.current && cameraActive) {
      const ctx = captureCanvasRef.current.getContext("2d")!;
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = captureCanvasRef.current.toDataURL("image/jpeg", 0.75);
      const base64 = dataUrl.split(",")[1];
      onCaptured(base64);
    }
  }, [captureRequested, cameraActive, onCaptured]);

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 text-white p-6">
        <p className="text-red-400 text-sm text-center">{error}</p>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900">
          <div className="w-10 h-10 border-3 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">{loadingMsg}</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </>
  );
}
