import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";

type Cliente = {
  id: number;
  nombre: string;
  activo: boolean;
};

interface QuickRegisterBentoCardProps {
  clientes: Cliente[];
  fechaSeleccionada?: Date | null;
  className?: string;
  delay?: number;
  onSuccess?: () => void;
}

export default function QuickRegisterBentoCard({
  clientes,
  fechaSeleccionada,
  className,
  delay,
  onSuccess
}: QuickRegisterBentoCardProps) {
  const [formClienteId, setFormClienteId] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleRegistrar = async () => {
    if (!formClienteId) return;
    setSaving(true);
    try {
      const fecha = fechaSeleccionada
        ? `${fechaSeleccionada.getFullYear()}-${String(fechaSeleccionada.getMonth() + 1).padStart(2, '0')}-${String(fechaSeleccionada.getDate()).padStart(2, '0')}`
        : new Date().toISOString().slice(0, 10);
      const res = await apiFetch("/api/asistencias", {
        method: "POST",
        body: JSON.stringify({
          clienteId: Number(formClienteId),
          fecha: fecha,
          horaIngreso: new Date().toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' }) + ":00",
        }),
      });
      if (!res.ok) throw new Error();

      toast({ title: "Registrado" });
      setFormClienteId("");
      onSuccess?.();
    } catch {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BentoCard className={cn("flex flex-col h-a !p-6", className)} delay={delay}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-black rounded-2xl shadow-lg shadow-black/20">
          <UserPlus className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-[14px] font-black text-black tracking-tight">Registro Rápido</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            {fechaSeleccionada
              ? fechaSeleccionada.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
              : "Hoy"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Seleccionar Cliente</label>
          <Select
            value={formClienteId}
            onValueChange={setFormClienteId}
            disabled={saving}
          >
            <SelectTrigger className="h-12 text-[12px] rounded-2xl border-gray-100 bg-white shadow-sm px-4">
              <SelectValue>
                {formClienteId
                  ? clientes.find(c => String(c.id) === formClienteId)?.nombre
                  : <span className="text-gray-400">Buscar cliente...</span>
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              className="rounded-2xl border-gray-100 shadow-2xl p-2"
              position="popper"    // fuerza posicionamiento relativo al trigger
              sideOffset={4}
              style={{ zIndex: 9999 }}  // por si hay stacking context issues
            >
              {clientes.filter(c => c.activo).length > 0 ? (
                clientes.filter(c => c.activo).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="text-[12px] py-3 px-4 cursor-pointer rounded-xl focus:bg-gray-50">
                    {c.nombre}
                  </SelectItem>
                ))
              ) : (
                <p className="p-4 text-[11px] text-gray-400 text-center italic">No hay clientes activos</p>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleRegistrar}
          disabled={saving || !formClienteId}
          className="w-full h-12 rounded-2xl bg-black text-white hover:bg-black/90 text-[12px] font-black uppercase tracking-widest mt-auto shadow-xl shadow-black/10 active:scale-95 transition-all group"
        >
          {saving ? "Registrando..." : (
            <span className="flex items-center gap-2">
              Registrar Asistencia
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            </span>
          )}
        </Button>
      </div>
    </BentoCard>
  );
}
