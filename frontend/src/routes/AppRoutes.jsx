import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import HomeDashboard from "../pages/Dashboard/Home";
import Usuarios from "../pages/Usuarios";
import Clientes from "../pages/Clientes";
import Fornecedores from "../pages/Fornecedores";
import ContasReceber from "../pages/ContasReceber";
import ContasPagar from "../pages/ContasPagar";
import Depositos from "../pages/Depositos";
import Transferencias from "../pages/Transferencias";
import Relatorios from "../pages/Relatorios";
import PrivateRoute from "./PrivateRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<HomeDashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="depositos" element={<Depositos />} />
          <Route path="contas-receber" element={<ContasReceber />} />
          <Route path="contas-pagar" element={<ContasPagar />} />
          <Route path="transferencias" element={<Transferencias />} />
          <Route path="relatorios" element={<Relatorios />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
