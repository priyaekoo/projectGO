import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import HomeDashboard from "../pages/Dashboard/Home";
import Usuarios from "../pages/Usuarios";
import PrivateRoute from "./PrivateRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* rota inicial */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* login */}
        <Route path="/login" element={<Login />} />

        {/* dashboard (layout protegido) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        >
          {/* HOME do dashboard */}
          <Route index element={<HomeDashboard />} />

          {/* rotas filhas */}
          <Route path="usuarios" element={<Usuarios />} />

          {/* depois você adiciona:
              pacientes, especialidades, atendimentos */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
