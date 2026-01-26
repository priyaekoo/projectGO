import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import HomeDashboard from "../pages/Dashboard/Home";
import Usuarios from "../pages/Usuarios";
import Clientes from "../pages/Clientes";
import ContasReceber from "../pages/ContasReceber";
import Depositos from "../pages/Depositos";
import PrivateRoute from "./PrivateRoute";
import ContasPagar from "../pages/ContasPagar";

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
          <Route path="contas-receber" element={<ContasReceber />} />
          <Route path="depositos" element={<Depositos />} />
          <Route path="contas-pagar" element={<ContasPagar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
