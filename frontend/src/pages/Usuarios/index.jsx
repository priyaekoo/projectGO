import { useEffect, useState } from "react";
import api from "../../services/api";
import "./usuarios.css";
import { FiEdit, FiTrash2, FiRotateCcw } from "react-icons/fi";

const ITENS_POR_PAGINA = 10;

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // 🔹 Modais
  const [modalInativarAberto, setModalInativarAberto] = useState(false);
  const [modalReativarAberto, setModalReativarAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  // 🔹 Filtro
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [valorFiltro, setValorFiltro] = useState("");

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    cpf: "",
    senha: "",
  });

  /* ======================
     UTILIDADES
  ====================== */
  function formatCpf(value) {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
    if (digits.length <= 9)
      return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
      d ? `${a}.${b}.${c}-${d}` : `${a}.${b}.${c}`,
    );
  }

  function unformatCpf(value) {
    return value ? String(value).replace(/\D/g, "") : "";
  }

  /* ======================
     API
  ====================== */
  const carregarUsuarios = async () => {
    try {
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch {
      setErro("Erro ao carregar usuários.");
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await api.post("/usuarios", form);
      setMensagem("Usuário cadastrado com sucesso!");
      setModalAberto(false);
      setForm({ nome_completo: "", email: "", cpf: "", senha: "" });
      carregarUsuarios();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao cadastrar usuário.");
    }
  }

  const confirmarInativacao = async () => {
    if (!usuarioSelecionado) return;

    try {
      await api.delete(`/usuarios/${usuarioSelecionado.id}`);
      setModalInativarAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      setErro("Erro ao inativar usuário.");
    }
  };

  const confirmarReativacao = async () => {
    if (!usuarioSelecionado) return;

    try {
      await api.patch(`/usuarios/${usuarioSelecionado.id}/reativar`);
      setModalReativarAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      setErro("Erro ao reativar usuário.");
    }
  };

  /* ======================
     FILTRO
  ====================== */
  const handleTipoFiltroChange = (e) => {
    setTipoFiltro(e.target.value);
    setValorFiltro("");
    setPaginaAtual(1);
  };

  const handleValorFiltroChange = (e) => {
    const value =
      tipoFiltro === "cpf" ? unformatCpf(e.target.value) : e.target.value;

    setValorFiltro(value);
    setPaginaAtual(1);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!tipoFiltro || !valorFiltro) return true;

    const valor = valorFiltro.toLowerCase();

    if (tipoFiltro === "nome") {
      return u.nome_completo?.toLowerCase().includes(valor);
    }

    if (tipoFiltro === "email") {
      return u.email?.toLowerCase().includes(valor);
    }

    if (tipoFiltro === "cpf") {
      return u.cpf?.replace(/\D/g, "").includes(valorFiltro);
    }

    return true;
  });

  /* ======================
     PAGINAÇÃO
  ====================== */
  const totalPaginas = Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA);

  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;

  const usuariosPaginados = usuariosFiltrados.slice(
    inicio,
    inicio + ITENS_POR_PAGINA,
  );

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Usuários</h1>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          + Adicionar usuário
        </button>
      </div>

      {/* FILTROS */}
      <div className="usuarios-filtros">
        <select value={tipoFiltro} onChange={handleTipoFiltroChange}>
          <option value="">Selecione o filtro</option>
          <option value="nome">Nome</option>
          <option value="email">E-mail</option>
          <option value="cpf">CPF</option>
        </select>

        {tipoFiltro && (
          <>
            <input
              placeholder={
                tipoFiltro === "cpf"
                  ? "Digite o CPF"
                  : tipoFiltro === "email"
                    ? "Digite o e-mail"
                    : "Digite o nome"
              }
              value={
                tipoFiltro === "cpf" ? formatCpf(valorFiltro) : valorFiltro
              }
              onChange={handleValorFiltroChange}
            />
            <button
              className="btn-limpar"
              onClick={() => {
                setTipoFiltro("");
                setValorFiltro("");
                setPaginaAtual(1);
              }}
            >
              Limpar
            </button>
          </>
        )}
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}

      <table className="usuarios-tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>CPF</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {usuariosPaginados.length === 0 ? (
            <tr>
              <td colSpan="5">Nenhum usuário encontrado</td>
            </tr>
          ) : (
            usuariosPaginados.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nome_completo}</td>
                <td>{usuario.email}</td>
                <td>{formatCpf(usuario.cpf)}</td>
                <td>
                  <span
                    className={
                      usuario.ativo ? "status-ativo" : "status-inativo"
                    }
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="acoes">
                  <button className="btn-icon editar" title="Editar">
                    <FiEdit size={18} />
                  </button>

                  {usuario.ativo && (
                    <button
                      className="btn-icon excluir"
                      title="Inativar"
                      onClick={() => {
                        setUsuarioSelecionado(usuario);
                        setModalInativarAberto(true);
                      }}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}

                  {!usuario.ativo && (
                    <button
                      className="btn-icon reativar"
                      title="Reativar"
                      onClick={() => {
                        setUsuarioSelecionado(usuario);
                        setModalReativarAberto(true);
                      }}
                    >
                      <FiRotateCcw size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPaginas > 1 && (
        <div className="paginacao">
          {Array.from({ length: totalPaginas }).map((_, i) => (
            <button
              key={i}
              className={paginaAtual === i + 1 ? "ativo" : ""}
              onClick={() => setPaginaAtual(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* MODAL INATIVAR */}
      {modalInativarAberto && (
        <div className="modal-overlay">
          <div className="modal modal-confirmacao">
            <h2>Confirmar inativação</h2>
            <p>
              Deseja realmente inativar o usuário{" "}
              <strong>{usuarioSelecionado?.nome_completo}</strong>?
            </p>

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => {
                  setModalInativarAberto(false);
                  setUsuarioSelecionado(null);
                }}
              >
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={confirmarInativacao}>
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REATIVAR */}
      {modalReativarAberto && (
        <div className="modal-overlay">
          <div className="modal modal-confirmacao">
            <h2>Confirmar reativação</h2>
            <p>
              Deseja realmente reativar o usuário{" "}
              <strong>{usuarioSelecionado?.nome_completo}</strong>?
            </p>

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => {
                  setModalReativarAberto(false);
                  setUsuarioSelecionado(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar reativar"
                onClick={confirmarReativacao}
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
