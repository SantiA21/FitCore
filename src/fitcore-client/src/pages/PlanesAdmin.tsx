import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { apiFetch } from "@/lib/api";

type Plan = {
  id: number;
  nombre: string;
  precio: number;
  duracionEnDias: number;
  activo: boolean;
};

const emptyForm = { nombre: "", precio: "", duracionEnDias: "" };

function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-14 rounded-lg" /></TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function PlanesAdmin() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal crear / editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Modal eliminar
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    apiFetch("/api/planes")
      .then((r) => r.json())
      .then((data) => setPlanes(data))
      .finally(() => setLoading(false));
  }, []);

  // ── Abrir modal ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      precio: String(p.precio),
      duracionEnDias: String(p.duracionEnDias),
    });
    setModalOpen(true);
  };

  // ── Guardar (crear o editar) ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    const body = {
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      duracionEnDias: parseInt(form.duracionEnDias),
      activo: true,
      gymId: "00000000-0000-0000-0000-000000000000", // placeholder SaaS
    };

    try {
      if (editing) {
        const res = await apiFetch(`/api/planes/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...body, id: editing.id }),
        });
        if (!res.ok) throw new Error();
        setPlanes((prev) =>
          prev.map((p) =>
            p.id === editing.id
              ? { ...p, ...body, id: editing.id }
              : p
          )
        );
        toast({ variant: "success", title: "Plan actualizado" });
      } else {
        const res = await apiFetch("/api/planes", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        const nuevo = await res.json();
        setPlanes((prev) => [...prev, nuevo]);
        toast({ variant: "success", title: "Plan creado" });
      }
      setModalOpen(false);
    } catch {
      toast({ variant: "destructive", title: "No se pudo guardar", description: "Intentá nuevamente." });
    } finally {
      setSaving(false);
    }
  };

  // ── Eliminar (soft delete) ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/api/planes/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPlanes((prev) =>
        prev.map((p) => (p.id === deleting.id ? { ...p, activo: false } : p))
      );
      setDeleteOpen(false);
      setDeleting(null);
      toast({ variant: "success", title: "Plan desactivado" });
    } catch {
      toast({ variant: "destructive", title: "No se pudo desactivar" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-black">Planes</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} />)
            ) : planes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8 font-normal">
                  No hay planes creados
                </TableCell>
              </TableRow>
            ) : (
              planes.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>${p.precio.toLocaleString("es-AR")}</TableCell>
                  <TableCell>{p.duracionEnDias} días</TableCell>
                  <TableCell>
                    <Badge variant={p.activo ? "success" : "danger"}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(p)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setDeleting(p); setDeleteOpen(true); }}
                        disabled={!p.activo}
                        aria-label="Desactivar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Modal crear / editar ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar plan" : "Nuevo plan"}</DialogTitle>
            <DialogDescription>
              {editing ? "Modificá los datos del plan." : "Completá los datos para crear un nuevo plan."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej: Plan Mensual"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio</Label>
              <Input
                id="precio"
                type="number"
                min="0"
                placeholder="Ej: 5000"
                value={form.precio}
                onChange={(e) => setForm((p) => ({ ...p, precio: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracion">Duración (días)</Label>
              <Input
                id="duracion"
                type="number"
                min="1"
                placeholder="Ej: 30"
                value={form.duracionEnDias}
                onChange={(e) => setForm((p) => ({ ...p, duracionEnDias: e.target.value }))}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.nombre || !form.precio || !form.duracionEnDias}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal confirmar desactivar ── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar plan</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés desactivar{" "}
              <span className="font-medium text-gray-900">{deleting?.nombre}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
