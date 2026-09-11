import { useEffect, useMemo, useState, useCallback } from "react";
import { Users, AlertCircle, DollarSign, Calendar, UserPlus, Clock3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import StatTile from "@/components/StatTile";
import CalendarBentoCard from "@/components/CalendarBentoCard";
import LatestClientsBentoCard from "@/components/LatestClientsBentoCard";
import QuickRegisterBentoCard from "@/components/QuickRegisterBentoCard";
import PaymentsGraphBentoCard from "@/components/PaymentsGraphBentoCard";
import UpcomingSubscriptionsBentoCard from "@/components/UpcomingSubscriptionsBentoCard";
import StatDetailDialog, { type DetailRow } from "@/components/StatDetailDialog";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
  planNombre?: string | null;
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

type EstadoCuentaItem = {
  userId: string;
  nombre: string;
  planNombre: string | null;
  estadoGeneral: "AlDia" | "ConDeuda" | "PendienteMesActual";
};

type PagoItem = {
  id: number;
  clienteNombre: string;
  monto: number;
  metodo: string;
  fecha: string;
  periodoMes: number;
  periodoAnio: number;
};

type AsistenciaDetalle = {
  id: number;
  clienteNombre: string;
  horaIngreso: string;
};

type StatKey = "activos" | "nuevos" | "deuda" | "porVencer" | "ingresos" | "asistenciasHoy";

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonto(n: number): string {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarKey, setCalendarKey] = useState(0);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);

  const [statKey, setStatKey] = useState<StatKey | null>(null);
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaItem[] | null>(null);
  const [loadingEstadoCuenta, setLoadingEstadoCuenta] = useState(false);
  const [pagos, setPagos] = useState<PagoItem[] | null>(null);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [asistenciasHoy, setAsistenciasHoy] = useState<AsistenciaDetalle[] | null>(null);
  const [loadingAsistenciasHoy, setLoadingAsistenciasHoy] = useState(false);

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

  const cargarEstadoCuenta = useCallback(async () => {
    setLoadingEstadoCuenta(true);
    try {
      const res = await apiFetch("/api/pagos/estado-cuenta");
      if (res.ok) setEstadoCuenta(await res.json());
    } catch (error) {
      console.error("Error fetching estado de cuenta:", error);
    } finally {
      setLoadingEstadoCuenta(false);
    }
  }, []);

  const cargarPagos = useCallback(async () => {
    setLoadingPagos(true);
    try {
      const res = await apiFetch("/api/pagos");
      if (res.ok) setPagos(await res.json());
    } catch (error) {
      console.error("Error fetching pagos:", error);
    } finally {
      setLoadingPagos(false);
    }
  }, []);

  const cargarAsistenciasHoy = useCallback(async () => {
    setLoadingAsistenciasHoy(true);
    try {
      const res = await apiFetch(`/api/asistencias?fecha=${toDateOnly(new Date())}`);
      if (res.ok) setAsistenciasHoy(await res.json());
    } catch (error) {
      console.error("Error fetching asistencias de hoy:", error);
    } finally {
      setLoadingAsistenciasHoy(false);
    }
  }, []);

  const abrirStat = (key: StatKey) => {
    setStatKey(key);
    if (key === "deuda" && estadoCuenta === null) cargarEstadoCuenta();
    if (key === "ingresos" && pagos === null) cargarPagos();
    if (key === "asistenciasHoy" && asistenciasHoy === null) cargarAsistenciasHoy();
  };

  // Clientes ordenados por fecha de alta descendente
  const clientesOrdenados = useMemo(() => {
    return [...clientes].sort(
      (a, b) => new Date(b.fechaAlta).getTime() - new Date(a.fechaAlta).getTime()
    );
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

  const statDialogConfig = useMemo((): {
    title: string;
    description?: string;
    rows: DetailRow[];
    loading: boolean;
    emptyText: string;
    navigateTo: string;
    navigateLabel: string;
  } => {
    switch (statKey) {
      case "activos": {
        const activos = clientes.filter((c) => c.activo);
        return {
          title: "Clientes Activos",
          description: `${activos.length} cliente${activos.length !== 1 ? "s" : ""} con membresía activa`,
          rows: activos.map((c) => ({
            id: c.id,
            title: `${c.nombre} ${c.apellido || ""}`.trim(),
            subtitle: c.planNombre || "Sin plan asignado",
          })),
          loading: false,
          emptyText: "Sin clientes activos",
          navigateTo: "/clientes",
          navigateLabel: "Ir a Clientes",
        };
      }
      case "nuevos": {
        const hoy = new Date();
        const nuevos = clientes.filter((c) => {
          const f = new Date(c.fechaAlta);
          return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
        });
        return {
          title: "Nuevos este Mes",
          description: `${nuevos.length} alta${nuevos.length !== 1 ? "s" : ""} en ${hoy.toLocaleDateString("es-AR", { month: "long" })}`,
          rows: nuevos.map((c) => ({
            id: c.id,
            title: `${c.nombre} ${c.apellido || ""}`.trim(),
            subtitle: new Date(c.fechaAlta).toLocaleDateString("es-AR", { day: "2-digit", month: "long" }),
          })),
          loading: false,
          emptyText: "Sin altas este mes",
          navigateTo: "/clientes",
          navigateLabel: "Ir a Clientes",
        };
      }
      case "deuda": {
        const conDeuda = (estadoCuenta ?? []).filter((e) => e.estadoGeneral === "ConDeuda");
        return {
          title: "Clientes con Deuda",
          description: `${conDeuda.length} cliente${conDeuda.length !== 1 ? "s" : ""} con cuotas atrasadas`,
          rows: conDeuda.map((e) => ({
            id: e.userId,
            title: e.nombre,
            subtitle: e.planNombre || "Sin plan asignado",
            right: "Deuda",
            rightVariant: "danger" as const,
          })),
          loading: loadingEstadoCuenta,
          emptyText: "Sin clientes con deuda",
          navigateTo: "/estado-cuenta",
          navigateLabel: "Ir a Estado de Cuenta",
        };
      }
      case "porVencer": {
        const vencimientos = stats?.proximosVencimientos ?? [];
        return {
          title: "Próximos Vencimientos",
          description: `${vencimientos.length} membresía${vencimientos.length !== 1 ? "s" : ""} vencen en los próximos 7 días`,
          rows: vencimientos.map((v) => ({
            id: v.id,
            title: v.nombre,
            subtitle: v.plan,
            right: v.diasRestantes === 0 ? "Hoy" : v.diasRestantes === 1 ? "Mañana" : `${v.diasRestantes}d`,
            rightVariant: v.diasRestantes <= 2 ? ("danger" as const) : ("warning" as const),
          })),
          loading: false,
          emptyText: "Todo al día",
          navigateTo: "/clientes",
          navigateLabel: "Ir a Clientes",
        };
      }
      case "ingresos": {
        const hoy = new Date();
        const delMes = (pagos ?? []).filter(
          (p) => p.periodoMes === hoy.getMonth() + 1 && p.periodoAnio === hoy.getFullYear()
        );
        return {
          title: "Ingresos del Mes",
          description: `${delMes.length} pago${delMes.length !== 1 ? "s" : ""} registrado${delMes.length !== 1 ? "s" : ""} en ${hoy.toLocaleDateString("es-AR", { month: "long" })}`,
          rows: delMes.map((p) => ({
            id: p.id,
            title: p.clienteNombre,
            subtitle: `${new Date(p.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })} · ${p.metodo}`,
            right: formatMonto(p.monto),
            rightVariant: "success" as const,
          })),
          loading: loadingPagos,
          emptyText: "Sin pagos registrados este mes",
          navigateTo: "/pagos",
          navigateLabel: "Ir a Pagos",
        };
      }
      case "asistenciasHoy": {
        const lista = asistenciasHoy ?? [];
        return {
          title: "Asistencias de Hoy",
          description: `${lista.length} check-in${lista.length !== 1 ? "s" : ""} registrado${lista.length !== 1 ? "s" : ""} hoy`,
          rows: lista.map((a) => ({
            id: a.id,
            title: a.clienteNombre,
            right: a.horaIngreso?.slice(0, 5),
            rightVariant: "muted" as const,
          })),
          loading: loadingAsistenciasHoy,
          emptyText: "Sin asistencias registradas hoy",
          navigateTo: "/asistencias",
          navigateLabel: "Ir a Asistencias",
        };
      }
      default:
        return {
          title: "",
          rows: [],
          loading: false,
          emptyText: "",
          navigateTo: "/",
          navigateLabel: "",
        };
    }
  }, [statKey, clientes, estadoCuenta, loadingEstadoCuenta, pagos, loadingPagos, asistenciasHoy, loadingAsistenciasHoy, stats]);

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
          onClick={() => abrirStat("activos")}
          loading={loading}
        />
        <StatTile
          icon={UserPlus}
          color="blue"
          value={nuevosEsteMes}
          label="Nuevos este Mes"
          onClick={() => abrirStat("nuevos")}
          loading={loading}
        />
        <StatTile
          icon={AlertCircle}
          color="rose"
          value={stats ? stats.cuotasVencidas : 0}
          label="Clientes con Deuda"
          onClick={() => abrirStat("deuda")}
          loading={loading}
        />
        <StatTile
          icon={Clock3}
          color="purple"
          value={porVencer}
          label="Por Vencer (7 días)"
          onClick={() => abrirStat("porVencer")}
          loading={loading}
        />
        <StatTile
          icon={DollarSign}
          color="emerald"
          value={stats ? stats.ingresosMesFormatted : "$0"}
          label="Ingresos del Mes"
          onClick={() => abrirStat("ingresos")}
          loading={loading}
        />
        <StatTile
          icon={Calendar}
          color="amber"
          value={stats ? stats.asistenciasHoy : 0}
          label="Asistencias Hoy"
          onClick={() => abrirStat("asistenciasHoy")}
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
            clientes={clientesOrdenados}
            className="lg:flex-1"
            delay={300}
            loading={loading}
          />
        </div>
      </div>

      <StatDetailDialog
        open={statKey !== null}
        onOpenChange={(open) => !open && setStatKey(null)}
        title={statDialogConfig.title}
        description={statDialogConfig.description}
        rows={statDialogConfig.rows}
        loading={statDialogConfig.loading}
        emptyText={statDialogConfig.emptyText}
        navigateTo={statDialogConfig.navigateTo}
        navigateLabel={statDialogConfig.navigateLabel}
      />
    </div>
  );
}
