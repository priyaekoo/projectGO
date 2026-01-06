const pool = require("../config/database");

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const result = await pool.query(
      "SELECT id, nome_completo, email FROM usuarios WHERE email = $1 AND senha = $2",
      [email, senha]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    res.status(200).json({
      mensagem: "Login realizado com sucesso",
      usuario: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
