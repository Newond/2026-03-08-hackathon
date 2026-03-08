"use client";

import { Shield } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm leading-none">
              Care Posture Assist
            </span>
            <span className="block text-[10px] text-slate-400 leading-none mt-0.5">
              AI Body Mechanics Coach
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
