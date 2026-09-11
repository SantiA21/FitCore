import type { LucideIcon } from "lucide-react";
import { UserPlus, CreditCard, MessageCircleWarning, Wallet, FileSpreadsheet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AccionRapida {
  label: string;
  icon: LucideIcon;
  path: string;
  primary?: boolean;
}

const ACCIONES: AccionRapida[] = [
  { label: "Nuevo Cliente", icon: UserPlus, path: "/clientes/nuevo", primary: true },
  { label: "Registrar Pago", icon: CreditCard, path: "/pagos" },
  { label: "Ver Deudores", icon: MessageCircleWarning, path: "/estado-cuenta?estado=ConDeuda" },
  { label: "Nuevo Movimiento", icon: Wallet, path: "/contabilidad" },
  { label: "Exportar Reportes", icon: FileSpreadsheet, path: "/reportes" },
];

/**
 * Barra de accesos directos a las tareas que un dueño de gimnasio hace todo
 * el día — pensada para no tener que salir del dashboard a buscarlas en el
 * menú lateral.
 */
export default function QuickActionsBar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 px-1 -mx-1">
      {ACCIONES.map((accion) => {
        const Icon = accion.icon;
        return (
          <button
            key={accion.path}
            type="button"
            onClick={() => navigate(accion.path)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer",
              accion.primary
                ? "bg-black text-white hover:bg-black/90 shadow-sm"
                : "bg-white border border-gray-200/80 text-gray-600 hover:border-gray-300 hover:text-black shadow-xs"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {accion.label}
          </button>
        );
      })}
    </div>
  );
}
