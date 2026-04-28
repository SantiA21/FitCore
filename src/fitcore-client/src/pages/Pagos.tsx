import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:5192/api";

const METODOS = ["Efectivo", "Débito", "Crédito", "Transferencia"];

interface User {
  id: string;
  nombre: string;
  apellido: string;
}

interface MembresiaOption {
  id: number;
  planNombre: string;
  fechaFin: string;
}

interface PagoResponse {
  id: number;
  clienteNombre: string;
  monto: number;
  metodo: string;
  fecha: string;
  nota?: string;
}

interface FormState {
  userId: string;
  membresiaId: string;
  monto: string;
  metodo: string;
  nota: string;
}

export default function Pagos() {
  const { token } = useAuth();
  const authHeaders = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
  const [users, setUsers] = useState<User[]>([]);
  const [membresias, setMembresias] = useState<MembresiaOption[]>([]);
  const [pagos, setPagos] = useState<PagoResponse[]>([]);
  const [form, setForm] = useState<FormState>({
    userId: "",
    membresiaId: "",
    monto: "",
    metodo: "",
    nota: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingMembresias, setLoadingMembresias] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPagos();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch(`${API_BASE}/Clientes`, { headers: authHeaders });
      const data = await res.json();
      setUsers(data);
    } catch {
      console.error("Error cargando usuarios");
    }
  }

  async function fetchPagos() {
    try {
      const res = await fetch(`${API_BASE}/Pagos`, { headers: authHeaders });
      const data = await res.json();
      setPagos(data);
    } catch {
      console.error("Error cargando pagos");
    }
  }

  async function fetchMembresias(userId: string) {
    if (!userId) {
      setMembresias([]);
      return;
    }
    setLoadingMembresias(true);
    try {
      const res = await fetch(`${API_BASE}/Membresias/usuario/${userId}`, { headers: authHeaders });
      const data = await res.json();
      setMembresias(data);
    } catch {
      setMembresias([]);
    } finally {
      setLoadingMembresias(false);
    }
  }

  function handleUserChange(userId: string) {
    setForm((f) => ({ ...f, userId, membresiaId: "", monto: "" }));
    fetchMembresias(userId);
  }

  function handleMembresiaChange(membresiaId: string) {
    setForm((f) => ({ ...f, membresiaId, monto: "" }));
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(false);

    if (!form.userId) return setError("Seleccioná un cliente.");
    if (!form.metodo) return setError("Seleccioná un método de pago.");
    if (!form.membresiaId && !form.monto)
      return setError("Ingresá un monto o seleccioná una membresía.");

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        userId: form.userId,
        metodo: form.metodo,
      };
      if (form.membresiaId) body.membresiaId = Number(form.membresiaId);
      if (form.monto) body.monto = parseFloat(form.monto);
      if (form.nota.trim()) body.nota = form.nota.trim();

      const res = await fetch(`${API_BASE}/Pagos`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Error al registrar el pago");
      }

      setForm({ userId: "", membresiaId: "", monto: "", metodo: "", nota: "" });
      setMembresias([]);
      setSuccess(true);
      fetchPagos();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const totalHoy = pagos
    .filter((p) => new Date(p.fecha).toDateString() === new Date().toDateString())
    .reduce((acc, p) => acc + p.monto, 0);

  const totalMes = pagos
    .filter((p) => {
      const d = new Date(p.fecha);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, p) => acc + p.monto, 0);

  function formatFecha(iso: string) {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMonto(n: number) {
    return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recaudado hoy</p>
          <p className="text-2xl font-semibold text-black">{formatMonto(totalHoy)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Recaudado este mes</p>
          <p className="text-2xl font-semibold text-black">{formatMonto(totalMes)}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-black">Registrar pago</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cliente */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Cliente</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              value={form.userId}
              onChange={(e) => handleUserChange(e.target.value)}
            >
              <option value="">— Seleccioná un cliente —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} {u.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Método */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Método de pago</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              value={form.metodo}
              onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))}
            >
              <option value="">— Seleccioná un método —</option>
              {METODOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Membresía */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">
              Membresía{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/10 disabled:opacity-40"
              value={form.membresiaId}
              onChange={(e) => handleMembresiaChange(e.target.value)}
              disabled={!form.userId || loadingMembresias}
            >
              <option value="">— Sin membresía —</option>
              {membresias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.planNombre} · vence {new Date(m.fechaFin).toLocaleDateString("es-AR")}
                </option>
              ))}
            </select>
            {loadingMembresias && (
              <p className="text-xs text-gray-400">Cargando membresías...</p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <label className="text-sm text-gray-600">
              Monto{" "}
              {form.membresiaId && (
                <span className="text-gray-400 font-normal">
                  (se toma del plan si no se completa)
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                $
              </span>
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
            Nota{" "}
            <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Ej: Pago de cuota de marzo, descuento aplicado..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            value={form.nota}
            onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
          />
        </div>

        {/* Feedback */}
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
            className="bg-black text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Registrar pago"}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-black">Historial de pagos</h2>
        </div>

        {pagos.length === 0 ? (
          <p className="text-sm text-gray-400 px-6 py-8 text-center">
            No hay pagos registrados aún.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3 font-medium">Cliente</th>
                  <th className="text-left px-6 py-3 font-medium hidden sm:table-cell">Nota</th>
                  <th className="text-left px-6 py-3 font-medium">Método</th>
                  <th className="text-right px-6 py-3 font-medium">Monto</th>
                  <th className="text-right px-6 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-black font-medium">{p.clienteNombre}</td>
                    <td className="px-6 py-3 text-gray-400 text-xs hidden sm:table-cell max-w-[180px] truncate">
                      {p.nota || <span className="text-gray-200">—</span>}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          metodoColor[p.metodo] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
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
