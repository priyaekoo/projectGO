const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { usuario, senha } = req.body;

  const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
    usuario,
  ]);

  try {
    const result = await pool.query(
      `SELECT id, nome_completo, email, cpf, senha
       FROM usuarios
       WHERE email = $1 OR cpf = $1`,
      [usuario]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }

    const user = result.rows[0];

    const senhaValida = bcrypt.compareSync(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha inválida" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nome: user.nome_completo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      usuario: {
        id: user.id,
        nome: user.nome_completo,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ erro: error.message });
  }
};
