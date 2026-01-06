import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  const acessar = () => {
    if (!usuario || !senha) {
      setErro("Informe usuário e senha");
      return;
    }

    // 🔐 login fake (por enquanto)
    localStorage.setItem("logado", "true");
    navigate("/");
  };

  return (
    <div style={{ width: 300, margin: "100px auto" }}>
      <h2>ProjectGO</h2>
      <p>Sistema de gerenciamento de usuários e pacientes</p>

      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <input
        placeholder="Usuário"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <button onClick={acessar}>Entrar</button>
    </div>
  );
}

export default Login;
