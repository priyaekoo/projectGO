import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatarMoeda } from "../../services/formatters";
import "./conciliacao.css";

function Conciliacao() {
  const [tab, setTab] = useState("resumo");
  const [resumo, setResumo] = useState(null);
  const [externas, setExternas] = useState([]);
  const [conciliacoes, setConciliacoes] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [jsonImportar, setJsonImportar] = useState("");
  const [resultadoImportacao, setResultadoImportacao] = useState(null);
  const [simulacao, setSimulacao] = useState(null);

  const carregarResumo = async () => {
    try {
      const res = await api.get("/conciliacao/resumo");
      setResumo(res.data);
    } catch {
      console.error("Erro ao carregar resumo");
    }
  };

  const carregarExternas = async () => {
    try {
      const res = await api.get("/conciliacao/externas");
      setExternas(res.data);
    } catch {
      console.error("Erro ao carregar transacoes externas");
    }
  };

  const carregarConciliacoes = async () => {
    try {
      const res = await api.get("/conciliacao");
      setConciliacoes(res.data);
    } catch {
      console.error("Erro ao carregar conciliacoes");
    }
  };

  useEffect(() => {
    carregarResumo();
    carregarExternas();
    carregarConciliacoes();
  }, []);

  const importarTransacoes = async () => {
    setErro("");
    setSucesso("");
    setResultadoImportacao(null);

    try {
      const transacoes = JSON.parse(jsonImportar);
      const payload = Array.isArray(transacoes)
        ? { transacoes }
        : { transacoes: transacoes.transacoes || [transacoes] };

      const res = await api.post("/conciliacao/importar", payload);
      setSucesso(res.data.mensagem);
      setResultadoImportacao(res.data);
      setJsonImportar("");
      carregarExternas();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setErro("JSON invalido. Verifique o formato.");
      } else {
        setErro(error?.response?.data?.erro || "Erro ao importar");
      }
    }
  };

  const executarConciliacao = async () => {
    setErro("");
    setSucesso("");
    try {
      const res = await api.post("/conciliacao/executar");
      setSucesso(
        `Conciliacao executada: ${res.data.conciliadas} conciliadas, ${res.data.divergentes} divergentes, ${res.data.ausentes} ausentes`
      );
      carregarResumo();
      carregarConciliacoes();
      carregarExternas();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao executar conciliacao");
    }
  };

  const gerarSimulacao = async () => {
    setErro("");
    setSucesso("");
    setSimulacao(null);
    try {
      const res = await api.post("/conciliacao/simular");
      setSimulacao(res.data);
      setSucesso(res.data.mensagem);
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao gerar simulacao");
    }
  };

  const importarSimulacao = async () => {
    if (!simulacao) return;
    setErro("");
    setSucesso("");
    try {
      const res = await api.post("/conciliacao/importar", {
        transacoes: simulacao.transacoes,
      });
      setSucesso(res.data.mensagem);
      setSimulacao(null);
      carregarExternas();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao importar simulacao");
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
      CONCILIADA: "badge-conciliada",
      DIVERGENTE: "badge-divergente",
      AUSENTE: "badge-ausente",
      PENDENTE: "badge-pendente-conc",
    };
    return <span className={map[status] || "badge-pendente-conc"}>{status}</span>;
  };

  return (
    <div className="conciliacao-container">
      <h1>Conciliacao Bancaria</h1>

      <div className="conc-tabs">
        <button
          className={tab === "resumo" ? "active" : ""}
          onClick={() => setTab("resumo")}
        >
          Resumo
        </button>
        <button
          className={tab === "importar" ? "active" : ""}
          onClick={() => setTab("importar")}
        >
          Importar
        </button>
        <button
          className={tab === "externas" ? "active" : ""}
          onClick={() => setTab("externas")}
        >
          Transacoes Externas
        </button>
        <button
          className={tab === "resultados" ? "active" : ""}
          onClick={() => setTab("resultados")}
        >
          Resultados
        </button>
      </div>

      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      {/* ===== TAB RESUMO ===== */}
      {tab === "resumo" && (
        <div>
          {resumo && (
            <div className="conc-resumo">
              <div className="conc-card">
                <div className="label">Total</div>
                <div className="valor total">{resumo.total}</div>
              </div>
              <div className="conc-card">
                <div className="label">Conciliadas</div>
                <div className="valor conciliada">{resumo.conciliadas}</div>
              </div>
              <div className="conc-card">
                <div className="label">Divergentes</div>
                <div className="valor divergente">{resumo.divergentes}</div>
              </div>
              <div className="conc-card">
                <div className="label">Ausentes</div>
                <div className="valor ausente">{resumo.ausentes}</div>
              </div>
              <div className="conc-card">
                <div className="label">Total Divergencia</div>
                <div className="valor divergente">
                  {formatarMoeda(resumo.total_diferenca)}
                </div>
              </div>
            </div>
          )}

          <div className="conc-acoes-topo">
            <button className="btn-conc executar" onClick={executarConciliacao}>
              Executar Conciliacao
            </button>
            <button className="btn-conc simular" onClick={gerarSimulacao}>
              Gerar Simulacao SPB
            </button>
          </div>

          {simulacao && (
            <div className="simulacao-preview">
              <h3>Simulacao Gerada ({simulacao.transacoes.length} transacoes)</h3>
              <p>
                Transacoes geradas com base nas movimentacoes internas. Inclui
                divergencias e transacoes fantasma para teste.
              </p>
              <button className="btn-importar-simulacao" onClick={importarSimulacao}>
                Importar Simulacao
              </button>
            </div>
          )}

          {!resumo || resumo.total === 0 ? (
            <div style={{ marginTop: 20 }}>
              <p>Nenhuma conciliacao realizada ainda.</p>
              <p style={{ color: "#888", fontSize: 13 }}>
                1. Importe transacoes externas (ou gere uma simulacao)
                <br />
                2. Execute a conciliacao para comparar com as movimentacoes internas
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* ===== TAB IMPORTAR ===== */}
      {tab === "importar" && (
        <div>
          <div className="importacao-area">
            <h3>Importar Transacoes Externas (JSON)</h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>
              Cole o JSON das transacoes do SPB. Formato esperado: array de objetos com
              codigo_externo, tipo (CREDITO/DEBITO), valor, data_transacao.
            </p>
            <textarea
              value={jsonImportar}
              onChange={(e) => setJsonImportar(e.target.value)}
              placeholder={`[
  {
    "codigo_externo": "SPB-001",
    "id_cliente": 1,
    "tipo": "CREDITO",
    "valor": 1000.00,
    "descricao": "Deposito via SPB",
    "data_transacao": "2025-01-15T10:00:00Z"
  }
]`}
            />
            <button
              className="btn-conc importar"
              style={{ marginTop: 10 }}
              onClick={importarTransacoes}
              disabled={!jsonImportar.trim()}
            >
              Importar
            </button>
          </div>

          {resultadoImportacao && (
            <div className="resultado-importacao">
              <h4>
                Resultado: {resultadoImportacao.sucesso}/{resultadoImportacao.total} importadas
              </h4>
              {resultadoImportacao.resultados.map((r, i) => (
                <div
                  key={i}
                  className={`resultado-item-conc ${r.status === "OK" ? "ok" : "erro"}`}
                >
                  {r.codigo_externo}: {r.status}
                  {r.erro && ` - ${r.erro}`}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button className="btn-conc simular" onClick={gerarSimulacao}>
              Gerar Simulacao Automatica
            </button>

            {simulacao && (
              <div className="simulacao-preview">
                <h3>Simulacao Gerada ({simulacao.transacoes.length} transacoes)</h3>
                <pre style={{ fontSize: 11, maxHeight: 200, overflow: "auto", background: "#f5f5f5", padding: 10, borderRadius: 6 }}>
                  {JSON.stringify(simulacao.transacoes, null, 2)}
                </pre>
                <button className="btn-importar-simulacao" onClick={importarSimulacao}>
                  Importar Simulacao
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB EXTERNAS ===== */}
      {tab === "externas" && (
        <div>
          <h2>Transacoes Externas ({externas.length})</h2>
          {externas.length === 0 ? (
            <p>Nenhuma transacao externa importada</p>
          ) : (
            <table className="conc-tabela">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Descricao</th>
                  <th>Data</th>
                  <th>Origem</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {externas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.codigo_externo}</td>
                    <td>{t.nome_cliente || "-"}</td>
                    <td>
                      <span className={t.tipo === "CREDITO" ? "badge-credito" : "badge-debito"}>
                        {t.tipo}
                      </span>
                    </td>
                    <td>{formatarMoeda(t.valor)}</td>
                    <td>{t.descricao}</td>
                    <td>{formatarData(t.data_transacao)}</td>
                    <td>{t.origem}</td>
                    <td>{badgeStatus(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== TAB RESULTADOS ===== */}
      {tab === "resultados" && (
        <div>
          <div className="conc-acoes-topo">
            <button className="btn-conc executar" onClick={executarConciliacao}>
              Re-executar Conciliacao
            </button>
          </div>

          <h2>Resultados da Conciliacao ({conciliacoes.length})</h2>
          {conciliacoes.length === 0 ? (
            <p>Nenhuma conciliacao realizada</p>
          ) : (
            <table className="conc-tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cod. Externo</th>
                  <th>Status</th>
                  <th>Tipo Diverg.</th>
                  <th>Valor Interno</th>
                  <th>Valor Externo</th>
                  <th>Diferenca</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {conciliacoes.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.codigo_externo}</td>
                    <td>{badgeStatus(c.status)}</td>
                    <td>{c.tipo_divergencia || "-"}</td>
                    <td>
                      {c.valor_interno ? formatarMoeda(c.valor_interno) : "-"}
                    </td>
                    <td>
                      {c.valor_externo ? formatarMoeda(c.valor_externo) : "-"}
                    </td>
                    <td
                      style={{
                        color: c.diferenca && Number(c.diferenca) > 0 ? "#e74c3c" : "#333",
                        fontWeight: c.diferenca && Number(c.diferenca) > 0 ? 600 : 400,
                      }}
                    >
                      {c.diferenca ? formatarMoeda(c.diferenca) : "-"}
                    </td>
                    <td>{formatarData(c.data_conciliacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Conciliacao;
