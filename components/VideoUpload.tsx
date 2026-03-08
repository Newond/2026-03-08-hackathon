"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Play, Pause, RotateCcw, CheckCircle2, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadProps {
  onVideoReady: (file: File, url: string) => void;
}

export default function VideoUpload({ onVideoReady }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) {
        alert("動画ファイル（mp4, movなど）を選択してください");
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setFileName(file.name);
      setIsPlaying(false);
      setCurrentTime(0);
      onVideoReady(file, url);
    },
    [onVideoReady]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const reset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setFileName("");
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {!videoUrl ? (
        /* ── ドロップゾーン ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors py-12 px-6",
            isDragging
              ? "border-sky-400 bg-sky-50"
              : "border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/50"
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center">
            <FileVideo className="w-7 h-7 text-sky-500" strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-700">動画をアップロード</p>
            <p className="text-sm text-slate-400 mt-1">
              タップまたはドラッグ＆ドロップ
            </p>
            <p className="text-xs text-slate-400 mt-0.5">mp4, mov, avi 対応</p>
          </div>
          <div className="flex items-center gap-2 mt-1 px-5 py-2 bg-sky-500 rounded-full">
            <Upload className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">ファイルを選択</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      ) : (
        /* ── 動画プレイヤー ── */
        <div className="flex flex-col gap-3">
          {/* 動画本体 */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)}
              playsInline
            />
            {/* 中央再生ボタン（一時停止時のみ） */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-7 h-7 text-white ml-1" />
                </div>
              </button>
            )}
          </div>

          {/* コントロールバー */}
          <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col gap-2">
            {/* ファイル名 */}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-slate-600 truncate font-medium">{fileName}</span>
            </div>

            {/* プログレスバー */}
            <div
              className="w-full h-1.5 bg-slate-100 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                if (videoRef.current) {
                  videoRef.current.currentTime = ratio * duration;
                }
              }}
            >
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 再生ボタン + 時間 */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-sky-500 text-white flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
              <span className="text-xs text-slate-500 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button
                onClick={reset}
                className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                別の動画
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
