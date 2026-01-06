const pool = require("../config/database");

exports.criar = async (req, res) => {
  const { nome_completo, cpf, email, observacao } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO pacientes (nome_completo, cpf, email, observacao)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [nome_completo, cpf, email, observacao]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ erro: "CPF já cadastrado" });
    }

    return res.status(500).json({ erro: "Erro interno ao cadastrar paciente" });
  }
};

exports.consultar = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM pacientes");
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
