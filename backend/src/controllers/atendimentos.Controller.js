const pool = require("../config/database");

/**
 * Criar atendimento
 */
exports.criar = async (req, res) => {
  const { id_paciente, id_profissional, data_atendimento, observacoes } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO atendimentos
       (id_paciente, id_profissional, data_atendimento, observacoes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id_paciente, id_profissional, data_atendimento, observacoes]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ erro: "Paciente ou profissional inválido" });
    }

    return res.status(500).json({ erro: "Erro ao criar atendimento" });
  }
};
