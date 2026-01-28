import { useEffect, useState } from "react";
import api from "../../services/api";

import "../Usuarios/usuarios.css";
import "../ContasReceber/contasReceber.css";

import ContasPagarForm from "./ContasPagarForm";

import { FiEdit, FiXCircle, FiCheckCircle } from "react-icons/fi";

function ContasPagar() {
  const [contas, setContas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");

  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [contaEditar, setContaEditar] = useState(null);

  const [modalPagar, setModalPagar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [clientePagador, setClientePagador] = useState("");
  const [erroPagar, setErroPagar] = useState("");

  const carregarContas = async () => {
    try {
      const res = await api.get("/contas-pagar");
      setContas(res.data);
      setErro("");
    } catch (error) {
      setErro("Erro ao carregar contas a pagar");
    }
  };

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (error) {
      console.error("Erro ao carregar clientes");
    }
  };

  useEffect(() => {
    carregarContas();
    carregarClientes();
  }, []);

  const abrirModalPagar = (conta) => {
    setContaSelecionada(conta);
    setClientePagador(conta.id_cliente || "");
    setErroPagar("");
    setModalPagar(true);
  };

  const pagarConta = async () => {
    if (!clientePagador) {
      setErroPagar("Selecione o cliente que vai pagar");
      return;
    }

    try {
      await api.patch(`/contas-pagar/${contaSelecionada.id}/pagar`, {
        id_cliente: clientePagador,
      });
      setModalPagar(false);
      carregarContas();
    } catch (error) {
      const msg = error?.response?.data?.erro || "Erro ao pagar conta";
      const saldo = error?.response?.data?.saldo_atual;
      if (saldo !== undefined) {
        setErroPagar(`${msg}. Saldo disponivel: R$ ${Number(saldo).toFixed(2)}`);
      } else {
        setErroPagar(msg);
      }
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
            <th>Cliente</th>
            <th>Descricao</th>
            <th>Valor</th>
            <th>Vencimento</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>

        <tbody>
          {contas.map((c) => (
            <tr key={c.id}>
              <td>{c.nome_fornecedor || `Fornecedor #${c.id_fornecedor}`}</td>
              <td>{c.nome_cliente || "-"}</td>
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
                      title="Editar"
                      onClick={() => {
                        setContaEditar(c);
                        setModalFormAberto(true);
                      }}
                    >
                      <FiEdit />
                    </button>

                    <button
                      className="btn-icon"
                      title="Pagar"
                      onClick={() => abrirModalPagar(c)}
                    >
                      <FiCheckCircle />
                    </button>

                    <button
                      className="btn-icon excluir"
                      title="Cancelar"
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
      {modalPagar && contaSelecionada && (
        <div className="modal-overlay">
          <div className="modal modal-confirmacao">
            <h2>Confirmar Pagamento</h2>

            <p>
              <strong>Fornecedor:</strong> {contaSelecionada.nome_fornecedor}
            </p>
            <p>
              <strong>Valor:</strong> R$ {Number(contaSelecionada.valor).toFixed(2)}
            </p>

            <label style={{ marginTop: "16px", display: "block" }}>
              Cliente que vai pagar:
            </label>
            <select
              value={clientePagador}
              onChange={(e) => {
                setClientePagador(e.target.value);
                setErroPagar("");
              }}
              style={{ width: "100%", padding: "8px", marginTop: "8px" }}
            >
              <option value="">Selecione o cliente</option>
              {clientes
                .filter((c) => c.ativo)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome_completo}
                  </option>
                ))}
            </select>

            {erroPagar && (
              <p className="mensagem-erro" style={{ marginTop: "12px" }}>
                {erroPagar}
              </p>
            )}

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalPagar(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={pagarConta}>
                Confirmar Pagamento
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
