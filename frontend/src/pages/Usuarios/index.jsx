import { useEffect, useState } from "react";
import api from "../../services/api";
import "./usuarios.css";
import { FiEdit, FiTrash2, FiRotateCcw, FiEye, FiEyeOff } from "react-icons/fi";

const ITENS_POR_PAGINA = 10;

function Usuarios() {
  /* ======================
     STATES GERAIS
  ====================== */
  const [usuarios, setUsuarios] = useState([]);
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

  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  /* ======================
     FORMULÁRIOS
  ====================== */
  const formCriarInicial = {
    nome_completo: "",
    email: "",
    cpf: "",
    senha: "",
  };

  const [formCriar, setFormCriar] = useState(formCriarInicial);

  const [formEditar, setFormEditar] = useState({
    id: "",
    nome_completo: "",
    email: "",
    cpf: "",
    ativo: true,
    criado_em: "",
  });

  const [errosCriar, setErrosCriar] = useState({});
  const [errosEditar, setErrosEditar] = useState({});

  /* ======================
     API
  ====================== */
  const carregarUsuarios = async () => {
    try {
      const res = await api.get("/usuarios");
      setUsuarios(res.data);
    } catch {
      setErro("Erro ao carregar usuários");
    }
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  /* ======================
     UTIL / VALIDAÇÕES
  ====================== */
  const unformatCpf = (value = "") => value.replace(/\D/g, "").slice(0, 11);

  const formatCpf = (value = "") => {
    const d = value.replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.replace(/(\d{3})(\d+)/, "$1.$2");
    if (d.length <= 9) return d.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const isValidCPF = (cpf) => {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += cpf[i] * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += cpf[i] * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPassword = (senha) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(senha);

  /* ======================
     CRIAR
  ====================== */
  const validarCriar = () => {
    const erros = {};

    if (!formCriar.nome_completo) erros.nome_completo = "Nome obrigatório";

    if (!formCriar.email) erros.email = "Email obrigatório";
    else if (!isValidEmail(formCriar.email)) erros.email = "Email inválido";

    if (!formCriar.cpf) erros.cpf = "CPF obrigatório";
    else if (!isValidCPF(formCriar.cpf)) erros.cpf = "CPF inválido";

    if (!formCriar.senha) erros.senha = "Senha obrigatória";
    else if (!isValidPassword(formCriar.senha))
      erros.senha = "Mín. 8 caracteres, letras, números e especial";

    setErrosCriar(erros);
    return Object.keys(erros).length === 0;
  };

  const salvarCriacao = async () => {
    if (!validarCriar()) return;

    try {
      await api.post("/usuarios", formCriar);
      setMensagem("Usuário criado com sucesso!");
      setErro("");
      setModalCriarAberto(false);
      setFormCriar(formCriarInicial);
      setErrosCriar({});
      carregarUsuarios();
    } catch (error) {
      setErro(error?.response?.data?.erro || "Erro ao criar usuário");
    }
  };

  /* ======================
     EDITAR
  ====================== */
  const abrirModalEditar = (usuario) => {
    if (!usuario.ativo) return;

    setFormEditar({
      id: usuario.id,
      nome_completo: usuario.nome_completo,
      email: usuario.email,
      cpf: usuario.cpf,
      ativo: usuario.ativo,
      criado_em: usuario.criado_em,
    });

    setErrosEditar({});
    setModalEditarAberto(true);
  };

  const validarEditar = () => {
    const erros = {};

    if (!formEditar.nome_completo) erros.nome_completo = "Nome obrigatório";

    if (!formEditar.email) erros.email = "Email obrigatório";
    else if (!isValidEmail(formEditar.email)) erros.email = "Email inválido";

    if (!isValidCPF(formEditar.cpf)) erros.cpf = "CPF inválido";

    setErrosEditar(erros);
    return Object.keys(erros).length === 0;
  };

  const salvarEdicao = async () => {
    if (!validarEditar()) return;

    try {
      await api.patch(`/usuarios/${formEditar.id}`, {
        nome_completo: formEditar.nome_completo,
        email: formEditar.email,
        cpf: formEditar.cpf,
      });

      setMensagem("Usuário atualizado com sucesso!");
      setModalEditarAberto(false);
      carregarUsuarios();
    } catch {
      setErro("Erro ao atualizar usuário");
    }
  };

  /* ======================
     INATIVAR / REATIVAR
  ====================== */
  const confirmarInativacao = async () => {
    try {
      await api.delete(`/usuarios/${usuarioSelecionado.id}`);
      setModalInativarAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      setErro("Erro ao inativar usuário");
    }
  };

  const confirmarReativacao = async () => {
    try {
      await api.patch(`/usuarios/${usuarioSelecionado.id}/reativar`);
      setModalReativarAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      setErro("Erro ao reativar usuário");
    }
  };

  /* ======================
     PAGINAÇÃO
  ====================== */
  const totalPaginas = Math.ceil(usuarios.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const usuariosPaginados = usuarios.slice(inicio, inicio + ITENS_POR_PAGINA);

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="usuarios-container">
      <h1>Usuários</h1>

      <div className="topo-acoes">
        <button
          className="btn-adicionar"
          onClick={() => {
            setFormCriar(formCriarInicial);
            setErrosCriar({});
            setModalCriarAberto(true);
          }}
        >
          + Adicionar Usuário
        </button>
      </div>

      {mensagem && <p className="mensagem-sucesso">{mensagem}</p>}
      {erro && <p className="mensagem-erro">{erro}</p>}

      {/* ===== TABELA ===== */}
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
          {usuariosPaginados.map((u) => (
            <tr key={u.id}>
              <td>{u.nome_completo}</td>
              <td>{u.email}</td>
              <td>{formatCpf(u.cpf)}</td>
              <td>
                <span className={u.ativo ? "status-ativo" : "status-inativo"}>
                  {u.ativo ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="acoes">
                <button
                  className="btn-icon editar"
                  disabled={!u.ativo}
                  onClick={() => abrirModalEditar(u)}
                >
                  <FiEdit />
                </button>

                {u.ativo ? (
                  <button
                    className="btn-icon excluir"
                    onClick={() => {
                      setUsuarioSelecionado(u);
                      setModalInativarAberto(true);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                ) : (
                  <button
                    className="btn-icon reativar"
                    onClick={() => {
                      setUsuarioSelecionado(u);
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

      {/* ===== MODAL CRIAR ===== */}
      {modalCriarAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Adicionar Usuário</h2>

            <div className="form">
              <input
                className={errosCriar.nome_completo ? "input-erro" : ""}
                placeholder="Nome completo"
                value={formCriar.nome_completo}
                onChange={(e) =>
                  setFormCriar({
                    ...formCriar,
                    nome_completo: e.target.value,
                  })
                }
              />
              {errosCriar.nome_completo && (
                <small className="erro-campo">{errosCriar.nome_completo}</small>
              )}

              <input
                className={errosCriar.email ? "input-erro" : ""}
                placeholder="Email"
                value={formCriar.email}
                onChange={(e) =>
                  setFormCriar({
                    ...formCriar,
                    email: e.target.value,
                  })
                }
              />
              {errosCriar.email && (
                <small className="erro-campo">{errosCriar.email}</small>
              )}

              <input
                className={errosCriar.cpf ? "input-erro" : ""}
                placeholder="CPF"
                value={formatCpf(formCriar.cpf)}
                onChange={(e) =>
                  setFormCriar({
                    ...formCriar,
                    cpf: unformatCpf(e.target.value),
                  })
                }
              />
              {errosCriar.cpf && (
                <small className="erro-campo">{errosCriar.cpf}</small>
              )}

              <div
                className={`campo-senha ${
                  errosCriar.senha ? "input-erro" : ""
                }`}
              >
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Senha"
                  value={formCriar.senha}
                  onChange={(e) =>
                    setFormCriar({
                      ...formCriar,
                      senha: e.target.value,
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errosCriar.senha && (
                <small className="erro-campo">{errosCriar.senha}</small>
              )}
            </div>

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalCriarAberto(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={salvarCriacao}>
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL EDITAR ===== */}
      {modalEditarAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Editar Usuário</h2>

            <div className="form">
              <input value={formEditar.id} disabled />

              <input
                className={errosEditar.nome_completo ? "input-erro" : ""}
                value={formEditar.nome_completo}
                onChange={(e) =>
                  setFormEditar({
                    ...formEditar,
                    nome_completo: e.target.value,
                  })
                }
              />
              {errosEditar.nome_completo && (
                <small className="erro-campo">
                  {errosEditar.nome_completo}
                </small>
              )}

              <input
                className={errosEditar.email ? "input-erro" : ""}
                value={formEditar.email}
                onChange={(e) =>
                  setFormEditar({
                    ...formEditar,
                    email: e.target.value,
                  })
                }
              />
              {errosEditar.email && (
                <small className="erro-campo">{errosEditar.email}</small>
              )}

              <input
                className={errosEditar.cpf ? "input-erro" : ""}
                value={formatCpf(formEditar.cpf)}
                onChange={(e) =>
                  setFormEditar({
                    ...formEditar,
                    cpf: unformatCpf(e.target.value),
                  })
                }
              />
              {errosEditar.cpf && (
                <small className="erro-campo">{errosEditar.cpf}</small>
              )}

              <input value={formEditar.ativo ? "Ativo" : "Inativo"} disabled />
              <input value={formEditar.criado_em} disabled />
            </div>

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalEditarAberto(false)}
              >
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={salvarEdicao}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INATIVAR */}
      {modalInativarAberto && (
        <div className="modal-overlay">
          <div className="modal modal-confirmacao">
            <h2>Confirmar inativação</h2>
            <p>
              Deseja realmente inativar{" "}
              <strong>{usuarioSelecionado?.nome_completo}</strong>?
            </p>

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalInativarAberto(false)}
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
              Deseja reativar{" "}
              <strong>{usuarioSelecionado?.nome_completo}</strong>?
            </p>

            <div className="acoes-modal">
              <button
                className="btn-cancelar"
                onClick={() => setModalReativarAberto(false)}
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
