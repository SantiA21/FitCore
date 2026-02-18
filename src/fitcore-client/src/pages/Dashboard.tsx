import { useEffect, useState } from "react";
import { Users, AlertCircle, DollarSign, Calendar } from "lucide-react";
import MetricCard from "@/components/MetricCard";
import MetricCardSkeleton from "@/components/MetricCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
};

export default function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5192/api/clientes")
      .then((res) => res.json())
      .then((data) => {
        setClientes(data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Métricas mockeadas
  const clientesActivos = clientes.filter((c) => c.activo).length;
  const cuotasVencidas = 12; // Mock
  const ingresosMes = "$45,230"; // Mock
  const asistenciasHoy = 28; // Mock

  // Últimos 5 clientes
  const ultimosClientes = clientes.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Skeleton métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>

        {/* Skeleton tabla */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <Skeleton className="h-6 w-40" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha alta</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-lg" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          value={clientesActivos}
          label="Clientes activos"
          icon={Users}
        />
        <MetricCard
          value={cuotasVencidas}
          label="Cuotas vencidas"
          icon={AlertCircle}
        />
        <MetricCard
          value={ingresosMes}
          label="Ingresos del mes"
          icon={DollarSign}
        />
        <MetricCard
          value={asistenciasHoy}
          label="Asistencias hoy"
          icon={Calendar}
        />
      </div>

      {/* Tabla de últimos clientes */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-black">Últimos clientes</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fecha alta</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ultimosClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8 font-normal">
                  No hay clientes
                </TableCell>
              </TableRow>
            ) : (
              ultimosClientes.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.telefono}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{new Date(c.fechaAlta).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={c.activo ? "success" : "danger"}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
