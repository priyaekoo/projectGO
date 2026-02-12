const pool = require("../config/database");

/**
 * Consultar taxa por valor
 */
const calcularTaxa = (valor) => {
  if (valor <= 10000) return 0;
  if (valor <= 50000) return 0.5;
  if (valor <= 100000) return 0.3;
  return 0.1; // acima de 100k
};

exports.consultarTaxa = async (req, res) => {
  const { valor } = req.query;
  const valorNum = Number(valor);

  if (!valor || valorNum <= 0) {
    return res.status(400).json({ erro: "Valor invalido" });
  }

  const taxa = calcularTaxa(valorNum);
  const valorTaxa = valorNum * (taxa / 100);

  return res.json({
    valor: valorNum,
    taxa_percentual: taxa,
    valor_taxa: valorTaxa,
    valor_total: valorNum + valorTaxa,
  });
};

/**
 * Transferencia de alto valor (com taxa)
 */
exports.transferirAltoValor = async (req, res) => {
  const { id_cliente_origem, id_cliente_destino, valor, descricao } = req.body;

  if (!id_cliente_origem || !id_cliente_destino || !valor) {
    return res.status(400).json({
      erro: "Cliente origem, destino e valor sao obrigatorios",
    });
  }

  const valorNumerico = Number(valor);
  if (valorNumerico <= 0) {
    return res.status(400).json({ erro: "Valor deve ser maior que zero" });
  }

  const taxa = calcularTaxa(valorNumerico);
  const valorTaxa = valorNumerico * (taxa / 100);
  const valorComTaxa = valorNumerico + valorTaxa;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar saldo
    const saldoResult = await client.query(
      `SELECT
        cl.id, cl.nome_completo,
        cl.saldo_inicial +
        COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor WHEN m.tipo = 'SAIDA' THEN -m.valor END), 0) AS saldo_atual
      FROM clientes cl
      LEFT JOIN movimentacoes m ON m.id_cliente = cl.id AND m.estornado = false
      WHERE cl.id = $1
      GROUP BY cl.id`,
      [id_cliente_origem]
    );

    if (saldoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Cliente origem nao encontrado" });
    }

    const saldoAtual = Number(saldoResult.rows[0].saldo_atual);

    if (saldoAtual < valorComTaxa) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erro: "Saldo insuficiente (valor + taxa)",
        saldo_atual: saldoAtual,
        valor_transferencia: valorNumerico,
        taxa: valorTaxa,
        valor_total_necessario: valorComTaxa,
      });
    }

    // Cliente destino
    const destino = await client.query(
      "SELECT id, nome_completo FROM clientes WHERE id = $1",
      [id_cliente_destino]
    );

    if (destino.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Cliente destino nao encontrado" });
    }

    const nomeOrigem = saldoResult.rows[0].nome_completo;
    const nomeDestino = destino.rows[0].nome_completo;

    // Saida da origem (valor + taxa)
    await client.query(
      `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
       VALUES ($1, 'SAIDA', $2, 'TRANSFERENCIA_ALTO_VALOR', $3)`,
      [id_cliente_origem, valorComTaxa, descricao || `Transferencia alto valor para ${nomeDestino} (taxa: R$${valorTaxa.toFixed(2)})`]
    );

    // Entrada no destino (somente valor, sem taxa)
    await client.query(
      `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
       VALUES ($1, 'ENTRADA', $2, 'TRANSFERENCIA_ALTO_VALOR', $3)`,
      [id_cliente_destino, valorNumerico, descricao || `Transferencia alto valor de ${nomeOrigem}`]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_log (acao, tabela_alvo, dados_novos)
       VALUES ('TRANSFERENCIA_ALTO_VALOR', 'movimentacoes', $1)`,
      [JSON.stringify({ id_cliente_origem, id_cliente_destino, valor: valorNumerico, taxa: valorTaxa })]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      mensagem: "Transferencia de alto valor realizada",
      valor: valorNumerico,
      taxa_percentual: taxa,
      valor_taxa: valorTaxa,
      valor_total_debitado: valorComTaxa,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ erro: "Erro ao realizar transferencia", detalhe: error.message });
  } finally {
    client.release();
  }
};

/**
 * Transferencias em lote
 */
exports.transferirLote = async (req, res) => {
  const { transferencias } = req.body;

  if (!transferencias || !Array.isArray(transferencias) || transferencias.length === 0) {
    return res.status(400).json({ erro: "Lista de transferencias vazia ou invalida" });
  }

  if (transferencias.length > 50) {
    return res.status(400).json({ erro: "Maximo de 50 transferencias por lote" });
  }

  const client = await pool.connect();
  const resultados = [];

  try {
    await client.query("BEGIN");

    for (let i = 0; i < transferencias.length; i++) {
      const t = transferencias[i];

      if (!t.id_cliente_origem || !t.id_cliente_destino || !t.valor) {
        resultados.push({
          indice: i,
          status: "ERRO",
          erro: "Campos obrigatorios faltando",
        });
        continue;
      }

      const valorNum = Number(t.valor);
      if (valorNum <= 0) {
        resultados.push({ indice: i, status: "ERRO", erro: "Valor invalido" });
        continue;
      }

      // Verificar saldo
      const saldoResult = await client.query(
        `SELECT
          cl.id, cl.nome_completo,
          cl.saldo_inicial +
          COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor WHEN m.tipo = 'SAIDA' THEN -m.valor END), 0) AS saldo_atual
        FROM clientes cl
        LEFT JOIN movimentacoes m ON m.id_cliente = cl.id AND m.estornado = false
        WHERE cl.id = $1
        GROUP BY cl.id`,
        [t.id_cliente_origem]
      );

      if (saldoResult.rowCount === 0) {
        resultados.push({ indice: i, status: "ERRO", erro: "Cliente origem nao encontrado" });
        continue;
      }

      const saldo = Number(saldoResult.rows[0].saldo_atual);
      if (saldo < valorNum) {
        resultados.push({
          indice: i,
          status: "ERRO",
          erro: "Saldo insuficiente",
          saldo_atual: saldo,
        });
        continue;
      }

      // Destino
      const destino = await client.query(
        "SELECT id, nome_completo FROM clientes WHERE id = $1",
        [t.id_cliente_destino]
      );

      if (destino.rowCount === 0) {
        resultados.push({ indice: i, status: "ERRO", erro: "Cliente destino nao encontrado" });
        continue;
      }

      // Executar
      await client.query(
        `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
         VALUES ($1, 'SAIDA', $2, 'TRANSFERENCIA_LOTE', $3)`,
        [t.id_cliente_origem, valorNum, t.descricao || `Lote: transferencia para ${destino.rows[0].nome_completo}`]
      );

      await client.query(
        `INSERT INTO movimentacoes (id_cliente, tipo, valor, origem, descricao)
         VALUES ($1, 'ENTRADA', $2, 'TRANSFERENCIA_LOTE', $3)`,
        [t.id_cliente_destino, valorNum, t.descricao || `Lote: transferencia de ${saldoResult.rows[0].nome_completo}`]
      );

      resultados.push({ indice: i, status: "OK", valor: valorNum });
    }

    await client.query("COMMIT");

    const totalOk = resultados.filter((r) => r.status === "OK").length;
    const totalErro = resultados.filter((r) => r.status === "ERRO").length;

    return res.status(201).json({
      mensagem: `Lote processado: ${totalOk} sucesso, ${totalErro} erros`,
      total: transferencias.length,
      sucesso: totalOk,
      erros: totalErro,
      resultados,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ erro: "Erro ao processar lote", detalhe: error.message });
  } finally {
    client.release();
  }
};

/**
 * Listar transacoes avancadas
 */
exports.listarTransacoesAvancadas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        m.id_cliente,
        c.nome_completo AS nome_cliente,
        m.tipo,
        m.valor,
        m.origem,
        m.descricao,
        m.data_movimentacao,
        m.estornado
      FROM movimentacoes m
      JOIN clientes c ON c.id = m.id_cliente
      WHERE m.origem IN ('TRANSFERENCIA_ALTO_VALOR', 'TRANSFERENCIA_LOTE')
      ORDER BY m.data_movimentacao DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar transacoes avancadas" });
  }
};
