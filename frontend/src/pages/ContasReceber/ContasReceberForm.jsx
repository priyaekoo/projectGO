import { useEffect, useState } from "react";
import api from "../../services/api";
import "../Usuarios/usuarios.css";

function ContaReceberForm({ aberto, onClose, onSucesso, contaEditar = null }) {
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    id_cliente: "",
    descricao: "",
    valor: "",
    data_vencimento: "",
  });

  const [erro, setErro] = useState("");

  /* ======================
     LOAD CLIENTES
  ====================== */
  const carregarClientes = async () => {
    const res = await api.get("/clientes");
    // apenas clientes ativos
    setClientes(res.data.filter((c) => c.ativo));
  };

  useEffect(() => {
    if (aberto) {
      carregarClientes();

      if (contaEditar) {
        setForm({
          id_cliente: contaEditar.id_cliente,
          descricao: contaEditar.descricao,
          valor: contaEditar.valor,
          data_vencimento: contaEditar.data_vencimento,
        });
      } else {
        setForm({
          id_cliente: "",
          descricao: "",
          valor: "",
          data_vencimento: "",
        });
      }

      setErro("");
    }
  }, [aberto, contaEditar]);

  if (!aberto) return null;

  /* ======================
     HANDLERS
  ====================== */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (contaEditar) {
        await api.patch(`/contas-receber/${contaEditar.id}`, {
          descricao: form.descricao,
          valor: form.valor,
          data_vencimento: form.data_vencimento,
        });
      } else {
        await api.post("/contas-receber", form);
      }

      onSucesso();
      onClose();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao salvar conta a receber");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>
          {contaEditar ? "Editar Conta a Receber" : "Nova Conta a Receber"}
        </h2>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <select
            name="id_cliente"
            value={form.id_cliente}
            onChange={handleChange}
            required
            disabled={!!contaEditar}
          >
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="descricao"
            placeholder="Descrição"
            value={form.descricao}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="valor"
            placeholder="Valor"
            step="0.01"
            min="0.01"
            value={form.valor}
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="data_vencimento"
            value={form.data_vencimento}
            onChange={handleChange}
            required
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

export default ContaReceberForm;
