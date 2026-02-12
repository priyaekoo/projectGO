import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatarMoeda, formatarPercentual } from "../../services/formatters";
import AplicacaoForm from "./AplicacaoForm";
import RentabilidadeModal from "./RentabilidadeModal";
import "./investimentos.css";

function Investimentos() {
  const [tab, setTab] = useState("fundos");
  const [fundos, setFundos] = useState([]);
  const [aplicacoes, setAplicacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [carteira, setCarteira] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [modalAplicacao, setModalAplicacao] = useState(false);
  const [fundoSelecionado, setFundoSelecionado] = useState(null);
  const [modalRentabilidade, setModalRentabilidade] = useState(false);
  const [dadosRentabilidade, setDadosRentabilidade] = useState(null);

  const carregarFundos = async () => {
    try {
      const res = await api.get("/investimentos/fundos");
      setFundos(res.data);
    } catch {
      console.error("Erro ao carregar fundos");
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

  const carregarAplicacoes = async () => {
    try {
      const url = clienteSelecionado
        ? `/investimentos/aplicacoes?id_cliente=${clienteSelecionado}`
        : "/investimentos/aplicacoes";
      const res = await api.get(url);
      setAplicacoes(res.data);
    } catch {
      console.error("Erro ao carregar aplicacoes");
    }
  };

  const carregarCarteira = async () => {
    if (!clienteSelecionado) {
      setCarteira(null);
      return;
    }
    try {
      const res = await api.get(`/investimentos/carteira/${clienteSelecionado}`);
      setCarteira(res.data);
    } catch {
      console.error("Erro ao carregar carteira");
    }
  };

  useEffect(() => {
    carregarFundos();
    carregarClientes();
  }, []);

  useEffect(() => {
    carregarAplicacoes();
    carregarCarteira();
  }, [clienteSelecionado]);

  const abrirAplicacao = (fundo) => {
    setFundoSelecionado(fundo);
    setModalAplicacao(true);
  };

  const realizarAplicacao = async (dados) => {
    setErro("");
    setSucesso("");
    try {
      const res = await api.post("/investimentos/aplicar", dados);
      setSucesso(`Aplicacao realizada em ${res.data.fundo}: ${formatarMoeda(dados.valor)}`);
      setModalAplicacao(false);
      carregarAplicacoes();
      carregarCarteira();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao aplicar");
    }
  };

  const resgatarAplicacao = async (id) => {
    setErro("");
    setSucesso("");
    try {
      const res = await api.post(`/investimentos/resgatar/${id}`);
      setSucesso(
        `Resgate realizado! Valor: ${formatarMoeda(res.data.valor_resgate)} (rendimento: ${formatarMoeda(res.data.valor_resgate - res.data.valor_aplicado)})`
      );
      carregarAplicacoes();
      carregarCarteira();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao resgatar");
    }
  };

  const verRentabilidade = async (id) => {
    try {
      const res = await api.get(`/investimentos/rentabilidade/${id}`);
      setDadosRentabilidade(res.data);
      setModalRentabilidade(true);
    } catch {
      setErro("Erro ao calcular rentabilidade");
    }
  };

  const formatarData = (data) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="investimentos-container">
      <h1>Investimentos</h1>

      <div className="inv-tabs">
        <button className={tab === "fundos" ? "active" : ""} onClick={() => setTab("fundos")}>
          Fundos Disponiveis
        </button>
        <button className={tab === "carteira" ? "active" : ""} onClick={() => setTab("carteira")}>
          Minha Carteira
        </button>
      </div>

      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      {/* ===== FUNDOS ===== */}
      {tab === "fundos" && (
        <div>
          <h2>Fundos de Investimento</h2>
          <div className="fundos-grid">
            {fundos.map((f) => (
              <div key={f.id} className="fundo-card">
                <h3>{f.nome}</h3>
                <span className="fundo-tipo">{f.tipo}</span>

                <div className="fundo-info">
                  <span className="label">Benchmark</span>
                  <span className="valor">{f.benchmark}</span>
                </div>
                <div className="fundo-info">
                  <span className="label">Rent. Anual</span>
                  <span
                    className={`valor ${
                      Number(f.rentabilidade_anual) >= 0
                        ? "rentabilidade-positiva"
                        : "rentabilidade-negativa"
                    }`}
                  >
                    {formatarPercentual(f.rentabilidade_anual)}
                  </span>
                </div>
                <div className="fundo-info">
                  <span className="label">Taxa Admin</span>
                  <span className="valor">{formatarPercentual(f.taxa_administracao)}</span>
                </div>
                <div className="fundo-info">
                  <span className="label">Taxa Perf.</span>
                  <span className="valor">{formatarPercentual(f.taxa_performance)}</span>
                </div>

                <button className="btn-aplicar" onClick={() => abrirAplicacao(f)}>
                  Aplicar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CARTEIRA ===== */}
      {tab === "carteira" && (
        <div>
          <div className="cliente-selector">
            <label>Cliente:</label>
            <select
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
            >
              <option value="">Todos os clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {carteira && (
            <div className="carteira-resumo">
              <div className="carteira-card">
                <div className="label">Total Aplicado</div>
                <div className="valor">{formatarMoeda(carteira.total_aplicado)}</div>
              </div>
              <div className="carteira-card">
                <div className="label">Valor Atual</div>
                <div className="valor">{formatarMoeda(carteira.total_atual)}</div>
              </div>
              <div className="carteira-card">
                <div className="label">Rendimento</div>
                <div className={`valor ${carteira.rendimento_total >= 0 ? "positivo" : "negativo"}`}>
                  {formatarMoeda(carteira.rendimento_total)}
                </div>
              </div>
              <div className="carteira-card">
                <div className="label">Rentabilidade</div>
                <div
                  className={`valor ${carteira.rentabilidade_total >= 0 ? "positivo" : "negativo"}`}
                >
                  {formatarPercentual(carteira.rentabilidade_total)}
                </div>
              </div>
            </div>
          )}

          <h2>Aplicacoes</h2>
          {aplicacoes.length === 0 ? (
            <p>Nenhuma aplicacao encontrada</p>
          ) : (
            <table className="inv-tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fundo</th>
                  <th>Valor Aplicado</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {aplicacoes.map((a) => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td>{a.nome_cliente}</td>
                    <td>{a.nome_fundo}</td>
                    <td>{formatarMoeda(a.valor_aplicado)}</td>
                    <td>{formatarData(a.data_aplicacao)}</td>
                    <td>
                      <span className={a.status === "ATIVA" ? "badge-ativa" : "badge-resgatada"}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      {a.status === "ATIVA" && (
                        <>
                          <button className="btn-resgatar" onClick={() => resgatarAplicacao(a.id)}>
                            Resgatar
                          </button>
                          <button
                            className="btn-rentabilidade"
                            onClick={() => verRentabilidade(a.id)}
                          >
                            Rentab.
                          </button>
                        </>
                      )}
                      {a.status === "RESGATADA" && (
                        <span style={{ fontSize: 12, color: "#888" }}>
                          Resgate: {formatarMoeda(a.valor_resgate)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modais */}
      {modalAplicacao && fundoSelecionado && (
        <AplicacaoForm
          fundo={fundoSelecionado}
          clientes={clientes}
          onSalvar={realizarAplicacao}
          onCancelar={() => setModalAplicacao(false)}
        />
      )}

      {modalRentabilidade && (
        <RentabilidadeModal
          dados={dadosRentabilidade}
          onFechar={() => setModalRentabilidade(false)}
        />
      )}
    </div>
  );
}

export default Investimentos;
