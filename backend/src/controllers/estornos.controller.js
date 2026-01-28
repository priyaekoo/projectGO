const pool = require("../config/database");

/**
 * Estornar uma movimentacao
 */
exports.estornar = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Buscar a movimentacao original
    const movResult = await client.query(
      `SELECT * FROM movimentacoes WHERE id = $1`,
      [id]
    );

    if (movResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Movimentacao nao encontrada" });
    }

    const mov = movResult.rows[0];

    if (mov.estornado) {
      await client.query("ROLLBACK");
      return res.status(400).json({ erro: "Movimentacao ja foi estornada" });
    }

    // 2. Marcar movimentacao original como estornada
    await client.query(
      `UPDATE movimentacoes SET estornado = true WHERE id = $1`,
      [id]
    );

    // 3. Criar movimentacao de estorno (tipo inverso)
    const tipoEstorno = mov.tipo === "ENTRADA" ? "SAIDA" : "ENTRADA";

    await client.query(
      `
      INSERT INTO movimentacoes
        (id_cliente, id_fornecedor, tipo, valor, origem, id_origem, id_movimentacao_origem, descricao)
      VALUES ($1, $2, $3, $4, 'ESTORNO', $5, $6, $7)
      `,
      [
        mov.id_cliente,
        mov.id_fornecedor,
        tipoEstorno,
        mov.valor,
        mov.id_origem,
        mov.id,
        `Estorno: ${mov.descricao || mov.origem}`,
      ]
    );

    await client.query("COMMIT");

    return res.json({
      mensagem: "Movimentacao estornada com sucesso",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({
      erro: "Erro ao estornar movimentacao",
      detalhe: error.message,
    });
  } finally {
    client.release();
  }
};
