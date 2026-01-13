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

  function unformatCpf(value) {
    return value ? String(value).replace(/\D/g, "") : "";
  }

  function formatCpf(value) {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
    if (digits.length <= 9)
      return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
    return digits.replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      function (_, a, b, c, d) {
        return d ? `${a}.${b}.${c}-${d}` : `${a}.${b}.${c}`;
      }
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "cpf") {
      setForm({ ...form, cpf: unformatCpf(value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  function isValidCPFFront(value) {
    if (!value) return false;
    const digits = String(value).replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcCheckDigit = (arr) => {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += Number(arr[i]) * (arr.length + 1 - i);
      }
      const mod = (sum * 10) % 11;
      return mod === 10 ? 0 : mod;
    };

    const numbers = digits.split("");
    const dv1 = calcCheckDigit(numbers.slice(0, 9));
    const dv2 = calcCheckDigit(numbers.slice(0, 9).concat(String(dv1)));

    return dv1 === Number(numbers[9]) && dv2 === Number(numbers[10]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isValidCPFFront(form.cpf)) {
      setErro("CPF inválido");
      return;
    }

    try {
      await api.post("/usuarios", form);
      navigate("/dashboard/usuarios");
    } catch (error) {
      const msg = error?.response?.data?.erro || "Erro ao cadastrar usuário.";
      setErro(msg);
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
          value={formatCpf(form.cpf)}
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
