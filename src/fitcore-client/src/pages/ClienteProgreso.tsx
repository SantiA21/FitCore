import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Dumbbell, Plus, Save, Scale, Trash2, ImageOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

interface Medicion {
  id: number;
  fecha: string;
  pesoKg: number;
  nota: string | null;
  fotoFrenteBase64: string | null;
  fotoPerfilBase64: string | null;
}

interface RutinaDia {
  diaSemana: number;
  descripcion: string;
}

interface ClienteBasico {
  id: string;
  nombre: string;
  apellido: string;
}

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MAX_FOTO_BYTES = 5 * 1024 * 1024;

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ClienteProgreso() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cliente, setCliente] = useState<ClienteBasico | null>(null);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [rutina, setRutina] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [guardandoRutina, setGuardandoRutina] = useState(false);

  // Form nueva medición
  const [fecha, setFecha] = useState(hoyISO());
  const [peso, setPeso] = useState("");
  const [nota, setNota] = useState("");
  const [fotoFrente, setFotoFrente] = useState<string | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [guardandoMedicion, setGuardandoMedicion] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/usuarios/${userId}`).then((r) => (r.ok ? r.json() : null)),
      apiFetch(`/api/mediciones/cliente/${userId}`).then((r) => (r.ok ? r.json() : [])),
      apiFetch(`/api/rutinas/cliente/${userId}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([c, m, r]: [ClienteBasico | null, Medicion[], RutinaDia[]]) => {
        setCliente(c);
        setMediciones(m);
        const mapa: Record<number, string> = {};
        r.forEach((d) => (mapa[d.diaSemana] = d.descripcion));
        setRutina(mapa);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FOTO_BYTES) {
      toast({ variant: "destructive", title: "Foto muy pesada", description: "El máximo es 5MB por imagen." });
      e.target.value = "";
      return;
    }
    setter(await fileToBase64(file));
  };

  const handleAgregarMedicion = async (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = parseFloat(peso);
    if (!pesoNum || pesoNum <= 0) {
      toast({ variant: "destructive", title: "Peso inválido", description: "Ingresá un peso válido en kg." });
      return;
    }

    setGuardandoMedicion(true);
    try {
      const res = await apiFetch(`/api/mediciones/cliente/${userId}`, {
        method: "POST",
        body: JSON.stringify({
          fecha,
          pesoKg: pesoNum,
          nota: nota.trim() || null,
          fotoFrenteBase64: fotoFrente,
          fotoPerfilBase64: fotoPerfil,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.mensaje ?? "No se pudo guardar la medición.");
      }
      const nueva: Medicion = await res.json();
      setMediciones((prev) => [...prev, nueva].sort((a, b) => a.fecha.localeCompare(b.fecha)));
      setPeso("");
      setNota("");
      setFotoFrente(null);
      setFotoPerfil(null);
      setFecha(hoyISO());
      toast({ variant: "success", title: "Medición guardada", description: "Ya se ve en el progreso del cliente." });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Intentá de nuevo." });
    } finally {
      setGuardandoMedicion(false);
    }
  };

  const handleEliminarMedicion = async (id: number) => {
    const prev = mediciones;
    setMediciones((m) => m.filter((x) => x.id !== id));
    const res = await apiFetch(`/api/mediciones/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setMediciones(prev);
      toast({ variant: "destructive", title: "No se pudo eliminar la medición" });
    }
  };

  const handleGuardarRutina = async () => {
    setGuardandoRutina(true);
    try {
      const dias = Object.entries(rutina).map(([dia, descripcion]) => ({
        diaSemana: Number(dia),
        descripcion,
      }));
      const res = await apiFetch(`/api/rutinas/cliente/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ dias }),
      });
      if (!res.ok) throw new Error();
      toast({ variant: "success", title: "Rutina guardada", description: "El cliente ya la ve en su portal." });
    } catch {
      toast({ variant: "destructive", title: "No se pudo guardar la rutina" });
    } finally {
      setGuardandoRutina(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-12 w-64 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <button
          onClick={() => navigate("/clientes")}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center gap-1.5 mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a Clientes
        </button>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Scale className="w-7 h-7 text-orange-600" />
          Progreso de {cliente ? `${cliente.nombre} ${cliente.apellido}` : "..."}
        </h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          Cargá el peso, fotos y la rutina semanal — el cliente lo ve al instante en su portal.
        </p>
      </div>

      {/* ── Nueva medición ── */}
      <form onSubmit={handleAgregarMedicion} className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Plus className="w-5 h-5 text-orange-600" />
          <h2 className="text-base font-bold text-gray-900">Nueva medición</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Peso (kg)</Label>
            <Input
              type="number" step="0.1" min="1" max="500" placeholder="Ej: 78.5"
              value={peso} onChange={(e) => setPeso(e.target.value)} required className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Nota (opcional)</Label>
            <Input placeholder="Ej: post-vacaciones" value={nota} onChange={(e) => setNota(e.target.value)} className="rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Foto de frente (opcional, máx. 5MB)
            </Label>
            <Input type="file" accept="image/*" onChange={(e) => handleFoto(e, setFotoFrente)} className="rounded-xl text-xs" />
            {fotoFrente && <img src={fotoFrente} alt="preview" className="h-20 rounded-xl object-cover mt-1" />}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Foto de perfil (opcional, máx. 5MB)
            </Label>
            <Input type="file" accept="image/*" onChange={(e) => handleFoto(e, setFotoPerfil)} className="rounded-xl text-xs" />
            {fotoPerfil && <img src={fotoPerfil} alt="preview" className="h-20 rounded-xl object-cover mt-1" />}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={guardandoMedicion} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-10 px-5">
            {guardandoMedicion ? "Guardando..." : "Guardar medición"}
          </Button>
        </div>
      </form>

      {/* ── Historial ── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Historial de mediciones</h2>
        </div>
        {mediciones.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Todavía no hay mediciones cargadas.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {[...mediciones].reverse().map((m) => (
              <div key={m.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/60">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[m.fotoFrenteBase64, m.fotoPerfilBase64].map((foto, i) =>
                      foto ? (
                        <img key={i} src={foto} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white" />
                      ) : (
                        <div key={i} className="w-10 h-10 rounded-xl bg-gray-100 border-2 border-white flex items-center justify-center">
                          <ImageOff className="w-4 h-4 text-gray-300" />
                        </div>
                      )
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{m.pesoKg} kg</p>
                    <p className="text-xs text-gray-400">
                      {m.fecha} {m.nota && `· ${m.nota}`}
                    </p>
                  </div>
                </div>
                <Button
                  type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50"
                  onClick={() => handleEliminarMedicion(m.id)} aria-label="Eliminar medición"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Rutina semanal ── */}
      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-900">Rutina semanal</h2>
          </div>
          <Button onClick={handleGuardarRutina} disabled={guardandoRutina} className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 px-4">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {guardandoRutina ? "Guardando..." : "Guardar rutina"}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NOMBRES_DIA.map((nombre, idx) => (
            <div key={idx} className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">{nombre}</Label>
              <Input
                placeholder="Ej: Pecho y tríceps, o dejar vacío para descanso"
                value={rutina[idx] ?? ""}
                onChange={(e) => setRutina((prev) => ({ ...prev, [idx]: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
