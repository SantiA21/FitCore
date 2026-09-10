import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";
import logoFull from "@/assets/brand/fitcore-logo-full.png";

export default function Register() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          categoria: 2, // Categoria.Cliente
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.mensaje ?? "No se pudo registrar el usuario.");
      }

      const data = await res.json();
      login(data.token, {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        categoria: data.categoria,
      });

      toast({
        variant: "success",
        title: "Cuenta creada",
        description: "El usuario fue registrado correctamente.",
      });

      const esCliente = data.categoria === 2 || data.categoria === "Cliente";
      navigate(esCliente ? "/dashboard-cliente" : "/dashboard-admin");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
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
          <p className="text-sm text-[#888] mt-3">Creá una nueva cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Juan"
                value={form.nombre}
                onChange={handleChange("nombre")}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input
                id="apellido"
                type="text"
                placeholder="Pérez"
                value={form.apellido}
                onChange={handleChange("apellido")}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange("email")}
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
              value={form.password}
              onChange={handleChange("password")}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" loading={loading}>
            {loading ? "Registrando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#888] mt-6">
          ¿Ya tenés cuenta?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-black font-medium hover:underline"
          >
            Iniciá sesión
          </button>
        </p>
      </div>
    </div>
  );
}
