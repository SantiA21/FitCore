import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedCategorias?: string[];
}

export default function ProtectedRoute({ children, allowedCategorias }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const categoriaMap: Record<number, string> = { 0: "Admin", 1: "Entrenador", 2: "Cliente" };
  const categoriaStr = typeof user?.categoria === "number"
    ? categoriaMap[user.categoria]
    : user?.categoria;

  if (allowedCategorias && user && !allowedCategorias.includes(categoriaStr ?? "")) {
    if (categoriaStr === "Cliente") {
      return <Navigate to="/dashboard-cliente" replace />;
    }
    return <Navigate to="/dashboard-admin" replace />;
  }

  return <>{children}</>;
}
