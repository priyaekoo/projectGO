const pool = require("../config/database");

/**
 * Realizar transferencia entre clientes
 */
exports.transferir = async (req, res) => {
  const { id_cliente_origem, id_cliente_destino, valor, descricao } = req.body;

  if (!id_cliente_origem || !id_cliente_destino || !valor) {
    return res.status(400).json({
      erro: "Cliente origem, cliente destino e valor sao obrigatorios",
    });
  }

  if (id_cliente_origem === id_cliente_destino) {
    return res.status(400).json({
      erro: "Cliente origem e destino devem ser diferentes",
    });
  }

  const valorNumerico = Number(valor);
  if (valorNumerico <= 0) {
    return res.status(400).json({ erro: "Valor deve ser maior que zero" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verificar saldo do cliente origem
    const saldoResult = await client.query(
      `
      SELECT
        cl.id,
        cl.nome_completo,
        cl.saldo_inicial +
        COALESCE(SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.valor WHEN m.tipo = 'SAIDA' THEN -m.valor END), 0) AS saldo_atual
      FROM clientes cl
      LEFT JOIN movimentacoes m ON m.id_cliente = cl.id AND m.estornado = false
      WHERE cl.id = $1
      GROUP BY cl.id
      `,
      [id_cliente_origem]
    );

    if (saldoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Cliente origem nao encontrado" });
    }

    const saldoAtual = Number(saldoResult.rows[0].saldo_atual);

    if (saldoAtual < valorNumerico) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        erro: "Saldo insuficiente",
        saldo_atual: saldoAtual,
        valor_transferencia: valorNumerico,
      });
    }

    // 2. Verificar se cliente destino existe
    const destinoResult = await client.query(
      "SELECT id, nome_completo FROM clientes WHERE id = $1",
      [id_cliente_destino]
    );

    if (destinoResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Cliente destino nao encontrado" });
    }

    const nomeOrigem = saldoResult.rows[0].nome_completo;
    const nomeDestino = destinoResult.rows[0].nome_completo;

    // 3. Criar movimentacao de SAIDA para o cliente origem
    const saidaResult = await client.query(
      `
      INSERT INTO movimentacoes
        (id_cliente, tipo, valor, origem, descricao)
      VALUES ($1, 'SAIDA', $2, 'TRANSFERENCIA', $3)
      RETURNING id
      `,
      [
        id_cliente_origem,
        valorNumerico,
        descricao || `Transferencia para ${nomeDestino}`,
      ]
    );

    // 4. Criar movimentacao de ENTRADA para o cliente destino
    const entradaResult = await client.query(
      `
      INSERT INTO movimentacoes
        (id_cliente, tipo, valor, origem, descricao)
      VALUES ($1, 'ENTRADA', $2, 'TRANSFERENCIA', $3)
      RETURNING id
      `,
      [
        id_cliente_destino,
        valorNumerico,
        descricao || `Transferencia de ${nomeOrigem}`,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      mensagem: "Transferencia realizada com sucesso",
      id_movimentacao_saida: saidaResult.rows[0].id,
      id_movimentacao_entrada: entradaResult.rows[0].id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      erro: "Erro ao realizar transferencia",
      detalhe: error.message,
    });
  } finally {
    client.release();
  }
};

/**
 * Listar transferencias
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        m.id,
        m.id_cliente,
        c.nome_completo AS nome_cliente,
        m.tipo,
        m.valor,
        m.descricao,
        m.data_movimentacao,
        m.estornado
      FROM movimentacoes m
      JOIN clientes c ON c.id = m.id_cliente
      WHERE m.origem = 'TRANSFERENCIA'
      ORDER BY m.data_movimentacao DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar transferencias",
    });
  }
};
