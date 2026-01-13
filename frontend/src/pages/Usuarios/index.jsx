import { useEffect, useState } from "react";
import api from "../../services/api";
import "./usuarios.css";

const ITENS_POR_PAGINA = 10;

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // filtro por seletor (tipo + valor)
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [valorFiltro, setValorFiltro] = useState("");

  function formatCpf(value) {
    if (!value) return "";
    const digits = String(value).replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, "$1.$2");
    if (digits.length <= 9)
      return digits.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
    return digits.replace(
      /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
      function (_, a, b, c, d) {
        return d ? `${a}.${b}.${c}-${d}` : `${a}.${b}.${c}`;
      }
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
    if (tipoFiltro === "cpf") {
      const digits = unformatCpf(e.target.value);
      setValorFiltro(digits);
    } else {
      setValorFiltro(e.target.value);
    }

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

    if (name === "cpf") {
      // armazena apenas dígitos
      setForm({
        ...form,
        cpf: unformatCpf(value),
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
  }

  function isValidCPFFront(value) {
    if (!value) return false;
    const digits = String(value).replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcCheckDigit = (arr) => {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += Number(arr[i]) * (arr.length + 1 - i);
      }
      const mod = (sum * 10) % 11;
      return mod === 10 ? 0 : mod;
    };

    const numbers = digits.split("");
    const dv1 = calcCheckDigit(numbers.slice(0, 9));
    const dv2 = calcCheckDigit(numbers.slice(0, 9).concat(String(dv1)));

    return dv1 === Number(numbers[9]) && dv2 === Number(numbers[10]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // limpar mensagens anteriores
    setErro("");
    setMensagem("");

    // validação client-side de CPF
    if (!isValidCPFFront(form.cpf)) {
      setErro("CPF inválido");
      return;
    }

    try {
      await api.post("/usuarios", form);
      setMensagem("Usuário cadastrado com sucesso!");
      setErro("");
      setModalAberto(false);
      setForm({
        nome_completo: "",
        email: "",
        cpf: "",
        senha: "",
      });
      carregarUsuarios();
    } catch (error) {
      const msg = error?.response?.data?.erro || "Erro ao cadastrar usuário.";
      setErro(msg);
      setMensagem("");
    }
  }

  const excluirUsuario = async (id) => {
    if (!window.confirm("Deseja excluir este usuário?")) return;

    try {
      await api.delete(`/usuarios/${id}`);
      setMensagem("Usuário excluído com sucesso!");
      setErro("");
      carregarUsuarios();
    } catch {
      setErro("Erro ao excluir usuário.");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    if (!tipoFiltro) return true;

    const valor = (valorFiltro || "").toString().trim().toLowerCase();

    if (tipoFiltro === "nome") {
      return (
        !valor ||
        (u.nome_completo && u.nome_completo.toLowerCase().includes(valor))
      );
    }

    if (tipoFiltro === "email") {
      return !valor || (u.email && u.email.toLowerCase().includes(valor));
    }

    if (tipoFiltro === "cpf") {
      const cpfUser = (u.cpf || "").replace(/\D/g, "");
      return !valor || cpfUser.includes((valor || "").replace(/\D/g, ""));
    }

    return true;
  });

  const totalPaginas = Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const usuariosPaginados = usuariosFiltrados.slice(
    inicio,
    inicio + ITENS_POR_PAGINA
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
        <select
          name="tipoFiltro"
          value={tipoFiltro}
          onChange={handleTipoFiltroChange}
        >
          <option value="">Selecione o filtro</option>
          <option value="nome">Nome</option>
          <option value="email">E-mail</option>
          <option value="cpf">CPF</option>
        </select>

        {tipoFiltro && (
          <>
            <input
              type="text"
              name="valorFiltro"
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
              type="button"
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
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {usuariosPaginados.length === 0 ? (
            <tr>
              <td colSpan="4">Nenhum usuário encontrado</td>
            </tr>
          ) : (
            usuariosPaginados.map((usuario) => (
              <tr key={usuario.id}>
                <td data-label="Nome">{usuario.nome_completo}</td>
                <td data-label="Email">{usuario.email}</td>
                <td data-label="CPF">{formatCpf(usuario.cpf)}</td>
                <td className="acoes" data-label="Ações">
                  <button className="btn-acao editar">Editar</button>
                  <button
                    className="btn-acao excluir"
                    onClick={() => excluirUsuario(usuario.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPaginas > 1 && (
        <div className="paginacao">
          {Array.from({ length: totalPaginas }).map((_, index) => (
            <button
              key={index}
              className={paginaAtual === index + 1 ? "ativo" : ""}
              onClick={() => setPaginaAtual(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Novo Usuário</h2>

            <form onSubmit={handleSubmit} className="form">
              <input
                type="text"
                name="nome_completo"
                placeholder="Nome completo"
                value={form.nome_completo}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="cpf"
                placeholder="CPF"
                value={formatCpf(form.cpf)}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="senha"
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
