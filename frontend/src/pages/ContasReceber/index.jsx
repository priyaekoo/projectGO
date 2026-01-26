import { useEffect, useState } from "react";
import api from "../../services/api.js";

import "../Usuarios/usuarios.css";
import "./contasReceber.css";

import ContasReceberForm from "./ContasReceberForm.jsx";

import { FiEdit, FiXCircle, FiCheckCircle } from "react-icons/fi";

function ContasReceber() {
  const [contas, setContas] = useState([]);
  const [erro, setErro] = useState("");

  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [contaEditar, setContaEditar] = useState(null);

  const [modalPagar, setModalPagar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);

  const carregarContas = async () => {
    try {
      const res = await api.get("/contas-receber");
      setContas(res.data);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar contas a receber");
    }
  };

  useEffect(() => {
    carregarContas();
  }, []);

  const pagarConta = async () => {
    try {
      await api.patch(`/contas-receber/${contaSelecionada.id}/pagar`);
      setModalPagar(false);
      carregarContas();
    } catch {
      setErro("Erro ao pagar conta");
    }
  };

  const cancelarConta = async () => {
    try {
      await api.patch(`/contas-receber/${contaSelecionada.id}/cancelar`);
      setModalCancelar(false);
      carregarContas();
    } catch {
      setErro("Erro ao cancelar conta");
    }
  };

  return (
    <div className="usuarios-container">
      <h1>Contas a Receber</h1>

      <div className="topo-acoes">
        <button
          className="btn-adicionar"
          onClick={() => {
            setContaEditar(null);
            setModalFormAberto(true);
          }}
        >
          + Nova Conta
        </button>
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}

      <table className="usuarios-tabela">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {contas.map((c) => (
            <tr key={c.id}>
              <td>{c.nome_completo}</td>
              <td>{c.descricao}</td>
              <td>R$ {Number(c.valor).toFixed(2)}</td>
              <td>{c.data_vencimento}</td>
              <td>
                <span className={`status-${c.status.toLowerCase()}`}>
                  {c.status}
                </span>
              </td>
              <td className="acoes">
                {c.status === "PENDENTE" && (
                  <>
                    <button
                      className="btn-icon editar"
                      onClick={() => {
                        setContaEditar(c);
                        setModalFormAberto(true);
                      }}
                    >
                      <FiEdit />
                    </button>

                    <button
                      className="btn-icon"
                      onClick={() => {
                        setContaSelecionada(c);
                        setModalPagar(true);
                      }}
                    >
                      <FiCheckCircle />
                    </button>

                    <button
                      className="btn-icon excluir"
                      onClick={() => {
                        setContaSelecionada(c);
                        setModalCancelar(true);
                      }}
                    >
                      <FiXCircle />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ContasReceberForm
        aberto={modalFormAberto}
        onClose={() => setModalFormAberto(false)}
        onSucesso={carregarContas}
        contaEditar={contaEditar}
      />

      {/* MODAL PAGAR */}
      {modalPagar && (
        <div className="modal-overlay">
          <div className="modal modal-confirmacao">
            <h2>Confirmar Pagamento</h2>
            <p>Deseja marcar esta conta como paga?</p>
            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalPagar(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={pagarConta}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR */}
      {modalCancelar && (
        <div className="modal-overlay">
          <div className="modal modal-confirmacao">
            <h2>Cancelar Conta</h2>
            <p>Deseja cancelar esta conta?</p>
            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalCancelar(false)}
              >
                Voltar
              </button>
              <button className="btn-confirmar" onClick={cancelarConta}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContasReceber;
