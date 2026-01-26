import { useEffect, useState } from "react";
import api from "../../services/api";
import "../Usuarios/usuarios.css";

function ClienteForm({ aberto, onClose, onSucesso, clienteEditar = null }) {
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    cpf_cnpj: "",
    observacao: "",
  });

  const [erro, setErro] = useState("");

  useEffect(() => {
    if (clienteEditar) {
      setForm({
        nome_completo: clienteEditar.nome_completo || "",
        email: clienteEditar.email || "",
        cpf_cnpj: clienteEditar.cpf_cnpj || "",
        observacao: clienteEditar.observacao || "",
      });
    } else {
      setForm({
        nome_completo: "",
        email: "",
        cpf_cnpj: "",
        observacao: "",
      });
    }
    setErro("");
  }, [clienteEditar, aberto]);

  if (!aberto) return null;

  /* ======================
     UTIL
  ====================== */
  function onlyNumbers(value = "") {
    return value.replace(/\D/g, "");
  }

  /* ======================
     HANDLERS
  ====================== */
  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "cpf_cnpj") {
      const numeros = onlyNumbers(value).slice(0, 14); // 🔒 limite 14
      setForm({ ...form, cpf_cnpj: numeros });
      return;
    }

    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (clienteEditar) {
        await api.patch(`/clientes/${clienteEditar.id}`, form);
      } else {
        await api.post("/clientes", form);
      }

      onSucesso();
      onClose();
    } catch (error) {
      const msg = error?.response?.data?.erro || "Erro ao salvar cliente.";
      setErro(msg);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{clienteEditar ? "Editar Cliente" : "Novo Cliente"}</h2>

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
            name="cpf_cnpj"
            placeholder="CPF ou CNPJ (somente números)"
            value={form.cpf_cnpj}
            onChange={handleChange}
            maxLength={14} // 🔒 segurança extra
            required
          />

          <input
            type="text"
            name="observacao"
            placeholder="Observação"
            value={form.observacao}
            onChange={handleChange}
          />

          <div className="acoes-modal">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="btn-confirmar">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClienteForm;
