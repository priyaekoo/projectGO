const pool = require("../config/database");
const bcrypt = require("bcryptjs");

exports.criar = async (req, res) => {
  const { nome_completo, email, cpf, senha } = req.body;

  try {
    const senhaHash = bcrypt.hashSync(senha, 10);

    const result = await pool.query(
      `
      INSERT INTO usuarios (nome_completo, email, cpf, senha)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nome_completo, email, cpf
      `,
      [nome_completo, email, cpf, senhaHash]
    );

    return res.status(201).json(result.rows[0]);
  } catch (erro) {
    // 👉 CPF ou EMAIL duplicado
    if (erro.code === "23505") {
      return res.status(400).json({
        erro: "CPF ou e-mail já cadastrado",
      });
    }

    // 👉 Qualquer outro erro
    return res.status(500).json({
      erro: "Erro interno no servidor",
    });
  }
};

exports.consultar = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nome_completo, email, cpf FROM usuarios"
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
