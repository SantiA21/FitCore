import { LayoutDashboard, Users, CreditCard, Calendar, User, LogOut, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
];

const clienteNavItems: NavItem[] = [
  { label: "Inicio", icon: LayoutDashboard, path: "/dashboard-cliente" },
  { label: "Mi Membresía", icon: CreditCard, path: "/mi-membresia" },
  { label: "Mis Asistencias", icon: Calendar, path: "/mis-asistencias" },
  { label: "Mi Progreso", icon: TrendingUp, path: "/mi-progreso" },
  { label: "Mi Perfil", icon: User, path: "/mi-perfil" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const navItems = isAdmin ? adminNavItems : clienteNavItems;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-[220px] bg-white border-r border-[#f0f0f0] flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#f0f0f0]">
        <h1 className="text-lg font-bold text-black">FitCore</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-[#f4f4f4] text-black font-semibold"
                  : "text-[#888] hover:bg-[#f9f9f9] hover:text-black font-normal"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="p-4 border-t border-[#f0f0f0] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black truncate">
              {user ? `${user.nombre} ${user.apellido}` : "Usuario"}
            </p>
            <p className="text-xs text-[#888] truncate">{user?.categoria ?? ""}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#888] hover:bg-[#f9f9f9] hover:text-black transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
