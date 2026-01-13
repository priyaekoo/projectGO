import { Outlet, useNavigate, useLocation } from "react-router-dom";
import "./dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  // rotas que precisam ocupar mais largura
  const isWidePage = location.pathname.includes("/usuarios");

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

      <main className={`content ${isWidePage ? "content-wide" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
