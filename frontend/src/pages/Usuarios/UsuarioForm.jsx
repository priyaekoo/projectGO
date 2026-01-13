import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./usuarios.css";

function UsuarioForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    cpf: "",
    senha: "",
  });

  const [erro, setErro] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await api.post("/usuarios", form);
      navigate("/dashboard/usuarios");
    } catch {
      setErro("Erro ao cadastrar usuário.");
    }
  }

  return (
    <div className="usuarios-container">
      <h1>Novo Usuário</h1>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <form className="form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="nome_completo"
          placeholder="Nome completo"
          value={form.nome_completo}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="cpf"
          placeholder="CPF"
          value={form.cpf}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="senha"
          placeholder="Senha"
          value={form.senha}
          onChange={handleChange}
          required
        />

        <div className="acoes">
          <button type="button" onClick={() => navigate(-1)}>
            Cancelar
          </button>

          <button type="submit" className="btn-adicionar">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

export default UsuarioForm;
