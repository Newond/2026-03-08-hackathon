"use client";

import { Bell, Settings, Shield } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm leading-none">
              MedAssist
            </span>
            <span className="block text-[10px] text-slate-400 leading-none mt-0.5">
              AI Medical Coach
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <Bell className="w-5 h-5" strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 border-2 border-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500">
            <Settings className="w-5 h-5" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </header>
  );
}
