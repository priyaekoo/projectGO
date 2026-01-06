import { useEffect, useState } from "react";
import api from "../../services/api";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const carregarUsuarios = async () => {
    const response = await api.get("/usuarios");
    setUsuarios(response.data);
  };

  const criarUsuario = async () => {
    // 🔎 validação básica no front
    if (!nome || !email || !cpf || !senha) {
      setErro("Todos os campos são obrigatórios.");
      setMensagem("");
      return;
    }

    try {
      console.log("Enviando para API...");
      const response = await api.post("/usuarios", {
        nome_completo: nome,
        email,
        cpf,
        senha,
      });

      console.log("Resposta da API:", response.data);

      setMensagem("Usuário cadastrado com sucesso!");
      setErro("");

      // limpa campos
      setNome("");
      setEmail("");
      setCpf("");
      setSenha("");

      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao cadastrar:", error);

      setErro(
        error.response?.data?.erro ||
          "Erro ao cadastrar usuário. Verifique os dados."
      );
      setMensagem("");
    }
  };

  const excluirUsuario = async (id) => {
    await api.delete(`/usuarios/${id}`);
    carregarUsuarios();
  };

  useEffect(() => {
    const carregarUsuarios = async () => {
      const response = await api.get("/usuarios");
      setUsuarios(response.data);
    };

    carregarUsuarios();
  }, []);

  return (
    <div>
      <h2>Usuários</h2>

      {mensagem && <p style={{ color: "green" }}>{mensagem}</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}

      <input
        placeholder="Nome completo"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="CPF"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <button onClick={criarUsuario}>Salvar</button>

      <ul>
        {usuarios.map((u) => (
          <li key={u.id}>
            {u.nome_completo} - {u.email}
            <button onClick={() => excluirUsuario(u.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Usuarios;
