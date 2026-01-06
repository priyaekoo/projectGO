import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

  const acessar = async () => {
    try {
      const response = await api.post("/auth/login", {
        usuario,
        senha,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("usuario", JSON.stringify(response.data.usuario));

      navigate("/usuarios");
    } catch (error) {
      console.error(error);
      setErro("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="login-container">
      {/* IMAGEM GRANDE */}
      <div className="login-left"></div>

      {/* FORMULÁRIO */}
      <div className="login-right">
        <div className="login-box">
          <img src={logo} alt="ProjectGO" className="login-logo" />

          <h2>ProjectGO</h2>
          <p>Sistema de gerenciamento de usuários e pacientes</p>

          {erro && <div className="login-error">{erro}</div>}

          <div className="login-input">
            <span>👤</span>
            <input
              placeholder="Usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>

          <div className="login-input">
            <span>🔒</span>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <button onClick={acessar}>Entrar</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
