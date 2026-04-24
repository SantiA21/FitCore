import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

type Plan = {
  id: number;
  nombre: string;
  precio: number;
  duracionEnDias: number;
  activo: boolean;
};

type MiMembresia = {
  id: number;
  planId: number;
  planNombre: string;
  planPrecio: number;
  fechaInicio: string;
  fechaFin: string;
};

export default function Planes() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [miMembresia, setMiMembresia] = useState<MiMembresia | null>(null);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [loadingMembresia, setLoadingMembresia] = useState(true);

  // Modal confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<Plan | null>(null);
  const [contratando, setContratando] = useState(false);

  useEffect(() => {
    apiFetch("/api/planes")
      .then((r) => r.json())
      .then((data: Plan[]) => setPlanes(data.filter((p) => p.activo)))
      .finally(() => setLoadingPlanes(false));

    apiFetch("/api/membresias/mi-membresia")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setMiMembresia(data))
      .finally(() => setLoadingMembresia(false));
  }, []);

  const handleContratar = (plan: Plan) => {
    setPlanSeleccionado(plan);
    setConfirmOpen(true);
  };

  const handleConfirmar = async () => {
    if (!planSeleccionado || !user) return;
    setContratando(true);
    try {
      const res = await apiFetch("/api/membresias", {
        method: "POST",
        body: JSON.stringify({ userId: user.id, planId: planSeleccionado.id }),
      });
      if (!res.ok) throw new Error();

      const nueva = await res.json();
      setMiMembresia({
        id: nueva.id,
        planId: planSeleccionado.id,
        planNombre: planSeleccionado.nombre,
        planPrecio: planSeleccionado.precio,
        fechaInicio: nueva.fechaInicio,
        fechaFin: nueva.fechaFin,
      });

      setConfirmOpen(false);
      toast({ variant: "success", title: "¡Plan contratado!", description: `Ahora estás en el plan ${planSeleccionado.nombre}.` });
    } catch {
      toast({ variant: "destructive", title: "No se pudo contratar", description: "Intentá nuevamente." });
    } finally {
      setContratando(false);
    }
  };

  const diasRestantes = miMembresia
    ? Math.max(0, Math.ceil((new Date(miMembresia.fechaFin).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-black">Planes</h1>

      {/* ── Membresía activa ── */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Tu membresía</h2>
        {loadingMembresia ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : miMembresia ? (
          <div className="bg-black text-white rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Activa</span>
              </div>
              <p className="text-lg font-semibold">{miMembresia.planNombre}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                Vence el {new Date(miMembresia.fechaFin).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-2xl font-bold">{diasRestantes}</span>
              </div>
              <p className="text-xs text-gray-400">días restantes</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-5 text-center">
            <p className="text-sm text-gray-500">No tenés una membresía activa.</p>
            <p className="text-xs text-gray-400 mt-1">Elegí un plan para empezar.</p>
          </div>
        )}
      </div>

      {/* ── Planes disponibles ── */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Planes disponibles</h2>
        {loadingPlanes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : planes.length === 0 ? (
          <p className="text-sm text-gray-400">No hay planes disponibles por el momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planes.map((p) => {
              const esActual = miMembresia?.planId === p.id;
              return (
                <div
                  key={p.id}
                  className={[
                    "bg-white border rounded-lg p-5 flex flex-col justify-between transition-shadow hover:shadow-sm",
                    esActual ? "border-black" : "border-gray-200",
                  ].join(" ")}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-black">{p.nombre}</h3>
                      {esActual && <Badge variant="default">Tu plan</Badge>}
                    </div>
                    <p className="text-2xl font-bold text-black">
                      ${p.precio.toLocaleString("es-AR")}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{p.duracionEnDias} días</p>
                  </div>

                  <Button
                    className="mt-5 w-full"
                    variant={esActual ? "outline" : "default"}
                    onClick={() => handleContratar(p)}
                  >
                    {esActual ? "Renovar" : "Contratar"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal confirmación ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {miMembresia?.planId === planSeleccionado?.id ? "Renovar plan" : "Contratar plan"}
            </DialogTitle>
            <DialogDescription>
              {miMembresia && miMembresia.planId !== planSeleccionado?.id
                ? `Vas a cambiar tu plan actual (${miMembresia.planNombre}) por ${planSeleccionado?.nombre}.`
                : `Vas a contratar el plan ${planSeleccionado?.nombre} por $${planSeleccionado?.precio.toLocaleString("es-AR")}.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={contratando}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmar} disabled={contratando}>
              {contratando ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
