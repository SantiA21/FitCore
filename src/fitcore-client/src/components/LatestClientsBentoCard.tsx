import { User, ArrowUpRight } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";

type Cliente = {
  id: number;
  nombre: string;
  fechaAlta: string;
  activo: boolean;
};

interface LatestClientsBentoCardProps {
  clientes: Cliente[];
  className?: string;
  delay?: number;
}

export default function LatestClientsBentoCard({ clientes, className, delay }: LatestClientsBentoCardProps) {
  return (
    <BentoCard className={cn("flex flex-col h-full !p-4", className)} delay={delay}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-black" />
          <h3 className="text-sm font-medium text-black tracking-tight">Últimos Clientes</h3>
        </div>
        <ArrowUpRight className="h-3 w-3 text-gray-400" />
      </div>

      <div className="space-y-1.5 flex-1">
        {clientes.length === 0 ? (
          <p className="text-[10px] text-gray-400 py-4">Sin clientes recientes</p>
        ) : (
          clientes.slice(0, 3).map((cliente) => (
            <div 
              key={cliente.id} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent"
            >
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-black font-bold text-[10px] border border-gray-200">
                  {cliente.nombre.charAt(0)}
                </div>
                <span className="text-[11px] font-medium text-black">{cliente.nombre}</span>
              </div>
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                cliente.activo ? "bg-black" : "bg-gray-200"
              )} />
            </div>
          ))
        )}
      </div>
    </BentoCard>
  );
}
