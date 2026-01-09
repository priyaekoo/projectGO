import { Outlet, useNavigate } from "react-router-dom";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h3>MENU</h3>

        <button onClick={() => navigate("usuarios")}>Usuários</button>

        <button onClick={() => navigate("pacientes")}>Pacientes</button>

        <button onClick={() => navigate("especialidades")}>
          Especialidades
        </button>

        <button className="logout" onClick={logout}>
          Sair
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
