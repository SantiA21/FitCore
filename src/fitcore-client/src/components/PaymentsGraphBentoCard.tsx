import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Maximize2 } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import StatDetailDialog, { type DetailRow } from "./StatDetailDialog";

type SerieItem = {
  dia: string;
  fecha: string;
  monto: number;
};

function formatMonto(n: number): string {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

interface PaymentsGraphBentoCardProps {
  className?: string;
  delay?: number;
  serie?: SerieItem[];
  totalSemana?: number;
  totalSemanaFormatted?: string;
  porcentajeCrecimiento?: number;
  loading?: boolean;
}

export default function PaymentsGraphBentoCard({
  className,
  delay,
  serie = [],
  totalSemana = 0,
  totalSemanaFormatted,
  porcentajeCrecimiento = 0,
  loading,
}: PaymentsGraphBentoCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <BentoCard className={cn("flex flex-col lg:h-full !p-4", className)} delay={delay}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="lg:flex-1 flex flex-col justify-end mt-2">
          <div className="mb-3 space-y-1.5">
            <Skeleton className="h-7 w-28 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </BentoCard>
    );
  }

  const montos = serie.map((s) => s.monto);
  const max = Math.max(...montos, 1);
  const count = serie.length > 1 ? serie.length - 1 : 1;

  const points = serie.length > 0
    ? serie.map((d, i) => `${(i / count) * 100},${100 - (d.monto / max) * 75}`).join(" ")
    : "0,100 100,100";

  const isPositive = porcentajeCrecimiento >= 0;

  const rows: DetailRow[] = [...serie].reverse().map((s, idx) => ({
    id: idx,
    title: new Date(s.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "2-digit" }),
    right: formatMonto(s.monto),
    rightVariant: s.monto > 0 ? ("success" as const) : ("muted" as const),
  }));

  return (
    <BentoCard className={cn("flex flex-col lg:h-full !p-4", className)} delay={delay}>
      <div
        className="flex items-center justify-between mb-1 cursor-pointer group"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-black tracking-tight">Ingresos</h3>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Últimos 7 días</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full border",
            isPositive ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
          )}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-[10px] font-black">{isPositive ? `+${porcentajeCrecimiento}%` : `${porcentajeCrecimiento}%`}</span>
          </div>
          <Maximize2 className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
        </div>
      </div>

      <div className="lg:flex-1 flex flex-col justify-end mt-2">
        <div className="mb-2">
          <p className="text-2xl font-black text-black tracking-tighter">
            {totalSemanaFormatted ?? `$${totalSemana.toLocaleString("es-AR")}`}
          </p>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Total Semanal Cobrado</p>
        </div>

        {/* Custom SVG Chart */}
        <div className="h-14 w-full relative group">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="gradient-pay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Area */}
            <polyline
              points={`0,100 ${points} 100,100`}
              fill="url(#gradient-pay)"
              className="transition-all duration-1000 ease-in-out"
            />
            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
        </div>

        {/* Day labels */}
        {serie.length > 0 && (
          <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100/50">
            {serie.map((s, idx) => (
              <span key={idx} className="text-center">{s.dia}</span>
            ))}
          </div>
        )}
      </div>

      <StatDetailDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Ingresos de la Semana"
        description={`Total cobrado: ${totalSemanaFormatted ?? formatMonto(totalSemana)}`}
        rows={rows}
        emptyText="Sin ingresos en los últimos 7 días"
        navigateTo="/pagos"
        navigateLabel="Ir a Pagos"
      />
    </BentoCard>
  );
}
