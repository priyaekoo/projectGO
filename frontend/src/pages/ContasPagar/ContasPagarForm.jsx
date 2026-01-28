import { useEffect, useState } from "react";
import api from "../../services/api";
import "../Usuarios/usuarios.css";

function ContasPagarForm({ aberto, onClose, onSucesso, contaEditar = null }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [form, setForm] = useState({
    id_fornecedor: "",
    id_cliente: "",
    descricao: "",
    valor: "",
    data_vencimento: "",
  });

  const [erro, setErro] = useState("");

  const carregarDados = async () => {
    try {
      const [resFornecedores, resClientes] = await Promise.all([
        api.get("/fornecedores"),
        api.get("/clientes"),
      ]);
      setFornecedores(resFornecedores.data);
      setClientes(resClientes.data);
    } catch {
      setErro("Erro ao carregar dados");
    }
  };

  useEffect(() => {
    if (aberto) {
      carregarDados();

      if (contaEditar) {
        setForm({
          id_fornecedor: contaEditar.id_fornecedor,
          id_cliente: contaEditar.id_cliente || "",
          descricao: contaEditar.descricao,
          valor: contaEditar.valor,
          data_vencimento: contaEditar.data_vencimento,
        });
      } else {
        setForm({
          id_fornecedor: "",
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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      if (contaEditar) {
        await api.patch(`/contas-pagar/${contaEditar.id}`, {
          descricao: form.descricao,
          valor: form.valor,
          data_vencimento: form.data_vencimento,
        });
      } else {
        await api.post("/contas-pagar", form);
      }

      onSucesso();
      onClose();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao salvar conta a pagar");
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{contaEditar ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}</h2>

        {erro && <p className="mensagem-erro">{erro}</p>}

        <form className="form" onSubmit={handleSubmit}>
          <label>Fornecedor (quem vai receber)</label>
          <select
            name="id_fornecedor"
            value={form.id_fornecedor}
            onChange={handleChange}
            required
            disabled={!!contaEditar}
          >
            <option value="">Selecione o fornecedor</option>
            {fornecedores
              .filter((f) => f.ativo)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome_razao_social}
                </option>
              ))}
          </select>

          <label>Cliente (quem vai pagar) - opcional</label>
          <select
            name="id_cliente"
            value={form.id_cliente}
            onChange={handleChange}
          >
            <option value="">Selecionar no momento do pagamento</option>
            {clientes
              .filter((c) => c.ativo)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_completo}
                </option>
              ))}
          </select>

          <label>Descricao</label>
          <input
            type="text"
            name="descricao"
            placeholder="Descricao"
            value={form.descricao}
            onChange={handleChange}
            required
          />

          <label>Valor</label>
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

          <label>Data de Vencimento</label>
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

export default ContasPagarForm;
