import { useEffect, useState } from "react";
import api from "../../services/api";
import { FiRotateCcw } from "react-icons/fi";

function ExtratoModal({ fornecedor, onClose }) {
  const [saldo, setSaldo] = useState(null);
  const [extrato, setExtrato] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (fornecedor) {
      carregarDados();
    }
  }, [fornecedor]);

  const carregarDados = async () => {
    try {
      const [resSaldo, resExtrato] = await Promise.all([
        api.get(`/fornecedores/${fornecedor.id}/saldo`),
        api.get(`/fornecedores/${fornecedor.id}/extrato`),
      ]);
      setSaldo(resSaldo.data);
      setExtrato(resExtrato.data);
      setErro("");
    } catch {
      setErro("Erro ao carregar extrato");
    }
  };

  const estornarMovimentacao = async (idMovimentacao) => {
    if (!window.confirm("Deseja estornar esta movimentacao?")) return;

    try {
      await api.post(`/estornos/${idMovimentacao}`);
      carregarDados();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao estornar");
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-extrato" onClick={(e) => e.stopPropagation()}>
        <div className="modal-extrato-header">
          <h2>Extrato - {fornecedor.nome_razao_social}</h2>
          <button className="btn-fechar-x" onClick={onClose}>
            &times;
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}

        {saldo && (
          <div className="saldo-box">
            <span>Saldo Atual</span>
            <strong>R$ {Number(saldo.saldo_atual).toFixed(2)}</strong>
          </div>
        )}

        <div className="extrato-wrapper">
          {extrato.length === 0 ? (
            <p style={{ color: "#888", textAlign: "center" }}>
              Nenhuma movimentacao encontrada
            </p>
          ) : (
            <table className="extrato-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descricao</th>
                  <th>Origem</th>
                  <th>Valor</th>
                  <th>Acao</th>
                </tr>
              </thead>
              <tbody>
                {extrato.map((mov) => (
                  <tr
                    key={mov.id}
                    style={{ opacity: mov.estornado ? 0.5 : 1 }}
                  >
                    <td>{formatarData(mov.data_movimentacao)}</td>
                    <td>
                      {mov.descricao}
                      {mov.estornado && " (ESTORNADO)"}
                    </td>
                    <td>{mov.origem}</td>
                    <td className={mov.tipo === "ENTRADA" ? "entrada" : "saida"}>
                      {mov.tipo === "ENTRADA" ? "+" : "-"} R${" "}
                      {Number(mov.valor).toFixed(2)}
                    </td>
                    <td>
                      {!mov.estornado && mov.origem !== "ESTORNO" && (
                        <button
                          className="btn-icon-estorno"
                          title="Estornar"
                          onClick={() => estornarMovimentacao(mov.id)}
                        >
                          <FiRotateCcw size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-acoes">
          <button className="btn-fechar" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExtratoModal;
