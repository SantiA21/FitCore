import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Cliente = {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  fechaAlta: string;
  activo: boolean;
};

interface ClientesProps {
  onNavigateToNuevo: () => void;
}

export default function Clientes({ onNavigateToNuevo }: ClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetch("http://localhost:5192/api/clientes")
      .then((res) => res.json())
      .then((data) => setClientes(data));
  }, []);

  const clientesFiltrados = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-gray-900">Clientes</h1>
        <Button onClick={onNavigateToNuevo}>+ Nuevo Cliente</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border border-gray-200">
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
            {clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8 font-normal">
                  No hay clientes
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((c) => (
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
