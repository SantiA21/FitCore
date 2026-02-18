import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import Pagos from "./pages/Pagos";
import Asistencias from "./pages/Asistencias";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/nuevo" element={<NuevoCliente />} />
          <Route path="/pagos" element={<Pagos />} />
          <Route path="/asistencias" element={<Asistencias />} />
        </Routes>
      </Layout>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
