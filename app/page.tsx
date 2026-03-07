"use client";

import { useState } from "react";
import {
  Heart,
  Thermometer,
  Wind,
  Activity,
  ChevronRight,
  Stethoscope,
  Zap,
} from "lucide-react";
import CameraView from "@/components/CameraView";
import VitalCard from "@/components/VitalCard";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const vitals = [
  {
    icon: Heart,
    label: "Heart Rate",
    value: "72",
    unit: "bpm",
    status: "normal" as const,
    trend: "stable" as const,
  },
  {
    icon: Wind,
    label: "SpO₂",
    value: "98",
    unit: "%",
    status: "normal" as const,
    trend: "stable" as const,
  },
  {
    icon: Thermometer,
    label: "Temperature",
    value: "37.1",
    unit: "°C",
    status: "normal" as const,
    trend: "stable" as const,
  },
  {
    icon: Activity,
    label: "Blood Pressure",
    value: "118/78",
    unit: "mmHg",
    status: "normal" as const,
    trend: "up" as const,
  },
];

const recentSessions = [
  {
    id: 1,
    title: "Cardio Check",
    time: "Today, 9:00 AM",
    duration: "12 min",
    score: 94,
  },
  {
    id: 2,
    title: "Breathing Assessment",
    time: "Yesterday, 3:30 PM",
    duration: "8 min",
    score: 87,
  },
];

export default function Home() {
  const [sessionActive, setSessionActive] = useState(false);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      {/* Live Coaching Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-slate-900 text-base leading-none">
              Live Coaching
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-powered real-time analysis
            </p>
          </div>
          {sessionActive && (
            <Badge variant="success">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Session Active
            </Badge>
          )}
        </div>

        {/* Camera — primary hero element */}
        <div className="relative w-full aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden shadow-lg">
          <CameraView onStatusChange={setSessionActive} />

          {/* AI overlay when active */}
          {sessionActive && (
            <div className="absolute bottom-16 left-4 right-4 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">
                      AI Observation
                    </p>
                    <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      Posture looks good. Breathing appears normal. Maintain
                      current position for best readings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Vitals Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 text-base">
            Current Vitals
          </h2>
          <button className="text-xs text-sky-600 font-medium flex items-center gap-0.5">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {vitals.map((vital) => (
            <VitalCard key={vital.label} {...vital} />
          ))}
        </div>
      </section>

      {/* Recent Sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 text-base">
            Recent Sessions
          </h2>
          <button className="text-xs text-sky-600 font-medium flex items-center gap-0.5">
            History <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {recentSessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-5 h-5 text-sky-500" strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {session.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {session.time} · {session.duration}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {session.score}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      SCORE
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="pb-2">
        <h2 className="font-semibold text-slate-900 text-base mb-3">
          Quick Actions
        </h2>
        <Card>
          <CardHeader>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
              Start a check-up
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {["Cardio", "Respiratory", "Posture"].map((action) => (
                <button
                  key={action}
                  className="py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-xs font-medium transition-colors border border-slate-100 hover:border-sky-100"
                >
                  {action}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
