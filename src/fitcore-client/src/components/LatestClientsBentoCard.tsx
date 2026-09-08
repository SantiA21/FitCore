import { User, ArrowUpRight } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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
}

export default function LatestClientsBentoCard({ clientes, className, delay }: LatestClientsBentoCardProps) {
  const navigate = useNavigate();

  return (
    <BentoCard className={cn("flex flex-col h-full !p-4", className)} delay={delay}>
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer group"
        onClick={() => navigate("/clientes")}
      >
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-black" />
          <h3 className="text-sm font-medium text-black tracking-tight">Últimos Clientes Registrados</h3>
        </div>
        <ArrowUpRight className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
      </div>

      <div className="space-y-1.5 flex-1">
        {clientes.length === 0 ? (
          <p className="text-[10px] text-gray-400 py-4 text-center">Sin clientes registrados</p>
        ) : (
          clientes.slice(0, 5).map((cliente) => {
            const fechaStr = cliente.fechaAlta
              ? new Date(cliente.fechaAlta).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
              : "";

            return (
              <div 
                key={cliente.id} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent cursor-pointer"
                onClick={() => navigate("/clientes")}
              >
                <div className="flex items-center gap-3">
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
