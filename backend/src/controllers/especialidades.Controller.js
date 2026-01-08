const pool = require("../config/database");

/**
 * Criar especialidade
 */
exports.criar = async (req, res) => {
  const { nome, descricao } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO especialidades (nome, descricao)
       VALUES ($1, $2)
       RETURNING id, nome, descricao`,
      [nome, descricao]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ erro: "Especialidade já cadastrada" });
    }

    return res.status(500).json({ erro: "Erro ao cadastrar especialidade" });
  }
};

/**
 * Listar especialidades ativas
 */
exports.consultar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, descricao
       FROM especialidades
       WHERE ativo = true`
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

/**
 * Atualizar especialidade
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  try {
    const result = await pool.query(
      `UPDATE especialidades
       SET nome = $1, descricao = $2
       WHERE id = $3 AND ativo = true
       RETURNING id, nome, descricao`,
      [nome, descricao, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Especialidade não encontrada" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};

/**
 * Inativar especialidade
 */
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE especialidades
       SET ativo = false
       WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Especialidade não encontrada" });
    }

    return res.json({ mensagem: "Especialidade inativada com sucesso" });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
