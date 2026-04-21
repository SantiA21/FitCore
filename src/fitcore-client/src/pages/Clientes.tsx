import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Pencil, UserX, UserCheck, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
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
import { apiFetch } from "@/lib/api";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
};

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-14 rounded-lg" /></TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
    activo: true,
  });

  // Delete confirmation modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Cliente | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    apiFetch("/api/clientes")
      .then((res) => res.json())
      .then((data) => setClientes(data))
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
      telefono: c.telefono ?? "",
      email: c.email ?? "",
      activo: c.activo,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);

    const payload: Cliente = {
      ...editing,
      nombre: editForm.nombre,
      telefono: editForm.telefono,
      email: editForm.email,
      activo: editForm.activo,
    };

    try {
      const res = await apiFetch(`/api/clientes/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("PUT failed");

      setClientes((prev) =>
        prev.map((c) => (c.id === editing.id ? payload : c))
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
        const res = await apiFetch(`/api/clientes/${c.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("DELETE failed");
        setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: false } : x)));
        toast({ variant: "success", title: "Cliente desactivado", description: "El cliente quedó inactivo." });
      } else {
        const payload: Cliente = { ...c, activo: true };
        const res = await apiFetch(`/api/clientes/${c.id}`, {
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
      const res = await apiFetch(`/api/clientes/${deleting.id}/permanente`, { method: "DELETE" });
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

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black">Clientes</h1>
          <Button onClick={() => navigate("/clientes/nuevo")}>
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
            className="pl-10"
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha alta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
              ) : clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8 font-normal">
                    No hay clientes
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{c.nombre}</TableCell>
                    <TableCell>{c.telefono}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{new Date(c.fechaAlta).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={c.activo ? "success" : "danger"}>
                        {c.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">

                        {/* Editar */}
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

                        {/* Activar / Desactivar */}
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

                        {/* Eliminar permanentemente */}
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveEdit} disabled={saving}>
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
                disabled={deleteLoading}
              >
                {deleteLoading ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}