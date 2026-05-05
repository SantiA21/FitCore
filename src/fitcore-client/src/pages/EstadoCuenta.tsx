import { useEffect, useState, useMemo } from "react";
import { Plus, Check, X } from "lucide-react";
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

type EstadoCuenta = {
  userId: string;
  nombre: string;
  email: string;
  planNombre: string | null;
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
  const [clientes, setClientes] = useState<EstadoCuenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("Todos");
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

  const { toast } = useToast();

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/pagos/estado-cuenta").then((r) => r.json());
      setClientes(data);
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

  const abrirPago = (cliente: EstadoCuenta, periodo: PeriodoEstado) => {
    setClienteSeleccionado(cliente);
    setPeriodoSeleccionado(periodo);
    setPagoForm({ monto: "", metodo: "Efectivo", nota: "" });
    setModalOpen(true);
  };

  const handleRegistrarPago = async () => {
    if (!clienteSeleccionado || !periodoSeleccionado || !pagoForm.monto) {
      toast({ variant: "destructive", title: "Ingresá un monto" });
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/pagos", {
        method: "POST",
        body: JSON.stringify({
          userId: clienteSeleccionado.userId,
          monto: parseFloat(pagoForm.monto),
          metodo: pagoForm.metodo,
          nota: pagoForm.nota || null,
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
        description: `Pago de ${clienteSeleccionado.nombre} para ${periodoSeleccionado.nombreMes} registrado.`,
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
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
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
              clientesFiltrados.map((c) => {
                const cfg = ESTADO_CONFIG[c.estadoGeneral];
                return (
                  <TableRow key={c.userId} className="hover:bg-gray-50">
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
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${cfg.className}`}>
                        {cfg.label}
                      </span>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm((p) => ({ ...p, monto: e.target.value }))}
                  disabled={saving}
                />
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
            <div className="space-y-2">
              <Label>Nota <span className="text-gray-400 font-normal text-sm">(opcional)</span></Label>
              <Input
                placeholder="Ej: Pago en efectivo en recepción..."
                value={pagoForm.nota}
                onChange={(e) => setPagoForm((p) => ({ ...p, nota: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleRegistrarPago} disabled={saving}>
              {saving ? "Registrando..." : "Registrar pago"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}