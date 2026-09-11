import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Check, MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/utils";
import { useGymSettings } from "@/context/GymSettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";

type PeriodoEstado = {
  mes: number;
  anio: number;
  nombreMes: string;
  pagado: boolean;
  monto: number | null;
  metodo: string | null;
  fechaPago: string | null;
};

type Plan = {
  id: number;
  nombre: string;
  precio: number;
};

type EstadoCuenta = {
  userId: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  membresiaId?: number | null;
  planNombre: string | null;
  planPrecio?: number | null;
  membresiaVence: string | null;
  estadoGeneral: "AlDia" | "ConDeuda" | "PendienteMesActual";
  periodos: PeriodoEstado[];
};

const METODOS = ["Efectivo", "Transferencia", "Tarjeta", "Otro"];

const ESTADO_CONFIG = {
  AlDia: { label: "Al día", className: "bg-green-100 text-green-700" },
  PendienteMesActual: { label: "Pendiente", className: "bg-gray-100 text-gray-600" },
  ConDeuda: { label: "Con deuda", className: "bg-red-100 text-red-600" },
};

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-20" /></TableCell>
      ))}
    </TableRow>
  );
}

export default function EstadoCuenta() {
  const [searchParams] = useSearchParams();
  const { settings } = useGymSettings();

  const [clientes, setClientes] = useState<EstadoCuenta[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState(() => {
    const estadoInicial = searchParams.get("estado");
    return estadoInicial && estadoInicial in ESTADO_CONFIG ? estadoInicial : "Todos";
  });
  const [busqueda, setBusqueda] = useState("");

  // Modal pago
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<EstadoCuenta | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<PeriodoEstado | null>(null);
  const [saving, setSaving] = useState(false);
  const [pagoForm, setPagoForm] = useState({
    monto: "",
    metodo: "Efectivo",
    nota: "",
  });

  // Descuento
  const [aplicaDescuento, setAplicaDescuento] = useState(false);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState("");
  const [importeFinal, setImporteFinal] = useState("");

  const { toast } = useToast();

  const cargar = async () => {
    setLoading(true);
    try {
      const [data, planesData] = await Promise.all([
        apiFetch("/api/pagos/estado-cuenta").then((r) => r.json()),
        apiFetch("/api/planes").then((r) => r.json()).catch(() => [])
      ]);
      setClientes(data);
      if (Array.isArray(planesData)) {
        setPlanes(planesData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const matchEstado = filtroEstado === "Todos" || c.estadoGeneral === filtroEstado;
      const matchBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [clientes, filtroEstado, busqueda]);

  const resumen = useMemo(() => ({
    alDia: clientes.filter((c) => c.estadoGeneral === "AlDia").length,
    pendiente: clientes.filter((c) => c.estadoGeneral === "PendienteMesActual").length,
    conDeuda: clientes.filter((c) => c.estadoGeneral === "ConDeuda").length,
  }), [clientes]);

  // Obtener los headers de períodos del primer cliente
  const periodoHeaders = clientes[0]?.periodos.map((p) => p.nombreMes) ?? [];

  // ── Validaciones de entrada ──────────────────────────────
  const preventInvalidNumberKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleMontoChange = (val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, "");
    setPagoForm((p) => ({ ...p, monto: sanitized }));

    const base = parseFloat(sanitized);
    if (isNaN(base) || base <= 0) {
      setImporteFinal("");
      return;
    }

    if (aplicaDescuento && porcentajeDescuento !== "") {
      const pct = parseFloat(porcentajeDescuento) || 0;
      const final = Math.max(0, Math.round(base * (1 - pct / 100)));
      setImporteFinal(String(final));
    } else {
      setImporteFinal(sanitized);
    }
  };

  const handleToggleDescuento = (checked: boolean) => {
    setAplicaDescuento(checked);
    if (checked) {
      const base = parseFloat(pagoForm.monto) || 0;
      if (porcentajeDescuento !== "") {
        const pct = parseFloat(porcentajeDescuento) || 0;
        const final = Math.max(0, Math.round(base * (1 - pct / 100)));
        setImporteFinal(String(final));
      } else {
        setImporteFinal(pagoForm.monto);
      }
    } else {
      setPorcentajeDescuento("");
      setImporteFinal(pagoForm.monto);
    }
  };

  const handlePorcentajeChange = (val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, "");
    if (sanitized === "") {
      setPorcentajeDescuento("");
      setImporteFinal(pagoForm.monto);
      return;
    }

    let num = parseFloat(sanitized);
    if (isNaN(num)) return;
    if (num > 100) num = 100;
    if (num < 0) num = 0;

    setPorcentajeDescuento(String(num));
    const base = parseFloat(pagoForm.monto) || 0;
    const final = Math.max(0, Math.round(base * (1 - num / 100)));
    setImporteFinal(String(final));
  };

  const handleImporteFinalChange = (val: string) => {
    const sanitized = val.replace(/[^0-9.]/g, "");
    if (sanitized === "") {
      setImporteFinal("");
      return;
    }

    let finalVal = parseFloat(sanitized);
    if (isNaN(finalVal)) return;
    if (finalVal < 0) finalVal = 0;

    const base = parseFloat(pagoForm.monto) || 0;
    if (base > 0) {
      if (finalVal > base) {
        finalVal = base;
      }
      const pct = Math.max(0, Math.min(100, Math.round(((base - finalVal) / base) * 100)));
      setPorcentajeDescuento(String(pct));
    }
    setImporteFinal(String(finalVal));
  };

  const abrirPago = (cliente: EstadoCuenta, periodo: PeriodoEstado) => {
    setClienteSeleccionado(cliente);
    setPeriodoSeleccionado(periodo);

    // Autocompletar el monto con el costo del plan asociado
    const precio = cliente.planPrecio ?? planes.find((pl) => pl.nombre === cliente.planNombre)?.precio;
    const montoInicial = precio !== undefined && precio !== null ? String(precio) : "";

    setPagoForm({
      monto: montoInicial,
      metodo: "Efectivo",
      nota: ""
    });
    setAplicaDescuento(false);
    setPorcentajeDescuento("");
    setImporteFinal(montoInicial);
    setModalOpen(true);
  };

  const handleRegistrarPago = async () => {
    if (!clienteSeleccionado || !periodoSeleccionado) return;

    const baseMonto = parseFloat(pagoForm.monto);
    if (isNaN(baseMonto) || baseMonto <= 0) {
      toast({
        variant: "destructive",
        title: "Monto inválido",
        description: "El monto base debe ser un número mayor a cero."
      });
      return;
    }

    let montoCobro = baseMonto;

    if (aplicaDescuento) {
      const final = parseFloat(importeFinal);
      if (isNaN(final) || final <= 0) {
        toast({
          variant: "destructive",
          title: "Importe final inválido",
          description: "El importe final con descuento debe ser mayor a cero."
        });
        return;
      }
      if (final > baseMonto) {
        toast({
          variant: "destructive",
          title: "Descuento inválido",
          description: "El importe final no puede ser mayor al monto original."
        });
        return;
      }
      montoCobro = final;
    }

    setSaving(true);
    try {
      const baseNota = `Cuota ${periodoSeleccionado.nombreMes}${clienteSeleccionado.planNombre ? ` - Plan ${clienteSeleccionado.planNombre}` : ""}`;
      const partesNota: string[] = [baseNota];
      if (pagoForm.nota.trim()) {
        partesNota.push(pagoForm.nota.trim());
      }
      if (aplicaDescuento && porcentajeDescuento) {
        partesNota.push(`Desc. ${porcentajeDescuento}% (Base: $${baseMonto.toLocaleString("es-AR")} → Final: $${montoCobro.toLocaleString("es-AR")})`);
      }
      const notaEnvio = partesNota.join(" | ");

      const res = await apiFetch("/api/pagos", {
        method: "POST",
        body: JSON.stringify({
          userId: clienteSeleccionado.userId,
          membresiaId: clienteSeleccionado.membresiaId ?? null,
          monto: montoCobro,
          metodo: pagoForm.metodo,
          nota: notaEnvio,
          concepto: "Cuota mensual",
          periodoMes: periodoSeleccionado.mes,
          periodoAnio: periodoSeleccionado.anio,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error al registrar el pago");
      }

      toast({
        variant: "success",
        title: "Pago registrado",
        description: `Pago de ${clienteSeleccionado.nombre} por $${montoCobro.toLocaleString("es-AR")} registrado para ${periodoSeleccionado.nombreMes}.`,
      });
      setModalOpen(false);
      cargar();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Intentá nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black">Estado de cuenta</h1>

      {/* Resumen clickeable */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "AlDia", label: "Al día", value: resumen.alDia, color: "text-green-600", hover: "hover:border-green-300" },
          { key: "PendienteMesActual", label: "Pendiente este mes", value: resumen.pendiente, color: "text-gray-600", hover: "hover:border-gray-300" },
          { key: "ConDeuda", label: "Con deuda", value: resumen.conDeuda, color: "text-red-600", hover: "hover:border-red-300" },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => setFiltroEstado(filtroEstado === item.key ? "Todos" : item.key)}
            className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${item.hover} ${filtroEstado === item.key ? "border-gray-400" : "border-gray-200"}`}
          >
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            {loading ? (
              <Skeleton className="h-7 w-10 rounded mt-0.5" />
            ) : (
              <p className={`text-2xl font-bold ${item.color} animate-fade-in-up`}>{item.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center">
        <Input
          placeholder="Buscar cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-xs"
        />
        {filtroEstado !== "Todos" && (
          <Button variant="ghost" onClick={() => setFiltroEstado("Todos")}>
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              {periodoHeaders.map((h) => (
                <TableHead key={h} className="text-center">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={3 + periodoHeaders.length} />
              ))
            ) : clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3 + periodoHeaders.length} className="text-center text-gray-500 py-8">
                  No hay clientes
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((c, i) => {
                const cfg = ESTADO_CONFIG[c.estadoGeneral];
                const debeRecordar = c.estadoGeneral === "ConDeuda" || c.estadoGeneral === "PendienteMesActual";
                const waUrl = debeRecordar
                  ? buildWhatsAppUrl(
                      c.telefono,
                      `Hola ${c.nombre.split(" ")[0]}! Te escribimos desde ${settings.nombreGimnasio ?? "el gimnasio"} para recordarte que tenés la cuota${c.estadoGeneral === "ConDeuda" ? " pendiente de meses anteriores" : " de este mes"} sin abonar. ¡Te esperamos!`
                    )
                  : null;
                return (
                  <TableRow
                    key={c.userId}
                    className="hover:bg-gray-50 animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-black">{c.nombre}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{c.planNombre ?? <span className="text-gray-400">—</span>}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.className}`}>
                          {cfg.label}
                        </span>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Recordar pago a ${c.nombre} por WhatsApp`}
                            title="Recordar pago por WhatsApp"
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    {c.periodos.map((p) => (
                      <TableCell key={`${p.mes}-${p.anio}`} className="text-center">
                        {p.pagado ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-gray-400">${p.monto?.toLocaleString()}</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => abrirPago(c, p)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal pago */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-gray-900">{clienteSeleccionado?.nombre}</span>
              {" — "}{periodoSeleccionado?.nombreMes}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {clienteSeleccionado?.planNombre && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/60 border border-border text-xs">
                <span className="text-muted-foreground">Plan asociado:</span>
                <span className="font-semibold text-foreground">
                  {clienteSeleccionado.planNombre}
                  {(clienteSeleccionado.planPrecio || planes.find((pl) => pl.nombre === clienteSeleccionado.planNombre)?.precio) && (
                    <span className="ml-1 text-emerald-600 font-bold">
                      (${Number(clienteSeleccionado.planPrecio ?? planes.find((pl) => pl.nombre === clienteSeleccionado.planNombre)?.precio).toLocaleString("es-AR")})
                    </span>
                  )}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montoBase">Monto original</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">$</span>
                  <Input
                    id="montoBase"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    className="pl-7"
                    value={pagoForm.monto}
                    onChange={(e) => handleMontoChange(e.target.value)}
                    onKeyDown={preventInvalidNumberKeys}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
                <Select
                  value={pagoForm.metodo}
                  onValueChange={(v) => setPagoForm((p) => ({ ...p, metodo: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METODOS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Checkbox Aplica Descuento */}
            <div className="pt-2 border-t border-border">
              <label
                htmlFor="checkDescuento"
                className="flex items-center gap-2.5 py-1 text-sm font-medium cursor-pointer select-none"
              >
                <input
                  id="checkDescuento"
                  type="checkbox"
                  checked={aplicaDescuento}
                  onChange={(e) => handleToggleDescuento(e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black cursor-pointer"
                />
                <span>Aplica descuento</span>
              </label>

              {aplicaDescuento && (
                <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pctDescuento" className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                        % Descuento
                      </Label>
                      <div className="relative">
                        <Input
                          id="pctDescuento"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="0"
                          className="bg-background pr-7 text-sm"
                          value={porcentajeDescuento}
                          onChange={(e) => handlePorcentajeChange(e.target.value)}
                          onKeyDown={preventInvalidNumberKeys}
                          disabled={saving}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="impFinal" className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                        Importe final
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">$</span>
                        <Input
                          id="impFinal"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          className="bg-background pl-7 text-sm font-bold text-emerald-600"
                          value={importeFinal}
                          onChange={(e) => handleImporteFinalChange(e.target.value)}
                          onKeyDown={preventInvalidNumberKeys}
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  {pagoForm.monto && importeFinal && (
                    <div className="flex justify-between items-center text-[11px] text-amber-900 dark:text-amber-300 font-medium pt-1.5 border-t border-amber-500/20">
                      <span>Ahorro del cliente:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        ${Math.max(0, (parseFloat(pagoForm.monto) || 0) - (parseFloat(importeFinal) || 0)).toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inputNota">Nota personalizada <span className="text-gray-400 font-normal text-xs">(opcional)</span></Label>
              <Input
                id="inputNota"
                placeholder="Ej: Pago en efectivo en recepción, abonó mitad y mitad..."
                value={pagoForm.nota}
                onChange={(e) => setPagoForm((p) => ({ ...p, nota: e.target.value }))}
                disabled={saving}
              />
              <div className="p-2.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Nota que se registrará: </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Cuota {periodoSeleccionado?.nombreMes}{clienteSeleccionado?.planNombre ? ` - Plan ${clienteSeleccionado.planNombre}` : ""}
                </span>
                {pagoForm.nota.trim() && (
                  <span className="text-foreground font-medium"> | {pagoForm.nota.trim()}</span>
                )}
                {aplicaDescuento && porcentajeDescuento && (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {" "}| Desc. {porcentajeDescuento}% (Base: ${parseFloat(pagoForm.monto || "0").toLocaleString("es-AR")} → Final: ${parseFloat(importeFinal || "0").toLocaleString("es-AR")})
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleRegistrarPago} loading={saving}>
              {saving ? "Registrando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}