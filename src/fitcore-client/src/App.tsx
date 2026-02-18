import { useState } from "react";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import { Toaster } from "./components/ui/toaster";
import { cn } from "./lib/utils";

function App() {
  const [pagina, setPagina] = useState("clientes");

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-[#f97316]">FitCore</h1>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPagina("clientes")}
              className={cn(
                "text-sm font-normal transition-colors",
                pagina === "clientes"
                  ? "text-[#f97316]"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Clientes
            </button>
            <button
              onClick={() => setPagina("nuevo")}
              className={cn(
                "text-sm font-normal transition-colors",
                pagina === "nuevo"
                  ? "text-[#f97316]"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              + Nuevo Cliente
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {pagina === "clientes" && <Clientes onNavigateToNuevo={() => setPagina("nuevo")} />}
        {pagina === "nuevo" && <NuevoCliente onNavigateToClientes={() => setPagina("clientes")} />}
      </main>

      <Toaster />
    </div>
  );
}

export default App;
