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
    location.pathname.includes("/fornecedores") ||
    location.pathname.includes("/contas-receber") ||
    location.pathname.includes("/contas-pagar") ||
    location.pathname.includes("/transferencias") ||
    location.pathname.includes("/relatorios");

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h3>MENU</h3>

        <span className="menu-section">Cadastros</span>
        <button onClick={() => navigate("usuarios")}>Usuarios</button>
        <button onClick={() => navigate("clientes")}>Clientes</button>
        <button onClick={() => navigate("fornecedores")}>Fornecedores</button>

        <span className="menu-section">Movimentacoes</span>
        <button onClick={() => navigate("depositos")}>Depositos</button>
        <button onClick={() => navigate("transferencias")}>Transferencias</button>
        <button onClick={() => navigate("contas-pagar")}>Contas a Pagar</button>
        <button onClick={() => navigate("contas-receber")}>Contas a Receber</button>

        <span className="menu-section">Consultas</span>
        <button onClick={() => navigate("relatorios")}>Relatorios</button>

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
