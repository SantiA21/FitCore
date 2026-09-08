import { useEffect, useState } from "react";
import { Users, AlertCircle, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import BentoCard from "@/components/BentoCard";
import CalendarBentoCard from "@/components/CalendarBentoCard";
import LatestClientsBentoCard from "@/components/LatestClientsBentoCard";
import QuickRegisterBentoCard from "@/components/QuickRegisterBentoCard";
import PaymentsGraphBentoCard from "@/components/PaymentsGraphBentoCard";
import UpcomingSubscriptionsBentoCard from "@/components/UpcomingSubscriptionsBentoCard";
import { cn } from "@/lib/utils";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
};

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesActivos, setClientesActivos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarKey, setCalendarKey] = useState(0);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);

  // Métricas mockeadas
  const cuotasVencidas = 12;
  const ingresosMes = "$45,230";
  const asistenciasHoy = 28;

  const ultimosClientes = clientes.slice(0, 5);

  const fetchData = async () => {
    try {
      const [resClientes, resActivos] = await Promise.all([
        apiFetch("/api/usuarios?categoria=Cliente"),
        apiFetch("/api/usuarios/activos/count?categoria=Cliente")
      ]);

      const dataClientes = await resClientes.json();
      const dataActivos = await resActivos.json();

      setClientes(dataClientes);
      setClientesActivos(dataActivos.total);
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
    setCalendarKey(prev => prev + 1);
    fetchData();
  };

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

      {/* --- Metrics Row (Adapted & Premium) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">

        <BentoCard className="flex items-center gap-4 !p-6 border-t-4 border-t-indigo-500" delay={100}>
          <div className="p-3 bg-indigo-50 rounded-2xl shrink-0">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-black tracking-tighter leading-none">{clientesActivos ?? 0}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Clientes Activos</p>
          </div>
        </BentoCard>

        <BentoCard className="flex items-center gap-4 !p-6 border-t-4 border-t-rose-500" delay={200}>
          <div className="p-3 bg-rose-50 rounded-2xl shrink-0">
            <AlertCircle className="h-5 w-5 text-rose-600" />
          </div>
          <p className="text-4xl font-black text-black tracking-tighter leading-none">{cuotasVencidas}</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-3">Cuotas Vencidas</p>
        </BentoCard>

        <BentoCard className="flex items-center gap-4 !p-6 border-t-4 border-t-emerald-500" delay={300}>
          <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-4xl font-black text-black tracking-tighter leading-none">{ingresosMes}</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-3">Ingresos Mes</p>
        </BentoCard>

        <BentoCard className="flex items-center gap-4 !p-6 border-t-4 border-t-amber-500" delay={400}>
          <div className="p-3 bg-amber-50 rounded-2xl shrink-0">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-4xl font-black text-black tracking-tighter leading-none">{asistenciasHoy}</p>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-3">Asistencias Hoy</p>
        </BentoCard>

      </div>

      {/* --- Main Layout --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-2">

        <CalendarBentoCard
          key={calendarKey}
          className="lg:col-span-4"
          delay={500}
          selectedDate={fechaSeleccionada}
          onSelectDate={setFechaSeleccionada}
        />

        <div className="lg:col-span-8 flex flex-col gap-6">
          <PaymentsGraphBentoCard className="flex-1" delay={600} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <QuickRegisterBentoCard
              clientes={clientes}
              fechaSeleccionada={fechaSeleccionada}     // ← nuevo
              className="bg-primary/5 border-primary/10"
              delay={800}
              onSuccess={handleRegistrationSuccess}
            />
            <UpcomingSubscriptionsBentoCard delay={700} />
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
