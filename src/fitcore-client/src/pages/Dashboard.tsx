import { useEffect, useMemo, useState } from "react";
import { Users, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import BentoCard from "@/components/BentoCard";
import CalendarBentoCard from "@/components/CalendarBentoCard";
import LatestClientsBentoCard from "@/components/LatestClientsBentoCard";
import QuickRegisterBentoCard from "@/components/QuickRegisterBentoCard";
import PaymentsGraphBentoCard from "@/components/PaymentsGraphBentoCard";
import UpcomingSubscriptionsBentoCard from "@/components/UpcomingSubscriptionsBentoCard";
import { useNavigate } from "react-router-dom";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
};

type SerieItem = {
  dia: string;
  fecha: string;
  monto: number;
};

type ProximoVencimiento = {
  id: number;
  clienteId: string;
  nombre: string;
  plan: string;
  fechaFin: string;
  diasRestantes: number;
};

type DashboardStats = {
  clientesActivos: number;
  cuotasVencidas: number;
  ingresosMes: number;
  ingresosMesFormatted: string;
  asistenciasHoy: number;
  serieIngresos: SerieItem[];
  totalSemana: number;
  totalSemanaFormatted: string;
  porcentajeCrecimiento: number;
  proximosVencimientos: ProximoVencimiento[];
};

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarKey, setCalendarKey] = useState(0);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [resClientes, resStats] = await Promise.all([
        apiFetch("/api/usuarios?categoria=Cliente"),
        apiFetch("/api/dashboard/stats"),
      ]);

      if (resClientes.ok) {
        const dataClientes: Cliente[] = await resClientes.json();
        setClientes(dataClientes);
      }

      if (resStats.ok) {
        const dataStats: DashboardStats = await resStats.json();
        setStats(dataStats);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegistrationSuccess = () => {
    setCalendarKey((prev) => prev + 1);
    fetchData();
  };

  // Clientes ordenados por fecha de alta descendente
  const ultimosClientes = useMemo(() => {
    return [...clientes]
      .sort((a, b) => new Date(b.fechaAlta).getTime() - new Date(a.fechaAlta).getTime())
      .slice(0, 5);
  }, [clientes]);

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tighter">Panel Central</h1>
          <p className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.3em] mt-1">Control de Gimnasio</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Sistema Activo
        </div>
      </div>

      {/* --- Fila de Métricas Principales (Reales) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">

        {/* Clientes Activos */}
        <div onClick={() => navigate("/clientes")} className="cursor-pointer group">
          <BentoCard
            className="!p-5 border-t-4 border-t-indigo-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white/90"
            delay={100}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none truncate">
                  {stats ? stats.clientesActivos : (loading ? "..." : 0)}
                </p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 truncate">
                  Clientes Activos
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Clientes con Deuda */}
        <div onClick={() => navigate("/estado-cuenta")} className="cursor-pointer group">
          <BentoCard
            className="!p-5 border-t-4 border-t-rose-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white/90"
            delay={200}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-xs group-hover:scale-105 transition-transform">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none truncate">
                  {stats ? stats.cuotasVencidas : (loading ? "..." : 0)}
                </p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 truncate">
                  Clientes con Deuda
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Ingresos del Mes */}
        <div onClick={() => navigate("/pagos")} className="cursor-pointer group">
          <BentoCard
            className="!p-5 border-t-4 border-t-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white/90"
            delay={300}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none truncate">
                  {stats ? stats.ingresosMesFormatted : (loading ? "..." : "$0")}
                </p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 truncate">
                  Ingresos del Mes
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

        {/* Asistencias Hoy */}
        <div onClick={() => navigate("/asistencias")} className="cursor-pointer group">
          <BentoCard
            className="!p-5 border-t-4 border-t-amber-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 bg-white/90"
            delay={400}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-xs group-hover:scale-105 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl sm:text-3xl font-black text-black tracking-tight leading-none truncate">
                  {stats ? stats.asistenciasHoy : (loading ? "..." : 0)}
                </p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 truncate">
                  Asistencias Hoy
                </p>
              </div>
            </div>
          </BentoCard>
        </div>

      </div>

      {/* --- Layout Principal --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">

        <CalendarBentoCard
          key={calendarKey}
          className="lg:col-span-4"
          delay={500}
          selectedDate={fechaSeleccionada}
          onSelectDate={setFechaSeleccionada}
        />

        <div className="lg:col-span-8 flex flex-col gap-6">
          <PaymentsGraphBentoCard
            className="flex-1"
            delay={600}
            serie={stats?.serieIngresos}
            totalSemana={stats?.totalSemana}
            totalSemanaFormatted={stats?.totalSemanaFormatted}
            porcentajeCrecimiento={stats?.porcentajeCrecimiento}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <QuickRegisterBentoCard
              clientes={clientes}
              fechaSeleccionada={fechaSeleccionada}
              className="bg-primary/5 border-primary/10"
              delay={800}
              onSuccess={handleRegistrationSuccess}
            />
            <UpcomingSubscriptionsBentoCard
              delay={700}
              vencimientos={stats?.proximosVencimientos}
            />
          </div>
        </div>

        <LatestClientsBentoCard
          clientes={ultimosClientes}
          className="lg:col-span-12"
          delay={900}
        />

      </div>
    </div>
  );
}
