import { useState } from "react";
import { Clock, User, CheckCircle2, Maximize2 } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

function VencimientoRow({ exp, i, dense }: { exp: Vencimiento; i: number; dense?: boolean }) {
  const esUrgente = exp.diasRestantes <= 2;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg hover:bg-gray-50 transition-all group animate-fade-in-up",
        dense ? "p-1.5" : "px-2 py-2.5"
      )}
      style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className={cn(
          "rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0",
          dense ? "h-6 w-6" : "h-7 w-7"
        )}>
          <User className={dense ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </div>
        <div className="min-w-0">
          <p className={cn("font-bold text-black truncate", dense ? "text-[11px]" : "text-sm")}>{exp.nombre}</p>
          <p className={cn("text-gray-400 truncate", dense ? "text-[9px]" : "text-xs")}>{exp.plan}</p>
        </div>
      </div>
      <span className={cn(
        "font-black uppercase shrink-0 ml-2 rounded-md",
        dense ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-1",
        esUrgente ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
      )}>
        {exp.diasRestantes === 0 ? "Hoy" : exp.diasRestantes === 1 ? "Mañana" : `${exp.diasRestantes}d`}
      </span>
    </div>
  );
}

export default function UpcomingSubscriptionsBentoCard({
  className,
  delay,
  vencimientos = [],
  loading,
}: UpcomingSubscriptionsBentoCardProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <BentoCard className={cn("flex flex-col !p-3", className)} delay={delay}>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer group"
        onClick={() => vencimientos.length > 0 && setModalOpen(true)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/10 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <h3 className="text-xs font-black text-black tracking-tight">Próximos Vencimientos</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {vencimientos.length > 0 && (
            <Badge variant="outline" className="text-[9px] font-bold border-rose-200 text-rose-600 bg-rose-50">
              {vencimientos.length}
            </Badge>
          )}
          {vencimientos.length > 0 && (
            <Maximize2 className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
          )}
        </div>
      </div>

      <div className="space-y-1 lg:flex-1 overflow-y-auto min-h-[56px] pr-1">
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
          vencimientos.map((exp, i) => (
            <button
              key={exp.id}
              type="button"
              className="w-full text-left cursor-pointer"
              onClick={() => setModalOpen(true)}
            >
              <VencimientoRow exp={exp} i={i} dense />
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/clientes")}
        className="mt-1.5 shrink-0 w-full py-1 rounded-lg bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 hover:text-black transition-all cursor-pointer"
      >
        Ver Clientes y Membresías
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Próximos Vencimientos</DialogTitle>
            <DialogDescription>
              {vencimientos.length} membresía{vencimientos.length !== 1 ? "s" : ""} por vencer
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {vencimientos.map((exp, i) => (
              <VencimientoRow key={exp.id} exp={exp} i={i} />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => {
              setModalOpen(false);
              navigate("/clientes");
            }}
          >
            Ir a Clientes
          </Button>
        </DialogContent>
      </Dialog>
    </BentoCard>
  );
}
