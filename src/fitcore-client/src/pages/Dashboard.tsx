import { useEffect, useMemo, useState } from "react";
import { Users, AlertCircle, DollarSign, Calendar, UserPlus, Clock3 } from "lucide-react";
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
      .slice(0, 4);
  }, [clientes]);

  // Altas de este mes calendario
  const nuevosEsteMes = useMemo(() => {
    const hoy = new Date();
    return clientes.filter((c) => {
      const f = new Date(c.fechaAlta);
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length;
  }, [clientes]);

  const porVencer = stats?.proximosVencimientos.length ?? 0;

  return (
    <div className="space-y-4 pb-6 max-w-[1800px] mx-auto flex flex-col lg:h-full">
      <div className="flex flex-wrap justify-between items-center gap-2 px-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">Panel Central</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">Control de Gimnasio</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sistema Activo
        </div>
      </div>

      {/* --- Fila de Métricas Principales --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 px-1">
        <StatTile
          icon={Users}
          color="indigo"
          value={stats ? stats.clientesActivos : 0}
          label="Clientes Activos"
          onClick={() => navigate("/clientes")}
          loading={loading}
        />
        <StatTile
          icon={UserPlus}
          color="blue"
          value={nuevosEsteMes}
          label="Nuevos este Mes"
          onClick={() => navigate("/clientes")}
          loading={loading}
        />
        <StatTile
          icon={AlertCircle}
          color="rose"
          value={stats ? stats.cuotasVencidas : 0}
          label="Clientes con Deuda"
          onClick={() => navigate("/estado-cuenta")}
          loading={loading}
        />
        <StatTile
          icon={Clock3}
          color="purple"
          value={porVencer}
          label="Por Vencer (7 días)"
          onClick={() => navigate("/clientes")}
          loading={loading}
        />
        <StatTile
          icon={DollarSign}
          color="emerald"
          value={stats ? stats.ingresosMesFormatted : "$0"}
          label="Ingresos del Mes"
          onClick={() => navigate("/pagos")}
          loading={loading}
        />
        <StatTile
          icon={Calendar}
          color="amber"
          value={stats ? stats.asistenciasHoy : 0}
          label="Asistencias Hoy"
          onClick={() => navigate("/asistencias")}
          loading={loading}
        />
      </div>

      {/* --- Fila principal de contenido (una sola fila sin scroll en desktop; apilada en mobile/tablet) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-1 lg:flex-1 lg:min-h-0">
        <CalendarBentoCard
          key={calendarKey}
          className="lg:col-span-3"
          delay={100}
          selectedDate={fechaSeleccionada}
          onSelectDate={setFechaSeleccionada}
        />

        <div className="lg:col-span-5 flex flex-col gap-4">
          <PaymentsGraphBentoCard
            className="lg:flex-1"
            delay={150}
            loading={loading}
            serie={stats?.serieIngresos}
            totalSemana={stats?.totalSemana}
            totalSemanaFormatted={stats?.totalSemanaFormatted}
            porcentajeCrecimiento={stats?.porcentajeCrecimiento}
          />
          <QuickRegisterBentoCard
            clientes={clientes}
            fechaSeleccionada={fechaSeleccionada}
            className="bg-primary/5 border-primary/10 lg:flex-1"
            delay={200}
            onSuccess={handleRegistrationSuccess}
          />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <UpcomingSubscriptionsBentoCard
            className="lg:flex-1"
            delay={250}
            loading={loading}
            vencimientos={stats?.proximosVencimientos}
          />
          <LatestClientsBentoCard
            clientes={ultimosClientes}
            className="lg:flex-1"
            delay={300}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
