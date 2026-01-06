const express = require("express");
const pool = require("../config/database");
const bcrypt = require("bcryptjs");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [
    email,
  ]);

  const user = result.rows[0];

  if (!user || !bcrypt.compareSync(senha, user.senha)) {
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }

  res.json({ mensagem: "Login realizado com sucesso" });
});

module.exports = router;
