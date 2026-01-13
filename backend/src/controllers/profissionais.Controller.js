const pool = require("../config/database");
const { isValidCPF } = require("../utils/validators");

/**
 * Criar profissional
 */
exports.criar = async (req, res) => {
  const { nome_completo, cpf, registro_profissional, id_especialidade } =
    req.body;

  // validar CPF
  if (!isValidCPF(cpf)) {
    return res.status(400).json({ erro: "CPF inválido" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO profissionais
       (nome_completo, cpf, registro_profissional, id_especialidade)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome_completo, cpf, id_especialidade`,
      [nome_completo, cpf, registro_profissional, id_especialidade]
    );

    return res.status(201).json({
      mensagem: "Profissional criado com sucesso",
      profissional: result.rows[0],
    });
  } catch (error) {
    console.error("ERRO:", error);

    if (error.code === "23505") {
      return res.status(400).json({ erro: "CPF já cadastrado" });
    }

    if (error.code === "23503") {
      return res.status(400).json({ erro: "Especialidade inválida" });
    }

    return res.status(500).json({
      erro: "Erro ao cadastrar profissional",
      detalhe: error.message,
    });
  }
};

/**
 * Atualizar profissional
 */
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { nome_completo, registro_profissional, id_especialidade } = req.body;

  try {
    const result = await pool.query(
      `UPDATE profissionais
       SET nome_completo = $1,
           registro_profissional = $2,
           id_especialidade = $3
       WHERE id = $4
         AND ativo = true
       RETURNING id, nome_completo, registro_profissional, id_especialidade`,
      [nome_completo, registro_profissional, id_especialidade, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Profissional não encontrado",
      });
    }

    return res.status(200).json({
      mensagem: "Profissional atualizado com sucesso",
      profissional: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao atualizar profissional",
      detalhe: error.message,
    });
  }
};

/**
 * Inativar profissional (delete lógico)
 */
exports.deletar = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE profissionais
       SET ativo = false
       WHERE id = $1
         AND ativo = true
       RETURNING id, nome_completo`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        erro: "Profissional não encontrado ou já inativo",
      });
    }

    return res.status(200).json({
      mensagem: "Profissional inativado com sucesso",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      erro: "Erro ao inativar profissional",
      detalhe: error.message,
    });
  }
};

/**
 * Listar profissionais com especialidade
 */
exports.consultar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.id,
         p.nome_completo,
         p.cpf,
         p.registro_profissional,
         e.nome AS especialidade
       FROM profissionais p
       JOIN especialidades e ON p.id_especialidade = e.id
       WHERE p.ativo = true
         AND e.ativo = true
       ORDER BY p.nome_completo`
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao listar profissionais",
      detalhe: error.message,
    });
  }
};
