import { useState, useEffect } from "react";
import { formatarMoeda } from "../../services/formatters";

function OrdemForm({ ativos, clientes, mercadoAberto, onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    id_cliente: "",
    id_ativo: "",
    tipo: "COMPRA",
    quantidade: "",
    preco_unitario: "",
  });

  const [ativoSelecionado, setAtivoSelecionado] = useState(null);

  useEffect(() => {
    if (form.id_ativo) {
      const ativo = ativos.find((a) => a.id === Number(form.id_ativo));
      setAtivoSelecionado(ativo);
      if (ativo) {
        setForm((prev) => ({ ...prev, preco_unitario: ativo.preco_atual }));
      }
    } else {
      setAtivoSelecionado(null);
    }
  }, [form.id_ativo]);

  const valorTotal = Number(form.quantidade) * Number(form.preco_unitario);

  const handleSubmit = () => {
    if (!form.id_cliente || !form.id_ativo || !form.quantidade || !form.preco_unitario) return;
    onSalvar(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-inv" style={{ width: 450 }}>
        <h2>Nova Ordem</h2>

        {!mercadoAberto && (
          <div style={{ background: "#f8d7da", padding: 10, borderRadius: 6, marginBottom: 15, fontSize: 13, color: "#721c24" }}>
            Atencao: O mercado esta fechado. A ordem sera rejeitada.
          </div>
        )}

        <div className="tipo-selector">
          <button
            className={form.tipo === "COMPRA" ? "selected-compra" : ""}
            onClick={() => setForm({ ...form, tipo: "COMPRA" })}
          >
            COMPRA
          </button>
          <button
            className={form.tipo === "VENDA" ? "selected-venda" : ""}
            onClick={() => setForm({ ...form, tipo: "VENDA" })}
          >
            VENDA
          </button>
        </div>

        <div className="form-group">
          <label>Cliente</label>
          <select
            value={form.id_cliente}
            onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
          >
            <option value="">Selecione</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome_completo}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Ativo</label>
          <select
            value={form.id_ativo}
            onChange={(e) => setForm({ ...form, id_ativo: e.target.value })}
          >
            <option value="">Selecione o ativo</option>
            {ativos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.codigo} - {a.nome} ({formatarMoeda(a.preco_atual)})
              </option>
            ))}
          </select>
        </div>

        {ativoSelecionado && (
          <div className="ativo-info">
            <strong>{ativoSelecionado.codigo}</strong> - {ativoSelecionado.nome}
            <br />
            <span className="preco">{formatarMoeda(ativoSelecionado.preco_atual)}</span>
            <br />
            <small>Tipo: {ativoSelecionado.tipo}</small>
          </div>
        )}

        <div className="form-group">
          <label>Quantidade {ativoSelecionado?.tipo === "ACAO" ? "(multiplo de 100)" : ""}</label>
          <input
            type="number"
            min="1"
            step={ativoSelecionado?.tipo === "ACAO" ? "100" : "1"}
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>Preco Unitario (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={form.preco_unitario}
            onChange={(e) => setForm({ ...form, preco_unitario: e.target.value })}
          />
        </div>

        {form.quantidade && form.preco_unitario && (
          <div className="ordem-resumo">
            <strong>Resumo:</strong> {form.tipo} de {form.quantidade}x a {formatarMoeda(form.preco_unitario)} = <strong>{formatarMoeda(valorTotal)}</strong>
          </div>
        )}

        <div className="acoes-modal">
          <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
          <button
            className={`btn-criar-ordem ${form.tipo === "COMPRA" ? "compra" : "venda"}`}
            onClick={handleSubmit}
          >
            Enviar Ordem
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrdemForm;
