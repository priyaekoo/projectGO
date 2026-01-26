import { useEffect, useState } from "react";
import api from "../../services/api";
import "./clientes.css";

function ExtratoModal({ cliente, onClose }) {
  const [saldo, setSaldo] = useState(null);
  const [extrato, setExtrato] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const saldoResponse = await api.get(`/clientes/${cliente.id}/saldo`);
    const extratoResponse = await api.get(`/clientes/${cliente.id}/extrato`);

    setSaldo(saldoResponse.data);
    setExtrato(extratoResponse.data);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-extrato">
        {/* HEADER */}
        <div className="modal-extrato-header">
          <h2>{cliente.nome_completo}</h2>
          <button className="btn-fechar-x" onClick={onClose}>
            ×
          </button>
        </div>

        {/* SALDO */}
        <div className="saldo-box">
          <span>Saldo Atual</span>
          <strong>R$ {Number(saldo?.saldo_atual || 0).toFixed(2)}</strong>
        </div>

        {/* TABELA */}
        <div className="extrato-wrapper">
          <table className="extrato-tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {extrato.map((mov, index) => (
                <tr key={index}>
                  <td>
                    {new Date(mov.data_movimentacao).toLocaleDateString()}
                  </td>
                  <td>{mov.tipo}</td>
                  <td>{mov.origem}</td>
                  <td className={mov.tipo === "ENTRADA" ? "entrada" : "saida"}>
                    R$ {Number(mov.valor).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
