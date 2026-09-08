import { Clock, User, CheckCircle2 } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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
}

export default function UpcomingSubscriptionsBentoCard({
  className,
  delay,
  vencimientos = []
}: UpcomingSubscriptionsBentoCardProps) {
  const navigate = useNavigate();

  return (
    <BentoCard className={cn("flex flex-col h-full", className)} delay={delay}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-2xl">
            <Clock className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black tracking-tight">Suscripciones</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Próximos Vencimientos</p>
          </div>
        </div>
        {vencimientos.length > 0 && (
          <Badge variant="outline" className="text-[10px] font-bold border-rose-200 text-rose-600 bg-rose-50">
            {vencimientos.length} por vencer
          </Badge>
        )}
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[220px] pr-1">
        {vencimientos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
            <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">Sin vencimientos próximos</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Todas las membresías activas están al día.</p>
          </div>
        ) : (
          vencimientos.map((exp) => {
            const fechaStr = new Date(exp.fechaFin).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
            const esUrgente = exp.diasRestantes <= 2;

            return (
              <div
                key={exp.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-all border border-gray-100 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate">{exp.nombre}</p>
                    <p className="text-[10px] text-gray-400 truncate">{exp.plan} • Vence el {fechaStr}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] font-black uppercase tracking-tighter rounded-md border-none px-1.5 py-0.5",
                      esUrgente
                        ? "bg-rose-500 text-white shadow-sm shadow-rose-500/20"
                        : "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                    )}
                  >
                    {esUrgente ? "Urgente" : "Próximo"}
                  </Badge>
                  <span className="text-[9px] font-bold text-gray-400">
                    {exp.diasRestantes === 0
                      ? "Hoy"
                      : exp.diasRestantes === 1
                      ? "Mañana"
                      : `en ${exp.diasRestantes} días`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/clientes")}
        className="mt-3 w-full py-2.5 rounded-xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 hover:text-black transition-all cursor-pointer"
      >
        Ver Clientes y Membresías
      </button>
    </BentoCard>
  );
}
