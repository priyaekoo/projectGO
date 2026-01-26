const pool = require("../config/database");

/**
 * Listar depósitos (LOG)
 */
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id,
        c.nome_completo,
        m.valor,
        m.data_movimentacao
      FROM movimentacoes m
      JOIN clientes c ON c.id = m.id_cliente
      WHERE m.tipo = 'ENTRADA'
        AND m.origem = 'DEPOSITO'
      ORDER BY m.data_movimentacao DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao carregar depósitos",
      detalhe: error.message,
    });
  }
};

/**
 * Criar depósito
 */
exports.criar = async (req, res) => {
  const { id_cliente, valor, descricao } = req.body;

  if (!id_cliente || !valor) {
    return res.status(400).json({
      erro: "Cliente e valor são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO movimentacoes
      (id_cliente, tipo, valor, origem, descricao)
      VALUES ($1, 'ENTRADA', $2, 'DEPOSITO', $3)
      RETURNING *
      `,
      [id_cliente, valor, descricao || "Depósito manual"],
    );

    return res.status(201).json({
      mensagem: "Depósito realizado com sucesso",
      deposito: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao realizar depósito",
      detalhe: error.message,
    });
  }
};
