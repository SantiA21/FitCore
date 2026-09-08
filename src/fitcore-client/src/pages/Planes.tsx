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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

  // Modal baja cliente
  const [bajaOpen, setBajaOpen] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState("Económico / Presupuesto");
  const [observacionBaja, setObservacionBaja] = useState("");
  const [cancelando, setCancelando] = useState(false);

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

  const handleConfirmarBajaMiMembresia = async () => {
    setCancelando(true);
    try {
      const res = await apiFetch("/api/membresias/cancelar-mi-membresia", {
        method: "POST",
        body: JSON.stringify({
          motivo: motivoBaja,
          observaciones: observacionBaja.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al cancelar la membresía");
      }

      setMiMembresia(null);
      setBajaOpen(false);
      toast({
        variant: "success",
        title: "Membresía cancelada",
        description: "Tu membresía fue dada de baja con éxito.",
      });
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "No se pudo cancelar",
        description: err instanceof Error ? err.message : "Intentá nuevamente.",
      });
    } finally {
      setCancelando(false);
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
          <div className="bg-black text-white rounded-lg p-5">
            <div className="flex items-center justify-between">
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

            <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 h-7 px-2.5"
                onClick={() => {
                  setMotivoBaja("Económico / Presupuesto");
                  setObservacionBaja("");
                  setBajaOpen(true);
                }}
              >
                Dar de baja mi membresía
              </Button>
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

      {/* ── Modal baja propia cliente ── */}
      <Dialog open={bajaOpen} onOpenChange={setBajaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Cancelar mi membresía
            </DialogTitle>
            <DialogDescription>
              Lamentamos que decidas darte de baja de <strong>{miMembresia?.planNombre}</strong>.
              Contanos el motivo principal para ayudarnos a mejorar el servicio:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente-motivo-baja">Motivo principal</Label>
              <Select
                value={motivoBaja}
                onValueChange={setMotivoBaja}
                disabled={cancelando}
              >
                <SelectTrigger id="cliente-motivo-baja">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Económico / Presupuesto">Económico / Presupuesto</SelectItem>
                  <SelectItem value="Falta de tiempo / Horarios">Falta de tiempo / Horarios</SelectItem>
                  <SelectItem value="Lesión o motivos de salud">Lesión o motivos de salud</SelectItem>
                  <SelectItem value="Mudanza o distancia al gimnasio">Mudanza o distancia al gimnasio</SelectItem>
                  <SelectItem value="Disconformidad con las clases / instalaciones">Disconformidad con las clases / instalaciones</SelectItem>
                  <SelectItem value="Otro motivo">Otro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente-obs-baja">
                Comentarios o sugerencias <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </Label>
              <Input
                id="cliente-obs-baja"
                placeholder="¿Qué podríamos haber hecho mejor?..."
                value={observacionBaja}
                onChange={(e) => setObservacionBaja(e.target.value)}
                disabled={cancelando}
              />
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-800 dark:text-red-300">
              Al confirmar, tu membresía se cancelará de inmediato y no se registrarán cuotas automáticas posteriores.
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBajaOpen(false)}
              disabled={cancelando}
            >
              Mantener membresía
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmarBajaMiMembresia}
              disabled={cancelando}
            >
              {cancelando ? "Cancelando..." : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
