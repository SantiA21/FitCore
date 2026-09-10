import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import logoFull from "@/assets/brand/fitcore-logo-full.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.mensaje ?? "Credenciales inválidas.");
      }

      const data = await res.json();
      login(data.token, {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        categoria: data.categoria,
      });

      const esCliente = data.categoria === 2 || data.categoria === "Cliente";
      navigate(esCliente ? "/dashboard-cliente" : "/dashboard-admin");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: err instanceof Error ? err.message : "Intentá nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
      <div className="bg-white border border-[#f0f0f0] rounded-xl p-8 w-full max-w-sm shadow-sm animate-scale-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoFull} alt="FitCore" className="h-24 w-auto object-contain" />
          <p className="text-sm text-[#888] mt-3">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" loading={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#888] mt-6">
          ¿No tenés cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="text-black font-medium hover:underline"
          >
            Registrate
          </button>
        </p>
      </div>
    </div>
  );
}
