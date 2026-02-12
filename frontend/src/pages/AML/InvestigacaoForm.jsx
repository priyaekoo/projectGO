import { useState } from "react";

function InvestigacaoForm({ clientes, onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    id_cliente: "",
    motivo: "",
    nivel_risco: "MEDIO",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = () => {
    if (!form.id_cliente || !form.motivo) return;
    onSalvar(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-aml">
        <h2>Nova Investigacao AML</h2>

        <div className="form-group">
          <label>Cliente</label>
          <select name="id_cliente" value={form.id_cliente} onChange={handleChange}>
            <option value="">Selecione o cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo} - {c.cpf_cnpj}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Motivo da Investigacao</label>
          <textarea
            name="motivo"
            value={form.motivo}
            onChange={handleChange}
            placeholder="Descreva o motivo da investigacao..."
          />
        </div>

        <div className="form-group">
          <label>Nivel de Risco</label>
          <select name="nivel_risco" value={form.nivel_risco} onChange={handleChange}>
            <option value="BAIXO">Baixo</option>
            <option value="MEDIO">Medio</option>
            <option value="ALTO">Alto</option>
            <option value="CRITICO">Critico</option>
          </select>
        </div>

        <div className="acoes-modal">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-confirmar" onClick={handleSubmit}>
            Abrir Investigacao
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvestigacaoForm;
