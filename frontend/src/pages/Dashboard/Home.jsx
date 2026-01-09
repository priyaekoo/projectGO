import dashboardImg from "../../assets/dashboard.png";

function HomeDashboard() {
  return (
    <div className="dashboard-home">
      {/* BLOCO DA IMAGEM */}
      <div className="dashboard-home-image">
        <img src={dashboardImg} alt="Dashboard QA" />

        <h2 className="dashboard-home-title">Bem-vindo, QA 👋</h2>

        <p className="dashboard-home-description">
          Este sistema foi desenvolvido para o gerenciamento de{" "}
          <strong>usuários, pacientes e especialidades</strong>, permitindo a
          prática de operações de
          <strong> CRUD</strong> e o entendimento de vínculos de relacionamento
          em banco de dados.
        </p>
      </div>
    </div>
  );
}

export default HomeDashboard;
