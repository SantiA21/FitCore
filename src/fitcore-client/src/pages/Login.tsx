import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

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
      const res = await fetch("http://localhost:5192/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="bg-white border border-[#f0f0f0] rounded-xl p-8 w-full max-w-sm shadow-sm">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-black">FitCore</h1>
          <p className="text-sm text-[#888] mt-1">Iniciá sesión para continuar</p>
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

          <Button type="submit" className="w-full mt-2" disabled={loading}>
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
