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

  // Rotas que precisam ocupar mais largura
  const isWidePage =
    location.pathname.includes("/usuarios") ||
    location.pathname.includes("/clientes") ||
    location.pathname.includes("/contas-receber");

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h3>MENU</h3>

        <button onClick={() => navigate("usuarios")}>Usuários</button>

        <button onClick={() => navigate("clientes")}>Clientes</button>

        <button onClick={() => navigate("contas-receber")}>
          Contas a Receber
        </button>

        <button onClick={() => navigate("contas-pagar")}>Contas a Pagar</button>

        <button onClick={() => navigate("depositos")}>Depósitos</button>

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
