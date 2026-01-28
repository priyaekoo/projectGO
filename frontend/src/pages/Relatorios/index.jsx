import { useEffect, useState } from "react";
import api from "../../services/api";
import "./relatorios.css";

function Relatorios() {
  const [resumo, setResumo] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [resResumo, resMov] = await Promise.all([
        api.get("/relatorios/resumo"),
        api.get("/relatorios/movimentacoes-recentes"),
      ]);
      setResumo(resResumo.data);
      setMovimentacoes(resMov.data);
      setErro("");
    } catch {
      setErro("Erro ao carregar relatorios");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatarValor = (valor) => {
    return `R$ ${Number(valor).toFixed(2)}`;
  };

  if (carregando) {
    return (
      <div className="relatorios-container">
        <h1>Relatorios</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="relatorios-container">
      <h1>Relatorios</h1>

      {erro && <p className="mensagem-erro">{erro}</p>}

      {resumo && (
        <>
          {/* CARDS DE RESUMO */}
          <div className="cards-grid">
            <div className="card card-azul">
              <h3>Clientes</h3>
              <p className="card-numero">{resumo.clientes.total}</p>
              <p className="card-detalhe">
                Saldo total: {formatarValor(resumo.clientes.saldo_total)}
              </p>
            </div>

            <div className="card card-verde">
              <h3>Fornecedores</h3>
              <p className="card-numero">{resumo.fornecedores.total}</p>
              <p className="card-detalhe">
                Saldo total: {formatarValor(resumo.fornecedores.saldo_total)}
              </p>
            </div>

            <div className="card card-amarelo">
              <h3>Contas a Pagar</h3>
              <p className="card-numero">{resumo.contas_pagar.quantidade}</p>
              <p className="card-detalhe">
                Total: {formatarValor(resumo.contas_pagar.valor_total)}
              </p>
            </div>

            <div className="card card-roxo">
              <h3>Contas a Receber</h3>
              <p className="card-numero">{resumo.contas_receber.quantidade}</p>
              <p className="card-detalhe">
                Total: {formatarValor(resumo.contas_receber.valor_total)}
              </p>
            </div>
          </div>

          {/* MOVIMENTACOES */}
          <div className="movimentacoes-box">
            <div className="movimentacoes-header">
              <h2>Movimentacoes</h2>
              <div className="movimentacoes-totais">
                <span className="total-item">
                  Depositos: <strong>{formatarValor(resumo.movimentacoes.depositos)}</strong>
                </span>
                <span className="total-item">
                  Pagamentos: <strong>{formatarValor(resumo.movimentacoes.pagamentos)}</strong>
                </span>
                <span className="total-item">
                  Transferencias: <strong>{formatarValor(resumo.movimentacoes.transferencias)}</strong>
                </span>
              </div>
            </div>

            <h3>Ultimas 20 movimentacoes</h3>

            <table className="movimentacoes-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Origem</th>
                  <th>Cliente/Fornecedor</th>
                  <th>Descricao</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((m) => (
                  <tr key={m.id} style={{ opacity: m.estornado ? 0.5 : 1 }}>
                    <td>{formatarData(m.data_movimentacao)}</td>
                    <td>
                      <span className={m.tipo === "ENTRADA" ? "tipo-entrada" : "tipo-saida"}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>{m.origem}</td>
                    <td>{m.nome_cliente || m.nome_fornecedor || "-"}</td>
                    <td>
                      {m.descricao}
                      {m.estornado && " (ESTORNADO)"}
                    </td>
                    <td>{formatarValor(m.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Relatorios;
