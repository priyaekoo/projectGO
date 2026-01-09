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

    return res.status(201).json({
      mensagem: "Especialidade criada com sucesso",
      especialidade: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        erro: "Especialidade já cadastrada",
      });
    }

    return res.status(500).json({
      erro: "Erro ao cadastrar especialidade",
      detalhe: error.message,
    });
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

    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar especialidades",
      detalhe: error.message,
    });
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
       SET nome = $1,
           descricao = $2
       WHERE id = $3
         AND ativo = true
       RETURNING id, nome, descricao`,
      [nome, descricao, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Especialidade não encontrada",
      });
    }

    return res.status(200).json({
      mensagem: "Especialidade atualizada com sucesso",
      especialidade: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao atualizar especialidade",
      detalhe: error.message,
    });
  }
};

/**
 * Inativar especialidade (delete lógico)
 */
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE especialidades
       SET ativo = false
       WHERE id = $1
         AND ativo = true`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Especialidade não encontrada ou já inativa",
      });
    }

    return res.status(200).json({
      mensagem: "Especialidade inativada com sucesso",
    });
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao inativar especialidade",
      detalhe: error.message,
    });
  }
};
