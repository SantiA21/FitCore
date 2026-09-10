import { useEffect, useMemo, useState } from "react";
import { Users, AlertCircle, DollarSign, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";
import StatTile from "@/components/StatTile";
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
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 px-2">
        <StatTile
          icon={Users}
          color="indigo"
          value={stats ? stats.clientesActivos : (loading ? "..." : 0)}
          label="Clientes Activos"
          onClick={() => navigate("/clientes")}
        />
        <StatTile
          icon={AlertCircle}
          color="rose"
          value={stats ? stats.cuotasVencidas : (loading ? "..." : 0)}
          label="Clientes con Deuda"
          onClick={() => navigate("/estado-cuenta")}
        />
        <StatTile
          icon={DollarSign}
          color="emerald"
          value={stats ? stats.ingresosMesFormatted : (loading ? "..." : "$0")}
          label="Ingresos del Mes"
          onClick={() => navigate("/pagos")}
        />
        <StatTile
          icon={Calendar}
          color="amber"
          value={stats ? stats.asistenciasHoy : (loading ? "..." : 0)}
          label="Asistencias Hoy"
          onClick={() => navigate("/asistencias")}
        />
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
