import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, UserX, UserCheck, Trash2, CalendarX, TrendingUp, Phone, Mail, Users, MessageCircle, HeartPulse } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PersonaAvatar from "@/components/ui/persona-avatar";
import { apiFetch } from "@/lib/api";
import { buildWhatsAppUrl } from "@/lib/utils";
import { useGymSettings } from "@/context/GymSettingsContext";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
  categoria: number;
  planId: number | null;
  planNombre: string | null;
  membresiaVence: string | null;
  aptoMedicoVence: string | null;
};

function estadoApto(fechaVence: string | null): { texto: string; className: string } | null {
  if (!fechaVence) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVence);
  if (vence.getTime() < hoy.getTime()) {
    return { texto: "Apto médico vencido", className: "text-red-500 font-semibold" };
  }
  return null;
}

type Plan = {
  id: number;
  nombre: string;
  precio: number;
};

function ClienteCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

function diasRestantes(fechaVence: string | null): { texto: string; urgente: boolean } | null {
  if (!fechaVence) return null;
  const hoy = new Date();
  const vence = new Date(fechaVence);
  const diff = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { texto: "Vencida", urgente: true };
  if (diff === 0) return { texto: "Vence hoy", urgente: true };
  if (diff === 1) return { texto: "Vence mañana", urgente: true };
  return { texto: `${diff} días`, urgente: diff <= 5 };
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    activo: true,
  });
  const [editPlanId, setEditPlanId] = useState<string>("");

  // Delete confirmation modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal dar de baja membresía
  const [bajaModalOpen, setBajaModalOpen] = useState(false);
  const [clienteBaja, setClienteBaja] = useState<Cliente | null>(null);
  const [motivoBaja, setMotivoBaja] = useState("Económico / Presupuesto");
  const [observacionBaja, setObservacionBaja] = useState("");
  const [procesandoBaja, setProcesandoBaja] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useGymSettings();

  useEffect(() => {
    Promise.all([
      apiFetch("/api/usuarios?categoria=Cliente").then((res) => res.json()),
      apiFetch("/api/planes").then((res) => res.json()),
    ])
      .then(([clientesData, planesData]) => {
        setClientes(clientesData);
        setPlanes(planesData);
      })
      .finally(() => setLoading(false));
  }, []);

  const clientesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [busqueda, clientes]);

  // ── Edit ────────────────────────────────────────────────
  const openEdit = (c: Cliente) => {
    setEditing(c);
    setEditForm({
      nombre: c.nombre ?? "",
      apellido: c.apellido ?? "",
      telefono: c.telefono ?? "",
      email: c.email ?? "",
      activo: c.activo,
    });
    setEditPlanId(c.planId ? String(c.planId) : "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);

    const payload = {
      nombre: editForm.nombre,
      apellido: editForm.apellido,
      telefono: editForm.telefono,
      email: editForm.email,
      activo: editForm.activo,
      categoria: editing.categoria ?? 2,
    };

    try {
      // 1. Actualizar datos del cliente
      const res = await apiFetch(`/api/usuarios/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PUT failed");

      let planIdFinal = editing.planId;
      let planNombreFinal = editing.planNombre;
      let membresiaVenceFinal = editing.membresiaVence;

      // 2. Eligió "Sin plan" y tenía uno → inactivar membresía
      if (!editPlanId && editing.planId) {
        const bajaRes = await apiFetch(`/api/membresias/${editing.id}/activa`, { method: "DELETE" });
        if (!bajaRes.ok) {
          toast({
            variant: "destructive",
            title: "Cliente actualizado, pero no se pudo quitar el plan",
            description: "Intentá nuevamente.",
          });
          setEditOpen(false);
          setEditing(null);
          return;
        }
        planIdFinal = null;
        planNombreFinal = null;
        membresiaVenceFinal = null;
      }

      // 3. Eligió un plan distinto al actual → crear nueva membresía
      if (editPlanId && editPlanId !== String(editing.planId)) {
        const membresiaRes = await apiFetch("/api/membresias", {
          method: "POST",
          body: JSON.stringify({ userId: editing.id, planId: parseInt(editPlanId) }),
        });
        if (!membresiaRes.ok) {
          toast({
            variant: "destructive",
            title: "Cliente actualizado, pero no se pudo asignar el plan",
            description: "Intentá asignar el plan nuevamente.",
          });
          setEditOpen(false);
          setEditing(null);
          return;
        }
        const membresiaData = await membresiaRes.json();
        planIdFinal = parseInt(editPlanId);
        planNombreFinal = planes.find((p) => p.id === parseInt(editPlanId))?.nombre ?? null;
        membresiaVenceFinal = membresiaData.fechaFin;
      }

      // 4. Actualizar estado local
      setClientes((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? { ...c, ...payload, planId: planIdFinal, planNombre: planNombreFinal, membresiaVence: membresiaVenceFinal }
            : c
        )
      );

      setEditOpen(false);
      setEditing(null);
      toast({ variant: "success", title: "Cliente actualizado", description: "Los cambios se guardaron correctamente." });
    } catch {
      toast({ variant: "destructive", title: "No se pudo actualizar", description: "Intentá nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo ────────────────────────────────────────
  const handleToggleActivo = async (c: Cliente) => {
    setTogglingId(c.id);
    try {
      if (c.activo) {
        const res = await apiFetch(`/api/usuarios/${c.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("DELETE failed");
        setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: false } : x)));
        toast({ variant: "success", title: "Cliente desactivado", description: "El cliente quedó inactivo." });
      } else {
        const payload = { ...c, activo: true };
        const res = await apiFetch(`/api/usuarios/${c.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("PUT failed");
        setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: true } : x)));
        toast({ variant: "success", title: "Cliente reactivado", description: "El cliente quedó activo." });
      }
    } catch {
      toast({ variant: "destructive", title: "Acción fallida", description: "No se pudo completar la operación." });
    } finally {
      setTogglingId(null);
    }
  };

  // ── Hard delete ──────────────────────────────────────────
  const openDelete = (c: Cliente) => {
    setDeleting(c);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/api/usuarios/${deleting.id}/permanente`, { method: "DELETE" });
      if (!res.ok) throw new Error("DELETE failed");
      setClientes((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleteOpen(false);
      setDeleting(null);
      toast({ variant: "success", title: "Cliente eliminado", description: "El cliente fue eliminado permanentemente." });
    } catch {
      toast({ variant: "destructive", title: "No se pudo eliminar", description: "Intentá nuevamente." });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openBaja = (cliente: Cliente) => {
    setClienteBaja(cliente);
    setMotivoBaja("Económico / Presupuesto");
    setObservacionBaja("");
    setBajaModalOpen(true);
  };

  const handleConfirmarBaja = async () => {
    if (!clienteBaja) return;
    setProcesandoBaja(true);
    try {
      const res = await apiFetch(`/api/membresias/${clienteBaja.id}/cancelar`, {
        method: "POST",
        body: JSON.stringify({
          motivo: motivoBaja,
          observaciones: observacionBaja.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al dar de baja la membresía");
      }

      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteBaja.id
            ? { ...c, planId: null, planNombre: null, membresiaVence: null }
            : c
        )
      );

      toast({
        variant: "success",
        title: "Membresía dada de baja",
        description: `Se canceló la membresía de ${clienteBaja.nombre} ${clienteBaja.apellido}.`,
      });
      setBajaModalOpen(false);
      setClienteBaja(null);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error al cancelar",
        description: err instanceof Error ? err.message : "Intentá nuevamente.",
      });
    } finally {
      setProcesandoBaja(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Clientes</h1>
            {loading ? (
              <Skeleton className="h-4 w-24 rounded mt-1.5" />
            ) : (
              <p className="text-sm text-gray-500 font-medium mt-1">
                {`${clientesFiltrados.length} ${clientesFiltrados.length === 1 ? "cliente" : "clientes"}`}
              </p>
            )}
          </div>
          <Button onClick={() => navigate("/clientes/nuevo")} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <ClienteCardSkeleton key={i} />)}
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-700">No hay clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clientesFiltrados.map((c, i) => {
              const d = diasRestantes(c.membresiaVence);
              const apto = estadoApto(c.aptoMedicoVence);
              const waUrl = buildWhatsAppUrl(
                c.telefono,
                `Hola ${c.nombre}! Te escribimos desde ${settings.nombreGimnasio ?? "el gimnasio"}.`
              );
              return (
                <div
                  key={c.id}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <PersonaAvatar seed={c.id} size={44} />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{c.nombre} {c.apellido}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Alta: {new Date(c.fechaAlta).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={c.activo ? "success" : "danger"} className="shrink-0">
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate flex-1">{c.telefono || "Sin teléfono"}</span>
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Contactar por WhatsApp"
                          className="shrink-0 text-emerald-600 hover:text-emerald-700"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    {apto && (
                      <div className={`flex items-center gap-2 text-[11px] ${apto.className}`}>
                        <HeartPulse className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{apto.texto}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="min-h-4">
                      {c.planNombre ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <p className="text-xs font-bold text-gray-700">{c.planNombre}</p>
                          {d && (
                            <span className={`text-[11px] font-semibold ${d.urgente ? "text-red-500" : "text-gray-400"}`}>
                              {d.texto}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Sin plan</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(c)}
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => navigate(`/clientes/${c.id}/progreso`)}
                            aria-label="Ver progreso"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Progreso y rutina</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleActivo(c)}
                            disabled={togglingId === c.id}
                            aria-label={c.activo ? "Desactivar" : "Reactivar"}
                          >
                            {c.activo
                              ? <UserX className="h-4 w-4" />
                              : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{c.activo ? "Desactivar" : "Reactivar"}</TooltipContent>
                      </Tooltip>

                      {c.planNombre && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button" variant="ghost" size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => openBaja(c)}
                              aria-label="Dar de baja membresía"
                            >
                              <CalendarX className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Dar de baja membresía</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button" variant="ghost" size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => openDelete(c)}
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal edición ── */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar cliente</DialogTitle>
              <DialogDescription>Actualizá los datos y guardá los cambios.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre</Label>
                <Input
                  id="edit-nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado</Label>
                <Select
                  value={editForm.activo ? "activo" : "inactivo"}
                  onValueChange={(val) => setEditForm((p) => ({ ...p, activo: val === "activo" }))}
                  disabled={saving}
                >
                  <SelectTrigger id="edit-estado"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Plan opcional */}
              <div className="space-y-2">
                <Label htmlFor="edit-plan">
                  Plan{" "}
                  {editing?.planNombre && (
                    <span className="text-gray-400 font-normal text-sm">
                      (actual: {editing.planNombre})
                    </span>
                  )}
                </Label>
                <Select
                  value={editPlanId || "ninguno"}
                  onValueChange={(val) => setEditPlanId(val === "ninguno" ? "" : val)}
                  disabled={saving || planes.length === 0}
                >
                  <SelectTrigger id="edit-plan">
                    <SelectValue placeholder="Sin plan asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin plan</SelectItem>
                    {planes.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.nombre} — ${p.precio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editPlanId && editPlanId !== String(editing?.planId) && (
                  <p className="text-xs text-amber-600">
                    Se creará una nueva membresía activa con este plan.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveEdit} loading={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Modal confirmación eliminar ── */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar cliente</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que querés eliminar a{" "}
                <span className="font-medium text-gray-900">{deleting?.nombre}</span>?
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                type="button" variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleteLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button" variant="destructive"
                onClick={handleConfirmDelete}
                loading={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Modal Dar de Baja Membresía ── */}
        <Dialog open={bajaModalOpen} onOpenChange={setBajaModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <CalendarX className="h-5 w-5" />
                Dar de baja membresía
              </DialogTitle>
              <DialogDescription>
                {clienteBaja && (
                  <span>
                    Estás por cancelar la membresía activa de{" "}
                    <strong>{clienteBaja.nombre} {clienteBaja.apellido}</strong> (Plan actual:{" "}
                    <strong className="text-foreground">{clienteBaja.planNombre}</strong>).
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="motivo-baja">Motivo de la baja</Label>
                <Select
                  value={motivoBaja}
                  onValueChange={setMotivoBaja}
                  disabled={procesandoBaja}
                >
                  <SelectTrigger id="motivo-baja">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Económico / Presupuesto">Económico / Presupuesto</SelectItem>
                    <SelectItem value="Falta de tiempo / Horarios">Falta de tiempo / Horarios</SelectItem>
                    <SelectItem value="Lesión o motivos de salud">Lesión o motivos de salud</SelectItem>
                    <SelectItem value="Mudanza o distancia al gimnasio">Mudanza o distancia al gimnasio</SelectItem>
                    <SelectItem value="Disconformidad con el servicio">Disconformidad con el servicio</SelectItem>
                    <SelectItem value="Otro motivo">Otro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-baja">
                  Observaciones adicionales <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                </Label>
                <Input
                  id="obs-baja"
                  placeholder="Detalles sobre la baja, comentarios del cliente..."
                  value={observacionBaja}
                  onChange={(e) => setObservacionBaja(e.target.value)}
                  disabled={procesandoBaja}
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                La membresía quedará cancelada a partir de hoy y el cliente figurará sin plan activo. El historial de pagos anteriores se preserva intacto.
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBajaModalOpen(false)}
                disabled={procesandoBaja}
              >
                Volver
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmarBaja}
                loading={procesandoBaja}
              >
                {procesandoBaja ? "Procesando..." : "Confirmar baja"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}
