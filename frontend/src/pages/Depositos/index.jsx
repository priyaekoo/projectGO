import { useEffect, useState } from "react";
import api from "../../services/api";
import "./depositos.css";

function Depositos() {
  const [depositos, setDepositos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [form, setForm] = useState({
    id_cliente: "",
    valor: "",
    descricao: "",
  });

  const carregarDepositos = async () => {
    try {
      const res = await api.get("/depositos");
      setDepositos(res.data);
    } catch {
      setErro("Erro ao carregar depósitos");
    }
  };

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data.filter((c) => c.ativo));
    } catch {
      setErro("Erro ao carregar clientes");
    }
  };

  useEffect(() => {
    carregarDepositos();
    carregarClientes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const salvarDeposito = async () => {
    if (!form.id_cliente || !form.valor) {
      setErro("Cliente e valor são obrigatórios");
      return;
    }

    try {
      await api.post("/depositos", {
        id_cliente: form.id_cliente,
        valor: form.valor,
        descricao: form.descricao,
      });

      setMensagem("Depósito realizado com sucesso");
      setErro("");
      setModalAberto(false);
      setForm({ id_cliente: "", valor: "", descricao: "" });
      carregarDepositos();
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao realizar depósito");
    }
  };

  return (
    <div className="usuarios-container">
      <h1>Depósitos</h1>

      <div className="topo-acoes">
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          Criar Depósito
        </button>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

      <table className="usuarios-tabela">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {depositos.map((d) => (
            <tr key={d.id}>
              <td>{d.nome_completo}</td>
              <td>R$ {Number(d.valor).toFixed(2)}</td>
              <td>{new Date(d.data_movimentacao).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Depósito</h2>

            <select
              name="id_cliente"
              value={form.id_cliente}
              onChange={handleChange}
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_completo}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="valor"
              placeholder="Valor"
              value={form.valor}
              onChange={handleChange}
            />

            <input
              type="text"
              name="descricao"
              placeholder="Descrição (opcional)"
              value={form.descricao}
              onChange={handleChange}
            />

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={salvarDeposito}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Depositos;
