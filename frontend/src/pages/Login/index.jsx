import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";
import loginBg from "../../assets/login.png";
import "./login.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const navigate = useNavigate();
  const leftRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const el = leftRef.current;
    const img = imgRef.current;
    console.log("[DBG] useEffect: login-left el:", el);
    if (el) {
      console.log(
        "[DBG] login-left computed backgroundImage:",
        getComputedStyle(el).backgroundImage
      );
      console.log(
        "[DBG] login-left display/visibility/opacity:",
        getComputedStyle(el).display,
        getComputedStyle(el).visibility,
        getComputedStyle(el).opacity
      );
      console.log(
        "[DBG] login-left bounding rect:",
        el.getBoundingClientRect()
      );
      console.log(
        "[DBG] login-left children count:",
        el.children.length,
        el.children
      );
    }
    if (img) {
      console.log(
        "[DBG] fallback img attrs src/natural/offset:",
        img.src,
        img.naturalWidth,
        img.naturalHeight,
        img.offsetWidth,
        img.offsetHeight
      );
      console.log(
        "[DBG] fallback img computed:",
        getComputedStyle(img).display,
        getComputedStyle(img).visibility,
        getComputedStyle(img).opacity
      );
      // Force high visibility while debugging
      img.style.zIndex = "2147483647";
      img.style.outline = "4px solid lime";
      img.style.opacity = "1 !important";
      img.style.display = "block !important";
      img.style.visibility = "visible !important";
      img.style.pointerEvents = "none";
      img.style.transform = "none";
      img.style.filter = "none";
      img.style.background = "transparent";
      img.style.position = "absolute";
      img.style.inset = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";

      // Also remove container background-image to test fallback visibility
      if (el) {
        console.log("[DBG] Removing container background-image for debug");
        el.style.backgroundImage = "none";
      }
    } else {
      console.warn("[DBG] fallback img not found");
    }
  }, []);

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
      {/* FORMULÁRIO */}
      <div className="login-right">
        <div className="login-box">
          {/* <img src={logo} alt="ProjectGO" className="login-logo" /> */}
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

      {/* IMAGEM GRANDE */}
      <div
        ref={leftRef}
        className="login-left"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center right",
        }}
      >
        {/* fallback: imagem <img> para garantir visibilidade em caso de problema com background-image */}
        <img
          ref={imgRef}
          src={loginBg}
          alt="login-bg"
          className="login-left-img-fallback"
          onLoad={() =>
            console.log("[DBG] loginBg <img> loaded (fallback)", loginBg)
          }
          onError={(e) =>
            console.error("[DBG] loginBg <img> failed to load", e, loginBg)
          }
        />
      </div>
    </div>
  );
}

export default Login;
