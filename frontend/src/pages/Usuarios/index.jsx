import { useEffect, useState } from "react";
import api from "../../services/api";
import "./usuarios.css";

const ITENS_POR_PAGINA = 10;

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const carregarUsuarios = async () => {
    try {
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    } catch (error) {
      setErro("Erro ao carregar usuários.");
    }
  };

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

  const totalPaginas = Math.ceil(usuarios.length / ITENS_POR_PAGINA);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const usuariosPaginados = usuarios.slice(inicio, inicio + ITENS_POR_PAGINA);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1>Usuários</h1>
        <button className="btn-adicionar">+ Adicionar usuário</button>
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
                <td>{usuario.nome_completo}</td>
                <td>{usuario.email}</td>
                <td>{usuario.cpf}</td>
                <td className="acoes">
                  <button className="btn-acao ver">Ver</button>
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
    </div>
  );
}

export default Usuarios;
