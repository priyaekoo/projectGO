const pool = require("../config/database");

/**
 * Listar clientes PEP
 */
exports.listarClientesPEP = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome_completo, email, cpf_cnpj, pep, nivel_risco, ativo
      FROM clientes
      WHERE pep = true
      ORDER BY nome_completo
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar clientes PEP" });
  }
};

/**
 * Marcar/Desmarcar cliente como PEP
 */
exports.marcarClientePEP = async (req, res) => {
  const { id } = req.params;
  const { pep, nivel_risco } = req.body;

  try {
    // Buscar dados anteriores para audit log
    const anterior = await pool.query(
      "SELECT pep, nivel_risco FROM clientes WHERE id = $1",
      [id]
    );

    if (anterior.rowCount === 0) {
      return res.status(404).json({ erro: "Cliente nao encontrado" });
    }

    const result = await pool.query(
      `UPDATE clientes
       SET pep = $1, nivel_risco = $2
       WHERE id = $3
       RETURNING id, nome_completo, pep, nivel_risco`,
      [pep, nivel_risco || 'BAIXO', id]
    );

    // Registrar no audit log
    await pool.query(
      `INSERT INTO audit_log (id_usuario, acao, tabela_alvo, id_registro, dados_anteriores, dados_novos)
       VALUES ($1, 'ALTERACAO_PEP', 'clientes', $2, $3, $4)`,
      [
        req.body.id_usuario,
        id,
        JSON.stringify(anterior.rows[0]),
        JSON.stringify({ pep, nivel_risco })
      ]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao atualizar status PEP" });
  }
};

/**
 * Criar investigacao AML
 */
exports.criarInvestigacao = async (req, res) => {
  const { id_cliente, id_analista, motivo, nivel_risco } = req.body;

  if (!id_cliente || !motivo) {
    return res.status(400).json({ erro: "Cliente e motivo sao obrigatorios" });
  }

  try {
    // Verificar se cliente existe
    const cliente = await pool.query(
      "SELECT id, nome_completo, pep FROM clientes WHERE id = $1",
      [id_cliente]
    );

    if (cliente.rowCount === 0) {
      return res.status(404).json({ erro: "Cliente nao encontrado" });
    }

    const result = await pool.query(
      `INSERT INTO investigacoes_aml (id_cliente, id_analista, motivo, nivel_risco)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_cliente, id_analista, motivo, nivel_risco || 'MEDIO']
    );

    // Auto-marcar como PEP se nivel CRITICO
    if (nivel_risco === 'CRITICO') {
      await pool.query(
        "UPDATE clientes SET pep = true, nivel_risco = 'CRITICO' WHERE id = $1",
        [id_cliente]
      );
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_log (id_usuario, acao, tabela_alvo, id_registro, dados_novos)
       VALUES ($1, 'CRIAR_INVESTIGACAO', 'investigacoes_aml', $2, $3)`,
      [id_analista, result.rows[0].id, JSON.stringify({ id_cliente, motivo, nivel_risco })]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao criar investigacao" });
  }
};

/**
 * Listar investigacoes
 */
exports.listarInvestigacoes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.*,
        c.nome_completo AS nome_cliente,
        c.cpf_cnpj,
        u.nome_completo AS nome_analista
      FROM investigacoes_aml i
      JOIN clientes c ON c.id = i.id_cliente
      LEFT JOIN usuarios u ON u.id = i.id_analista
      ORDER BY i.data_abertura DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao listar investigacoes" });
  }
};

/**
 * Consultar investigacao por ID
 */
exports.consultarInvestigacao = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        i.*,
        c.nome_completo AS nome_cliente,
        c.cpf_cnpj,
        c.pep,
        u.nome_completo AS nome_analista
      FROM investigacoes_aml i
      JOIN clientes c ON c.id = i.id_cliente
      LEFT JOIN usuarios u ON u.id = i.id_analista
      WHERE i.id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Investigacao nao encontrada" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao consultar investigacao" });
  }
};

/**
 * Atualizar investigacao (status, conclusao)
 */
exports.atualizarInvestigacao = async (req, res) => {
  const { id } = req.params;
  const { status, conclusao, nivel_risco } = req.body;

  try {
    const anterior = await pool.query(
      "SELECT * FROM investigacoes_aml WHERE id = $1",
      [id]
    );

    if (anterior.rowCount === 0) {
      return res.status(404).json({ erro: "Investigacao nao encontrada" });
    }

    let query;
    let params;

    if (status === 'FECHADA') {
      query = `UPDATE investigacoes_aml
               SET status = $1, conclusao = $2, nivel_risco = $3, data_fechamento = NOW()
               WHERE id = $4
               RETURNING *`;
      params = [status, conclusao, nivel_risco || anterior.rows[0].nivel_risco, id];
    } else {
      query = `UPDATE investigacoes_aml
               SET status = $1, conclusao = $2, nivel_risco = $3
               WHERE id = $4
               RETURNING *`;
      params = [status, conclusao, nivel_risco || anterior.rows[0].nivel_risco, id];
    }

    const result = await pool.query(query, params);

    // Audit log
    await pool.query(
      `INSERT INTO audit_log (id_usuario, acao, tabela_alvo, id_registro, dados_anteriores, dados_novos)
       VALUES ($1, 'ATUALIZAR_INVESTIGACAO', 'investigacoes_aml', $2, $3, $4)`,
      [
        req.body.id_analista || anterior.rows[0].id_analista,
        id,
        JSON.stringify(anterior.rows[0]),
        JSON.stringify(result.rows[0])
      ]
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao atualizar investigacao" });
  }
};

/**
 * Listar audit log
 */
exports.auditLog = async (req, res) => {
  try {
    const { tabela, acao, limit } = req.query;

    let query = `
      SELECT
        a.*,
        u.nome_completo AS nome_usuario
      FROM audit_log a
      LEFT JOIN usuarios u ON u.id = a.id_usuario
      WHERE 1=1
    `;
    const params = [];

    if (tabela) {
      params.push(tabela);
      query += ` AND a.tabela_alvo = $${params.length}`;
    }

    if (acao) {
      params.push(acao);
      query += ` AND a.acao = $${params.length}`;
    }

    query += ` ORDER BY a.data_hora DESC`;

    if (limit) {
      params.push(parseInt(limit));
      query += ` LIMIT $${params.length}`;
    } else {
      query += ` LIMIT 100`;
    }

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao consultar audit log" });
  }
};
