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
  className?: string;
  variant?: "row" | "square";
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

/**
 * Fila compacta de una métrica — pensada para vivir dentro de un panel
 * único (ver Dashboard.tsx) en vez de ser cada una su propia tarjeta con
 * borde/sombra propios, que dejaba mucho espacio en blanco a la derecha
 * del valor cuando la columna era ancha.
 */
export default function StatTile({ icon: Icon, value, label, color, onClick, loading, className, variant = "row" }: StatTileProps) {
  if (variant === "square") {
    if (loading) {
      return (
        <div className={cn("flex flex-col items-center justify-center gap-2 px-2 py-3", className)}>
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-2 w-16 rounded" />
        </div>
      );
    }

    return (
      <div
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-1.5 px-1 py-3 min-w-0 animate-fade-in-up",
          onClick && "cursor-pointer hover:bg-gray-50/80 transition-colors",
          className
        )}
      >
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", COLOR_MAP[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-black text-gray-900 leading-tight max-w-full break-words">{value}</span>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{label}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2.5 px-3 py-2", className)}>
        <Skeleton className="w-7 h-7 rounded-lg shrink-0" />
        <Skeleton className="h-2.5 flex-1 rounded" />
        <Skeleton className="h-4 w-10 rounded shrink-0" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 animate-fade-in-up",
        onClick && "cursor-pointer hover:bg-gray-50/80 transition-colors",
        className
      )}
    >
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", COLOR_MAP[color])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide leading-tight flex-1 min-w-0">{label}</span>
      <span className="text-base font-black text-gray-900 shrink-0">{value}</span>
    </div>
  );
}
