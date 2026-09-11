import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type StatTileColor = "indigo" | "rose" | "emerald" | "amber" | "blue" | "purple" | "orange";

interface StatTileProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: StatTileColor;
  onClick?: () => void;
  loading?: boolean;
}

const COLOR_MAP: Record<StatTileColor, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  rose: "bg-rose-50 text-rose-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function StatTile({ icon: Icon, value, label, color, onClick, loading }: StatTileProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200/80 rounded-xl p-2.5 shadow-xs flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1 space-y-1">
          <Skeleton className="h-2.5 w-16 rounded" />
          <Skeleton className="h-4 w-10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-gray-200/80 rounded-xl p-2.5 shadow-xs flex items-center gap-2.5 animate-fade-in-up",
        onClick && "cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
      )}
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", COLOR_MAP[color])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-tight truncate">{label}</p>
        <p className="text-lg font-black text-gray-900 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}
