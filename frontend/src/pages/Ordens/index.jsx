import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatarMoeda } from "../../services/formatters";
import OrdemForm from "./OrdemForm";
import "./ordens.css";

function Ordens() {
  const [mercado, setMercado] = useState(null);
  const [ativos, setAtivos] = useState([]);
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modalOrdem, setModalOrdem] = useState(false);

  const carregarMercado = async () => {
    try {
      const res = await api.get("/ordens/mercado");
      setMercado(res.data);
    } catch {
      console.error("Erro ao consultar mercado");
    }
  };

  const carregarAtivos = async () => {
    try {
      const res = await api.get("/ordens/ativos");
      setAtivos(res.data);
    } catch {
      console.error("Erro ao carregar ativos");
    }
  };

  const carregarOrdens = async () => {
    try {
      const url = clienteFiltro
        ? `/ordens?id_cliente=${clienteFiltro}`
        : "/ordens";
      const res = await api.get(url);
      setOrdens(res.data);
    } catch {
      console.error("Erro ao carregar ordens");
    }
  };

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data.filter((c) => c.ativo));
    } catch {
      console.error("Erro ao carregar clientes");
    }
  };

  useEffect(() => {
    carregarMercado();
    carregarAtivos();
    carregarClientes();
    carregarOrdens();

    // Atualizar status do mercado a cada 60s
    const interval = setInterval(carregarMercado, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    carregarOrdens();
  }, [clienteFiltro]);

  const criarOrdem = async (form) => {
    setErro("");
    setSucesso("");
    try {
      const res = await api.post("/ordens", form);
      setSucesso(`Ordem #${res.data.ordem.id} criada com sucesso!`);
      setModalOrdem(false);
      carregarOrdens();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao criar ordem");
    }
  };

  const cancelarOrdem = async (id) => {
    setErro("");
    setSucesso("");
    try {
      await api.patch(`/ordens/${id}/cancelar`);
      setSucesso(`Ordem #${id} cancelada`);
      carregarOrdens();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao cancelar");
    }
  };

  const executarOrdem = async (id) => {
    setErro("");
    setSucesso("");
    try {
      const res = await api.post(`/ordens/${id}/executar`);
      setSucesso(
        `Ordem executada! ${res.data.tipo} de ${res.data.quantidade}x ${res.data.ativo} = ${formatarMoeda(res.data.valor_total)}`
      );
      carregarOrdens();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao executar ordem");
    }
  };

  const formatarData = (data) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const badgeStatus = (status) => {
    const map = {
      PENDENTE: "badge-pendente",
      EXECUTADA: "badge-executada",
      CANCELADA: "badge-cancelada",
      REJEITADA: "badge-rejeitada",
    };
    return <span className={map[status] || "badge-pendente"}>{status}</span>;
  };

  return (
    <div className="ordens-container">
      <h1>Ordens de Compra e Venda</h1>

      {/* Status do mercado */}
      {mercado && (
        <div className={`mercado-status ${mercado.aberto ? "mercado-aberto" : "mercado-fechado"}`}>
          <span className={`mercado-indicator ${mercado.aberto ? "aberto" : "fechado"}`} />
          <span>
            Mercado {mercado.aberto ? "ABERTO" : "FECHADO"} | Hora: {mercado.hora_atual} |
            Funcionamento: {mercado.abertura} - {mercado.fechamento} |
            {mercado.dia_semana} {mercado.dia_util ? "(dia util)" : "(nao util)"}
          </span>
        </div>
      )}

      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      <div className="ordens-content">
        {/* Ativos disponiveis */}
        <div className="ordens-form-box">
          <h2>Ativos Disponiveis</h2>
          <button
            className="btn-criar-ordem compra"
            style={{ marginBottom: 15 }}
            onClick={() => setModalOrdem(true)}
          >
            + Nova Ordem
          </button>

          <table className="ordens-tabela">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Preco</th>
              </tr>
            </thead>
            <tbody>
              {ativos.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.codigo}</strong></td>
                  <td>{a.nome}</td>
                  <td>{a.tipo}</td>
                  <td>{formatarMoeda(a.preco_atual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lista de ordens */}
        <div className="ordens-lista">
          <h2>Ordens</h2>

          <div className="ordens-filtro">
            <label>Filtrar por cliente:</label>
            <select
              value={clienteFiltro}
              onChange={(e) => setClienteFiltro(e.target.value)}
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome_completo}</option>
              ))}
            </select>
          </div>

          {ordens.length === 0 ? (
            <p>Nenhuma ordem registrada</p>
          ) : (
            <table className="ordens-tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Ativo</th>
                  <th>Tipo</th>
                  <th>Qtd</th>
                  <th>Preco</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>{o.nome_cliente}</td>
                    <td><strong>{o.codigo_ativo}</strong></td>
                    <td>
                      <span className={o.tipo === "COMPRA" ? "badge-compra" : "badge-venda"}>
                        {o.tipo}
                      </span>
                    </td>
                    <td>{o.quantidade}</td>
                    <td>{formatarMoeda(o.preco_unitario)}</td>
                    <td>{formatarMoeda(o.valor_total)}</td>
                    <td>{badgeStatus(o.status)}</td>
                    <td>{formatarData(o.data_criacao)}</td>
                    <td>
                      {o.status === "PENDENTE" && (
                        <>
                          <button
                            className="btn-executar-ordem"
                            onClick={() => executarOrdem(o.id)}
                          >
                            Executar
                          </button>
                          <button
                            className="btn-cancelar-ordem"
                            onClick={() => cancelarOrdem(o.id)}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {o.motivo_rejeicao && (
                        <small style={{ color: "#e74c3c", display: "block", marginTop: 3 }}>
                          {o.motivo_rejeicao}
                        </small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal nova ordem */}
      {modalOrdem && (
        <OrdemForm
          ativos={ativos}
          clientes={clientes}
          mercadoAberto={mercado?.aberto}
          onSalvar={criarOrdem}
          onCancelar={() => setModalOrdem(false)}
        />
      )}
    </div>
  );
}

export default Ordens;
