import { useEffect, useState } from "react";
import api from "../../services/api";
import { formatarMoeda } from "../../services/formatters";
import "./clientes.css";
import { FiRotateCcw } from "react-icons/fi";

function ExtratoModal({ cliente, onClose }) {
  const [saldo, setSaldo] = useState(null);
  const [extrato, setExtrato] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [saldoResponse, extratoResponse] = await Promise.all([
        api.get(`/clientes/${cliente.id}/saldo`),
        api.get(`/clientes/${cliente.id}/extrato`),
      ]);

      setSaldo(saldoResponse.data);
      setExtrato(extratoResponse.data);
      setErro("");
    } catch {
      setErro("Erro ao carregar dados");
    }
  }

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
    <div className="modal-overlay">
      <div className="modal-extrato">
        {/* HEADER */}
        <div className="modal-extrato-header">
          <h2>{cliente.nome_completo}</h2>
          <button className="btn-fechar-x" onClick={onClose}>
            &times;
          </button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}

        {/* SALDO */}
        <div className="saldo-box">
          <span>Saldo Atual</span>
          <strong>{formatarMoeda(saldo?.saldo_atual || 0)}</strong>
        </div>

        {/* TABELA */}
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
                  <th>Origem</th>
                  <th>Descricao</th>
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
                    <td>{mov.origem}</td>
                    <td>
                      {mov.descricao}
                      {mov.estornado && " (ESTORNADO)"}
                    </td>
                    <td className={mov.tipo === "ENTRADA" ? "entrada" : "saida"}>
                      {mov.tipo === "ENTRADA" ? "+" : "-"}{" "}
                      {formatarMoeda(mov.valor)}
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

        {/* FOOTER */}
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
