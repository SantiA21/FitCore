import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Calendar,
  CreditCard,
  Clock,
  ArrowRight,
  Sparkles,
  Dumbbell,
  AlertCircle,
  TrendingUp,
  MapPin,
  Bell,
  Users,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface MiMembresia {
  id: number;
  planId: number;
  planNombre: string;
  planPrecio: number;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
}

interface AsistenciaItem {
  id: number;
  fecha: string;
  horaIngreso: string;
}

export default function DashboardCliente() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [membresia, setMembresia] = useState<MiMembresia | null>(null);
  const [asistencias, setAsistencias] = useState<AsistenciaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      apiFetch("/api/membresias/mi-membresia").then((r) => (r.ok ? r.json() : null)),
      apiFetch("/api/asistencias/mis-asistencias").then((r) => (r.ok ? r.json() : []))
    ]).then(([resMem, resAsis]) => {
      if (resMem.status === "fulfilled" && resMem.value) {
        setMembresia(resMem.value);
      }
      if (resAsis.status === "fulfilled" && Array.isArray(resAsis.value)) {
        setAsistencias(resAsis.value);
      }
      setLoading(false);
    });
  }, []);

  // Calcular días restantes
  const diasRestantes = membresia
    ? Math.max(0, Math.ceil((new Date(membresia.fechaFin).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const membresiaActiva = membresia && diasRestantes > 0;

  // Asistencias este mes
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  const asistenciasMes = asistencias.filter((a) => {
    const f = new Date(a.fecha);
    return f.getMonth() === mesActual && f.getFullYear() === anioActual;
  });

  const ultimaAsistencia = asistencias.length > 0 ? asistencias[0] : null;

  const anuncios = [
    {
      id: 1,
      titulo: "¡Nueva zona de pesas libres habilitada!",
      detalle: "Incorporamos mancuernas de hasta 40kg, dos nuevos bancos regulables y racks olímpicos.",
      fecha: "Hace 2 días",
      tag: "Equipamiento"
    },
    {
      id: 2,
      titulo: "Mantenimiento y lubricación de poleas",
      detalle: "Se realizó el service preventivo de todas las estaciones de poleas y cables de la sala.",
      fecha: "Esta semana",
      tag: "Mantenimiento"
    },
    {
      id: 3,
      titulo: "Horarios para el próximo feriado",
      detalle: "La sala de musculación y cardio abrirá en horario especial de 09:00 a 14:00 hs.",
      fecha: "Importante",
      tag: "Horarios"
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── 1. Header de bienvenida ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              ¡Hola, {user?.nombre || "Atleta"}!
            </h1>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            Bienvenido a tu panel de FitCore. Tu constancia forja tus resultados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/mis-asistencias")}
            variant="outline"
            className="rounded-2xl text-xs font-semibold h-11 px-4 cursor-pointer"
          >
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            Mis Asistencias
          </Button>
          <Button
            onClick={() => navigate("/mi-membresia")}
            className="rounded-2xl text-xs font-bold h-11 px-5 bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 cursor-pointer"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {membresiaActiva ? "Gestionar Plan" : "Activar Membresía"}
          </Button>
        </div>
      </div>

      {/* ── 2. Banner de Estado de Membresía ── */}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-3xl" />
      ) : membresiaActiva ? (
        <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 border-emerald-400/30 text-xs font-bold">
                  Membresía Activa
                </Badge>
                <span className="text-xs text-zinc-400 font-medium">
                  {membresia?.planNombre}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Te quedan {diasRestantes} {diasRestantes === 1 ? "día" : "días"} de entrenamiento
              </h2>
              <p className="text-xs text-zinc-400">
                Válida hasta el{" "}
                <span className="text-zinc-200 font-semibold">
                  {new Date(membresia!.fechaFin).toLocaleDateString("es-AR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                . Podés renovar con antelación para no interrumpir tu acceso al gimnasio.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => navigate("/mi-membresia")}
                className="bg-white hover:bg-gray-100 text-zinc-900 font-bold text-xs h-11 px-5 rounded-2xl cursor-pointer"
              >
                Ver recibos y pagos
                <ArrowRight className="w-4 h-4 ml-2 text-zinc-700" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">No contás con una membresía activa</h3>
              <p className="text-xs text-amber-800/80 mt-1 max-w-xl">
                Para ingresar a la sala de musculación necesitás activar tu cuota.
                Aboná de forma segura con Mercado Pago, Tarjeta o Transferencia.
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/mi-membresia")}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-11 px-6 rounded-2xl shrink-0 cursor-pointer shadow-sm"
          >
            Elegir mi Plan
          </Button>
        </div>
      )}

      {/* ── 3. Métricas rápidas del Socio ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Entrenamientos del mes */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asistencias del Mes</p>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded mt-0.5" />
            ) : (
              <p className="text-2xl font-black text-gray-900 mt-0.5 animate-fade-in-up">
                {asistenciasMes.length} <span className="text-xs font-medium text-gray-500">visitas</span>
              </p>
            )}
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> ¡Excelente constancia!
            </p>
          </div>
        </div>

        {/* Última visita */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Último Entrenamiento</p>
            {loading ? (
              <Skeleton className="h-6 w-24 rounded mt-0.5" />
            ) : (
              <p className="text-lg font-bold text-gray-900 mt-0.5 truncate animate-fade-in-up">
                {ultimaAsistencia ? `${ultimaAsistencia.fecha}` : "Aún sin registros"}
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-1">
              {loading ? "" : ultimaAsistencia ? `Ingreso: ${ultimaAsistencia.horaIngreso.slice(0, 5)} hs` : "¡Vení a entrenar hoy!"}
            </p>
          </div>
        </div>

        {/* Sede y Equipamiento */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sala de Musculación</p>
            <p className="text-base font-bold text-gray-900 mt-0.5 truncate">
              {membresia?.planNombre || "Pase Libre"}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> Sede Central • Lun a Vie hasta 23hs
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Grilla de 2 Columnas: Horarios / Concurrencia de Sala y Novedades ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Horarios y Concurrencia de Sala de Musculación */}
        <div className="lg:col-span-7 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <h3 className="text-base font-bold text-gray-900">Horarios de Sala y Concurrencia</h3>
              </div>
              <p className="text-xs text-gray-400">Planificá tu entrenamiento para encontrar máquinas y bancos libres</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Abierto ahora
            </span>
          </div>

          {/* Horarios habituales de apertura */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Lunes a Viernes</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">07:00 — 23:00 hs</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Horario corrido</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sábados</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">09:00 — 20:00 hs</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Tarde completa</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Domingos y Feriados</p>
              <p className="text-sm font-black text-gray-900 mt-0.5">09:00 — 14:00 hs</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Turno mañana</p>
            </div>
          </div>

          {/* Termómetro de Concurrencia de la Sala de Pesas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Afluencia estimada por franja horaria
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-900">10:00 - 16:30 hs</span>
                  <p className="text-[11px] text-emerald-700/90 font-semibold">Tranquilo • Bancos y racks libres</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-900">07:00 - 09:30 hs</span>
                  <p className="text-[11px] text-blue-700/90 font-semibold">Moderado • Flujo dinámico</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              </div>

              <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-900">18:00 - 20:30 hs</span>
                  <p className="text-[11px] text-orange-700 font-semibold">Horario Pico 🔥 • Mayor concurrencia</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100/70 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-purple-900">20:30 - 23:00 hs</span>
                  <p className="text-[11px] text-purple-700/90 font-semibold">Descomprimiendo • Espacio disponible</p>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              </div>
            </div>
          </div>

          {/* Normas de convivencia en sala tradicional */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Toalla obligatoria sobre bancos
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Descargar barras al finalizar
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Devolver mancuernas a su lugar
            </span>
          </div>
        </div>

        {/* Novedades y Anuncios del Gym */}
        <div className="lg:col-span-5 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-orange-600" />
              <h3 className="text-base font-bold text-gray-900">Novedades del Gym</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">Comunicaciones del staff, mejoras y avisos oficiales</p>

            <div className="space-y-3.5">
              {anuncios.map((a) => (
                <div key={a.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 text-[10px] font-bold border-0">
                      {a.tag}
                    </Badge>
                    <span className="text-[10px] text-gray-400 font-medium">{a.fecha}</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900">{a.titulo}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{a.detalle}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>¿Armado de rutina? Consultá a los profes en sala.</span>
            </div>
            <Button
              onClick={() => navigate("/mi-perfil")}
              variant="outline"
              size="sm"
              className="text-xs rounded-xl font-semibold cursor-pointer"
            >
              Mi Perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
