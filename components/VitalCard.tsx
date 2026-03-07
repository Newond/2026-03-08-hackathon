import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./ui/Card";

interface VitalCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "critical";
  trend?: "up" | "down" | "stable";
}

const statusConfig = {
  normal: {
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Normal",
  },
  warning: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "Monitor",
  },
  critical: {
    bg: "bg-red-50",
    icon: "text-red-500",
    badge: "bg-red-100 text-red-700",
    label: "Alert",
  },
};

export default function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  trend,
}: VitalCardProps) {
  const cfg = statusConfig[status];

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", cfg.bg)}>
            <Icon className={cn("w-4.5 h-4.5", cfg.icon)} strokeWidth={2} />
          </div>
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              cfg.badge
            )}
          >
            {cfg.label}
          </span>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
            {label}
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {value}
            </span>
            <span className="text-xs text-slate-400 font-medium">{unit}</span>
            {trend && (
              <span className="ml-auto text-xs text-slate-400">
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
