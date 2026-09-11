import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Asistencia = {
  id: number;
  userId: string;
  clienteNombre: string;
  fecha: string;
  horaIngreso: string;
};

type ResumenDia = {
  fecha: string;
  total: number;
};

type Cliente = {
  id: string;
  nombre: string;
  activo: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toDateOnly(date: Date): string {
  // Usar fecha local para evitar desfasajes de zona horaria al convertir a YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHora(hora: string): string {
  // hora viene como "HH:mm:ss" desde la API
  return hora.slice(0, 5);
}

function getDiasDelMes(anio: number, mes: number): (Date | null)[] {
  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const celdas: (Date | null)[] = Array(primerDia).fill(null);
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push(new Date(anio, mes, d));
  }
  return celdas;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Asistencias() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);

  // Datos
  const [resumen, setResumen] = useState<ResumenDia[]>([]);
  const [asistenciasDia, setAsistenciasDia] = useState<Asistencia[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  // Loading states
  const [loadingResumen, setLoadingResumen] = useState(true);
  const [loadingDia, setLoadingDia] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal registro
  const [modalOpen, setModalOpen] = useState(false);
  const [formClienteId, setFormClienteId] = useState("");
  const [formHora, setFormHora] = useState("08:00");
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  // ── Cargar resumen del mes ─────────────────────────────────────────────────
  const cargarResumen = useCallback(async () => {
    setLoadingResumen(true);
    try {
      const res = await apiFetch(`/api/asistencias/resumen?mes=${mes + 1}&anio=${anio}`);
      const data = await res.json();
      setResumen(data);
    } catch {
      toast({ variant: "destructive", title: "Error al cargar el calendario" });
    } finally {
      setLoadingResumen(false);
    }
  }, [mes, anio]);

  useEffect(() => {
    cargarResumen();
  }, [cargarResumen]);

  // ── Cargar clientes activos (una sola vez) ─────────────────────────────────
  useEffect(() => {
    apiFetch("/api/usuarios?categoria=Cliente&activo=true")
      .then((r) => r.json())
      .then((data: Cliente[]) => setClientes(data));
  }, []);

  // ── Cargar asistencias del día seleccionado ────────────────────────────────
  const cargarDia = useCallback(async (fecha: Date) => {
    setLoadingDia(true);
    setAsistenciasDia([]);
    try {
      const res = await apiFetch(`/api/asistencias?fecha=${toDateOnly(fecha)}`);
      const data = await res.json();
      setAsistenciasDia(data);
    } catch {
      toast({ variant: "destructive", title: "Error al cargar asistencias del día" });
    } finally {
      setLoadingDia(false);
    }
  }, []);

  const seleccionarDia = (dia: Date) => {
    setDiaSeleccionado(dia);
    cargarDia(dia);
  };

  // ── Navegación de mes ──────────────────────────────────────────────────────
  const irMesAnterior = () => {
    if (mes === 0) { setMes(11); setAnio((a) => a - 1); }
    else setMes((m) => m - 1);
    setDiaSeleccionado(null);
  };

  const irMesSiguiente = () => {
    if (mes === 11) { setMes(0); setAnio((a) => a + 1); }
    else setMes((m) => m + 1);
    setDiaSeleccionado(null);
  };

  // ── Registrar asistencia ───────────────────────────────────────────────────
  const handleRegistrar = async () => {
    if (!diaSeleccionado || !formClienteId) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/asistencias", {
        method: "POST",
        body: JSON.stringify({
          userId: formClienteId,
          fecha: toDateOnly(diaSeleccionado),
          horaIngreso: `${formHora}:00`,
        }),
      });
      if (!res.ok) throw new Error();

      toast({ variant: "success", title: "Asistencia registrada" });
      setModalOpen(false);
      setFormClienteId("");
      setFormHora("08:00");
      await cargarDia(diaSeleccionado);
      await cargarResumen();
    } catch {
      toast({ variant: "destructive", title: "No se pudo registrar", description: "Intentá nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar asistencia ────────────────────────────────────────────────────
  const handleEliminar = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await apiFetch(`/api/asistencias/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      setAsistenciasDia((prev) => prev.filter((a) => a.id !== id));
      await cargarResumen();
      toast({ variant: "success", title: "Asistencia eliminada" });
    } catch {
      toast({ variant: "destructive", title: "No se pudo eliminar" });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Datos calendario ───────────────────────────────────────────────────────
  const celdas = getDiasDelMes(anio, mes);
  const resumenMap = new Map(resumen.map((r) => [r.fecha.slice(0, 10), r.total]));
  const hoyStr = toDateOnly(hoy);
  const diaSeleccionadoStr = diaSeleccionado ? toDateOnly(diaSeleccionado) : null;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black">Asistencias</h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Calendario ── */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 w-full lg:w-auto lg:min-w-[420px]">

          {/* Navegación */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={irMesAnterior}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-black">
              {MESES[mes]} {anio}
            </span>
            <button
              onClick={irMesSiguiente}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-2">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          {loadingResumen ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((dia, i) => {
                if (!dia) return <div key={`empty-${i}`} />;
                const fechaStr = toDateOnly(dia);
                const total = resumenMap.get(fechaStr) ?? 0;
                const esHoy = fechaStr === hoyStr;
                const esSeleccionado = fechaStr === diaSeleccionadoStr;

                return (
                  <button
                    key={fechaStr}
                    onClick={() => seleccionarDia(dia)}
                    className={[
                      "relative flex flex-col items-center justify-center h-10 w-full rounded-md text-sm transition-colors",
                      esSeleccionado
                        ? "bg-black text-white"
                        : esHoy
                        ? "bg-gray-100 text-black font-semibold"
                        : "hover:bg-gray-50 text-gray-700",
                    ].join(" ")}
                  >
                    <span>{dia.getDate()}</span>
                    {total > 0 && (
                      <span
                        className={[
                          "absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-semibold leading-none",
                          esSeleccionado ? "text-gray-300" : "text-gray-400",
                        ].join(" ")}
                      >
                        {total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Leyenda */}
          <p className="text-xs text-gray-400 mt-4 text-center">
            El número debajo del día indica cuántas asistencias hubo
          </p>
        </div>

        {/* ── Panel del día ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg">
          {!diaSeleccionado ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">Seleccioná un día</p>
              <p className="text-xs text-gray-400 mt-1">
                Tocá cualquier día del calendario para ver o registrar asistencias
              </p>
            </div>
          ) : (
            <>
              {/* Header del panel */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-base font-semibold text-black">
                    {diaSeleccionado.toLocaleDateString("es-AR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h2>
                  {loadingDia ? (
                    <Skeleton className="h-3 w-20 rounded mt-1" />
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {`${asistenciasDia.length} asistencia${asistenciasDia.length !== 1 ? "s" : ""}`}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  disabled={loadingDia}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Registrar
                </Button>
              </div>

              {/* Lista de asistencias */}
              <div className="divide-y divide-gray-100">
                {loadingDia ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  ))
                ) : asistenciasDia.length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-400">
                    No hay asistencias registradas para este día
                  </div>
                ) : (
                  asistenciasDia.map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                    >
                      <div>
                        <p className="text-sm font-medium text-black">{a.clienteNombre}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{formatHora(a.horaIngreso)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEliminar(a.id)}
                        disabled={deletingId === a.id}
                        className="p-2 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                        aria-label="Eliminar asistencia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal registrar asistencia ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar asistencia</DialogTitle>
            <DialogDescription>
              {diaSeleccionado?.toLocaleDateString("es-AR", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={formClienteId}
                onValueChange={setFormClienteId}
                disabled={saving}
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Seleccioná un cliente" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora">Hora de ingreso</Label>
              <Input
                id="hora"
                type="time"
                value={formHora}
                onChange={(e) => setFormHora(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleRegistrar}
              disabled={!formClienteId}
              loading={saving}
            >
              {saving ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
