import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import loginBg from "../../assets/login.png";
import "./login.css";

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

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setErro("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="login-container">
      <div className="login-right-inner">
        <div className="login-box">
          <h2>ProjectGO</h2>
          <p>Sistema de gerenciamento de usuários e pacientes</p>

          {erro && <div className="login-error">{erro}</div>}

          <div className="login-input">
            <span>👤</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Usuário"
            />
          </div>

          <div className="login-input">
            <span>🔒</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
            />
          </div>

          <button onClick={acessar}>Entrar</button>
        </div>
      </div>

      <div className="login-left">
        <img
          src={loginBg}
          alt="Imagem de login"
          className="login-left-img-fallback"
        />
      </div>
    </div>
  );
}

export default Login;
