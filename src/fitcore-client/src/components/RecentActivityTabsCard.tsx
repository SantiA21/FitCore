import { useState } from "react";
import { Clock, Receipt, User, CheckCircle2 } from "lucide-react";
import BentoCard from "./BentoCard";
import PersonaAvatar from "@/components/ui/persona-avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

type Vencimiento = {
  id: number;
  clienteId: string;
  nombre: string;
  plan: string;
  fechaFin: string;
  diasRestantes: number;
};

type Pago = {
  id: number;
  clienteNombre: string;
  monto: number;
  metodo: string;
  fecha: string;
};

type Cliente = {
  id: string | number;
  nombre: string;
  apellido?: string;
  fechaAlta: string;
  activo: boolean;
};

interface RecentActivityTabsCardProps {
  className?: string;
  delay?: number;
  loading?: boolean;
  vencimientos?: Vencimiento[];
  pagos?: Pago[];
  clientes?: Cliente[];
}

type TabKey = "vencimientos" | "pagos" | "clientes";

function formatMonto(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function formatFechaCorta(fecha: string) {
  const d = new Date(fecha);
  const hoy = new Date();
  const esHoy = d.toDateString() === hoy.toDateString();
  if (esHoy) return `Hoy ${d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

const METODO_CLASS: Record<string, string> = {
  Efectivo: "bg-emerald-50 text-emerald-700",
  Débito: "bg-blue-50 text-blue-700",
  "Tarjeta de Débito": "bg-blue-50 text-blue-700",
  Crédito: "bg-purple-50 text-purple-700",
  "Tarjeta de Crédito": "bg-purple-50 text-purple-700",
  Transferencia: "bg-amber-50 text-amber-700",
  "Mercado Pago": "bg-cyan-50 text-cyan-700",
};

const TABS: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: "vencimientos", label: "Vencimientos", icon: Clock },
  { key: "pagos", label: "Pagos", icon: Receipt },
  { key: "clientes", label: "Clientes", icon: User },
];

/**
 * Reemplaza las tres tarjetas apiladas (Próximos Vencimientos, Últimos
 * Pagos, Últimos Clientes) por una sola con pestañas intercambiables,
 * para que compartan el mismo lugar en vez de repartirse la columna.
 */
export default function RecentActivityTabsCard({
  className,
  delay,
  loading,
  vencimientos = [],
  pagos = [],
  clientes = [],
}: RecentActivityTabsCardProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("vencimientos");

  const count = tab === "vencimientos" ? vencimientos.length : tab === "pagos" ? pagos.length : clientes.length;
  const ctaLabel = tab === "pagos" ? "Ver Todos los Pagos" : "Ver Clientes y Membresías";
  const ctaTarget = tab === "pagos" ? "/pagos" : "/clientes";

  return (
    <BentoCard className={cn("flex flex-col !p-3", className)} delay={delay}>
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 min-w-0 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer shrink-0",
                  active ? "bg-white text-black shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon className="h-3 w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
        {count > 0 && (
          <Badge variant="outline" className="text-[9px] font-bold border-gray-200 text-gray-500 bg-gray-50 shrink-0">
            {count}
          </Badge>
        )}
      </div>

      <div
        key={loading ? "loading" : tab}
        className="space-y-1 lg:flex-1 overflow-y-auto min-h-[56px] pr-1 animate-in fade-in-0 duration-200"
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-2.5 w-14 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-9 rounded-md" />
            </div>
          ))
        ) : tab === "vencimientos" ? (
          vencimientos.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-4 text-center text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] font-semibold text-foreground">Todo al día</p>
            </div>
          ) : (
            vencimientos.map((exp, i) => {
              const esUrgente = exp.diasRestantes <= 2;
              return (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => navigate("/clientes")}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-all cursor-pointer text-left animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PersonaAvatar seed={exp.clienteId} size={24} />
                    <div className="min-w-0">
                      <p className="font-bold text-black truncate text-[11px]">{exp.nombre}</p>
                      <p className="text-gray-400 truncate text-[9px]">{exp.plan}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "font-black uppercase shrink-0 ml-2 rounded-md text-[9px] px-1.5 py-0.5",
                    esUrgente ? "bg-rose-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {exp.diasRestantes === 0 ? "Hoy" : exp.diasRestantes === 1 ? "Mañana" : `${exp.diasRestantes}d`}
                  </span>
                </button>
              );
            })
          )
        ) : tab === "pagos" ? (
          pagos.length === 0 ? (
            <p className="text-[10px] text-gray-400 py-4 text-center">Sin pagos registrados todavía</p>
          ) : (
            pagos.map((pago, i) => (
              <button
                key={pago.id}
                type="button"
                onClick={() => navigate("/pagos")}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PersonaAvatar seed={pago.clienteNombre} size={24} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-black truncate">{pago.clienteNombre}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={cn("text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0", METODO_CLASS[pago.metodo] ?? "bg-gray-100 text-gray-600")}>
                        {pago.metodo}
                      </span>
                      <span className="text-[9px] text-gray-400 truncate">{formatFechaCorta(pago.fecha)}</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 shrink-0 ml-2">
                  {formatMonto(pago.monto)}
                </span>
              </button>
            ))
          )
        ) : (
          clientes.length === 0 ? (
            <p className="text-[10px] text-gray-400 py-4 text-center">Sin clientes registrados</p>
          ) : (
            clientes.slice(0, 8).map((cliente, i) => {
              const fechaStr = cliente.fechaAlta
                ? new Date(cliente.fechaAlta).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
                : "";
              return (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => navigate("/clientes")}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <div className="flex items-center gap-2.5">
                    <PersonaAvatar seed={String(cliente.id)} size={24} />
                    <span className="font-medium text-black text-[11px]">
                      {cliente.nombre} {cliente.apellido || ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fechaStr && <span className="text-gray-400 font-normal text-[10px]">{fechaStr}</span>}
                    <div className={cn("h-1.5 w-1.5 rounded-full", cliente.activo ? "bg-emerald-500" : "bg-gray-300")} />
                  </div>
                </button>
              );
            })
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate(ctaTarget)}
        className="mt-1.5 shrink-0 w-full py-1 rounded-lg bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 hover:text-black transition-all cursor-pointer"
      >
        {ctaLabel}
      </button>
    </BentoCard>
  );
}
