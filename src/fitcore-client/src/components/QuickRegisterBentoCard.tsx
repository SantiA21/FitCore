import { useMemo, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClienteCombobox from "@/components/ui/client-combobox";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import BentoCard from "./BentoCard";
import { cn } from "@/lib/utils";

type Cliente = {
  id: string | number;
  nombre: string;
  apellido?: string;
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

  const clientesActivos = useMemo(() => clientes.filter((c) => c.activo), [clientes]);

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
          userId: String(formClienteId),
          fecha: fecha,
          horaIngreso: new Date().toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al registrar asistencia");
      }

      const clienteReg = clientes.find(c => String(c.id) === formClienteId);
      toast({
        variant: "success",
        title: "Asistencia registrada",
        description: clienteReg ? `Ingreso de ${clienteReg.nombre} ${clienteReg.apellido || ''} registrado.` : "Ingreso registrado."
      });
      setFormClienteId("");
      onSuccess?.();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo registrar la asistencia."
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BentoCard className={cn("flex flex-col !p-4", className)} delay={delay}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="p-2 bg-black rounded-xl shadow-lg shadow-black/20">
          <UserPlus className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <h3 className="text-xs font-black text-black tracking-tight">Registro Rápido</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            {fechaSeleccionada
              ? fechaSeleccionada.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
              : "Hoy"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-1">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Seleccionar Cliente</label>
          <ClienteCombobox
            clientes={clientesActivos}
            value={formClienteId}
            onChange={setFormClienteId}
            disabled={saving}
            placeholder="Buscar cliente..."
            emptyLabel="No hay clientes activos"
            className="[&_input]:h-10 [&_input]:text-[12px] [&_input]:rounded-xl [&_input]:border-gray-100 [&_input]:shadow-sm [&_input]:px-4 [&_input]:pl-9"
          />
        </div>

        <Button
          onClick={handleRegistrar}
          disabled={saving || !formClienteId}
          className="w-full h-10 rounded-xl bg-black text-white hover:bg-black/90 text-[11px] font-black uppercase tracking-widest mt-auto shadow-xl shadow-black/10 active:scale-95 transition-all group"
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
