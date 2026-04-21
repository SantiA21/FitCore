import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthUser {
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("fitcore_token")
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("fitcore_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("fitcore_token", newToken);
    localStorage.setItem("fitcore_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("fitcore_token");
    localStorage.removeItem("fitcore_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
