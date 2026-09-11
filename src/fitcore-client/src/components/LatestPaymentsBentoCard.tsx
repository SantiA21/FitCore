import { Receipt } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

type Pago = {
  id: number;
  clienteNombre: string;
  monto: number;
  metodo: string;
  fecha: string;
};

interface LatestPaymentsBentoCardProps {
  pagos: Pago[];
  className?: string;
  delay?: number;
  loading?: boolean;
}

function formatMonto(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function LatestPaymentsBentoCard({ pagos, className, delay, loading }: LatestPaymentsBentoCardProps) {
  const navigate = useNavigate();

  return (
    <BentoCard className={cn("flex flex-col !p-4", className)} delay={delay}>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer group"
        onClick={() => navigate("/pagos")}
      >
        <div className="flex items-center gap-2">
          <Receipt className="h-3.5 w-3.5 text-emerald-600" />
          <h3 className="text-xs font-black text-black tracking-tight">Últimos Pagos</h3>
        </div>
      </div>

      <div className="space-y-1 lg:flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))
        ) : pagos.length === 0 ? (
          <p className="text-[10px] text-gray-400 py-4 text-center">Sin pagos registrados todavía</p>
        ) : (
          pagos.slice(0, 4).map((pago, i) => (
            <button
              key={pago.id}
              type="button"
              onClick={() => navigate("/pagos")}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-[10px] shrink-0">
                  {pago.clienteNombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-black truncate">{pago.clienteNombre}</p>
                  <p className="text-[9px] text-gray-400 truncate">{pago.metodo}</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 shrink-0 ml-2">
                {formatMonto(pago.monto)}
              </span>
            </button>
          ))
        )}
      </div>
    </BentoCard>
  );
}
