const express = require("express");
const cors = require("cors");

const app = express();

// 🔓 libera CORS
app.use(cors());

// middlewares
app.use(express.json());

// =====================
// ROTAS DE AUTENTICAÇÃO
// =====================
app.use("/auth", require("./routes/auth.routes"));

// =====================
// ROTAS PRINCIPAIS
// =====================
app.use("/usuarios", require("./routes/usuarios.routes"));
app.use("/clientes", require("./routes/clientes.routes"));
app.use("/pacientes", require("./routes/pacientes.routes"));
app.use("/especialidades", require("./routes/especialidades"));
app.use("/profissionais", require("./routes/profissionais"));

// =====================
// UPLOAD
// =====================
app.use("/api", require("./routes/upload.routes"));

// =====================
// CONTAS A RECEBER
// =====================
app.use("/contas-receber", require("./routes/contasReceber.routes"));

// =====================
// DEPÓSITOS (ENTRADA DE SALDO)
// =====================
app.use("/depositos", require("./routes/depositos.routes"));

// contas a pagar
app.use("/contas-pagar", require("./routes/contasPagar.routes"));

// =====================
// ROTA DE TESTE DO BANCO
// =====================
app.get("/db-test", async (req, res) => {
  const pool = require("./config/database");
  const result = await pool.query("SELECT NOW()");
  res.json(result.rows[0]);
});

module.exports = app;
