"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Loader2,
  AlertCircle,
  RotateCcw,
  Mic,
  MicOff,
} from "lucide-react";

type CameraState = "idle" | "requesting" | "active" | "denied" | "error";

interface CameraViewProps {
  onStatusChange?: (active: boolean) => void;
}

export default function CameraView({ onStatusChange }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setCameraState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const startCamera = useCallback(async () => {
    setCameraState("requesting");
    setErrorMsg("");

    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraState("active");
      onStatusChange?.(true);
    } catch (err: unknown) {
      const error = err as Error;
      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setCameraState("denied");
        setErrorMsg("Camera access was denied. Please allow camera permissions.");
      } else if (error.name === "NotFoundError") {
        setCameraState("error");
        setErrorMsg("No camera found on this device.");
      } else {
        setCameraState("error");
        setErrorMsg("Unable to start camera. Please try again.");
      }
      onStatusChange?.(false);
    }
  }, [facingMode, onStatusChange]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
    onStatusChange?.(false);
  }, [onStatusChange]);

  const toggleMic = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setMicMuted((prev) => !prev);
  }, []);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Re-start camera when facingMode changes (and was already active)
  useEffect(() => {
    if (state === "active") {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden">
      {/* Video element — always mounted so ref is ready */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          state === "active" ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Overlay states */}
      {state !== "active" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          {state === "idle" && (
            <>
              <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center">
                <Camera className="w-8 h-8 text-sky-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg">Live Coaching</p>
                <p className="text-slate-400 text-sm mt-1">
                  Enable camera to begin your session
                </p>
              </div>
              <button
                onClick={startCamera}
                className="mt-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-medium rounded-full transition-colors duration-150"
              >
                Start Session
              </button>
            </>
          )}

          {state === "requesting" && (
            <>
              <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
              <p className="text-slate-300 text-sm">Requesting camera access…</p>
            </>
          )}

          {(state === "denied" || state === "error") && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                {state === "denied" ? (
                  <CameraOff className="w-8 h-8 text-red-400" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-400" />
                )}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Camera Unavailable</p>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">{errorMsg}</p>
              </div>
              <button
                onClick={startCamera}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-full transition-colors duration-150"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </>
          )}
        </div>
      )}

      {/* Active camera controls overlay */}
      {state === "active" && (
        <>
          {/* Live indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-semibold tracking-wide">
              LIVE
            </span>
          </div>

          {/* Top-right controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={flipCamera}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
              aria-label="Flip camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <button
              onClick={toggleMic}
              className={`w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
                micMuted
                  ? "bg-red-500/80 text-white"
                  : "bg-black/50 text-white hover:bg-black/70"
              }`}
              aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {micMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={stopCamera}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors"
              aria-label="End session"
            >
              <CameraOff className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
