import { useEffect, useState } from "react";
import api from "../../services/api";
import "../Usuarios/usuarios.css";
import { FiEdit, FiTrash2, FiRotateCcw } from "react-icons/fi";

const ITENS_POR_PAGINA = 10;

function Clientes() {
  /* ======================
     STATES GERAIS
  ====================== */
  const [clientes, setClientes] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  /* ======================
     MODAIS
  ====================== */
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalInativarAberto, setModalInativarAberto] = useState(false);
  const [modalReativarAberto, setModalReativarAberto] = useState(false);

  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  /* ======================
     FORMULÁRIOS
  ====================== */
  const formCriarInicial = {
    nome_completo: "",
    email: "",
    cpf_cnpj: "",
    observacao: "",
  };

  const [formCriar, setFormCriar] = useState(formCriarInicial);

  const [formEditar, setFormEditar] = useState({
    id: "",
    nome_completo: "",
    email: "",
    cpf_cnpj: "",
    observacao: "",
    ativo: true,
    criado_em: "",
  });

  const [errosCriar, setErrosCriar] = useState({});
  const [errosEditar, setErrosEditar] = useState({});

  /* ======================
     API
  ====================== */
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

  /* ======================
     UTIL
  ====================== */
  const unformatDoc = (value = "") => value.replace(/\D/g, "");

  const formatDoc = (value = "") => {
    const d = value.replace(/\D/g, "");
    if (d.length === 11)
      return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    if (d.length === 14)
      return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    return d;
  };

  /* ======================
     CRIAR
  ====================== */
  const validarCriar = () => {
    const erros = {};

    if (!formCriar.nome_completo) erros.nome_completo = "Nome obrigatório";
    if (!formCriar.email) erros.email = "Email obrigatório";
    if (!formCriar.cpf_cnpj) erros.cpf_cnpj = "CPF/CNPJ obrigatório";

    setErrosCriar(erros);
    return Object.keys(erros).length === 0;
  };

  const salvarCriacao = async () => {
    if (!validarCriar()) return;

    try {
      await api.post("/clientes", formCriar);
      setMensagem("Cliente criado com sucesso!");
      setErro("");
      setModalCriarAberto(false);
      setFormCriar(formCriarInicial);
      setErrosCriar({});
      carregarClientes();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao criar cliente");
    }
  };

  /* ======================
     EDITAR
  ====================== */
  const abrirModalEditar = (cliente) => {
    if (!cliente.ativo) return;

    setFormEditar(cliente);
    setErrosEditar({});
    setModalEditarAberto(true);
  };

  const salvarEdicao = async () => {
    try {
      await api.patch(`/clientes/${formEditar.id}`, {
        nome_completo: formEditar.nome_completo,
        email: formEditar.email,
        cpf_cnpj: formEditar.cpf_cnpj,
        observacao: formEditar.observacao,
      });

      setMensagem("Cliente atualizado com sucesso!");
      setModalEditarAberto(false);
      carregarClientes();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao atualizar cliente");
    }
  };

  /* ======================
     INATIVAR / REATIVAR
  ====================== */
  const confirmarInativacao = async () => {
    try {
      await api.patch(`/clientes/${clienteSelecionado.id}/inativar`);
      setModalInativarAberto(false);
      setClienteSelecionado(null);
      carregarClientes();
    } catch {
      setErro("Erro ao inativar cliente");
    }
  };

  const confirmarReativacao = async () => {
    try {
      await api.patch(`/clientes/${clienteSelecionado.id}/reativar`);
      setModalReativarAberto(false);
      setClienteSelecionado(null);
      carregarClientes();
    } catch {
      setErro("Erro ao reativar cliente");
    }
  };

  /* ======================
     PAGINAÇÃO
  ====================== */
  const totalPaginas = Math.ceil(clientes.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const clientesPaginados = clientes.slice(inicio, inicio + ITENS_POR_PAGINA);

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="usuarios-container">
      <h1>Clientes</h1>

      <div className="topo-acoes">
        <button
          className="btn-adicionar"
          onClick={() => setModalCriarAberto(true)}
        >
          + Adicionar Cliente
        </button>
      </div>

      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      <table className="usuarios-tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Documento</th>
            <th>Observação</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {clientesPaginados.map((c) => (
            <tr key={c.id}>
              <td>{c.nome_completo}</td>
              <td>{c.email}</td>
              <td>{formatDoc(c.cpf_cnpj)}</td>
              <td>{c.observacao || "-"}</td>
              <td>
                <span className={c.ativo ? "status-ativo" : "status-inativo"}>
                  {c.ativo ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="acoes">
                <button
                  className="btn-icon editar"
                  disabled={!c.ativo}
                  onClick={() => abrirModalEditar(c)}
                >
                  <FiEdit />
                </button>

                {c.ativo ? (
                  <button
                    className="btn-icon excluir"
                    onClick={() => {
                      setClienteSelecionado(c);
                      setModalInativarAberto(true);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                ) : (
                  <button
                    className="btn-icon reativar"
                    onClick={() => {
                      setClienteSelecionado(c);
                      setModalReativarAberto(true);
                    }}
                  >
                    <FiRotateCcw />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAIS seguem o MESMO padrão de Usuários */}
      {/* Se quiser, no próximo passo eu te mando os modais completos */}
    </div>
  );
}

export default Clientes;
