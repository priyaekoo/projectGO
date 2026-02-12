import { formatarMoeda, formatarPercentual } from "../../services/formatters";

function RentabilidadeModal({ dados, onFechar }) {
  if (!dados) return null;

  const app = dados.aplicacao;

  return (
    <div className="modal-overlay">
      <div className="modal-inv">
        <h2>Rentabilidade Detalhada</h2>

        <div className="rentabilidade-detalhe">
          <div className="campo">
            <span className="label">Fundo</span>
            <span className="valor">{app.nome_fundo}</span>
          </div>
          <div className="campo">
            <span className="label">Valor Aplicado</span>
            <span className="valor">{formatarMoeda(app.valor_aplicado)}</span>
          </div>
          <div className="campo">
            <span className="label">Dias Investido</span>
            <span className="valor">{dados.dias_investido}</span>
          </div>
          <div className="campo">
            <span className="label">Rendimento Bruto</span>
            <span className="valor">{formatarMoeda(dados.rendimento_bruto)}</span>
          </div>
          <div className="campo">
            <span className="label">Taxa Administracao</span>
            <span className="valor" style={{ color: "#e74c3c" }}>
              - {formatarMoeda(dados.taxa_administracao)}
            </span>
          </div>
          <div className="campo">
            <span className="label">Taxa Performance</span>
            <span className="valor" style={{ color: "#e74c3c" }}>
              - {formatarMoeda(dados.taxa_performance)}
            </span>
          </div>
          <div className="campo" style={{ borderTop: "2px solid #333", paddingTop: 10 }}>
            <span className="label">Rendimento Liquido</span>
            <span
              className="valor"
              style={{ color: dados.rendimento_liquido >= 0 ? "#27ae60" : "#e74c3c" }}
            >
              {formatarMoeda(dados.rendimento_liquido)}
            </span>
          </div>
          <div className="campo">
            <span className="label">Valor Atual</span>
            <span className="valor">{formatarMoeda(dados.valor_atual)}</span>
          </div>
          <div className="campo">
            <span className="label">Rentabilidade (%)</span>
            <span
              className="valor"
              style={{ color: dados.rentabilidade_percentual >= 0 ? "#27ae60" : "#e74c3c" }}
            >
              {formatarPercentual(dados.rentabilidade_percentual)}
            </span>
          </div>
        </div>

        <div className="acoes-modal">
          <button className="btn-cancelar" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default RentabilidadeModal;
