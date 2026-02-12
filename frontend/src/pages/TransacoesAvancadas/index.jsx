import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatarMoeda } from "../../services/formatters";
import "./transacoesAvancadas.css";

function TransacoesAvancadas() {
  const [tab, setTab] = useState("alto-valor");
  const [clientes, setClientes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [taxaInfo, setTaxaInfo] = useState(null);
  const [resultadoLote, setResultadoLote] = useState(null);

  // Form alto valor
  const [formAlto, setFormAlto] = useState({
    id_cliente_origem: "",
    id_cliente_destino: "",
    valor: "",
    descricao: "",
  });

  // Form lote
  const [lote, setLote] = useState([
    { id_cliente_origem: "", id_cliente_destino: "", valor: "", descricao: "" },
  ]);

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
      const res = await api.get("/transacoes-avancadas");
      setHistorico(res.data);
    } catch {
      console.error("Erro ao carregar historico");
    }
  };

  useEffect(() => {
    carregarClientes();
    carregarHistorico();
  }, []);

  // Consultar taxa ao mudar valor
  const consultarTaxa = async (valor) => {
    if (!valor || Number(valor) <= 0) {
      setTaxaInfo(null);
      return;
    }
    try {
      const res = await api.get(`/transacoes-avancadas/taxa?valor=${valor}`);
      setTaxaInfo(res.data);
    } catch {
      setTaxaInfo(null);
    }
  };

  const handleAltoValorChange = (e) => {
    const { name, value } = e.target;
    setFormAlto({ ...formAlto, [name]: value });
    if (name === "valor") {
      consultarTaxa(value);
    }
  };

  const enviarAltoValor = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    try {
      const res = await api.post("/transacoes-avancadas/alto-valor", formAlto);
      setSucesso(
        `Transferencia realizada! Valor: ${formatarMoeda(res.data.valor)} | Taxa: ${formatarMoeda(res.data.valor_taxa)} | Total debitado: ${formatarMoeda(res.data.valor_total_debitado)}`
      );
      setFormAlto({ id_cliente_origem: "", id_cliente_destino: "", valor: "", descricao: "" });
      setTaxaInfo(null);
      carregarHistorico();
    } catch (error) {
      const msg = error?.response?.data?.erro || "Erro ao realizar transferencia";
      const saldo = error?.response?.data?.saldo_atual;
      if (saldo !== undefined) {
        setErro(`${msg}. Saldo: ${formatarMoeda(saldo)}`);
      } else {
        setErro(msg);
      }
    }
  };

  // Lote
  const addLoteItem = () => {
    setLote([...lote, { id_cliente_origem: "", id_cliente_destino: "", valor: "", descricao: "" }]);
  };

  const removeLoteItem = (index) => {
    setLote(lote.filter((_, i) => i !== index));
  };

  const handleLoteChange = (index, field, value) => {
    const novoLote = [...lote];
    novoLote[index][field] = value;
    setLote(novoLote);
  };

  const enviarLote = async () => {
    setErro("");
    setSucesso("");
    setResultadoLote(null);

    try {
      const res = await api.post("/transacoes-avancadas/lote", { transferencias: lote });
      setResultadoLote(res.data);
      setSucesso(res.data.mensagem);
      carregarHistorico();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao processar lote");
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
    <div className="transacoes-avancadas-container">
      <h1>Transacoes Avancadas</h1>

      <div className="ta-tabs">
        <button
          className={tab === "alto-valor" ? "active" : ""}
          onClick={() => setTab("alto-valor")}
        >
          Alto Valor
        </button>
        <button
          className={tab === "lote" ? "active" : ""}
          onClick={() => setTab("lote")}
        >
          Lote
        </button>
      </div>

      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      {/* ===== TAB ALTO VALOR ===== */}
      {tab === "alto-valor" && (
        <div className="ta-content">
          <div className="ta-form-box">
            <h2>Transferencia Alto Valor</h2>

            <form onSubmit={enviarAltoValor}>
              <div className="form-group">
                <label>Cliente Origem</label>
                <select
                  name="id_cliente_origem"
                  value={formAlto.id_cliente_origem}
                  onChange={handleAltoValorChange}
                  required
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cliente Destino</label>
                <select
                  name="id_cliente_destino"
                  value={formAlto.id_cliente_destino}
                  onChange={handleAltoValorChange}
                  required
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  min="0.01"
                  value={formAlto.valor}
                  onChange={handleAltoValorChange}
                  placeholder="0.00"
                  required
                />
              </div>

              {taxaInfo && taxaInfo.taxa_percentual > 0 && (
                <div className="taxa-info">
                  <strong>Taxa aplicavel:</strong> {taxaInfo.taxa_percentual}% = {formatarMoeda(taxaInfo.valor_taxa)}
                  <br />
                  <strong>Total a debitar:</strong> {formatarMoeda(taxaInfo.valor_total)}
                </div>
              )}

              <div className="form-group">
                <label>Descricao (opcional)</label>
                <input
                  type="text"
                  name="descricao"
                  value={formAlto.descricao}
                  onChange={handleAltoValorChange}
                  placeholder="Ex: Pagamento de contrato"
                />
              </div>

              <button type="submit" className="btn-transferir-av">
                Realizar Transferencia
              </button>
            </form>
          </div>

          <div className="ta-historico">
            <h2>Historico</h2>
            {historico.length === 0 ? (
              <p>Nenhuma transacao avancada realizada</p>
            ) : (
              <table className="ta-tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                    <th>Origem</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((t) => (
                    <tr key={t.id} style={{ opacity: t.estornado ? 0.5 : 1 }}>
                      <td>{formatarData(t.data_movimentacao)}</td>
                      <td>{t.nome_cliente}</td>
                      <td>
                        <span className={t.tipo === "ENTRADA" ? "tipo-entrada" : "tipo-saida"}>
                          {t.tipo}
                        </span>
                      </td>
                      <td>{formatarMoeda(t.valor)}</td>
                      <td>{t.origem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB LOTE ===== */}
      {tab === "lote" && (
        <div>
          <h2>Transferencias em Lote</h2>
          <button className="btn-adicionar-lote" onClick={addLoteItem}>
            + Adicionar Transferencia
          </button>

          {lote.map((item, i) => (
            <div key={i} className="lote-item">
              <div className="lote-header">
                <span>Transferencia #{i + 1}</span>
                {lote.length > 1 && (
                  <button className="btn-remover-lote" onClick={() => removeLoteItem(i)}>
                    Remover
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Origem</label>
                <select
                  value={item.id_cliente_origem}
                  onChange={(e) => handleLoteChange(i, "id_cliente_origem", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Destino</label>
                <select
                  value={item.id_cliente_destino}
                  onChange={(e) => handleLoteChange(i, "id_cliente_destino", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome_completo}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={item.valor}
                  onChange={(e) => handleLoteChange(i, "valor", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label>Descricao</label>
                <input
                  type="text"
                  value={item.descricao}
                  onChange={(e) => handleLoteChange(i, "descricao", e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          ))}

          <button className="btn-transferir-av" onClick={enviarLote}>
            Processar Lote ({lote.length} transferencias)
          </button>

          {resultadoLote && (
            <div className="resultado-lote">
              <h3>Resultado do Lote</h3>
              <p>
                Total: {resultadoLote.total} | Sucesso: {resultadoLote.sucesso} | Erros:{" "}
                {resultadoLote.erros}
              </p>
              {resultadoLote.resultados.map((r, i) => (
                <div key={i} className={`resultado-item ${r.status === "OK" ? "ok" : "erro"}`}>
                  #{r.indice + 1}: {r.status}
                  {r.erro && ` - ${r.erro}`}
                  {r.valor && ` - ${formatarMoeda(r.valor)}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TransacoesAvancadas;
