import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Calendar, User, LogOut,
  ClipboardList, ShieldCheck, TrendingUp, Menu, X,
  PanelLeftClose, PanelLeftOpen, Wallet, FileSpreadsheet,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logoIcon from "@/assets/brand/fitcore-icon.png";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard-admin" },
  { label: "Clientes", icon: Users, path: "/clientes" },
  { label: "Planes", icon: ClipboardList, path: "/planes-admin" },
  { label: "Pagos", icon: CreditCard, path: "/pagos" },
  { label: "Estado de cuenta", icon: ShieldCheck, path: "/estado-cuenta" },
  { label: "Asistencias", icon: Calendar, path: "/asistencias" },
  { label: "Contabilidad", icon: Wallet, path: "/contabilidad" },
  { label: "Reportes", icon: FileSpreadsheet, path: "/reportes" },
];

const clienteNavItems: NavItem[] = [
  { label: "Inicio", icon: LayoutDashboard, path: "/dashboard-cliente" },
  { label: "Mi Membresía", icon: CreditCard, path: "/mi-membresia" },
  { label: "Mis Asistencias", icon: Calendar, path: "/mis-asistencias" },
  { label: "Mi Progreso", icon: TrendingUp, path: "/mi-progreso" },
  { label: "Mi Perfil", icon: User, path: "/mi-perfil" },
];

const COLLAPSE_KEY = "fitcore_sidebar_collapsed";

function useReloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const ahora = useReloj();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : clienteNavItems;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, String(next));
      } catch {
        // localStorage no disponible (modo privado, etc.) — no es crítico
      }
      return next;
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const hora = ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const fecha = ahora.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <TooltipProvider delayDuration={200}>
      {/* Botón hamburguesa — solo mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 h-10 w-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Backdrop — solo mobile, cuando el drawer está abierto */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "h-screen bg-white border-r border-[#f0f0f0] flex flex-col shrink-0 z-50 transition-[width,transform] duration-200",
          "fixed top-0 left-0 md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-[76px]" : "w-[220px]"
        )}
      >
        {/* Logo + cerrar (mobile) */}
        <div className={cn("border-b border-[#f0f0f0] flex items-center", collapsed ? "justify-center p-4" : "justify-between p-5")}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoIcon} alt="FitCore" className="h-8 w-8 object-contain shrink-0" />
            {!collapsed && <h1 className="text-lg font-bold text-black truncate">FitCore</h1>}
          </div>
          <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400" aria-label="Cerrar menú">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Reloj */}
        <div className={cn("border-b border-[#f0f0f0] px-4 py-3", collapsed && "px-2 text-center")}>
          {collapsed ? (
            <p className="text-xs font-bold text-gray-700">{hora}</p>
          ) : (
            <>
              <p className="text-lg font-black text-gray-900 tabular-nums leading-none">{hora}</p>
              <p className="text-[10px] text-gray-400 font-semibold capitalize mt-1">{fecha}</p>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const button = (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-[#f4f4f4] text-black font-semibold"
                    : "text-[#888] hover:bg-[#f9f9f9] hover:text-black font-normal"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );

            if (!collapsed) return button;

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Colapsar — solo desktop */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "hidden md:flex items-center gap-2 mx-3 mb-1 px-3 py-2 rounded-lg text-[#888] hover:bg-[#f9f9f9] hover:text-black transition-colors text-xs font-semibold",
            collapsed && "justify-center px-0 mx-3"
          )}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <PanelLeftClose className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>Colapsar</span>}
        </button>

        {/* Profile + Logout */}
        <div className={cn("p-3 border-t border-[#f0f0f0] space-y-1", collapsed && "px-2")}>
          <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center px-0")}>
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-black truncate">
                  {user ? `${user.nombre} ${user.apellido}` : "Usuario"}
                </p>
                <p className="text-xs text-[#888] truncate">{user?.categoria ?? ""}</p>
              </div>
            )}
          </div>

          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-0 py-2 rounded-lg text-[#888] hover:bg-[#f9f9f9] hover:text-black transition-colors"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Cerrar sesión</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#888] hover:bg-[#f9f9f9] hover:text-black transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
