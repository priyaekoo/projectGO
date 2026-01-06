import { useEffect, useState } from "react";
import api from "../../services/api";

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  const carregarPacientes = async () => {
    const response = await api.get("/pacientes");
    setPacientes(response.data);
  };

  const criarPacientes = async () => {
    await api.post("/pacientes", {
      nome_completo: nome,
      email,
    });
    carregarPacientes();
  };

  const excluirPacientes = async (id) => {
    await api.delete(`/usuarios/${id}`);
    carregarPacientes();
  };

  useEffect(() => {
    const carregarPacientes = async () => {
      const response = await api.get("/usuarios");
      setPacientes(response.data);
    };

    carregarPacientes();
  }, []);

  return (
    <div>
      <h2>Pacientes</h2>

      <input placeholder="Nome" onChange={(e) => setNome(e.target.value)} />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <button onClick={criarPacientes}>Salvar</button>

      <ul>
        {pacientes.map((u) => (
          <li key={u.id}>
            {u.nome_completo} - {u.email}
            <button onClick={() => excluirPacientes(u.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Pacientes;
