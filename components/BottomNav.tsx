"use client";

import { Home, Activity, Calendar, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Activity, label: "Vitals", id: "vitals" },
  { icon: Calendar, label: "Schedule", id: "schedule" },
  { icon: MessageCircle, label: "Chat", id: "chat" },
  { icon: User, label: "Profile", id: "profile" },
];

export default function BottomNav() {
  const [active, setActive] = useState("home");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-100 px-2 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, id }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-3 px-3 rounded-xl transition-colors duration-150 min-w-[56px]",
                isActive
                  ? "text-sky-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
              aria-label={label}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform duration-150",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-sky-600" : "text-slate-400"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
