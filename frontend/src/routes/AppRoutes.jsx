import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import HomeDashboard from "../pages/Dashboard/Home";
import Usuarios from "../pages/Usuarios";
import UsuarioForm from "../pages/Usuarios/UsuarioForm";
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
          <Route path="usuarios/novo" element={<UsuarioForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
