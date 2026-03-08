"use client";

import { useState } from "react";
import { FileVideo, ScanSearch, AlignLeft } from "lucide-react";
import VideoUpload from "@/components/coaching/VideoUpload";
import FrameExtractor from "@/components/coaching/FrameExtractor";
import AnalysisResult from "@/components/coaching/AnalysisResult";
import { type ExtractedFrame } from "@/lib/extractFrames";

const STEPS = [
  { id: 1, icon: FileVideo,  label: "Upload" },
  { id: 2, icon: ScanSearch, label: "Extract" },
  { id: 3, icon: AlignLeft,  label: "Analyze" },
];

export default function CoachingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Caregiving Coaching</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload a video and get AI feedback on your technique
        </p>
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <div key={step.id} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    done
                      ? "bg-emerald-500 text-white"
                      : active
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <span
                  className={`text-[9px] font-medium text-center leading-tight hidden sm:block ${
                    active ? "text-sky-600" : done ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-3 rounded-full transition-colors ${
                    done ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              1
            </span>
            <h2 className="font-semibold text-slate-800">Upload Video</h2>
          </div>
          <VideoUpload onVideoReady={(_file, url) => {
            setVideoUrl(url);
            setCurrentStep(2);
          }} />
        </div>
      )}

      {currentStep === 2 && videoUrl && (
        <FrameExtractor
          videoUrl={videoUrl}
          onFramesReady={(f: ExtractedFrame[]) => {
            setFrames(f);
            setCurrentStep(3);
          }}
        />
      )}

      {currentStep === 3 && frames.length > 0 && (
        <AnalysisResult
          frames={frames}
          onAnalysisDone={() => {}}
        />
      )}
    </div>
  );
}
