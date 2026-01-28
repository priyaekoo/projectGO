import { useEffect, useState } from "react";
import api from "../../services/api";
import "./transferencias.css";

function Transferencias() {
  const [clientes, setClientes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    id_cliente_origem: "",
    id_cliente_destino: "",
    valor: "",
    descricao: "",
  });

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data.filter((c) => c.ativo));
    } catch {
      setErro("Erro ao carregar clientes");
    }
  };

  const carregarHistorico = async () => {
    try {
      const res = await api.get("/transferencias");
      setHistorico(res.data);
    } catch {
      console.error("Erro ao carregar historico");
    }
  };

  useEffect(() => {
    carregarClientes();
    carregarHistorico();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (form.id_cliente_origem === form.id_cliente_destino) {
      setErro("Cliente origem e destino devem ser diferentes");
      return;
    }

    try {
      await api.post("/transferencias", form);
      setSucesso("Transferencia realizada com sucesso!");
      setForm({
        id_cliente_origem: "",
        id_cliente_destino: "",
        valor: "",
        descricao: "",
      });
      carregarHistorico();
    } catch (error) {
      const msg = error?.response?.data?.erro || "Erro ao realizar transferencia";
      const saldo = error?.response?.data?.saldo_atual;
      if (saldo !== undefined) {
        setErro(`${msg}. Saldo disponivel: R$ ${Number(saldo).toFixed(2)}`);
      } else {
        setErro(msg);
      }
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="transferencias-container">
      <h1>Transferencias</h1>

      <div className="transferencias-content">
        {/* FORMULARIO */}
        <div className="transferencias-form-box">
          <h2>Nova Transferencia</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cliente Origem (quem envia)</label>
              <select
                name="id_cliente_origem"
                value={form.id_cliente_origem}
                onChange={handleChange}
                required
              >
                <option value="">Selecione</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Cliente Destino (quem recebe)</label>
              <select
                name="id_cliente_destino"
                value={form.id_cliente_destino}
                onChange={handleChange}
                required
              >
                <option value="">Selecione</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_completo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Valor</label>
              <input
                type="number"
                name="valor"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                value={form.valor}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Descricao (opcional)</label>
              <input
                type="text"
                name="descricao"
                placeholder="Ex: Pagamento de servico"
                value={form.descricao}
                onChange={handleChange}
              />
            </div>

            {erro && <p className="mensagem-erro">{erro}</p>}
            {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

            <button type="submit" className="btn-transferir">
              Realizar Transferencia
            </button>
          </form>
        </div>

        {/* HISTORICO */}
        <div className="transferencias-historico">
          <h2>Historico</h2>

          {historico.length === 0 ? (
            <p className="mensagem-vazia">Nenhuma transferencia realizada</p>
          ) : (
            <table className="historico-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Descricao</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((t) => (
                  <tr key={t.id} style={{ opacity: t.estornado ? 0.5 : 1 }}>
                    <td>{formatarData(t.data_movimentacao)}</td>
                    <td>{t.nome_cliente}</td>
                    <td>
                      <span className={t.tipo === "ENTRADA" ? "tipo-entrada" : "tipo-saida"}>
                        {t.tipo === "ENTRADA" ? "Recebeu" : "Enviou"}
                      </span>
                    </td>
                    <td>R$ {Number(t.valor).toFixed(2)}</td>
                    <td>
                      {t.descricao}
                      {t.estornado && " (ESTORNADO)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Transferencias;
