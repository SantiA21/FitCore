import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface NuevoClienteProps {
  onNavigateToClientes: () => void;
}

export default function NuevoCliente({ onNavigateToClientes }: NuevoClienteProps) {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5192/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast({
          variant: "success",
          title: "Cliente creado exitosamente",
          description: `El cliente ${form.nombre} ha sido agregado correctamente.`,
        });
        setForm({ nombre: "", telefono: "", email: "" });
        setTimeout(() => {
          onNavigateToClientes();
        }, 1500);
      } else {
        toast({
          variant: "destructive",
          title: "Error al crear cliente",
          description: "Hubo un problema al crear el cliente. Por favor, intenta nuevamente.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al crear cliente",
        description: "Hubo un problema al crear el cliente. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nuevo Cliente</CardTitle>
          <CardDescription>
            Completa el formulario para agregar un nuevo cliente al sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ingresa el nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                placeholder="Ingresa el teléfono"
                value={form.telefono}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Ingresa el email"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onNavigateToClientes}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Guardando..." : "Guardar cliente"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
