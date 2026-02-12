import { useState } from "react";
import { formatarPercentual } from "../../services/formatters";

function AplicacaoForm({ fundo, clientes, onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    id_cliente: "",
    valor: "",
  });

  const handleSubmit = () => {
    if (!form.id_cliente || !form.valor) return;
    onSalvar({
      id_cliente: form.id_cliente,
      id_fundo: fundo.id,
      valor: form.valor,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-inv">
        <h2>Aplicar em {fundo.nome}</h2>

        <div className="form-group">
          <label>Tipo: {fundo.tipo}</label>
        </div>

        <div className="form-group">
          <label>Rentabilidade Anual: {formatarPercentual(fundo.rentabilidade_anual)}</label>
        </div>

        <div className="form-group">
          <label>Taxa Admin: {formatarPercentual(fundo.taxa_administracao)} | Performance: {formatarPercentual(fundo.taxa_performance)}</label>
        </div>

        <div className="form-group">
          <label>Cliente</label>
          <select
            value={form.id_cliente}
            onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
          >
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Valor da Aplicacao (R$)</label>
          <input
            type="number"
            step="0.01"
            min="100"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            placeholder="Minimo R$ 100,00"
          />
        </div>

        <div className="acoes-modal">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-confirmar" onClick={handleSubmit}>
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AplicacaoForm;
