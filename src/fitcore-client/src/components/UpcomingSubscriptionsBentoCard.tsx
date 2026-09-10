import { Clock, User, CheckCircle2 } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

type Vencimiento = {
  id: number;
  clienteId: string;
  nombre: string;
  plan: string;
  fechaFin: string;
  diasRestantes: number;
};

interface UpcomingSubscriptionsBentoCardProps {
  className?: string;
  delay?: number;
  vencimientos?: Vencimiento[];
  loading?: boolean;
}

export default function UpcomingSubscriptionsBentoCard({
  className,
  delay,
  vencimientos = [],
  loading,
}: UpcomingSubscriptionsBentoCardProps) {
  const navigate = useNavigate();

  return (
    <BentoCard className={cn("flex flex-col !p-4", className)} delay={delay}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/10 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <h3 className="text-xs font-black text-black tracking-tight">Próximos Vencimientos</h3>
        </div>
        {vencimientos.length > 0 && (
          <Badge variant="outline" className="text-[9px] font-bold border-rose-200 text-rose-600 bg-rose-50">
            {vencimientos.length}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5 lg:flex-1 overflow-y-auto max-h-[130px] pr-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-2.5 w-14 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-9 rounded-md" />
            </div>
          ))
        ) : vencimientos.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4 text-center text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-[11px] font-semibold text-foreground">Todo al día</p>
          </div>
        ) : (
          vencimientos.map((exp, i) => {
            const esUrgente = exp.diasRestantes <= 2;

            return (
              <div
                key={exp.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-all group animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-black truncate">{exp.nombre}</p>
                    <p className="text-[9px] text-gray-400 truncate">{exp.plan}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase shrink-0 ml-2 px-1.5 py-0.5 rounded-md",
                  esUrgente ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                )}>
                  {exp.diasRestantes === 0 ? "Hoy" : exp.diasRestantes === 1 ? "Mañana" : `${exp.diasRestantes}d`}
                </span>
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/clientes")}
        className="mt-2 w-full py-1.5 rounded-lg bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 hover:text-black transition-all cursor-pointer"
      >
        Ver Clientes y Membresías
      </button>
    </BentoCard>
  );
}
