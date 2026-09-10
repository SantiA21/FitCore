import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatTileColor = "indigo" | "rose" | "emerald" | "amber" | "blue" | "purple" | "orange";

interface StatTileProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color: StatTileColor;
  onClick?: () => void;
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

export default function StatTile({ icon: Icon, value, label, color, onClick }: StatTileProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex items-center gap-4",
        onClick && "cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all"
      )}
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", COLOR_MAP[color])}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}
