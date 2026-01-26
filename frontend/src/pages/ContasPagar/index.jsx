import { useEffect, useState } from "react";
import api from "../../services/api";

import "../Usuarios/usuarios.css";
import "../ContasReceber/contasReceber.css";

import ContasPagarForm from "./ContasPagarForm";

import { FiEdit, FiXCircle, FiCheckCircle } from "react-icons/fi";

function ContasPagar() {
  const [contas, setContas] = useState([]);
  const [erro, setErro] = useState("");

  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [contaEditar, setContaEditar] = useState(null);

  const [modalPagar, setModalPagar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);

  /* ======================
     LOAD CONTAS
  ====================== */
  const carregarContas = async () => {
    try {
      const res = await api.get("/contas-pagar");
      setContas(res.data);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar contas a pagar");
    }
  };

  useEffect(() => {
    carregarContas();
  }, []);

  /* ======================
     AÇÕES
  ====================== */
  const pagarConta = async () => {
    try {
      await api.patch(`/contas-pagar/${contaSelecionada.id}/pagar`);
      setModalPagar(false);
      carregarContas();
    } catch {
      setErro("Erro ao pagar conta");
    }
  };

  const cancelarConta = async () => {
    try {
      await api.patch(`/contas-pagar/${contaSelecionada.id}/cancelar`);
      setModalCancelar(false);
      carregarContas();
    } catch {
      setErro("Erro ao cancelar conta");
    }
  };

  return (
    <div className="usuarios-container">
      <h1>Contas a Pagar</h1>

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
            <th>Fornecedor</th>
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
              <td>{c.nome_fornecedor || `Fornecedor #${c.id_fornecedor}`}</td>
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

      {/* FORM */}
      <ContasPagarForm
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

export default ContasPagar;
