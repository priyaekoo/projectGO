import { useEffect, useState } from "react";
import api from "../../services/api";
import "./clientes.css";

import { FiEdit, FiUserX, FiDollarSign } from "react-icons/fi";
import ExtratoModal from "./ExtratoModal";
import ClienteForm from "./ClienteForm";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [clienteExtrato, setClienteExtrato] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);

  const carregarClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch {
      setErro("Erro ao carregar clientes");
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const inativarCliente = async (id) => {
    if (!window.confirm("Deseja inativar este cliente?")) return;

    await api.patch(`/clientes/${id}/inativar`);
    carregarClientes();
  };

  const handleSucesso = () => {
    setSucesso("Cliente cadastrado com sucesso");
    carregarClientes();
    setTimeout(() => setSucesso(""), 3000);
  };

  const abrirModal = (cliente = null) => {
    setClienteEditar(cliente);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setClienteEditar(null);
  };

  return (
    <div className="usuarios-container">
      <h1>Clientes</h1>

      <button className="btn-adicionar" onClick={() => abrirModal()}>
        + Novo Cliente
      </button>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

      {clientes.length === 0 ? (
        <p className="mensagem-vazia">
          Nenhum cliente cadastrado. Clique em "Novo Cliente" para iniciar.
        </p>
      ) : (
        <table className="usuarios-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Documento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.nome_completo}</td>
                <td>{cliente.email}</td>
                <td>{cliente.cpf_cnpj}</td>
                <td>
                  <span
                    className={
                      cliente.ativo ? "status-ativo" : "status-inativo"
                    }
                  >
                    {cliente.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="acoes">
                  <button
                    className="btn-icon editar"
                    onClick={() => abrirModal(cliente)}
                  >
                    <FiEdit />
                  </button>

                  <button
                    className="btn-icon saldo"
                    title="Ver saldo e extrato"
                    onClick={() => setClienteExtrato(cliente)}
                  >
                    <FiDollarSign />
                  </button>

                  {cliente.ativo && (
                    <button
                      className="btn-icon excluir"
                      onClick={() => inativarCliente(cliente.id)}
                    >
                      <FiUserX />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {clienteExtrato && (
        <ExtratoModal
          cliente={clienteExtrato}
          onClose={() => setClienteExtrato(null)}
        />
      )}

      <ClienteForm
        aberto={modalAberto}
        onClose={fecharModal}
        onSucesso={handleSucesso}
        clienteEditar={clienteEditar}
      />
    </div>
  );
}

export default Clientes;
