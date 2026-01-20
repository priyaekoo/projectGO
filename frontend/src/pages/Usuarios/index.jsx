import { useEffect, useState } from "react";
import api from "../../services/api";
import "./usuarios.css";
import { FiEdit, FiTrash2 } from "react-icons/fi";

const ITENS_POR_PAGINA = 10;

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  const [tipoFiltro, setTipoFiltro] = useState("");
  const [valorFiltro, setValorFiltro] = useState("");

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

  function handleTipoFiltroChange(e) {
    setTipoFiltro(e.target.value);
    setValorFiltro("");
    setPaginaAtual(1);
  }

  function handleValorFiltroChange(e) {
    setValorFiltro(
      tipoFiltro === "cpf" ? unformatCpf(e.target.value) : e.target.value,
    );
    setPaginaAtual(1);
  }

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    cpf: "",
    senha: "",
  });

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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "cpf" ? unformatCpf(value) : value,
    });
  }

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

  const excluirUsuario = async (id) => {
    if (!window.confirm("Deseja inativar este usuário?")) return;

    try {
      await api.delete(`/usuarios/${id}`);
      carregarUsuarios();
    } catch {
      setErro("Erro ao inativar usuário.");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!tipoFiltro) return true;
    const valor = valorFiltro.toLowerCase();

    if (tipoFiltro === "nome")
      return u.nome_completo?.toLowerCase().includes(valor);

    if (tipoFiltro === "email") return u.email?.toLowerCase().includes(valor);

    if (tipoFiltro === "cpf")
      return u.cpf?.replace(/\D/g, "").includes(valorFiltro);

    return true;
  });

  const totalPaginas = Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const usuariosPaginados = usuariosFiltrados.slice(
    inicio,
    inicio + ITENS_POR_PAGINA,
  );

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Usuários</h1>
        <button className="btn-adicionar" onClick={() => setModalAberto(true)}>
          + Adicionar usuário
        </button>
      </div>

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
              }}
            >
              Limpar
            </button>
          </>
        )}
      </div>

      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

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
                <td data-label="Nome">{usuario.nome_completo}</td>
                <td data-label="Email">{usuario.email}</td>
                <td data-label="CPF">{formatCpf(usuario.cpf)}</td>
                <td data-label="Status">
                  <span
                    className={
                      usuario.ativo ? "status-ativo" : "status-inativo"
                    }
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="acoes" data-label="Ações">
                  <button
                    className="btn-icon editar"
                    title="Editar usuário"
                    onClick={() => console.log("Editar", usuario.id)}
                  >
                    <FiEdit size={18} />
                  </button>

                  <button
                    className="btn-icon excluir"
                    title="Inativar usuário"
                    onClick={() => excluirUsuario(usuario.id)}
                  >
                    <FiTrash2 size={18} />
                  </button>
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

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Usuário</h2>
            <form onSubmit={handleSubmit} className="form">
              <input
                name="nome_completo"
                placeholder="Nome completo"
                value={form.nome_completo}
                onChange={handleChange}
                required
              />
              <input
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                name="cpf"
                placeholder="CPF"
                value={formatCpf(form.cpf)}
                onChange={handleChange}
                required
              />
              <input
                name="senha"
                type="password"
                placeholder="Senha"
                value={form.senha}
                onChange={handleChange}
                required
              />
              <div className="acoes">
                <button type="button" onClick={() => setModalAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-adicionar">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
