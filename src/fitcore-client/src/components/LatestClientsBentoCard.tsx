import { User, ArrowUpRight } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

type Cliente = {
  id: string | number;
  nombre: string;
  apellido?: string;
  fechaAlta: string;
  activo: boolean;
};

interface LatestClientsBentoCardProps {
  clientes: Cliente[];
  className?: string;
  delay?: number;
  loading?: boolean;
}

export default function LatestClientsBentoCard({ clientes, className, delay, loading }: LatestClientsBentoCardProps) {
  const navigate = useNavigate();

  return (
    <BentoCard className={cn("flex flex-col !p-4", className)} delay={delay}>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer group"
        onClick={() => navigate("/clientes")}
      >
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-black" />
          <h3 className="text-xs font-black text-black tracking-tight">Últimos Clientes</h3>
        </div>
        <ArrowUpRight className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
      </div>

      <div className="space-y-1 lg:flex-1">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-8 rounded" />
            </div>
          ))
        ) : clientes.length === 0 ? (
          <p className="text-[10px] text-gray-400 py-4 text-center">Sin clientes registrados</p>
        ) : (
          clientes.slice(0, 4).map((cliente, i) => {
            const fechaStr = cliente.fechaAlta
              ? new Date(cliente.fechaAlta).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
              : "";

            return (
              <div
                key={cliente.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => navigate("/clientes")}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-black font-bold text-[10px] border border-gray-200">
                    {cliente.nombre.charAt(0)}
                  </div>
                  <span className="text-[11px] font-medium text-black">
                    {cliente.nombre} {cliente.apellido || ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {fechaStr && (
                    <span className="text-[10px] text-gray-400 font-normal">
                      {fechaStr}
                    </span>
                  )}
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    cliente.activo ? "bg-emerald-500" : "bg-gray-300"
                  )} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </BentoCard>
  );
}
