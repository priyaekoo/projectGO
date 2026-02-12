import { useEffect, useState } from "react";
import api from "../../services/api";
import InvestigacaoForm from "./InvestigacaoForm";
import "./aml.css";

function AML() {
  const [tab, setTab] = useState("pep");
  const [clientes, setClientes] = useState([]);
  const [clientesPEP, setClientesPEP] = useState([]);
  const [investigacoes, setInvestigacoes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modalInvestigacao, setModalInvestigacao] = useState(false);
  const [investigacaoDetalhe, setInvestigacaoDetalhe] = useState(null);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [modalAtualizar, setModalAtualizar] = useState(false);
  const [formAtualizar, setFormAtualizar] = useState({
    status: "",
    conclusao: "",
    nivel_risco: "",
  });

  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data.filter((c) => c.ativo));
    } catch {
      console.error("Erro ao carregar clientes");
    }
  };

  const carregarClientesPEP = async () => {
    try {
      const res = await api.get("/aml/clientes-pep");
      setClientesPEP(res.data);
    } catch {
      console.error("Erro ao carregar clientes PEP");
    }
  };

  const carregarInvestigacoes = async () => {
    try {
      const res = await api.get("/aml/investigacoes");
      setInvestigacoes(res.data);
    } catch {
      console.error("Erro ao carregar investigacoes");
    }
  };

  const carregarAuditLog = async () => {
    try {
      const res = await api.get("/aml/audit-log");
      setAuditLogs(res.data);
    } catch {
      console.error("Erro ao carregar audit log");
    }
  };

  useEffect(() => {
    carregarClientes();
    carregarClientesPEP();
    carregarInvestigacoes();
    carregarAuditLog();
  }, []);

  const togglePEP = async (cliente, marcar) => {
    setErro("");
    setSucesso("");
    try {
      await api.patch(`/aml/clientes/${cliente.id}/pep`, {
        pep: marcar,
        nivel_risco: marcar ? "ALTO" : "BAIXO",
        id_usuario: usuario.id,
      });
      setSucesso(
        marcar
          ? `${cliente.nome_completo} marcado como PEP`
          : `${cliente.nome_completo} desmarcado como PEP`
      );
      carregarClientesPEP();
      carregarClientes();
      carregarAuditLog();
    } catch {
      setErro("Erro ao atualizar status PEP");
    }
  };

  const criarInvestigacao = async (form) => {
    setErro("");
    setSucesso("");
    try {
      await api.post("/aml/investigacoes", {
        ...form,
        id_analista: usuario.id,
      });
      setSucesso("Investigacao criada com sucesso");
      setModalInvestigacao(false);
      carregarInvestigacoes();
      carregarAuditLog();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao criar investigacao");
    }
  };

  const abrirDetalhe = async (inv) => {
    try {
      const res = await api.get(`/aml/investigacoes/${inv.id}`);
      setInvestigacaoDetalhe(res.data);
      setModalDetalhe(true);
    } catch {
      setErro("Erro ao carregar detalhe");
    }
  };

  const abrirAtualizar = (inv) => {
    setFormAtualizar({
      status: inv.status,
      conclusao: inv.conclusao || "",
      nivel_risco: inv.nivel_risco,
    });
    setInvestigacaoDetalhe(inv);
    setModalAtualizar(true);
  };

  const salvarAtualizacao = async () => {
    setErro("");
    try {
      await api.patch(`/aml/investigacoes/${investigacaoDetalhe.id}`, {
        ...formAtualizar,
        id_analista: usuario.id,
      });
      setSucesso("Investigacao atualizada");
      setModalAtualizar(false);
      carregarInvestigacoes();
      carregarAuditLog();
    } catch {
      setErro("Erro ao atualizar investigacao");
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

  const badgeRisco = (nivel) => {
    const map = {
      BAIXO: "badge-risco-baixo",
      MEDIO: "badge-risco-medio",
      ALTO: "badge-risco-alto",
      CRITICO: "badge-risco-critico",
    };
    return <span className={map[nivel] || "badge-risco-medio"}>{nivel}</span>;
  };

  const badgeStatus = (status) => {
    const map = {
      ABERTA: "badge-status-aberta",
      "EM_ANALISE": "badge-status-em-analise",
      FECHADA: "badge-status-fechada",
    };
    return <span className={map[status] || "badge-status-aberta"}>{status}</span>;
  };

  return (
    <div className="aml-container">
      <h1>AML / Compliance</h1>

      <div className="aml-tabs">
        <button className={tab === "pep" ? "active" : ""} onClick={() => setTab("pep")}>
          Clientes PEP
        </button>
        <button
          className={tab === "investigacoes" ? "active" : ""}
          onClick={() => setTab("investigacoes")}
        >
          Investigacoes
        </button>
        <button
          className={tab === "audit" ? "active" : ""}
          onClick={() => setTab("audit")}
        >
          Audit Log
        </button>
      </div>

      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      {/* ===== TAB: CLIENTES PEP ===== */}
      {tab === "pep" && (
        <div>
          <h2>Clientes Marcados como PEP ({clientesPEP.length})</h2>
          {clientesPEP.length === 0 ? (
            <p>Nenhum cliente marcado como PEP</p>
          ) : (
            <table className="aml-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF/CNPJ</th>
                  <th>Nivel Risco</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {clientesPEP.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nome_completo}</td>
                    <td>{c.cpf_cnpj}</td>
                    <td>{badgeRisco(c.nivel_risco)}</td>
                    <td>
                      <span className="badge-pep">PEP</span>
                    </td>
                    <td className="aml-acoes">
                      <button
                        className="btn-desmarcar-pep"
                        onClick={() => togglePEP(c, false)}
                      >
                        Desmarcar PEP
                      </button>
                      <button
                        className="btn-investigar"
                        onClick={() => {
                          setModalInvestigacao(true);
                        }}
                      >
                        Investigar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h2 style={{ marginTop: 30 }}>Todos os Clientes</h2>
          <table className="aml-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>PEP</th>
                <th>Risco</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome_completo}</td>
                  <td>{c.cpf_cnpj}</td>
                  <td>
                    {c.pep ? (
                      <span className="badge-pep">PEP</span>
                    ) : (
                      <span className="badge-nao-pep">Normal</span>
                    )}
                  </td>
                  <td>{badgeRisco(c.nivel_risco || "BAIXO")}</td>
                  <td className="aml-acoes">
                    {!c.pep ? (
                      <button
                        className="btn-marcar-pep"
                        onClick={() => togglePEP(c, true)}
                      >
                        Marcar PEP
                      </button>
                    ) : (
                      <button
                        className="btn-desmarcar-pep"
                        onClick={() => togglePEP(c, false)}
                      >
                        Desmarcar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== TAB: INVESTIGACOES ===== */}
      {tab === "investigacoes" && (
        <div>
          <div className="aml-topo">
            <h2>Investigacoes AML ({investigacoes.length})</h2>
            <button
              className="btn-nova-investigacao"
              onClick={() => setModalInvestigacao(true)}
            >
              + Nova Investigacao
            </button>
          </div>

          {investigacoes.length === 0 ? (
            <p>Nenhuma investigacao registrada</p>
          ) : (
            <table className="aml-tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Analista</th>
                  <th>Status</th>
                  <th>Risco</th>
                  <th>Abertura</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {investigacoes.map((inv) => (
                  <tr key={inv.id}>
                    <td>#{inv.id}</td>
                    <td>{inv.nome_cliente}</td>
                    <td>{inv.nome_analista || "-"}</td>
                    <td>{badgeStatus(inv.status)}</td>
                    <td>{badgeRisco(inv.nivel_risco)}</td>
                    <td>{formatarData(inv.data_abertura)}</td>
                    <td className="aml-acoes">
                      <button className="btn-detalhes" onClick={() => abrirDetalhe(inv)}>
                        Detalhes
                      </button>
                      {inv.status !== "FECHADA" && (
                        <button
                          className="btn-investigar"
                          onClick={() => abrirAtualizar(inv)}
                        >
                          Atualizar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== TAB: AUDIT LOG ===== */}
      {tab === "audit" && (
        <div>
          <h2>Audit Log</h2>
          {auditLogs.length === 0 ? (
            <p>Nenhum registro de auditoria</p>
          ) : (
            <table className="aml-tabela">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuario</th>
                  <th>Acao</th>
                  <th>Tabela</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatarData(log.data_hora)}</td>
                    <td>{log.nome_usuario || "-"}</td>
                    <td>
                      <span className="audit-acao">{log.acao}</span>
                    </td>
                    <td>{log.tabela_alvo}</td>
                    <td>#{log.id_registro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== MODAL NOVA INVESTIGACAO ===== */}
      {modalInvestigacao && (
        <InvestigacaoForm
          clientes={clientes}
          onSalvar={criarInvestigacao}
          onCancelar={() => setModalInvestigacao(false)}
        />
      )}

      {/* ===== MODAL DETALHE ===== */}
      {modalDetalhe && investigacaoDetalhe && (
        <div className="modal-overlay">
          <div className="modal-aml">
            <h2>Investigacao #{investigacaoDetalhe.id}</h2>
            <div className="investigacao-detalhe">
              <div className="campo">
                <label>Cliente</label>
                <p>{investigacaoDetalhe.nome_cliente} ({investigacaoDetalhe.cpf_cnpj})</p>
              </div>
              <div className="campo">
                <label>PEP</label>
                <p>{investigacaoDetalhe.pep ? "Sim" : "Nao"}</p>
              </div>
              <div className="campo">
                <label>Analista</label>
                <p>{investigacaoDetalhe.nome_analista || "-"}</p>
              </div>
              <div className="campo">
                <label>Status</label>
                <p>{badgeStatus(investigacaoDetalhe.status)}</p>
              </div>
              <div className="campo">
                <label>Nivel de Risco</label>
                <p>{badgeRisco(investigacaoDetalhe.nivel_risco)}</p>
              </div>
              <div className="campo">
                <label>Motivo</label>
                <p>{investigacaoDetalhe.motivo}</p>
              </div>
              <div className="campo">
                <label>Conclusao</label>
                <p>{investigacaoDetalhe.conclusao || "Pendente"}</p>
              </div>
              <div className="campo">
                <label>Abertura</label>
                <p>{formatarData(investigacaoDetalhe.data_abertura)}</p>
              </div>
              <div className="campo">
                <label>Fechamento</label>
                <p>{formatarData(investigacaoDetalhe.data_fechamento)}</p>
              </div>
            </div>
            <div className="acoes-modal">
              <button className="btn-cancelar" onClick={() => setModalDetalhe(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ATUALIZAR ===== */}
      {modalAtualizar && investigacaoDetalhe && (
        <div className="modal-overlay">
          <div className="modal-aml">
            <h2>Atualizar Investigacao #{investigacaoDetalhe.id}</h2>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formAtualizar.status}
                onChange={(e) =>
                  setFormAtualizar({ ...formAtualizar, status: e.target.value })
                }
              >
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANALISE">Em Analise</option>
                <option value="FECHADA">Fechada</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nivel de Risco</label>
              <select
                value={formAtualizar.nivel_risco}
                onChange={(e) =>
                  setFormAtualizar({ ...formAtualizar, nivel_risco: e.target.value })
                }
              >
                <option value="BAIXO">Baixo</option>
                <option value="MEDIO">Medio</option>
                <option value="ALTO">Alto</option>
                <option value="CRITICO">Critico</option>
              </select>
            </div>

            <div className="form-group">
              <label>Conclusao</label>
              <textarea
                value={formAtualizar.conclusao}
                onChange={(e) =>
                  setFormAtualizar({ ...formAtualizar, conclusao: e.target.value })
                }
                placeholder="Descreva a conclusao da investigacao..."
              />
            </div>

            <div className="acoes-modal">
              <button className="btn-cancelar" onClick={() => setModalAtualizar(false)}>
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={salvarAtualizacao}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AML;
