import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import ClienteCombobox from "@/components/ui/client-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const METODOS = ["Efectivo", "Débito", "Crédito", "Transferencia"];

// Genera los últimos 3 meses + el actual
function generarPeriodos() {
  const hoy = new Date();
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    return {
      mes: d.getMonth() + 1,
      anio: d.getFullYear(),
      label: d.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
    };
  });
}

const PERIODOS = generarPeriodos();

interface User {
  id: string;
  nombre: string;
  apellido: string;
}

interface PagoResponse {
  id: number;
  clienteNombre: string;
  monto: number;
  metodo: string;
  fecha: string;
  nota?: string;
  periodoMes: number;
  periodoAnio: number;
}

interface FormState {
  userId: string;
  monto: string;
  metodo: string;
  nota: string;
  periodoMes: number;
  periodoAnio: number;
}

export default function Pagos() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagos, setPagos] = useState<PagoResponse[]>([]);
  const [form, setForm] = useState<FormState>({
    userId: "",
    monto: "",
    metodo: "",
    nota: "",
    periodoMes: PERIODOS[0].mes,
    periodoAnio: PERIODOS[0].anio,
  });
  const [loading, setLoading] = useState(false);
  const [pagosLoading, setPagosLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busquedaHistorial, setBusquedaHistorial] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchPagos();
  }, []);

  async function fetchUsers() {
    try {
      const res = await apiFetch("/api/usuarios?categoria=Cliente");
      const data = await res.json();
      setUsers(data);
    } catch {
      console.error("Error cargando usuarios");
    }
  }

  async function fetchPagos() {
    setPagosLoading(true);
    try {
      const res = await apiFetch("/api/pagos");
      const data = await res.json();
      setPagos(data);
    } catch {
      console.error("Error cargando pagos");
    } finally {
      setPagosLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!form.userId) return setError("Seleccioná un cliente.");
    if (!form.metodo) return setError("Seleccioná un método de pago.");
    if (!form.monto) return setError("Ingresá un monto.");

    setLoading(true);
    try {
      const res = await apiFetch("/api/pagos", {
        method: "POST",
        body: JSON.stringify({
          userId: form.userId,
          monto: parseFloat(form.monto),
          metodo: form.metodo,
          nota: form.nota.trim() || null,
          concepto: "Cuota mensual",
          periodoMes: form.periodoMes,
          periodoAnio: form.periodoAnio,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al registrar el pago");
      }

      setForm({
        userId: "",
        monto: "",
        metodo: "",
        nota: "",
        periodoMes: PERIODOS[0].mes,
        periodoAnio: PERIODOS[0].anio,
      });
      setSuccess(true);
      fetchPagos();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const pagosFiltrados = useMemo(() => {
    const q = busquedaHistorial.trim().toLowerCase();
    if (!q) return pagos;
    return pagos.filter((p) => p.clienteNombre.toLowerCase().includes(q));
  }, [pagos, busquedaHistorial]);

  const totalHoy = pagos
    .filter((p) => new Date(p.fecha).toDateString() === new Date().toDateString())
    .reduce((acc, p) => acc + p.monto, 0);

  const totalMes = pagos
    .filter((p) => {
      const hoy = new Date();
      return p.periodoMes === hoy.getMonth() + 1 && p.periodoAnio === hoy.getFullYear();
    })
    .reduce((acc, p) => acc + p.monto, 0);

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function formatMonto(n: number) {
    return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }

  function nombrePeriodo(mes: number, anio: number) {
    return new Date(anio, mes - 1, 1).toLocaleDateString("es-AR", {
      month: "long", year: "numeric",
    });
  }

  const metodoColor: Record<string, string> = {
    Efectivo: "bg-green-100 text-green-800",
    Débito: "bg-blue-100 text-blue-800",
    Crédito: "bg-purple-100 text-purple-800",
    Transferencia: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-black">Pagos</h1>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recaudado hoy</p>
          {pagosLoading ? (
            <Skeleton className="h-8 w-28 rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-semibold text-black animate-fade-in-up truncate">{formatMonto(totalHoy)}</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recaudado este mes</p>
          {pagosLoading ? (
            <Skeleton className="h-8 w-28 rounded mt-1" />
          ) : (
            <p className="text-xl sm:text-2xl font-semibold text-black animate-fade-in-up truncate">{formatMonto(totalMes)}</p>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Registrar pago</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Cliente</label>
            <ClienteCombobox
              clientes={users}
              value={form.userId}
              onChange={(id) => setForm((f) => ({ ...f, userId: id }))}
              placeholder="Buscá por nombre..."
            />
          </div>

          {/* Período */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Período</label>
            <Select
              value={`${form.periodoMes}-${form.periodoAnio}`}
              onValueChange={(val) => {
                const [mes, anio] = val.split("-").map(Number);
                setForm((f) => ({ ...f, periodoMes: mes, periodoAnio: anio }));
              }}
            >
              <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={`${p.mes}-${p.anio}`} value={`${p.mes}-${p.anio}`}>
                    {p.label}{p === PERIODOS[0] ? " (mes actual)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Método de pago</label>
            <Select
              value={form.metodo}
              onValueChange={(val) => setForm((f) => ({ ...f, metodo: val }))}
            >
              <SelectTrigger className="rounded-lg"><SelectValue placeholder="Seleccioná un método" /></SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Nota */}
        <div className="space-y-1">
          <label className="text-sm text-gray-600">
            Nota <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Ej: Pago de cuota de marzo, descuento aplicado..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            value={form.nota}
            onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Pago registrado correctamente.
          </div>
        )}

        <div className="pt-1">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-black text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Registrando..." : "Registrar pago"}
          </button>
        </div>
      </div>

      {/* Tabla historial */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-semibold text-black">Historial de pagos</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente..."
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              className="pl-9 rounded-lg h-9 text-sm"
            />
          </div>
        </div>

        {pagosLoading ? (
          <div className="px-6 py-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : pagos.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-8 text-center">
            No hay pagos registrados aún.
          </p>
        ) : pagosFiltrados.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-8 text-center">
            Ningún pago coincide con "{busquedaHistorial}".
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">Cliente</th>
                  <th className="text-left px-6 py-3 font-medium">Período</th>
                  <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">Nota</th>
                  <th className="text-left px-6 py-3 font-medium">Método</th>
                  <th className="text-right px-6 py-3 font-medium">Monto</th>
                  <th className="text-right px-6 py-3 font-medium">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagosFiltrados.map((p, i) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  >
                    <td className="px-6 py-3 text-black font-medium">{p.clienteNombre}</td>
                    <td className="px-6 py-3 text-gray-600 capitalize">
                      {nombrePeriodo(p.periodoMes, p.periodoAnio)}
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs hidden sm:table-cell max-w-[180px] truncate">
                      {p.nota || <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${metodoColor[p.metodo] ?? "bg-gray-100 text-gray-700"}`}>
                        {p.metodo}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-black">
                      {formatMonto(p.monto)}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">
                      {formatFecha(p.fecha)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}