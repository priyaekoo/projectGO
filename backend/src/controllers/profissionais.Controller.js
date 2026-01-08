const pool = require("../config/database");

/**
 * Criar profissional
 */
exports.criar = async (req, res) => {
  const { nome_completo, cpf, registro_profissional, id_especialidade } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO profissionais
       (nome_completo, cpf, registro_profissional, id_especialidade)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome_completo, cpf, id_especialidade`,
      [nome_completo, cpf, registro_profissional, id_especialidade]
    );

    return res.status(201).json(result.rows[0]);
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
 * Listar profissionais
 */
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

    return res.json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: "Erro ao listar profissionais",
      detalhe: error.message,
    });
  }
};
