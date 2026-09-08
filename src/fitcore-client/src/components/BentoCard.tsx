import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function BentoCard({ children, className, delay = 0 }: BentoCardProps) {
  return (
    <div
      className={cn(
        "bg-white/80 backdrop-blur-xl border border-white/40 rounded-[var(--radius)] p-6 group relative",
        "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
