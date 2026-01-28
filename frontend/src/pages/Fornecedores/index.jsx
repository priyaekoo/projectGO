import { useEffect, useState } from "react";
import api from "../../services/api";
import "./fornecedores.css";

import { FiEdit, FiUserX, FiUserCheck, FiDollarSign } from "react-icons/fi";
import ExtratoModal from "./ExtratoModal";

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  const [fornecedorExtrato, setFornecedorExtrato] = useState(null);

  // Campos do formulário
  const [nomeRazaoSocial, setNomeRazaoSocial] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [tipo, setTipo] = useState("PF");
  const [observacao, setObservacao] = useState("");

  const carregarFornecedores = async () => {
    try {
      const res = await api.get("/fornecedores");
      setFornecedores(res.data);
    } catch {
      setErro("Erro ao carregar fornecedores");
    }
  };

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const abrirModalNovo = () => {
    setFornecedorEditando(null);
    setNomeRazaoSocial("");
    setCpfCnpj("");
    setTipo("PF");
    setObservacao("");
    setMostrarModal(true);
  };

  const abrirModalEditar = (fornecedor) => {
    setFornecedorEditando(fornecedor);
    setNomeRazaoSocial(fornecedor.nome_razao_social);
    setCpfCnpj(fornecedor.cpf_cnpj);
    setTipo(fornecedor.tipo || "PF");
    setObservacao(fornecedor.observacao || "");
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setErro("");
  };

  const salvarFornecedor = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      if (fornecedorEditando) {
        // Atualizar
        await api.patch(`/fornecedores/${fornecedorEditando.id}`, {
          nome_razao_social: nomeRazaoSocial,
          tipo,
          observacao,
        });
      } else {
        // Criar
        await api.post("/fornecedores", {
          nome_razao_social: nomeRazaoSocial,
          cpf_cnpj: cpfCnpj,
          tipo,
          observacao,
        });
      }
      fecharModal();
      carregarFornecedores();
    } catch (error) {
      setErro(error.response?.data?.erro || "Erro ao salvar fornecedor");
    }
  };

  const inativarFornecedor = async (id) => {
    if (!window.confirm("Deseja inativar este fornecedor?")) return;

    try {
      await api.patch(`/fornecedores/${id}/inativar`);
      carregarFornecedores();
    } catch {
      setErro("Erro ao inativar fornecedor");
    }
  };

  const reativarFornecedor = async (id) => {
    try {
      await api.patch(`/fornecedores/${id}/reativar`);
      carregarFornecedores();
    } catch {
      setErro("Erro ao reativar fornecedor");
    }
  };

  return (
    <div className="fornecedores-container">
      <h1>Fornecedores</h1>

      <button className="btn-adicionar" onClick={abrirModalNovo}>
        + Novo Fornecedor
      </button>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {fornecedores.length === 0 ? (
        <p className="mensagem-vazia">
          Nenhum fornecedor cadastrado. Clique em "Novo Fornecedor" para iniciar.
        </p>
      ) : (
        <table className="fornecedores-tabela">
          <thead>
            <tr>
              <th>Nome / Razao Social</th>
              <th>CPF/CNPJ</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map((fornecedor) => (
              <tr key={fornecedor.id}>
                <td>{fornecedor.nome_razao_social}</td>
                <td>{fornecedor.cpf_cnpj}</td>
                <td>{fornecedor.tipo === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"}</td>
                <td>
                  <span
                    className={
                      fornecedor.ativo ? "status-ativo" : "status-inativo"
                    }
                  >
                    {fornecedor.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="acoes">
                  <button
                    className="btn-icon editar"
                    title="Editar"
                    onClick={() => abrirModalEditar(fornecedor)}
                  >
                    <FiEdit />
                  </button>

                  <button
                    className="btn-icon saldo"
                    title="Ver extrato"
                    onClick={() => setFornecedorExtrato(fornecedor)}
                  >
                    <FiDollarSign />
                  </button>

                  {fornecedor.ativo ? (
                    <button
                      className="btn-icon excluir"
                      title="Inativar"
                      onClick={() => inativarFornecedor(fornecedor.id)}
                    >
                      <FiUserX />
                    </button>
                  ) : (
                    <button
                      className="btn-icon reativar"
                      title="Reativar"
                      onClick={() => reativarFornecedor(fornecedor.id)}
                    >
                      <FiUserCheck />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{fornecedorEditando ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>

            <form onSubmit={salvarFornecedor}>
              <div className="form-group">
                <label>Nome / Razao Social</label>
                <input
                  type="text"
                  value={nomeRazaoSocial}
                  onChange={(e) => setNomeRazaoSocial(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>CPF/CNPJ</label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  disabled={fornecedorEditando}
                  required={!fornecedorEditando}
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="PF">Pessoa Fisica</option>
                  <option value="PJ">Pessoa Juridica</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observacao</label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={3}
                />
              </div>

              {erro && <p className="mensagem-erro">{erro}</p>}

              <div className="modal-acoes">
                <button type="button" className="btn-cancelar" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar">
                  {fornecedorEditando ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXTRATO */}
      {fornecedorExtrato && (
        <ExtratoModal
          fornecedor={fornecedorExtrato}
          onClose={() => setFornecedorExtrato(null)}
        />
      )}
    </div>
  );
}

export default Fornecedores;
