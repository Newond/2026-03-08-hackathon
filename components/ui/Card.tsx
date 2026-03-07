import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-100 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn("px-4 pt-4 pb-2", className)}>{children}</div>
  );
}

export function CardContent({ children, className }: CardProps) {
  return <div className={cn("px-4 pb-4", className)}>{children}</div>;
}
