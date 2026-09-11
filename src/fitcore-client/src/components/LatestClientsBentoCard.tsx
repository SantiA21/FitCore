import { useState } from "react";
import { User, Maximize2 } from "lucide-react";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";
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

function ClienteRow({ cliente, i, dense }: { cliente: Cliente; i: number; dense?: boolean }) {
  const fechaStr = cliente.fechaAlta
    ? new Date(cliente.fechaAlta).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: dense ? undefined : "numeric" })
    : "";

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg hover:bg-gray-50 transition-colors animate-fade-in-up",
        dense ? "p-1.5" : "px-2 py-2.5"
      )}
      style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
    >
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "rounded-full bg-gray-100 flex items-center justify-center text-black font-bold border border-gray-200",
          dense ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"
        )}>
          {cliente.nombre.charAt(0)}
        </div>
        <span className={cn("font-medium text-black", dense ? "text-[11px]" : "text-sm")}>
          {cliente.nombre} {cliente.apellido || ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {fechaStr && (
          <span className={cn("text-gray-400 font-normal", dense ? "text-[10px]" : "text-xs")}>
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
}

export default function LatestClientsBentoCard({ clientes, className, delay, loading }: LatestClientsBentoCardProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <BentoCard className={cn("flex flex-col !p-4", className)} delay={delay}>
      <div
        className="flex items-center justify-between mb-2 cursor-pointer group"
        onClick={() => setModalOpen(true)}
      >
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-black" />
          <h3 className="text-xs font-black text-black tracking-tight">Últimos Clientes</h3>
        </div>
        <Maximize2 className="h-3 w-3 text-gray-400 group-hover:text-black transition-colors" />
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
          clientes.slice(0, 4).map((cliente, i) => (
            <button
              key={cliente.id}
              type="button"
              className="w-full text-left cursor-pointer"
              onClick={() => setModalOpen(true)}
            >
              <ClienteRow cliente={cliente} i={i} dense />
            </button>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Últimos Clientes</DialogTitle>
            <DialogDescription>
              {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {clientes.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Sin clientes registrados</p>
            ) : (
              clientes.map((cliente, i) => <ClienteRow key={cliente.id} cliente={cliente} i={i} />)
            )}
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
