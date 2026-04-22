import { TrendingUp, DollarSign } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";

export default function PaymentsGraphBentoCard({ className, delay }: { className?: string; delay?: number }) {
  // Mock data for the last 7 days
  const data = [12000, 18000, 15000, 25000, 21000, 32000, 28000];
  const max = Math.max(...data);
  const points = data.map((d, i) => `${(i / 6) * 100},${100 - (d / max) * 80}`).join(" ");

  return (
    <BentoCard className={cn("flex flex-col h-full", className)} delay={delay}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black tracking-tight">Ingresos</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Últimos 7 días</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
          <TrendingUp className="h-3 w-3 text-emerald-600" />
          <span className="text-[10px] font-black text-emerald-600">+12%</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end mt-4">
        <div className="mb-4">
           <p className="text-4xl font-black text-black tracking-tighter">$45,230</p>
           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Total Semanal Estimado</p>
        </div>

        {/* Custom SVG Chart */}
        <div className="h-32 w-full relative group">
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
      </div>
    </BentoCard>
  );
}
